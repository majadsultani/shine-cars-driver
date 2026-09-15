import { createContext, useContext, ReactNode, Component, ErrorInfo, useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useBookingPolling, NewBooking } from "@/src/hooks/useBookingPolling";
import { updateBookingStatus, acceptRecurringTemplate, rejectRecurringTemplate } from "@/src/lib/api";
import BookingAlertModal from "@/src/components/BookingAlertModal";

interface BookingAlertState {
  assignedCount: number;
  recurringCount: number;
}

const BookingAlertCtx = createContext<BookingAlertState>({ assignedCount: 0, recurringCount: 0 });

export function useBookingAlertCounts() {
  return useContext(BookingAlertCtx);
}

// Error boundary to catch and log crashes from the alert modal
class AlertErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("BookingAlertModal crashed:", error.message, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ position: "absolute", bottom: 50, left: 20, right: 20, backgroundColor: "#EF4444", padding: 12, borderRadius: 10, zIndex: 9999 }}>
          <Text style={{ color: "#FFF", fontSize: 12, fontWeight: "700" }}>Alert Error: {this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

export function BookingAlertProvider({ children }: { children: ReactNode }) {
  const { assignedCount, recurringCount, alertBooking, dismissAlert } = useBookingPolling();
  const router = useRouter();

  const handleAccept = async (id: string) => {
    const isRecurring = alertBooking?.isRecurring;
    dismissAlert();
    if (isRecurring) {
      try { await acceptRecurringTemplate(id); } catch {}
      router.push("/(tabs)/recurring");
    } else {
      try { await updateBookingStatus(id, "accepted"); } catch {}
      router.push(`/booking-detail?id=${id}`);
    }
  };

  const handleReject = async (id: string) => {
    dismissAlert();
    if (alertBooking?.isRecurring) {
      try { await rejectRecurringTemplate(id); } catch {}
    } else {
      try { await updateBookingStatus(id, "cancelled"); } catch {}
    }
  };

  return (
    <BookingAlertCtx.Provider value={{ assignedCount, recurringCount }}>
      {children}
      <AlertErrorBoundary>
        <BookingAlertModal
          booking={alertBooking}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      </AlertErrorBoundary>
    </BookingAlertCtx.Provider>
  );
}
