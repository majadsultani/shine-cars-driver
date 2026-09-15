import { useEffect, useRef, useState, useCallback } from "react";
import { AppState } from "react-native";
import { getBookings, getRecurringTemplates } from "@/src/lib/api";
import { getToken } from "@/src/lib/auth";
import { scheduleBookingReminder } from "@/src/lib/notifications";

const POLL_INTERVAL = 10_000;

export interface NewBooking {
  id: string; name: string; pickup: string; dropoff: string;
  vehicle?: string; fare?: number; date?: string; time?: string;
  fareType?: string; isRecurring?: boolean; isPriority?: boolean; days?: string;
  pickupDetails?: string | null; dropoffDetails?: string | null; buildingInfo?: string | null;
}

export function useBookingPolling() {
  const [assignedCount, setAssignedCount] = useState(0);
  const [recurringCount, setRecurringCount] = useState(0);
  const [alertBooking, setAlertBooking] = useState<NewBooking | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const knownRecurringIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const [res, recRes] = await Promise.all([
        getBookings("assigned"),
        getRecurringTemplates(),
      ]);

      // Regular bookings
      if (res.success) {
        const bookings: NewBooking[] = res.bookings || [];
        setAssignedCount(bookings.length);

        if (isFirstLoad.current) {
          bookings.forEach((b) => knownIds.current.add(b.id));
        } else {
          const newBookings = bookings.filter((b) => !knownIds.current.has(b.id));
          bookings.forEach((b) => knownIds.current.add(b.id));
          if (newBookings.length > 0 && !alertBooking) {
            setAlertBooking(newBookings[0]);
          }
          // TEMP: disabled to debug iOS crash
          // newBookings.forEach((b) => {
          //   if (b.time && b.date) scheduleBookingReminder(b.id, b.time, b.date, b.pickup);
          // });
        }
      }

      // Recurring templates
      if (recRes.success) {
        const templates = recRes.templates || [];
        setRecurringCount(templates.length);
        if (isFirstLoad.current) {
          templates.forEach((t: { id: string }) => knownRecurringIds.current.add(t.id));
        } else {
          const newTemplates = templates.filter((t: { id: string }) => !knownRecurringIds.current.has(t.id));
          templates.forEach((t: { id: string }) => knownRecurringIds.current.add(t.id));
          if (newTemplates.length > 0 && !alertBooking) {
            const t = newTemplates[0];
            setAlertBooking({
              id: t.id, name: t.name, pickup: t.pickup, dropoff: t.dropoff,
              vehicle: t.vehicle, fare: t.fare, time: t.time,
              isRecurring: true, days: t.days,
            });
          }
        }
      }

      if (isFirstLoad.current) isFirstLoad.current = false;
    } catch {}
  }, [alertBooking]);

  const dismissAlert = useCallback(() => setAlertBooking(null), []);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [poll]);

  // Immediately poll when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") poll();
    });
    return () => sub.remove();
  }, [poll]);

  return { assignedCount, recurringCount, alertBooking, dismissAlert };
}
