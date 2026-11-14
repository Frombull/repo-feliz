import { request } from "./api";

// um método para cada endpoint de /items do backend
export function listItems(available) {
  const query = available === undefined ? "" : `?available=${available}`;
  return request(`/items${query}`);
}

export function getItem(id) {
  return request(`/items/${id}`);
}

export function createItem(data) {
  return request("/items", { method: "POST", body: data });
}

export function replaceItem(id, data) {
  return request(`/items/${id}`, { method: "PUT", body: data });
}

export function updateItem(id, changes) {
  return request(`/items/${id}`, { method: "PATCH", body: changes });
}

export function deleteItem(id) {
  return request(`/items/${id}`, { method: "DELETE" });
}
