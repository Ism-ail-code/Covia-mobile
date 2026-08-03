# Covia Mobile — Feature Completeness Report (Phase 5)

Audited every user-facing screen in `covia-mobile` for: UI completeness, live backend
wiring (RPCs only — no mock data), loading states, empty states, error handling,
client-side validation, navigation/guards, and dead code. Verified with
`npx tsc --noEmit` and `npx expo export --platform web` (both green).

Date: 2026-08-04. Phase 4 admin console work was completed separately.

---

## 1. Summary

| Area | Screens audited | Status |
|---|---|---|
| Auth flow | welcome, onboarding, register, login, verify, forgot-password, **reset (was missing)** , create-profile | **Completed** — reset flow built end-to-end |
| Home | home tab (greeting, feed, activity, safety tips) | **Completed** — personalization + genuine nearby feed |
| Ride lifecycle | create, explore, ride detail, active/live ride, activity, chat | Completed — no gaps beyond polish |
| Profile & account | profile, settings, user public profile, ratings | Completed |
| Safety | safety centre, emergency contact | Completed |
| Notifications | notifications list, unread badge, realtime | Completed |
| Verification | verification status + submission | Completed |
| Admin in-app | admin/** | Out of scope (admin console is its own web app) |
| Infrastructure | AuthContext, deep links, validation, services | **Completed** — reset deep link fixed, dead code removed |

**Critical gaps found and fixed (3):**

1. **Password-reset flow was entirely unimplemented** — the reset email linked to
   `covia://reset`, but no screen existed, `isAuthDeepLink` ignored the `reset` path,
   and nothing ever called `updateUser({ password })`. Built end-to-end (see §3).
2. **Verify screen dead-ended for brand-new signups** — with PKCE there is no session
   after `signUp`, so the screen showed "your email" and resend threw "We don't know
   your email yet". Register now forwards the email to `/verify`.
3. **Signup stepper dangled at "Step 2 of 3"** — `create-profile` (step 3) was
   unreachable from the signup flow. Now wired for both confirmation-on and
   confirmation-off paths.

---

## 2. Audit results by screen

### 2.1 Auth screens

| Screen | UI | Backend | Loading | Error | Validation | Notes |
|---|---|---|---|---|---|---|
| Welcome (`index`) | ✅ | — | — | — | — | Route links only |
| Onboarding | ✅ | location permission | — | ⚠️ silent `.catch(() => {})` | — | |
| Register | ✅ | `signUp` → user_metadata | ✅ busy | ✅ `authErrorMessage` | ✅ name/email/password/phone | **Fixed:** terms checkbox no longer pre-checked |
| Login | ✅ | `signIn` | ✅ busy | ✅ | ✅ | |
| Verify | ✅ | `resendVerification` | ✅ busy | ✅ | — | **Fixed:** email forwarded from register; resend works pre-session |
| Forgot password | ✅ | `resetPasswordForEmail` | ✅ busy | ✅ | ✅ email | Now lands on the new reset screen |
| **Reset (NEW)** | ✅ | `exchangeCodeForSession` + `updateUser({ password })` | ✅ spinner | ✅ invalid/expired states | ✅ `validatePassword` + confirm match | Built in this phase |
| Create profile | ✅ | `uploadAvatar` + `updateProfilePatch` | ✅ busy/uploading | ✅ | ✅ username/phone/DOB | **Fixed:** now step 3; **added** phone + gender + DOB fields |

### 2.2 Home (`app/(tabs)/home.tsx`)

- **Fixed — static greeting:** time-based `Good morning / afternoon / evening`.
- **Fixed — hardcoded city fallback:** the `MapPin` row only renders when
  `profile.homeCity` is set (no more fake "Lagos, Nigeria").
- **Fixed — duplicated feed:** "Nearby rides" now calls `search_rides` with
  `p_origin = profile.homeCity` (ILIKE city match) and falls back to the general feed
  when no home city is set; "Recommended for you" shows the general departure-sorted
  feed. Sections are no longer identical slices of one unfiltered list.
- All backend calls verified: `searchRides`, `getRideHistory`, `getUnreadCount`,
  `subscribeToNotifications`, `subscribeToNotificationChanges`.
- Loading skeleton for feed, empty state for recent activity, silent degradation on
  feed errors (explore surfaces errors) — acceptable, documented.

### 2.3 Ride lifecycle

- Create: full form validation, structured locations, fare modes, `create_ride`/`update_ride`
  RPCs. No gaps.
- Explore: filters (origin, destination, date, seats, student/women-only), pagination,
  error + empty states. No gaps.
- Ride detail (`/ride/[rideId]`): status-aware actions (join/request, host start/complete/
  cancel), request approvals, seats/fare display. No gaps.
- Live ride + activity: in-progress status, timeline. No gaps.
- Chat: `get_chat`, `get_chat_messages`, `send_chat_message`, `mark_messages_read`
  RPCs + realtime subscription; read receipts mapped. Verified against migration
  `0020_chat_service.sql`. No gaps.

### 2.4 Profile, safety, notifications, settings, ratings, verification

All wire to live RPCs (`update_profile`, `trigger_sos`, `report_user`,
`register_emergency_contact`, `submit_verification`, `get_public_profile`,
notification read/unread + realtime). Loading/empty/error states present. No gaps found.

### 2.5 Mock data & dead code

- **No mock/dummy imports anywhere** (grep for `mock|MOCK|dummy|from "../mock"` → 0 hits).
- **Removed dead code:** `changeUsername` (AuthContext public API), `isUsernameAvailable`
  and `updateUsername` (profiles service) — all unused.
- `searchProfiles` kept (wraps documented `search_profiles` RPC; future community feature).

---

## 3. Password reset — what was built

| Piece | Implementation |
|---|---|
| Screen | `app/(auth)/reset.tsx` — new-password + confirm form, busy spinner while exchanging, success and invalid/expired states |
| Deep link | `authDeepLinkKind()` now recognises `code=…&…reset…` URLs; `handleUrl` exchanges the PKCE code for the recovery session and sets `resetReady`/`resetError` |
| Route | `app/(auth)/reset.tsx` matches the `covia://reset` path that `Linking.createURL("reset")` produces |
| New password | `AuthContext.updatePassword()` → `supabase.auth.updateUser({ password })`, then `signOut()` and back to login |
| Cold start | Screen reads the `code` search param so it can show the correct state before the exchange resolves |
| Error handling | Failed/expired exchange → "Link expired" screen with "Request a new link" → forgot-password |

## 4. Signup flow — what changed

```
register ──(confirmations ON)──▶ verify ──(emailVerified)──▶ create-profile ──▶ home
register ──(confirmations OFF)─▶ create-profile ────────────────────────────▶ home
```

- `register` → `/verify` with `{ email, from: "signup" }`; verify masks and can resend
  using that email even before a session exists.
- Verify redirects new signups to `/create-profile` (step 3) instead of straight home.
- `create-profile` shows "Step 3 of 3 — About you" when `from=signup`; when opened from
  Profile/Settings it stays "Edit profile".
- `create-profile` now also collects **phone** (persisted to `profiles.phone`), **date of
  birth** (yyyy-mm-dd, validated) and **gender** (chips from `GENDERS`).
- Verification emails keep `?from=signup` in the redirect URL so cold-start verification
  still lands on step 3.

## 5. Validation & hygiene

- `PHONE_PATTERN` tightened: still 7–20 chars of digits/spaces/dashes/parens/dots/`+`,
  but now **requires 7–15 actual digits** (rejects `+++++++`, `()()()()`).
- Terms-of-service checkbox on register now defaults to **unchecked** (explicit opt-in).
- Onboarding location-permission silent failure left as-is (permission is optional by
  design; "Not now" is a first-class action).

---

## 6. Verification

- `npx tsc --noEmit` — ✅ clean.
- `npx expo export --platform web` — ✅ exported successfully.

## 7. Known caveats (by design / not bugs)

- `covia://` deep links (verify/reset) only open in dev/standalone builds, not Expo Go
  (`exp://`) — requires EAS build + scheme registration (already in `app.json`).
- PKCE code verifier is stored per device — resend the link on the same device that
  opened it.
- DOB/gender/phone are private fields (never exposed via `public_profiles`).
- Admin in-app screens are intentionally out of scope (dedicated web console).
