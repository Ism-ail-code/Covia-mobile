/**
 * Ride models.
 *
 * Mirrors the Phase 5 Supabase schema (migrations 0009–0016). Covia is NOT
 * ride-hailing: rides coordinate verified travellers sharing a vehicle
 * booked through Uber/inDrive/Yango. Every ride has a lifecycle
 *
 *   draft → published → full → in_progress → completed
 *       \      \      \     \→ cancelled
 *        \     \→ cancelled
 *         \→ cancelled
 *   published / full →(departure passed, never started)→ expired
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
  | "cancelled"
  | "expired";

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
  | "cancelled"
  | "dropped"
  | "expired";

/**
 * A structured location (migration 0014). The text columns on rides stay
 * as searchable display-name copies; this object powers maps, route
 * matching, nearby discovery, ETA and rerouting in later phases.
 */
export type RideLocation = {
  display_name: string;
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
  full_address?: string | null;
};

/** Pickup-point rules: main-road and public places only (no residential). */
export type PickupType =
  | "main_road"
  | "landmark"
  | "university"
  | "bus_stop"
  | "metro_station"
  | "shopping_center";

export const RIDE_STATUS_LABELS: Record<RideStatus, string> = {
  draft: "Draft",
  published: "Published",
  full: "Full",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const FARE_MODE_LABELS: Record<FareMode, string> = {
  fixed: "Fixed fare",
  smart: "Smart fare",
};

export const PICKUP_TYPE_LABELS: Record<PickupType, string> = {
  main_road: "Main road",
  landmark: "Landmark",
  university: "University",
  bus_stop: "Bus stop",
  metro_station: "Metro station",
  shopping_center: "Shopping centre",
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
  dropped: "Removed from the ride",
  expired: "Ride expired",
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
  pickupType: PickupType | null;
  originLoc: RideLocation | null;
  destinationLoc: RideLocation | null;
  pickupPointLoc: RideLocation | null;
  destinationPointLoc: RideLocation | null;
  smartFareDetails: Record<string, unknown> | null;
  visibleAt: string | null;
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
  hostVerified: boolean | null;
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

/** Input for create_ride (structured locations, migration 0015). */
export type CreateRideInput = {
  originLoc: RideLocation;
  destinationLoc: RideLocation;
  pickupPointLoc: RideLocation;
  pickupType: PickupType;
  departureTime: string; // ISO 8601
  totalSeats: number;
  fareMode: FareMode;
  fixedFare?: number | null;
  notes?: string | null;
  destinationPointLoc?: RideLocation | null;
  isStudentOnly?: boolean;
  isWomenOnly?: boolean;
  visibleAt?: string | null; // ISO 8601 — ride appears in search from then
  estimatedArrival?: string | null;
  smartFareDetails?: Record<string, unknown> | null;
};

/** Optional fields for update_ride; null/undefined means "leave unchanged". */
export type UpdateRideChanges = {
  departureTime?: string | null;
  pickupPoint?: string | null;
  destination?: string | null;
  destinationPoint?: string | null;
  pickupType?: PickupType | null;
  visibleAt?: string | null;
  originLoc?: RideLocation | null;
  destinationLoc?: RideLocation | null;
  pickupPointLoc?: RideLocation | null;
  destinationPointLoc?: RideLocation | null;
  smartFareDetails?: Record<string, unknown> | null;
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
  verifiedHost?: boolean | null;
  page?: number;
  pageSize?: number;
};

export type RideSearchResult = {
  rides: Ride[];
  totalCount: number;
};

/** How the current user relates to a ride in their history. */
export type RideHistoryRelation = "hosted" | "joined" | "requested";

/** One row of get_ride_history. */
export type RideHistoryEntry = {
  rideId: string;
  relation: RideHistoryRelation;
  userId: string;
  origin: string;
  destination: string;
  departureTime: string;
  rideStatus: RideStatus;
  requestStatus: RideRequestStatus | null;
  fareMode: FareMode;
  fixedFare: number | null;
  totalSeats: number;
  availableSeats: number;
  isStudentOnly: boolean;
  isWomenOnly: boolean;
  pickupType: PickupType | null;
  joinedAt: string | null;
  leftAt: string | null;
  hostUsername: string | null;
  hostDisplayName: string | null;
  hostAvatarUrl: string | null;
  createdAt: string;
};

export type RideHistoryResult = {
  entries: RideHistoryEntry[];
  totalCount: number;
};
