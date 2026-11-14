import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../../src/App";
import { jsonResponse, mockApiError, mockApiOffline, mockItemsApi } from "../helpers/fakeApi";

// a API falsa começa com Teclado (disponível) e Monitor (indisponível)
const initialItems = [
  { id: 1, name: "Teclado", price: 150, available: true },
  { id: 2, name: "Monitor", price: 899.9, available: false },
];

function getRow(name) {
  return screen.getByText(name).closest("li");
}

async function renderApp() {
  render(<App />);
  await screen.findByText("Teclado");
}

describe("App com a API", () => {
  it("mostra o carregando e depois os itens vindos da API", async () => {
    const fetchMock = mockItemsApi(initialItems);
    render(<App />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando itens...");
    expect(await screen.findByText("Teclado")).toBeInTheDocument();
    expect(screen.getByText("Monitor")).toBeInTheDocument();
    expect(screen.getByText("Lista (2)")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mostra o erro e tenta de novo quando a API está fora do ar", async () => {
    const user = userEvent.setup();
    mockApiOffline();
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar à API");

    mockItemsApi(initialItems);
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Teclado")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("mostra a mensagem da API quando a listagem falha", async () => {
    mockApiError(500, "Erro interno");
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro interno");
  });

  it("cadastra pela API e o item aparece na lista", async () => {
    const user = userEvent.setup();
    const fetchMock = mockItemsApi(initialItems);
    await renderApp();

    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.type(screen.getByLabelText("Preço"), "50");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(await screen.findByText("Mouse")).toBeInTheDocument();
    expect(within(getRow("Mouse")).getByText("Disponível")).toBeInTheDocument();
    expect(screen.getByText("Lista (3)")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/items"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Mouse", price: 50, available: true }),
      }),
    );
  });

  it("não chama a API quando o formulário é inválido", async () => {
    const user = userEvent.setup();
    const fetchMock = mockItemsApi(initialItems);
    await renderApp();

    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.type(screen.getByLabelText("Preço"), "0");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByText("O preço deve ser maior que zero")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("mostra o erro do cadastro e mantém o formulário preenchido", async () => {
    const user = userEvent.setup();
    const fetchMock = mockItemsApi(initialItems);
    await renderApp();

    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.type(screen.getByLabelText("Preço"), "50");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar à API");
    expect(screen.getByLabelText("Nome")).toHaveValue("Mouse");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("filtra pela disponibilidade usando o parâmetro da API", async () => {
    const user = userEvent.setup();
    const fetchMock = mockItemsApi(initialItems);
    await renderApp();

    await user.selectOptions(screen.getByLabelText("Mostrar"), "unavailable");
    expect(await screen.findByText("Monitor")).toBeInTheDocument();
    expect(screen.queryByText("Teclado")).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("/items?available=false"),
      expect.anything(),
    );

    await user.selectOptions(screen.getByLabelText("Mostrar"), "available");
    expect(await screen.findByText("Teclado")).toBeInTheDocument();
    expect(screen.queryByText("Monitor")).not.toBeInTheDocument();
  });

  it("alterar a disponibilidade move o item de filtro", async () => {
    const user = userEvent.setup();
    mockItemsApi(initialItems);
    await renderApp();

    await user.selectOptions(screen.getByLabelText("Mostrar"), "available");
    await screen.findByText("Lista (1)");
    await user.click(
      within(getRow("Teclado")).getByRole("button", { name: "Marcar indisponível" }),
    );

    expect(await screen.findByText("Nenhum item encontrado.")).toBeInTheDocument();
  });

  it("remove o item pela API", async () => {
    const user = userEvent.setup();
    mockItemsApi(initialItems);
    await renderApp();

    await user.click(within(getRow("Monitor")).getByRole("button", { name: "Remover" }));

    expect(await screen.findByText("Lista (1)")).toBeInTheDocument();
    expect(screen.queryByText("Monitor")).not.toBeInTheDocument();
  });

  it("mostra o erro da API quando o item já não existe", async () => {
    const user = userEvent.setup();
    const fetchMock = mockItemsApi(initialItems);
    await renderApp();

    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Item não encontrado" }, 404));
    await user.click(within(getRow("Monitor")).getByRole("button", { name: "Remover" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Item não encontrado");
    expect(screen.getByText("Monitor")).toBeInTheDocument();
  });
});
