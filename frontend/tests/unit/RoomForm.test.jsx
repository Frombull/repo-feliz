import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RoomForm } from "../../src/components/RoomForm";

async function fill(user, { name, capacity, location }) {
  if (name !== undefined) {
    await user.type(screen.getByLabelText("Nome"), name);
  }
  if (capacity !== undefined) {
    await user.type(screen.getByLabelText("Capacidade"), capacity);
  }
  if (location !== undefined) {
    await user.type(screen.getByLabelText("Localização"), location);
  }
}

describe("RoomForm (cadastro)", () => {
  it("mostra os erros e não envia quando o formulário é inválido", async () => {
    const onSubmit = vi.fn();
    render(<RoomForm onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("button", { name: "Adicionar sala" }));

    expect(screen.getByText("Informe o nome da sala")).toBeInTheDocument();
    expect(screen.getByText("Informe a capacidade")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envia os dados limpos e esvazia o formulário", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    render(<RoomForm onSubmit={onSubmit} />);

    await fill(user, { name: "  Sala A  ", capacity: "10", location: " Bloco 1 " });
    await user.click(screen.getByRole("button", { name: "Adicionar sala" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Sala A", capacity: 10, location: "Bloco 1" });
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Capacidade")).toHaveValue(null);
  });

  it("envia location null quando a localização fica em branco", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    render(<RoomForm onSubmit={onSubmit} />);

    await fill(user, { name: "Sala A", capacity: "4" });
    await user.click(screen.getByRole("button", { name: "Adicionar sala" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Sala A", capacity: 4, location: null });
  });

  it("mostra o erro da API e mantém os campos preenchidos", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Já existe uma sala com esse nome"));
    render(<RoomForm onSubmit={onSubmit} />);

    await fill(user, { name: "Sala A", capacity: "10" });
    await user.click(screen.getByRole("button", { name: "Adicionar sala" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe uma sala com esse nome");
    expect(screen.getByLabelText("Nome")).toHaveValue("Sala A");
    expect(screen.getByLabelText("Capacidade")).toHaveValue(10);
  });

  it("desabilita o botão enquanto envia", async () => {
    const user = userEvent.setup();
    let finish;
    const onSubmit = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<RoomForm onSubmit={onSubmit} />);

    await fill(user, { name: "Sala A", capacity: "10" });
    await user.click(screen.getByRole("button", { name: "Adicionar sala" }));

    expect(screen.getByRole("button", { name: "Adicionar sala" })).toBeDisabled();
    finish();
    expect(await screen.findByLabelText("Nome")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Adicionar sala" })).toBeEnabled();
  });
});

describe("RoomForm (edição)", () => {
  const room = { id: 7, name: "Sala B", capacity: 6, location: "Bloco 2", active: true };

  it("vem preenchido com a sala e mostra o botão de cancelar", async () => {
    const onCancel = vi.fn();
    render(<RoomForm room={room} onSubmit={vi.fn()} onCancel={onCancel} />);

    expect(screen.getByLabelText("Nome")).toHaveValue("Sala B");
    expect(screen.getByLabelText("Capacidade")).toHaveValue(6);
    expect(screen.getByLabelText("Localização")).toHaveValue("Bloco 2");

    await userEvent.click(screen.getByRole("button", { name: "Cancelar edição" }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("envia as alterações e mantém os valores", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue();
    render(<RoomForm room={room} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.clear(screen.getByLabelText("Capacidade"));
    await user.type(screen.getByLabelText("Capacidade"), "12");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Sala B", capacity: 12, location: "Bloco 2" });
    expect(screen.getByLabelText("Nome")).toHaveValue("Sala B");
  });

  it("aceita sala sem localização", () => {
    render(<RoomForm room={{ ...room, location: null }} onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Localização")).toHaveValue("");
  });
});
