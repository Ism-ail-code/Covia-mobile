/**
 * Ride models.
 *
 * Mirrors the Phase 5 Supabase schema (migrations 0009–0013). Covia is NOT
 * ride-hailing: rides coordinate verified travellers sharing a vehicle
 * booked through Uber/inDrive/Yango. Every ride has a lifecycle
 *
 *   draft → published → full → in_progress → completed
 *       \      \      \     \→ cancelled
 *        \     \→ cancelled
 *         \→ cancelled
 *
 * All writes go through security-definer RPCs; the client never touches
 * the tables directly.
 */

export type RideStatus =
  | "draft"
  | "published"
  | "full"
  | "in_progress"
  | "completed"
  | "cancelled";

export type FareMode = "fixed" | "smart";

export type RideSort = "departure" | "recent" | "distance";

export type RideRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export type RideParticipantRole = "Host" | "Passenger";

export type RideTimelineEventType =
  | "created"
  | "published"
  | "requested"
  | "request_cancelled"
  | "approved"
  | "rejected"
  | "joined"
  | "left"
  | "ride_full"
  | "edited"
  | "started"
  | "completed"
  | "cancelled";

export const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  draft: "Draft",
  published: "Published",
  full: "Full",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const FARE_MODE_LABELS: Record<FareMode, string> = {
  fixed: "Fixed fare",
  smart: "Smart fare",
};

export const RIDE_TIMELINE_LABELS: Record<RideTimelineEventType, string> = {
  created: "Ride created",
  published: "Ride published",
  requested: "Requested to join",
  request_cancelled: "Request withdrawn",
  approved: "Request approved",
  rejected: "Request declined",
  joined: "Joined the ride",
  left: "Left the ride",
  ride_full: "Ride is full",
  edited: "Ride details updated",
  started: "Ride started",
  completed: "Ride completed",
  cancelled: "Ride cancelled",
};

/**
 * A ride as returned by create_ride / search_rides / get_ride.
 * Fare and distance fields come back as strings from PostgREST
 * (numeric/bigint columns) — they are converted here.
 */
export type Ride = {
  id: string;
  hostId: string;
  origin: string;
  destination: string;
  pickupPoint: string;
  destinationPoint: string | null;
  originLat: number | null;
  originLng: number | null;
  destinationLat: number | null;
  destinationLng: number | null;
  departureTime: string; // ISO 8601 (timestamptz)
  estimatedArrival: string | null;
  totalSeats: number;
  availableSeats: number;
  fareMode: FareMode;
  fixedFare: number | null;
  rideStatus: RideStatus;
  isStudentOnly: boolean;
  isWomenOnly: boolean;
  notes: string | null;
  hostUsername: string | null;
  hostDisplayName: string | null;
  hostAvatarUrl: string | null;
  hostRating: number | null;
  distanceKm: number | null;
  createdAt: string;
  updatedAt: string;
};

export type RideRequest = {
  id: string;
  rideId: string;
  passengerId: string;
  status: RideRequestStatus;
  requestedAt: string;
  respondedAt: string | null;
};

/** A request as returned by get_ride_requests (includes the passenger). */
export type RideRequestWithPassenger = RideRequest & {
  passengerUsername: string | null;
  passengerDisplayName: string | null;
  passengerAvatarUrl: string | null;
  passengerRating: number | null;
  passengerReliability: number | null;
};

export type RideParticipant = {
  userId: string;
  role: RideParticipantRole;
  joinedAt: string;
  leftAt: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  rating: number | null;
  reliabilityScore: number | null;
};

export type RideTimelineEvent = {
  id: string;
  eventType: RideTimelineEventType;
  actorId: string | null;
  metadata: Record<string, unknown>;
  actorUsername: string | null;
  actorDisplayName: string | null;
  createdAt: string;
};

/** Input for create_ride. */
export type CreateRideInput = {
  origin: string;
  destination: string;
  pickupPoint: string;
  departureTime: string; // ISO 8601
  totalSeats: number;
  fareMode: FareMode;
  fixedFare?: number | null;
  notes?: string | null;
  destinationPoint?: string | null;
  isStudentOnly?: boolean;
  isWomenOnly?: boolean;
  estimatedArrival?: string | null;
};

/** Optional fields for update_ride; null/undefined means "leave unchanged". */
export type UpdateRideChanges = {
  departureTime?: string | null;
  pickupPoint?: string | null;
  notes?: string | null;
  totalSeats?: number | null;
  fareMode?: FareMode | null;
  fixedFare?: number | null;
};

/** Filters + pagination for search_rides. */
export type RideSearchFilters = {
  origin?: string | null;
  destination?: string | null;
  date?: string | null; // YYYY-MM-DD
  timeFrom?: string | null; // HH:mm:ss
  availableSeats?: number | null;
  studentOnly?: boolean | null;
  womenOnly?: boolean | null;
  sort?: RideSort | null;
  originLat?: number | null;
  originLng?: number | null;
  page?: number;
  pageSize?: number;
};

export type RideSearchResult = {
  rides: Ride[];
  totalCount: number;
};
