import { useEffect, useRef, useState } from "react";
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Vibration, Platform,
} from "react-native";
import { useAudioPlayer, AudioModule } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";

const alertSound = require("@/assets/booking_alert.wav");
const TIMER_SECONDS = 15;

interface Booking {
  id: string; name: string; pickup: string; dropoff: string;
  pickupDetails?: string | null; dropoffDetails?: string | null; buildingInfo?: string | null;
  vehicle?: string; fare?: number; date?: string; time?: string;
  fareType?: string; isRecurring?: boolean; isPriority?: boolean; days?: string;
}

interface Props {
  booking: Booking | null;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export default function BookingAlertModal({ booking, onAccept, onReject }: Props) {
  const [seconds, setSeconds] = useState(TIMER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRejectRef = useRef(false);

  const player = useAudioPlayer(alertSound);

  const stopSound = () => {
    if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; }
    if (vibrationRef.current) { clearInterval(vibrationRef.current); vibrationRef.current = null; }
    try { player.pause(); player.seekTo(0); } catch {}
    try { Vibration.cancel(); } catch {}
  };

  const cleanup = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    stopSound();
  };

  const handleAccept = () => { cleanup(); if (booking) onAccept(booking.id); };
  const handleReject = () => { cleanup(); if (booking) onReject(booking.id); };

  const playLoop = async () => {
    try { await AudioModule.setAudioModeAsync({ playsInSilentMode: true }); } catch {}
    const playOnce = () => {
      try { player.seekTo(0); player.play(); } catch {}
    };
    playOnce();
    loopRef.current = setInterval(playOnce, 1800);
    // Vibrate
    if (Platform.OS === "android") {
      try { Vibration.vibrate([0, 500, 300, 500, 300, 500], true); } catch {}
    } else {
      try { Vibration.vibrate(); } catch {}
      vibrationRef.current = setInterval(() => {
        try { Vibration.vibrate(); } catch {}
      }, 2000);
    }
  };

