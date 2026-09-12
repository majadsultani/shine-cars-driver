import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
  TextInput, Alert, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";
import { getDriver, clearAuth, saveDriver } from "@/src/lib/auth";
import { getProfile, updateProfile, deleteAccount } from "@/src/lib/api";
import ConfirmModal from "@/src/components/ConfirmModal";

interface Driver { name: string; email: string; phone: string; status: string; vehicleMake?: string; vehicleColor?: string; vehicleReg?: string; passengerLicense?: number; commissionRate?: number }

export default function ProfileScreen() {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vMake, setVMake] = useState("");
  const [vColor, setVColor] = useState("");
  const [vReg, setVReg] = useState("");
  const [pLicense, setPLicense] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    (async () => {
      const cached = await getDriver() as Driver | null;
      if (cached) { setDriver(cached); setName(cached.name); setPhone(cached.phone); setVMake(cached.vehicleMake || ""); setVColor(cached.vehicleColor || ""); setVReg(cached.vehicleReg || ""); setPLicense(cached.passengerLicense || 0); }
      try {
        const res = await getProfile();
        if (res.success) { setDriver(res.driver); setName(res.driver.name); setPhone(res.driver.phone); setVMake(res.driver.vehicleMake || ""); setVColor(res.driver.vehicleColor || ""); setVReg(res.driver.vehicleReg || ""); setPLicense(res.driver.passengerLicense || 0); await saveDriver(res.driver); }
      } catch {}
    })();
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Error", "Name is required");
    if (!phone.trim()) return Alert.alert("Error", "Phone is required");
    setSaving(true);
    try {
      const res = await updateProfile({ name: name.trim(), phone: phone.trim(), vehicleMake: vMake.trim(), vehicleColor: vColor.trim(), vehicleReg: vReg.trim().toUpperCase(), passengerLicense: pLicense || null });
      if (res.success) { setDriver(res.driver); await saveDriver(res.driver); setEditing(false); Alert.alert("Success", "Profile updated"); }
    } catch { Alert.alert("Error", "Failed to update profile"); }
    setSaving(false);
  };

  const doLogout = async () => { setShowLogout(false); await clearAuth(); router.replace("/login"); };
  const doDelete = async () => {
    setShowDelete(false);
    try {
      const res = await deleteAccount();
      if (res.success) { await clearAuth(); router.replace("/login"); }
      else Alert.alert("Error", res.message || "Failed to delete account");
    } catch { Alert.alert("Error", "Failed to delete account"); }
  };

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; editable: boolean }[] = [
    { icon: "person-outline", label: "Name", value: driver?.name || "", editable: true },
    { icon: "mail-outline", label: "Email", value: driver?.email || "", editable: false },
    { icon: "call-outline", label: "Phone", value: driver?.phone || "", editable: true },
    { icon: "shield-checkmark-outline", label: "Status", value: (driver?.status || "").toUpperCase(), editable: false },
    { icon: "car-outline", label: "Vehicle", value: driver?.vehicleMake || "—", editable: true },
    { icon: "color-palette-outline", label: "Color", value: driver?.vehicleColor || "—", editable: true },
    { icon: "pricetag-outline", label: "Reg No.", value: driver?.vehicleReg || "—", editable: true },
    { icon: "people-outline", label: "Licence to Carry", value: driver?.passengerLicense ? String(driver.passengerLicense) : "—", editable: false },
    { icon: "trending-up-outline", label: "Commission Rate", value: `${driver?.commissionRate ?? 20}%`, editable: false },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <View style={s.headerRow}>
        <Text style={s.title}>Profile</Text>
        {!editing ? (
          <TouchableOpacity onPress={() => setEditing(true)} style={s.editBtn}>
            <Ionicons name="create-outline" size={18} color={COLORS.crimson} />
            <Text style={s.editText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(false)} style={s.editBtn}>
            <Ionicons name="close" size={18} color={COLORS.gray400} />
            <Text style={[s.editText, { color: COLORS.gray400 }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.avatarWrap}>
        <View style={s.avatarCircle}><Ionicons name="person" size={36} color={COLORS.gold} /></View>
        <Text style={s.avatarName}>{driver?.name || "Driver"}</Text>
        <View style={[s.badge, driver?.status === "approved" ? s.badgeApproved : s.badgePending]}>
          <Text style={[s.badgeText, driver?.status === "approved" ? s.badgeTextApproved : s.badgeTextPending]}>
            {driver?.status === "approved" ? "Approved" : "Pending"}
          </Text>
        </View>
      </View>

      <View style={s.card}>
        {rows.map((r, i) => (
          <View key={r.label} style={[s.row, i < rows.length - 1 && s.rowBorder]}>
            <Ionicons name={r.icon} size={20} color={COLORS.gold} />
            <View style={s.rowText}>
              <Text style={s.rowLabel}>{r.label}</Text>
              {editing && r.editable ? (
                <TextInput style={s.input} value={r.label === "Name" ? name : r.label === "Phone" ? phone : r.label === "Vehicle" ? vMake : r.label === "Color" ? vColor : vReg}
                  onChangeText={r.label === "Name" ? setName : r.label === "Phone" ? setPhone : r.label === "Vehicle" ? setVMake : r.label === "Color" ? setVColor : setVReg}
                  autoCapitalize={r.label === "Reg No." ? "characters" : "words"} placeholderTextColor={COLORS.gray500} />
              ) : <Text style={s.rowValue}>{r.value}</Text>}
            </View>
          </View>
        ))}
      </View>

      {editing && (
        <>
        <Text style={s.licLabel}>Licence to Carry Passengers</Text>
        <View style={s.licRow}>
          {[1,2,3,4,5,6,7,8].map((n) => (
            <TouchableOpacity key={n} onPress={() => setPLicense(n)}
              style={[s.licChip, pLicense === n && s.licChipActive]}>
              <Text style={[s.licChipText, pLicense === n && s.licChipTextActive]}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={s.saveBtn} activeOpacity={0.8}>
          {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={s.saveText}>Save Changes</Text>}
        </TouchableOpacity>
        </>
      )}

      {[{ icon: "receipt-outline" as const, label: "My Invoices", route: "/invoices" },
        { icon: "document-text-outline" as const, label: "Manage Documents", route: "/documents" },
        { icon: "lock-closed-outline" as const, label: "Change Password", route: "/change-password" },
        { icon: "shield-outline" as const, label: "Privacy Policy", route: "/privacy" },
      ].map((item) => (
        <TouchableOpacity key={item.label} style={s.docBtn} onPress={() => router.push(item.route as never)} activeOpacity={0.8}>
          <Ionicons name={item.icon} size={20} color={COLORS.gold} />
          <Text style={s.docText}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.gray500} />
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={s.logoutBtn} onPress={() => setShowLogout(true)} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.logoutBtn, { marginTop: 12 }]} onPress={() => setShowDelete(true)} activeOpacity={0.8}>
        <Ionicons name="trash-outline" size={20} color={COLORS.red} />
        <Text style={s.logoutText}>Delete Account</Text>
      </TouchableOpacity>

      <ConfirmModal visible={showLogout} icon="log-out-outline" iconColor="#F59E0B" iconBg="rgba(245,158,11,0.15)"
        title="Logout" message="Are you sure you want to logout?" confirmLabel="Logout" confirmColor={COLORS.crimson}
        onConfirm={doLogout} onCancel={() => setShowLogout(false)} />
      <ConfirmModal visible={showDelete} icon="trash-outline" iconColor="#EF4444" iconBg="rgba(239,68,68,0.15)"
        title="Delete Account" message="This will permanently delete your account and all data. This action cannot be undone."
        confirmLabel="Delete" confirmColor="#EF4444" onConfirm={doDelete} onCancel={() => setShowDelete(false)} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: 20, paddingTop: Platform.OS === "ios" ? 60 : 40 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { color: COLORS.white, fontSize: 24, fontWeight: "800" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  editText: { color: COLORS.crimson, fontSize: 14, fontWeight: "600" },
  avatarWrap: { alignItems: "center", marginBottom: 28 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(245,166,35,0.15)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarName: { color: COLORS.white, fontSize: 20, fontWeight: "700" },
  badge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  badgeApproved: { backgroundColor: "rgba(34,197,94,0.15)" },
  badgePending: { backgroundColor: "rgba(245,166,35,0.15)" },
  badgeText: { fontSize: 12, fontWeight: "700" },
  badgeTextApproved: { color: COLORS.green },
  badgeTextPending: { color: COLORS.gold },
  card: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  rowText: { flex: 1 },
  rowLabel: { color: COLORS.gray400, fontSize: 12 },
  rowValue: { color: COLORS.white, fontSize: 15, fontWeight: "600", marginTop: 2 },
  input: { color: COLORS.white, fontSize: 15, fontWeight: "600", marginTop: 2, borderBottomWidth: 1, borderBottomColor: COLORS.crimson, paddingBottom: 4 },
  licLabel: { color: COLORS.gray400, fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 4 },
  licRow: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8, marginBottom: 12 },
  licChip: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", alignItems: "center" as const, justifyContent: "center" as const,
  },
  licChipActive: { backgroundColor: COLORS.crimson, borderColor: COLORS.crimson },
  licChipText: { color: COLORS.gray400, fontSize: 16, fontWeight: "700" as const },
  licChipTextActive: { color: COLORS.white },
  saveBtn: { backgroundColor: COLORS.crimson, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginBottom: 16 },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  docBtn: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 12 },
  docText: { color: COLORS.white, fontSize: 15, fontWeight: "600", flex: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(239,68,68,0.1)", borderRadius: 12, paddingVertical: 16, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },
  logoutText: { color: COLORS.red, fontSize: 15, fontWeight: "700" },
});
