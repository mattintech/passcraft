# Contributing to PassCraft 🛡️

Thank you for your interest in contributing to **PassCraft**! We welcome contributions from the community to help make this extension even faster, more secure, and more convenient.

---

## 🔒 Core Principles & Security Rules

Because PassCraft handles user password generation, all contributions must strictly adhere to our security architecture:

1. **Zero Network Permissions (`0 Telemetry`):**
   - The extension must NEVER make outbound network calls, include analytics, load third-party scripts/fonts from CDNs, or request host permissions in `manifest.json`.
   - The extension must remain 100% functional offline.

2. **Cryptographic Integrity:**
   - Any random number generation MUST use `crypto.getRandomValues()` with rejection sampling to eliminate modulo bias.
   - `Math.random()` is strictly prohibited in security-sensitive paths.

3. **No External Runtime Dependencies:**
   - Keep the extension lightweight, auditable, and self-contained (pure vanilla JavaScript and CSS).
   - Any external build or compile tools must not introduce obfuscated runtime dependencies.

4. **Manifest V3 Compliance:**
   - Follow MV3 security practices: no `eval()`, no inline JavaScript event handlers in HTML, and cross-browser compatibility across Chrome and Firefox.

---

## 🛠️ Development Setup

Getting started is quick and requires no compilation:

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/passcraft.git
   cd passcraft
   ```

2. **Run automated verification tests:**
   ```bash
   npm test
   ```
   *(Node.js 18+ recommended. All tests run locally in milliseconds).*

3. **Load in your browser for live testing:**
   - **Chrome / Brave / Edge:**
     1. Open `chrome://extensions`.
     2. Enable **Developer mode**.
     3. Click **Load unpacked** and select the repository root folder.
   - **Firefox:**
     1. Open `about:debugging#/runtime/this-firefox`.
     2. Click **Load Temporary Add-on...**.
     3. Select `manifest.json`.

---

## 🐛 Reporting Bugs

If you find a bug, please check existing issues before submitting a new one:

- **Security Vulnerabilities:** If you discover a sensitive security vulnerability, please report it privately via GitHub Security Advisories or by emailing `mattintech@gmail.com`.
- **General Bugs:** Open a [New Issue](https://github.com/mattintech/passcraft/issues/new?template=bug_report.md) using our Bug Report template. Please include:
  - Browser name and version (e.g. Chrome 128, Firefox 130).
  - Operating system (macOS, Windows, Linux).
  - Clear steps to reproduce the issue.
  - Expected vs. actual behavior.

---

## 💡 Suggesting Enhancements & Features

Have an idea for improving PassCraft? We'd love to hear it:

1. Open a [New Feature Request](https://github.com/mattintech/passcraft/issues/new?template=feature_request.md).
2. Clearly describe the use case, why this helps users, and any proposed UI/UX controls.
3. Check that the proposal aligns with our core privacy principles (local, offline, stateless).

---

## 🌿 Branching Strategy

- **`develop`**: The integration branch for active development. All feature branches, bug fixes, and community Pull Requests must target `develop`.
- **`main`**: The production release branch. Code in `main` is what goes directly to the Chrome Web Store and Firefox Add-ons. Releases are tagged (`v1.0.0`) from `main` to trigger automated store deployments.

---

## 🚀 Pull Request (PR) Workflow

1. **Create a branch from `develop`:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes:**
   - Keep code clean, readable, and well-commented.
   - Maintain the modern dark theme aesthetic in `popup.css`.
   - Update tests in `test.js` if you added new generator options.

3. **Verify tests pass:**
   ```bash
   npm test
   ```

4. **Commit and push:**
   ```bash
   git commit -m "feat: describe your change cleanly"
   git push origin feat/your-feature-name
   ```

5. **Open a Pull Request:**
   - Target the **`develop`** branch (not `main`).
   - Fill out the PR template on GitHub.
   - Reference any related issues (e.g., `Closes #12`).
   - We will review PRs promptly and provide constructive feedback!

---

## 📜 Code of Conduct

Be kind, respectful, and constructive. We are here to build great, privacy-respecting open-source software together.
