import { StyleSheet, Platform } from "react-native";
import { COLORS } from "@/src/constants/theme";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: 20, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingBottom: 40 },

  // Header
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  logoWrap: {
    width: 52, height: 52, borderRadius: 16, overflow: "hidden",
    borderWidth: 1.5, borderColor: "rgba(245,166,35,0.25)",
  },
  logo: { width: 52, height: 52 },
  headerText: { flex: 1, marginLeft: 14 },
  greeting: { color: COLORS.gray500, fontSize: 13, fontWeight: "500", letterSpacing: 0.3 },
  name: { color: COLORS.white, fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  headerBtn: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },

  // Toggle
  toggleCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderRadius: 20, padding: 20, marginBottom: 24, borderWidth: 1.5,
  },
  toggleAvailable: { backgroundColor: "rgba(34,197,94,0.06)", borderColor: "rgba(34,197,94,0.25)" },
  toggleBusy: { backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" },
  toggleLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  toggleDot: { width: 14, height: 14, borderRadius: 7 },
  dotAvailable: { backgroundColor: COLORS.green, shadowColor: COLORS.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 8 },
  dotBusy: { backgroundColor: COLORS.gray500 },
  toggleLabel: { color: COLORS.white, fontSize: 18, fontWeight: "800", letterSpacing: -0.2 },
  toggleSub: { color: COLORS.gray500, fontSize: 12, marginTop: 3, fontWeight: "500" },
  toggleSwitch: { width: 54, height: 32, borderRadius: 16, justifyContent: "center", paddingHorizontal: 3 },
  switchOn: { backgroundColor: COLORS.green, shadowColor: COLORS.green, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6 },
  switchOff: { backgroundColor: "rgba(255,255,255,0.12)" },
  switchThumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.white },
  thumbOn: { alignSelf: "flex-end" as const },
  thumbOff: { alignSelf: "flex-start" as const },

  // Stats
  sectionTitle: { color: COLORS.gray500, fontSize: 11, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCard: {
    width: "47%", borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  statIconWrap: {
    width: 30, height: 30, borderRadius: 9, justifyContent: "center", alignItems: "center",
  },
  statValue: { color: COLORS.white, fontSize: 18, fontWeight: "900", marginTop: 8, letterSpacing: -0.5 },
  statLabel: { color: COLORS.gray500, fontSize: 10, marginTop: 2, fontWeight: "600", letterSpacing: 0.3 },
});
