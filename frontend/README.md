# Frontend

Interface em React (JavaScript) do Projeto Final de C216, com Vite e Tailwind CSS.

Tem três telas, escolhidas por abas: **Reservas** (criar, filtrar, editar, cancelar e excluir),
**Salas** (cadastrar, editar, ativar e desativar, excluir) e **Salas livres** (busca por período e
capacidade, que leva ao formulário de reserva). Consome a API do backend e precisa dela no ar, veja
`make run` ou o `make up` na raiz.

## Instalação

Precisa do Node (o CI usa a versão 24) e do npm.

```bash
make front-install
make front-browsers   # chromium do Playwright, só para os testes e2e
```

Ou, dentro de `frontend/`: `npm install` e `npx playwright install chromium`.

## Rodar

```bash
make front-dev
```

A aplicação fica disponível em `http://localhost:5173`. Para gerar o build: `make front-build`.

A URL da API vem da variável `VITE_API_URL` (padrão `http://localhost:8000`). O backend precisa
ter a origem do frontend no `CORS_ORIGINS`.

## Estrutura

```text
src/
  main.jsx         # monta o React na página
  App.jsx          # abas e a sala escolhida na busca, que vai para o formulário de reserva
  index.css        # só importa o Tailwind
  validation.js    # regras de formato dos formulários (mesmas dos schemas do backend)
  pages/           # BookingsPage, RoomsPage e AvailabilityPage
  components/      # BookingForm, BookingList, RoomForm, RoomList, Tabs e peças em ui.jsx
  services/        # chamadas à API: api.js (request) e um módulo por entidade
  hooks/           # useLoad: carregando, erro e "tentar novamente"
  utils/           # formatação de datas e regras de exibição das ações
tests/
  setup.js         # jest-dom e limpeza do DOM e do fetch entre os testes
  helpers/         # API falsa em memória usada nos testes
  unit/            # validação, serviços, hook e componentes isolados (*.test.js/jsx)
  integration/     # páginas e App inteiros com a API falsa
  e2e/             # Playwright no navegador com a API e o banco de verdade (*.spec.js)
```

### Serviços e erros

`services/api.js` tem o `request`, que trata os três cenários: API fora do ar, resposta com erro
(o `detail` do FastAPI vira a mensagem) e sucesso. `services/rooms.js` e `services/bookings.js`
têm um método para cada endpoint do backend. As telas mostram o erro de qualquer chamada, e os
formulários mantêm os campos preenchidos quando a API recusa (conflito de horário, capacidade).

## Testes

```bash
make front-test               # unitários e integração (Vitest)
make front-test-unit          # só unitários
make front-test-integration   # só integração
make front-test-e2e           # e2e (Playwright)
```

Unitários e integração mockam o `fetch`, então não precisam da API. O e2e não mocka nada: o
Playwright aplica as migrations, sobe o FastAPI e o Vite sozinhos e reaproveita os que já
estiverem rodando. Por isso precisa do PostgreSQL no ar (`make db-up`) e do backend instalado
(`make install`). O relatório fica em `playwright-report/`.

Para rodar todos os testes do projeto (banco, backend, frontend e e2e), use `make test-all` na raiz.

## Lint e formatação

Feitos pelo Biome, configurado em `biome.json`.

```bash
make front-lint     # só o linter
make front-format   # formata os arquivos
make front-check    # lint, formatação e ordem dos imports, sem alterar nada
```

## CI

O workflow [`ci-frontend.yml`](../.github/workflows/ci-frontend.yml) roda a cada `push` e `pull_request` que altere `frontend/`, `backend/` ou o `Makefile`. O job de lint roda o `make front-check`, o de testes (que depende dele) roda os unitários e os de integração, e o de e2e instala também o backend e sobe um PostgreSQL para a API.
