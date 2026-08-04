/**
 * Safety service — emergency contacts, SOS, biometric-gated check-ins,
 * live location sharing (with an offline queue) and ride monitoring.
 *
 * Talks to the Phase 8 Supabase backend (migrations 0021 + 0022). Every
 * mutation is a security-definer RPC; reads go through RLS (SELECT only)
 * or the read RPCs. Live locations and safety events stream over
 * Supabase Realtime (postgres_changes), filtered by ride id.
 *
 * Device integration:
 *   - expo-location          — foreground GPS permission + position fixes
 *   - expo-local-authentication — the backend rejects "I'm Safe" unless
 *     `p_biometric_confirmed` is true; this service only sets it after a
 *     successful device unlock.
 *
 * Offline behaviour: `shareLiveLocation` enqueues a location in
 * AsyncStorage when the network fails and `flushPendingLocations`
 * replays the queue when connectivity returns.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import * as Location from "expo-location";

import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  EmergencyContact,
  EmergencyContactInput,
  LiveLocation,
  RideMonitoring,
  SafetyConfig,
  SafetyEvent,
  SafetyLocation,
  SafetyRealtimePayload,
} from "../types/safety";

export class SafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafetyError";
  }
}

function toSafetyError(error: unknown): SafetyError {
  const message = (error as { message?: string })?.message ?? "";
  const code = (error as { code?: string })?.code ?? "";
  if (code === "28000") return new SafetyError("Please sign in again.");
  if (code === "42501" || message.includes("Only the host")) {
    return new SafetyError("Only the host can do that.");
  }
  if (message.includes("You are not on this ride")) {
    return new SafetyError("You are not on this ride.");
  }
  if (message.includes("SOS is only available during an active ride")) {
    return new SafetyError("SOS is only available while your ride is in progress.");
  }
  if (message.includes("Live location is only shared during an active ride")) {
    return new SafetyError("Live location is only shared while your ride is in progress.");
  }
  if (message.includes("Biometric confirmation is required")) {
    return new SafetyError("Confirm you are safe with your device biometrics or passcode.");
  }
  if (message.includes("Only the rider can respond")) {
    return new SafetyError("Only the rider who was prompted can respond to this alert.");
  }
  if (message.includes("No active safety prompt")) {
    return new SafetyError("There is no open safety prompt on this ride.");
  }
  if (message.includes("A contact name is required")) {
    return new SafetyError("Add a contact name.");
  }
  if (message.includes("A valid phone number is required")) {
    return new SafetyError("Add a valid phone number.");
  }
  if (message.includes("A relationship is required")) {
    return new SafetyError("Add a relationship (e.g. Mother, Roommate).");
  }
  if (message.includes("Contact not found")) {
    return new SafetyError("That contact could not be found.");
  }
  if (message.includes("A valid location is required")) {
    return new SafetyError("A valid location is required.");
  }
  if (message.includes("A note is required")) {
    return new SafetyError("Add a note about what happened.");
  }
  return new SafetyError(message || "Something went wrong with the safety service.");
}

function requireConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new SafetyError("Safety isn't available yet — add your Supabase keys to .env.");
  }
}

// ── Row mappers ───────────────────────────────────────────────────────

type ContactRow = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

function mapContact(row: ContactRow): EmergencyContact {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    relationship: row.relationship,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type ConfigRow = {
  route_deviation_meters: string | number;
  stop_threshold_seconds: number;
  safety_check_timeout_seconds: number;
  never_started_minutes: number;
  exceeded_duration_minutes: number;
  notify_participants_on_sos: boolean;
  sos_repeat_window_seconds: number;
  live_location_retention_hours: number;
  updated_at: string;
};

function mapConfig(row: ConfigRow): SafetyConfig {
  return {
    routeDeviationMeters: Number(row.route_deviation_meters),
    stopThresholdSeconds: row.stop_threshold_seconds,
    safetyCheckTimeoutSeconds: row.safety_check_timeout_seconds,
    neverStartedMinutes: row.never_started_minutes,
    exceededDurationMinutes: row.exceeded_duration_minutes,
    notifyParticipantsOnSos: row.notify_participants_on_sos,
    sosRepeatWindowSeconds: row.sos_repeat_window_seconds,
    liveLocationRetentionHours: row.live_location_retention_hours,
    updatedAt: row.updated_at,
  };
}

type SafetyEventRow = {
  id: string;
  ride_id: string | null;
  user_id: string;
  event_type: SafetyEvent["eventType"];
  severity: SafetyEvent["severity"];
  location: SafetyLocation | null;
  metadata: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
};

function mapSafetyEvent(row: SafetyEventRow): SafetyEvent {
  return {
    id: row.id,
    rideId: row.ride_id,
    userId: row.user_id,
    eventType: row.event_type,
    severity: row.severity,
    location: row.location,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
  };
}

type LiveLocationRow = {
  ride_id: string;
  user_id: string;
  location: SafetyLocation;
  is_active: boolean;
  shared_since: string;
  updated_at: string;
};

function mapLiveLocation(row: LiveLocationRow): LiveLocation {
  return {
    rideId: row.ride_id,
    userId: row.user_id,
    location: row.location,
    isActive: row.is_active,
    sharedSince: row.shared_since,
    updatedAt: row.updated_at,
  };
}

type MonitoringRow = {
  ride_id: string;
  status: RideMonitoring["status"];
  started_at: string;
  finished_at: string | null;
  planned_route: SafetyLocation[] | null;
  last_location: SafetyLocation | null;
  last_location_at: string | null;
  last_moved_at: string | null;
  stationary_since: string | null;
  check_required_at: string | null;
  check_event_id: string | null;
  escalated_at: string | null;
};

function mapMonitoring(row: MonitoringRow): RideMonitoring {
  return {
    rideId: row.ride_id,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    plannedRoute: row.planned_route,
    lastLocation: row.last_location,
    lastLocationAt: row.last_location_at,
    lastMovedAt: row.last_moved_at,
    stationarySince: row.stationary_since,
    checkRequiredAt: row.check_required_at,
    checkEventId: row.check_event_id,
    escalatedAt: row.escalated_at,
  };
}

// ── Safety config ─────────────────────────────────────────────────────

export async function getSafetyConfig(): Promise<SafetyConfig> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_safety_config");
  if (error) throw toSafetyError(error);
  return mapConfig(data as ConfigRow);
}

// ── Emergency contacts ────────────────────────────────────────────────

export async function getEmergencyContacts(): Promise<EmergencyContact[]> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_emergency_contacts");
  if (error) throw toSafetyError(error);
  return (data as ContactRow[]).map(mapContact);
}

export async function addEmergencyContact(input: EmergencyContactInput): Promise<EmergencyContact> {
  requireConfigured();
  const { data, error } = await supabase.rpc("add_emergency_contact", {
    p_name: input.name,
    p_phone: input.phone,
    p_relationship: input.relationship,
    p_is_primary: input.isPrimary ?? false,
  });
  if (error) throw toSafetyError(error);
  return mapContact(data as ContactRow);
}

export async function updateEmergencyContact(
  contactId: string,
  changes: Partial<Omit<EmergencyContactInput, "isPrimary">> & { isPrimary?: boolean },
): Promise<EmergencyContact> {
  requireConfigured();
  const { data, error } = await supabase.rpc("update_emergency_contact", {
    p_contact_id: contactId,
    p_name: changes.name ?? null,
    p_phone: changes.phone ?? null,
    p_relationship: changes.relationship ?? null,
    p_is_primary: changes.isPrimary ?? null,
  });
  if (error) throw toSafetyError(error);
  return mapContact(data as ContactRow);
}

export async function deleteEmergencyContact(contactId: string): Promise<void> {
  requireConfigured();
  const { error } = await supabase.rpc("delete_emergency_contact", {
    p_contact_id: contactId,
  });
  if (error) throw toSafetyError(error);
}

// ── SOS ───────────────────────────────────────────────────────────────

/** One-tap SOS during an active ride (idempotent server-side). */
export async function triggerSos(rideId: string, location?: SafetyLocation): Promise<SafetyEvent> {
  requireConfigured();
  const { data, error } = await supabase.rpc("trigger_sos", {
    p_ride_id: rideId,
    p_location: location ?? null,
  });
  if (error) throw toSafetyError(error);
  return mapSafetyEvent(data as SafetyEventRow);
}

