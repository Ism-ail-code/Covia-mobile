/**
 * Ride service — creation, publishing, requests, lifecycle, discovery.
 *
 * Talks to the Phase 5 Supabase backend (migrations 0009–0013). All
 * writes go through security-definer RPCs; the client only ever reads
 * through the read functions (search_rides, get_ride, get_ride_requests,
 * get_ride_participants, get_ride_timeline) because RLS grants the
 * client SELECT only on the tables.
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  CreateRideInput,
  Ride,
  RideParticipant,
  RideRequest,
  RideRequestWithPassenger,
  RideSearchFilters,
  RideSearchResult,
  RideTimelineEvent,
  UpdateRideChanges,
} from "../types/ride";

export class RideError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RideError";
  }
}

type RideRow = {
  id: string;
  host_id: string;
  origin: string;
  destination: string;
  pickup_point: string;
  destination_point: string | null;
  origin_lat: string | null;
  origin_lng: string | null;
  destination_lat: string | null;
  destination_lng: string | null;
  departure_time: string;
  estimated_arrival: string | null;
  total_seats: number;
  available_seats: number;
  fare_mode: Ride["fareMode"];
  fixed_fare: string | null;
  ride_status: Ride["rideStatus"];
  is_student_only: boolean;
  is_women_only: boolean;
  notes: string | null;
  host_username: string | null;
  host_display_name: string | null;
  host_avatar_url: string | null;
  host_rating: string | null;
  distance_km: string | null;
  total_count: string | null;
  created_at: string;
  updated_at: string;
};

function toNullableNumber(value: string | null): number | null {
  return value == null ? null : Number(value);
}

function mapRide(row: RideRow): Ride {
  return {
    id: row.id,
    hostId: row.host_id,
    origin: row.origin,
    destination: row.destination,
    pickupPoint: row.pickup_point,
    destinationPoint: row.destination_point,
    originLat: toNullableNumber(row.origin_lat),
    originLng: toNullableNumber(row.origin_lng),
    destinationLat: toNullableNumber(row.destination_lat),
    destinationLng: toNullableNumber(row.destination_lng),
    departureTime: row.departure_time,
    estimatedArrival: row.estimated_arrival,
    totalSeats: row.total_seats,
    availableSeats: row.available_seats,
    fareMode: row.fare_mode,
    fixedFare: toNullableNumber(row.fixed_fare),
    rideStatus: row.ride_status,
    isStudentOnly: row.is_student_only,
    isWomenOnly: row.is_women_only,
    notes: row.notes,
    hostUsername: row.host_username,
    hostDisplayName: row.host_display_name,
    hostAvatarUrl: row.host_avatar_url,
    hostRating: toNullableNumber(row.host_rating),
    distanceKm: toNullableNumber(row.distance_km),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type RequestRow = {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: RideRequest["status"];
  requested_at: string;
  responded_at: string | null;
  passenger_username: string | null;
  passenger_display_name: string | null;
  passenger_avatar_url: string | null;
  passenger_rating: string | null;
  passenger_reliability: number | null;
};

function mapRequest(row: RequestRow): RideRequest {
  return {
    id: row.id,
    rideId: row.ride_id,
    passengerId: row.passenger_id,
    status: row.status,
    requestedAt: row.requested_at,
    respondedAt: row.responded_at,
  };
}

function mapRequestWithPassenger(row: RequestRow): RideRequestWithPassenger {
  return {
    ...mapRequest(row),
    passengerUsername: row.passenger_username,
    passengerDisplayName: row.passenger_display_name,
    passengerAvatarUrl: row.passenger_avatar_url,
    passengerRating: toNullableNumber(row.passenger_rating),
    passengerReliability: row.passenger_reliability,
  };
}

type ParticipantRow = {
  user_id: string;
  role: RideParticipant["role"];
  joined_at: string;
  left_at: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  rating: string | null;
  reliability_score: number | null;
};

function mapParticipant(row: ParticipantRow): RideParticipant {
  return {
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
    leftAt: row.left_at,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    rating: toNullableNumber(row.rating),
    reliabilityScore: row.reliability_score,
  };
}

type TimelineRow = {
  id: string;
  event_type: RideTimelineEvent["eventType"];
  actor_id: string | null;
  metadata: Record<string, unknown>;
  actor_username: string | null;
  actor_display_name: string | null;
  created_at: string;
};

function mapTimelineEvent(row: TimelineRow): RideTimelineEvent {
  return {
    id: row.id,
    eventType: row.event_type,
    actorId: row.actor_id,
    metadata: row.metadata ?? {},
    actorUsername: row.actor_username,
    actorDisplayName: row.actor_display_name,
    createdAt: row.created_at,
  };
}

function mapSingleRide(data: unknown): Ride {
  return mapRide(data as RideRow);
}

function toRideError(error: unknown): RideError {
  const message = (error as { message?: string })?.message ?? "";
  const code = (error as { code?: string })?.code ?? "";
  if (code === "28000") return new RideError("Please sign in again.");
  if (code === "23505" || message.includes("already requested")) {
    return new RideError("You already requested to join this ride.");
  }
  if (code === "42501" || message.includes("Only the host")) {
    return new RideError("Only the host can do that.");
  }
  if (message.includes("Only verified users can create")) {
    return new RideError("Verify your ID or student status before creating a ride.");
  }
  if (message.includes("Only verified users can join")) {
    return new RideError("Verify your ID or student status before joining a ride.");
  }
  if (message.includes("Origin is required")) return new RideError("Add the ride's starting point.");
  if (message.includes("Destination is required")) return new RideError("Add the destination.");
  if (message.includes("Pickup point is required")) return new RideError("Add the pickup point.");
  if (message.includes("Departure date and time are required")) {
    return new RideError("Choose a departure date and time.");
  }
  if (message.includes("Departure must be in the future")) {
    return new RideError("Departure must be in the future.");
  }
  if (message.includes("Seats must be between 1 and 10")) {
    return new RideError("Choose between 1 and 10 seats.");
  }
  if (message.includes("per-seat fare")) return new RideError("Set a per-seat fare.");
  if (message.includes("Smart fares")) return new RideError("Smart fares don't need an amount.");
  if (message.includes("verified students")) {
    return new RideError("Only verified students can create student-only rides.");
  }
  if (message.includes("already on this ride")) {
    return new RideError("You're already on this ride.");
  }
  if (message.includes("already have a seat")) {
    return new RideError("You already have a seat on a ride around that time.");
  }
  if (message.includes("already have a request")) {
    return new RideError("You already have a request or seat on a ride around that time.");
  }
  if (message.includes("own ride")) return new RideError("You can't request to join your own ride.");
  if (message.includes("not been published")) return new RideError("This ride isn't published yet.");
  if (message.includes("This ride is full")) return new RideError("This ride is already full.");
  if (message.includes("already started") || message.includes("in-progress rides can be completed")) {
    return new RideError("This ride already started.");
  }
  if (message.includes("was cancelled") || message.includes("already cancelled")) {
    return new RideError("This ride was cancelled.");
  }
  if (message.includes("Only pending requests")) {
    return new RideError("Only pending requests can be withdrawn.");
  }
  if (message.includes("You are not on this ride")) {
    return new RideError("You're not on this ride.");
  }
  if (message.includes("only leave before")) {
    return new RideError("You can only leave before the ride starts.");
  }
  if (message.includes("already handled")) {
    return new RideError("This request was already handled.");
  }
  if (message.includes("not accepting requests")) {
    return new RideError("This ride isn't accepting requests right now.");
  }
  if (message.includes("Only draft rides")) {
    return new RideError("Only draft rides can be published.");
  }
  if (message.includes("can no longer be edited")) {
    return new RideError("This ride can no longer be edited.");
  }
  if (message.includes("approved passengers")) {
    return new RideError("You can't reduce seats below the approved passenger count.");
  }
  if (message.includes("Only published rides")) {
    return new RideError("Only published rides can be started.");
  }
  if (message.includes("cannot be cancelled")) {
    return new RideError("This ride already started and can't be cancelled.");
  }
  if (message.includes("Only ride members")) {
    return new RideError("Only people on the ride can see that.");
  }
  if (message.includes("Only the host can view")) {
    return new RideError("Only the host can view the request queue.");
  }
  if (message.includes("Ride not found")) return new RideError("This ride no longer exists.");
  if (message.includes("Ride request not found")) {
    return new RideError("This request no longer exists.");
  }
  if (message.includes("Not authenticated")) return new RideError("Please sign in again.");
  return new RideError("Couldn't do that — please try again.");
}

function requireConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new RideError("Rides aren't available yet — add your Supabase keys to .env.");
  }
}

/** Client-side validation before creating/editing a ride. */
export function validateRideInput(input: CreateRideInput): string | null {
  if (!input.origin.trim()) return "Add the ride's starting point.";
  if (!input.destination.trim()) return "Add the destination.";
  if (!input.pickupPoint.trim()) return "Add the pickup point.";
  if (!input.departureTime) return "Choose a departure date and time.";
  if (new Date(input.departureTime).getTime() <= Date.now()) {
    return "Departure must be in the future.";
  }
  if (!Number.isInteger(input.totalSeats) || input.totalSeats < 1 || input.totalSeats > 10) {
    return "Choose between 1 and 10 seats.";
  }
  if (input.fareMode === "fixed" && (input.fixedFare == null || input.fixedFare <= 0)) {
    return "Set a per-seat fare.";
  }
  if (input.fareMode === "smart" && input.fixedFare != null) {
    return "Smart fares don't need an amount.";
  }
  return null;
}

