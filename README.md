# ICS App – Firebase Hosting + Backend

This workspace hosts the React app from `ics-app` on Firebase Hosting and uses a Firebase Functions backend endpoint for Gemini requests.

## 1) Frontend environment (`ics-app/.env`)

Add your Firebase web app values:

```powershell
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_API_BASE_URL=/api
```

## 2) Install dependencies

```powershell
cd "h:\Hosted online\Workspace"
npm --prefix functions install
npm --prefix ics-app install
```

## 3) Set backend Gemini secret (server-side)

```powershell
firebase functions:secrets:set GEMINI_API_KEY
```

## 4) Build and deploy

```powershell
npm --prefix ics-app run build
firebase deploy --only functions,hosting,storage
```

## 5) Local development

```powershell
npm --prefix ics-app start
```

`firebase.json` rewrites `/api/**` to the `geminiProxy` function, so the UI can call `/api/gemini` without exposing the Gemini key in the browser.
