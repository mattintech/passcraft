/**
 * PassCraft - Offline Password & Passphrase Generator
 * Cryptographically secure, zero telemetry, cross-browser MV3.
 */

// Storage helper with fallback for testing outside extension context
const storage = {
  async get(keys) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
    }
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      return browser.storage.local.get(keys);
    }
    const result = {};
    const keyList = Array.isArray(keys) ? keys : [keys];
    for (const k of keyList) {
      const val = localStorage.getItem('passcraft_' + k);
      if (val !== null) {
        try { result[k] = JSON.parse(val); } catch { result[k] = val; }
      }
    }
    return result;
  },
  async set(items) {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      return new Promise((resolve) => chrome.storage.local.set(items, resolve));
    }
    if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
      return browser.storage.local.set(items);
    }
    for (const [k, v] of Object.entries(items)) {
      localStorage.setItem('passcraft_' + k, JSON.stringify(v));
    }
  }
};

// Cryptographic RNG helpers avoiding modulo bias via rejection sampling
function secureRandomInt(max) {
  if (max <= 1) return 0;
  if (max <= 256) {
    const limit = 256 - (256 % max);
    const buf = new Uint8Array(1);
    while (true) {
      crypto.getRandomValues(buf);
      if (buf[0] < limit) return buf[0] % max;
    }
  }
  if (max <= 65536) {
    const limit = 65536 - (65536 % max);
    const buf = new Uint16Array(1);
    while (true) {
      crypto.getRandomValues(buf);
      if (buf[0] < limit) return buf[0] % max;
    }
  }
  const limit = 4294967296 - (4294967296 % max);
  const buf = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % max;
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Character Sets
const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

const AMBIGUOUS_CHARS = new Set(['l', '1', 'I', '|', '0', 'O', 'o', '\\']);

// App State
let state = {
  mode: 'password', // 'password' | 'passphrase'
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  avoidAmbiguous: false,
  excludeChars: '',
  wordCount: 4,
  separator: '-',
  customSeparator: '',
  capitalize: true,
  passphraseNumber: false,
  passphraseSymbol: false,
  passphraseSymbolChoice: 'random',
  customSymbol: '',
  historyEnabled: false, // OFF by default for privacy
  historyMax: 3,
  autoCopy: false,
  clearClipboardSec: 0,
  history: [],
  currentPassword: ''
};

// DOM Elements
const el = {
  tabPassword: document.getElementById('tab-password'),
  tabPassphrase: document.getElementById('tab-passphrase'),
  optionsPassword: document.getElementById('options-password'),
  optionsPassphrase: document.getElementById('options-passphrase'),
  passwordOutput: document.getElementById('password-output'),
  copyBtn: document.getElementById('copy-btn'),
  copyBtnText: document.getElementById('copy-btn-text'),
  regenerateBtn: document.getElementById('regenerate-btn'),
  regenerateIcon: document.getElementById('regenerate-icon'),
  qrBtn: document.getElementById('qr-btn'),
  qrModal: document.getElementById('qr-modal'),
  qrCloseBtn: document.getElementById('qr-close-btn'),
  qrDisplay: document.getElementById('qr-display'),
  strengthBar: document.getElementById('strength-bar'),
  strengthLabel: document.getElementById('strength-label'),
  entropyLabel: document.getElementById('entropy-label'),
  lengthSlider: document.getElementById('length-slider'),
  lengthInput: document.getElementById('length-input'),
  optUppercase: document.getElementById('opt-uppercase'),
  optLowercase: document.getElementById('opt-lowercase'),
  optNumbers: document.getElementById('opt-numbers'),
  optSymbols: document.getElementById('opt-symbols'),
  optAvoidAmbiguous: document.getElementById('opt-avoid-ambiguous'),
  optExcludeChars: document.getElementById('opt-exclude-chars'),
  wordsSlider: document.getElementById('words-slider'),
  wordsInput: document.getElementById('words-input'),
  passphraseSeparator: document.getElementById('passphrase-separator'),
  customSeparatorInput: document.getElementById('custom-separator-input'),
  optCapitalize: document.getElementById('opt-capitalize'),
  optPassphraseNumber: document.getElementById('opt-passphrase-number'),
  optPassphraseSymbol: document.getElementById('opt-passphrase-symbol'),
  passphraseSymbolConfig: document.getElementById('passphrase-symbol-config'),
  passphraseSymbolChoice: document.getElementById('passphrase-symbol-choice'),
  customSymbolInput: document.getElementById('custom-symbol-input'),
  settingsToggleBtn: document.getElementById('settings-toggle-btn'),
  settingsCloseBtn: document.getElementById('settings-close-btn'),
  settingsPanel: document.getElementById('settings-panel'),
  settingHistoryEnabled: document.getElementById('setting-history-enabled'),
  settingHistoryMax: document.getElementById('setting-history-max'),
  settingClearClipboard: document.getElementById('setting-clear-clipboard'),
  settingAutoCopy: document.getElementById('setting-auto-copy'),
  historyList: document.getElementById('history-list'),
  historyBadge: document.getElementById('history-badge'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toast-message')
};

// Password Generation
function generatePassword() {
  let pool = '';
  const required = [];

  let up = CHAR_SETS.uppercase;
  let low = CHAR_SETS.lowercase;
  let num = CHAR_SETS.numbers;
  let sym = CHAR_SETS.symbols;

  if (state.avoidAmbiguous) {
    const filterAmb = (str) => [...str].filter(c => !AMBIGUOUS_CHARS.has(c)).join('');
    up = filterAmb(up);
    low = filterAmb(low);
    num = filterAmb(num);
    sym = filterAmb(sym);
  }

  if (state.excludeChars && state.excludeChars.length > 0) {
    const excludeSet = new Set([...state.excludeChars]);
    const filterEx = (str) => [...str].filter(c => !excludeSet.has(c)).join('');
    up = filterEx(up);
    low = filterEx(low);
    num = filterEx(num);
    sym = filterEx(sym);
  }

  if (state.uppercase && up.length > 0) {
    pool += up;
    required.push(up[secureRandomInt(up.length)]);
  }
  if (state.lowercase && low.length > 0) {
    pool += low;
    required.push(low[secureRandomInt(low.length)]);
  }
  if (state.numbers && num.length > 0) {
    pool += num;
    required.push(num[secureRandomInt(num.length)]);
  }
  if (state.symbols && sym.length > 0) {
    pool += sym;
    required.push(sym[secureRandomInt(sym.length)]);
  }

  // Fallback if user unchecks every toggle or excludes all characters
  if (pool.length === 0) {
    let fallback = CHAR_SETS.lowercase;
    if (state.excludeChars && state.excludeChars.length > 0) {
      const excludeSet = new Set([...state.excludeChars]);
      const filtered = [...fallback].filter(c => !excludeSet.has(c)).join('');
      fallback = filtered.length > 0 ? filtered : 'x';
    }
    pool = fallback;
    required.push(pool[secureRandomInt(pool.length)]);
  }

  const result = [...required];
  const remaining = Math.max(0, state.length - required.length);

  for (let i = 0; i < remaining; i++) {
    result.push(pool[secureRandomInt(pool.length)]);
  }

  shuffleArray(result);
  return {
    password: result.join(''),
    poolSize: pool.length
  };
}

// Passphrase Generation (EFF Diceware)
function generatePassphrase() {
  const wordlist = (typeof EFF_WORDS !== 'undefined' && Array.isArray(EFF_WORDS) && EFF_WORDS.length > 0)
    ? EFF_WORDS
    : ['correct', 'horse', 'battery', 'staple', 'rocket', 'shield', 'ocean', 'forest', 'planet', 'silver'];

  const count = state.wordCount;
  const words = [];

  for (let i = 0; i < count; i++) {
    const idx = secureRandomInt(wordlist.length);
    let word = wordlist[idx];
    if (state.capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    } else {
      word = word.toLowerCase();
    }
    words.push(word);
  }

  // Determine separator
  let sep = state.separator;
  if (sep === 'custom') {
    sep = state.customSeparator !== undefined ? state.customSeparator : '-';
  }

  // Handle number and special character insertions
  let suffix = '';

  if (state.passphraseSymbol) {
    const defaultSymbols = '!@#$%^&*-_+=?';
    let chosenSym = '!';
    if (state.passphraseSymbolChoice === 'random') {
      chosenSym = defaultSymbols[secureRandomInt(defaultSymbols.length)];
    } else if (state.passphraseSymbolChoice === 'custom') {
      chosenSym = state.customSymbol || '!';
    } else {
      chosenSym = state.passphraseSymbolChoice;
    }
    suffix += chosenSym;
  }

  if (state.passphraseNumber) {
    const randomDigit = secureRandomInt(90) + 10; // 10 to 99
    suffix += randomDigit.toString();
  }

  if (suffix) {
    words[words.length - 1] += suffix;
  }

  return {
    password: words.join(sep),
    wordCount: count,
    listSize: wordlist.length
  };
}

// Calculate Shannon entropy & strength
function calculateEntropy() {
  if (state.mode === 'password') {
    let poolSize = 0;
    if (state.uppercase) poolSize += 26;
    if (state.lowercase) poolSize += 26;
    if (state.numbers) poolSize += 10;
    if (state.symbols) poolSize += 30;
    if (state.avoidAmbiguous) poolSize -= 8;
    poolSize = Math.max(poolSize, 2);

    const bits = Math.round(state.length * Math.log2(poolSize));
    return bits;
  } else {
    // Passphrase entropy
    const wordBits = state.wordCount * Math.log2(7776); // ~12.92 bits per word
    const numBonus = state.passphraseNumber ? Math.log2(90) : 0;
    const symBonus = state.passphraseSymbol 
      ? (state.passphraseSymbolChoice === 'random' ? Math.log2(13) : Math.log2(2)) 
      : 0;
    return Math.round(wordBits + numBonus + symBonus);
  }
}

function updateStrengthMeter(bits) {
  let label = 'Weak';
  let color = 'var(--strength-weak)';
  let widthPct = Math.min(100, Math.max(10, (bits / 100) * 100));

  if (bits < 45) {
    label = 'Weak';
    color = 'var(--strength-weak)';
  } else if (bits < 60) {
    label = 'Fair';
    color = 'var(--strength-fair)';
  } else if (bits < 80) {
    label = 'Good';
    color = 'var(--strength-good)';
  } else {
    label = 'Very Strong';
    color = 'var(--strength-strong)';
  }

  el.strengthBar.style.width = `${widthPct}%`;
  el.strengthBar.style.backgroundColor = color;
  el.strengthLabel.textContent = label;
  el.strengthLabel.style.color = color;
  el.entropyLabel.textContent = `~${bits} bits`;
}

// History Management
async function recordHistory(password, type) {
  if (!state.historyEnabled) return;

  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    password,
    type,
    createdAt: Date.now()
  };

  // Keep up to historyMax items, newest first
  const limit = state.historyMax || 3;
  state.history = [item, ...state.history.filter(h => h.password !== password)].slice(0, limit);
  await storage.set({ history: state.history });
  renderHistory();
}

function formatRelativeTime(ts) {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function renderHistory() {
  el.historyList.innerHTML = '';

  if (!state.historyEnabled) {
    el.historyBadge.textContent = 'Off';
    el.clearHistoryBtn.disabled = true;
    el.historyList.innerHTML = '<div class="history-empty">History is turned off. Enable it in Preferences (⚙️).</div>';
    return;
  }

  el.historyBadge.textContent = `${state.history.length} / ${state.historyMax || 3}`;
  el.clearHistoryBtn.disabled = state.history.length === 0;

  if (state.history.length === 0) {
    el.historyList.innerHTML = '<div class="history-empty">No history recorded yet.</div>';
    return;
  }

  state.history.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'history-item';

    const content = document.createElement('div');
    content.className = 'history-item-content';

    const pwSpan = document.createElement('span');
    pwSpan.className = 'history-password';
    pwSpan.textContent = item.password;
    pwSpan.title = 'Click to copy';
    pwSpan.addEventListener('click', () => copyToClipboard(item.password));

    const meta = document.createElement('div');
    meta.className = 'history-meta';

    const typeBadge = document.createElement('span');
    typeBadge.className = 'history-type-badge';
    typeBadge.textContent = item.type;

    const timeSpan = document.createElement('span');
    timeSpan.textContent = formatRelativeTime(item.createdAt);

    meta.appendChild(typeBadge);
    meta.appendChild(timeSpan);
    content.appendChild(pwSpan);
    content.appendChild(meta);

    const copyBtn = document.createElement('button');
    copyBtn.className = 'history-copy-btn';
    copyBtn.title = 'Copy password';
    copyBtn.setAttribute('aria-label', 'Copy password');
    copyBtn.innerHTML = `
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    copyBtn.addEventListener('click', () => copyToClipboard(item.password));

    row.appendChild(content);
    row.appendChild(copyBtn);
    el.historyList.appendChild(row);
  });
}

// Clipboard & Toast
let toastTimeout = null;
let clearClipboardTimer = null;

function showToast(msg) {
  el.toastMessage.textContent = msg;
  el.toast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    el.toast.classList.add('hidden');
  }, 1800);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
    
    // Animate copy button if matching current password
    if (text === state.currentPassword) {
      el.copyBtnText.textContent = 'Copied!';
      setTimeout(() => {
        el.copyBtnText.textContent = 'Copy';
      }, 1500);
    }

    // Auto-clear clipboard timer if enabled
    if (state.clearClipboardSec > 0) {
      clearTimeout(clearClipboardTimer);
      const targetText = text;
      clearClipboardTimer = setTimeout(async () => {
        try {
          const current = await navigator.clipboard.readText();
          if (current === targetText) {
            await navigator.clipboard.writeText('');
            showToast('Clipboard cleared for security');
          }
        } catch {
          // If readText is blocked without focus, write empty directly
          await navigator.clipboard.writeText('');
          showToast('Clipboard cleared for security');
        }
      }, state.clearClipboardSec * 1000);
    }
  } catch (err) {
    // Fallback for document copy
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Copied to clipboard!');
  }
}

// QR Code (Scan to Phone)
function showQrCode() {
  if (typeof qrcode === 'undefined') {
    showToast('QR library loading...');
    return;
  }
  if (!state.currentPassword) {
    showToast('No password to display');
    return;
  }
  try {
    const qr = qrcode(0, 'M');
    qr.addData(state.currentPassword);
    qr.make();
    const svgString = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    el.qrDisplay.replaceChildren(doc.documentElement);
    el.qrModal.classList.remove('hidden');
  } catch (err) {
    console.error('QR generation failed:', err);
    showToast('Failed to generate QR code');
  }
}

// Main Generation Flow
function triggerGenerate(skipHistory = false) {
  // Animate regenerate icon
  el.regenerateIcon.classList.remove('rotate-spin');
  void el.regenerateIcon.offsetWidth; // trigger reflow
  el.regenerateIcon.classList.add('rotate-spin');

  let generated = '';
  if (state.mode === 'password') {
    const res = generatePassword();
    generated = res.password;
  } else {
    const res = generatePassphrase();
    generated = res.password;
  }

  state.currentPassword = generated;
  el.passwordOutput.textContent = generated;

  const entropy = calculateEntropy();
  updateStrengthMeter(entropy);

  if (!skipHistory) {
    recordHistory(generated, state.mode);
  }

  if (state.autoCopy) {
    copyToClipboard(generated);
  }
}

// Save & Restore Preferences
async function savePreferences() {
  await storage.set({
    passcraft_prefs: {
      mode: state.mode,
      length: state.length,
      uppercase: state.uppercase,
      lowercase: state.lowercase,
      numbers: state.numbers,
      symbols: state.symbols,
      avoidAmbiguous: state.avoidAmbiguous,
      excludeChars: state.excludeChars,
      wordCount: state.wordCount,
      separator: state.separator,
      customSeparator: state.customSeparator,
      capitalize: state.capitalize,
      passphraseNumber: state.passphraseNumber,
      passphraseSymbol: state.passphraseSymbol,
      passphraseSymbolChoice: state.passphraseSymbolChoice,
      customSymbol: state.customSymbol,
      historyEnabled: state.historyEnabled,
      historyMax: state.historyMax,
      autoCopy: state.autoCopy,
      clearClipboardSec: state.clearClipboardSec
    }
  });
}

async function loadPreferences() {
  const data = await storage.get(['passcraft_prefs', 'history']);
  if (data.passcraft_prefs) {
    state = { ...state, ...data.passcraft_prefs };
  }
  state.historyMax = state.historyMax || 3;
  if (Array.isArray(data.history)) {
    state.history = data.history.slice(0, state.historyMax);
  }

  // Sync UI elements with state
  setMode(state.mode, false);
  el.lengthSlider.value = state.length;
  el.lengthInput.value = state.length;
  el.optUppercase.checked = state.uppercase;
  el.optLowercase.checked = state.lowercase;
  el.optNumbers.checked = state.numbers;
  el.optSymbols.checked = state.symbols;
  el.optAvoidAmbiguous.checked = state.avoidAmbiguous;
  el.optExcludeChars.value = state.excludeChars || '';

  el.wordsSlider.value = state.wordCount;
  el.wordsInput.value = state.wordCount;
  el.passphraseSeparator.value = state.separator;
  el.customSeparatorInput.value = state.customSeparator || '';
  if (state.separator === 'custom') {
    el.customSeparatorInput.classList.remove('hidden');
  } else {
    el.customSeparatorInput.classList.add('hidden');
  }

  el.optCapitalize.checked = state.capitalize;
  el.optPassphraseNumber.checked = state.passphraseNumber;
  el.optPassphraseSymbol.checked = state.passphraseSymbol;

  if (state.passphraseSymbol) {
    el.passphraseSymbolConfig.classList.remove('hidden');
  } else {
    el.passphraseSymbolConfig.classList.add('hidden');
  }

  el.passphraseSymbolChoice.value = state.passphraseSymbolChoice || 'random';
  el.customSymbolInput.value = state.customSymbol || '';
  if (state.passphraseSymbolChoice === 'custom') {
    el.customSymbolInput.classList.remove('hidden');
  } else {
    el.customSymbolInput.classList.add('hidden');
  }

  el.settingHistoryEnabled.checked = state.historyEnabled;
  el.settingHistoryMax.value = state.historyMax.toString();
  el.settingAutoCopy.checked = state.autoCopy;
  el.settingClearClipboard.value = (state.clearClipboardSec || 0).toString();

  renderHistory();
  triggerGenerate(false);
}

function setMode(mode, save = true) {
  state.mode = mode;
  if (mode === 'password') {
    el.tabPassword.classList.add('active');
    el.tabPassword.setAttribute('aria-selected', 'true');
    el.tabPassphrase.classList.remove('active');
    el.tabPassphrase.setAttribute('aria-selected', 'false');
    el.optionsPassword.classList.remove('hidden');
    el.optionsPassphrase.classList.add('hidden');
  } else {
    el.tabPassphrase.classList.add('active');
    el.tabPassphrase.setAttribute('aria-selected', 'true');
    el.tabPassword.classList.remove('active');
    el.tabPassword.setAttribute('aria-selected', 'false');
    el.optionsPassphrase.classList.remove('hidden');
    el.optionsPassword.classList.add('hidden');
  }
  if (save) {
    savePreferences();
    triggerGenerate(false);
  }
}

// Event Listeners
function setupEventListeners() {
  // Tabs
  el.tabPassword.addEventListener('click', () => setMode('password'));
  el.tabPassphrase.addEventListener('click', () => setMode('passphrase'));

  // Copy & Regenerate
  el.copyBtn.addEventListener('click', () => copyToClipboard(state.currentPassword));
  el.passwordOutput.addEventListener('click', () => copyToClipboard(state.currentPassword));
  el.regenerateBtn.addEventListener('click', () => triggerGenerate(false));

  // QR Code (Scan to Phone)
  el.qrBtn.addEventListener('click', showQrCode);
  el.qrCloseBtn.addEventListener('click', () => el.qrModal.classList.add('hidden'));
  el.qrModal.addEventListener('click', (e) => {
    if (e.target === el.qrModal) el.qrModal.classList.add('hidden');
  });

  // Password options
  el.lengthSlider.addEventListener('input', (e) => {
    state.length = parseInt(e.target.value, 10);
    el.lengthInput.value = state.length;
    savePreferences();
    triggerGenerate(false);
  });

  el.lengthInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 4 && val <= 128) {
      state.length = val;
      el.lengthSlider.value = val;
      savePreferences();
      triggerGenerate(false);
    }
  });

  el.lengthInput.addEventListener('blur', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 4) val = 4;
    if (val > 128) val = 128;
    e.target.value = val;
    state.length = val;
    el.lengthSlider.value = val;
    savePreferences();
    triggerGenerate(false);
  });

  const bindToggle = (element, key) => {
    element.addEventListener('change', (e) => {
      state[key] = e.target.checked;
      savePreferences();
      triggerGenerate(false);
    });
  };

  bindToggle(el.optUppercase, 'uppercase');
  bindToggle(el.optLowercase, 'lowercase');
  bindToggle(el.optNumbers, 'numbers');
  bindToggle(el.optSymbols, 'symbols');
  bindToggle(el.optAvoidAmbiguous, 'avoidAmbiguous');

  el.optExcludeChars.addEventListener('input', (e) => {
    state.excludeChars = e.target.value;
    savePreferences();
    triggerGenerate(false);
  });

  // Passphrase options (words/phrases count 1, 2, 3...)
  el.wordsSlider.addEventListener('input', (e) => {
    state.wordCount = parseInt(e.target.value, 10);
    el.wordsInput.value = state.wordCount;
    savePreferences();
    triggerGenerate(false);
  });

  el.wordsInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= 15) {
      state.wordCount = val;
      el.wordsSlider.value = val;
      savePreferences();
      triggerGenerate(false);
    }
  });

  el.wordsInput.addEventListener('blur', (e) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) val = 1;
    if (val > 15) val = 15;
    e.target.value = val;
    state.wordCount = val;
    el.wordsSlider.value = val;
    savePreferences();
    triggerGenerate(false);
  });

  el.passphraseSeparator.addEventListener('change', (e) => {
    state.separator = e.target.value;
    if (state.separator === 'custom') {
      el.customSeparatorInput.classList.remove('hidden');
      el.customSeparatorInput.focus();
    } else {
      el.customSeparatorInput.classList.add('hidden');
    }
    savePreferences();
    triggerGenerate(false);
  });

  el.customSeparatorInput.addEventListener('input', (e) => {
    state.customSeparator = e.target.value;
    savePreferences();
    triggerGenerate(false);
  });

  bindToggle(el.optCapitalize, 'capitalize');
  bindToggle(el.optPassphraseNumber, 'passphraseNumber');

  el.optPassphraseSymbol.addEventListener('change', (e) => {
    state.passphraseSymbol = e.target.checked;
    if (state.passphraseSymbol) {
      el.passphraseSymbolConfig.classList.remove('hidden');
    } else {
      el.passphraseSymbolConfig.classList.add('hidden');
    }
    savePreferences();
    triggerGenerate(false);
  });

  el.passphraseSymbolChoice.addEventListener('change', (e) => {
    state.passphraseSymbolChoice = e.target.value;
    if (state.passphraseSymbolChoice === 'custom') {
      el.customSymbolInput.classList.remove('hidden');
      el.customSymbolInput.focus();
    } else {
      el.customSymbolInput.classList.add('hidden');
    }
    savePreferences();
    triggerGenerate(false);
  });

  el.customSymbolInput.addEventListener('input', (e) => {
    state.customSymbol = e.target.value;
    savePreferences();
    triggerGenerate(false);
  });

  // Settings
  el.settingsToggleBtn.addEventListener('click', () => {
    el.settingsPanel.classList.toggle('hidden');
  });

  el.settingsCloseBtn.addEventListener('click', () => {
    el.settingsPanel.classList.add('hidden');
  });

  el.settingHistoryEnabled.addEventListener('change', (e) => {
    state.historyEnabled = e.target.checked;
    savePreferences();
    renderHistory();
    showToast(state.historyEnabled ? 'History logging enabled' : 'History logging disabled');
  });

  el.settingHistoryMax.addEventListener('change', (e) => {
    state.historyMax = parseInt(e.target.value, 10) || 3;
    state.history = state.history.slice(0, state.historyMax);
    savePreferences();
    renderHistory();
  });

  el.settingAutoCopy.addEventListener('change', (e) => {
    state.autoCopy = e.target.checked;
    savePreferences();
  });

  const updateClearClipboard = (val) => {
    let sec = parseInt(val, 10);
    if (isNaN(sec) || sec < 0) sec = 0;
    if (sec > 3600) sec = 3600;
    state.clearClipboardSec = sec;
    savePreferences();
    return sec;
  };

  el.settingClearClipboard.addEventListener('input', (e) => {
    updateClearClipboard(e.target.value);
  });

  el.settingClearClipboard.addEventListener('change', (e) => {
    updateClearClipboard(e.target.value);
  });

  el.settingClearClipboard.addEventListener('blur', (e) => {
    const sec = updateClearClipboard(e.target.value);
    e.target.value = sec;
  });

  // History Clear
  el.clearHistoryBtn.addEventListener('click', async () => {
    state.history = [];
    await storage.set({ history: [] });
    renderHistory();
    showToast('History cleared');
  });

  // Keyboard Shortcuts: Space to regenerate, Esc to close modals
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
      e.preventDefault();
      triggerGenerate(false);
    } else if (e.key === 'Escape') {
      if (!el.qrModal.classList.contains('hidden')) {
        el.qrModal.classList.add('hidden');
      } else if (!el.settingsPanel.classList.contains('hidden')) {
        el.settingsPanel.classList.add('hidden');
      }
    }
  });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadPreferences();
});
