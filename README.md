# Companion (Covia) — Mobile App

The React Native (Expo SDK 57) client for **Covia**, a social ride-coordination
app: users post rides, join rides, and communicate while the vehicle is booked
through a third-party ride-hailing provider.

## Stack

| Layer         | Choice                                            |
| ------------- | ------------------------------------------------- |
| Framework     | Expo SDK 57 (React Native 0.86, React 19)         |
| Routing       | expo-router (file-based)                          |
| Auth          | Supabase Auth (email + password, PKCE)            |
| Session store | @react-native-async-storage/async-storage        |
| UI            | Custom components (`src/components/ui`) + lucide-react-native |
| Icons/Fonts   | Plus Jakarta Sans (display) + Inter (body)        |

## Quick start

Prerequisites: Node.js ≥ 20, npm.

```bash
npm install

# 1. Configure Supabase (see ../covia-backend/docs/SUPABASE_SETUP.md)
cp .env.example .env   # then fill in EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY

# 2. Run the app (iOS / Android / web preview)
npx expo start
```

Without real Supabase keys the app still boots; auth screens show a friendly
"Authentication is not configured yet" message.

## Environment variables

| Variable                        | Purpose                          | Safe to commit? |
| ------------------------------- | -------------------------------- | --------------- |
| `EXPO_PUBLIC_SUPABASE_URL`      | Supabase project URL             | Yes (public)    |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (RLS-protected)| Yes (public)    |

`.env` is git-ignored; only `.env.example` is committed.

## Project layout

```
app/
├── _layout.tsx          Root stack: AuthProvider + Stack.Protected guards
├── (auth)/              Welcome, login, register, forgot-password, verify,
│                        create-profile, onboarding (public)
├── (tabs)/              Home, Explore, Create ride, Activity, Profile
└── (app)/               Protected screens: chat, live, notifications, ratings,
                         safety, settings, verification, ride/[rideId], user/[userId]
src/
├── components/          UI kit + app components
├── context/             AuthContext (single source of truth for auth state)
├── services/            supabase client, profiles, auth error mapping
├── types/               UserProfile contract
├── lib/                 email/password validation
└── theme/               design tokens (colors, radius, shadows)
```

## Auth flow (Phase 2)

- **Register** → creates the Supabase auth user + `profiles` row (DB trigger)
  → confirmation email → deep link back into the app (`companion://verify`).
- **Login** → session persisted in AsyncStorage, restored on restart, access
  token auto-refreshed; unverified accounts are directed to the verify screen.
- **Logout** → session cleared; protected routes redirect to the welcome
  screen via `Stack.Protected`.
- **Forgot password** → reset email (`companion://reset`) → new password.
- All screens use `useAuth()` — no duplicated auth logic.

See `../covia-backend/docs/SUPABASE_SETUP.md` for the database schema and
manual test checklist.
