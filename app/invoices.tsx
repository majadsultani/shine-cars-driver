import { useEffect, useState, useMemo } from "react";
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  ActivityIndicator, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS } from "@/src/constants/theme";
import { getDriverInvoices } from "@/src/lib/api";
import InvoiceCard from "@/src/components/InvoiceCard";

interface Invoice {
  id: string; weekStart: string; weekEnd: string; totalFares: number;
  commissionRate: number; commissionAmount: number; licenceFee: number;
  otherCharges: number; netPayable: number; status: string;
}

const FILTERS = ["all", "unpaid", "paid"] as const;

export default function InvoicesScreen() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<typeof FILTERS[number]>("all");

  const load = async () => {
    try {
      const res = await getDriverInvoices();
      if (res.success) setInvoices(res.invoices || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = useMemo(() => {
    if (filter === "all") return invoices;
    return invoices.filter((inv) => inv.status === filter);
  }, [invoices, filter]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.navy }}
      contentContainerStyle={{ padding: 20, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}>

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
        <TouchableOpacity onPress={() => router.back()} style={{
          width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)",
          justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
        }}>
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: "800", marginLeft: 14 }}>Invoices</Text>
      </View>

      {/* Filter Chips */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.7}
            style={{
              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
              backgroundColor: filter === f ? COLORS.crimson : "rgba(255,255,255,0.06)",
              borderWidth: 1, borderColor: filter === f ? COLORS.crimson : "rgba(255,255,255,0.1)",
            }}>
            <Text style={{
              color: filter === f ? COLORS.white : COLORS.gray400,
              fontSize: 13, fontWeight: "700", textTransform: "capitalize",
            }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={{ alignItems: "center", paddingTop: 60 }}>
          <Ionicons name="receipt-outline" size={48} color="rgba(255,255,255,0.1)" />
          <Text style={{ color: COLORS.gray500, fontSize: 14, marginTop: 12 }}>No invoices found</Text>
        </View>
      ) : (
        filtered.map((inv) => (
          <InvoiceCard key={inv.id} invoice={inv}
            onPress={() => router.push(`/invoice-detail?id=${inv.id}`)} />
        ))
      )}
    </ScrollView>
  );
}
