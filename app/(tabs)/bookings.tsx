import { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";
import { getBookings } from "@/src/lib/api";

const POLL_INTERVAL = 10_000;

interface Booking {
  id: string; name: string; phone: string;
  pickup: string; dropoff: string; stops?: string | null;
  pickupDetails?: string | null; dropoffDetails?: string | null; buildingInfo?: string | null;
  date: string; time: string;
  fare: number; meterFare?: number | null; cashCollected?: number | null;
  fareType?: string; status: string; vehicle: string;
  isRecurring?: boolean;
  isPriority?: boolean;
}

const tabs = [
  { key: "assigned", label: "New" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Past" },
];

const statusColors: Record<string, string> = {
  assigned: COLORS.gold,
  accepted: "#06B6D4",
  arrived: "#14B8A6",
  "in-progress": "#A855F7",
  completed: COLORS.green,
  cancelled: COLORS.red,
};

export default function BookingsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState("assigned");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [counts, setCounts] = useState({ assigned: 0, active: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getBookings(filter);
      if (res.success) setBookings(res.bookings || []);
    } catch {}
    setLoading(false);
  }, [filter]);

  const loadCounts = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([
        getBookings("assigned"), getBookings("active"), getBookings("completed"),
      ]);
      setCounts({
        assigned: a.bookings?.length || 0,
        active: b.bookings?.length || 0,
        completed: c.bookings?.length || 0,
      });
    } catch {}
  }, []);

  useEffect(() => { setLoading(true); load(); }, [load]);

  useEffect(() => {
    loadCounts();
    intervalRef.current = setInterval(() => { load(); loadCounts(); }, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load, loadCounts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bookings</Text>

      <View style={styles.tabs}>
        {tabs.map((t) => {
          const count = counts[t.key as keyof typeof counts] || 0;
          return (
            <TouchableOpacity key={t.key} activeOpacity={0.7}
              onPress={() => setFilter(t.key)}
              style={[styles.tab, filter === t.key && styles.tabActive]}>
              <Text style={[styles.tabText, filter === t.key && styles.tabTextActive]}>
                {t.label}{count > 0 ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}>
        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        ) : bookings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.gray500} />
            <Text style={styles.emptyText}>No bookings</Text>
            <Text style={styles.emptySub}>
              {filter === "assigned" ? "New bookings will appear here" : "No bookings in this category"}
            </Text>
          </View>
        ) : (
          bookings.map((b) => (
            <TouchableOpacity key={b.id} activeOpacity={0.7}
              onPress={() => router.push(`/booking-detail?id=${b.id}`)}
              style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.cardName}>{b.name}</Text>
                    {b.isRecurring && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(168,85,247,0.15)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Ionicons name="repeat" size={10} color="#A855F7" />
                        <Text style={{ color: "#A855F7", fontSize: 9, fontWeight: "800" }}>RECURRING</Text>
                      </View>
                    )}
                    {b.isPriority && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(249,115,22,0.15)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                        <Ionicons name="flash" size={10} color="#F97316" />
                        <Text style={{ color: "#F97316", fontSize: 9, fontWeight: "800" }}>PRIORITY</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardDate}>{b.date} at {b.time}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: (statusColors[b.status] || "#6B7280") + "20" }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColors[b.status] || "#6B7280" }]} />
                  <Text style={[styles.statusText, { color: statusColors[b.status] || "#6B7280" }]}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.locationRow}>
                  <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
                  <Text style={styles.locationText} numberOfLines={1}>{b.pickup}</Text>
                </View>
                {b.pickupDetails ? <Text style={{ color: COLORS.gold, fontSize: 10, fontStyle: "italic", marginLeft: 18, marginTop: -4 }}>{b.pickupDetails}</Text> : null}
                {b.buildingInfo ? <Text style={{ color: "#F59E0B", fontSize: 10, fontStyle: "italic", marginLeft: 18, marginTop: -4 }}>🏠 {b.buildingInfo}</Text> : null}
                {b.stops && (() => { try { const s: string[] = JSON.parse(b.stops); return s.map((addr, i) => (
                  <View key={i} style={styles.locationRow}>
                    <View style={[styles.dot, { backgroundColor: "#F59E0B" }]} />
                    <Text style={styles.locationText} numberOfLines={1}>{addr}</Text>
                  </View>
                )); } catch { return null; } })()}
                <View style={styles.locationRow}>
                  <View style={[styles.dot, { backgroundColor: COLORS.crimson }]} />
                  <Text style={styles.locationText} numberOfLines={1}>{b.dropoff}</Text>
                </View>
                {b.dropoffDetails ? <Text style={{ color: COLORS.gold, fontSize: 10, fontStyle: "italic", marginLeft: 18, marginTop: -4 }}>{b.dropoffDetails}</Text> : null}
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.fare}>£{(b.cashCollected ?? b.meterFare ?? b.fare).toFixed(2)}</Text>
                <Text style={styles.vehicle}>{(b.vehicle || "car").toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingHorizontal: 20 },
  title: { color: COLORS.white, fontSize: 24, fontWeight: "800", marginBottom: 16 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  tabActive: { backgroundColor: "rgba(204,34,41,0.15)", borderColor: COLORS.crimson },
  tabText: { color: COLORS.gray400, fontSize: 13, fontWeight: "600" }, tabTextActive: { color: COLORS.crimson },
  list: { flex: 1 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: COLORS.gray400, fontSize: 16, fontWeight: "600", marginTop: 12 },
  emptySub: { color: COLORS.gray500, fontSize: 13, marginTop: 4 },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardLeft: { flex: 1 },
  cardName: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  cardDate: { color: COLORS.gray400, fontSize: 12, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  cardBody: { gap: 8, marginBottom: 12 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  locationText: { color: COLORS.gray400, fontSize: 13, flex: 1 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 12 },
  fare: { color: COLORS.gold, fontSize: 18, fontWeight: "800" },
  vehicle: { color: COLORS.gray500, fontSize: 11, fontWeight: "700", backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
});
