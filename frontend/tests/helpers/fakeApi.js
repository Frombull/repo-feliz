import { vi } from "vitest";

export function jsonResponse(body, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status });
}

function withSeconds(value) {
  return value.length === 16 ? `${value}:00` : value;
}

function overlaps(booking, start, end) {
  return booking.status === "confirmed" && booking.start_at < end && booking.end_at > start;
}

// API falsa em memória que imita os endpoints de /rooms e /bookings do backend, incluindo
// algumas regras (nome único, conflito de horário, capacidade).
// Troca o fetch global, então as telas passam pelo request e pelos serviços de verdade.
export function mockApi({ rooms = [], bookings = [] } = {}) {
  const state = {
    rooms: rooms.map((room) => ({ active: true, location: null, ...room })),
    bookings: bookings.map((booking) => ({ status: "confirmed", ...booking })),
  };
  const nextId = (list) => list.reduce((max, item) => Math.max(max, item.id), 0) + 1;

  function handleRooms(method, id, params, body) {
    if (!id && method === "GET") {
      const active = params.get("active");
      const found = state.rooms.filter((r) => active === null || String(r.active) === active);
      return jsonResponse([...found].sort((a, b) => a.name.localeCompare(b.name)));
    }
    if (id === "available" && method === "GET") {
      const start = withSeconds(params.get("start_at"));
      const end = withSeconds(params.get("end_at"));
      const min = Number(params.get("min_capacity") ?? 1);
      const free = state.rooms.filter(
        (room) =>
          room.active &&
          room.capacity >= min &&
          !state.bookings.some((b) => b.room_id === room.id && overlaps(b, start, end)),
      );
      return jsonResponse(free);
    }
    if (!id && method === "POST") {
      if (state.rooms.some((r) => r.name.toLowerCase() === body.name.toLowerCase())) {
        return jsonResponse({ detail: "Já existe uma sala com esse nome" }, 409);
      }
      const room = { id: nextId(state.rooms), active: true, location: null, ...body };
      state.rooms.push(room);
      return jsonResponse(room, 201);
    }

    const room = state.rooms.find((r) => r.id === Number(id));
    if (!room) {
      return jsonResponse({ detail: "Sala não encontrada" }, 404);
    }
    if (method === "GET") {
      return jsonResponse(room);
    }
    if (method === "PATCH") {
      const taken = state.rooms.some(
        (r) => r.id !== room.id && r.name.toLowerCase() === body.name?.toLowerCase(),
      );
      if (taken) {
        return jsonResponse({ detail: "Já existe uma sala com esse nome" }, 409);
      }
      const hasUpcoming = state.bookings.some(
        (b) => b.room_id === room.id && b.status === "confirmed",
      );
      if (body.active === false && room.active && hasUpcoming) {
        return jsonResponse(
          { detail: "A sala tem reservas confirmadas que ainda não terminaram." },
          409,
        );
      }
      Object.assign(room, body);
      return jsonResponse(room);
    }
    if (method === "DELETE") {
      if (state.bookings.some((b) => b.room_id === room.id)) {
        return jsonResponse({ detail: "A sala já tem reservas e não pode ser excluída." }, 409);
      }
      state.rooms = state.rooms.filter((r) => r.id !== room.id);
      return jsonResponse(null, 204);
    }
    return jsonResponse({ detail: "Método não permitido" }, 405);
  }

  function checkBooking(data, ignoreId) {
    const room = state.rooms.find((r) => r.id === data.room_id);
    if (!room) {
      return jsonResponse({ detail: "Sala não encontrada" }, 404);
    }
    if (data.attendees > room.capacity) {
      const detail = `A sala comporta ${room.capacity} pessoas e a reserva tem ${data.attendees}`;
      return jsonResponse({ detail }, 422);
    }
    const other = state.bookings.find(
      (b) =>
        b.id !== ignoreId && b.room_id === data.room_id && overlaps(b, data.start_at, data.end_at),
    );
    if (other) {
      const detail = `A sala já está reservada das ${other.start_at.slice(11, 16)} às ${other.end_at.slice(11, 16)} (${other.title})`;
      return jsonResponse({ detail }, 409);
    }
    return null;
  }

  function handleBookings(method, id, action, params, body) {
    if (!id && method === "GET") {
      const roomId = params.get("room_id");
      const status = params.get("status");
      const date = params.get("date");
      const found = state.bookings.filter(
        (b) =>
          (roomId === null || b.room_id === Number(roomId)) &&
          (status === null || b.status === status) &&
          (date === null || b.start_at.startsWith(date)),
      );
      return jsonResponse([...found].sort((a, b) => a.start_at.localeCompare(b.start_at)));
    }
    if (!id && method === "POST") {
      const data = {
        ...body,
        start_at: withSeconds(body.start_at),
        end_at: withSeconds(body.end_at),
      };
      const problem = checkBooking(data, null);
      if (problem) {
        return problem;
      }
      const booking = { id: nextId(state.bookings), status: "confirmed", ...data };
      state.bookings.push(booking);
      return jsonResponse(booking, 201);
    }

    const booking = state.bookings.find((b) => b.id === Number(id));
    if (!booking) {
      return jsonResponse({ detail: "Reserva não encontrada" }, 404);
    }
    if (method === "GET") {
      return jsonResponse(booking);
    }
    if (method === "POST" && action === "cancel") {
      booking.status = "cancelled";
      return jsonResponse(booking);
    }
    if (method === "PATCH") {
      const data = { ...booking, ...body };
      data.start_at = withSeconds(data.start_at);
      data.end_at = withSeconds(data.end_at);
      const problem = checkBooking(data, booking.id);
      if (problem) {
        return problem;
      }
      Object.assign(booking, data);
      return jsonResponse(booking);
    }
    if (method === "DELETE") {
      if (booking.status === "confirmed") {
        return jsonResponse({ detail: "Cancele a reserva antes de excluí-la" }, 409);
      }
      state.bookings = state.bookings.filter((b) => b.id !== booking.id);
      return jsonResponse(null, 204);
    }
    return jsonResponse({ detail: "Método não permitido" }, 405);
  }

  const fetchMock = vi.fn(async (url, options = {}) => {
    const { pathname, searchParams } = new URL(url);
    const method = options.method ?? "GET";
    const body = options.body ? JSON.parse(options.body) : undefined;
    const [, resource, id, action] = pathname.split("/");

    if (resource === "rooms") {
      return handleRooms(method, id, searchParams, body);
    }
    if (resource === "bookings") {
      return handleBookings(method, id, action, searchParams, body);
    }
    return jsonResponse({ detail: "Not Found" }, 404);
  });

  vi.stubGlobal("fetch", fetchMock);

  return {
    fetchMock,
    state,
    // chamadas feitas à API, já separadas em método, caminho, query e corpo
    requests() {
      return fetchMock.mock.calls.map(([url, options = {}]) => {
        const { pathname, searchParams } = new URL(url);
        return {
          method: options.method ?? "GET",
          path: pathname,
          query: Object.fromEntries(searchParams),
          body: options.body ? JSON.parse(options.body) : undefined,
        };
      });
    },
  };
}

export function mockApiOffline() {
  const fetchMock = vi.fn(async () => {
    throw new TypeError("Failed to fetch");
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

export function mockApiError(status, detail) {
  const fetchMock = vi.fn(async () => jsonResponse({ detail }, status));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
