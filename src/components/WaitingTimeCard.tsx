import { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";
import { saveWaitingTime } from "@/src/lib/api";
import styles from "@/src/styles/bookingDetail";

const FREE_SECONDS = 5 * 60; // 5 minutes free (before journey only)
const CHARGE_PER_MIN = 0.5;

interface WaitingTimeCardProps {
  bookingId: string;
  journeyStarted: boolean; // true = in-progress, false = arrived
  initialSeconds: number; // accumulated from DB
  onChargeChange: (charge: number, seconds: number) => void;
  compact?: boolean;
}

export default function WaitingTimeCard({ bookingId, journeyStarted, initialSeconds, onChargeChange, compact }: WaitingTimeCardProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const saveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Track pre-journey seconds so they keep the 5-min free allowance after trip starts
  const preJourneySecsRef = useRef(journeyStarted ? initialSeconds : 0);
  const prevJourneyStarted = useRef(journeyStarted);

  useEffect(() => {
    if (journeyStarted && !prevJourneyStarted.current) {
      // Journey just started — snapshot pre-journey waiting seconds
      preJourneySecsRef.current = totalSeconds;
    }
    prevJourneyStarted.current = journeyStarted;
  }, [journeyStarted, totalSeconds]);

  // Calculate charge: pre-journey gets 5-min free, journey portion charged from min 1
  const calcCharge = useCallback((secs: number) => {
    if (!journeyStarted) {
      // Before journey: first 5 minutes free
      const totalMinutes = Math.floor(secs / 60);
      return Math.max(0, totalMinutes - 5) * CHARGE_PER_MIN;
    }
    // During journey: split into pre-journey (with free allowance) + journey (no free)
    const preSecs = preJourneySecsRef.current;
    const preMinutes = Math.floor(preSecs / 60);
    const preCharge = Math.max(0, preMinutes - 5) * CHARGE_PER_MIN;
    const journeySecs = Math.max(0, secs - preSecs);
    const journeyMinutes = Math.floor(journeySecs / 60);
    const journeyCharge = journeyMinutes * CHARGE_PER_MIN;
    return preCharge + journeyCharge;
  }, [journeyStarted]);

  const charge = calcCharge(totalSeconds);
  const freeRemaining = journeyStarted ? 0 : Math.max(0, FREE_SECONDS - totalSeconds);
  const isFreePhase = !journeyStarted && totalSeconds < FREE_SECONDS;

  // Notify parent of charge changes
  useEffect(() => { onChargeChange(charge, totalSeconds); }, [charge, totalSeconds]);

  // Pulse animation when running
  useEffect(() => {
    if (!running) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [running]);

  // Auto-save to DB every 30 seconds while running
  useEffect(() => {
    if (!running) return;
    saveTimer.current = setInterval(() => {
      setTotalSeconds((s) => {
        const c = calcCharge(s);
        saveWaitingTime(bookingId, s, c).catch(() => {});
        return s;
      });
    }, 30000);
    return () => { if (saveTimer.current) clearInterval(saveTimer.current); };
  }, [running, bookingId, calcCharge]);

  const startWaiting = () => {
    setRunning(true);
    setSessionSeconds(0);
    intervalRef.current = setInterval(() => {
      setTotalSeconds((prev) => prev + 1);
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopWaiting = () => {
    setRunning(false);
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    // Persist to DB immediately on stop
    const c = calcCharge(totalSeconds);
    saveWaitingTime(bookingId, totalSeconds, c).catch(() => {});
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (saveTimer.current) clearInterval(saveTimer.current);
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const statusColor = running
    ? (isFreePhase ? "#22C55E" : "#F97316")
    : (totalSeconds > 0 ? COLORS.gray400 : COLORS.gold);

  if (compact) {
    const statusText = running ? (isFreePhase ? "FREE" : "CHARGING") : (totalSeconds > 0 ? "PAUSED" : "READY");
    const statusBg = running ? (isFreePhase ? "rgba(34,197,94,0.15)" : "rgba(249,115,22,0.15)") : "rgba(255,255,255,0.08)";
    const statusClr = running ? (isFreePhase ? "#22C55E" : "#F97316") : COLORS.gray400;
    return (
      <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: running ? "#22C55E30" : "rgba(255,255,255,0.06)" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: "rgba(245,166,35,0.12)", justifyContent: "center", alignItems: "center" }}>
              <Ionicons name="hourglass-outline" size={11} color={COLORS.gold} />
            </View>
            <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: "700" }}>Wait</Text>
          </View>
          <View style={{ backgroundColor: statusBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ fontSize: 8, fontWeight: "800", color: statusClr }}>{statusText}</Text>
          </View>
        </View>
        <View style={{ alignItems: "center", marginBottom: 10 }}>
          <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: "800", fontVariant: ["tabular-nums"], letterSpacing: 0.5 }}>{formatTime(totalSeconds)}</Text>
          <Text style={{ color: charge > 0 ? "#F97316" : COLORS.gray500, fontSize: 10, fontWeight: "600", marginTop: 2 }}>
            £{charge.toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={running ? stopWaiting : startWaiting}
          style={{ backgroundColor: running ? "#EF4444" : "#22C55E", paddingVertical: 9, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <Ionicons name={running ? "stop-circle" : "hourglass-outline"} size={14} color={COLORS.white} />
          <Text style={{ color: COLORS.white, fontWeight: "700", fontSize: 12 }}>
            {running ? "Stop" : "Start"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: statusColor, borderWidth: 1, padding: 12 }]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="hourglass-outline" size={14} color={statusColor} />
          <Text style={{ color: COLORS.white, fontSize: 13, fontWeight: "700" }}>Waiting Time</Text>
        </View>
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 4,
          backgroundColor: `${statusColor}12`,
          paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
        }}>
          {running && (
            <Animated.View style={{
              width: 5, height: 5, borderRadius: 3,
              backgroundColor: statusColor,
              opacity: pulseAnim,
            }} />
          )}
          <Text style={{ fontSize: 8, color: statusColor, fontWeight: "800", letterSpacing: 0.5 }}>
            {running ? (isFreePhase ? "FREE" : "CHARGING") : (totalSeconds > 0 ? "PAUSED" : "READY")}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={{
        flexDirection: "row", justifyContent: "space-around", marginBottom: 10,
        backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, paddingVertical: 8,
      }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: COLORS.white, fontSize: 18, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
            {formatTime(totalSeconds)}
          </Text>
          <Text style={{ color: COLORS.gray400, fontSize: 8, fontWeight: "600", letterSpacing: 0.5 }}>TIME</Text>
        </View>
        <View style={{ width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
        <View style={{ alignItems: "center" }}>
          <Text style={{ color: charge > 0 ? "#F97316" : COLORS.white, fontSize: 18, fontWeight: "800" }}>
            £{charge.toFixed(2)}
          </Text>
          <Text style={{ color: COLORS.gray400, fontSize: 8, fontWeight: "600", letterSpacing: 0.5 }}>CHARGE</Text>
        </View>
        {running && sessionSeconds > 0 && (
          <>
            <View style={{ width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
            <View style={{ alignItems: "center" }}>
              <Text style={{ color: "#A855F7", fontSize: 18, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
                {formatTime(sessionSeconds)}
              </Text>
              <Text style={{ color: COLORS.gray400, fontSize: 8, fontWeight: "600", letterSpacing: 0.5 }}>THIS WAIT</Text>
            </View>
          </>
        )}
      </View>

      {/* Free progress bar (before journey only) */}
      {!journeyStarted && running && isFreePhase && (
        <View style={{ marginBottom: 8 }}>
          <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <View style={{ height: "100%", backgroundColor: "#22C55E", borderRadius: 2, width: `${(totalSeconds / FREE_SECONDS) * 100}%` }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
            <Text style={{ color: "#22C55E", fontSize: 9, fontWeight: "600" }}>Free waiting</Text>
            <Text style={{ color: "#22C55E", fontSize: 9, fontWeight: "600" }}>{formatTime(freeRemaining)} left</Text>
          </View>
        </View>
      )}

      {/* Charging info */}
      {running && !isFreePhase && (
        <View style={{
          backgroundColor: "rgba(249,115,22,0.08)", borderRadius: 8, padding: 7, marginBottom: 8,
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <Ionicons name="flash" size={11} color="#F97316" />
          <Text style={{ color: "#F97316", fontSize: 10, fontWeight: "700" }}>
            £0.50/min {journeyStarted ? "— no free allowance" : `— ${Math.floor((totalSeconds - FREE_SECONDS) / 60)} min charged`}
          </Text>
        </View>
      )}

      {/* Paused summary */}
      {!running && totalSeconds > 0 && (
        <View style={{
          backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 8, marginBottom: 8,
          alignItems: "center", gap: 2,
        }}>
          <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: "700" }}>
            {charge > 0 ? `£${charge.toFixed(2)} charge accumulated` : "No charge — within free allowance"}
          </Text>
        </View>
      )}

      {/* Start / Stop Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={running ? stopWaiting : startWaiting}
        style={{
          backgroundColor: running ? "#EF4444" : "#22C55E",
          paddingVertical: 10, borderRadius: 10,
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
        <Ionicons
          name={running ? "stop-circle" : "hourglass-outline"}
          size={16}
          color={COLORS.white}
        />
        <Text style={{ color: COLORS.white, fontWeight: "700", fontSize: 13 }}>
          {running ? "Stop wait" : (totalSeconds > 0 ? "Resume wait" : "Start wait")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
