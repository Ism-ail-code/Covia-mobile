# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Project context

Covia — ride sharing app. Three codebases (separate git repos under the same parent folder):

- `covia-mobile` (this repo) — Expo SDK 57 app, expo-router v57, React Native 0.86, React 19, reanimated 4, `lucide-react-native`. Dev client + EAS project (`eas.json`, projectId `08cafbe8-3bfc-4652-b91a-5df14bcb6597`, owner `waa_ge`).
- `covia-backend` — Supabase migrations + NestJS admin API. Supabase project ref `lnvtaatcktmcfrpawwil`, linked via CLI (`supabase db push` / `supabase db query --linked`).
- `covia-admin` — web admin app (not in this repo).

## Architecture notes

- Routing is file-based in `app/`. Root `app/_layout.tsx` uses a 3-way `Stack.Protected` guard driven by auth + onboarding step.
- Auth: Supabase PKCE (`detectSessionInUrl: false`, AsyncStorage). Email/password + OTP email verification + native Google Sign-In (`@react-native-google-signin/google-signin`, v16 API). All auth entry points in `AuthContext` await the profile load before resolving, so post-auth redirects are race-free.
- **Onboarding state machine** (persisted in DB, migration 0044, `profiles.onboarding_step`): `onboard` → `profile` → `verify` → `complete`. `src/lib/onboarding.ts` `homeRouteForStep()` is the only way screens compute post-auth destinations. Screens: `(flow)/onboard`, `(flow)/create-profile`, `(flow)/verification`. Verification flow mode uses `from=flow` or step `verify` to show the intro.
- Services: `src/services/` (supabase, profiles, verification, storage, imageCompression). Types: `src/types/`. UI kit: `src/components/ui/`, app chrome: `src/components/app/`.
- Design tokens in `src/theme` (colors, radius, shadows, gutter). Text via `AppText`, screens via `PhoneShell`/`Screen`, `TopBar`.
- Docs: `docs/` (AUTH_MIGRATION_PLAN.md, GOOGLE_SIGNIN_SETUP.md, AUTH_TEST_REPORT.md).

## Conventions

- No comments unless they explain non-obvious behavior (existing code has them for decisions).
- Supabase migrations: idempotent (`if not exists` / `add column if not exists`), numbered `0000_*.sql`, run via `supabase db push`. Migrations must be valid on hosted Supabase (no `storage.*` DDL — owner-only; no `now()` in index predicates — must be IMMUTABLE).
- Verification: docs upload to private `verification-documents` bucket (10 MB cap), RPCs `submit_verification`/`resubmit_verification`/`get_my_verification`, statuses pending/approved/rejected/expired/resubmission_requested. Client compresses > 2.5 MB images via `expo-image-manipulator`.

## Commands

- Typecheck: `npx tsc --noEmit`
- Run dev server: `npx expo start --tunnel`
- Rebuild dev client (needed after native deps change): `eas build --profile development --platform android`
- DB (from `covia-backend`): `supabase db push` / `supabase db query --linked "<sql>"`
