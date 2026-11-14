import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../../src/App";
import { mockApi } from "../helpers/fakeApi";

const rooms = [
  { id: 1, name: "Sala A", capacity: 10 },
  { id: 2, name: "Sala B", capacity: 4 },
];

describe("App", () => {
  it("começa na aba de reservas e troca de aba", async () => {
    mockApi({ rooms });
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Reserva de Salas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reservas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(await screen.findByRole("heading", { name: "Nova reserva" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salas" }));
    expect(await screen.findByRole("heading", { name: "Cadastrar sala" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salas" })).toHaveAttribute("aria-current", "page");

    await user.click(screen.getByRole("button", { name: "Salas livres" }));
    expect(screen.getByRole("heading", { name: "Buscar salas livres" })).toBeInTheDocument();
  });

  it("uma sala cadastrada na aba Salas já aparece no formulário de reserva", async () => {
    mockApi({ rooms });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Salas" }));
    await user.type(await screen.findByLabelText("Nome"), "Auditório");
    await user.type(screen.getByLabelText("Capacidade"), "80");
    await user.click(screen.getByRole("button", { name: "Adicionar sala" }));
    await screen.findByText("Auditório");

    await user.click(screen.getByRole("button", { name: "Reservas" }));
    await screen.findByRole("button", { name: "Reservar" });

    const options = within(screen.getByLabelText("Sala")).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toContain("Auditório (80 lugares)");
  });

  it("fluxo completo: busca uma sala livre, reserva com o horário já preenchido e vê na lista", async () => {
    mockApi({ rooms });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Salas livres" }));
    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2035-06-01T14:00" } });
    fireEvent.change(screen.getByLabelText("Fim"), { target: { value: "2035-06-01T15:00" } });
    await user.type(screen.getByLabelText("Capacidade mínima"), "8");
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await screen.findByText("Salas livres (1)");

    await user.click(screen.getByRole("button", { name: "Reservar" }));

    // voltou para as reservas, com a sala e o horário da busca no formulário
    await screen.findByRole("heading", { name: "Nova reserva" });
    expect(await screen.findByLabelText("Sala")).toHaveValue("1");
    expect(screen.getByLabelText("Início")).toHaveValue("2035-06-01T14:00");
    expect(screen.getByLabelText("Fim")).toHaveValue("2035-06-01T15:00");

    await user.type(screen.getByLabelText("Título"), "Workshop");
    await user.type(screen.getByLabelText("Responsável"), "Diana");
    await user.type(screen.getByLabelText("Participantes"), "8");
    await user.click(screen.getByRole("button", { name: "Reservar" }));

    const created = await screen.findByText("Workshop");
    expect(created.closest("li")).toHaveTextContent("Sala A · 01/06/2035 14:00 às 15:00");
  });

  it("sair da busca por conta própria deixa o formulário de reserva em branco", async () => {
    mockApi({ rooms });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Salas livres" }));
    fireEvent.change(screen.getByLabelText("Início"), { target: { value: "2035-06-01T14:00" } });
    fireEvent.change(screen.getByLabelText("Fim"), { target: { value: "2035-06-01T15:00" } });
    await user.click(screen.getByRole("button", { name: "Buscar" }));
    await screen.findByText("Salas livres (2)");
    await user.click(screen.getAllByRole("button", { name: "Reservar" })[0]);
    await screen.findByDisplayValue("2035-06-01T14:00");

    await user.click(screen.getByRole("button", { name: "Salas" }));
    await user.click(screen.getByRole("button", { name: "Reservas" }));

    expect(await screen.findByLabelText("Início")).toHaveValue("");
  });
});
