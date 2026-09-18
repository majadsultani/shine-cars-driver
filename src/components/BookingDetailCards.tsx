import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Platform, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/src/constants/theme";
import styles from "@/src/styles/bookingDetail";

function openNavigation(address: string) {
  const e = encodeURIComponent(address);
  const url = Platform.OS === "ios" ? `maps:?daddr=${e}&dirflg=d` : `google.navigation:q=${e}&mode=d`;
  Linking.canOpenURL(url).then((ok) => Linking.openURL(ok ? url : `https://www.google.com/maps/dir/?api=1&destination=${e}&travelmode=driving`));
}

interface Booking {
  id: string; name: string; phone: string;
  pickup: string; dropoff: string; stops?: string | null;
  pickupDetails?: string | null; dropoffDetails?: string | null; buildingInfo?: string | null;
  date: string; time: string;
  distance: number; fare: number;
  status: string; vehicle: string;
  paymentMethod?: string; paymentStatus?: string;
  fareType?: string; meterDistance?: number | null; meterFare?: number | null;
  cashCollected?: number | null; notes?: string | null;
  eventSurcharge?: number | null;
}

export function PaymentCard({ booking, compact }: { booking: Booking; compact?: boolean }) {
  const isCash = booking.paymentMethod === "cash";
  const isCard = booking.paymentMethod === "card";
  const isInvoice = booking.paymentMethod === "invoice";
  const isPaid = booking.paymentStatus === "paid";
  const isMeter = booking.fareType === "meter";

  if (compact) {
    const icon = isInvoice ? "document-text-outline" : isCard ? "card-outline" : "cash-outline";
    const color = isInvoice ? "#A855F7" : isCard ? "#06B6D4" : COLORS.gold;
    const label = isInvoice ? "Invoice" : isCard ? (isPaid ? "Card ✓" : "Card") : "Cash";
    return (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={15} color={color} />
          <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "700" }}>{label}</Text>
          {isMeter && <View style={{ backgroundColor: "#EA580C", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}><Text style={{ fontSize: 8, fontWeight: "800", color: "#FFF", letterSpacing: 0.5 }}>METER</Text></View>}
        </View>
        {booking.status !== "completed" && (
          <Text style={{ color: COLORS.gold, fontSize: 14, fontWeight: "800" }}>
            {isMeter && !booking.meterFare ? `£${booking.fare.toFixed(2)}–£${(booking.fare * 1.1).toFixed(2)}` : `£${(booking.meterFare ?? booking.fare).toFixed(2)}`}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.card, isCard && isPaid ? styles.paidCard : isInvoice ? styles.invoiceCard : isCash ? styles.cashCard : null]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={styles.cardTitle}>Payment</Text>
        {isMeter && <View style={{ backgroundColor: "#FFF7ED", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}><Text style={{ fontSize: 10, fontWeight: "700", color: "#EA580C" }}>METER</Text></View>}
      </View>
      <View style={styles.paymentRow}>
        <Ionicons name={isInvoice ? "document-text-outline" : isCard ? "card-outline" : "cash-outline"} size={20} color={isInvoice ? "#A855F7" : isCard ? "#06B6D4" : COLORS.gold} />
        <Text style={styles.paymentMethod}>{isInvoice ? "Invoice Payment" : isCard ? "Card Payment" : "Cash Payment"}</Text>
      </View>
      {isInvoice ? (
        <View style={styles.invoiceBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#A855F7" />
          <Text style={styles.invoiceText}>{booking.status === "completed" ? "Added to company invoice" : "Will be added to company invoice"}</Text>
        </View>
      ) : isCard && isPaid ? (
        <View style={styles.paidBadge}>
          <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
          <Text style={styles.paidText}>Paid by Card</Text>
        </View>
      ) : isCard ? (
        <Text style={styles.paymentNote}>Payment will be confirmed on completion</Text>
      ) : booking.status === "completed" ? (
        <View style={styles.paidBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
          <Text style={[styles.paidText, { color: "#16A34A" }]}>{booking.cashCollected != null ? `Cash Collected: £${booking.cashCollected.toFixed(2)}` : `Paid: £${(booking.meterFare ?? booking.fare).toFixed(2)}`}</Text>
        </View>
      ) : (
        <View style={styles.cashBadge}>
          <Ionicons name="alert-circle" size={16} color={COLORS.gold} />
          <Text style={styles.cashText}>{booking.fareType === "meter" && !booking.meterFare
            ? `Estimated: £${booking.fare.toFixed(2)} – £${(booking.fare * 1.1).toFixed(2)}`
            : `Collect £${(booking.meterFare ?? booking.fare).toFixed(2)} cash from customer`}</Text>
        </View>
      )}
    </View>
  );
}

export function CustomerCard({ booking, onCall, compact }: { booking: Booking; onCall: () => void; compact?: boolean }) {
  if (compact) {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(245,166,35,0.12)", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: COLORS.gold, fontSize: 13, fontWeight: "800" }}>{booking.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={{ color: COLORS.white, fontSize: 14, fontWeight: "700" }}>{booking.name}</Text>
            <Text style={{ color: COLORS.gray500, fontSize: 11, marginTop: 1 }}>{booking.phone}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onCall} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(34,197,94,0.12)", justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="call" size={16} color={COLORS.green} />
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Customer</Text>
      <View style={styles.infoRow}>
        <Ionicons name="person" size={16} color={COLORS.gold} />
        <Text style={styles.infoText}>{booking.name}</Text>
      </View>
      <TouchableOpacity onPress={onCall} style={styles.infoRow}>
        <Ionicons name="call" size={16} color={COLORS.green} />
        <Text style={[styles.infoText, { color: COLORS.green }]}>{booking.phone}</Text>
      </TouchableOpacity>
    </View>
  );
}

export function TripCard({ booking, currentStopIndex, onNextStop }: {
  booking: Booking; currentStopIndex?: number; onNextStop?: () => void;
}) {
  const parsedStops: string[] = booking.stops ? (() => { try { return JSON.parse(booking.stops); } catch { return []; } })() : [];
  const showNav = ["accepted", "arrived", "in-progress"].includes(booking.status);
  const stopIdx = currentStopIndex ?? 0;

  let navTo = booking.dropoff, navLabel = "Navigate to Drop-off";
  if (booking.status === "accepted") { navTo = booking.pickup; navLabel = "Navigate to Pickup"; }
  else if (parsedStops.length > 0 && stopIdx < parsedStops.length) { navTo = parsedStops[stopIdx]; navLabel = `Navigate to Stop ${stopIdx + 1}`; }

  const TripPoint = ({ color, label, address }: { color: string; label: string; address: string }) => (
    <View style={styles.tripRow}>
      <View style={[styles.tripDot, { borderColor: color, backgroundColor: color + "20" }]} />
      <View style={styles.tripInfo}><Text style={styles.tripLabel}>{label}</Text><Text style={styles.tripAddress}>{address}</Text></View>
    </View>
  );
  const showNext = showNav && parsedStops.length > 0 && stopIdx < parsedStops.length && booking.status !== "accepted" && onNextStop;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Trip Details</Text>
      <TripPoint color={COLORS.green} label="Pickup" address={booking.pickup} />
      {booking.pickupDetails ? <View style={{ marginLeft: 24, marginTop: -4, marginBottom: 4 }}><Text style={{ color: COLORS.gold, fontSize: 11, fontStyle: "italic" }}>{booking.pickupDetails}</Text></View> : null}
      {booking.buildingInfo ? <View style={{ marginLeft: 24, marginTop: -4, marginBottom: 4 }}><Text style={{ color: "#F59E0B", fontSize: 11, fontStyle: "italic" }}>🏠 {booking.buildingInfo}</Text></View> : null}
      {parsedStops.map((stop, i) => (
        <View key={i}><View style={styles.tripLine} /><TripPoint color={i === stopIdx && booking.status !== "accepted" ? "#F59E0B" : "#D4A017"} label={`Stop ${i + 1}`} address={stop} /></View>
      ))}
      <View style={styles.tripLine} />
      <TripPoint color={COLORS.crimson} label="Drop-off" address={booking.dropoff} />
      {booking.dropoffDetails ? <View style={{ marginLeft: 24, marginTop: -4, marginBottom: 4 }}><Text style={{ color: COLORS.gold, fontSize: 11, fontStyle: "italic" }}>{booking.dropoffDetails}</Text></View> : null}
      {showNav && (
        <TouchableOpacity activeOpacity={0.8} onPress={() => openNavigation(navTo)} style={styles.navBtn}>
          <Ionicons name="navigate" size={18} color={COLORS.white} /><Text style={styles.navBtnText}>{navLabel}</Text>
        </TouchableOpacity>
      )}
      {showNext && (
        <TouchableOpacity activeOpacity={0.8} onPress={onNextStop} style={[styles.navBtn, { backgroundColor: "#F59E0B", marginTop: 8 }]}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
          <Text style={styles.navBtnText}>{stopIdx < parsedStops.length - 1 ? `Done — Next Stop ${stopIdx + 2}` : "Done — Head to Drop-off"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function RideInfoCard({ booking, compact }: { booking: Booking; compact?: boolean }) {
  const fareValue = booking.fareType === "meter" && !booking.meterFare
    ? `£${booking.fare.toFixed(2)} – £${(booking.fare * 1.1).toFixed(2)}`
    : `£${(booking.meterFare ?? booking.fare).toFixed(2)}`;
  const fareLabel = booking.fareType === "meter" && !booking.meterFare ? "Est. Fare" : "Fare";

  if (compact) {
    const infoItems = [
      { value: booking.date, label: "Date" },
      { value: booking.time, label: "Time" },
      { value: `${booking.distance?.toFixed(1) || "—"} mi`, label: "Distance" },
      { value: fareValue, label: fareLabel },
    ];
    return (
      <View style={{ flexDirection: "row", paddingVertical: 6, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
        {infoItems.map((item, i) => (
          <View key={item.label} style={{ alignItems: "center", flex: item.label === fareLabel ? 1.3 : 1, borderRightWidth: i < 3 ? 1 : 0, borderRightColor: "rgba(255,255,255,0.06)" }}>
            <Text style={{ color: COLORS.gray500, fontSize: 8, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>{item.label}</Text>
            <Text style={{ color: COLORS.white, fontSize: 12, fontWeight: "800", marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>{item.value}</Text>
          </View>
        ))}
      </View>
    );
  }

  const items: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string }[] = [
    { icon: "calendar-outline", value: booking.date, label: "Date" },
    { icon: "time-outline", value: booking.time, label: "Time" },
    { icon: "speedometer-outline", value: `${booking.distance?.toFixed(1) || "—"} mi`, label: "Distance" },
    { icon: "cash-outline", value: fareValue, label: fareLabel },
  ];
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Ride Info</Text>
      <View style={styles.rideGrid}>
        {items.map((it) => (
          <View key={it.label} style={styles.rideItem}>
            <Ionicons name={it.icon} size={15} color={COLORS.gold} />
            <Text style={styles.rideValue}>{it.value}</Text>
            <Text style={styles.rideLabel}>{it.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function NotesCard({ booking }: { booking: Booking }) {
  const t = booking.notes?.startsWith("stripe:") ? null : booking.notes;
  if (!t) return null;
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Notes</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <Ionicons name="document-text-outline" size={14} color={COLORS.gold} style={{ marginTop: 2 }} />
        <Text style={{ color: COLORS.gray400, fontSize: 13, flex: 1, lineHeight: 18 }}>{t}</Text>
      </View>
    </View>
  );
}

export function CashInputCard({ booking, cashAmount, setCashAmount, waitingCharge = 0, extraChargeNote, setExtraChargeNote, onFocus }: {
  booking: Booking; cashAmount: string; setCashAmount: (v: string) => void;
  waitingCharge?: number; extraChargeNote?: string; setExtraChargeNote?: (v: string) => void;
  onFocus?: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Cash Collected</Text>
      {waitingCharge > 0 && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Ionicons name="time-outline" size={13} color="#F97316" />
          <Text style={{ color: "#F97316", fontSize: 12, fontWeight: "700" }}>
            Includes £{waitingCharge.toFixed(2)} waiting charge
          </Text>
        </View>
      )}
      <View style={styles.cashInputRow}>
        <Text style={styles.currencySign}>£</Text>
        <TextInput style={styles.cashInput} value={cashAmount} onChangeText={setCashAmount}
          placeholder="0.00" placeholderTextColor={COLORS.gray500} keyboardType="decimal-pad"
          onFocus={onFocus} />
      </View>
      <Text style={styles.cashHint}>Enter amount received from customer</Text>
      {booking.fareType === "meter" && setExtraChargeNote && (
        <View style={{ marginTop: 12 }}>
          <Text style={{ color: COLORS.gray400, fontSize: 11, fontWeight: "600", marginBottom: 6 }}>Extra charge reason (optional)</Text>
          <TextInput
            style={{
              backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10,
              padding: 12, color: COLORS.white, fontSize: 13,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
              minHeight: 44,
            }}
            value={extraChargeNote}
            onChangeText={setExtraChargeNote}
            placeholder="e.g. Extra luggage, longer route..."
            placeholderTextColor={COLORS.gray500}
            multiline
            onFocus={onFocus}
          />
        </View>
      )}
    </View>
  );
}

export function ActionButtons({ actions, updating, onAction }: {
  actions: { label: string; next: string; icon: string; color: string }[]; updating: boolean; onAction: (next: string) => void;
}) {
  if (actions.length === 0) return null;
  return (
    <View style={styles.actionsWrap}>
      {actions.map((a) => (
        <TouchableOpacity key={a.next} activeOpacity={0.8} onPress={() => onAction(a.next)} disabled={updating} style={[styles.actionBtn, { backgroundColor: a.color }]}>
          {updating ? <ActivityIndicator color={COLORS.white} /> : (<><Ionicons name={a.icon as keyof typeof Ionicons.glyphMap} size={20} color={COLORS.white} /><Text style={styles.actionText}>{a.label}</Text></>)}
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function CompleteButton({ updating, onComplete }: { updating: boolean; onComplete: () => void }) {
  return (
    <View style={styles.actionsWrap}>
      <TouchableOpacity activeOpacity={0.8} onPress={onComplete} disabled={updating} style={[styles.actionBtn, { backgroundColor: COLORS.green }]}>
        {updating ? <ActivityIndicator color={COLORS.white} /> : (<><Ionicons name="checkmark-done-circle" size={20} color={COLORS.white} /><Text style={styles.actionText}>Complete Trip</Text></>)}
      </TouchableOpacity>
    </View>
  );
}
