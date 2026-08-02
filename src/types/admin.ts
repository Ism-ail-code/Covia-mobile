/**
 * Admin console models — mirrors the Phase 10 Supabase surface
 * (migrations 0027–0035): RBAC roles + permission matrix, user/ride
 * management, the verification desk, reports/appeals/moderation,
 * analytics, health/monitoring and the audit log.
 *
 * Every read and write goes through `admin_*` security-definer RPCs;
 * the tables themselves are RLS-locked. The permission matrix below is
 * a static mirror of `admin_role_permissions` used to show/hide actions
 * client-side — the RPCs still enforce the same rules server-side.
 */

export type AdminRole = "super_admin" | "admin" | "moderator" | "support_agent";

export type AdminPermission =
  | "user.view"
  | "user.manage"
  | "ride.view"
  | "ride.cancel"
  | "verification.view"
  | "verification.review"
  | "report.view"
  | "report.review"
  | "appeal.view"
  | "appeal.decide"
  | "moderation.apply"
  | "moderation.configure"
  | "analytics.view"
  | "audit.view"
  | "monitor.view"
  | "config.view"
  | "config.manage"
  | "admin.manage";

export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    "user.view", "user.manage", "ride.view", "ride.cancel",
    "verification.view", "verification.review",
    "report.view", "report.review",
    "appeal.view", "appeal.decide",
    "moderation.apply", "moderation.configure",
    "analytics.view", "audit.view", "monitor.view",
    "config.view", "config.manage", "admin.manage",
  ],
  admin: [
    "user.view", "user.manage", "ride.view", "ride.cancel",
    "verification.view", "verification.review",
    "report.view", "report.review",
    "appeal.view", "appeal.decide",
    "moderation.apply", "moderation.configure",
    "analytics.view", "audit.view", "monitor.view",
    "config.view", "config.manage",
  ],
  moderator: [
    "user.view", "ride.view", "verification.view", "verification.review",
    "report.view", "report.review", "appeal.view",
    "moderation.apply", "audit.view", "config.view",
  ],
  support_agent: ["user.view", "ride.view", "verification.view", "report.view", "appeal.view", "config.view"],
};

export function can(role: string | null, permission: AdminPermission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role as AdminRole]?.includes(permission) ?? false;
}

export type UserStatusFilter = "active" | "suspended" | "banned" | null;

export type AdminUserRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string;
  phone: string | null;
  verification_status: "Pending" | "In Review" | "Verified" | "Rejected";
  reliability_score: number;
  rating: string | null;
  total_completed_rides: number;
  total_cancelled_rides: number;
  is_banned: boolean;
  is_suspended: boolean;
  created_at: string;
  total_count: string;
};

export type AdminUserPage = { items: AdminUserRow[]; totalCount: number };

export type AdminUserProfile = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  email: string;
  phone: string | null;
  home_city: string | null;
  bio: string | null;
  verification_status: "Pending" | "In Review" | "Verified" | "Rejected";
  is_government_id_verified: boolean;
  is_student_verified: boolean;
  is_banned: boolean;
  is_suspended: boolean;
  suspension_end_at: string | null;
  rating: number | null;
  reliability_score: number;
  total_completed_rides: number;
  total_cancelled_rides: number;
  created_at: string;
  latest_verification: {
    id: string;
    verification_type: "government_id" | "student";
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
    rejection_reason: string | null;
  } | null;
  active_restrictions: number;
  reports_received_total: number;
  trust: Record<string, unknown>;
};

export type AdminUserRideHistoryRow = {
  ride_id: string;
  role: string;
  origin: string;
  destination: string;
  ride_status: string;
  departure_time: string;
  created_at: string;
  total_count: string;
};

export type AdminRideRow = {
  id: string;
  host_id: string;
  host_name: string | null;
  origin: string;
  destination: string;
  pickup_point: string | null;
  departure_time: string;
  ride_status: string;
  fare_mode: string;
  fixed_fare: string | null;
  total_seats: number;
  available_seats: number;
  passenger_count: string;
  is_student_only: boolean;
  is_women_only: boolean;
  created_at: string;
  total_count: string;
};

export type AdminRidePage = { items: AdminRideRow[]; totalCount: number };

export type AdminParticipant = {
  user_id: string;
  role: string;
  display_name: string | null;
  username: string | null;
  rating: number | null;
  reliability_score: number | null;
  joined_at: string;
  left_at: string | null;
};

export type RideTargetReport = {
  id: string;
  reporter_user_id: string;
  reporter_name: string | null;
  reason: string;
  details: string | null;
  evidence_refs: unknown;
  status: string;
  is_confirmed: boolean;
  created_at: string;
};

export type AdminRideDetails = {
  ride_id: string;
  origin: string;
  destination: string;
  pickup_point: string | null;
  destination_point: string | null;
  departure_time: string;
  estimated_arrival: string | null;
  ride_status: string;
  fare_mode: string;
  fixed_fare: string | null;
  total_seats: number;
  available_seats: number;
  is_student_only: boolean;
  is_women_only: boolean;
  notes: string | null;
  created_at: string;
  host: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    email: string;
    phone: string | null;
    rating: number | null;
    reliability_score: number | null;
    verification_status: string;
  };
  pending_requests: number;
  participants: AdminParticipant[];
  reports: RideTargetReport[];
};

