/**
 * Trust service — ratings, reviews, reliability, reports, appeals and
 * moderation status.
 *
 * Talks to the Phase 9 Supabase backend (migrations 0023–0026). Ratings
 * are double-blind: they stay hidden until the counterpart rates or the
 * review window (default 72h) expires. Reports are confidential. All
 * writes are security-definer RPCs; the tables themselves are RLS-locked.
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  Appeal,
  ModerationStatus,
  PublicTrustSummary,
  Rating,
  RatingInput,
  Report,
  ReportPage,
  ReportReason,
  RideRatingStatus,
  TrustConfig,
  TrustSummary,
  UserRating,
  UserRatingPage,
} from "../types/trust";

export class TrustError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrustError";
  }
}

function toTrustError(error: unknown): TrustError {
  const message = (error as { message?: string })?.message ?? "";
  const code = (error as { code?: string })?.code ?? "";
  if (code === "28000") return new TrustError("Please sign in again.");
  if (message.includes("Admin access required")) {
    return new TrustError("Only moderators can do that.");
  }
  if (message.includes("already rated")) {
    return new TrustError("You've already rated this ride.");
  }
  if (message.includes("between 1 and 5")) {
    return new TrustError("Ratings must be between 1 and 5 stars.");
  }
  if (message.includes("must contain some text")) {
    return new TrustError("Write something in your review.");
  }
  if (message.includes("1000 characters")) {
    return new TrustError("Reviews are limited to 1000 characters.");
  }
  if (message.includes("stayed on the ride") || message.includes("only rate rides you were on")) {
    return new TrustError("You can only rate rides you joined and stayed on.");
  }
  if (message.includes("suspended")) {
    return new TrustError("Your account is suspended, so you can't rate rides right now.");
  }
  if (message.includes("Choose which passenger")) {
    return new TrustError("Pick which passenger you're rating.");
  }
  if (message.includes("cannot report yourself")) {
    return new TrustError("You can't report yourself.");
  }
  if (message.includes("not recognised")) {
    return new TrustError("That report reason isn't recognised.");
  }
  if (message.includes("must be a list")) {
    return new TrustError("Evidence references must be a list.");
  }
  if (message.includes("already reported")) {
    return new TrustError("You've already reported this with the same reason.");
  }
  if (message.includes("does not exist")) {
    return new TrustError("That ride doesn't exist.");
  }
  if (message.includes("Warnings cannot be appealed")) {
    return new TrustError("Warnings can't be appealed.");
  }
  if (message.includes("already have a pending appeal")) {
    return new TrustError("You already have a pending appeal for this action.");
  }
  if (message.includes("Explain why")) {
    return new TrustError("Explain why the restriction should be removed.");
  }
  if (message.includes("2000 characters")) {
    return new TrustError("Appeals are limited to 2000 characters.");
  }
  if (message.includes("Appeal not found")) {
    return new TrustError("That appeal no longer exists.");
  }
  return new TrustError(message || "Something went wrong with trust features.");
}

function requireConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new TrustError("Trust features aren't available yet — add your Supabase keys to .env.");
  }
}

type RatingRow = {
  id: string;
  ride_id: string;
  rater_user_id: string;
  ratee_user_id: string;
  role_of_rater: "Host" | "Passenger";
  overall_rating: number;
  punctuality: number | null;
  communication: number | null;
  respectfulness: number | null;
  reliability: number | null;
  is_revealed: boolean;
  revealed_at: string | null;
  created_at: string;
};

function mapRating(row: RatingRow): Rating {
  return {
    id: row.id,
    rideId: row.ride_id,
    raterUserId: row.rater_user_id,
    rateeUserId: row.ratee_user_id,
    roleOfRater: row.role_of_rater,
    overallRating: Number(row.overall_rating),
    punctuality: row.punctuality === null ? null : Number(row.punctuality),
    communication: row.communication === null ? null : Number(row.communication),
    respectfulness: row.respectfulness === null ? null : Number(row.respectfulness),
    reliability: row.reliability === null ? null : Number(row.reliability),
    isRevealed: row.is_revealed,
    revealedAt: row.revealed_at,
    createdAt: row.created_at,
  };
}

type StatusRow = {
  ratee_user_id: string;
  my_role: "Host" | "Passenger";
  rating_id: string | null;
  overall_rating: number | null;
  punctuality: number | null;
  communication: number | null;
  respectfulness: number | null;
  reliability: number | null;
  is_revealed: boolean;
  revealed_at: string | null;
  review: string | null;
  review_profanity_flag: boolean;
  reciprocal_submitted: boolean;
  window_expired: boolean;
};

function mapStatus(row: StatusRow): RideRatingStatus {
  return {
    rateeUserId: row.ratee_user_id,
    myRole: row.my_role,
    ratingId: row.rating_id,
    overallRating: row.overall_rating === null ? null : Number(row.overall_rating),
    punctuality: row.punctuality === null ? null : Number(row.punctuality),
    communication: row.communication === null ? null : Number(row.communication),
    respectfulness: row.respectfulness === null ? null : Number(row.respectfulness),
    reliability: row.reliability === null ? null : Number(row.reliability),
    isRevealed: row.is_revealed,
    revealedAt: row.revealed_at,
    review: row.review,
    reviewProfanityFlag: row.review_profanity_flag,
    reciprocalSubmitted: row.reciprocal_submitted,
    windowExpired: row.window_expired,
  };
}

type UserRatingRow = {
  id: string;
  ride_id: string;
  rater_user_id: string;
  rater_name: string | null;
  overall_rating: number;
  punctuality: number | null;
  communication: number | null;
  respectfulness: number | null;
  reliability: number | null;
  comment: string | null;
  created_at: string;
  total_count: string | number;
};

function mapUserRating(row: UserRatingRow): UserRating {
  return {
    id: row.id,
    rideId: row.ride_id,
    raterUserId: row.rater_user_id,
    raterName: row.rater_name,
    overallRating: Number(row.overall_rating),
    punctuality: row.punctuality === null ? null : Number(row.punctuality),
    communication: row.communication === null ? null : Number(row.communication),
    respectfulness: row.respectfulness === null ? null : Number(row.respectfulness),
    reliability: row.reliability === null ? null : Number(row.reliability),
    comment: row.comment,
    createdAt: row.created_at,
  };
}

type ReportRow = {
  id: string;
  target_type: "user" | "ride" | "chat_message";
  target_user_id: string | null;
  target_ride_id: string | null;
  reason: ReportReason;
  details: string | null;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  is_confirmed: boolean;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
  total_count: string | number;
};

function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    targetType: row.target_type,
    targetUserId: row.target_user_id,
    targetRideId: row.target_ride_id,
    reason: row.reason,
    details: row.details,
    status: row.status,
    isConfirmed: row.is_confirmed,
    resolutionNote: row.resolution_note,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

type AppealRow = {
  id: string;
  moderation_action_id: string;
  action_type: Appeal["actionType"];
  action_status: string;
  action_reason: string;
  appeal_reason: string;
  status: Appeal["status"];
  moderator_note: string | null;
  decided_at: string | null;
  created_at: string;
};

function mapAppeal(row: AppealRow): Appeal {
  return {
    id: row.id,
    moderationActionId: row.moderation_action_id,
    actionType: row.action_type,
    actionStatus: row.action_status,
    actionReason: row.action_reason,
    appealReason: row.appeal_reason,
    status: row.status,
    moderatorNote: row.moderator_note,
    decidedAt: row.decided_at,
    createdAt: row.created_at,
  };
}

/** The people you can still rate on a completed ride (your counterpart). */
export async function getRideRatingStatus(rideId: string): Promise<RideRatingStatus[]> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_ride_rating_status", { p_ride_id: rideId });
  if (error) throw toTrustError(error);
  return ((data ?? []) as StatusRow[]).map(mapStatus);
}

