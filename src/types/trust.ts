/**
 * Trust models — ratings, reviews, reliability, reports, appeals and
 * moderation.
 *
 * Mirrors the Phase 9 Supabase schema (0023–0026): double-blind post-ride
 * ratings that reveal only when both sides rate or the 72-hour review
 * window expires, a reliability score (90 baseline, ± ride events),
 * confidential reports, appealable moderation actions and the trust
 * summaries shown on profiles. Every read and write goes through
 * security-definer RPCs; the tables themselves are RLS-locked.
 */

export type RatingRole = "Host" | "Passenger";

export type Rating = {
  id: string;
  rideId: string;
  raterUserId: string;
  rateeUserId: string;
  roleOfRater: RatingRole;
  overallRating: number;
  punctuality: number | null;
  communication: number | null;
  respectfulness: number | null;
  reliability: number | null;
  isRevealed: boolean;
  revealedAt: string | null;
  createdAt: string;
};

/** Everything a rater can supply (comment is the review). */
export type RatingInput = {
  overallRating: number;
  punctuality?: number | null;
  communication?: number | null;
  respectfulness?: number | null;
  reliability?: number | null;
  comment?: string | null;
};

/** One row per rateable counterpart on a completed ride, from your view. */
export type RideRatingStatus = {
  rateeUserId: string;
  myRole: RatingRole;
  ratingId: string | null;
  overallRating: number | null;
  punctuality: number | null;
  communication: number | null;
  respectfulness: number | null;
  reliability: number | null;
  isRevealed: boolean;
  revealedAt: string | null;
  review: string | null;
  reviewProfanityFlag: boolean;
  reciprocalSubmitted: boolean;
  windowExpired: boolean;
};

/** A revealed rating on a user's public profile block. */
export type UserRating = {
  id: string;
  rideId: string;
  raterUserId: string;
  raterName: string | null;
  overallRating: number;
  punctuality: number | null;
  communication: number | null;
  respectfulness: number | null;
  reliability: number | null;
  comment: string | null;
  createdAt: string;
};

export type UserRatingPage = {
  items: UserRating[];
  totalCount: number;
};

export type ReportReason =
  | "no_show"
  | "harassment"
  | "fake_identity"
  | "dangerous_behavior"
  | "fraud"
  | "inappropriate_content"
  | "other";

export type ReportTargetType = "user" | "ride" | "chat_message";

export type ReportStatus = "pending" | "under_review" | "resolved" | "dismissed";

/** A confidential report (only the reporter and moderators can see it). */
export type Report = {
  id: string;
  targetType: ReportTargetType;
  targetUserId: string | null;
  targetRideId: string | null;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  isConfirmed: boolean;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type ReportPage = {
  items: Report[];
  totalCount: number;
};

export type ModerationActionType =
  | "warning"
  | "temporary_restriction"
  | "ride_creation_disabled"
  | "ride_joining_disabled"
  | "suspension";

export type AppealStatus = "pending" | "under_review" | "approved" | "rejected";

export type Appeal = {
  id: string;
  moderationActionId: string;
  actionType: ModerationActionType;
  actionStatus: string;
  actionReason: string;
  appealReason: string;
  status: AppealStatus;
  moderatorNote: string | null;
  decidedAt: string | null;
  createdAt: string;
};

export type ModerationRestriction = {
  actionType: ModerationActionType;
  severity: number;
  status: string;
  source: "automatic" | "manual";
  startsAt: string | null;
  endsAt: string | null;
};

/** Your moderation standing: what you can still do, and active actions. */
export type ModerationStatus = {
  isSuspended: boolean;
  canCreateRides: boolean;
  canJoinRides: boolean;
  restrictions: ModerationRestriction[];
};

/** Full trust profile (visible to you and, with extra keys, moderators). */
export type TrustSummary = {
  userId: string;
  averageRating: number;
  ratingCount: number;
  reliabilityScore: number;
  completedRides: number;
  cancelledRides: number;
  verificationStatus: string;
  isGovernmentIdVerified: boolean;
  isStudentVerified: boolean;
  reportsReceivedTotal: number;
  reportsReceivedConfirmed: number;
  accountAgeDays: number;
  restrictions: ModerationRestriction[];
};

/** The subset shown to other users on a profile. */
export type PublicTrustSummary = Omit<
  TrustSummary,
  "reportsReceivedTotal" | "reportsReceivedConfirmed"
>;

export type TrustConfig = {
  reviewWindowHours: number;
};
