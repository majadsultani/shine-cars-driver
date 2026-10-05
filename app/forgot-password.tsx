import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/src/constants/theme";
import { resetDriverPassword } from "@/src/lib/api";
import ResultModal, { Result } from "@/src/components/ResultModal";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result>(null);

  function handleNext() {
    if (!email.trim()) { setError("Email is required"); return; }
    if (!phone.trim()) { setError("Phone number is required"); return; }
    setError("");
    setStep(2);
  }

  async function handleReset() {
    if (!newPassword) { setError("New password is required"); return; }
    if (newPassword.length < 6) { setError("Minimum 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await resetDriverPassword(email.trim().toLowerCase(), phone.trim(), newPassword);
      if (res.error) {
        setResult({ type: "error", message: res.error });
        if (res.error.includes("email") || res.error.includes("Phone")) setStep(1);
        return;
      }
      setResult({ type: "success", message: "Your password has been updated. Sign in with your new password." });
    } catch {
      setResult({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">
        {/* Back */}
        <TouchableOpacity onPress={() => step === 2 ? setStep(1) : router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>

        {/* Icon */}
        <View style={s.iconWrap}>
          <Ionicons name={step === 1 ? "lock-open-outline" : "key-outline"} size={40} color={COLORS.gold} />
        </View>

        <Text style={s.title}>{step === 1 ? "Forgot Password?" : "Set New Password"}</Text>
        <Text style={s.subtitle}>
          {step === 1
            ? "Enter your email and phone to verify your identity"
            : "Choose a new password for your account"}
        </Text>

        {step === 1 ? (
          <>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={20} color={COLORS.gray400} />
              <TextInput style={s.input} placeholder="Email" placeholderTextColor="#9CA3AF"
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <View style={s.inputWrap}>
              <Ionicons name="call-outline" size={20} color={COLORS.gray400} />
              <TextInput style={s.input} placeholder="Phone number" placeholderTextColor="#9CA3AF"
                value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
          </>
        ) : (
          <>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray400} />
              <TextInput style={s.input} placeholder="New password" placeholderTextColor="#9CA3AF"
                value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showNew} />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons name={showNew ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray400} />
              <TextInput style={s.input} placeholder="Confirm password" placeholderTextColor="#9CA3AF"
                value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.gray400} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={s.btn} onPress={step === 1 ? handleNext : handleReset}
          disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color={COLORS.white} /> :
            <Text style={s.btnText}>{step === 1 ? "Continue" : "Reset Password"}</Text>}
        </TouchableOpacity>

        {/* Step dots */}
        <View style={s.dots}>
          <View style={[s.dot, step >= 1 && s.dotActive]} />
          <View style={[s.dot, step >= 2 && s.dotActive]} />
        </View>

        <TouchableOpacity onPress={() => router.replace("/login")} style={s.link}>
          <Text style={s.linkText}>Remember your password? <Text style={s.linkBold}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>

      <ResultModal result={result} onClose={() => {
        const wasSuccess = result?.type === "success";
        setResult(null);
        if (wasSuccess) router.replace("/login");
      }} />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { flexGrow: 1, padding: 24 },
  back: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  iconWrap: {
    width: 72, height: 72, borderRadius: 20, backgroundColor: "rgba(245,166,35,0.12)",
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  title: { color: COLORS.white, fontSize: 28, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: COLORS.gray400, fontSize: 14, marginBottom: 32, lineHeight: 20 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  input: { flex: 1, color: COLORS.white, fontSize: 15, marginLeft: 12 },
  error: { color: COLORS.red, fontSize: 13, marginBottom: 12, textAlign: "center" },
  btn: {
    backgroundColor: COLORS.crimson, borderRadius: 12, paddingVertical: 16,
    alignItems: "center", marginTop: 8,
  },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.15)" },
  dotActive: { backgroundColor: COLORS.gold, width: 24 },
  link: { marginTop: 28, alignItems: "center" },
  linkText: { color: COLORS.gray400, fontSize: 14 },
  linkBold: { color: COLORS.gold, fontWeight: "700" },
});