export type AdminTimelineEvent = {
  id: string;
  ride_id: string;
  event_type: string;
  actor_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type VerificationQueueRow = {
  id: string;
  user_id: string;
  user_email: string;
  user_display_name: string | null;
  verification_type: "government_id" | "student";
  government_id_kind: string | null;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  front_document_url: string | null;
  back_document_url: string | null;
  selfie_url: string | null;
  student_card_url: string | null;
  university_email: string | null;
  created_at: string;
};

export type CaseHistory = {
  user_id: string;
  verifications: Array<{
    id: string;
    verification_type: string;
    status: string;
    submitted_at: string;
    reviewed_at: string | null;
    rejection_reason: string | null;
  }>;
  reports_filed: Array<{
    id: string;
    target_type: string;
    target_user_id: string | null;
    target_ride_id: string | null;
    reason: string;
    status: string;
    is_confirmed: boolean;
    created_at: string;
    resolution_note: string | null;
  }>;
  reports_received: Array<{
    id: string;
    reporter_user_id: string;
    reporter_name: string | null;
    reason: string;
    status: string;
    is_confirmed: boolean;
    created_at: string;
    resolution_note: string | null;
  }>;
  moderation_actions: Array<{
    id: string;
    action_type: string;
    severity: number;
    status: string;
    reason: string | null;
    source: string;
    starts_at: string | null;
    ends_at: string | null;
    created_at: string;
  }>;
  appeals: Array<{
    id: string;
    moderation_action_id: string;
    reason: string;
    status: string;
    moderator_note: string | null;
    decided_at: string | null;
    created_at: string;
  }>;
  reliability_events: Array<{
    id: string;
    event_type: string;
    weight: number;
    reason: string | null;
    ride_id: string | null;
    created_at: string;
  }>;
  rides: Array<{
    ride_id: string;
    role: string;
    origin: string;
    destination: string;
    ride_status: string;
    departure_time: string;
    created_at: string;
  }>;
};

export type ReportRow = {
  id: string;
  reporter_user_id: string;
  reporter_name: string | null;
  target_type: string;
  target_user_id: string | null;
  target_user_name: string | null;
  target_ride_id: string | null;
  reason: string;
  details: string | null;
  evidence_refs: unknown;
  status: string;
  is_confirmed: boolean;
  resolution_note: string | null;
  created_at: string;
  total_count: string;
};

export type ReportPage = { items: ReportRow[]; totalCount: number };

export type AppealRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  moderation_action_id: string;
  action_type: string;
  appeal_reason: string;
  status: string;
  moderator_note: string | null;
  decided_at: string | null;
  created_at: string;
  total_count: string;
};

export type AppealPage = { items: AppealRow[]; totalCount: number };

export type ModerationActionRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  action_type: string;
  severity: number;
  status: string;
  reason: string | null;
  source: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  total_count: string;
};

export type ModerationRuleRow = {
  rule_name: string;
  threshold: number | null;
  action_type: string | null;
  duration_hours: number | null;
  severity: number;
  enabled: boolean;
  total_count: string;
};

export type ReliabilityEventRow = {
  id: string;
  user_id: string;
  user_name: string | null;
  event_type: string;
  weight: number;
  reason: string | null;
  ride_id: string | null;
  created_at: string;
  total_count: string;
};

export type AuditRow = {
  id: string;
  actor_user_id: string;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  details: Record<string, unknown> | null;
  created_at: string;
  total_count: string;
};

export type AuditPage = { items: AuditRow[]; totalCount: number };

export type MonitoringEventRow = {
  id: string;
  source: string;
  level: string;
  message: string;
  details: unknown;
  created_at: string;
  total_count: string;
};

export type MonitoringEventPage = { items: MonitoringEventRow[]; totalCount: number };

export type HealthCheck = { name: string; ok: boolean; detail: string | null };

export type PlatformHealth = {
  status: "ok" | "degraded";
  checked_at: string;
  checks: HealthCheck[];
  database_size_mb: number;
};

export type AnalyticsDaily = { day: string; registrations: number };

export type AnalyticsJson = {
  users: {
    overview: {
      total_users: number;
      verified_users: number;
      government_id_verified: number;
      student_verified: number;
      banned_users: number;
      suspended_users: number;
      new_users_7d: number;
      active_users_7d: number;
      active_users_30d: number;
    };
    daily_registrations: AnalyticsDaily[];
    weekly_retention: Array<{ cohort: string; signups: number; active_next_week: number; retention: number | null }>;
  };
  rides: {
    overview: {
      total_rides: number;
      published_rides: number;
      in_progress_rides: number;
      completed_rides: number;
      cancelled_rides: number;
      expired_rides: number;
      average_occupancy: number | null;
      rides_7d: number;
    };
    popular_routes: Array<{ origin: string; destination: string; rides: number }>;
  };
  safety: {
    safety_events: number;
    reports_submitted: number;
    reports_pending: number;
    reports_resolved: number;
    by_event_type: Array<{ event_type: string; count: number }>;
  };
  platform: {
    notifications_sent: number;
    notifications_unread: number;
    push_tokens: number;
    outbound_by_status: Record<string, number>;
    pending_outbound: number;
    database: {
      database_size_mb: number;
      active_connections: number;
      cache_hit_ratio: number | null;
      transaction_commit_rate: number | null;
    };
    storage: Array<{ bucket: string; objects: number; bytes: number }>;
    rpc_latency: Array<{ name: string; calls: number; avg_ms: number }> | null;
    largest_tables: Array<{ table: string; rows: number; size_mb: number }> | null;
  };
};

export type AdminTeamRow = {
  user_id: string;
  email: string;
  display_name: string | null;
  role_name: AdminRole;
  created_at: string;
};
