import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoomsPage } from "../../src/pages/RoomsPage";
import { mockApi, mockApiOffline } from "../helpers/fakeApi";

const initialRooms = [
  { id: 1, name: "Sala A", capacity: 10, location: "Bloco 1" },
  { id: 2, name: "Sala B", capacity: 4, active: false },
];

function row(name) {
  return screen.getAllByRole("listitem").find((item) => item.textContent.includes(name));
}

beforeEach(() => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RoomsPage", () => {
  it("mostra o carregando e depois as salas que vêm da API", async () => {
    mockApi({ rooms: initialRooms });
    render(<RoomsPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Carregando salas...");
    expect(await screen.findByText("Sala A")).toBeInTheDocument();
    expect(screen.getByText("Sala B")).toBeInTheDocument();
    expect(screen.getByText("Salas (2)")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("mostra o erro quando a API está fora do ar e carrega ao tentar de novo", async () => {
    mockApiOffline();
    render(<RoomsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar à API");

    mockApi({ rooms: initialRooms });
    await userEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    expect(await screen.findByText("Sala A")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("cadastra uma sala pela API e ela aparece na lista", async () => {
    const api = mockApi({ rooms: initialRooms });
    const user = userEvent.setup();
    render(<RoomsPage />);
    await screen.findByText("Sala A");

    await user.type(screen.getByLabelText("Nome"), "Auditório");
    await user.type(screen.getByLabelText("Capacidade"), "80");
    await user.type(screen.getByLabelText("Localização"), "Prédio 2");
    await user.click(screen.getByRole("button", { name: "Adicionar sala" }));

    expect(await screen.findByText("Auditório")).toBeInTheDocument();
    expect(screen.getByText("Salas (3)")).toBeInTheDocument();
    expect(api.requests()).toContainEqual({
      method: "POST",
      path: "/rooms",
      query: {},
      body: { name: "Auditório", capacity: 80, location: "Prédio 2" },
    });
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("mostra o erro de nome repetido no formulário e mantém os campos", async () => {
    mockApi({ rooms: initialRooms });
    const user = userEvent.setup();
    render(<RoomsPage />);
    await screen.findByText("Sala A");

    await user.type(screen.getByLabelText("Nome"), "sala a");
    await user.type(screen.getByLabelText("Capacidade"), "5");
    await user.click(screen.getByRole("button", { name: "Adicionar sala" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe uma sala com esse nome");
    expect(screen.getByLabelText("Nome")).toHaveValue("sala a");
    expect(screen.getByText("Salas (2)")).toBeInTheDocument();
  });

  it("não chama a API quando o formulário é inválido", async () => {
    const api = mockApi({ rooms: initialRooms });
    render(<RoomsPage />);
    await screen.findByText("Sala A");

    await userEvent.click(screen.getByRole("button", { name: "Adicionar sala" }));

    expect(screen.getByText("Informe o nome da sala")).toBeInTheDocument();
    expect(api.requests().filter((r) => r.method === "POST")).toHaveLength(0);
  });

  it("filtra pelas salas ativas e inativas usando o parâmetro da API", async () => {
    const api = mockApi({ rooms: initialRooms });
    const user = userEvent.setup();
    render(<RoomsPage />);
    await screen.findByText("Sala A");

    await user.selectOptions(screen.getByLabelText("Mostrar"), "active");
    await waitFor(() => expect(screen.queryByText("Sala B")).not.toBeInTheDocument());
    expect(screen.getByText("Sala A")).toBeInTheDocument();
    expect(api.requests().at(-1).query).toEqual({ active: "true" });

    await user.selectOptions(screen.getByLabelText("Mostrar"), "inactive");
    expect(await screen.findByText("Sala B")).toBeInTheDocument();
    expect(screen.queryByText("Sala A")).not.toBeInTheDocument();
    expect(api.requests().at(-1).query).toEqual({ active: "false" });
  });

  it("desativa e ativa uma sala com PATCH", async () => {
    const api = mockApi({ rooms: initialRooms });
    const user = userEvent.setup();
    render(<RoomsPage />);
    await screen.findByText("Sala A");

    await user.click(within(row("Sala A")).getByRole("button", { name: "Desativar" }));
    await waitFor(() => expect(row("Sala A")).toHaveTextContent("Inativa"));
    expect(api.requests()).toContainEqual({
      method: "PATCH",
      path: "/rooms/1",
      query: {},
      body: { active: false },
    });

    await user.click(within(row("Sala B")).getByRole("button", { name: "Ativar" }));
    expect(await within(row("Sala B")).findByRole("button", { name: "Desativar" })).toBeVisible();
  });

  it("mostra o erro da API ao desativar uma sala com reservas", async () => {
    mockApi({
      rooms: initialRooms,
      bookings: [
        {
          id: 1,
          room_id: 1,
          title: "Daily",
          requester: "Ana",
          attendees: 3,
          start_at: "2030-05-10T09:00:00",
          end_at: "2030-05-10T10:00:00",
        },
      ],
    });
    const user = userEvent.setup();
    render(<RoomsPage />);
    await screen.findByText("Sala A");

    await user.click(within(row("Sala A")).getByRole("button", { name: "Desativar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("reservas confirmadas");
    expect(within(row("Sala A")).getByRole("button", { name: "Desativar" })).toBeVisible();
  });

  it("edita uma sala: carrega no formulário, salva e volta ao cadastro", async () => {
    const api = mockApi({ rooms: initialRooms });
    const user = userEvent.setup();
    render(<RoomsPage />);
    await screen.findByText("Sala A");

    await user.click(within(row("Sala A")).getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("heading", { name: "Editar sala" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("Sala A");

    await user.clear(screen.getByLabelText("Capacidade"));
    await user.type(screen.getByLabelText("Capacidade"), "20");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(row("Sala A")).toHaveTextContent("20 lugares"));
    expect(screen.getByRole("heading", { name: "Cadastrar sala" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(api.requests()).toContainEqual({
      method: "PATCH",
      path: "/rooms/1",
      query: {},
      body: { name: "Sala A", capacity: 20, location: "Bloco 1" },
    });
  });

  it("cancelar a edição volta ao formulário de cadastro", async () => {
    mockApi({ rooms: initialRooms });
    const user = userEvent.setup();
    render(<RoomsPage />);
    await screen.findByText("Sala A");

    await user.click(within(row("Sala A")).getByRole("button", { name: "Editar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar edição" }));

    expect(screen.getByRole("heading", { name: "Cadastrar sala" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toHaveValue("");
  });

  it("exclui a sala depois da confirmação", async () => {
    const api = mockApi({ rooms: initialRooms });
    const user = userEvent.setup();
    render(<RoomsPage />);
    await screen.findByText("Sala A");

    await user.click(within(row("Sala B")).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(screen.queryByText("Sala B")).not.toBeInTheDocument());
    expect(window.confirm).toHaveBeenCalledWith('Excluir a sala "Sala B"?');
    expect(api.requests()).toContainEqual({
      method: "DELETE",
      path: "/rooms/2",
      query: {},
      body: undefined,
    });
  });

  it("não exclui quando a confirmação é recusada", async () => {
    window.confirm.mockReturnValue(false);
    const api = mockApi({ rooms: initialRooms });
    const user = userEvent.setup();
    render(<RoomsPage />);
    await screen.findByText("Sala A");

    await user.click(within(row("Sala B")).getByRole("button", { name: "Excluir" }));

    expect(screen.getByText("Sala B")).toBeInTheDocument();
    expect(api.requests().filter((r) => r.method === "DELETE")).toHaveLength(0);
  });

  it("mostra o erro da API ao excluir uma sala que já tem reservas", async () => {
    mockApi({
      rooms: initialRooms,
      bookings: [
        {
          id: 1,
          room_id: 2,
          title: "Daily",
          requester: "Ana",
          attendees: 3,
          start_at: "2030-05-10T09:00:00",
          end_at: "2030-05-10T10:00:00",
          status: "cancelled",
        },
      ],
    });
    const user = userEvent.setup();
    render(<RoomsPage />);
    await screen.findByText("Sala B");

    await user.click(within(row("Sala B")).getByRole("button", { name: "Excluir" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("já tem reservas");
    expect(screen.getByText("Sala B")).toBeInTheDocument();
  });
});
