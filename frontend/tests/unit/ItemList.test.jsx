import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemList } from "../../src/components/ItemList";

const items = [
  { id: 1, name: "Teclado", price: 150, available: true },
  { id: 2, name: "Monitor", price: 899.9, available: false },
];

describe("ItemList", () => {
  it("mostra uma mensagem quando não há itens", () => {
    render(<ItemList items={[]} onToggle={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText("Nenhum item encontrado.")).toBeInTheDocument();
  });

  it("lista os itens com a disponibilidade", () => {
    render(<ItemList items={items} onToggle={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Disponível")).toBeInTheDocument();
    expect(screen.getByText("Indisponível")).toBeInTheDocument();
  });

  it("chama os callbacks com o id do item", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const onRemove = vi.fn();
    render(<ItemList items={items} onToggle={onToggle} onRemove={onRemove} />);

    await user.click(screen.getByRole("button", { name: "Marcar disponível" }));
    await user.click(screen.getAllByRole("button", { name: "Remover" })[0]);

    expect(onToggle).toHaveBeenCalledWith(2);
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});
