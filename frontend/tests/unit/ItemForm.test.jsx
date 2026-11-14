import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ItemForm } from "../../src/components/ItemForm";

describe("ItemForm", () => {
  it("mostra os erros e não envia quando os campos estão vazios", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ItemForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByText("Informe o nome do item")).toBeInTheDocument();
    expect(screen.getByText("Informe o preço")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("envia os dados convertidos e limpa o formulário", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ItemForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "  Mouse  ");
    await user.type(screen.getByLabelText("Preço"), "49.9");
    await user.click(screen.getByLabelText("Disponível"));
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Mouse", price: 49.9, available: false });
    expect(screen.getByLabelText("Nome")).toHaveValue("");
    expect(screen.getByLabelText("Preço")).toHaveValue(null);
    expect(screen.getByLabelText("Disponível")).toBeChecked();
  });

  it("mostra o erro do envio e mantém os campos preenchidos", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Não foi possível conectar à API"));
    render(<ItemForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.type(screen.getByLabelText("Preço"), "49.9");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível conectar à API");
    expect(screen.getByLabelText("Nome")).toHaveValue("Mouse");
    expect(screen.getByLabelText("Preço")).toHaveValue(49.9);
  });

  it("desabilita o botão enquanto o envio não termina", async () => {
    const user = userEvent.setup();
    let finish;
    const onSubmit = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    render(<ItemForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText("Nome"), "Mouse");
    await user.type(screen.getByLabelText("Preço"), "49.9");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(screen.getByRole("button", { name: "Adicionando..." })).toBeDisabled();

    finish();
    await waitFor(() => expect(screen.getByRole("button", { name: "Adicionar" })).toBeEnabled());
  });
});
