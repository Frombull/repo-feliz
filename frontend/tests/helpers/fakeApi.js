import { vi } from "vitest";

function jsonResponse(body, status = 200) {
  return new Response(body === null ? null : JSON.stringify(body), { status });
}

// API falsa em memória que imita os endpoints de /items do backend.
// Troca o fetch global, então o App passa pelo request e pelos serviços de verdade.
export function mockItemsApi(initialItems = []) {
  let items = initialItems.map((item) => ({ ...item }));
  let nextId = items.reduce((max, item) => Math.max(max, item.id), 0) + 1;

  const fetchMock = vi.fn(async (url, options = {}) => {
    const { pathname, searchParams } = new URL(url);
    const method = options.method ?? "GET";
    const body = options.body ? JSON.parse(options.body) : undefined;
    const id = Number(pathname.split("/")[2]);

    if (pathname === "/items" && method === "GET") {
      const available = searchParams.get("available");
      const result =
        available === null ? items : items.filter((item) => String(item.available) === available);
      return jsonResponse(result);
    }
    if (pathname === "/items" && method === "POST") {
      const item = { id: nextId++, available: true, ...body };
      items.push(item);
      return jsonResponse(item, 201);
    }

    const item = items.find((current) => current.id === id);
    if (!item) {
      return jsonResponse({ detail: "Item não encontrado" }, 404);
    }
    if (method === "PATCH") {
      Object.assign(item, body);
      return jsonResponse(item);
    }
    if (method === "DELETE") {
      items = items.filter((current) => current.id !== id);
      return jsonResponse(null, 204);
    }
    return jsonResponse({ detail: "Método não permitido" }, 405);
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
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

export { jsonResponse };
