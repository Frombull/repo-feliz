import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingsPage } from "../../src/pages/BookingsPage";
import { mockApi, mockApiOffline } from "../helpers/fakeApi";

const rooms = [
  { id: 1, name: "Sala A", capacity: 10 },
  { id: 2, name: "Sala B", capacity: 4 },
  { id: 3, name: "Sala C", capacity: 8, active: false },
];

const booking = (id, extra) => ({
  id,
  room_id: 1,
  title: `Reserva ${id}`,
  requester: "Ana",
  attendees: 3,
  start_at: "2035-05-10T09:00:00",
  end_at: "2035-05-10T10:00:00",
  ...extra,
});

function item(title) {
  return screen.getAllByRole("listitem").find((li) => li.textContent.includes(title));
}

async function fillForm(user, { room = "1", title = "Planejamento", attendees = "5" } = {}) {
  await user.selectOptions(screen.getByLabelText("Sala"), room);
  await user.type(screen.getByLabelText("Título"), title);
  await user.type(screen.getByLabelText("Responsável"), "Carla");
  await user.type(screen.getByLabelText("Participantes"), attendees);
  fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2035-06-01T14:00" } });
  fireEvent.change(screen.getByLabelText("Fim"), { target: { value: "2035-06-01T15:00" } });
}

