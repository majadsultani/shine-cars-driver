import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";

export default function InvoicesButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={{
        marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        backgroundColor: "rgba(245,166,35,0.08)", borderRadius: 20, padding: 20,
        borderWidth: 1.5, borderColor: "rgba(245,166,35,0.2)",
      }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(245,166,35,0.15)",
          justifyContent: "center", alignItems: "center",
        }}>
          <Ionicons name="receipt-outline" size={22} color={COLORS.gold} />
        </View>
        <View>
          <Text style={{ color: COLORS.white, fontSize: 16, fontWeight: "800" }}>My Invoices</Text>
          <Text style={{ color: COLORS.gray500, fontSize: 12, marginTop: 2 }}>View weekly billing details</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray500} />
    </TouchableOpacity>
  );
}
