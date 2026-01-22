# Complete Setup Guide - Innovation Judging App

This guide walks you through setting up and deploying the Innovation Judging App from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Local Development Setup](#local-development-setup)
4. [Firebase Deployment](#firebase-deployment)
5. [GitHub Actions Setup](#github-actions-setup)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** installed
- A **Google account** (for Firebase)
- A **GitHub account** (for repository and CI/CD)

### Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:

```bash
firebase --version
```

---

## Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name: `innovation-judging` (or your preferred name)
4. Disable Google Analytics (optional for this project)
5. Click **"Create project"**
6. Wait for project creation, then click **"Continue"**

### Step 2: Enable Firestore Database

1. In the left sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll deploy custom rules)
4. Select a location (choose one closest to your users):
   - `us-central` - United States
   - `us-east1` - South Carolina
   - `europe-west` - Belgium
   - etc.
5. Click **"Enable"**

### Step 3: Enable Authentication

1. In the left sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Click the **"Sign-in method"** tab
4. Find **"Anonymous"** in the list
5. Toggle the switch to **"Enabled"**
6. Click **"Save"**

### Step 4: Get Firebase Configuration

1. In the Firebase Console, click the **gear icon** ⚙️ (Project settings)
2. Scroll down to **"Your apps"** section
3. If you see "There are no apps in your project", click the **web icon** (`</>`)
4. Register app:
   - **App nickname**: `Innovation Judging App`
   - Leave "Firebase Hosting" unchecked for now
   - Click **"Register app"**
5. Copy the `firebaseConfig` object (you'll need these values later)

Example config (yours will be different):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "innovation-judging.firebaseapp.com",
  projectId: "innovation-judging",
  storageBucket: "innovation-judging.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Click **"Continue to console"**

---

## Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/judging-app.git
cd judging-app

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Open `.env` and replace with your Firebase config values:

```env
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=innovation-judging.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=innovation-judging
VITE_FIREBASE_STORAGE_BUCKET=innovation-judging.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_APP_ID=innovation-judging
```

### Step 3: Test Locally

```bash
npm run dev
```

Open your browser to `http://localhost:3000`

You should see the Innovation Judge landing page!

---

## Firebase Deployment

### Step 1: Login to Firebase

```bash
firebase login
```

This will open a browser window. Sign in with your Google account.

### Step 2: Initialize Firebase

```bash
firebase init
```

You'll see an interactive menu:

1. **Which Firebase features?** Use arrow keys and spacebar to select:
   - ✅ Firestore: Configure security rules and indexes
   - ✅ Hosting: Configure files for Firebase Hosting
   - Press Enter

2. **Use an existing project or create a new one?**
   - Select **"Use an existing project"**
   - Choose your project from the list

3. **What file should be used for Firestore Rules?**
   - Press Enter (uses default: `firestore.rules`)

4. **What file should be used for Firestore indexes?**
   - Press Enter (uses default: `firestore.indexes.json`)

5. **What do you want to use as your public directory?**
   - Type: `dist`
   - Press Enter

6. **Configure as a single-page app?**
   - Type: `y` (yes)
   - Press Enter

7. **Set up automatic builds and deploys with GitHub?**
   - Type: `n` (no, we'll set this up manually)
   - Press Enter

8. **File dist/index.html already exists. Overwrite?**
   - Type: `n` (no)
   - Press Enter

### Step 3: Build the App

```bash
npm run build
```

This creates a production build in the `dist` folder.

### Step 4: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

You should see:
```
✔ Deploy complete!
```

### Step 5: Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

You should see:
```
✔ Deploy complete!

Hosting URL: https://your-project-id.web.app
```

🎉 **Your app is now live!** Open the Hosting URL to test it.

---

## GitHub Actions Setup

Set up automatic deployment on every push to the main branch.

### Step 1: Generate Firebase Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Go to **IAM & Admin** > **Service Accounts**
4. Click **"Create Service Account"**
5. Name: `github-actions`
6. Click **"Create and Continue"**
7. Grant role: **"Firebase Hosting Admin"** and **"Cloud Datastore User"**
8. Click **"Continue"** then **"Done"**
9. Find your new service account and click the **⋮** menu
10. Click **"Manage keys"**
11. Click **"Add Key"** > **"Create new key"**
12. Choose **"JSON"**
13. Click **"Create"** - a JSON file will download

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **"Settings"** > **"Secrets and variables"** > **"Actions"**
3. Click **"New repository secret"** for each:

| Secret Name | Value |
|------------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | Paste the entire contents of the JSON file you downloaded |
| `VITE_FIREBASE_API_KEY` | Your Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase app ID |
| `VITE_APP_ID` | `innovation-judging` (or your custom ID) |

### Step 3: Test GitHub Actions

1. Make a small change to any file (e.g., edit README.md)
2. Commit and push:
   ```bash
   git add .
   git commit -m "Test GitHub Actions deployment"
   git push origin main
   ```
3. Go to your GitHub repository > **"Actions"** tab
4. Watch the deployment workflow run
5. Once complete, check your Firebase Hosting URL - it should be updated!

---

## Testing

### Test the Full Flow

1. **Landing Page**:
   - Enter judge name
   - Select school/section
   - Enter team name
   - Click "Start Scoring"

2. **Scoring Page**:
   - Check off items in the rubric
   - Watch the score counter update
   - Click "Submit Score"

3. **Dashboard**:
   - Verify the score appears in real-time
   - Check that it's grouped by school/section
   - Click "Export CSV" to download results

4. **Test Multiple Judges**:
   - Open the app in multiple browser windows/devices
   - Submit scores from different "judges"
   - Watch them appear in real-time on all dashboards

---

## Troubleshooting

### Issue: "Firebase: Error (auth/invalid-api-key)"

**Solution**: Your Firebase API key in `.env` is incorrect.
- Double-check your `.env` file
- Get the correct key from Firebase Console > Project Settings

### Issue: "Missing or insufficient permissions"

**Solution**: Firestore rules aren't deployed or are incorrect.
```bash
firebase deploy --only firestore:rules
```

### Issue: Blank page after deployment

**Solution**: Environment variables aren't set.
- For local: Check your `.env` file
- For GitHub Actions: Check GitHub Secrets
- Rebuild and redeploy

### Issue: "Cannot read properties of undefined (reading 'seconds')"

**Solution**: Timestamp hasn't loaded yet. This is normal on first load. Refresh the page.

### Issue: Build fails with "npm ERR!"

**Solution**:
```bash
# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

### Issue: Firebase CLI not found

**Solution**: Install globally:
```bash
npm install -g firebase-tools
```

### Need Help?

Open an issue on GitHub with:
- What you were trying to do
- What happened (error messages)
- Screenshots if applicable

---

## Next Steps

- Customize the rubric sections in `src/App.jsx` (lines 47-154)
- Modify school sections list (lines 37-48)
- Adjust colors and styling in `tailwind.config.js`
- Add your school/organization logo

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Congratulations!** 🎉 Your Innovation Judging App is now fully set up and deployed!
