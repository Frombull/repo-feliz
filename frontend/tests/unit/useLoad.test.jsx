import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useLoad } from "../../src/hooks/useLoad";

describe("useLoad", () => {
  it("começa carregando e entrega os dados", async () => {
    const loader = vi.fn(async () => ["a"]);

    const { result } = renderHook(() => useLoad(loader));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(["a"]);
    expect(result.current.error).toBeNull();
  });

  it("guarda a mensagem quando a busca falha", async () => {
    const loader = vi.fn(async () => {
      throw new Error("Não foi possível conectar à API.");
    });

    const { result } = renderHook(() => useLoad(loader));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Não foi possível conectar à API.");
    expect(result.current.data).toBeNull();
  });

  it("reload busca de novo e limpa o erro", async () => {
    const loader = vi.fn().mockRejectedValueOnce(new Error("falhou")).mockResolvedValueOnce(["ok"]);

    const { result } = renderHook(() => useLoad(loader));
    await waitFor(() => expect(result.current.error).toBe("falhou"));

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.data).toEqual(["ok"]));
    expect(result.current.error).toBeNull();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("refresh atualiza os dados sem voltar para carregando", async () => {
    const loader = vi.fn().mockResolvedValueOnce(["a"]).mockResolvedValueOnce(["a", "b"]);

    const { result } = renderHook(() => useLoad(loader));
    await waitFor(() => expect(result.current.data).toEqual(["a"]));

    await act(() => result.current.refresh());

    expect(result.current.data).toEqual(["a", "b"]);
    expect(result.current.loading).toBe(false);
  });

  it("refresh repassa o erro para quem chamou", async () => {
    const loader = vi.fn().mockResolvedValueOnce(["a"]).mockRejectedValueOnce(new Error("caiu"));

    const { result } = renderHook(() => useLoad(loader));
    await waitFor(() => expect(result.current.data).toEqual(["a"]));

    await expect(act(() => result.current.refresh())).rejects.toThrow("caiu");
    expect(result.current.data).toEqual(["a"]);
  });

  it("refaz a busca quando o loader muda", async () => {
    const first = vi.fn(async () => "primeiro");
    const second = vi.fn(async () => "segundo");

    const { result, rerender } = renderHook(({ loader }) => useLoad(loader), {
      initialProps: { loader: first },
    });
    await waitFor(() => expect(result.current.data).toBe("primeiro"));

    rerender({ loader: second });

    await waitFor(() => expect(result.current.data).toBe("segundo"));
  });
});
