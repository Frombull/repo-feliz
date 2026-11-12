import { describe, expect, it, vi } from "vitest";
import { API_URL } from "../../src/services/api";
import {
  createRoom,
  deleteRoom,
  getRoom,
  listAvailableRooms,
  listRooms,
  updateRoom,
} from "../../src/services/rooms";
import { jsonResponse } from "../helpers/fakeApi";

function stubFetch(body = {}, status = 200) {
  const fetchMock = vi.fn(async () => jsonResponse(body, status));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("serviço de salas", () => {
  it("lista as salas, com ou sem o filtro active", async () => {
    const fetchMock = stubFetch([]);

    await listRooms();
    await listRooms({ active: true });
    await listRooms({ active: false });

    const urls = fetchMock.mock.calls.map(([url]) => url);
    expect(urls).toEqual([
      `${API_URL}/rooms`,
      `${API_URL}/rooms?active=true`,
      `${API_URL}/rooms?active=false`,
    ]);
  });

  it("busca uma sala pelo id", async () => {
    const fetchMock = stubFetch({ id: 3 });

    await expect(getRoom(3)).resolves.toEqual({ id: 3 });
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/rooms/3`, { method: "GET" });
  });

  it("cadastra com POST e o corpo em JSON", async () => {
    const fetchMock = stubFetch({ id: 1 }, 201);
    const data = { name: "Sala A", capacity: 10, location: null };

    await createRoom(data);

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  });

  it("altera com PATCH só o que mudou", async () => {
    const fetchMock = stubFetch({ id: 1 });

    await updateRoom(1, { active: false });

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/rooms/1`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
  });

  it("remove com DELETE e aceita a resposta 204", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(null, 204));
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteRoom(1)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/rooms/1`, { method: "DELETE" });
  });

  it("busca as salas livres convertendo os nomes para os da API", async () => {
    const fetchMock = stubFetch([]);

    await listAvailableRooms({
      startAt: "2030-05-10T09:00",
      endAt: "2030-05-10T10:00",
      minCapacity: 5,
    });

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/rooms/available");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      start_at: "2030-05-10T09:00",
      end_at: "2030-05-10T10:00",
      min_capacity: "5",
    });
  });

  it("não envia a capacidade mínima quando ela não foi informada", async () => {
    const fetchMock = stubFetch([]);

    await listAvailableRooms({
      startAt: "2030-05-10T09:00",
      endAt: "2030-05-10T10:00",
      minCapacity: "",
    });

    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.has("min_capacity")).toBe(false);
  });
});
