import { useEffect, useState } from "react";
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity,
  ActivityIndicator, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS } from "@/src/constants/theme";
import { getDriverInvoiceDetail } from "@/src/lib/api";

interface InvoiceItem {
  id: string; fare: number; date: string; pickup: string; dropoff: string;
  booking?: { vehicle?: string; time?: string; status?: string; meterFare?: number; fareType?: string };
}
interface Invoice {
  id: string; weekStart: string; weekEnd: string; totalFares: number;
  commissionRate: number; commissionAmount: number; licenceFee: number;
  otherCharges: number; otherChargesNote?: string; netPayable: number;
  status: string; items: InvoiceItem[];
}

function formatWeek(start: string, end: string) {
  const fmt = (d: string) => { const p = d.split("-"); return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d; };
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function InvoiceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await getDriverInvoiceDetail(id!);
      if (res.success) setInvoice(res.invoice);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { if (id) load(); }, [id]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: COLORS.navy, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color={COLORS.gold} size="large" />
    </View>
  );

  if (!invoice) return (
    <View style={{ flex: 1, backgroundColor: COLORS.navy, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ color: COLORS.gray500 }}>Invoice not found</Text>
    </View>
  );

  const paid = invoice.status === "paid";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.navy }}
      contentContainerStyle={{ padding: 20, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.gold} />}>

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
        <TouchableOpacity onPress={() => router.back()} style={{
          width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)",
          justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
        }}>
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: "800", marginLeft: 14, flex: 1 }}>Invoice Details</Text>
        <View style={{
          paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
          backgroundColor: paid ? "rgba(34,197,94,0.15)" : "rgba(245,166,35,0.15)",
        }}>
          <Text style={{ fontSize: 11, fontWeight: "800", color: paid ? COLORS.green : COLORS.gold }}>
            {paid ? "PAID" : "UNPAID"}
          </Text>
        </View>
      </View>

      {/* Week Range */}
      <Text style={{ color: COLORS.gray400, fontSize: 13, marginBottom: 20 }}>
        {formatWeek(invoice.weekStart, invoice.weekEnd)}
      </Text>

      {/* Summary Cards */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
        <SummaryCard label="Total Fares" value={`£${invoice.totalFares.toFixed(2)}`} color="#3B82F6" />
        <SummaryCard label={`Commission (${invoice.commissionRate}%)`} value={`-£${invoice.commissionAmount.toFixed(2)}`} color={COLORS.crimson} />
        <SummaryCard label="Licence Fee" value={`-£${invoice.licenceFee.toFixed(2)}`} color={COLORS.gold} />
        <SummaryCard label="Net Payable" value={`£${invoice.netPayable.toFixed(2)}`} color={COLORS.green} />
      </View>

      {invoice.otherCharges > 0 && (
        <View style={{ backgroundColor: "rgba(249,115,22,0.08)", borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "rgba(249,115,22,0.2)" }}>
          <Text style={{ color: COLORS.orange, fontSize: 12, fontWeight: "700" }}>Other Charges: -£{invoice.otherCharges.toFixed(2)}</Text>
          {invoice.otherChargesNote && <Text style={{ color: COLORS.gray400, fontSize: 12, marginTop: 4 }}>{invoice.otherChargesNote}</Text>}
        </View>
      )}

      {/* Rides */}
      <Text style={{ color: COLORS.gray500, fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 12 }}>
        {invoice.items.length} RIDE{invoice.items.length !== 1 ? "S" : ""}
      </Text>

      {invoice.items.map((item, i) => (
        <View key={item.id} style={{
          backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 14, marginBottom: 10,
          borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ color: COLORS.gray400, fontSize: 11 }}>#{i + 1} · {item.date}</Text>
            <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "800" }}>£{item.fare.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.green }} />
            <Text style={{ color: COLORS.gray400, fontSize: 12, flex: 1 }} numberOfLines={1}>{item.pickup}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.crimson }} />
            <Text style={{ color: COLORS.gray400, fontSize: 12, flex: 1 }} numberOfLines={1}>{item.dropoff}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
            <Text style={{ color: COLORS.gray500, fontSize: 11 }}>
              Commission ({invoice.commissionRate}%)
            </Text>
            <Text style={{ color: COLORS.crimson, fontSize: 11, fontWeight: "700" }}>
              -£{(item.fare * invoice.commissionRate / 100).toFixed(2)}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{
      flex: 1, minWidth: "45%", backgroundColor: `${color}10`, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: `${color}22`,
    }}>
      <Text style={{ color: COLORS.gray400, fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginBottom: 6 }}>{label.toUpperCase()}</Text>
      <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: "900" }}>{value}</Text>
    </View>
  );
}
