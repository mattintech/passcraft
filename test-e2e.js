/**
 * PassCraft End-to-End (E2E) Browser Verification Suite
 * Powered by Puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');
const assert = require('assert');

async function runE2E() {
  console.log('🚀 Starting PassCraft End-to-End (E2E) Suite in Headless Chromium...\n');

  const extensionPath = path.resolve(__dirname);
  const popupUrl = `file://${path.join(extensionPath, 'popup', 'popup.html')}`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport matching popup dimensions
    await page.setViewport({ width: 380, height: 600 });

    // Grant clipboard permissions
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(popupUrl, ['clipboard-read', 'clipboard-write']).catch(() => {});

    // Navigate to popup
    await page.goto(popupUrl, { waitUntil: 'domcontentloaded' });

    // 1. Initial Load & Default Password Generation
    console.log('--- 1. Testing Initial Load & DOM Elements ---');
    await page.waitForSelector('#password-output');
    const initialPassword = await page.$eval('#password-output', el => el.textContent.trim());
    assert(initialPassword.length === 16, `Default password length should be 16, got ${initialPassword.length}`);
    
    const strengthText = await page.$eval('#strength-label', el => el.textContent);
    assert(strengthText.length > 0, 'Strength label should be populated');
    console.log(`✓ Initial password generated: ${initialPassword} (Strength: ${strengthText})`);

    // 2. Regenerate Button
    console.log('\n--- 2. Testing Regenerate Action ---');
    await page.click('#regenerate-btn');
    await new Promise(r => setTimeout(r, 100));
    const regeneratedPassword = await page.$eval('#password-output', el => el.textContent.trim());
    assert(regeneratedPassword.length === 16, 'Regenerated password length should be 16');
    assert.notStrictEqual(initialPassword, regeneratedPassword, 'Regenerated password should be fresh');
    console.log(`✓ Regenerate verified: ${regeneratedPassword}`);

    // 3. Length Slider & Custom Exclude Characters
    console.log('\n--- 3. Testing Slider & Custom Excluded Characters ---');
    // Set length to 24 via input
    await page.$eval('#length-input', el => {
      el.value = '24';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    let pw24 = await page.$eval('#password-output', el => el.textContent.trim());
    assert.strictEqual(pw24.length, 24, `Password should now be length 24, got ${pw24.length}`);

    // Set excluded characters: exclude digits '0123456789'
    await page.$eval('#opt-exclude-chars', el => {
      el.value = '0123456789';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    let pwNoDigits = await page.$eval('#password-output', el => el.textContent.trim());
    assert(!/\d/.test(pwNoDigits), `Password should not contain excluded numbers: ${pwNoDigits}`);
    console.log(`✓ Excluded numbers verified in 24-char password: ${pwNoDigits}`);

    // Clear excluded characters
    await page.$eval('#opt-exclude-chars', el => {
      el.value = '';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // 4. Offline QR Code Modal (Scan to Phone)
    console.log('\n--- 4. Testing Offline QR Code Modal ---');
    const qrModalHiddenBefore = await page.$eval('#qr-modal', el => el.classList.contains('hidden'));
    assert(qrModalHiddenBefore, 'QR modal should be hidden by default');

    await page.click('#qr-btn');
    await page.waitForSelector('#qr-modal:not(.hidden)');
    const qrSvgExists = await page.$eval('#qr-display svg', el => Boolean(el && el.innerHTML.length > 0));
    assert(qrSvgExists, 'QR SVG must be rendered and non-empty in DOM');

    // Close QR modal via close button
    await page.click('#qr-close-btn');
    const qrModalHiddenAfter = await page.$eval('#qr-modal', el => el.classList.contains('hidden'));
    assert(qrModalHiddenAfter, 'QR modal should close on close button click');
    console.log('✓ Offline QR Code modal and SVG generation verified.');

    // 5. Diceware Passphrase Mode & Custom Separators
    console.log('\n--- 5. Testing Diceware Passphrase Mode ---');
    await page.click('#tab-passphrase');
    await new Promise(r => setTimeout(r, 100));

    const passphraseActive = await page.$eval('#tab-passphrase', el => el.classList.contains('active'));
    assert(passphraseActive, 'Passphrase tab should be active');

    const passphraseText = await page.$eval('#password-output', el => el.textContent.trim());
    const words = passphraseText.split('-');
    assert.strictEqual(words.length, 4, `Default passphrase should have 4 hyphen-separated words, got ${passphraseText}`);
    console.log(`✓ Passphrase generated: "${passphraseText}" (${words.length} words)`);

    // Change separator to custom "::"
    await page.$eval('#passphrase-separator', el => {
      el.value = 'custom';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.$eval('#custom-separator-input', el => {
      el.value = '::';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const customSepText = await page.$eval('#password-output', el => el.textContent.trim());
    assert(customSepText.includes('::'), `Passphrase should use custom separator "::", got ${customSepText}`);
    console.log(`✓ Custom separator passphrase: "${customSepText}"`);

    // 6. Settings Panel & Preferences
    console.log('\n--- 6. Testing Settings Panel & Options ---');
    await page.click('#settings-toggle-btn');
    await page.waitForSelector('#settings-panel:not(.hidden)');

    // Verify auto-copy option toggle
    const autoCopyChecked = await page.$eval('#setting-auto-copy', el => el.checked);
    assert.strictEqual(autoCopyChecked, false, 'Auto-copy should default to false');

    await page.$eval('#setting-auto-copy', el => {
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const updatedAutoCopy = await page.$eval('#setting-auto-copy', el => el.checked);
    assert.strictEqual(updatedAutoCopy, true, 'Auto-copy should toggle to true');

    // Close settings panel
    await page.click('#settings-close-btn');
    const settingsHidden = await page.$eval('#settings-panel', el => el.classList.contains('hidden'));
    assert(settingsHidden, 'Settings panel should close');
    console.log('✓ Settings panel and toggle preferences verified.');

    // 7. Clipboard Copy & Toast Feedback
    console.log('\n--- 7. Testing 1-Click Copy & Toast Notification ---');
    await page.click('#copy-btn');
    await page.waitForSelector('#toast:not(.hidden)');
    const toastMsg = await page.$eval('#toast-message', el => el.textContent);
    assert.strictEqual(toastMsg, 'Copied to clipboard!', 'Toast message should show copy confirmation');
    console.log(`✓ Copy action triggered toast: "${toastMsg}"`);

    // 8. Privacy-Preserving History Tracking
    console.log('\n--- 8. Testing History Configuration & Privacy ---');
    // Reopen settings and enable history with cap = 2
    await page.click('#settings-toggle-btn');
    await page.$eval('#setting-history-enabled', el => {
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.$eval('#setting-history-max', el => {
      el.value = '2';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.click('#settings-close-btn');

    // Generate 3 items
    await page.click('#regenerate-btn');
    await new Promise(r => setTimeout(r, 50));
    await page.click('#regenerate-btn');
    await new Promise(r => setTimeout(r, 50));
    await page.click('#regenerate-btn');
    await new Promise(r => setTimeout(r, 50));

    const historyItemCount = await page.$$eval('.history-item', items => items.length);
    assert.strictEqual(historyItemCount, 2, `History items should be capped at 2, got ${historyItemCount}`);
    console.log(`✓ History strictly capped at ${historyItemCount} entries.`);

    // Clear history
    await page.click('#clear-history-btn');
    await new Promise(r => setTimeout(r, 50));
    const historyItemCountAfter = await page.$$eval('.history-item', items => items.length);
    assert.strictEqual(historyItemCountAfter, 0, 'History should be empty after clear button click');
    console.log('✓ History successfully cleared.');

    console.log('\n======================================================');
    console.log('🎉 ALL END-TO-END (E2E) BROWSER TESTS PASSED (8 / 8)!');
    console.log('======================================================');
  } finally {
    await browser.close();
  }
}

runE2E().catch(err => {
  console.error('\n❌ E2E Test Run Failed:', err);
  process.exit(1);
});
