# Auth Test Report — Phase 10 (OTP + Google Sign-In)

Test date / tester: _fill in_
Build: development APK (EAS) with `@react-native-google-signin/google-signin`
Backend: Supabase project with Google provider + OTP email template (`{{ .Token }}`)

## Preconditions

- [ ] `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` set in `.env`
- [ ] `google-services.json` at repo root, committed
- [ ] Supabase → Google provider enabled with the Web client ID
- [ ] Magic Link template renders `{{ .Token }}`
- [ ] New dev build installed (`eas build --profile development --platform android`)
- [ ] Dev server reachable (`npx expo start --tunnel`)

## Test matrix

### Google Sign-In

| # | Case | Expected | Pass |
| - | ---- | -------- | ---- |
| 1 | New Google account (never seen) | Native sheet opens; profile created; lands on `/create-profile` (username empty) | ☐ |
| 2 | Existing Google account (signed in before) | Lands on `/home` directly | ☐ |
| 3 | Existing email account with same address | Signs into that account (Supabase links identity); ride/chat history intact | ☐ |
| 4 | Cancel the Google sheet | Returns silently, no error banner | ☐ |
| 5 | Google profile photo copied | Avatar appears on profile after first sign-in | ☐ |
| 6 | Airplane mode → tap Google | Friendly offline message, retry works | ☐ |

### Email OTP — signup

| # | Case | Expected | Pass |
| - | ---- | -------- | ---- |
| 7 | Fresh signup | Lands on OTP screen; code auto-sent; email shows masked address | ☐ |
| 8 | Correct code | Success animation → `/create-profile` | ☐ |
| 9 | Wrong code | "That code is invalid or has expired…" error; boxes shake; input cleared for retry | ☐ |
| 10 | Resend button during countdown | Disabled; shows "Resend available in m:ss" | ☐ |
| 11 | Resend after countdown | New code arrives; typing the new code verifies | ☐ |
| 12 | Code pasted as one blob | Auto-fills all 6 boxes | ☐ |
| 13 | Kill app mid-verify, reopen | OTP screen restarts and re-sends | ☐ |

### Email OTP — expired / abuse

| # | Case | Expected | Pass |
| - | ---- | -------- | ---- |
| 14 | Enter code after 1h expiry (or use an old email) | Friendly expired message + resend | ☐ |
| 15 | Hammer resend | Server 60s throttle → friendly "wait a minute" error; client countdown stays on | ☐ |
| 16 | `shouldCreateUser: false` | Entering OTP for a nonexistent email does **not** create an account | ☐ |

### Email + password (regression)

| # | Case | Expected | Pass |
| - | ---- | -------- | ---- |
| 17 | Confirmed account login | `/home` | ☐ |
| 18 | Unconfirmed account login | Routed to OTP screen | ☐ |
| 19 | Wrong password ×4 | Exponential backoff message ("Too many attempts…") | ☐ |
| 20 | Duplicate signup email | Friendly "account already exists" | ☐ |

### Sessions

| # | Case | Expected | Pass |
| - | ---- | -------- | ---- |
| 21 | Log in, kill app, reopen | Session restored (no login screen) | ☐ |
| 22 | Logout → login again (both Google + password) | Works; no stale data | ☐ |
| 23 | Reset password via `covia://reset` link | Reset screen accepts new password; login with it works | ☐ |

### Accessibility / UX

| # | Case | Expected | Pass |
| - | ---- | -------- | ---- |
| 24 | Screen reader on OTP screen | "6-digit code" label announced; boxes tappable | ☐ |
| 25 | OTP auto-submit | Last digit → spinner → success without pressing a button | ☐ |
| 26 | Landscape/rotate mid-flow | No clipped input; KeyboardAvoidingView works | ☐ |

## Known issues

- _none so far_ — list anything found here with repro steps.

## Conclusion

- [ ] All critical tests pass
- [ ] No regression in password/reset flows
- [ ] RLS / RPCs / sessions untouched (verified: zero DB changes in Phase 10)
