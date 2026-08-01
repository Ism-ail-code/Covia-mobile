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
  `RideParticipant`, `RideTimelineEvent`, `RideLocation` (structured
  locations: display name + optional lat/lng/place id),
  `PickupType` + labels, `RideHistoryEntry`/`RideHistoryRelation`
  mirroring migrations 0009–0016; status/fare/event label maps for UI
  (incl. `expired` status and `dropped`/`expired` events);
  `RideSearchFilters`.
- **Service** (`src/services/rides.ts`): every RPC — create (structured
  locations + pickup type + optional visibility schedule)/publish/update/
  delete-draft (host), request/withdraw/leave (passenger), respond/
  remove-passenger (host), start/complete/cancel (host),
  search/get/requests/participants/timeline/history (read). Client-side
  `validateRideInput` matches the server rules (locations, pickup
  point must be a public place, visibility before departure);
  `RideError` maps SQLSTATEs and messages to friendly text. Numeric
  columns (numeric/bigint) are cast from strings.
- **Rules enforced server-side**: verified-only creation/joining; manual
  host approval (no instant join); capacity checks (last seat → `full`);
  no overlapping rides within 6h; seats can't drop below approved
  passengers; host-only lifecycle edits; pickup points must be
  public places (main road/landmark/university/bus stop/metro
  station/shopping centre); rides left unpublished past departure
  auto-expire (pg_cron + lazily on read); every state change lands in
  the ride timeline.
- **Screens are not wired yet** — the existing `(tabs)/create.tsx` and
  `explore.tsx` still show mock-data UIs. Wire them to this service when
  the ride UI phase starts.
- Ride RPC reference: `../covia-backend/docs/API_DOCUMENTATION.md`.

## Notifications (Phase 6)

- **Models** (`src/types/notifications.ts`): `AppNotification` (feed
  row with `totalCount`), `NotificationType` union (23 types),
  `NotificationPage`, `NotificationPreferences` (incl. `chatEnabled`).
- **Service** (`src/services/notifications.ts`): paged feed with
  unread filter, unread badge count, mark-read (single/all), delete,
  preferences read/update (coalescing — only provided values change),
  push-token registration (`android`/`ios`), and a `postgres_changes`
  subscription on `notifications` for live rows.
- The feed is **read-only by design**: every mutation goes through a
  security-definer RPC (RLS has no write grants).

## Ride chat (Phase 7)

- **Models** (`src/types/chat.ts`): `Chat` (ride context +
  `participantCount`), `ChatMessage` (text/image, soft delete,
  edit timestamps, `readCount`), `ChatMessagePage`.
- **Service** (`src/services/chat.ts`): `getChat`, message feed with
  cursor pagination (`p_before` = oldest loaded `sentAt`; newest-first),
  `sendChatMessage` (text ≤ 2000 chars) / `sendChatImage` (`media_url`),
  edit/delete own messages, `markMessagesRead(through)`,
  `searchChatMessages`, realtime subscriptions on `chat_messages` +
  `message_reads` (filtered by `chat_id`).
- Archive/lock rules are enforced server-side: the chat closes when the
  ride ends and locks 2h later — sends fail with friendly errors.

## Safety (Phase 8)

- **Models** (`src/types/safety.ts`): `EmergencyContact`,
  `SafetyConfig`, `SafetyEvent`, `LiveLocation`, `RideMonitoring`,
  safety realtime payloads and severities.
- **Service** (`src/services/safety.ts`): emergency contact CRUD
  (validated phone), `triggerSos`, `respondSafetyCheck` (gated behind
  `unlockWithBiometrics` for the "I'm safe" path), live-location
  sharing with an **offline queue** (`covia.safety.liveLocationQueue`
  in AsyncStorage, flushed on reconnect), `stopLiveLocation`,
  `setPlannedRoute`, suspend/resume monitoring, incident reports,
  realtime subscriptions on `live_locations` + `safety_events`, and
  device helpers (`requestLocationPermission`, `getCurrentPosition`).
- Depends on `expo-location` (~57.0.7) + `expo-local-authentication`
  (~57.0.2), configured in `app.json` with usage-description copy.

See `../covia-backend/docs/DATABASE_SCHEMA.md` for the schema and
`../covia-backend/docs/SUPABASE_SETUP.md` for setup + the manual test
checklist.