/**
 * Respond to an open "Are you safe?" prompt.
 *
 * `confirmBiometric` performs a device unlock first — the backend only
 * accepts `p_safe = true` with `p_biometric_confirmed = true`.
 */
export async function respondSafetyCheck(
  rideId: string,
  safe: boolean,
  confirmBiometric = false,
): Promise<SafetyEvent> {
  requireConfigured();
  let biometricConfirmed = false;
  if (safe) {
    if (!confirmBiometric) {
      throw new SafetyError("Confirm you are safe with your device biometrics or passcode.");
    }
    biometricConfirmed = await unlockWithBiometrics("Confirm you are safe");
    if (!biometricConfirmed) {
      throw new SafetyError("You cancelled the confirmation. The alert stays open.");
    }
  }
  const { data, error } = await supabase.rpc("respond_safety_check", {
    p_ride_id: rideId,
    p_safe: safe,
    p_biometric_confirmed: safe ? biometricConfirmed : false,
  });
  if (error) throw toSafetyError(error);
  return mapSafetyEvent(data as SafetyEventRow);
}

// ── Live location sharing (with offline queue) ───────────────────────

const LOCATION_QUEUE_KEY = "covia.safety.liveLocationQueue";

type QueuedLocation = { rideId: string; location: SafetyLocation; queuedAt: string };

