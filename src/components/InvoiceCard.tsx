import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";

interface Invoice {
  id: string; weekStart: string; weekEnd: string; totalFares: number;
  commissionRate: number; commissionAmount: number; licenceFee: number;
  otherCharges: number; netPayable: number; status: string;
}

function formatWeek(start: string, end: string) {
  const fmt = (d: string) => {
    const p = d.split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

export default function InvoiceCard({ invoice, onPress }: { invoice: Invoice; onPress: () => void }) {
  const paid = invoice.status === "paid";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{
      backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", marginBottom: 12,
    }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "700" }}>
          {formatWeek(invoice.weekStart, invoice.weekEnd)}
        </Text>
        <View style={{
          paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12,
          backgroundColor: paid ? "rgba(34,197,94,0.15)" : "rgba(245,166,35,0.15)",
        }}>
          <Text style={{ fontSize: 10, fontWeight: "800", color: paid ? COLORS.green : COLORS.gold }}>
            {paid ? "PAID" : "UNPAID"}
          </Text>
        </View>
      </View>

      <Row label="Total Fares" value={`£${invoice.totalFares.toFixed(2)}`} color={COLORS.white} />
      <Row label={`Commission (${invoice.commissionRate}%)`} value={`-£${invoice.commissionAmount.toFixed(2)}`} color={COLORS.crimson} />
      <Row label="Licence Fee" value={`-£${invoice.licenceFee.toFixed(2)}`} color={COLORS.gold} />
      {invoice.otherCharges > 0 && (
        <Row label="Other Charges" value={`-£${invoice.otherCharges.toFixed(2)}`} color={COLORS.orange} />
      )}

      <View style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)", marginTop: 8, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ color: COLORS.gray400, fontSize: 13, fontWeight: "600" }}>Net Payable</Text>
        <Text style={{ color: COLORS.green, fontSize: 18, fontWeight: "900" }}>£{invoice.netPayable.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
      <Text style={{ color: COLORS.gray400, fontSize: 13 }}>{label}</Text>
      <Text style={{ color, fontSize: 13, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}
