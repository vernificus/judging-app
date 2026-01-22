# Deployment Steps for Innovation Judging App

Your app is configured and ready to deploy! Follow these steps to get it live on Firebase Hosting.

## ✅ What's Already Done

- ✅ Firebase credentials configured (.env file created)
- ✅ Project built successfully (dist folder created)
- ✅ Firebase project linked (school-experiments-5bc99)
- ✅ Firestore rules and indexes ready
- ✅ Firebase Analytics enabled
- ✅ All dependencies installed

## 🔧 Required Firebase Setup Steps

Before deploying, you need to enable two services in the Firebase Console:

### Step 1: Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/project/school-experiments-5bc99/firestore)
2. Click **"Create Database"** (if not already created)
3. Choose **"Start in production mode"**
4. Select your preferred location (e.g., `us-central`, `us-east1`)
5. Click **"Enable"**

### Step 2: Enable Anonymous Authentication

1. Go to [Firebase Console Authentication](https://console.firebase.google.com/project/school-experiments-5bc99/authentication)
2. Click **"Get Started"** (if first time)
3. Click the **"Sign-in method"** tab
4. Find **"Anonymous"** in the providers list
5. Toggle it to **"Enabled"**
6. Click **"Save"**

### Step 3: Enable Firebase Hosting (if needed)

1. Go to [Firebase Console Hosting](https://console.firebase.google.com/project/school-experiments-5bc99/hosting)
2. Click **"Get Started"** (if first time)
3. Follow the wizard (we'll deploy via CLI below)

## 🚀 Deployment Commands

Once the Firebase services are enabled, run these commands:

### 1. Login to Firebase

```bash
firebase login
```

This will open a browser window - sign in with your Google account that has access to the `school-experiments-5bc99` project.

### 2. Verify Project Connection

```bash
firebase projects:list
```

You should see `school-experiments-5bc99` in the list.

### 3. Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore
```

Expected output:
```
✔ Deploy complete!
```

### 4. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Expected output:
```
✔ Deploy complete!

Hosting URL: https://school-experiments-5bc99.web.app
```

### 5. (Optional) Deploy Everything at Once

If you want to deploy both Firestore and Hosting together:

```bash
firebase deploy
```

## 🎯 Your Live App URL

After successful deployment, your app will be available at:

**https://school-experiments-5bc99.web.app**

or

**https://school-experiments-5bc99.firebaseapp.com**

## 🧪 Testing the Deployed App

1. Open the URL in your browser
2. You should see the Innovation Judge landing page
3. Fill in:
   - Judge Name: "Test Judge"
   - School/Section: Select any school
   - Team Name: "Test Team"
4. Click "Start Scoring"
5. Check a few items in the rubric
6. Click "Submit Score"
7. Navigate to "View Dashboard"
8. You should see your test score appear in real-time!

## 🔄 Future Deployments

After making changes to your app:

```bash
# 1. Make your changes to the code
# 2. Build the app
npm run build

# 3. Deploy
firebase deploy --only hosting
```

Or use the shortcut:
```bash
npm run deploy
```

## 📊 Monitoring Your App

### View Analytics

Go to [Analytics Dashboard](https://console.firebase.google.com/project/school-experiments-5bc99/analytics) to see:
- Active users
- Page views
- User engagement
- And more!

### View Firestore Data

Go to [Firestore Console](https://console.firebase.google.com/project/school-experiments-5bc99/firestore) to see:
- All submitted scores
- Real-time updates as judges submit scores
- Data structure and collections

### View Hosting Metrics

Go to [Hosting Dashboard](https://console.firebase.google.com/project/school-experiments-5bc99/hosting) to see:
- Deployment history
- Bandwidth usage
- Request counts

## 🤖 Optional: Set Up GitHub Actions Auto-Deploy

To automatically deploy when you push to GitHub:

### 1. Generate Firebase CI Token

```bash
firebase login:ci
```

Copy the token that's generated.

### 2. Add GitHub Secrets

Go to your GitHub repository settings and add these secrets:

| Secret Name | Value |
|------------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | (Create a service account in Google Cloud Console) |
| `VITE_FIREBASE_API_KEY` | `AIzaSyDzILEcNcn7-Y2vyGcVtl7ut7XxMcnMHGY` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `school-experiments-5bc99.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `school-experiments-5bc99` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `school-experiments-5bc99.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `413467320532` |
| `VITE_FIREBASE_APP_ID` | `1:413467320532:web:c2a65c66bdc3afd7b49b41` |
| `VITE_FIREBASE_MEASUREMENT_ID` | `G-BBHYKKB3WN` |
| `VITE_APP_ID` | `innovation-judging` |

### 3. Push to Main Branch

The GitHub Actions workflow (`.github/workflows/firebase-deploy.yml`) will automatically deploy your app!

## 🆘 Troubleshooting

### Error: "Missing or insufficient permissions"

**Solution**: Make sure you deployed the Firestore rules:
```bash
firebase deploy --only firestore:rules
```

### Error: "Firebase: Error (auth/invalid-api-key)"

**Solution**: Your `.env` file is missing or incorrect. It should already be set up, but double-check it exists.

### Error: "Permission denied" when deploying

**Solution**: Make sure you're logged in to Firebase:
```bash
firebase logout
firebase login
```

### Build succeeds but deployment fails

**Solution**: Make sure the `dist` folder exists:
```bash
ls -la dist/
```

If it's missing:
```bash
npm run build
```

### Can't access Firebase Console links

**Solution**: Make sure you're signed in to Google with the account that owns the `school-experiments-5bc99` project.

## 📝 Summary

Your app is ready to deploy! Here's the quick checklist:

- [ ] Enable Firestore Database in Firebase Console
- [ ] Enable Anonymous Authentication in Firebase Console
- [ ] Run `firebase login`
- [ ] Run `firebase deploy --only firestore`
- [ ] Run `firebase deploy --only hosting`
- [ ] Open https://school-experiments-5bc99.web.app
- [ ] Test the app end-to-end

**Questions?** Check the main README.md or SETUP_GUIDE.md files for more details!
