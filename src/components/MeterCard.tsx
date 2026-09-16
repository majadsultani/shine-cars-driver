import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";
import styles from "@/src/styles/bookingDetail";

export default function MeterCard({ meterRunning, meterDistance, meterFare, waitingCharge = 0, onStart, onStop, compact }: {
  meterRunning: boolean; meterDistance: number; meterFare: number;
  waitingCharge?: number; compact?: boolean;
  onStart: () => void; onStop: () => void;
}) {
  if (compact) {
    return (
      <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: meterRunning ? "#F9731640" : COLORS.gold + "30" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="speedometer-outline" size={12} color={COLORS.gold} />
            <Text style={{ color: COLORS.white, fontSize: 10, fontWeight: "700" }}>Meter</Text>
          </View>
          {meterRunning && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#22C55E" }} />}
        </View>
        <View style={{ alignItems: "center", marginBottom: 6 }}>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: "800" }}>£{meterFare.toFixed(2)}</Text>
          <Text style={{ color: COLORS.gray500, fontSize: 9, fontWeight: "600" }}>{meterDistance.toFixed(1)} mi</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={meterRunning ? onStop : onStart}
          style={{ backgroundColor: meterRunning ? "#EF4444" : "#22C55E", paddingVertical: 7, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }}>
          <Ionicons name={meterRunning ? "stop-circle" : "play-circle"} size={13} color={COLORS.white} />
          <Text style={{ color: COLORS.white, fontWeight: "700", fontSize: 11 }}>
            {meterRunning ? "Stop" : "Start"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: "#F97316", borderWidth: 1 }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Live Meter</Text>
        {meterRunning && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#22C55E" }} />
            <Text style={{ fontSize: 10, color: "#22C55E", fontWeight: "700" }}>RUNNING</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 16 }}>
        <View style={{ alignItems: "center" }}>
          <Ionicons name="speedometer-outline" size={22} color={COLORS.gold} />
          <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: "800", marginTop: 4 }}>{meterDistance.toFixed(1)}</Text>
          <Text style={{ color: COLORS.gray400, fontSize: 10 }}>miles</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Ionicons name="cash-outline" size={22} color={COLORS.gold} />
          <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: "800", marginTop: 4 }}>£{meterFare.toFixed(2)}</Text>
          <Text style={{ color: COLORS.gray400, fontSize: 10 }}>fare</Text>
        </View>
        {waitingCharge > 0 && (
          <View style={{ alignItems: "center" }}>
            <Ionicons name="time-outline" size={22} color="#F97316" />
            <Text style={{ color: "#F97316", fontSize: 22, fontWeight: "800", marginTop: 4 }}>£{waitingCharge.toFixed(2)}</Text>
            <Text style={{ color: COLORS.gray400, fontSize: 10 }}>waiting</Text>
          </View>
        )}
      </View>
      {waitingCharge > 0 && (
        <View style={{ backgroundColor: "rgba(249,115,22,0.1)", borderRadius: 10, padding: 8, marginBottom: 12, borderWidth: 1, borderColor: "rgba(249,115,22,0.2)" }}>
          <Text style={{ color: "#F97316", fontSize: 13, fontWeight: "700", textAlign: "center" }}>
            Total: £{(meterFare + waitingCharge).toFixed(2)}
          </Text>
        </View>
      )}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={meterRunning ? onStop : onStart}
        style={{
          backgroundColor: meterRunning ? "#EF4444" : "#22C55E",
          paddingVertical: 14, borderRadius: 12,
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
        <Ionicons name={meterRunning ? "stop-circle" : "play-circle"} size={22} color={COLORS.white} />
        <Text style={{ color: COLORS.white, fontWeight: "700", fontSize: 15 }}>
          {meterRunning ? "Stop Meter" : "Start Meter"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
