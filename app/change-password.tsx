import { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
  TextInput, ActivityIndicator, Modal, Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";
import { changePassword } from "@/src/lib/api";

type Result = { type: "success" | "error"; message: string } | null;

function ResultModal({ result, onClose }: { result: Result; onClose: () => void }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  if (result) {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }
  const isSuccess = result?.type === "success";
  return (
    <Modal visible={!!result} transparent animationType="none">
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.modal, { transform: [{ scale }] }]}>
          <View style={[styles.modalIcon, { backgroundColor: isSuccess ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)" }]}>
            <Ionicons name={isSuccess ? "checkmark-circle" : "close-circle"} size={56}
              color={isSuccess ? "#22C55E" : "#EF4444"} />
          </View>
          <Text style={styles.modalTitle}>{isSuccess ? "Password Changed!" : "Error"}</Text>
          <Text style={styles.modalMsg}>{result?.message}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.8}
            style={[styles.modalBtn, { backgroundColor: isSuccess ? "#22C55E" : COLORS.crimson }]}>
            <Text style={styles.modalBtnText}>{isSuccess ? "Done" : "Try Again"}</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<Result>(null);

  const showError = (msg: string) => setResult({ type: "error", message: msg });

  const handleSubmit = async () => {
    if (!oldPw || !newPw || !confirmPw) return showError("All fields are required");
    if (newPw.length < 8) return showError("Password must be at least 8 characters");
    if (newPw !== confirmPw) return showError("Passwords do not match");
    setSaving(true);
    try {
      const res = await changePassword(oldPw, newPw);
      if (res.success) setResult({ type: "success", message: "Your password has been updated successfully." });
      else showError(res.message || "Failed to change password");
    } catch { showError("Something went wrong. Please try again."); }
    setSaving(false);
  };

  const handleClose = () => {
    const wasSuccess = result?.type === "success";
    setResult(null);
    if (wasSuccess) router.back();
  };

  const fields = [
    { label: "Current Password", val: oldPw, set: setOldPw, show: showOld, toggle: () => setShowOld(!showOld) },
    { label: "New Password", val: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(!showNew) },
    { label: "Confirm New Password", val: confirmPw, set: setConfirmPw, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backRow}>
        <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        <Text style={styles.backLabel}>Back</Text>
      </TouchableOpacity>

      <View style={styles.iconWrap}>
        <Ionicons name="lock-closed" size={40} color={COLORS.gold} />
      </View>
      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.subtitle}>Enter your current password and choose a new one</Text>

      <View style={styles.card}>
        {fields.map((f, i) => (
          <View key={f.label} style={[styles.fieldWrap, i < fields.length - 1 && styles.fieldBorder]}>
            <Text style={styles.fieldLabel}>{f.label}</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} value={f.val} onChangeText={f.set}
                secureTextEntry={!f.show} placeholderTextColor="#9CA3AF"
                placeholder={f.label} autoCapitalize="none" />
              <TouchableOpacity onPress={f.toggle} style={styles.eyeBtn}>
                <Ionicons name={f.show ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={handleSubmit} disabled={saving} style={styles.saveBtn} activeOpacity={0.8}>
        {saving ? <ActivityIndicator color={COLORS.white} /> :
          <Text style={styles.saveText}>Update Password</Text>}
      </TouchableOpacity>

      <ResultModal result={result} onClose={handleClose} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { padding: 24, paddingTop: Platform.OS === "ios" ? 60 : 40 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 28 },
  backLabel: { color: COLORS.white, fontSize: 16, fontWeight: "600" },
  iconWrap: { alignSelf: "center", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(245,166,35,0.15)", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  title: { color: COLORS.white, fontSize: 22, fontWeight: "800", textAlign: "center" },
  subtitle: { color: COLORS.gray400, fontSize: 14, textAlign: "center", marginBottom: 28 },
  card: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", marginBottom: 24 },
  fieldWrap: { paddingVertical: 12 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  fieldLabel: { color: COLORS.gray400, fontSize: 12, marginBottom: 6 },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, color: COLORS.white, fontSize: 15, fontWeight: "600", paddingVertical: 4 },
  eyeBtn: { padding: 4 },
  saveBtn: { backgroundColor: COLORS.crimson, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", padding: 30 },
  modal: { backgroundColor: "#1B2138", borderRadius: 24, padding: 32, alignItems: "center", width: "100%", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  modalIcon: { width: 96, height: 96, borderRadius: 48, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: COLORS.white, fontSize: 22, fontWeight: "800", marginBottom: 8 },
  modalMsg: { color: COLORS.gray400, fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  modalBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40, alignItems: "center" },
  modalBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
});
