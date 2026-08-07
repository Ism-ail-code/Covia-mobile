/**
 * Onboarding lifecycle helpers.
 *
 * The onboarding step lives on the profile row (migration 0044) so it
 * survives reinstalls and app closures:
 *   onboard  → app/(flow)/onboard        (post-verification welcome)
 *   profile  → app/(flow)/create-profile (profile setup)
 *   verify   → app/(flow)/verification   (identity verification intro)
 *   complete → app/(tabs)/home           (normal app)
 *
 * Every post-auth navigation goes through `homeRouteForStep` — screens
 * never hardcode where the user lands.
 */

import type { OnboardingStep } from "../types/profile";

export const ONBOARDING_STEPS: {
  value: OnboardingStep;
  label: string;
  route: string;
}[] = [
  { value: "onboard", label: "Welcome", route: "/onboard" },
  { value: "profile", label: "Profile setup", route: "/create-profile" },
  { value: "verify", label: "Identity verification", route: "/verification" },
  { value: "complete", label: "Done", route: "/home" },
];

/** The route the user should land on for a given onboarding step. */
export function homeRouteForStep(step: OnboardingStep): string {
  const entry = ONBOARDING_STEPS.find((s) => s.value === step);
  return entry?.route ?? "/home";
}
