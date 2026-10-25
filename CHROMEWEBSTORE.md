# Chrome Web Store Listing — PassCraft

> Last Updated: 2026-10-24

## Store Listing

**Extension Name** [REQUIRED]
PassCraft - Offline Password & Passphrase Generator

**Short Description** [REQUIRED]
Generate strong passwords and memorable passphrases 100% offline. Zero accounts, zero tracking, with optional local history.

**Detailed Description** [REQUIRED]
PassCraft is a fast, lightweight, and completely private password and passphrase generator designed to work directly in your browser without requiring an account, sign-in, or internet connection.

KEY FEATURES:
- Random Password Generator: Customize length (8 to 64 characters) with independent controls for uppercase, lowercase, numbers, special symbols, and an option to exclude ambiguous characters (like 1, l, 0, O).
- Diceware Passphrase Generator: Create secure, easy-to-remember multi-word passphrases using the official Electronic Frontier Foundation (EFF) wordlist. Customize word count, choose separators (hyphens, spaces, periods, or underscores), and toggle capitalization or appended digits.
- Optional Local History: Off by default for complete zero-knowledge security. When enabled in Preferences, keeps track of your last 3 generated passwords with timestamps. History is stored exclusively on your device in local browser storage, can be cleared with one click, or turned off at any time.
- Real-Time Strength & Entropy Meter: Instantly view the cryptographic bit-strength and security rating of each generated credential.
- One-Click Copy & Keyboard Shortcuts: Copy instantly with visual confirmation or press Spacebar to quickly re-roll passwords.

HOW TO USE IT:
1. Click the PassCraft icon in your browser toolbar.
2. Choose between "Password" (random string) or "Passphrase" (memorable words).
3. Adjust your desired length or word count with the slider.
4. Click "Copy" or click directly on the generated text to copy it to your clipboard.
5. Access your recent 3 generated items in the History section below, or clear them at any time.

PRIVACY & SECURITY:
PassCraft operates 100% offline. It has zero network permissions, does not connect to any remote server, does not use external analytics or tracking scripts, and never asks for an account or email address. All entropy is derived locally using the browser's cryptographically secure pseudo-random number generator (`crypto.getRandomValues`).

**Category** [REQUIRED]
Productivity

**Single Purpose** [REQUIRED]
Generates secure random passwords and multi-word passphrases locally in the browser with zero network access.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

| Asset | Dimensions | Status | Filename |
|-------|-----------|--------|----------|
| Store Icon [REQUIRED] | 128×128 PNG | ✅ Ready | `icons/icon-128.png` |
| Screenshot 1 [REQUIRED] | 1280×800 or 640×400 | ⬜ Not created | `promo/screenshot-password.png` |
| Screenshot 2 [RECOMMENDED] | 1280×800 or 640×400 | ⬜ Not created | `promo/screenshot-passphrase.png` |
| Small Promo Tile [RECOMMENDED] | 440×280 | ⬜ Not created | `promo/promo-small.png` |

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| `storage` | permissions | Used exclusively to persist user generator preferences (length, character toggles, separator, history setting) and the optional local list of the last 3 generated passwords. No data ever leaves the local device. |
| `clipboardWrite` | permissions | Enables the user to copy generated passwords directly to their system clipboard when clicking the Copy button. |

## Privacy & Data Use

### Data Collection
- **User Activity**: None. Zero tracking, analytics, or behavioral telemetry.
- **Personal Information**: None. No accounts, names, emails, or credentials collected.
- **Location**: None.
- **Web History**: None. Zero host permissions declared; PassCraft cannot inspect or interact with any website you visit.

### Privacy Policy Summary
PassCraft does not collect, store, transmit, or sell any personal or usage data. All password generation logic runs entirely client-side using native browser cryptography. Local settings and optional password history remain strictly in your browser's local sandbox and are never synchronized to any cloud server.
