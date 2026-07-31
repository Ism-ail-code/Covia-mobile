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

## Profile system (Phase 3)

- **Profile** (Create-profile screen): display name, unique username
  (3–20 chars, `[a-z0-9_]`, reserved names protected, availability RPC),
  home city, country, bio — plus profile photo upload (expo-image-picker →
  Supabase Storage `avatars` bucket, 5 MB jpeg/png/webp, replaced on
  re-upload, only the public URL stored).
- **Emergency contact** (Safety centre): add / edit / remove, validated
  all-or-nothing record; SOS alerts route to it later.
- **Public vs private**: `src/types/profile.ts` defines `UserProfile`
  (private) and `PublicProfile` (public). Other users only ever read the
  `public_profiles` view (`get_public_profile` / `search_profiles` RPCs) —
  email, phone, DOB, gender and emergency contacts never leave the private
  row (RLS).
- **Reliability metrics** (`totalCompletedRides`, `totalCancelledRides`,
  `reliabilityScore`) are stored with defaults; `complete_ride` /
  `cancel_ride` (Phase 5) maintain the ride counters.

## Identity verification (Phase 4)

- **Verification screen** (`app/(app)/verification.tsx`): Government ID and
  Student ID flows with live status — upload documents (front/back/selfie
  for IDs; student card or university email for students), pending /
  approved / rejected (with the admin's reason) / expired cards, and
  "Submit again" resubmission after a rejection.
- **Private document storage**: documents upload to the
  `verification-documents` bucket (10 MB jpeg/png/webp) under
  `verification/<user-id>/…` — invisible to everyone except the owner and
  admins (RLS). Only object paths are stored; rendering uses signed URLs.
- **Service** (`src/services/verification.ts`): upload + submit/resubmit
  RPCs (`submit_verification`, `resubmit_verification`,
  `get_my_verification`) with friendly error mapping, and `isUserVerified()`
  — the gate for ride creation/joining.
- **Review is backend-only** (no admin UI): admins are promoted in
  `admin_users` via SQL and review through `admin_list_verifications` /
  `admin_review_verification` RPCs; approval flips the profile badge
  (`verification_status = Verified` + `isGovernmentIdVerified` /
  `isStudentVerified`).

## Rides (Phase 5)

- **Models** (`src/types/ride.ts`): `Ride`, `RideRequest`,
  `RideParticipant`, `RideTimelineEvent` mirroring migrations 0009–0013;
  status/fare/event label maps for UI; `RideSearchFilters`.
- **Service** (`src/services/rides.ts`): every RPC — create/publish/update
  (host), request/withdraw/leave (passenger), respond (host),
  start/complete/cancel (host), search/get/requests/participants/timeline
  (read). Client-side `validateRideInput` matches the server rules;
  `RideError` maps SQLSTATEs and messages to friendly text. Numeric
  columns (numeric/bigint) are cast from strings.
- **Rules enforced server-side**: verified-only creation/joining; manual
  host approval (no instant join); capacity checks (last seat → `full`);
  no overlapping rides within 6h; seats can't drop below approved
  passengers; host-only lifecycle edits; every state change lands in the
  ride timeline.
- **Screens are not wired yet** — the existing `(tabs)/create.tsx` and
  `explore.tsx` still show mock-data UIs. Wire them to this service when
  the ride UI phase starts.
- Ride RPC reference: `../covia-backend/docs/API_DOCUMENTATION.md`.

See `../covia-backend/docs/DATABASE_SCHEMA.md` for the schema and
`../covia-backend/docs/SUPABASE_SETUP.md` for setup + the manual test
checklist.