beforeEach(() => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BookingsPage", () => {
  it("mostra o carregando e depois as reservas, com o nome da sala", async () => {
    mockApi({ rooms, bookings: [booking(1), booking(2, { room_id: 2 })] });
    render(<BookingsPage />);

    expect(screen.getAllByRole("status")[0]).toHaveTextContent("Carregando");
    expect(await screen.findByText("Reserva 1")).toBeInTheDocument();
    expect(item("Reserva 1")).toHaveTextContent("Sala A");
    expect(item("Reserva 2")).toHaveTextContent("Sala B");
    expect(screen.getByText("Reservas (2)")).toBeInTheDocument();
  });

  it("mostra o erro quando a API está fora do ar e carrega ao tentar de novo", async () => {
    mockApiOffline();
    render(<BookingsPage />);

    // as salas (formulário) e as reservas (lista) falham e podem ser tentadas separadamente
    const alerts = await screen.findAllByRole("alert");
    expect(alerts).toHaveLength(2);
    expect(alerts[0]).toHaveTextContent("Não foi possível conectar à API");

    mockApi({ rooms, bookings: [booking(1)] });
    await userEvent.click(screen.getAllByRole("button", { name: "Tentar novamente" })[0]);
    // enquanto as salas recarregam a lista também espera; o segundo botão volta depois
    await userEvent.click(await screen.findByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Reserva 1")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("avisa quando não há salas ativas para reservar", async () => {
    mockApi({ rooms: [{ id: 3, name: "Sala C", capacity: 8, active: false }] });
    render(<BookingsPage />);

    expect(await screen.findByText(/Não há salas ativas/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reservar" })).not.toBeInTheDocument();
  });

  it("só oferece salas ativas no formulário", async () => {
    mockApi({ rooms });
    render(<BookingsPage />);
    await screen.findByRole("button", { name: "Reservar" });

    const options = within(screen.getByLabelText("Sala")).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "Escolha a sala",
      "Sala A (10 lugares)",
      "Sala B (4 lugares)",
    ]);
  });

  it("cria uma reserva pela API e ela aparece na lista", async () => {
    const api = mockApi({ rooms, bookings: [booking(1)] });
    const user = userEvent.setup();
    render(<BookingsPage />);
    await screen.findByText("Reserva 1");

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Reservar" }));

    expect(await screen.findByText("Planejamento")).toBeInTheDocument();
    expect(item("Planejamento")).toHaveTextContent("01/06/2035 14:00 às 15:00");
    expect(item("Planejamento")).toHaveTextContent("Confirmada");
    expect(screen.getByText("Reservas (2)")).toBeInTheDocument();
    expect(api.requests()).toContainEqual({
      method: "POST",
      path: "/bookings",
      query: {},
      body: {
        room_id: 1,
        title: "Planejamento",
        requester: "Carla",
        attendees: 5,
        start_at: "2035-06-01T14:00",
        end_at: "2035-06-01T15:00",
      },
    });
    expect(screen.getByLabelText("Título")).toHaveValue("");
  });

  it("mostra o conflito de horário vindo da API e mantém o formulário", async () => {
    mockApi({
      rooms,
      bookings: [
        booking(1, {
          title: "Daily",
          start_at: "2035-06-01T14:00:00",
          end_at: "2035-06-01T15:00:00",
        }),
      ],
    });
    const user = userEvent.setup();
    render(<BookingsPage />);
    await screen.findByText("Daily");

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Reservar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A sala já está reservada das 14:00 às 15:00 (Daily)",
    );
    expect(screen.getByLabelText("Título")).toHaveValue("Planejamento");
    expect(screen.getByText("Reservas (1)")).toBeInTheDocument();
  });

  it("mostra o erro de capacidade vindo da API", async () => {
    mockApi({ rooms });
    const user = userEvent.setup();
    render(<BookingsPage />);
    await screen.findByRole("button", { name: "Reservar" });

    await fillForm(user, { room: "2", attendees: "9" });
    await user.click(screen.getByRole("button", { name: "Reservar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A sala comporta 4 pessoas");
  });

  it("não chama a API quando o formulário é inválido", async () => {
    const api = mockApi({ rooms });
    render(<BookingsPage />);
    await screen.findByRole("button", { name: "Reservar" });

    await userEvent.click(screen.getByRole("button", { name: "Reservar" }));

    expect(screen.getByText("Informe o título")).toBeInTheDocument();
    expect(api.requests().filter((r) => r.method === "POST")).toHaveLength(0);
  });

  it("filtra por sala, situação e data usando os parâmetros da API", async () => {
    const api = mockApi({
      rooms,
      bookings: [
        booking(1),
        booking(2, { room_id: 2 }),
        booking(3, {
          status: "cancelled",
          start_at: "2035-05-11T09:00:00",
          end_at: "2035-05-11T10:00:00",
        }),
      ],
    });
    const user = userEvent.setup();
    render(<BookingsPage />);
    await screen.findByText("Reserva 1");

    await user.selectOptions(screen.getByLabelText("Filtrar por sala"), "2");
    await waitFor(() => expect(screen.queryByText("Reserva 1")).not.toBeInTheDocument());
    expect(screen.getByText("Reserva 2")).toBeInTheDocument();
    expect(api.requests().at(-1).query).toEqual({ room_id: "2" });

    await user.selectOptions(screen.getByLabelText("Filtrar por sala"), "");
    await user.selectOptions(screen.getByLabelText("Situação"), "cancelled");
    await waitFor(() => expect(screen.queryByText("Reserva 2")).not.toBeInTheDocument());
    expect(screen.getByText("Reserva 3")).toBeInTheDocument();
    expect(api.requests().at(-1).query).toEqual({ status: "cancelled" });

    await user.selectOptions(screen.getByLabelText("Situação"), "");
    fireEvent.change(screen.getByLabelText("Data"), { target: { value: "2035-05-10" } });
    await waitFor(() => expect(screen.queryByText("Reserva 3")).not.toBeInTheDocument());
    expect(screen.getByText("Reserva 1")).toBeInTheDocument();
    expect(api.requests().at(-1).query).toEqual({ date: "2035-05-10" });
  });

  it("cancela uma reserva depois da confirmação", async () => {
    const api = mockApi({ rooms, bookings: [booking(1)] });
    const user = userEvent.setup();
    render(<BookingsPage />);
    await screen.findByText("Reserva 1");

    await user.click(within(item("Reserva 1")).getByRole("button", { name: "Cancelar reserva" }));

    await waitFor(() => expect(item("Reserva 1")).toHaveTextContent("Cancelada"));
    expect(window.confirm).toHaveBeenCalledWith('Cancelar a reserva "Reserva 1"?');
    expect(api.requests()).toContainEqual({
      method: "POST",
      path: "/bookings/1/cancel",
      query: {},
      body: undefined,
    });
    expect(
      within(item("Reserva 1")).queryByRole("button", { name: "Cancelar reserva" }),
    ).not.toBeInTheDocument();
  });

  it("não cancela quando a confirmação é recusada", async () => {
    window.confirm.mockReturnValue(false);
    const api = mockApi({ rooms, bookings: [booking(1)] });
    const user = userEvent.setup();
    render(<BookingsPage />);
    await screen.findByText("Reserva 1");

    await user.click(within(item("Reserva 1")).getByRole("button", { name: "Cancelar reserva" }));

    expect(item("Reserva 1")).toHaveTextContent("Confirmada");
    expect(api.requests().filter((r) => r.method === "POST")).toHaveLength(0);
  });

  it("exclui reservas canceladas e passadas, e esconde o botão das ativas", async () => {
    const api = mockApi({
      rooms,
      bookings: [
        booking(1),
        booking(2, { status: "cancelled" }),
        booking(3, { start_at: "2020-05-10T09:00:00", end_at: "2020-05-10T10:00:00" }),
      ],
    });
    const user = userEvent.setup();
    render(<BookingsPage />);
    await screen.findByText("Reserva 1");

    expect(within(item("Reserva 1")).queryByRole("button", { name: "Excluir" })).toBeNull();
    await user.click(within(item("Reserva 2")).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(screen.queryByText("Reserva 2")).not.toBeInTheDocument());
    expect(api.requests()).toContainEqual({
      method: "DELETE",
      path: "/bookings/2",
      query: {},
      body: undefined,
    });
    expect(within(item("Reserva 3")).getByRole("button", { name: "Excluir" })).toBeVisible();
  });

  it("mostra o erro da API ao excluir quando a regra do backend recusa", async () => {
    // reserva passada no relógio do navegador, mas ainda confirmada para o fake
    mockApi({
      rooms,
      bookings: [booking(3, { start_at: "2020-05-10T09:00:00", end_at: "2020-05-10T10:00:00" })],
    });
    const user = userEvent.setup();
    render(<BookingsPage />);
    await screen.findByText("Reserva 3");

    await user.click(within(item("Reserva 3")).getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cancele a reserva antes de excluí-la",
    );
    expect(screen.getByText("Reserva 3")).toBeInTheDocument();
  });

  it("edita uma reserva: carrega no formulário, salva e volta ao cadastro", async () => {
    const api = mockApi({ rooms, bookings: [booking(1)] });
    const user = userEvent.setup();
    render(<BookingsPage />);
    await screen.findByText("Reserva 1");

    await user.click(within(item("Reserva 1")).getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("heading", { name: "Editar reserva" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título")).toHaveValue("Reserva 1");
    expect(screen.getByLabelText("Início")).toHaveValue("2035-05-10T09:00");

    await user.clear(screen.getByLabelText("Título"));
    await user.type(screen.getByLabelText("Título"), "Reunião do time");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Reunião do time")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Nova reserva" })).toBeInTheDocument();
    expect(api.requests()).toContainEqual({
      method: "PATCH",
      path: "/bookings/1",
      query: {},
      body: {
        room_id: 1,
        title: "Reunião do time",
        requester: "Ana",
        attendees: 3,
        start_at: "2035-05-10T09:00",
        end_at: "2035-05-10T10:00",
      },
    });
  });

  it("mostra o conflito ao remarcar por cima de outra reserva", async () => {
    mockApi({
      rooms,
      bookings: [
        booking(1),
        booking(2, { start_at: "2035-05-10T11:00:00", end_at: "2035-05-10T12:00:00" }),
      ],
    });
    const user = userEvent.setup();
    render(<BookingsPage />);
    await screen.findByText("Reserva 2");

    await user.click(within(item("Reserva 2")).getByRole("button", { name: "Editar" }));
    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2035-05-10T09:30" } });
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A sala já está reservada");
    expect(screen.getByRole("heading", { name: "Editar reserva" })).toBeInTheDocument();
  });

  it("abre o formulário já preenchido com a sala e o horário da busca", async () => {
    mockApi({ rooms });
    const draft = { roomId: 2, startAt: "2035-06-01T14:00", endAt: "2035-06-01T15:00" };
    render(<BookingsPage draft={draft} />);
    await screen.findByRole("button", { name: "Reservar" });

    expect(screen.getByLabelText("Sala")).toHaveValue("2");
    expect(screen.getByLabelText("Início")).toHaveValue("2035-06-01T14:00");
    expect(screen.getByLabelText("Fim")).toHaveValue("2035-06-01T15:00");
  });
});
