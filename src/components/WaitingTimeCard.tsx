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
    return (
      <View style={{ backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: running ? "#22C55E40" : "rgba(255,255,255,0.06)" }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="hourglass-outline" size={13} color={COLORS.gold} />
            <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: "700" }}>Waiting</Text>
          </View>
          <View style={{ backgroundColor: running ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.08)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
            <Text style={{ fontSize: 8, fontWeight: "800", color: running ? "#22C55E" : COLORS.gray400 }}>
              {running ? (isFreePhase ? "FREE" : "CHARGING") : (totalSeconds > 0 ? "PAUSED" : "READY")}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <View>
            <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] }}>{formatTime(totalSeconds)}</Text>
            <Text style={{ color: COLORS.gray500, fontSize: 8, fontWeight: "600" }}>time</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: charge > 0 ? "#F97316" : COLORS.white, fontSize: 20, fontWeight: "800" }}>£{charge.toFixed(2)}</Text>
            <Text style={{ color: COLORS.gray500, fontSize: 8, fontWeight: "600" }}>charge</Text>
          </View>
        </View>
        {isFreePhase && <Text style={{ color: "#22C55E", fontSize: 9, fontWeight: "600", marginBottom: 6 }}>Within free allowance</Text>}
        <TouchableOpacity activeOpacity={0.8} onPress={running ? stopWaiting : startWaiting}
          style={{ backgroundColor: running ? "#EF4444" : "#22C55E", paddingVertical: 8, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <Ionicons name={running ? "stop-circle" : "hourglass-outline"} size={14} color={COLORS.white} />
          <Text style={{ color: COLORS.white, fontWeight: "700", fontSize: 12 }}>
            {running ? "Stop" : "Start"} wait
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: statusColor, borderWidth: 1 }]}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{
            width: 28, height: 28, borderRadius: 8,
            backgroundColor: `${statusColor}18`,
            alignItems: "center", justifyContent: "center",
          }}>
            <Ionicons name="hourglass-outline" size={15} color={statusColor} />
          </View>
          <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Waiting Time</Text>
        </View>
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 5,
          backgroundColor: `${statusColor}12`,
          paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
        }}>
          {running && (
            <Animated.View style={{
              width: 6, height: 6, borderRadius: 3,
              backgroundColor: statusColor,
              opacity: pulseAnim,
            }} />
          )}
          <Text style={{ fontSize: 9, color: statusColor, fontWeight: "800", letterSpacing: 0.5 }}>
            {running ? (isFreePhase ? "FREE" : "CHARGING") : (totalSeconds > 0 ? "PAUSED" : "READY")}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={{
        flexDirection: "row", justifyContent: "space-around", marginBottom: 14,
        backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, paddingVertical: 12,
      }}>
        <View style={{ alignItems: "center" }}>
          <Ionicons name="time-outline" size={20} color={COLORS.gold} />
          <Text style={{ color: COLORS.white, fontSize: 22, fontWeight: "800", marginTop: 4, fontVariant: ["tabular-nums"] }}>
            {formatTime(totalSeconds)}
          </Text>
          <Text style={{ color: COLORS.gray400, fontSize: 9, fontWeight: "600", letterSpacing: 0.5, marginTop: 2 }}>TOTAL TIME</Text>
        </View>
        <View style={{ width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
        <View style={{ alignItems: "center" }}>
          <Ionicons name="cash-outline" size={20} color={charge > 0 ? "#F97316" : COLORS.gold} />
          <Text style={{ color: charge > 0 ? "#F97316" : COLORS.white, fontSize: 22, fontWeight: "800", marginTop: 4 }}>
            £{charge.toFixed(2)}
          </Text>
          <Text style={{ color: COLORS.gray400, fontSize: 9, fontWeight: "600", letterSpacing: 0.5, marginTop: 2 }}>CHARGE</Text>
        </View>
        {running && sessionSeconds > 0 && (
          <>
            <View style={{ width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.08)", alignSelf: "center" }} />
            <View style={{ alignItems: "center" }}>
              <Ionicons name="stopwatch-outline" size={20} color="#A855F7" />
              <Text style={{ color: "#A855F7", fontSize: 22, fontWeight: "800", marginTop: 4, fontVariant: ["tabular-nums"] }}>
                {formatTime(sessionSeconds)}
              </Text>
              <Text style={{ color: COLORS.gray400, fontSize: 9, fontWeight: "600", letterSpacing: 0.5, marginTop: 2 }}>THIS WAIT</Text>
            </View>
          </>
        )}
      </View>

      {/* Free progress bar (before journey only) */}
      {!journeyStarted && running && isFreePhase && (
        <View style={{ marginBottom: 12 }}>
          <View style={{ height: 5, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <View style={{ height: "100%", backgroundColor: "#22C55E", borderRadius: 3, width: `${(totalSeconds / FREE_SECONDS) * 100}%` }} />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5 }}>
            <Text style={{ color: "#22C55E", fontSize: 10, fontWeight: "600" }}>Free waiting</Text>
            <Text style={{ color: "#22C55E", fontSize: 10, fontWeight: "600" }}>{formatTime(freeRemaining)} left</Text>
          </View>
        </View>
      )}

      {/* Charging info */}
      {running && !isFreePhase && (
        <View style={{
          backgroundColor: "rgba(249,115,22,0.08)", borderRadius: 10, padding: 9, marginBottom: 12,
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Ionicons name="flash" size={13} color="#F97316" />
          <Text style={{ color: "#F97316", fontSize: 11, fontWeight: "700" }}>
            £0.50/min {journeyStarted ? "— no free allowance during journey" : `— ${Math.floor((totalSeconds - FREE_SECONDS) / 60)} min charged`}
          </Text>
        </View>
      )}

      {/* Paused summary (when stopped but has accumulated time) */}
      {!running && totalSeconds > 0 && (
        <View style={{
          backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 12, marginBottom: 12,
          alignItems: "center", gap: 3,
        }}>
          <Ionicons name="pause-circle" size={18} color={charge > 0 ? "#F97316" : "#22C55E"} />
          <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: "700" }}>
            {charge > 0 ? `£${charge.toFixed(2)} waiting charge accumulated` : "No charge — within free allowance"}
          </Text>
          <Text style={{ color: COLORS.gray400, fontSize: 10 }}>
            Total waited: {formatTime(totalSeconds)} • Tap Start to add more
          </Text>
        </View>
      )}

      {/* Start / Stop Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={running ? stopWaiting : startWaiting}
        style={{
          backgroundColor: running ? "#EF4444" : "#22C55E",
          paddingVertical: 14, borderRadius: 12,
          flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
          shadowColor: running ? "#EF4444" : "#22C55E",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 6,
        }}>
        <Ionicons
          name={running ? "stop-circle" : "hourglass-outline"}
          size={20}
          color={COLORS.white}
        />
        <Text style={{ color: COLORS.white, fontWeight: "700", fontSize: 14 }}>
          {running ? "Stop Waiting Time" : (totalSeconds > 0 ? "Start Waiting Time Again" : "Start Waiting Time")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
