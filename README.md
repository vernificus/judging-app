# Innovation Day Judging App

A real-time scoring and judging application for Innovation Day 2025-2026, built with React, Vite, and Firebase.

## Features

- **Real-time Scoring**: Judges can score teams using an interactive checklist
- **Live Dashboard**: View all submissions in real-time grouped by school/section
- **Data Export**: Export results to CSV for further analysis
- **Mobile Responsive**: Works seamlessly on phones, tablets, and desktops
- **Offline Support**: Firebase handles offline data sync
- **Anonymous Authentication**: Secure access without requiring user accounts

## Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend**: Firebase (Firestore + Authentication + Hosting)
- **Deployment**: Firebase Hosting with GitHub Actions CI/CD

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project (create one at [console.firebase.google.com](https://console.firebase.google.com))

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd judging-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Project Setup

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

#### Enable Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll use custom security rules)
4. Select a Cloud Firestore location (choose closest to your users)

#### Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Anonymous** authentication
5. Click **Save**

#### Get Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click the web icon `</>`
4. Register your app with a nickname (e.g., "Innovation Judging App")
5. Copy the `firebaseConfig` object values

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_APP_ID=innovation-judging
```

### 5. Firebase Login

```bash
firebase login
```

### 6. Initialize Firebase in Your Project

```bash
firebase init
```

Select:
- **Firestore**: Configure security rules and indexes
- **Hosting**: Configure hosting settings

Use the existing files when prompted:
- Firestore rules: `firestore.rules`
- Firestore indexes: `firestore.indexes.json`
- Public directory: `dist`

### 7. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:3000`

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## Deployment

### Manual Deployment

```bash
npm run deploy
```

This builds the app and deploys to Firebase Hosting.

### Automatic Deployment with GitHub Actions

The repository includes a GitHub Actions workflow that automatically deploys to Firebase on every push to the main branch.

#### Setup GitHub Actions

1. Generate a Firebase CI token:
   ```bash
   firebase login:ci
   ```

2. Copy the token that's generated

3. Add the token to GitHub Secrets:
   - Go to your GitHub repository
   - Navigate to **Settings** > **Secrets and variables** > **Actions**
   - Click **New repository secret**
   - Name: `FIREBASE_TOKEN`
   - Value: paste your Firebase CI token
   - Click **Add secret**

4. Add Firebase config as GitHub secrets (for environment variables):
   - Add each environment variable from your `.env` file as a GitHub secret
   - Names: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.

5. Push to main branch - deployment will happen automatically!

## Project Structure

```
judging-app/
├── src/
│   ├── App.jsx           # Main application component
│   ├── main.jsx          # Application entry point
│   └── index.css         # Global styles with Tailwind
├── public/               # Static assets
├── dist/                 # Production build (generated)
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml  # CI/CD configuration
├── firebase.json         # Firebase configuration
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment template
├── vite.config.js        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
└── package.json          # Dependencies and scripts
```

## Usage

### For Judges

1. Open the app URL
2. Enter your name as the judge
3. Select the school/section
4. Enter the team name
5. Click "Start Scoring"
6. Check off items as the team presents
7. Click "Submit Score" when done
8. View the dashboard to see all scores

### For Administrators

1. Access the dashboard to see real-time scores
2. Click "Export CSV" to download all results
3. Filter and analyze data by school/section

## Firestore Data Structure

```
artifacts/
└── {appId}/
    └── public/
        └── data/
            └── scores/
                └── {scoreId}
                    ├── judgeName: string
                    ├── schoolSection: string
                    ├── teamName: string
                    ├── checklist: object
                    ├── totalScore: number
                    ├── maxPossible: number
                    ├── timestamp: timestamp
                    └── userId: string
```

## Security

- Firestore security rules ensure only authenticated users can read/write
- Users can only modify their own submissions
- Anonymous authentication provides security without requiring login
- Environment variables keep sensitive config secure

## Troubleshooting

### Firebase Connection Issues

- Verify your `.env` file has correct Firebase config
- Check that Firestore and Authentication are enabled in Firebase Console
- Ensure Anonymous authentication is enabled

### Build Errors

- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Clear cache: `npm cache clean --force`
- Verify Node.js version is 18+

### Deployment Issues

- Make sure you're logged into Firebase CLI: `firebase login`
- Verify the Firebase project is correctly set: `firebase projects:list`
- Check that the `dist` folder exists after building

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

See LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.
