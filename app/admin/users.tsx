import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRight, Search, Users as UsersIcon } from "lucide-react-native";
import { colors, gutter, radius, shadows } from "@/theme";
import { AppText } from "@/components/ui/AppText";
import { PhoneShell, Screen } from "@/components/app/PhoneShell";
import { TopBar } from "@/components/app/TopBar";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/app/EmptyState";
import { Button } from "@/components/ui/Button";
import { AdminTabBar } from "@/components/admin/AdminTabBar";
import { adminSearchUsers } from "@/services/admin";
import type { AdminUserRow, UserStatusFilter } from "@/types/admin";

const VERIFICATION_FILTERS = ["All", "Pending", "In Review", "Verified", "Rejected"];
const STATUS_FILTERS: Array<{ label: string; value: UserStatusFilter }> = [
  { label: "All", value: null },
  { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
  { label: "Banned", value: "banned" },
];

const PAGE_SIZE = 30;

function UserRow({ user }: { user: AdminUserRow }) {
  const router = useRouter();
  const display = user.display_name ?? user.username ?? user.email.split("@")[0];
  const initials = display.slice(0, 2).toUpperCase();
  return (
    <Pressable
      onPress={() => router.push(`/admin/users/${user.id}`)}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderRadius: radius["2xl"],
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: 12,
          ...shadows.soft,
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <Avatar size={44} src={null} name={display} fallback={initials} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <AppText size="sm" weight={700} numberOfLines={1} style={{ flexShrink: 1 }}>
            {display}
          </AppText>
          {user.is_banned ? (
            <View style={{ borderRadius: radius.full, backgroundColor: colors.destructiveSoft, paddingHorizontal: 8, paddingVertical: 2 }}>
              <AppText size="xs" weight={700} color={colors.destructive}>Banned</AppText>
            </View>
          ) : user.is_suspended ? (
            <View style={{ borderRadius: radius.full, backgroundColor: colors.warningSoft, paddingHorizontal: 8, paddingVertical: 2 }}>
              <AppText size="xs" weight={700} color={colors.warningForeground}>Suspended</AppText>
            </View>
          ) : null}
        </View>
        <AppText size="xs" color={colors.mutedForeground} numberOfLines={1}>
          {user.email}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
          <AppText size="xs" weight={600} color={user.verification_status === "Verified" ? colors.success : colors.mutedForeground}>
            {user.verification_status}
          </AppText>
          <AppText size="xs" color={colors.mutedForeground}>
            · {user.total_completed_rides} rides
          </AppText>
          <AppText size="xs" color={colors.mutedForeground}>
            · ⭐ {user.rating ? Number(user.rating).toFixed(1) : "—"}
          </AppText>
        </View>
      </View>
      <ChevronRight size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function AdminUsers() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [verification, setVerification] = useState("All");
  const [status, setStatus] = useState<UserStatusFilter>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const load = useCallback(
    async (refreshingNow = false) => {
      if (refreshingNow) setRefreshing(true);
      else setLoading(true);
      try {
        const pageResult = await adminSearchUsers({
          query: debouncedQuery || null,
          verificationStatus: verification === "All" ? null : verification,
          status,
          page: 1,
          pageSize: PAGE_SIZE,
        });
        setUsers(pageResult.items);
        setTotal(pageResult.totalCount);
        setPage(1);
        setError(null);
      } catch (e) {
        setError((e as Error).message || "Couldn't load users.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedQuery, verification, status],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (loadingMore || users.length >= total) return;
    setLoadingMore(true);
    try {
      const next = await adminSearchUsers({
        query: debouncedQuery || null,
        verificationStatus: verification === "All" ? null : verification,
        status,
        page: page + 1,
        pageSize: PAGE_SIZE,
      });
      setUsers((prev) => [...prev, ...next.items]);
      setPage((p) => p + 1);
    } catch (e) {
      setError((e as Error).message || "Couldn't load more users.");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, users.length, total, debouncedQuery, verification, status, page]);

  return (
    <PhoneShell>
      <Screen>
        <TopBar title="Users" subtitle={`${total.toLocaleString()} accounts`} />
        <View style={{ paddingHorizontal: gutter, gap: 10, paddingVertical: 12 }}>
          <Input
            icon={<Search size={16} color={colors.mutedForeground} />}
            placeholder="Search name, email or phone…"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {VERIFICATION_FILTERS.map((v) => (
              <Chip key={v} active={verification === v} onPress={() => setVerification(v)}>
                {v}
              </Chip>
            ))}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {STATUS_FILTERS.map((s) => (
              <Chip key={s.label} active={status === s.value} onPress={() => setStatus(s.value)}>
                {s.label}
              </Chip>
            ))}
          </ScrollView>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 24, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.primary} />}
        >
          {loading ? (
            <AppText size="sm" color={colors.mutedForeground} style={{ paddingVertical: 24, textAlign: "center" }}>
              Loading users…
            </AppText>
          ) : error && users.length === 0 ? (
            <EmptyState
              icon={<UsersIcon size={26} color={colors.primary} />}
              title="Couldn't load users"
              body={error}
              action={
                <Button variant="secondary" onPress={() => void load()}>
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>Try again</AppText>
                </Button>
              }
            />
          ) : users.length === 0 ? (
            <EmptyState
              icon={<Search size={26} color={colors.primary} />}
              title="No users found"
              body="Try a different search term or filter."
            />
          ) : (
            <>
              {users.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
              {users.length < total ? (
                <Button
                  variant="secondary"
                  disabled={loadingMore}
                  onPress={() => void loadMore()}
                  style={{ height: 44, borderRadius: radius.lg }}
                >
                  <AppText size="sm" weight={600} color={colors.secondaryForeground}>
                    {loadingMore ? "Loading…" : `Load more (${users.length} of ${total})`}
                  </AppText>
                </Button>
              ) : null}
            </>
          )}
        </ScrollView>
        <AdminTabBar />
      </Screen>
    </PhoneShell>
  );
}
