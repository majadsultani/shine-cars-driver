import { useEffect, useState, useCallback, useRef } from "react";
import {
  View, Text, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";
import { getRecurringTemplates, getBookings } from "@/src/lib/api";
import { styles, statusColors, DAY_LABELS } from "@/src/styles/recurring";

const POLL_INTERVAL = 15_000;

interface Template {
  id: string; name: string; phone: string;
  pickup: string; dropoff: string; stops?: string | null;
  time: string; fare: number; distance: number;
  days: string; vehicle: string; isActive: boolean;
  frequency?: string; startDate?: string | null; endDate?: string | null;
  customer?: { companyName: string | null };
  bookings?: { id: string; status: string; date: string }[];
}

interface Booking {
  id: string; name: string; phone: string;
  pickup: string; dropoff: string; stops?: string | null;
  date: string; time: string;
  fare: number; status: string; vehicle: string; isRecurring?: boolean;
}

export default function RecurringScreen() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const [tRes, bRes] = await Promise.all([
        getRecurringTemplates(),
        getBookings("recurring"),
      ]);
      if (tRes.success) setTemplates(tRes.templates || []);
      if (bRes.success) setTodayBookings(bRes.bookings || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const parseDays = (d: string): string[] => {
    try { return JSON.parse(d); } catch { return []; }
  };

  const getStatus = (t: Template): string => t.bookings?.[0]?.status || "assigned";

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recurring Bookings</Text>
      <Text style={styles.subtitle}>Your assigned recurring schedules</Text>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}>
        {loading ? (
          <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
        ) : templates.length === 0 && todayBookings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="repeat-outline" size={48} color={COLORS.gray500} />
            <Text style={styles.emptyText}>No recurring bookings</Text>
            <Text style={styles.emptySub}>Recurring bookings assigned to you will appear here</Text>
          </View>
        ) : (
          <>
            {templates.map((t) => {
              const days = parseDays(t.days);
              const st = getStatus(t);
              const c = statusColors[st] || "#6B7280";
              return (
                <TouchableOpacity key={t.id} activeOpacity={0.7}
                  onPress={() => router.push(`/recurring-detail?id=${t.id}`)}
                  style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardLeft}>
                      <View style={styles.nameRow}>
                        <Text style={styles.cardName}>{t.name}</Text>
                        <View style={styles.recurBadge}>
                          <Ionicons name="repeat" size={10} color="#A855F7" />
                          <Text style={styles.recurText}>RECURRING</Text>
                        </View>
                      </View>
                      {t.customer?.companyName && <Text style={styles.company}>{t.customer.companyName}</Text>}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: c + "20" }]}>
                      <View style={[styles.statusDot, { backgroundColor: c }]} />
                      <Text style={[styles.statusText, { color: c }]}>{st.charAt(0).toUpperCase() + st.slice(1)}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6, marginBottom: 10 }}>
                    <View style={{ backgroundColor: (t.frequency === "monthly" ? "#A855F7" : "#3B82F6") + "20", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ color: t.frequency === "monthly" ? "#A855F7" : "#3B82F6", fontSize: 10, fontWeight: "800" }}>{(t.frequency || "weekly").toUpperCase()}</Text>
                    </View>
                    {t.startDate && (
                      <View style={{ backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                        <Text style={{ color: COLORS.gray400, fontSize: 10 }}>{t.startDate} → {t.endDate || "∞"}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.locationRow}>
                      <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
                      <Text style={styles.locationText} numberOfLines={1}>{t.pickup}</Text>
                    </View>
                    <View style={styles.locationRow}>
                      <View style={[styles.dot, { backgroundColor: COLORS.crimson }]} />
                      <Text style={styles.locationText} numberOfLines={1}>{t.dropoff}</Text>
                    </View>
                  </View>
                  <View style={styles.daysRow}>
                    {DAY_LABELS.map((d) => {
                      const active = days.some((day) => day.toLowerCase().startsWith(d.toLowerCase()));
                      return (
                        <View key={d} style={[styles.dayChip, active ? styles.dayActive : styles.dayInactive]}>
                          <Text style={[styles.dayText, active ? styles.dayTextActive : styles.dayTextInactive]}>{d}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.fare}>£{t.fare.toFixed(2)}</Text>
                    <View style={styles.footerRight}>
                      <Text style={styles.time}>{t.time}</Text>
                      <Text style={styles.vehicle}>{(t.vehicle || "car").toUpperCase()}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            {todayBookings.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Today&apos;s Rides</Text>
                {todayBookings.map((b) => {
                  const c = statusColors[b.status] || "#6B7280";
                  return (
                    <TouchableOpacity key={b.id} activeOpacity={0.7}
                      onPress={() => router.push(`/booking-detail?id=${b.id}`)} style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardLeft}>
                          <View style={styles.nameRow}>
                            <Text style={styles.cardName}>{b.name}</Text>
                            <View style={styles.recurBadge}>
                              <Ionicons name="repeat" size={10} color="#A855F7" />
                              <Text style={styles.recurText}>RECURRING</Text>
                            </View>
                          </View>
                          <Text style={styles.cardDate}>{b.date} at {b.time}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: c + "20" }]}>
                          <View style={[styles.statusDot, { backgroundColor: c }]} />
                          <Text style={[styles.statusText, { color: c }]}>{b.status.charAt(0).toUpperCase() + b.status.slice(1)}</Text>
                        </View>
                      </View>
                      <View style={styles.cardBody}>
                        <View style={styles.locationRow}>
                          <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
                          <Text style={styles.locationText} numberOfLines={1}>{b.pickup}</Text>
                        </View>
                        <View style={styles.locationRow}>
                          <View style={[styles.dot, { backgroundColor: COLORS.crimson }]} />
                          <Text style={styles.locationText} numberOfLines={1}>{b.dropoff}</Text>
                        </View>
                      </View>
                      <View style={styles.cardFooter}>
                        <Text style={styles.fare}>£{b.fare.toFixed(2)}</Text>
                        <Text style={styles.vehicle}>{(b.vehicle || "car").toUpperCase()}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}
