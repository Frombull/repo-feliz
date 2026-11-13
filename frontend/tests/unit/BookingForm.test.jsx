import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BookingForm } from "../../src/components/BookingForm";

const rooms = [
  { id: 1, name: "Sala A", capacity: 10, active: true },
  { id: 2, name: "Sala B", capacity: 4, active: true },
  { id: 3, name: "Sala C", capacity: 8, active: false },
];

function setDateTime(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function fillValid(user) {
  await user.selectOptions(screen.getByLabelText("Sala"), "1");
  await user.type(screen.getByLabelText("Título"), "  Planejamento ");
  await user.type(screen.getByLabelText("Responsável"), "Ana");
  await user.type(screen.getByLabelText("Participantes"), "5");
  setDateTime("Início", "2035-05-10T09:00");
  setDateTime("Fim", "2035-05-10T10:00");
}

describe("BookingForm (criação)", () => {
  it("lista só as salas ativas", () => {
    render(<BookingForm rooms={rooms} onSubmit={vi.fn()} />);

    const options = within(screen.getByLabelText("Sala")).getAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "Escolha a sala",
      "Sala A (10 lugares)",
      "Sala B (4 lugares)",
    ]);
  });

  it("mostra os erros e não envia quando o formulário é inválido", async () => {
    const onSubmit = vi.fn();
    render(<BookingForm rooms={rooms} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "Reservar" }));

    expect(screen.getByText("Selecione uma sala")).toBeInTheDocument();
    expect(screen.getByText("Informe o título")).toBeInTheDocument();
    expect(screen.getByText("Informe o responsável")).toBeInTheDocument();
    expect(screen.getByText("Informe os participantes")).toBeInTheDocument();
    expect(screen.getByText("Informe o início")).toBeInTheDocument();
    expect(screen.getByText("Informe o fim")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("avisa quando o fim não é depois do início", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<BookingForm rooms={rooms} onSubmit={onSubmit} />);

    await fillValid(user);
    setDateTime("Fim", "2035-05-10T08:00");
    await user.click(screen.getByRole("button", { name: "Reservar" }));

    expect(screen.getByText("O fim deve ser depois do início")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envia o corpo no formato da API e esvazia o formulário", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    render(<BookingForm rooms={rooms} onSubmit={onSubmit} />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Reservar" }));

    expect(onSubmit).toHaveBeenCalledWith({
      room_id: 1,
      title: "Planejamento",
      requester: "Ana",
      attendees: 5,
      start_at: "2035-05-10T09:00",
      end_at: "2035-05-10T10:00",
    });
    expect(screen.getByLabelText("Título")).toHaveValue("");
    expect(screen.getByLabelText("Sala")).toHaveValue("");
    expect(screen.getByLabelText("Início")).toHaveValue("");
  });

  it("mostra o erro da API e mantém os campos preenchidos", async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new Error("A sala já está reservada das 09:00 às 10:00 (Daily)"));
    render(<BookingForm rooms={rooms} onSubmit={onSubmit} />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Reservar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("A sala já está reservada");
    expect(screen.getByLabelText("Título")).toHaveValue("  Planejamento ");
    expect(screen.getByLabelText("Início")).toHaveValue("2035-05-10T09:00");
  });

  it("vem preenchido com a sala e o horário escolhidos na busca de salas livres", () => {
    const draft = { roomId: 2, startAt: "2035-05-10T14:00", endAt: "2035-05-10T15:00" };
    render(<BookingForm rooms={rooms} draft={draft} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Sala")).toHaveValue("2");
    expect(screen.getByLabelText("Início")).toHaveValue("2035-05-10T14:00");
    expect(screen.getByLabelText("Fim")).toHaveValue("2035-05-10T15:00");
    expect(screen.getByLabelText("Título")).toHaveValue("");
  });
});

describe("BookingForm (edição)", () => {
  const booking = {
    id: 9,
    room_id: 3,
    title: "Retrospectiva",
    requester: "Beto",
    attendees: 6,
    start_at: "2035-05-10T09:00:00",
    end_at: "2035-05-10T10:30:00",
    status: "confirmed",
  };

  it("vem preenchido e mantém a sala atual mesmo se ela estiver inativa", () => {
    render(<BookingForm rooms={rooms} booking={booking} onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText("Sala")).toHaveValue("3");
    expect(screen.getByLabelText("Título")).toHaveValue("Retrospectiva");
    expect(screen.getByLabelText("Responsável")).toHaveValue("Beto");
    expect(screen.getByLabelText("Participantes")).toHaveValue(6);
    expect(screen.getByLabelText("Início")).toHaveValue("2035-05-10T09:00");
    expect(screen.getByLabelText("Fim")).toHaveValue("2035-05-10T10:30");
  });

  it("envia as alterações e permite cancelar a edição", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    const onCancel = vi.fn();
    render(<BookingForm rooms={rooms} booking={booking} onSubmit={onSubmit} onCancel={onCancel} />);

    await user.clear(screen.getByLabelText("Título"));
    await user.type(screen.getByLabelText("Título"), "Retro do time");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onSubmit).toHaveBeenCalledWith({
      room_id: 3,
      title: "Retro do time",
      requester: "Beto",
      attendees: 6,
      start_at: "2035-05-10T09:00",
      end_at: "2035-05-10T10:30",
    });

    await user.click(screen.getByRole("button", { name: "Cancelar edição" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
