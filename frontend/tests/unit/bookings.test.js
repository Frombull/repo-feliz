import { describe, expect, it, vi } from "vitest";
import { API_URL } from "../../src/services/api";
import {
  cancelBooking,
  createBooking,
  deleteBooking,
  getBooking,
  listBookings,
  updateBooking,
} from "../../src/services/bookings";
import { jsonResponse } from "../helpers/fakeApi";

function stubFetch(body = {}, status = 200) {
  const fetchMock = vi.fn(async () => jsonResponse(body, status));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("serviço de reservas", () => {
  it("lista sem filtros", async () => {
    const fetchMock = stubFetch([]);

    await listBookings();

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/bookings`, { method: "GET" });
  });

  it("lista com os filtros convertidos para os nomes da API", async () => {
    const fetchMock = stubFetch([]);

    await listBookings({ roomId: 2, status: "confirmed", date: "2030-05-10" });

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/bookings");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      room_id: "2",
      status: "confirmed",
      date: "2030-05-10",
    });
  });

  it("ignora filtros vazios", async () => {
    const fetchMock = stubFetch([]);

    await listBookings({ roomId: "", status: "", date: "" });

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/bookings`, { method: "GET" });
  });

  it("busca uma reserva pelo id", async () => {
    const fetchMock = stubFetch({ id: 4 });

    await expect(getBooking(4)).resolves.toEqual({ id: 4 });
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/bookings/4`, { method: "GET" });
  });

  it("cria com POST e o corpo em JSON", async () => {
    const fetchMock = stubFetch({ id: 1 }, 201);
    const data = { room_id: 1, title: "Daily", start_at: "2030-05-10T09:00" };

    await createBooking(data);

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  });

  it("altera com PATCH", async () => {
    const fetchMock = stubFetch({ id: 1 });

    await updateBooking(1, { title: "Nova" });

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/bookings/1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nova" }),
    });
  });

  it("cancela com POST em /cancel, sem corpo", async () => {
    const fetchMock = stubFetch({ id: 1, status: "cancelled" });

    await cancelBooking(1);

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/bookings/1/cancel`, { method: "POST" });
  });

  it("exclui com DELETE", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(null, 204));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteBooking(1)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/bookings/1`, { method: "DELETE" });
  });
});
