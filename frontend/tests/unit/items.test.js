import { describe, expect, it, vi } from "vitest";
import { API_URL } from "../../src/services/api";
import {
  createItem,
  deleteItem,
  getItem,
  listItems,
  replaceItem,
  updateItem,
} from "../../src/services/items";
import { jsonResponse } from "../helpers/fakeApi";

function stubFetch() {
  const fetchMock = vi.fn(async () => jsonResponse({ id: 1 }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("services/items", () => {
  it("listItems chama GET /items", async () => {
    const fetchMock = stubFetch();
    await listItems();
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/items`, { method: "GET" });
  });

  it.each([true, false])("listItems filtra por available=%s", async (available) => {
    const fetchMock = stubFetch();
    await listItems(available);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/items?available=${available}`, {
      method: "GET",
    });
  });

  it("getItem chama GET /items/{id}", async () => {
    const fetchMock = stubFetch();
    await getItem(3);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/items/3`, { method: "GET" });
  });

  it("createItem chama POST /items com o corpo", async () => {
    const fetchMock = stubFetch();
    const data = { name: "Mouse", price: 50, available: true };
    await createItem(data);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  });

  it("replaceItem chama PUT /items/{id} com o item inteiro", async () => {
    const fetchMock = stubFetch();
    const data = { name: "Mouse", price: 60, available: false };
    await replaceItem(2, data);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/items/2`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  });

  it("updateItem chama PATCH /items/{id} só com o que mudou", async () => {
    const fetchMock = stubFetch();
    await updateItem(2, { available: false });
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/items/2`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: false }),
    });
  });

  it("deleteItem chama DELETE /items/{id}", async () => {
    const fetchMock = stubFetch();
    await deleteItem(2);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/items/2`, { method: "DELETE" });
  });
});