export async function rateRide(
  rideId: string,
  rateeUserId: string | null,
  input: RatingInput,
): Promise<Rating> {
  requireConfigured();
  const { data, error } = await supabase.rpc("rate_ride", {
    p_ride_id: rideId,
    p_ratee_user_id: rateeUserId,
    p_overall_rating: input.overallRating,
    p_punctuality: input.punctuality ?? null,
    p_communication: input.communication ?? null,
    p_respectfulness: input.respectfulness ?? null,
    p_reliability: input.reliability ?? null,
    p_comment: input.comment ?? null,
  });
  if (error) throw toTrustError(error);
  return mapRating(data as RatingRow);
}

/** Edit your rating while it is still hidden (before reveal). */
export async function updateRating(ratingId: string, input: RatingInput): Promise<Rating> {
  requireConfigured();
  const { data, error } = await supabase.rpc("update_rating", {
    p_rating_id: ratingId,
    p_overall_rating: input.overallRating,
    p_punctuality: input.punctuality ?? null,
    p_communication: input.communication ?? null,
    p_respectfulness: input.respectfulness ?? null,
    p_reliability: input.reliability ?? null,
    p_comment: input.comment ?? null,
  });
  if (error) throw toTrustError(error);
  return mapRating(data as RatingRow);
}

