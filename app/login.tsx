import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";
import { loginDriver } from "@/src/lib/api";
import { saveToken, saveDriver, clearAuth } from "@/src/lib/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await loginDriver(email.trim().toLowerCase(), password);
      if (res.success) {
        await clearAuth();
        await saveToken(res.token);
        await saveDriver(res.driver);
        if (res.driver.status === "approved") {
          router.replace("/(tabs)");
        } else if (res.driver.status === "pending") {
          router.replace("/pending");
        } else if (res.driver.status === "rejected") {
          router.replace("/pending");
        } else {
          router.replace("/documents");
        }
      } else {
        setError(res.message || "Login failed.");
      }
    } catch {
      setError("Connection error. Try again.");
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Image source={require("@/assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your driver account</Text>

        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={20} color={COLORS.gray400} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9CA3AF"
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        </View>

        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray400} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9CA3AF"
            value={password} onChangeText={setPassword} secureTextEntry={!showPass} />
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color={COLORS.gray400} />
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity onPress={() => router.push("/forgot-password")} style={styles.forgot}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color={COLORS.white} /> :
            <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/signup")} style={styles.link}>
          <Text style={styles.linkText}>Don&apos;t have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.navy },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logo: { width: 80, height: 80, borderRadius: 16, alignSelf: "center", marginBottom: 24 },
  title: { color: COLORS.white, fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: { color: COLORS.gray400, fontSize: 14, textAlign: "center", marginBottom: 32 },
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
  forgot: { alignSelf: "flex-end", marginBottom: 4 },
  forgotText: { color: COLORS.gold, fontSize: 13, fontWeight: "600" },
  link: { marginTop: 24, alignItems: "center" },
  linkText: { color: COLORS.gray400, fontSize: 14 },
  linkBold: { color: COLORS.gold, fontWeight: "700" },
});