async function readQueue(): Promise<QueuedLocation[]> {
  try {
    const raw = await AsyncStorage.getItem(LOCATION_QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedLocation[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(queue: QueuedLocation[]): Promise<void> {
  try {
    if (queue.length === 0) {
      await AsyncStorage.removeItem(LOCATION_QUEUE_KEY);
    } else {
      await AsyncStorage.setItem(LOCATION_QUEUE_KEY, JSON.stringify(queue));
    }
  } catch {
    // The queue is best-effort; a failed write is dropped silently.
  }
}

/**
 * Upsert the caller's live location for a ride. When the network fails
 * the location is queued and replayed by `flushPendingLocations`.
 */
export async function shareLiveLocation(rideId: string, location: SafetyLocation): Promise<void> {
  requireConfigured();
  await flushPendingLocations();
  const { error } = await supabase.rpc("update_live_location", {
    p_ride_id: rideId,
    p_location: location,
  });
  if (error) {
    const isNetwork = (error as { code?: string })?.code === "NETWORK_ERROR" ||
      (error as { message?: string })?.message?.includes("Failed to fetch");
    if (!isNetwork) throw toSafetyError(error);
    const queue = await readQueue();
    queue.push({ rideId, location, queuedAt: new Date().toISOString() });
    await writeQueue(queue.slice(-50));
  }
}

/** Stop sharing the caller's live location for a ride. */
export async function stopLiveLocation(rideId: string): Promise<void> {
  requireConfigured();
  const { error } = await supabase.rpc("stop_live_location", { p_ride_id: rideId });
  if (error) throw toSafetyError(error);
}

/** Replay queued locations (call on connectivity regained / app resume). */
export async function flushPendingLocations(): Promise<number> {
  const queue = await readQueue();
  if (queue.length === 0) return 0;
  const pending: QueuedLocation[] = [];
  for (const entry of queue) {
    const { error } = await supabase.rpc("update_live_location", {
      p_ride_id: entry.rideId,
      p_location: entry.location,
    });
    if (error) {
      const isNetwork = (error as { code?: string })?.code === "NETWORK_ERROR" ||
        (error as { message?: string })?.message?.includes("Failed to fetch");
      if (isNetwork) {
        pending.push(entry);
        break;
      }
    }
  }
  await writeQueue(pending);
  return queue.length - pending.length;
}

// ── Route + monitoring controls (host) ────────────────────────────────

export async function reportSafetyIncident(rideId: string, note: string): Promise<SafetyEvent> {
  requireConfigured();
  const { data, error } = await supabase.rpc("report_safety_incident", {
    p_ride_id: rideId,
    p_note: note,
  });
  if (error) throw toSafetyError(error);
  return mapSafetyEvent(data as SafetyEventRow);
}

// ── Monitoring reads (RLS) ────────────────────────────────────────────

export async function getRideMonitoring(rideId: string): Promise<RideMonitoring | null> {
  requireConfigured();
  const { data, error } = await supabase
    .from("ride_monitoring")
    .select("*")
    .eq("ride_id", rideId)
    .maybeSingle();
  if (error) throw toSafetyError(error);
  return data ? mapMonitoring(data as MonitoringRow) : null;
}

// ── Realtime subscriptions (RLS-filtered postgres_changes) ────────────

export function subscribeToSafetyEvents(
  rideId: string,
  onEvent: (payload: SafetyRealtimePayload<SafetyEvent>) => void,
): () => void {
  requireConfigured();
  const channel = supabase
    .channel(`safety-events-${rideId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "safety_events", filter: `ride_id=eq.${rideId}` },
      (payload) => {
        onEvent({
          new: mapSafetyEvent(payload.new as SafetyEventRow),
          old: payload.old ? mapSafetyEvent(payload.old as SafetyEventRow) : null,
          eventType: payload.eventType as SafetyRealtimePayload<SafetyEvent>["eventType"],
          commitTimestamp: payload.commit_timestamp,
        });
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToLiveLocations(
  rideId: string,
  onLocation: (payload: SafetyRealtimePayload<LiveLocation>) => void,
): () => void {
  requireConfigured();
  const channel = supabase
    .channel(`live-locations-${rideId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "live_locations", filter: `ride_id=eq.${rideId}` },
      (payload) => {
        onLocation({
          new: mapLiveLocation(payload.new as LiveLocationRow),
          old: payload.old ? mapLiveLocation(payload.old as LiveLocationRow) : null,
          eventType: payload.eventType as SafetyRealtimePayload<LiveLocation>["eventType"],
          commitTimestamp: payload.commit_timestamp,
        });
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Device integration ────────────────────────────────────────────────

/** Ask for (and return the state of) foreground location permission. */
export async function requestLocationPermission(): Promise<boolean> {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) return true;
  const request = await Location.requestForegroundPermissionsAsync();
  return request.granted;
}

/** Grab the current GPS fix, or null when permission is missing. */
export async function getCurrentPosition(): Promise<SafetyLocation | null> {
  const granted = await requestLocationPermission();
  if (!granted) return null;
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
    speed: position.coords.speed ?? null,
    heading: position.coords.heading ?? null,
    recorded_at: new Date(position.timestamp).toISOString(),
  };
}

/** Unlock the device (biometric or passcode fallback). */
export async function unlockWithBiometrics(promptMessage: string): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!hasHardware || !isEnrolled) return false;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });
  return result.success;
}

/** Convenience: start one-shot sharing of the current position. */
export async function shareCurrentPosition(rideId: string): Promise<boolean> {
  const position = await getCurrentPosition();
  if (!position) return false;
  await shareLiveLocation(rideId, position);
  return true;
}