/** Create a draft ride (verified hosts only). */
export async function createRide(input: CreateRideInput): Promise<Ride> {
  requireConfigured();
  const validationError = validateRideInput(input);
  if (validationError) throw new RideError(validationError);
  const { data, error } = await supabase.rpc("create_ride", {
    p_origin: input.origin.trim(),
    p_destination: input.destination.trim(),
    p_pickup_point: input.pickupPoint.trim(),
    p_departure_time: input.departureTime,
    p_total_seats: input.totalSeats,
    p_fare_mode: input.fareMode,
    p_fixed_fare: input.fareMode === "fixed" ? input.fixedFare ?? null : null,
    p_notes: input.notes ?? null,
    p_destination_point: input.destinationPoint ?? null,
    p_is_student_only: input.isStudentOnly ?? false,
    p_is_women_only: input.isWomenOnly ?? false,
    p_estimated_arrival: input.estimatedArrival ?? null,
  });
  if (error) throw toRideError(error);
  return mapSingleRide(data);
}

/** Publish a draft: the host joins as a participant. */
export async function publishRide(rideId: string): Promise<Ride> {
  requireConfigured();
  const { data, error } = await supabase.rpc("publish_ride", { p_ride_id: rideId });
  if (error) throw toRideError(error);
  return mapSingleRide(data);
}

