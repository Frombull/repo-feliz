import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AvailabilityPage } from "../../src/pages/AvailabilityPage";
import { mockApi, mockApiOffline } from "../helpers/fakeApi";

const rooms = [
  { id: 1, name: "Pequena", capacity: 2 },
  { id: 2, name: "Livre", capacity: 10, location: "Bloco 1" },
  { id: 3, name: "Ocupada", capacity: 10 },
  { id: 4, name: "Inativa", capacity: 10, active: false },
];

const bookings = [
  {
    id: 1,
    room_id: 3,
    title: "Daily",
    requester: "Ana",
    attendees: 3,
    start_at: "2035-05-10T09:00:00",
    end_at: "2035-05-10T10:00:00",
  },
];

function setDateTime(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function search(user, { start = "2035-05-10T09:30", end = "2035-05-10T10:30", min } = {}) {
  setDateTime("Início", start);
  setDateTime("Fim", end);
  if (min) {
    await user.type(screen.getByLabelText("Capacidade mínima"), min);
  }
  await user.click(screen.getByRole("button", { name: "Buscar" }));
}

describe("AvailabilityPage", () => {
  it("lista só as salas ativas e livres no período, convertendo os parâmetros da API", async () => {
    const api = mockApi({ rooms, bookings });
    const user = userEvent.setup();
    render(<AvailabilityPage onReserve={vi.fn()} />);

    await search(user);

    expect(await screen.findByText("Salas livres (2)")).toBeInTheDocument();
    const names = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(names[0]).toContain("Pequena");
    expect(names[1]).toContain("Livre");
    expect(screen.queryByText("Ocupada")).not.toBeInTheDocument();
    expect(screen.queryByText("Inativa")).not.toBeInTheDocument();
    expect(screen.getByText("10/05/2035 09:30 às 10:30")).toBeInTheDocument();
    expect(api.requests().at(-1)).toMatchObject({
      path: "/rooms/available",
      query: { start_at: "2035-05-10T09:30", end_at: "2035-05-10T10:30" },
    });
  });

  it("usa a capacidade mínima", async () => {
    const api = mockApi({ rooms, bookings });
    const user = userEvent.setup();
    render(<AvailabilityPage onReserve={vi.fn()} />);

    await search(user, { min: "5" });

    expect(await screen.findByText("Salas livres (1)")).toBeInTheDocument();
    expect(screen.queryByText("Pequena")).not.toBeInTheDocument();
    expect(api.requests().at(-1).query.min_capacity).toBe("5");
  });

  it("avisa quando nenhuma sala está livre", async () => {
    mockApi({ rooms, bookings });
    const user = userEvent.setup();
    render(<AvailabilityPage onReserve={vi.fn()} />);

    await search(user, { min: "50" });

    expect(await screen.findByText("Nenhuma sala livre nesse horário.")).toBeInTheDocument();
  });

  it("valida o período antes de chamar a API", async () => {
    const api = mockApi({ rooms });
    const user = userEvent.setup();
    render(<AvailabilityPage onReserve={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Buscar" }));
    expect(screen.getByText("Informe o início")).toBeInTheDocument();
    expect(screen.getByText("Informe o fim")).toBeInTheDocument();

    await search(user, { start: "2035-05-10T10:00", end: "2035-05-10T09:00" });
    expect(screen.getByText("O fim deve ser depois do início")).toBeInTheDocument();
    expect(api.requests()).toHaveLength(0);
  });

  it("mostra o erro quando a API está fora do ar", async () => {
    mockApiOffline();
    const user = userEvent.setup();
    render(<AvailabilityPage onReserve={vi.fn()} />);

    await search(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar à API");
    expect(screen.queryByText(/Salas livres/)).not.toBeInTheDocument();
  });

  it("entrega a sala e o período buscados ao reservar", async () => {
    mockApi({ rooms, bookings });
    const onReserve = vi.fn();
    const user = userEvent.setup();
    render(<AvailabilityPage onReserve={onReserve} />);
    await search(user);
    await screen.findByText("Salas livres (2)");

    // mudar o formulário depois da busca não muda o horário da reserva
    setDateTime("Início", "2035-12-01T08:00");
    const livre = screen.getAllByRole("listitem").find((li) => li.textContent.includes("Livre"));
    await user.click(within(livre).getByRole("button", { name: "Reservar" }));

    expect(onReserve).toHaveBeenCalledWith({
      roomId: 2,
      startAt: "2035-05-10T09:30",
      endAt: "2035-05-10T10:30",
    });
  });
});