/** Withdraw your hidden rating (revealed ratings are immutable). */
export async function deleteRating(ratingId: string): Promise<void> {
  requireConfigured();
  const { error } = await supabase.rpc("delete_rating", { p_rating_id: ratingId });
  if (error) throw toTrustError(error);
}

/** Revealed ratings about a user — the profile reviews block. */
export async function getUserRatings(
  userId: string,
  page = 1,
  pageSize = 10,
): Promise<UserRatingPage> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_user_ratings", {
    p_user_id: userId,
    p_page: page,
    p_page_size: pageSize,
  });
  if (error) throw toTrustError(error);
  const rows = (data ?? []) as UserRatingRow[];
  return {
    items: rows.map(mapUserRating),
    totalCount: Number(rows[0]?.total_count ?? 0),
  };
}

export async function getTrustConfig(): Promise<TrustConfig> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_trust_config");
  if (error) throw toTrustError(error);
  const row = (data ?? [])[0] as { review_window_hours: number } | undefined;
  return { reviewWindowHours: Number(row?.review_window_hours ?? 72) };
}

/** Your full trust profile (includes confidential report counts). */
export async function getMyTrustSummary(): Promise<TrustSummary> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_trust_summary");
  if (error) throw toTrustError(error);
  return mapTrustSummary(data as TrustSummaryJson);
}

/** The public trust profile shown to other users. */
export async function getPublicTrustSummary(userId: string): Promise<PublicTrustSummary> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_public_trust_summary", { p_user_id: userId });
  if (error) throw toTrustError(error);
  const { reportsReceivedTotal, reportsReceivedConfirmed, ...rest } = mapTrustSummary(
    data as TrustSummaryJson,
  );
  void reportsReceivedTotal;
  void reportsReceivedConfirmed;
  return rest;
}

type TrustSummaryJson = {
  user_id: string;
  average_rating: number;
  rating_count: number;
  reliability_score: number;
  completed_rides: number;
  cancelled_rides: number;
  verification_status: string;
  is_government_id_verified: boolean;
  is_student_verified: boolean;
  reports_received_total: number;
  reports_received_confirmed: number;
  account_age_days: number;
  restrictions: Array<{
    action_type: ModerationStatus["restrictions"][number]["actionType"];
    severity: number;
    status: string;
    source: "automatic" | "manual";
    starts_at: string | null;
    ends_at: string | null;
  }> | null;
};

