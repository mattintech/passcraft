# PassCraft 🛡️

> A private, account-free password and Diceware passphrase generator for **Firefox** and **Chrome**. 100% offline, zero network permissions, cryptographic randomness, and configurable local history.

![PassCraft Icon](icons/icon-48.png)

---

## Why PassCraft?

Most major password managers (like Bitwarden, 1Password, or Dashlane) require you to create an account, log in, and unlock an encrypted cloud vault just to use a simple password generator button. Meanwhile, random generator extensions on browser stores often include telemetry, inject ads, or lack essential options like human-readable passphrases.

**PassCraft** gives you an instant, stateless generator directly in your browser toolbar:
- **No accounts or logins** — instant access on browser startup.
- **100% Offline** — operates with **zero host permissions** (`no network access`). It is physically impossible for the extension to send passwords anywhere.
- **Both Generator Modes** — traditional high-entropy strings and EFF Diceware passphrases.
- **Configurable History** — optional local history (disabled by default for zero-knowledge privacy). When enabled, remembers up to the last 3 generated credentials with timestamps. Can be cleared with one click or toggled off anytime in preferences.

---

## Features

### 1. Random Password Mode
- **Length Slider**: 8 to 64 characters (default: 16).
- **Character Pool Toggles**:
  - Uppercase (`A-Z`)
  - Lowercase (`a-z`)
  - Numbers (`0-9`)
  - Special Characters (`!@#$%^&*()_+-=[]{}|;:,.<>?`)
- **Avoid Ambiguous Characters**: Excludes easily confused glyphs like `1`, `l`, `I`, `0`, `O`, `o`, `|`, `\`.
- **Guaranteed Coverage**: Ensures at least one character from every active set is included, then shuffled uniformly.

### 2. Memorable Passphrase Mode
- **EFF Diceware Wordlist**: Uses the official Electronic Frontier Foundation (EFF) 7,776-word list designed for human memorability and high entropy (~12.92 bits per word).
- **Word Count Slider**: 3 to 10 words (default: 4).
- **Word Separators**: Choose from presets (Hyphen `-`, Space ` `, Period `.`, Underscore `_`, Comma `,`, Slash `/`, Plus `+`, Hash `#`, None) or type any **Custom Separator** (e.g. `::`, `~`, `*`).
- **Capitalization Toggle**: Capitalize each word (`Correct-Horse-Battery-Staple`) or keep all lowercase (`correct-horse-battery-staple`).
- **Include Special Character**: Add a random symbol (`!@#$%^&*`) or pick a specific symbol (`!`, `@`, `#`, `$`, `%`, `&`, `*`, `?`, or custom).
- **Optional Digits**: Append a random 2-digit number for strict site complexity rules (can be combined with special characters).

### 3. History & Privacy Controls
- **Setting: History Logging**: Off by default for maximum security and privacy. Toggle on/off anytime in Preferences (⚙️).
- **Strict Capacity**: Stores only the **last 3 generated credentials** with relative/absolute timestamps (e.g., *"Just now"*, *"2m ago"*).
- **One-Click Copy**: Instant copy button next to each historical password.
- **One-Click Clear**: Purge all stored history immediately.
- **Local Storage Only**: History is stored strictly in your browser's local sandbox (`chrome.storage.local` / `browser.storage.local`), never synced to external servers or Google/Firefox sync accounts.

### 4. Quality of Life
- **Entropy & Strength Meter**: Real-time calculation of cryptographic pool entropy (in bits) with a color-coded strength bar.
- **One-Click Copy with Feedback**: Click the "Copy" button or click directly on the generated password text.
- **Keyboard Shortcut**: Press `Spacebar` while the popup is open to instantly re-roll a new password.
- **Auto-Copy Option**: Optional preference to copy newly generated passwords directly to the clipboard.
- **Persistent Preferences**: Remembers your preferred mode, sliders, and toggles across sessions.

---

## Installation & Setup

### Google Chrome, Brave, Edge & Opera
1. Download or clone this repository:
   ```bash
   git clone https://github.com/mattintech/passcraft.git
   ```
2. Open your browser and navigate to:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked**.
5. Select the `generator` folder (containing `manifest.json`).
6. Pin **PassCraft** to your toolbar for quick 1-click access!

### Mozilla Firefox
1. Open Firefox and navigate to:
   ```text
   about:debugging#/runtime/this-firefox
   ```
2. Click **Load Temporary Add-on...**.
3. Select `manifest.json` inside the `generator` folder.
4. The PassCraft icon will appear in your Firefox toolbar.

*(Note: For permanent local installation in standard Firefox, see the [Packaging & Publishing](#packaging--publishing) section below or submit to Mozilla Add-ons).*

---

## Publishing to GitHub

To publish this project to GitHub so others can audit and use it:

```bash
# 1. Initialize git repository
git init

# 2. Add files and make initial commit
git add .
git commit -m "feat: initial commit of PassCraft password generator extension"

# 3. Create a repo on GitHub (e.g., using GitHub CLI or web UI)
# Using GitHub CLI:
gh repo create passcraft --public --source=. --push

# Or using standard Git:
git remote add origin https://github.com/mattintech/passcraft.git
git branch -M main
git push -u origin main
```

---

## Packaging & Publishing

### Create a Store-Ready ZIP
To prepare the extension for the Chrome Web Store or Firefox Add-ons (AMO), create a clean ZIP archive excluding git files and developer docs:

```bash
zip -r passcraft-extension.zip . -x "*.git*" "*.DS_Store" "CHROMEWEBSTORE.md"
```

- **Chrome Web Store**:
  - Visit the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
  - Upload `passcraft-extension.zip`.
  - Use the pre-filled descriptions and permissions justification from [`CHROMEWEBSTORE.md`](file:///Users/matt/code/html/generator/CHROMEWEBSTORE.md).
- **Firefox Add-ons (AMO)**:
  - Visit [addons.mozilla.org / Developer Hub](https://addons.mozilla.org/developers/).
  - Submit the ZIP for self-distribution or public listing.

---

## Security Architecture

- **RNG**: Uses standard Web Cryptography API (`crypto.getRandomValues`).
- **Unbiased Rejection Sampling**: Rejection sampling is employed to avoid modulo bias when mapping random integers onto character pools or the 7,776-word dictionary.
- **Zero Remote Dependencies**: Self-contained CSS, JS, and embedded EFF wordlist. No CDN links, analytics, or external script execution.
- **Manifest V3 Strict CSP**: Strictly complies with MV3 Content Security Policy — no `eval()`, no inline scripts, no dynamic code evaluation.

---

## License

PassCraft is licensed under the [MIT License](file:///Users/matt/code/html/generator/LICENSE).
The EFF Diceware Wordlist is provided under the [Creative Commons Attribution 3.0 License](https://creativecommons.org/licenses/by/3.0/us/) by the Electronic Frontier Foundation.
