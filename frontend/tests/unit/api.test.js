import { describe, expect, it, vi } from "vitest";
import { API_URL, ApiError, queryString, request } from "../../src/services/api";
import { jsonResponse } from "../helpers/fakeApi";

function stubFetch(impl) {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("request", () => {
  it("devolve o JSON quando a API responde com sucesso", async () => {
    const fetchMock = stubFetch(async () => jsonResponse([{ id: 1 }]));

    await expect(request("/rooms")).resolves.toEqual([{ id: 1 }]);
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/rooms`, { method: "GET" });
  });

  it("envia o corpo como JSON", async () => {
    const fetchMock = stubFetch(async () => jsonResponse({ id: 1 }, 201));

    await request("/rooms", { method: "POST", body: { name: "Sala A" } });

    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Sala A" }),
    });
  });

  it("devolve null quando a resposta é 204", async () => {
    stubFetch(async () => jsonResponse(null, 204));

    await expect(request("/rooms/1", { method: "DELETE" })).resolves.toBeNull();
  });

  it("avisa que não conseguiu conectar quando o fetch rejeita", async () => {
    stubFetch(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(request("/rooms")).rejects.toThrow("Não foi possível conectar à API");
  });

  it("usa o detail da API quando a resposta não é de sucesso", async () => {
    stubFetch(async () => jsonResponse({ detail: "Sala não encontrada" }, 404));

    const error = await request("/rooms/9").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.message).toBe("Sala não encontrada");
    expect(error.status).toBe(404);
  });

  it("junta as mensagens quando o detail é uma lista de erros (422)", async () => {
    stubFetch(async () =>
      jsonResponse(
        { detail: [{ msg: "Input should be greater than 0" }, { msg: "Field required" }] },
        422,
      ),
    );

    await expect(request("/rooms", { method: "POST", body: {} })).rejects.toThrow(
      "Input should be greater than 0. Field required",
    );
  });

  it("usa uma mensagem genérica quando o erro não tem detail", async () => {
    stubFetch(async () => new Response("Internal Server Error", { status: 500 }));

    await expect(request("/rooms")).rejects.toThrow("Erro 500 ao acessar a API");
  });
});

describe("queryString", () => {
  it("monta a query só com os valores preenchidos", () => {
    expect(queryString({ a: 1, b: "x y", c: undefined, d: null, e: "", f: false })).toBe(
      "?a=1&b=x+y&f=false",
    );
  });

  it("devolve texto vazio quando não há parâmetros", () => {
    expect(queryString({})).toBe("");
    expect(queryString({ a: undefined })).toBe("");
  });
});
