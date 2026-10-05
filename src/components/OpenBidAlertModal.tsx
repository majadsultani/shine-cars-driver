import { useEffect, useRef, useState } from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Vibration, Platform,
} from "react-native";
import { useAudioPlayer, AudioModule } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";

const alertSound = require("@/assets/booking_alert.wav");

interface OpenBid {
  id: string; name: string; pickup: string; dropoff: string;
  vehicle?: string; fare?: number; date?: string; time?: string;
  buildingInfo?: string | null;
}

interface Props {
  booking: OpenBid | null;
  onView: () => void;
  onDismiss: () => void;
}

export default function OpenBidAlertModal({ booking, onView, onDismiss }: Props) {
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const player = useAudioPlayer(alertSound);

  const stopSound = () => {
    if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; }
    if (vibrationRef.current) { clearInterval(vibrationRef.current); vibrationRef.current = null; }
    try { player.pause(); player.seekTo(0); } catch {}
    try { Vibration.cancel(); } catch {}
  };

  const handleView = () => { stopSound(); onView(); };
  const handleDismiss = () => { stopSound(); onDismiss(); };

  const playLoop = async () => {
    try { await AudioModule.setAudioModeAsync({ playsInSilentMode: true }); } catch {}
    const playOnce = () => { try { player.seekTo(0); player.play(); } catch {} };
    playOnce();
    loopRef.current = setInterval(playOnce, 1800);
    if (Platform.OS === "android") {
      try { Vibration.vibrate([0, 500, 300, 500, 300, 500], true); } catch {}
    } else {
      try { Vibration.vibrate(); } catch {}
      vibrationRef.current = setInterval(() => { try { Vibration.vibrate(); } catch {} }, 2000);
    }
  };

  useEffect(() => {
    if (!booking) return;
    playLoop();
    return () => stopSound();
  }, [booking?.id]);

  if (!booking) return null;

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.badgeWrap}>
            <View style={s.badge}>
              <Ionicons name="flash" size={16} color="#FFF" />
              <Text style={s.badgeText}>OPEN BID</Text>
            </View>
          </View>

          <Text style={s.title}>NEW OPEN BID AVAILABLE</Text>

          <View style={s.row}>
            <Ionicons name="person" size={16} color="#F97316" />
            <Text style={s.label}>Customer</Text>
            <Text style={s.value} numberOfLines={1}>{booking.name}</Text>
          </View>
          <View style={s.row}>
            <Ionicons name="location" size={16} color="#22C55E" />
            <Text style={s.label}>Pickup</Text>
            <Text style={s.value} numberOfLines={2}>{booking.pickup}</Text>
          </View>
          {booking.buildingInfo ? <Text style={{ color: "#F59E0B", fontSize: 11, fontStyle: "italic", marginLeft: 89, marginTop: -6, marginBottom: 6 }}>{booking.buildingInfo}</Text> : null}
          <View style={s.row}>
            <Ionicons name="flag" size={16} color={COLORS.crimson} />
            <Text style={s.label}>Drop-off</Text>
            <Text style={s.value} numberOfLines={2}>{booking.dropoff}</Text>
          </View>
          {booking.vehicle && (
            <View style={s.row}>
              <Ionicons name="car" size={16} color="#3B82F6" />
              <Text style={s.label}>Vehicle</Text>
              <Text style={s.value}>{booking.vehicle}</Text>
            </View>
          )}
          {booking.fare != null && (
            <View style={s.row}>
              <Ionicons name="cash" size={16} color="#F97316" />
              <Text style={s.label}>Fare</Text>
              <Text style={[s.value, { color: "#F97316", fontWeight: "800" }]}>
                £{Number(booking.fare).toFixed(2)}
              </Text>
            </View>
          )}
          {booking.date && (
            <View style={s.row}>
              <Ionicons name="calendar" size={16} color={COLORS.white} />
              <Text style={s.label}>Date</Text>
              <Text style={s.value}>{booking.date} {booking.time || ""}</Text>
            </View>
          )}

          <View style={s.buttons}>
            <TouchableOpacity style={s.dismissBtn} onPress={handleDismiss} activeOpacity={0.8}>
              <Ionicons name="close-circle" size={22} color="#FFF" />
              <Text style={s.btnText}>DISMISS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.viewBtn} onPress={handleView} activeOpacity={0.8}>
              <Ionicons name="flash" size={22} color="#FFF" />
              <Text style={s.btnText}>VIEW BIDS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#1B2138", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "rgba(249,115,22,0.4)" },
  badgeWrap: { alignItems: "center", marginBottom: 12 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F97316", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  badgeText: { color: "#FFF", fontSize: 14, fontWeight: "900", letterSpacing: 1.5 },
  title: { fontSize: 18, fontWeight: "900", color: COLORS.white, textAlign: "center", marginBottom: 16, letterSpacing: 1.5 },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 8 },
  label: { color: COLORS.white, fontSize: 12, fontWeight: "700", width: 65, marginTop: 1, opacity: 0.6 },
  value: { color: COLORS.white, fontSize: 14, fontWeight: "600", flex: 1 },
  buttons: { flexDirection: "row", gap: 12, marginTop: 20 },
  dismissBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.15)", paddingVertical: 16, borderRadius: 14 },
  viewBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#F97316", paddingVertical: 16, borderRadius: 14 },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "900", letterSpacing: 1 },
});
