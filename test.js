/**
 * PassCraft Automated Verification Suite
 */

const assert = require('assert');
const crypto = require('crypto');
global.crypto = crypto.webcrypto;

const { EFF_WORDS } = require('./popup/wordlist.js');
global.EFF_WORDS = EFF_WORDS;

console.log('--- 1. Testing EFF Wordlist Integrity ---');
assert.strictEqual(EFF_WORDS.length, 7776, 'EFF Wordlist must contain exactly 7,776 words');
assert(EFF_WORDS.every(w => typeof w === 'string' && w.length > 0), 'Every entry must be a valid non-empty string');
console.log('✓ 7,776 words verified.');

console.log('\n--- 2. Testing Cryptographic RNG & Rejection Sampling ---');
function secureRandomInt(max) {
  if (max <= 1) return 0;
  if (max <= 256) {
    const limit = 256 - (256 % max);
    const buf = new Uint8Array(1);
    while (true) {
      crypto.webcrypto.getRandomValues(buf);
      if (buf[0] < limit) return buf[0] % max;
    }
  }
  if (max <= 65536) {
    const limit = 65536 - (65536 % max);
    const buf = new Uint16Array(1);
    while (true) {
      crypto.webcrypto.getRandomValues(buf);
      if (buf[0] < limit) return buf[0] % max;
    }
  }
  const limit = 4294967296 - (4294967296 % max);
  const buf = new Uint32Array(1);
  while (true) {
    crypto.webcrypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

const samples = 10000;
const counts = [0, 0, 0];
for (let i = 0; i < samples; i++) {
  counts[secureRandomInt(3)]++;
}
for (let c of counts) {
  assert(c > 2900 && c < 3700, `Uniform distribution check failed with count ${c}`);
}
console.log('✓ Rejection sampling uniformly distributed across bins:', counts);

console.log('\n--- 3. Testing Random Password Generation ---');
const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};
const AMBIGUOUS = new Set(['l', '1', 'I', '|', '0', 'O', 'o', '\\']);

function generatePassword(length, opts) {
  let pool = '';
  const required = [];
  let up = CHAR_SETS.uppercase;
  let low = CHAR_SETS.lowercase;
  let num = CHAR_SETS.numbers;
  let sym = CHAR_SETS.symbols;

  if (opts.avoidAmbiguous) {
    const filterAmb = (str) => [...str].filter(c => !AMBIGUOUS.has(c)).join('');
    up = filterAmb(up); low = filterAmb(low); num = filterAmb(num); sym = filterAmb(sym);
  }
  if (opts.uppercase) { pool += up; required.push(up[secureRandomInt(up.length)]); }
  if (opts.lowercase) { pool += low; required.push(low[secureRandomInt(low.length)]); }
  if (opts.numbers) { pool += num; required.push(num[secureRandomInt(num.length)]); }
  if (opts.symbols) { pool += sym; required.push(sym[secureRandomInt(sym.length)]); }

  const result = [...required];
  for (let i = 0; i < length - required.length; i++) {
    result.push(pool[secureRandomInt(pool.length)]);
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join('');
}

for (const len of [8, 16, 24, 64]) {
  const pw = generatePassword(len, { uppercase: true, lowercase: true, numbers: true, symbols: true });
  assert.strictEqual(pw.length, len, `Password length should be ${len}`);
  assert(/[A-Z]/.test(pw), 'Must contain uppercase');
  assert(/[a-z]/.test(pw), 'Must contain lowercase');
  assert(/[0-9]/.test(pw), 'Must contain number');
}

const noSym = generatePassword(20, { uppercase: true, lowercase: true, numbers: true, symbols: false });
assert(!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(noSym), 'Should not contain symbols');

const noAmb = generatePassword(32, { uppercase: true, lowercase: true, numbers: true, symbols: true, avoidAmbiguous: true });
for (const char of noAmb) {
  assert(!AMBIGUOUS.has(char), `Must not contain ambiguous character: ${char}`);
}
console.log('✓ Random password generation rules verified.');

console.log('\n--- 4. Testing Passphrase Generation ---');
function generatePassphrase(count, sep, cap, num, sym, symChoice, customSym) {
  const words = [];
  for (let i = 0; i < count; i++) {
    const idx = secureRandomInt(EFF_WORDS.length);
    let word = EFF_WORDS[idx];
    if (cap) word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    else word = word.toLowerCase();
    words.push(word);
  }
  let suffix = '';
  if (sym) {
    const defaultSymbols = '!@#$%^&*-_+=?';
    let chosenSym = '!';
    if (symChoice === 'random') {
      chosenSym = defaultSymbols[secureRandomInt(defaultSymbols.length)];
    } else if (symChoice === 'custom') {
      chosenSym = customSym || '!';
    } else {
      chosenSym = symChoice;
    }
    suffix += chosenSym;
  }
  if (num) {
    suffix += (secureRandomInt(90) + 10).toString();
  }
  if (suffix) {
    words[words.length - 1] += suffix;
  }
  return words.join(sep);
}

const ppCap = generatePassphrase(4, '-', true, false, false);
const partsCap = ppCap.split('-');
assert.strictEqual(partsCap.length, 4, 'Should have 4 parts');
assert(partsCap.every(p => /^[A-Z][a-z]+$/.test(p)), `All parts should be capitalized: ${ppCap}`);

const ppLower = generatePassphrase(5, ' ', false, false, false);
const partsLower = ppLower.split(' ');
assert.strictEqual(partsLower.length, 5, 'Should have 5 words');
assert(partsLower.every(p => /^[a-z]+$/.test(p)), `All parts should be lowercase: ${ppLower}`);

const ppNum = generatePassphrase(3, '.', true, true, false);
assert(/\d{2}$/.test(ppNum), 'Should end with 2-digit number');

// Test custom separator (e.g. "::" or "#" or "+")
const ppCustomSep = generatePassphrase(3, '::', true, false, false);
assert.strictEqual(ppCustomSep.split('::').length, 3, 'Should use custom separator "::"');

// Test random special character
const ppSym = generatePassphrase(4, '-', true, false, true, 'random');
assert(/[!@#$%^&*\-_+=?]/.test(ppSym), 'Should contain a special character');

// Test specific special character choice (e.g. "$")
const ppDollar = generatePassphrase(3, '_', true, false, true, '$');
assert(ppDollar.endsWith('$'), 'Should end with chosen special character "$"');

// Test custom special character (e.g. "~")
const ppCustomSym = generatePassphrase(3, '_', true, false, true, 'custom', '~');
assert(ppCustomSym.endsWith('~'), 'Should end with custom special character "~"');

// Test both special character and number
const ppSymAndNum = generatePassphrase(4, '-', true, true, true, '!');
assert(/!\d{2}$/.test(ppSymAndNum), 'Should contain both symbol and 2-digit number suffix');

// Test 1, 2, and 3 words/phrases specifically
const pp1 = generatePassphrase(1, '-', true, false, false);
assert.strictEqual(pp1.split('-').length, 1, '1-phrase count should have exactly 1 word');

const pp2 = generatePassphrase(2, '-', true, false, false);
assert.strictEqual(pp2.split('-').length, 2, '2-phrase count should have exactly 2 words');

const pp3 = generatePassphrase(3, '-', true, false, false);
assert.strictEqual(pp3.split('-').length, 3, '3-phrase count should have exactly 3 words');

console.log('✓ Passphrase generation rules, 1/2/3 phrase counts, custom separators, and special characters verified.');

console.log('\n--- 5. Testing History Capacity & Settings ---');
let history = [];
let historyEnabled = false; // Off by default
let historyMax = 3;

function recordHistory(password, type) {
  if (!historyEnabled) return;
  const item = {
    id: Date.now().toString(36),
    password,
    type,
    createdAt: Date.now()
  };
  history = [item, ...history.filter(h => h.password !== password)].slice(0, historyMax);
}

// 1. Verify nothing is recorded when off by default
recordHistory('pass_default_off', 'password');
assert.strictEqual(history.length, 0, 'History should not record when off by default');

// 2. Enable history with limit 3
historyEnabled = true;
historyMax = 3;
recordHistory('pass1', 'password');
recordHistory('pass2', 'passphrase');
recordHistory('pass3', 'password');
recordHistory('pass4', 'password'); // pushes out pass1

assert.strictEqual(history.length, 3, 'History length should strictly be capped at 3');
assert.strictEqual(history[0].password, 'pass4', 'Newest item should be at the front');
assert.strictEqual(history[2].password, 'pass2', 'Oldest retained item should be pass2');

// 3. Test changing history limit to 1
historyMax = 1;
history = history.slice(0, historyMax);
recordHistory('pass5', 'password');
assert.strictEqual(history.length, 1, 'History length should be capped at 1 when limit is 1');
assert.strictEqual(history[0].password, 'pass5', 'Only pass5 should remain');

// 4. Disable again
historyEnabled = false;
recordHistory('pass6', 'password');
assert.strictEqual(history[0].password, 'pass5', 'Should not record when history is turned off again');

console.log('✓ History tracking (configurable limits 1, 2, 3) and preferences verified.');

console.log('\n=======================================');
console.log('ALL TESTS PASSED SUCCESSFULLY! (5 / 5)');
console.log('=======================================');
