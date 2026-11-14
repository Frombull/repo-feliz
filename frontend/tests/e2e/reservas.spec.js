import { expect, test } from "@playwright/test";

// Sem nenhum mock: o navegador fala com o frontend (Vite), que fala com a API (FastAPI),
// que grava no PostgreSQL. O banco guarda os dados entre as execuções e os testes rodam em
// paralelo, então cada teste cria as próprias salas (nome único) e só mexe nelas.
const API = "http://localhost:8000";
const DAY = "2040-05-10";

function unique(prefix) {
  return `${prefix} ${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

async function createRoomViaApi(request, name, capacity = 10) {
  const response = await request.post(`${API}/rooms`, { data: { name, capacity } });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function createBookingViaApi(request, room, title, start = "09:00", end = "10:00") {
  const response = await request.post(`${API}/bookings`, {
    data: {
      room_id: room.id,
      title,
      requester: "Ana",
      attendees: 3,
      start_at: `${DAY}T${start}`,
      end_at: `${DAY}T${end}`,
    },
  });
  expect(response.ok()).toBeTruthy();
  return response.json();
}

async function openTab(page, name) {
  await page.getByRole("button", { name, exact: true }).click();
}

async function fillBooking(page, { room, title, attendees = "3", start = "09:00", end = "10:00" }) {
  await page.getByLabel("Sala", { exact: true }).selectOption(String(room.id));
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Responsável").fill("Carla");
  await page.getByLabel("Participantes").fill(attendees);
  await page.getByLabel("Início").fill(`${DAY}T${start}`);
  await page.getByLabel("Fim").fill(`${DAY}T${end}`);
}

// a lista de reservas mostra tudo o que já existe no banco; filtra pela sala do teste
async function filterBookingsByRoom(page, room) {
  await page.getByLabel("Filtrar por sala").selectOption(String(room.id));
}

function row(page, text) {
  return page.getByRole("listitem").filter({ hasText: text });
}

test.beforeEach(async ({ page }) => {
  // as confirmações de cancelar e excluir
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/");
});

test("cadastra uma sala, recusa nome repetido e a sala continua depois de recarregar", async ({
  page,
}) => {
  const name = unique("Sala Azul");
  await openTab(page, "Salas");

  await page.getByRole("button", { name: "Adicionar sala" }).click();
  await expect(page.getByText("Informe o nome da sala")).toBeVisible();

  await page.getByLabel("Nome").fill(name);
  await page.getByLabel("Capacidade").fill("12");
  await page.getByLabel("Localização").fill("Bloco 3");
  await page.getByRole("button", { name: "Adicionar sala" }).click();
  await expect(row(page, name)).toContainText("12 lugares · Bloco 3");
  await expect(page.getByLabel("Nome")).toHaveValue("");

  // o nome é único, sem diferenciar maiúsculas
  await page.getByLabel("Nome").fill(name.toUpperCase());
  await page.getByLabel("Capacidade").fill("5");
  await page.getByRole("button", { name: "Adicionar sala" }).click();
  await expect(page.getByRole("alert")).toContainText("Já existe uma sala com esse nome");

  // vem do banco, não do estado da página
  await page.reload();
  await openTab(page, "Salas");
  await expect(row(page, name)).toBeVisible();
});

test("edita, desativa e ativa uma sala", async ({ page, request }) => {
  const name = unique("Sala Verde");
  await createRoomViaApi(request, name, 8);
  await openTab(page, "Salas");

  await row(page, name).getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Capacidade").fill("20");
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(row(page, name)).toContainText("20 lugares");

  await row(page, name).getByRole("button", { name: "Desativar" }).click();
  await expect(row(page, name)).toContainText("Inativa");

  await row(page, name).getByRole("button", { name: "Ativar" }).click();
  await expect(row(page, name)).toContainText("Ativa");
});

test("reserva uma sala e a reserva continua depois de recarregar", async ({ page, request }) => {
  const room = await createRoomViaApi(request, unique("Sala Rosa"));
  const title = unique("Planejamento");

  await page.getByRole("button", { name: "Reservar" }).click();
  await expect(page.getByText("Selecione uma sala")).toBeVisible();

  // recarrega para o formulário enxergar a sala criada pela API
  await page.reload();
  await fillBooking(page, { room, title });
  await page.getByRole("button", { name: "Reservar" }).click();

  await filterBookingsByRoom(page, room);
  await expect(row(page, title)).toContainText("10/05/2040 09:00 às 10:00");
  await expect(row(page, title)).toContainText("Confirmada");
  await expect(page.getByLabel("Título")).toHaveValue("");

  // vem do banco, não do estado da página
  await page.reload();
  await filterBookingsByRoom(page, room);
  await expect(row(page, title)).toContainText("Confirmada");
});

test("recusa reserva em conflito ou acima da capacidade e mostra o motivo", async ({
  page,
  request,
}) => {
  const room = await createRoomViaApi(request, unique("Sala Cinza"), 4);
  await createBookingViaApi(request, room, "Daily", "09:00", "10:00");
  await page.reload();
  const title = unique("Revisão");

  await fillBooking(page, { room, title, start: "09:30", end: "10:30" });
  await page.getByRole("button", { name: "Reservar" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "A sala já está reservada das 09:00 às 10:00 (Daily)",
  );
  await expect(page.getByLabel("Título")).toHaveValue(title);

  await page.getByLabel("Participantes").fill("9");
  await page.getByLabel("Início").fill(`${DAY}T10:00`);
  await page.getByLabel("Fim").fill(`${DAY}T11:00`);
  await page.getByRole("button", { name: "Reservar" }).click();
  await expect(page.getByRole("alert")).toContainText("A sala comporta 4 pessoas");

  // encostada na outra e dentro da capacidade: aceita
  await page.getByLabel("Participantes").fill("4");
  await page.getByRole("button", { name: "Reservar" }).click();
  await filterBookingsByRoom(page, room);
  await expect(row(page, title)).toContainText("10:00 às 11:00");
});

test("remarca uma reserva, cancela e exclui", async ({ page, request }) => {
  const room = await createRoomViaApi(request, unique("Sala Preta"));
  const title = unique("Treinamento");
  await createBookingViaApi(request, room, title, "13:00", "14:00");
  await page.reload();
  await filterBookingsByRoom(page, room);

  await row(page, title).getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Fim").fill(`${DAY}T15:00`);
  await page.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(row(page, title)).toContainText("13:00 às 15:00");

  await row(page, title).getByRole("button", { name: "Cancelar reserva" }).click();
  await expect(row(page, title)).toContainText("Cancelada");
  await expect(row(page, title).getByRole("button", { name: "Editar" })).toHaveCount(0);

  await row(page, title).getByRole("button", { name: "Excluir" }).click();
  await expect(row(page, title)).toHaveCount(0);

  await page.reload();
  await filterBookingsByRoom(page, room);
  await expect(row(page, title)).toHaveCount(0);
});

test("a sala com reservas não pode ser desativada nem excluída", async ({ page, request }) => {
  const name = unique("Sala Lilás");
  const room = await createRoomViaApi(request, name);
  await createBookingViaApi(request, room, unique("Oficina"));
  await openTab(page, "Salas");

  await row(page, name).getByRole("button", { name: "Desativar" }).click();
  await expect(page.getByRole("alert")).toContainText("Cancele-as antes de desativar");

  await row(page, name).getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByRole("alert")).toContainText("já tem reservas");
  await expect(row(page, name)).toBeVisible();
});

test("busca salas livres, ignora a ocupada e leva para o formulário de reserva", async ({
  page,
  request,
}) => {
  const busy = await createRoomViaApi(request, unique("Sala Ocupada"), 400);
  const free = await createRoomViaApi(request, unique("Sala Livre"), 400);
  await createBookingViaApi(request, busy, unique("Reunião"), "09:00", "10:00");
  const title = unique("Workshop");

  await openTab(page, "Salas livres");
  await page.getByLabel("Início").fill(`${DAY}T09:30`);
  await page.getByLabel("Fim").fill(`${DAY}T10:30`);
  await page.getByLabel("Capacidade mínima").fill("400");
  await page.getByRole("button", { name: "Buscar" }).click();

  await expect(row(page, free.name)).toBeVisible();
  await expect(row(page, busy.name)).toHaveCount(0);

  await row(page, free.name).getByRole("button", { name: "Reservar" }).click();
  await expect(page.getByLabel("Sala", { exact: true })).toHaveValue(String(free.id));
  await expect(page.getByLabel("Início")).toHaveValue(`${DAY}T09:30`);

  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Responsável").fill("Diana");
  await page.getByLabel("Participantes").fill("20");
  await page.getByRole("button", { name: "Reservar" }).click();
  await filterBookingsByRoom(page, free);
  await expect(row(page, title)).toContainText("09:30 às 10:30");
});

test("mostra o erro quando a API está fora do ar e carrega ao tentar de novo", async ({ page }) => {
  const api = /\/(rooms|bookings)(\?.*)?$/;
  await page.route(api, (route) => route.abort());
  await page.reload();

  await expect(page.getByRole("alert")).toHaveCount(2);
  await expect(page.getByRole("alert").first()).toContainText("Não foi possível conectar à API");

  await page.unroute(api);
  const retry = page.getByRole("button", { name: "Tentar novamente" });
  await retry.first().click();
  // enquanto as salas recarregam a lista também espera; sobra um botão só
  await expect(retry).toHaveCount(1);
  await retry.click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^Reservas \(/ })).toBeVisible();
});
