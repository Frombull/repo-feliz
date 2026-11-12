import { queryString, request } from "./api";

// um método para cada endpoint de /bookings do backend
export function listBookings({ roomId, status, date } = {}) {
  return request(`/bookings${queryString({ room_id: roomId, status, date })}`);
}

export function getBooking(id) {
  return request(`/bookings/${id}`);
}

export function createBooking(data) {
  return request("/bookings", { method: "POST", body: data });
}

export function updateBooking(id, changes) {
  return request(`/bookings/${id}`, { method: "PATCH", body: changes });
}

export function cancelBooking(id) {
  return request(`/bookings/${id}/cancel`, { method: "POST" });
}

export function deleteBooking(id) {
  return request(`/bookings/${id}`, { method: "DELETE" });
}
