# Frontend

Interface em React (JavaScript) da disciplina C216, com Vite e Tailwind CSS.

Por enquanto não consome a API: os itens ficam só no estado local da página.

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

## Estrutura

```
src/
  main.jsx         # monta o React na página
  App.jsx          # guarda o estado dos itens e junta os componentes
  index.css        # só importa o Tailwind
  validation.js    # regras de validação do item (funções puras)
  components/      # ItemForm, ItemList e ItemFilter
tests/
  setup.js         # jest-dom e limpeza do DOM entre os testes
  unit/            # validation.js e componentes isolados (*.test.js/jsx)
  integration/     # App inteiro com formulário, filtro e lista
  e2e/             # Playwright no navegador (*.spec.js)
```

## Testes

```bash
make front-test               # unitários e integração (Vitest)
make front-test-unit          # só unitários
make front-test-integration   # só integração
make front-test-e2e           # e2e (Playwright)
```

O Playwright sobe o Vite sozinho (`npm run dev`) antes de rodar os testes. Se já tiver um
`make front-dev` rodando, ele reaproveita. O relatório fica em `playwright-report/`.

## Lint e formatação

Feitos pelo Biome, configurado em `biome.json`.

```bash
make front-lint     # só o linter
make front-format   # formata os arquivos
make front-check    # lint, formatação e ordem dos imports, sem alterar nada
```

## CI

O workflow [`ci-frontend.yml`](../.github/workflows/ci-frontend.yml) roda a cada `push` e `pull_request` que altere `frontend/` ou o `Makefile`. O job de lint roda o `make front-check`, e o de testes (que depende dele) roda os unitários, os de integração e os e2e.