function mapTrustSummary(json: TrustSummaryJson): TrustSummary {
  return {
    userId: json.user_id,
    averageRating: Number(json.average_rating),
    ratingCount: Number(json.rating_count),
    reliabilityScore: Number(json.reliability_score),
    completedRides: Number(json.completed_rides),
    cancelledRides: Number(json.cancelled_rides),
    verificationStatus: json.verification_status,
    isGovernmentIdVerified: json.is_government_id_verified,
    isStudentVerified: json.is_student_verified,
    reportsReceivedTotal: Number(json.reports_received_total ?? 0),
    reportsReceivedConfirmed: Number(json.reports_received_confirmed ?? 0),
    accountAgeDays: Number(json.account_age_days),
    restrictions: (json.restrictions ?? []).map((r) => ({
      actionType: r.action_type,
      severity: Number(r.severity),
      status: r.status,
      source: r.source,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
    })),
  };
}

/** Whether you can create/join rides and any active restrictions. */
export async function getMyModerationStatus(): Promise<ModerationStatus> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_my_moderation_status");
  if (error) throw toTrustError(error);
  const status = data as {
    is_suspended: boolean;
    can_create_rides: boolean;
    can_join_rides: boolean;
    restrictions: TrustSummaryJson["restrictions"];
  };
  return {
    isSuspended: status.is_suspended,
    canCreateRides: status.can_create_rides,
    canJoinRides: status.can_join_rides,
    restrictions: (status.restrictions ?? []).map((r) => ({
      actionType: r.action_type,
      severity: Number(r.severity),
      status: r.status,
      source: r.source,
      startsAt: r.starts_at,
      endsAt: r.ends_at,
    })),
  };
}

export async function reportUser(
  userId: string,
  reason: ReportReason,
  details?: string,
  evidenceRefs?: string[],
): Promise<Report> {
  requireConfigured();
  const { data, error } = await supabase.rpc("report_user", {
    p_user_id: userId,
    p_reason: reason,
    p_details: details ?? null,
    p_evidence_refs: evidenceRefs ?? [],
  });
  if (error) throw toTrustError(error);
  return mapReport(data as ReportRow);
}

export async function reportRide(
  rideId: string,
  reason: ReportReason,
  details?: string,
  evidenceRefs?: string[],
): Promise<Report> {
  requireConfigured();
  const { data, error } = await supabase.rpc("report_ride", {
    p_ride_id: rideId,
    p_reason: reason,
    p_details: details ?? null,
    p_evidence_refs: evidenceRefs ?? [],
  });
  if (error) throw toTrustError(error);
  return mapReport(data as ReportRow);
}

/** Your own reports, newest first (confidential to you and moderators). */
export async function getMyReports(page = 1, pageSize = 20): Promise<ReportPage> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_my_reports", {
    p_page: page,
    p_page_size: pageSize,
  });
  if (error) throw toTrustError(error);
  const rows = (data ?? []) as ReportRow[];
  return {
    items: rows.map(mapReport),
    totalCount: Number(rows[0]?.total_count ?? 0),
  };
}

export async function submitAppeal(moderationActionId: string, reason: string): Promise<Appeal> {
  requireConfigured();
  const { data, error } = await supabase.rpc("submit_appeal", {
    p_moderation_action_id: moderationActionId,
    p_reason: reason,
  });
  if (error) throw toTrustError(error);
  return mapAppeal(data as AppealRow);
}

export async function updateAppeal(appealId: string, reason: string): Promise<Appeal> {
  requireConfigured();
  const { data, error } = await supabase.rpc("update_appeal", {
    p_appeal_id: appealId,
    p_reason: reason,
  });
  if (error) throw toTrustError(error);
  return mapAppeal(data as AppealRow);
}

/** Your appeals, newest first. */
export async function getMyAppeals(): Promise<Appeal[]> {
  requireConfigured();
  const { data, error } = await supabase.rpc("get_my_appeals");
  if (error) throw toTrustError(error);
  return ((data ?? []) as AppealRow[]).map(mapAppeal);
}
