/**
 * Admin console service — typed wrappers over the Phase 10 `admin_*`
 * RPCs (migrations 0027–0035). Every function is security definer and
 * re-checks its own permission server-side; the app mirrors the RBAC
 * matrix in `src/types/admin.ts` to hide actions the signed-in role
 * cannot take. Error contract: 42501 → "you don't have permission",
 * 28000 → not signed in.
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  AdminRideDetails,
  AdminRidePage,
  AdminTimelineEvent,
  AdminUserPage,
  AdminUserProfile,
  AdminUserRideHistoryRow,
  AnalyticsJson,
  AppealPage,
  AuditPage,
  CaseHistory,
  ModerationActionRow,
  ModerationRuleRow,
  MonitoringEventPage,
  PlatformHealth,
  ReliabilityEventRow,
  ReportPage,
  UserStatusFilter,
  VerificationQueueRow,
  AdminTeamRow,
} from "@/types/admin";

export class AdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminError";
  }
}

function toAdminError(error: unknown, fallback: string): AdminError {
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message.includes("42501")) {
      return new AdminError("You don't have permission for this action.");
    }
    if (message.includes("28000")) {
      return new AdminError("You need to be logged in.");
    }
    return new AdminError(message || fallback);
  }
  return new AdminError(fallback);
}

function pageResult<T extends { total_count: string | null }>(rows: T[]): { items: T[]; totalCount: number } {
  return { items: rows, totalCount: rows.length > 0 ? Number(rows[0].total_count) : 0 };
}

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}

export async function currentAdminRole(): Promise<string | null> {
  const { data, error } = await supabase.rpc("current_admin_role");
  if (error) return null;
  return (data as string | null) ?? null;
}

export async function hasPermission(permission: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_permission", { p_permission: permission });
  if (error) return false;
  return data === true;
}

// ── Users ───────────────────────────────────────────────────────────

export async function adminSearchUsers(input: {
  query?: string | null;
  verificationStatus?: string | null;
  status?: UserStatusFilter;
  page?: number;
  pageSize?: number;
}): Promise<AdminUserPage> {
  const { data, error } = await supabase.rpc("admin_search_users", {
    p_query: input.query ?? null,
    p_verification_status: input.verificationStatus ?? null,
    p_status: input.status ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 50,
  });
  if (error) throw toAdminError(error, "Couldn't search users.");
  return pageResult((data as AdminUserPage["items"]) ?? []);
}

export async function adminGetUserProfile(userId: string): Promise<AdminUserProfile> {
  const { data, error } = await supabase.rpc("admin_get_user_profile", { p_user_id: userId });
  if (error) throw toAdminError(error, "Couldn't load the user profile.");
  return data as AdminUserProfile;
}

export async function adminGetUserRideHistory(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<AdminUserRideHistoryRow[]> {
  const { data, error } = await supabase.rpc("admin_get_user_ride_history", {
    p_user_id: userId,
    p_page: page,
    p_page_size: pageSize,
  });
  if (error) throw toAdminError(error, "Couldn't load the user's ride history.");
  return (data as AdminUserRideHistoryRow[]) ?? [];
}

export async function adminGetCaseHistory(userId: string): Promise<CaseHistory> {
  const { data, error } = await supabase.rpc("admin_get_case_history", { p_user_id: userId });
  if (error) throw toAdminError(error, "Couldn't load the case history.");
  return data as CaseHistory;
}

export async function adminSuspendUser(userId: string, reason: string, durationHours?: number | null): Promise<void> {
  const { error } = await supabase.rpc("admin_suspend_user", {
    p_user_id: userId,
    p_reason: reason,
    p_duration_hours: durationHours ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't suspend the user.");
}

export async function adminBanUser(userId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("admin_ban_user", { p_user_id: userId, p_reason: reason });
  if (error) throw toAdminError(error, "Couldn't ban the user.");
}

export async function adminReactivateUser(userId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("admin_reactivate_user", { p_user_id: userId, p_reason: reason });
  if (error) throw toAdminError(error, "Couldn't reactivate the user.");
}

// ── Rides ───────────────────────────────────────────────────────────

export async function adminSearchRides(input: {
  query?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<AdminRidePage> {
  const { data, error } = await supabase.rpc("admin_search_rides", {
    p_query: input.query ?? null,
    p_status: input.status ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 50,
  });
  if (error) throw toAdminError(error, "Couldn't search rides.");
  return pageResult((data as AdminRidePage["items"]) ?? []);
}

export async function adminGetRideDetails(rideId: string): Promise<AdminRideDetails> {
  const { data, error } = await supabase.rpc("admin_get_ride_details", { p_ride_id: rideId });
  if (error) throw toAdminError(error, "Couldn't load the ride details.");
  return data as AdminRideDetails;
}

export async function adminGetRideTimeline(rideId: string): Promise<AdminTimelineEvent[]> {
  const { data, error } = await supabase.rpc("admin_get_ride_timeline", { p_ride_id: rideId });
  if (error) throw toAdminError(error, "Couldn't load the ride timeline.");
  return (data as AdminTimelineEvent[]) ?? [];
}

export async function adminCancelRide(rideId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("admin_cancel_ride", { p_ride_id: rideId, p_reason: reason });
  if (error) throw toAdminError(error, "Couldn't cancel the ride.");
}

// ── Verification ────────────────────────────────────────────────────

export async function adminListVerifications(input: {
  status?: string;
  search?: string | null;
  verificationType?: string | null;
}): Promise<VerificationQueueRow[]> {
  const { data, error } = await supabase.rpc("admin_list_verifications", {
    p_status: input.status ?? "pending",
    p_search: input.search ?? null,
    p_verification_type: input.verificationType ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't load the verification queue.");
  return (data as VerificationQueueRow[]) ?? [];
}

export async function adminReviewVerification(
  submissionId: string,
  action: "approve" | "reject" | "request_resubmission",
  reason?: string | null,
): Promise<void> {
  const { error } = await supabase.rpc("admin_review_verification", {
    p_submission_id: submissionId,
    p_action: action,
    p_reason: reason ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't review the submission.");
}

// ── Reports ─────────────────────────────────────────────────────────

export async function adminListReports(input: {
  status?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<ReportPage> {
  const { data, error } = await supabase.rpc("admin_list_reports", {
    p_status: input.status ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 20,
  });
  if (error) throw toAdminError(error, "Couldn't load reports.");
  return pageResult((data as ReportPage["items"]) ?? []);
}

export async function adminReviewReport(reportId: string, confirm: boolean, note?: string | null): Promise<void> {
  const { error } = await supabase.rpc("admin_review_report", {
    p_report_id: reportId,
    p_confirm: confirm,
    p_note: note ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't review the report.");
}

// ── Appeals ─────────────────────────────────────────────────────────

export async function adminListAppeals(input: {
  status?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<AppealPage> {
  const { data, error } = await supabase.rpc("admin_list_appeals", {
    p_status: input.status ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 20,
  });
  if (error) throw toAdminError(error, "Couldn't load appeals.");
  return pageResult((data as AppealPage["items"]) ?? []);
}

export async function adminDecideAppeal(appealId: string, approve: boolean, note?: string | null): Promise<void> {
  const { error } = await supabase.rpc("admin_decide_appeal", {
    p_appeal_id: appealId,
    p_approve: approve,
    p_note: note ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't decide the appeal.");
}

// ── Moderation ──────────────────────────────────────────────────────

export async function adminApplyModerationAction(
  userId: string,
  actionType: string,
  reason: string,
  durationHours?: number | null,
): Promise<void> {
  const { error } = await supabase.rpc("admin_apply_moderation_action", {
    p_user_id: userId,
    p_action_type: actionType,
    p_reason: reason,
    p_duration_hours: durationHours ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't apply the moderation action.");
}

export async function adminLiftModerationAction(actionId: string, reason: string): Promise<void> {
  const { error } = await supabase.rpc("admin_lift_moderation_action", {
    p_action_id: actionId,
    p_reason: reason,
  });
  if (error) throw toAdminError(error, "Couldn't lift the action.");
}

export async function adminListModerationActions(input: {
  userId?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<ModerationActionRow[]> {
  const { data, error } = await supabase.rpc("admin_list_moderation_actions", {
    p_user_id: input.userId ?? null,
    p_status: input.status ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 20,
  });
  if (error) throw toAdminError(error, "Couldn't load moderation actions.");
  return (data as ModerationActionRow[]) ?? [];
}

export async function adminListModerationRules(): Promise<ModerationRuleRow[]> {
  const { data, error } = await supabase.rpc("admin_list_moderation_rules", { p_page: 1, p_page_size: 100 });
  if (error) throw toAdminError(error, "Couldn't load moderation rules.");
  return (data as ModerationRuleRow[]) ?? [];
}

export async function adminUpdateModerationRule(input: {
  ruleName: string;
  threshold?: number | null;
  actionType?: string | null;
  durationHours?: number | null;
  enabled?: boolean | null;
}): Promise<void> {
  const { error } = await supabase.rpc("admin_update_moderation_rule", {
    p_rule_name: input.ruleName,
    p_threshold: input.threshold ?? null,
    p_action_type: input.actionType ?? null,
    p_duration_hours: input.durationHours ?? null,
    p_enabled: input.enabled ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't update the rule.");
}

export async function adminListReliabilityEvents(userId?: string | null): Promise<ReliabilityEventRow[]> {
  const { data, error } = await supabase.rpc("admin_list_reliability_events", {
    p_user_id: userId ?? null,
    p_page: 1,
    p_page_size: 100,
  });
  if (error) throw toAdminError(error, "Couldn't load reliability events.");
  return (data as ReliabilityEventRow[]) ?? [];
}

// ── Analytics / Health / Monitoring ─────────────────────────────────

export async function adminGetAnalytics(): Promise<AnalyticsJson> {
  const { data, error } = await supabase.rpc("admin_get_analytics");
  if (error) throw toAdminError(error, "Couldn't load analytics.");
  return data as AnalyticsJson;
}

export async function getPlatformHealth(): Promise<PlatformHealth> {
  const { data, error } = await supabase.rpc("get_platform_health");
  if (error) throw toAdminError(error, "Couldn't check platform health.");
  return data as PlatformHealth;
}

export async function adminListMonitoringEvents(input: {
  level?: string | null;
  source?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<MonitoringEventPage> {
  const { data, error } = await supabase.rpc("admin_list_monitoring_events", {
    p_level: input.level ?? null,
    p_source: input.source ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 50,
  });
  if (error) throw toAdminError(error, "Couldn't load monitoring events.");
  return pageResult((data as MonitoringEventPage["items"]) ?? []);
}

export async function adminUpdateSafetyConfig(changes: {
  routeDeviationMeters?: number | null;
  stopThresholdSeconds?: number | null;
  safetyCheckTimeoutSeconds?: number | null;
  neverStartedMinutes?: number | null;
  exceededDurationMinutes?: number | null;
  notifyParticipantsOnSos?: boolean | null;
  sosRepeatWindowSeconds?: number | null;
  liveLocationRetentionHours?: number | null;
}): Promise<void> {
  const { error } = await supabase.rpc("admin_update_safety_config", {
    p_route_deviation_meters: changes.routeDeviationMeters ?? null,
    p_stop_threshold_seconds: changes.stopThresholdSeconds ?? null,
    p_safety_check_timeout_seconds: changes.safetyCheckTimeoutSeconds ?? null,
    p_never_started_minutes: changes.neverStartedMinutes ?? null,
    p_exceeded_duration_minutes: changes.exceededDurationMinutes ?? null,
    p_notify_participants_on_sos: changes.notifyParticipantsOnSos ?? null,
    p_sos_repeat_window_seconds: changes.sosRepeatWindowSeconds ?? null,
    p_live_location_retention_hours: changes.liveLocationRetentionHours ?? null,
  });
  if (error) throw toAdminError(error, "Couldn't update the safety config.");
}

// ── Audit / Team ────────────────────────────────────────────────────

export async function adminListAuditLog(input: {
  actorUserId?: string | null;
  action?: string | null;
  targetType?: string | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
}): Promise<AuditPage> {
  const { data, error } = await supabase.rpc("admin_list_audit_log", {
    p_actor_user_id: input.actorUserId ?? null,
    p_action: input.action ?? null,
    p_target_type: input.targetType ?? null,
    p_target_id: null,
    p_from: input.from ?? null,
    p_to: input.to ?? null,
    p_page: input.page ?? 1,
    p_page_size: input.pageSize ?? 50,
  });
  if (error) throw toAdminError(error, "Couldn't load the audit log.");
  return pageResult((data as AuditPage["items"]) ?? []);
}

export async function adminListAdminUsers(): Promise<AdminTeamRow[]> {
  const { data, error } = await supabase.rpc("admin_list_admin_users");
  if (error) throw toAdminError(error, "Couldn't load the admin team.");
  return (data as AdminTeamRow[]) ?? [];
}

export async function adminSetAdminRole(userId: string, roleName: string): Promise<void> {
  const { error } = await supabase.rpc("admin_set_admin_role", { p_user_id: userId, p_role_name: roleName });
  if (error) throw toAdminError(error, "Couldn't update the admin role.");
}

export async function adminRemoveAdmin(userId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_remove_admin", { p_user_id: userId });
  if (error) throw toAdminError(error, "Couldn't remove the admin.");
}

export { isSupabaseConfigured };
