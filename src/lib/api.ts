import { API_URL } from "@/src/constants/theme";
import { getToken } from "./auth";

async function request(path: string, options: RequestInit = {}) {
  const token = (await getToken())?.trim();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  return res.json();
}

export async function registerDriver(data: {
  name: string; email: string; phone: string; password: string;
  vehicleMake?: string; vehicleColor?: string; vehicleReg?: string;
  passengerLicense?: number;
}) {
  return request("/api/drivers/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function loginDriver(email: string, password: string) {
  return request("/api/drivers/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function resetDriverPassword(email: string, phone: string, newPassword: string) {
  return request("/api/drivers/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, phone, newPassword }),
  });
}

export async function getProfile() {
  return request("/api/drivers/me");
}

export async function toggleAvailability(isAvailable: boolean) {
  return request("/api/drivers/availability", {
    method: "PATCH",
    body: JSON.stringify({ isAvailable }),
  });
}

export async function getBookings(filter: string) {
  return request(`/api/drivers/bookings?filter=${filter}`);
}

export async function getRecurringTemplates() {
  return request("/api/drivers/recurring");
}

export async function acceptRecurringTemplate(recurringId: string) {
  return request("/api/drivers/recurring/accept", {
    method: "POST",
    body: JSON.stringify({ recurringId }),
  });
}

export async function rejectRecurringTemplate(recurringId: string) {
  return request("/api/drivers/recurring/reject", {
    method: "POST",
    body: JSON.stringify({ recurringId }),
  });
}

export async function updateBookingStatus(
  bookingId: string, status: string, cashCollected?: number,
  meterDistance?: number, meterFare?: number, waitingCharge?: number,
  extraChargeNote?: string, waitingSeconds?: number,
) {
  return request("/api/drivers/bookings/status", {
    method: "PATCH",
    body: JSON.stringify({ bookingId, status, cashCollected, meterDistance, meterFare, waitingCharge, waitingSeconds, extraChargeNote }),
  });
}

export async function saveWaitingTime(bookingId: string, waitingSeconds: number, waitingCharge: number) {
  return request("/api/drivers/bookings/waiting", {
    method: "PATCH",
    body: JSON.stringify({ bookingId, waitingSeconds, waitingCharge }),
  });
}

export async function updateLocation(latitude: number, longitude: number) {
  return request("/api/drivers/location", {
    method: "PATCH",
    body: JSON.stringify({ latitude, longitude }),
  });
}

export async function updateProfile(data: { name?: string; phone?: string; vehicleMake?: string; vehicleColor?: string; vehicleReg?: string; passengerLicense?: number | null }) {
  return request("/api/drivers/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function savePushToken(pushToken: string) {
  return request("/api/drivers/push-token", {
    method: "PATCH",
    body: JSON.stringify({ pushToken }),
  });
}

export async function getNotifications() {
  return request("/api/drivers/notifications");
}

export async function markNotificationsRead(id?: string) {
  return request("/api/drivers/notifications/read", {
    method: "PATCH",
    body: JSON.stringify(id ? { id } : {}),
  });
}

export async function clearNotifications() {
  return request("/api/drivers/notifications", { method: "DELETE" });
}

export async function deleteAccount() {
  return request("/api/drivers/me", { method: "DELETE" });
}

export async function getChatMessages() {
  return request("/api/drivers/chat");
}

export async function sendChatMessage(message: string) {
  return request("/api/drivers/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function changePassword(oldPassword: string, newPassword: string) {
  return request("/api/drivers/change-password", {
    method: "POST",
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

export async function getDriverInvoices() {
  return request("/api/drivers/invoices");
}

export async function getDriverInvoiceDetail(id: string) {
  return request(`/api/drivers/invoices/${id}`);
}

export async function getDocuments(): Promise<{ success: boolean; documents?: { id: string; type: string; fileUrl: string; expiryDate: string }[] }> {
  return request("/api/drivers/documents");
}

export async function uploadDocument(
  type: string, uri: string, expiryDate: string
): Promise<{ success: boolean; document?: unknown; message?: string }> {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const filename = uri.split("/").pop() || "document.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const mimeType = match ? `image/${match[1]}` : "image/jpeg";

  const response = await fetch(uri);
  const blob = await response.blob();

  const formData = new FormData();
  formData.append("type", type);
  formData.append("expiryDate", expiryDate);
  formData.append("file", blob, filename);
  formData.append("token", token);

  const res = await fetch(`${API_URL}/api/drivers/documents`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Upload failed");
  return data;
}