/** Edit a ride before it starts (host only). */
export async function updateRide(rideId: string, changes: UpdateRideChanges): Promise<Ride> {
  requireConfigured();
  if (changes.totalSeats != null && (changes.totalSeats < 1 || changes.totalSeats > 10)) {
    throw new RideError("Choose between 1 and 10 seats.");
  }
  const { data, error } = await supabase.rpc("update_ride", {
    p_ride_id: rideId,
    p_departure_time: changes.departureTime ?? null,
    p_pickup_point: changes.pickupPoint ?? null,
    p_notes: changes.notes ?? null,
    p_total_seats: changes.totalSeats ?? null,
    p_fare_mode: changes.fareMode ?? null,
    p_fixed_fare: changes.fixedFare ?? null,
  });
  if (error) throw toRideError(error);
  return mapSingleRide(data);
}

/** Request a seat (verified users only; host approval required). */
export async function requestToJoin(rideId: string): Promise<RideRequest> {
  requireConfigured();
  const { data, error } = await supabase.rpc("request_to_join", { p_ride_id: rideId });
  if (error) throw toRideError(error);
  return mapRequest(data as RequestRow);
}

/** Withdraw a pending request. */
export async function cancelRideRequest(requestId: string): Promise<RideRequest> {
  requireConfigured();
  const { data, error } = await supabase.rpc("cancel_ride_request", {
    p_request_id: requestId,
  });
  if (error) throw toRideError(error);
  return mapRequest(data as RequestRow);
}

