import { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Image, TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme"; // used in JSX
import { uploadDocument, getDocuments } from "@/src/lib/api";
import { saveDriver, getDriver } from "@/src/lib/auth";
import { styles } from "@/src/styles/documents";
import ResultModal, { Result } from "@/src/components/ResultModal";

const DOC_TYPES = [
  { key: "driver_licence", label: "Driver Licence", icon: "card-outline" as const },
  { key: "mot_certificate", label: "MOT Certificate", icon: "document-text-outline" as const },
  { key: "taxi_badge", label: "Taxi Badge", icon: "shield-checkmark-outline" as const },
  { key: "vehicle_taxi_plate", label: "Vehicle Taxi Plate", icon: "car-outline" as const },
];

interface DocState {
  uri: string | null;
  remoteUrl: string | null;
  expiry: string;
  uploaded: boolean;
  uploading: boolean;
  editing: boolean;
}

const emptyDoc = (): DocState => ({ uri: null, remoteUrl: null, expiry: "", uploaded: false, uploading: false, editing: false });

export default function DocumentsScreen() {
  const router = useRouter();
  const [docs, setDocs] = useState<Record<string, DocState>>(
    Object.fromEntries(DOC_TYPES.map((d) => [d.key, emptyDoc()]))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getDocuments();
        if (res.success && res.documents) {
          setDocs((prev) => {
            const next = { ...prev };
            for (const doc of res.documents!) {
              if (next[doc.type]) {
                next[doc.type] = { ...next[doc.type], remoteUrl: doc.fileUrl, expiry: doc.expiryDate, uploaded: true };
              }
            }
            return next;
          });
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const pickImage = async (key: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setDocs((prev) => ({ ...prev, [key]: { ...prev[key], uri: result.assets[0].uri, uploaded: false, editing: true } }));
    }
  };

  const takePhoto = async (key: string) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setDocs((prev) => ({ ...prev, [key]: { ...prev[key], uri: result.assets[0].uri, uploaded: false, editing: true } }));
    }
  };

  const setExpiry = (key: string, value: string) => {
    let cleaned = value.replace(/[^0-9]/g, "");
    if (cleaned.length > 2 && cleaned[2] !== "/") cleaned = cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    if (cleaned.length > 5 && cleaned[5] !== "/") cleaned = cleaned.slice(0, 5) + "/" + cleaned.slice(5);
    if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
    setDocs((prev) => ({ ...prev, [key]: { ...prev[key], expiry: cleaned } }));
  };

  const hasNewUploads = DOC_TYPES.some((d) => docs[d.key].uri && !docs[d.key].uploaded);

  const handleSubmit = async () => {
    if (DOC_TYPES.some((d) => !docs[d.key].remoteUrl && !docs[d.key].uri)) {
      setError("Please upload all documents with expiry dates."); return;
    }
    if (DOC_TYPES.some((d) => !docs[d.key].expiry)) {
      setError("Please add expiry dates for all documents."); return;
    }
    setError("");
    setSubmitting(true);

    const toUpload = DOC_TYPES.filter((d) => docs[d.key].uri && !docs[d.key].uploaded);
    toUpload.forEach((d) => setDocs((prev) => ({ ...prev, [d.key]: { ...prev[d.key], uploading: true } })));
    try {
      await Promise.all(toUpload.map(async (doc) => {
        const state = docs[doc.key];
        await uploadDocument(doc.key, state.uri!, state.expiry);
        setDocs((prev) => ({ ...prev, [doc.key]: { ...prev[doc.key], uploaded: true, uploading: false, remoteUrl: state.uri, editing: false } }));
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setResult({ type: "error", message: `Upload failed: ${msg}` });
      toUpload.forEach((d) => setDocs((prev) => ({ ...prev, [d.key]: { ...prev[d.key], uploading: false } })));
      setSubmitting(false);
      return;
    }

    const driver = await getDriver() as Record<string, unknown> | null;
    if (driver) await saveDriver({ ...driver, status: "pending" });
    setSubmitting(false);
    setResult({ type: "success", message: "Documents submitted successfully!" });
  };

  if (loading) return (
    <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
      <ActivityIndicator color={COLORS.gold} size="large" />
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Documents</Text>
      </View>
      <Text style={styles.subtitle}>View or update your documents</Text>

      {DOC_TYPES.map((doc) => {
        const state = docs[doc.key];
        const imageSource = state.uri || state.remoteUrl;
        const hasImage = !!imageSource;
        return (
          <View key={doc.key} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name={doc.icon} size={22} color={COLORS.gold} />
              <Text style={styles.cardTitle}>{doc.label}</Text>
              {state.uploaded && !state.editing && <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />}
            </View>

            {hasImage ? (
              <Image source={{ uri: imageSource! }} style={styles.preview} resizeMode="cover" />
            ) : (
              <View style={styles.uploadArea}>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(doc.key)}>
                  <Ionicons name="images-outline" size={20} color={COLORS.crimson} />
                  <Text style={styles.uploadText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.uploadBtn} onPress={() => takePhoto(doc.key)}>
                  <Ionicons name="camera-outline" size={20} color={COLORS.crimson} />
                  <Text style={styles.uploadText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
            {hasImage && (
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => pickImage(doc.key)} style={styles.changeBtn}>
                  <Ionicons name="cloud-upload-outline" size={16} color={COLORS.gold} />
                  <Text style={styles.changeText}>Re-upload</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => takePhoto(doc.key)} style={styles.changeBtn}>
                  <Ionicons name="camera-outline" size={16} color={COLORS.gold} />
                  <Text style={styles.changeText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.expiryWrap}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.gray400} />
              <TextInput style={styles.expiryInput} placeholder="Expiry: DD/MM/YYYY" placeholderTextColor="#9CA3AF"
                value={state.expiry} onChangeText={(v) => setExpiry(doc.key, v)} keyboardType="number-pad" maxLength={10} />
            </View>
          </View>
        );
      })}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {hasNewUploads && (
        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={submitting} activeOpacity={0.8}>
          {submitting ? <ActivityIndicator color={COLORS.white} /> :
            <Text style={styles.btnText}>Submit Documents</Text>}
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
      <ResultModal result={result} onClose={() => { setResult(null); if (result?.type === "success") router.back(); }} />
    </ScrollView>
  );
}
