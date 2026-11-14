import { expect, test } from "@playwright/test";

// A API roda de verdade e guarda os itens em memória enquanto estiver no ar, e os testes
// rodam em paralelo. Por isso cada teste cria o próprio item (nome único) e nunca mexe nos
// itens iniciais da API (café, chá e suco).
function uniqueName(prefix) {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function createItem(page, name, price) {
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Preço").fill(price);
  await page.getByRole("button", { name: "Adicionar" }).click();
  return page.getByRole("listitem").filter({ hasText: name });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("lista os itens que vêm da API", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Itens" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "café" })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "suco" })).toBeVisible();
});

test("valida o formulário, cadastra e o item continua depois de recarregar", async ({ page }) => {
  await page.getByRole("button", { name: "Adicionar" }).click();
  await expect(page.getByText("Informe o nome do item")).toBeVisible();

  const name = uniqueName("Mouse");
  const row = await createItem(page, name, "49.90");
  await expect(row).toContainText("Disponível");
  await expect(page.getByText("Informe o nome do item")).toBeHidden();
  await expect(page.getByLabel("Nome")).toHaveValue("");

  // vem da API, não do estado da página
  await page.reload();
  await expect(page.getByRole("listitem").filter({ hasText: name })).toBeVisible();
});

test("altera a disponibilidade, filtra e remove", async ({ page }) => {
  const name = uniqueName("Teclado");
  const row = await createItem(page, name, "150");
  await row.getByRole("button", { name: "Marcar indisponível" }).click();
  await expect(row).toContainText("Indisponível");

  await page.getByLabel("Mostrar").selectOption("unavailable");
  await expect(row).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "café" })).toHaveCount(0);

  await row.getByRole("button", { name: "Remover" }).click();
  await expect(row).toHaveCount(0);

  await page.reload();
  await page.getByLabel("Mostrar").selectOption("unavailable");
  await expect(page.getByRole("listitem").filter({ hasText: name })).toHaveCount(0);
});

test("mostra o erro quando a API está fora do ar e carrega ao tentar de novo", async ({ page }) => {
  await page.route("**/items", (route) => route.abort());
  await page.reload();

  await expect(page.getByRole("alert")).toContainText("Não foi possível conectar à API");

  await page.unroute("**/items");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: "café" })).toBeVisible();
});

test("mostra o erro do cadastro quando a API cai e mantém o formulário", async ({ page }) => {
  await expect(page.getByRole("listitem").filter({ hasText: "café" })).toBeVisible();
  // só o POST cai; o GET da lista e o preflight do CORS passam
  await page.route("**/items", (route) =>
    route.request().method() === "POST" ? route.abort() : route.fallback(),
  );

  const name = uniqueName("Cabo");
  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Preço").fill("10");
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByRole("alert")).toContainText("Não foi possível conectar à API");
  await expect(page.getByLabel("Nome")).toHaveValue(name);
});
