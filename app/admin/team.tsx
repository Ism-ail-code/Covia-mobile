import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { CheckCircle2, Search, ShieldAlert, UserCog, UserPlus } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { StatusBanner, EmptyState } from "@/components/app/EmptyState";
import { useAuth } from "@/context/AuthContext";
import { adminListAdminUsers, adminRemoveAdmin, adminSearchUsers, adminSetAdminRole } from "@/services/admin";
import { can } from "@/types/admin";
import type { AdminRole, AdminTeamRow } from "@/types/admin";

const ROLES: AdminRole[] = ["super_admin", "admin", "moderator", "support_agent"];

export default function AdminTeam() {
  const { adminRole, user } = useAuth();
  const canManage = can(adminRole, "admin.manage");
  const [team, setTeam] = useState<AdminTeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ id: string; display_name: string | null; username: string | null; email: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (refreshingNow = false) => {
    if (refreshingNow) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await adminListAdminUsers();
      setTeam(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message || "Couldn't load the admin team.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!addOpen) return;
    if (timer.current) clearTimeout(timer.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      setSearching(true);
      adminSearchUsers({ query: query.trim(), page: 1, pageSize: 10 })
        .then((page) => {
          setResults(page.items.map((u) => ({ id: u.id, display_name: u.display_name, username: u.username, email: u.email })));
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, addOpen]);

  const setRole = useCallback(
    async (userId: string, role: AdminRole) => {
      if (userId === user?.id && role !== adminRole) {
        setActionError("You can't change your own role.");
        return;
      }
      setBusyId(userId);
      setActionError(null);
      try {
        await adminSetAdminRole(userId, role);
        setLastAction(`Role updated.`);
        await load();
      } catch (e) {
        setActionError((e as Error).message || "Couldn't update the role.");
      } finally {
        setBusyId(null);
      }
    },
    [user?.id, adminRole, load],
  );

  const remove = useCallback(
    async (userId: string) => {
      if (userId === user?.id) {
        setActionError("You can't remove yourself.");
        return;
      }
      setBusyId(userId);
      setActionError(null);
      try {
        await adminRemoveAdmin(userId);
        setLastAction("Admin removed.");
        await load();
      } catch (e) {
        setActionError((e as Error).message || "Couldn't remove the admin.");
      } finally {
        setBusyId(null);
      }
    },
    [user?.id, load],
  );

  return (
    <PhoneShell>
      <Screen>
        <TopBar
          title="Admin team"
          subtitle={`${team.length} members`}
          back
          action={
            canManage ? (
              <Pressable onPress={() => setAddOpen(true)} accessibilityLabel="Add admin" style={{ height: 40, width: 40, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                <UserPlus size={18} color={colors.primaryForeground} />
              </Pressable>
            ) : undefined
          }
        />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32, gap: 10, paddingTop: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {!canManage ? (
            <EmptyState
              icon={<ShieldAlert size={26} color={colors.mutedForeground} />}
              title="Read-only"
              body="Only a super admin can manage the admin team."
            />
          ) : loading ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ textAlign: "center", paddingVertical: 24 }}>
              Loading team…
            </AppText>
          ) : error && team.length === 0 ? (
            <EmptyState
              icon={<UserCog size={26} color={colors.primary} />}
              title="Couldn't load the team"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : (
            <>
              {lastAction ? (
                <StatusBanner tone="success" icon={<CheckCircle2 size={16} color={colors.success} />} title={lastAction} />
              ) : null}
              {actionError ? (
                <AppText size="xs" color={colors.destructive} style={{ textAlign: "center" }}>{actionError}</AppText>
              ) : null}
              {team.map((member) => {
                const display = member.display_name ?? member.email.split("@")[0];
                const isSelf = member.user_id === user?.id;
                return (
                  <View
                    key={member.user_id}
                    style={[
                      {
                        borderRadius: radius["2xl"],
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                        padding: 14,
                        gap: 10,
                        ...shadows.soft,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                      <Avatar size={40} src={null} name={display} fallback={display.slice(0, 2).toUpperCase()} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText size="sm" weight={700} numberOfLines={1}>
                          {display} {isSelf ? "(you)" : ""}
                        </AppText>
                        <AppText size="xs" color={colors.mutedForeground} numberOfLines={1}>{member.email}</AppText>
                      </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {ROLES.map((r) => (
                        <Chip
                          key={r}
                          active={member.role_name === r}
                          onPress={() => void setRole(member.user_id, r)}
                        >
                          {busyId === member.user_id ? "…" : r.replace(/_/g, " ")}
                        </Chip>
                      ))}
                    </ScrollView>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSelf}
                      onPress={() => void remove(member.user_id)}
                      style={{ alignSelf: "flex-start" }}
                    >
                      Remove from team
                    </Button>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

        <Dialog visible={addOpen} onClose={() => setAddOpen(false)} title="Add team member">
          <View style={{ gap: 12 }}>
            <Input
              icon={<Search size={16} color={colors.mutedForeground} />}
              placeholder="Search by name or email…"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
            {searching ? (
              <AppText size="xs" color={colors.mutedForeground}>Searching…</AppText>
            ) : results.length === 0 ? (
              <AppText size="xs" color={colors.mutedForeground}>
                {query.trim() ? "No members found." : "Type at least 2 characters to search."}
              </AppText>
            ) : (
              <View style={{ gap: 8, maxHeight: 280 }}>
                {results.map((u) => {
                  const already = team.some((t) => t.user_id === u.id);
                  return (
                    <View key={u.id} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Avatar size={36} src={null} name={u.display_name ?? u.email} fallback={(u.display_name ?? u.email).slice(0, 2).toUpperCase()} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText size="sm" weight={600} numberOfLines={1}>{u.display_name ?? u.username ?? u.email}</AppText>
                        <AppText size="xs" color={colors.mutedForeground} numberOfLines={1}>{u.email}</AppText>
                      </View>
                      <Button
                        size="sm"
                        variant={already ? "secondary" : "default"}
                        disabled={already || addingId === u.id}
                        onPress={() => {
                          setAddingId(u.id);
                          setActionError(null);
                          adminSetAdminRole(u.id, "support_agent")
                            .then(async () => {
                              setAddOpen(false);
                              setQuery("");
                              setResults([]);
                              setLastAction("Team member added as support agent — change their role above.");
                              await load();
                            })
                            .catch((e) => setActionError((e as Error).message || "Couldn't add the member."))
                            .finally(() => setAddingId(null));
                        }}
                      >
                        {addingId === u.id ? "…" : already ? "Member" : "Add"}
                      </Button>
                    </View>
                  );
                })}
              </View>
            )}
            {actionError ? (
              <AppText size="xs" color={colors.destructive}>{actionError}</AppText>
            ) : null}
            <Button variant="outline" onPress={() => setAddOpen(false)} style={{ height: 44, borderRadius: radius.lg }}>
              Close
            </Button>
          </View>
        </Dialog>
      </Screen>
    </PhoneShell>
  );
}
