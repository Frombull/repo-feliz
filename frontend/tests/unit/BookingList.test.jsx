import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookingList } from "../../src/components/BookingList";

const rooms = [{ id: 1, name: "Sala A" }];
const now = new Date("2030-05-10T09:30:00");

const make = (id, status, start, end, extra = {}) => ({
  id,
  room_id: 1,
  title: `Reserva ${id}`,
  requester: "Ana",
  attendees: 3,
  status,
  start_at: start,
  end_at: end,
  ...extra,
});

const upcoming = make(1, "confirmed", "2030-05-10T10:00:00", "2030-05-10T11:00:00");
const running = make(2, "confirmed", "2030-05-10T09:00:00", "2030-05-10T10:00:00");
const cancelled = make(3, "cancelled", "2030-05-10T12:00:00", "2030-05-10T13:00:00");
const finished = make(4, "confirmed", "2030-05-10T07:00:00", "2030-05-10T08:00:00");

function renderList(bookings) {
  const handlers = { onEdit: vi.fn(), onCancel: vi.fn(), onDelete: vi.fn() };
  render(<BookingList bookings={bookings} rooms={rooms} now={now} {...handlers} />);
  return handlers;
}

describe("BookingList", () => {
  it("avisa quando não há reservas", () => {
    render(<BookingList bookings={[]} rooms={rooms} />);

    expect(screen.getByText("Nenhuma reserva encontrada.")).toBeInTheDocument();
  });

  it("mostra título, sala, período, responsável e situação", () => {
    renderList([upcoming, cancelled]);

    const [first, second] = screen.getAllByRole("listitem");
    expect(first).toHaveTextContent("Reserva 1");
    expect(first).toHaveTextContent("Sala A · 10/05/2030 10:00 às 11:00");
    expect(first).toHaveTextContent("Ana · 3 participantes");
    expect(first).toHaveTextContent("Confirmada");
    expect(second).toHaveTextContent("Cancelada");
  });

  it("usa o singular para um participante e um nome genérico se a sala não vier", () => {
    renderList([
      make(5, "confirmed", upcoming.start_at, upcoming.end_at, { attendees: 1, room_id: 9 }),
    ]);

    expect(screen.getByRole("listitem")).toHaveTextContent("Sala 9");
    expect(screen.getByRole("listitem")).toHaveTextContent("1 participante");
    expect(screen.getByRole("listitem")).not.toHaveTextContent("1 participantes");
  });

  it("oferece editar e cancelar só para reservas confirmadas que não começaram", () => {
    renderList([upcoming, running, cancelled, finished]);

    const [a, b, c, d] = screen.getAllByRole("listitem");
    expect(within(a).getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(within(a).getByRole("button", { name: "Cancelar reserva" })).toBeInTheDocument();
    for (const item of [b, c, d]) {
      expect(within(item).queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
      expect(
        within(item).queryByRole("button", { name: "Cancelar reserva" }),
      ).not.toBeInTheDocument();
    }
  });

  it("oferece excluir só para reservas canceladas ou que já terminaram", () => {
    renderList([upcoming, running, cancelled, finished]);

    const [a, b, c, d] = screen.getAllByRole("listitem");
    expect(within(a).queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
    expect(within(b).queryByRole("button", { name: "Excluir" })).not.toBeInTheDocument();
    expect(within(c).getByRole("button", { name: "Excluir" })).toBeInTheDocument();
    expect(within(d).getByRole("button", { name: "Excluir" })).toBeInTheDocument();
  });

  it("chama os handlers com a reserva da linha", async () => {
    const handlers = renderList([upcoming, cancelled]);
    const [first, second] = screen.getAllByRole("listitem");

    await userEvent.click(within(first).getByRole("button", { name: "Editar" }));
    await userEvent.click(within(first).getByRole("button", { name: "Cancelar reserva" }));
    await userEvent.click(within(second).getByRole("button", { name: "Excluir" }));

    expect(handlers.onEdit).toHaveBeenCalledWith(upcoming);
    expect(handlers.onCancel).toHaveBeenCalledWith(upcoming);
    expect(handlers.onDelete).toHaveBeenCalledWith(cancelled);
  });
});
