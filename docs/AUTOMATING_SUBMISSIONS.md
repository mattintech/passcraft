# Automating Store Submissions (CI/CD) 🚀

PassCraft includes a ready-to-use GitHub Actions workflow [`.github/workflows/release-and-publish.yml`](../.github/workflows/release-and-publish.yml) that automatically:
1. Runs the test suite (`npm test`).
2. Packages `passcraft-extension.zip`.
3. Creates a GitHub Release with the ZIP attached.
4. Uploads and submits the new version to the **Chrome Web Store**.
5. Uploads, signs, and submits the new version to **Mozilla Firefox Add-ons (AMO)**.

---

## 🌿 Branching Strategy

- **`develop`**: The active development branch. All feature branches, bug fixes, and community PRs are merged here.
- **`main`**: The production release branch ("what goes to the stores"). Only stable code ready for store deployment is merged into `main`.

---

## 🔑 Required Secrets Setup

To enable automated store uploading, add the following secrets in your GitHub repository:
**`Settings`** ➔ **`Secrets and variables`** ➔ **`Actions`** ➔ **`New repository secret`**.

### 1. Google Chrome Web Store

1. **Prerequisite:** Upload your extension manually once to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole) so it generates your Extension ID.
2. Go to the [Google Cloud Console](https://console.cloud.google.com/).
3. Create a project and enable the **Chrome Web Store API**.
4. Navigate to **APIs & Services** ➔ **Credentials** ➔ Create an **OAuth 2.0 Client ID** (Application type: *Desktop App*).
5. Generate a **Refresh Token** using your client ID and client secret (you can use tools like `chrome-webstore-upload-cli` or Google OAuth Playground).
6. Add these 4 secrets to your GitHub repo:
   - `CHROME_EXTENSION_ID`: Your extension ID from the developer dashboard URL.
   - `CHROME_CLIENT_ID`: Your Google OAuth2 Client ID.
   - `CHROME_CLIENT_SECRET`: Your Google OAuth2 Client Secret.
   - `CHROME_REFRESH_TOKEN`: Your generated OAuth2 Refresh Token.

### 2. Mozilla Firefox Add-ons (AMO)

1. Go to the [Mozilla Add-on Developer Hub](https://addons.mozilla.org/developers/).
2. Under your profile icon, go to **Manage API Keys** (`https://addons.mozilla.org/developers/addon/api/key/`).
3. Generate new API credentials.
4. Add these 3 secrets to your GitHub repo:
   - `AMO_JWT_ISSUER`: Your JWT Issuer (API Key).
   - `AMO_JWT_SECRET`: Your JWT Secret (API Secret).
   - `AMO_EXTENSION_ID`: Your add-on ID (from `manifest.json` `browser_specific_settings.gecko.id` or assigned on AMO, e.g. `passcraft@local`).

---

## 📦 How to Trigger a Store Release

Whenever you are ready to publish a new version:

### Option A: Tagged Git Release (Recommended)
1. Merge `develop` into `main`:
   ```bash
   git checkout main
   git merge develop
   ```
2. Update the version number in `manifest.json` and `package.json` (e.g., `1.0.1`).
3. Commit and push a version tag:
   ```bash
   git commit -am "chore: bump version to 1.0.1"
   git push origin main
   git tag v1.0.1
   git push origin v1.0.1
   ```
4. GitHub Actions will automatically build, create the GitHub release, and submit the update to both stores!

### Option B: Manual Trigger (GitHub UI)
1. In your GitHub repository, go to the **Actions** tab.
2. Select **"Publish Extension to Stores"**.
3. Click **"Run workflow"** and choose branch `main`.
