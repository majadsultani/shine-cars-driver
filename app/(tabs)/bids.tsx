import { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Platform, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";
import { getOpenBids, placeBid } from "@/src/lib/api";

const POLL_INTERVAL = 5_000;

interface BidBooking {
  id: string; name: string; phone: string;
  pickup: string; dropoff: string; stops?: string | null;
  date: string; time: string;
  fare: number; distance: number; vehicle: string;
  notes?: string | null;
  pickupDetails?: string | null; dropoffDetails?: string | null;
  buildingInfo?: string | null;
}

export default function BidsScreen() {
  const router = useRouter();
  const [bookings, setBookings] = useState<BidBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bidding, setBidding] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getOpenBids();
      if (res.success) setBookings(res.bookings || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleBid = (booking: BidBooking) => {
    Alert.alert(
      "Accept This Job?",
      `${booking.pickup} → ${booking.dropoff}\n£${booking.fare.toFixed(2)} · ${booking.date} at ${booking.time}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Bid / Accept",
          style: "default",
          onPress: async () => {
            setBidding(booking.id);
            try {
              const res = await placeBid(booking.id);
              if (res.success) {
                Alert.alert("You Won!", "This job has been assigned to you.", [
                  { text: "View Booking", onPress: () => router.push(`/booking-detail?id=${booking.id}`) },
                ]);
                load();
              } else {
                Alert.alert("Too Late", res.message || "Job already accepted by another driver.");
                load();
              }
            } catch {
              Alert.alert("Error", "Failed to place bid. Try again.");
            }
            setBidding(null);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Open Bids</Text>
      <Text style={styles.subtitle}>First driver to bid wins the job</Text>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}>
        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        ) : bookings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="flash-outline" size={48} color={COLORS.white} />
            <Text style={styles.emptyText}>No open bids</Text>
            <Text style={styles.emptySub}>Open bid jobs will appear here</Text>
          </View>
        ) : (
          bookings.map((b) => (
            <View key={b.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardName}>{b.name}</Text>
                  <Text style={styles.cardDate}>{b.date} at {b.time}</Text>
                </View>
                <View style={styles.bidBadge}>
                  <Ionicons name="flash" size={10} color="#F97316" />
                  <Text style={styles.bidBadgeText}>OPEN BID</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.locationRow}>
                  <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
                  <Text style={styles.locationText} numberOfLines={1}>{b.pickup}</Text>
                </View>
                {b.pickupDetails ? <Text style={styles.detailText}>{b.pickupDetails}</Text> : null}
                {b.buildingInfo ? <Text style={styles.detailText}>🏠 {b.buildingInfo}</Text> : null}
                {b.stops && (() => { try { const s: string[] = JSON.parse(b.stops!); return s.map((addr, i) => (
                  <View key={i} style={styles.locationRow}>
                    <View style={[styles.dot, { backgroundColor: "#F59E0B" }]} />
                    <Text style={styles.locationText} numberOfLines={1}>{addr}</Text>
                  </View>
                )); } catch { return null; } })()}
                <View style={styles.locationRow}>
                  <View style={[styles.dot, { backgroundColor: COLORS.crimson }]} />
                  <Text style={styles.locationText} numberOfLines={1}>{b.dropoff}</Text>
                </View>
                {b.dropoffDetails ? <Text style={styles.detailText}>{b.dropoffDetails}</Text> : null}
              </View>

              {b.notes ? (
                <View style={styles.notesRow}>
                  <Ionicons name="document-text-outline" size={12} color={COLORS.gold} />
                  <Text style={styles.notesText} numberOfLines={2}>{b.notes}</Text>
                </View>
              ) : null}

              <View style={styles.cardFooter}>
                <View style={styles.infoRow}>
                  <Text style={styles.fare}>£{b.fare.toFixed(2)}</Text>
                  <Text style={styles.distance}>{b.distance?.toFixed(1) || "—"} mi</Text>
                  <Text style={styles.vehicle}>{(b.vehicle || "car").toUpperCase()}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleBid(b)}
                  disabled={bidding === b.id}
                  style={styles.bidBtn}>
                  {bidding === b.id ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <>
                      <Ionicons name="flash" size={16} color={COLORS.white} />
                      <Text style={styles.bidBtnText}>Bid / Accept Job</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingHorizontal: 20 },
  title: { color: COLORS.white, fontSize: 24, fontWeight: "800", marginBottom: 4 },
  subtitle: { color: COLORS.white, fontSize: 13, marginBottom: 16, opacity: 0.7 },
  list: { flex: 1 },
  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: COLORS.white, fontSize: 16, fontWeight: "600", marginTop: 12 },
  emptySub: { color: COLORS.white, fontSize: 13, marginTop: 4, opacity: 0.6 },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(249,115,22,0.2)",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardLeft: { flex: 1 },
  cardName: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  cardDate: { color: COLORS.white, fontSize: 12, marginTop: 2, opacity: 0.7 },
  bidBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(249,115,22,0.15)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  bidBadgeText: { color: "#F97316", fontSize: 10, fontWeight: "800" },
  cardBody: { gap: 8, marginBottom: 12 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  locationText: { color: COLORS.white, fontSize: 13, flex: 1 },
  detailText: { color: COLORS.gold, fontSize: 10, fontStyle: "italic", marginLeft: 18, marginTop: -4 },
  notesRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 8 },
  notesText: { color: COLORS.white, fontSize: 11, flex: 1, opacity: 0.8 },
  cardFooter: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", paddingTop: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  fare: { color: COLORS.gold, fontSize: 18, fontWeight: "800" },
  distance: { color: COLORS.white, fontSize: 12, fontWeight: "600", opacity: 0.7 },
  vehicle: {
    color: COLORS.white, fontSize: 11, fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  bidBtn: {
    backgroundColor: "#F97316", borderRadius: 12, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  bidBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});
