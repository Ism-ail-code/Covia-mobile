# Google Sign-In Setup Guide (Phase 10)

Native Google Sign-In needs three pieces configured together:

1. **Google Cloud Console** — OAuth client IDs (Web + Android + iOS)
2. **This repo** — `google-services.json`, `.env`, `app.json`
3. **Supabase dashboard** — Google provider enabled with the same client IDs

> The Android/iOS config files contain **only public client IDs** (they ship
> inside the app binary anyway) — commit them to git so EAS can build with
> them. The OAuth **secret** never leaves Google Cloud Console.

---

## Step 1 — Google Cloud Console

1. Go to <https://console.cloud.google.com/> → create/select a project (e.g. `Covia`).
2. **APIs & Services → OAuth consent screen**: fill app name, support email;
   add test users if you're not publishing (or use "Testing" status for now).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:

### 1a. Web client ID (required — Supabase + app both use it)
- Application type: **Web app**
- Authorized redirect URIs: (leave empty — we never redirect)
- Copy the client ID (ends in `.apps.googleusercontent.com`) → **Step 2a** and **Step 3a**

### 1b. Android client ID (required — the phone actually signs in with this)
- Application type: **Android**
- Package name: `app.covia.mobile`
- **SHA-1 signing certificate fingerprint**: from your EAS keystore:

  ```sh
  eas credentials --platform android
  ```

  (select the project/keystore → it prints the SHA-1). If you prefer a local
  build, use the debug keystore fingerprint:

  ```sh
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  ```

- Download the generated **`google-services.json`** → save at repo root as `google-services.json`.

### 1c. iOS client ID (future iOS builds; harmless to create now)
- Application type: **iOS**
- Bundle ID: `app.covia.mobile`
- Note the client ID; the **reversed** version (dots reversed, e.g.
  `com.googleusercontent.apps.1234567890-abcd`) goes into `app.json`
  (`ios.googleSignIn.reservedClientId`). The iOS plist
  (`GoogleService-Info.plist`) is only needed for an iOS build.

---

## Step 2 — Repo config

### 2a. `.env` (never committed)

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=XXXX.apps.googleusercontent.com
```

### 2b. `google-services.json`

Saved at the repo root (Android). Already referenced from `app.json`:
`android.googleServicesFile: "./google-services.json"`.

---

## Step 3 — Supabase dashboard

1. **Authentication → Providers → Google** → enable.
2. Paste the **Web client ID** into the client ID field (this is what
   `signInWithIdToken` validates against).
3. (Recommended) Add the **iOS client ID** as well for future iOS builds.
4. Redirect URLs are **not** needed for native sign-in (the ID token comes
   back directly, no browser redirect).

---

## Step 4 — Rebuild the dev client

Native module (`@react-native-google-signin/google-signin`) — the old APK
won't have it:

```sh
eas build --profile development --platform android
```

Install the APK on the phone, then connect to the dev server
(`npx expo start --tunnel`) as usual.

---

## Verification

- [ ] `npx tsc --noEmit` passes
- [ ] App boots; welcome screen shows "Continue with Google"
- [ ] Tapping it opens the native account sheet (no browser)
- [ ] Cancel → returns silently
- [ ] New Google account → lands on `/create-profile`
- [ ] Existing Google account → lands on `/home`
- [ ] Existing email account (same address) → signs into that account
