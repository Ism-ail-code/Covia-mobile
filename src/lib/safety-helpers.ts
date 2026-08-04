/**
 * Covia Safety Helpers — safety-related display and validation utilities.
 */

/** Get a label for an emergency contact relationship. */
export function getRelationshipLabel(relationship: string): string {
  const labels: Record<string, string> = {
    parent: "Parent",
    sibling: "Sibling",
    spouse: "Spouse",
    partner: "Partner",
    friend: "Friend",
    colleague: "Colleague",
    other: "Other",
  };
  return labels[relationship.toLowerCase()] ?? relationship;
}

/** Get a label for a safety event type. */
export function getSafetyEventLabel(type: string): string {
  const labels: Record<string, string> = {
    sos_triggered: "SOS Triggered",
    check_in_completed: "Safety Check Completed",
    check_in_missed: "Missed Safety Check",
    location_shared: "Location Shared",
    ride_monitored: "Ride Monitored",
    route_deviation: "Route Deviation",
    stop_detected: "Unexpected Stop",
  };
  return labels[type] ?? type;
}

/** Get a severity level for a safety event. */
export function getSafetySeverity(type: string): "low" | "medium" | "high" | "critical" {
  const severity: Record<string, "low" | "medium" | "high" | "critical"> = {
    sos_triggered: "critical",
    check_in_missed: "high",
    route_deviation: "high",
    stop_detected: "medium",
    check_in_completed: "low",
    location_shared: "low",
    ride_monitored: "low",
  };
  return severity[type] ?? "low";
}

/** Check if a safety event requires immediate action. */
export function requiresImmediateAction(type: string): boolean {
  return ["sos_triggered", "check_in_missed"].includes(type);
}

/** Format check-in interval for display. */
export function formatCheckInInterval(minutes: number): string {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
  return `${hours}h ${remaining}m`;
}
