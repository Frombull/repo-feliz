import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("mostra os itens iniciais", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Itens" })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(2);
});

test("cadastra um item e valida o formulário", async ({ page }) => {
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByText("Informe o nome do item")).toBeVisible();

  await page.getByLabel("Nome").fill("Mouse");
  await page.getByLabel("Preço").fill("49.90");
  await page.getByRole("button", { name: "Adicionar" }).click();

  const row = page.getByRole("listitem").filter({ hasText: "Mouse" });
  await expect(row).toContainText("Disponível");
  await expect(page.getByText("Informe o nome do item")).toBeHidden();
  await expect(page.getByLabel("Nome")).toHaveValue("");
});

test("altera a disponibilidade, filtra e remove", async ({ page }) => {
  const teclado = page.getByRole("listitem").filter({ hasText: "Teclado" });
  await teclado.getByRole("button", { name: "Marcar indisponível" }).click();

  await page.getByLabel("Mostrar").selectOption("unavailable");
  await expect(page.getByRole("listitem")).toHaveCount(2);

  await teclado.getByRole("button", { name: "Remover" }).click();
  await expect(teclado).toHaveCount(0);
  await expect(page.getByRole("listitem")).toHaveCount(1);
});
