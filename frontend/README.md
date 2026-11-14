# Frontend

Interface em React (JavaScript) da disciplina C216, com Vite e Tailwind CSS.

Consome a API do backend (`/items`): listar, cadastrar, alterar a disponibilidade e remover.
Precisa do backend no ar, veja `make run` ou o `make up` na raiz.

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

```
src/
  main.jsx         # monta o React na página
  App.jsx          # carrega os itens da API, trata loading e erro, junta os componentes
  index.css        # só importa o Tailwind
  validation.js    # regras de validação do item (funções puras)
  services/        # chamadas à API: api.js (request) e items.js (um método por endpoint)
  components/      # ItemForm, ItemList e ItemFilter
tests/
  setup.js         # jest-dom e limpeza do DOM e do fetch entre os testes
  helpers/         # API falsa em memória usada nos testes
  unit/            # validation.js, services e componentes isolados (*.test.js/jsx)
  integration/     # App inteiro com a API falsa (formulário, filtro e lista juntos)
  e2e/             # Playwright no navegador com a API de verdade (*.spec.js)
```

## Testes

```bash
make front-test               # unitários e integração (Vitest)
make front-test-unit          # só unitários
make front-test-integration   # só integração
make front-test-e2e           # e2e (Playwright)
```

Unitários e integração mockam o `fetch`, então não precisam da API. O e2e não mocka nada: o
Playwright sobe o FastAPI e o Vite sozinhos antes de rodar os testes e reaproveita os que já
estiverem rodando. Por isso o backend precisa ter as dependências instaladas (`make install`).
O relatório fica em `playwright-report/`.

Para rodar todos os testes do projeto (backend, frontend e e2e), use `make test-all` na raiz.

## Lint e formatação

Feitos pelo Biome, configurado em `biome.json`.

```bash
make front-lint     # só o linter
make front-format   # formata os arquivos
make front-check    # lint, formatação e ordem dos imports, sem alterar nada
```

## CI

O workflow [`ci-frontend.yml`](../.github/workflows/ci-frontend.yml) roda a cada `push` e `pull_request` que altere `frontend/` ou o `Makefile`. O job de lint roda o `make front-check`, o de testes (que depende dele) roda os unitários e os de integração, e o de e2e instala também o backend para subir a API.
