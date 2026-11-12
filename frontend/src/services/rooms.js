import { queryString, request } from "./api";

// um método para cada endpoint de /rooms do backend
export function listRooms({ active } = {}) {
  return request(`/rooms${queryString({ active })}`);
}

export function getRoom(id) {
  return request(`/rooms/${id}`);
}

export function createRoom(data) {
  return request("/rooms", { method: "POST", body: data });
}

export function updateRoom(id, changes) {
  return request(`/rooms/${id}`, { method: "PATCH", body: changes });
}

export function deleteRoom(id) {
  return request(`/rooms/${id}`, { method: "DELETE" });
}

// salas ativas, com a capacidade pedida e livres em todo o período
export function listAvailableRooms({ startAt, endAt, minCapacity }) {
  const query = queryString({ start_at: startAt, end_at: endAt, min_capacity: minCapacity });
  return request(`/rooms/available${query}`);
}
