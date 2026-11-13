import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RoomList } from "../../src/components/RoomList";

const rooms = [
  { id: 1, name: "Sala A", capacity: 10, location: "Bloco 1", active: true },
  { id: 2, name: "Sala B", capacity: 4, location: null, active: false },
];

function renderList(props = {}) {
  const handlers = { onEdit: vi.fn(), onToggleActive: vi.fn(), onDelete: vi.fn() };
  render(<RoomList rooms={rooms} {...handlers} {...props} />);
  return handlers;
}

describe("RoomList", () => {
  it("avisa quando não há salas", () => {
    render(<RoomList rooms={[]} />);

    expect(screen.getByText("Nenhuma sala encontrada.")).toBeInTheDocument();
  });

  it("mostra nome, capacidade, localização e situação de cada sala", () => {
    renderList();

    const [first, second] = screen.getAllByRole("listitem");
    expect(first).toHaveTextContent("Sala A");
    expect(first).toHaveTextContent("10 lugares · Bloco 1");
    expect(first).toHaveTextContent("Ativa");
    expect(second).toHaveTextContent("4 lugares");
    expect(second).not.toHaveTextContent("·");
    expect(second).toHaveTextContent("Inativa");
  });

  it("oferece desativar para salas ativas e ativar para inativas", () => {
    renderList();

    const [first, second] = screen.getAllByRole("listitem");
    expect(within(first).getByRole("button", { name: "Desativar" })).toBeInTheDocument();
    expect(within(second).getByRole("button", { name: "Ativar" })).toBeInTheDocument();
  });

  it("chama os handlers com a sala da linha", async () => {
    const handlers = renderList();
    const [first] = screen.getAllByRole("listitem");

    await userEvent.click(within(first).getByRole("button", { name: "Editar" }));
    await userEvent.click(within(first).getByRole("button", { name: "Desativar" }));
    await userEvent.click(within(first).getByRole("button", { name: "Excluir" }));

    expect(handlers.onEdit).toHaveBeenCalledWith(rooms[0]);
    expect(handlers.onToggleActive).toHaveBeenCalledWith(rooms[0]);
    expect(handlers.onDelete).toHaveBeenCalledWith(rooms[0]);
  });
});