/** Leave a ride before it starts (frees the seat). */
export async function leaveRide(rideId: string): Promise<Ride> {
  requireConfigured();
  const { data, error } = await supabase.rpc("leave_ride", { p_ride_id: rideId });
  if (error) throw toRideError(error);
  return mapSingleRide(data);
}

/** Host approves or rejects a join request. */
export async function hostRespondToRequest(
  requestId: string,
  approve: boolean,
  reason?: string | null,
): Promise<RideRequest> {
  requireConfigured();
  const { data, error } = await supabase.rpc("host_respond_to_request", {
    p_request_id: requestId,
    p_approve: approve,
    p_reason: reason ?? null,
  });
  if (error) throw toRideError(error);
  return mapRequest(data as RequestRow);
}

/** Start a published/full ride (host only). */
export async function startRide(rideId: string): Promise<Ride> {
  requireConfigured();
  const { data, error } = await supabase.rpc("start_ride", { p_ride_id: rideId });
  if (error) throw toRideError(error);
  return mapSingleRide(data);
}

/** Complete an in-progress ride (host only; updates reliability counters). */
export async function completeRide(rideId: string): Promise<Ride> {
  requireConfigured();
  const { data, error } = await supabase.rpc("complete_ride", { p_ride_id: rideId });
  if (error) throw toRideError(error);
  return mapSingleRide(data);
}

/** Cancel a ride that hasn't started (host only; closes open requests). */
export async function cancelRide(rideId: string): Promise<Ride> {
  requireConfigured();
  const { data, error } = await supabase.rpc("cancel_ride", { p_ride_id: rideId });
  if (error) throw toRideError(error);
  return mapSingleRide(data);
}

/** Browse published rides with filters, sorting and pagination. */
export async function searchRides(filters: RideSearchFilters = {}): Promise<RideSearchResult> {
  requireConfigured();
  const { data, error } = await supabase.rpc("search_rides", {
    p_origin: filters.origin ?? null,
    p_destination: filters.destination ?? null,
    p_date: filters.date ?? null,
    p_time_from: filters.timeFrom ?? null,
    p_available_seats: filters.availableSeats ?? null,
    p_student_only: filters.studentOnly ?? null,
    p_women_only: filters.womenOnly ?? null,
    p_sort: filters.sort ?? null,
    p_origin_lat: filters.originLat ?? null,
    p_origin_lng: filters.originLng ?? null,
    p_page: filters.page ?? 1,
    p_page_size: filters.pageSize ?? 20,
  });
  if (error) throw toRideError(error);
  const rows = (data ?? []) as RideRow[];
  const rides = rows.map(mapRide);
  const totalCount = rows.length > 0 ? Number(rows[0].total_count ?? 0) : 0;
  return { rides, totalCount };
}

/** Ride detail with the host's public profile. */
export async function getRide(rideId: string): Promise<Ride> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_ride", { p_ride_id: rideId });
  if (error) throw toRideError(error);
  return mapSingleRide(data);
}

/** Host's request queue with passenger profiles. */
export async function getRideRequests(rideId: string): Promise<RideRequestWithPassenger[]> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_ride_requests", { p_ride_id: rideId });
  if (error) throw toRideError(error);
  return ((data ?? []) as RequestRow[]).map(mapRequestWithPassenger);
}

/** Who is on the ride (host + members). */
export async function getRideParticipants(rideId: string): Promise<RideParticipant[]> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_ride_participants", { p_ride_id: rideId });
  if (error) throw toRideError(error);
  return ((data ?? []) as ParticipantRow[]).map(mapParticipant);
}

/** Full event timeline (host + members). */
export async function getRideTimeline(rideId: string): Promise<RideTimelineEvent[]> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_ride_timeline", { p_ride_id: rideId });
  if (error) throw toRideError(error);
  return ((data ?? []) as TimelineRow[]).map(mapTimelineEvent);
}
