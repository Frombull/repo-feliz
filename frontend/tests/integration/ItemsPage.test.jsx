import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ItemsPage } from "../../src/pages/ItemsPage";

const initialItems = [
  { id: 1, name: "Teclado", price: 150, available: true },
  { id: 2, name: "Monitor", price: 899.9, available: false },
];

function getRow(name) {
  return screen.getByText(name).closest("li");
}

describe("ItemsPage", () => {
  it("adiciona pelo formulário e o item aparece na lista", async () => {
    const user = userEvent.setup();
    render(<ItemsPage initialItems={initialItems} />);

    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.type(screen.getByLabelText("Preço"), "50");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(within(getRow("Mouse")).getByText("Disponível")).toBeInTheDocument();
    expect(screen.getByText("Lista (3)")).toBeInTheDocument();
  });

  it("não adiciona item inválido", async () => {
    const user = userEvent.setup();
    render(<ItemsPage initialItems={initialItems} />);

    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.type(screen.getByLabelText("Preço"), "0");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByText("O preço deve ser maior que zero")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("filtra pela disponibilidade", async () => {
    const user = userEvent.setup();
    render(<ItemsPage initialItems={initialItems} />);

    await user.selectOptions(screen.getByLabelText("Mostrar"), "available");
    expect(screen.getByText("Teclado")).toBeInTheDocument();
    expect(screen.queryByText("Monitor")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Mostrar"), "unavailable");
    expect(screen.getByText("Monitor")).toBeInTheDocument();
    expect(screen.queryByText("Teclado")).not.toBeInTheDocument();
  });

  it("alterar a disponibilidade move o item de filtro", async () => {
    const user = userEvent.setup();
    render(<ItemsPage initialItems={initialItems} />);

    await user.selectOptions(screen.getByLabelText("Mostrar"), "available");
    await user.click(
      within(getRow("Teclado")).getByRole("button", { name: "Marcar indisponível" }),
    );

    expect(screen.getByText("Nenhum item encontrado.")).toBeInTheDocument();
  });

  it("remove o item da lista", async () => {
    const user = userEvent.setup();
    render(<ItemsPage initialItems={initialItems} />);

    await user.click(within(getRow("Monitor")).getByRole("button", { name: "Remover" }));

    expect(screen.queryByText("Monitor")).not.toBeInTheDocument();
    expect(screen.getByText("Lista (1)")).toBeInTheDocument();
  });
});
