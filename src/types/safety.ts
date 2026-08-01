/**
 * Safety models — emergency contacts, safety events, live locations,
 * ride monitoring and the tunable safety config.
 *
 * Mirrors the Phase 8 Supabase schema (0021_safety_schema.sql +
 * 0022_safety_service.sql). The client never touches the underlying
 * tables directly: reads flow through RLS (SELECT only) or the read
 * RPCs, and every mutation goes through a security-definer RPC.
 */

export type SafetySeverity = "info" | "warning" | "critical";

export type SafetyEventType =
  | "sos"
  | "route_deviation"
  | "long_stop"
  | "safety_check"
  | "safety_confirmed"
  | "manual_report"
  | "emergency_escalation"
  | "ride_never_started"
  | "ride_duration_exceeded";

export type SafetyCheckKind = "long_stop" | "route_deviation";

/** A {lat, lng, ...} payload accepted and stored by the safety service. */
export type SafetyLocation = {
  lat: number;
  lng: number;
  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;
  recorded_at?: string | null;
};

export type EmergencyContact = {
  id: string;
  userId: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EmergencyContactInput = {
  name: string;
  phone: string;
  relationship: string;
  isPrimary?: boolean;
};

export type SafetyConfig = {
  routeDeviationMeters: number;
  stopThresholdSeconds: number;
  safetyCheckTimeoutSeconds: number;
  neverStartedMinutes: number;
  exceededDurationMinutes: number;
  notifyParticipantsOnSos: boolean;
  sosRepeatWindowSeconds: number;
  liveLocationRetentionHours: number;
  updatedAt: string;
};

export type SafetyEvent = {
  id: string;
  rideId: string | null;
  userId: string;
  eventType: SafetyEventType;
  severity: SafetySeverity;
  location: SafetyLocation | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

export type LiveLocation = {
  rideId: string;
  userId: string;
  location: SafetyLocation;
  isActive: boolean;
  sharedSince: string;
  updatedAt: string;
};

export type RideMonitoringStatus = "active" | "suspended" | "finished";

export type RideMonitoring = {
  rideId: string;
  status: RideMonitoringStatus;
  startedAt: string;
  finishedAt: string | null;
  plannedRoute: SafetyLocation[] | null;
  lastLocation: SafetyLocation | null;
  lastLocationAt: string | null;
  lastMovedAt: string | null;
  stationarySince: string | null;
  checkRequiredAt: string | null;
  checkEventId: string | null;
  escalatedAt: string | null;
};

/** A realtime payload pushed over `postgres_changes` for safety tables. */
export type SafetyRealtimePayload<T> = {
  new: T;
  old: T | null;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  commitTimestamp: string;
};