  useEffect(() => {
    if (!booking) return;
    autoRejectRef.current = false;
    setSeconds(TIMER_SECONDS);
    playLoop();
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { autoRejectRef.current = true; return 0; }
        return s - 1;
      });
    }, 1000);
    return () => cleanup();
  }, [booking?.id]);

  useEffect(() => {
    if (seconds === 0 && autoRejectRef.current) {
      autoRejectRef.current = false;
      handleReject();
    }
  }, [seconds]);

  if (!booking) return null;

  const progress = seconds / TIMER_SECONDS;

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Timer */}
          <View style={s.timerWrap}>
            <View style={[s.timerRing, { borderColor: seconds <= 5 ? "#EF4444" : COLORS.gold }]}>
              <Text style={[s.timerText, seconds <= 5 && { color: "#EF4444" }]}>{seconds}</Text>
            </View>
          </View>

          {booking.isRecurring && (
            <View style={s.recurBadge}>
              <Ionicons name="repeat" size={12} color="#A855F7" />
              <Text style={s.recurText}>RECURRING</Text>
            </View>
          )}
          {booking.isPriority && (
            <View style={[s.recurBadge, { backgroundColor: "rgba(249,115,22,0.15)", borderColor: "rgba(249,115,22,0.3)" }]}>
              <Ionicons name="flash" size={12} color="#F97316" />
              <Text style={[s.recurText, { color: "#F97316" }]}>PRIORITY</Text>
            </View>
          )}
          <Text style={s.title}>{booking.isRecurring ? "RECURRING BOOKING" : booking.isPriority ? "PRIORITY BOOKING" : "NEW BOOKING"}</Text>

          {/* Details */}
          <View style={s.row}>
            <Ionicons name="person" size={16} color={COLORS.gold} />
            <Text style={s.label}>Customer</Text>
            <Text style={s.value} numberOfLines={1}>{booking.name}</Text>
          </View>
          <View style={s.row}>
            <Ionicons name="location" size={16} color="#22C55E" />
            <Text style={s.label}>Pickup</Text>
            <Text style={s.value} numberOfLines={2}>{booking.pickup}</Text>
          </View>
          {booking.pickupDetails ? <Text style={{ color: COLORS.gold, fontSize: 11, fontStyle: "italic", marginLeft: 89, marginTop: -6, marginBottom: 6 }}>{booking.pickupDetails}</Text> : null}
          {booking.buildingInfo ? <Text style={{ color: "#F59E0B", fontSize: 11, fontStyle: "italic", marginLeft: 89, marginTop: -6, marginBottom: 6 }}>{booking.buildingInfo}</Text> : null}
          <View style={s.row}>
            <Ionicons name="flag" size={16} color={COLORS.crimson} />
            <Text style={s.label}>Drop-off</Text>
            <Text style={s.value} numberOfLines={2}>{booking.dropoff}</Text>
          </View>
          {booking.dropoffDetails ? <Text style={{ color: COLORS.gold, fontSize: 11, fontStyle: "italic", marginLeft: 89, marginTop: -6, marginBottom: 6 }}>{booking.dropoffDetails}</Text> : null}
          {booking.vehicle && (
            <View style={s.row}>
              <Ionicons name="car" size={16} color="#3B82F6" />
              <Text style={s.label}>Vehicle</Text>
              <Text style={s.value}>{booking.vehicle}</Text>
            </View>
          )}
          {booking.fare != null && (
            <View style={s.row}>
              <Ionicons name="cash" size={16} color={COLORS.gold} />
              <Text style={s.label}>Fare</Text>
              {booking.fareType === "meter" ? (
                <Text style={[s.value, { color: COLORS.gold, fontWeight: "800" }]}>
                  £{(Number(booking.fare) * 0.9).toFixed(2)} – £{(Number(booking.fare) * 1.1).toFixed(2)}
                </Text>
              ) : (
                <Text style={[s.value, { color: COLORS.gold, fontWeight: "800" }]}>
                  £{Number(booking.fare).toFixed(2)}
                </Text>
              )}
            </View>
          )}
          {booking.fareType === "meter" && (
            <View style={{ backgroundColor: "#FFF7ED", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 6, alignSelf: "flex-start" }}><Text style={{ fontSize: 11, fontWeight: "700", color: "#EA580C" }}>METER — Cash Only</Text></View>
          )}
          {booking.isRecurring && booking.days && (
            <View style={s.row}>
              <Ionicons name="calendar" size={16} color="#A855F7" />
              <Text style={s.label}>Days</Text>
              <Text style={s.value}>
                {(() => { try { return (JSON.parse(booking.days) as string[]).map((d) => d.slice(0, 3)).join(", "); } catch { return booking.days; } })()}
              </Text>
            </View>
          )}
          {booking.date && (
            <View style={s.row}>
              <Ionicons name="calendar" size={16} color={COLORS.gray400} />
              <Text style={s.label}>Date</Text>
              <Text style={s.value}>{booking.date} {booking.time || ""}</Text>
            </View>
          )}

          {/* Progress bar */}
          <View style={s.progressBg}>
            <View style={[s.progressFill, { width: `${progress * 100}%`,
              backgroundColor: seconds <= 5 ? "#EF4444" : COLORS.gold }]} />
          </View>

          {/* Buttons */}
          <View style={s.buttons}>
            <TouchableOpacity style={s.rejectBtn} onPress={handleReject} activeOpacity={0.8}>
              <Ionicons name="close-circle" size={22} color="#FFF" />
              <Text style={s.btnText}>REJECT</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.acceptBtn} onPress={handleAccept} activeOpacity={0.8}>
              <Ionicons name="checkmark-circle" size={22} color="#FFF" />
              <Text style={s.btnText}>ACCEPT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#1B2138", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "rgba(245,166,35,0.3)" },
  timerWrap: { alignItems: "center", marginBottom: 12 }, timerRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, justifyContent: "center", alignItems: "center" },
  timerText: { fontSize: 28, fontWeight: "900", color: COLORS.gold },
  recurBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(168,85,247,0.15)", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, alignSelf: "center", marginBottom: 8 },
  recurText: { color: "#A855F7", fontSize: 12, fontWeight: "900", letterSpacing: 1 }, title: { fontSize: 20, fontWeight: "900", color: COLORS.white, textAlign: "center", marginBottom: 16, letterSpacing: 2 },
  row: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10, gap: 8 },
  label: { color: COLORS.gray400, fontSize: 12, fontWeight: "700", width: 65, marginTop: 1 }, value: { color: COLORS.white, fontSize: 14, fontWeight: "600", flex: 1 },
  progressBg: { height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 16, marginBottom: 20 }, progressFill: { height: 4, borderRadius: 2 },
  buttons: { flexDirection: "row", gap: 12 },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#EF4444", paddingVertical: 16, borderRadius: 14 }, acceptBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#22C55E", paddingVertical: 16, borderRadius: 14 },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "900", letterSpacing: 1 },
});
