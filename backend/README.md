# Backend

API em FastAPI da disciplina C216.

## Instalação

```bash
make install
```

Ou, dentro de `backend/`:

```bash
poetry install
```

## Rodar o servidor

```bash
make run
```

A API fica disponível em `http://127.0.0.1:8000`.

## Estrutura

```
app/
  main.py          # só cria o app e registra os routers
  api/routes/      # endpoints (health e items)
  schemas/         # modelos Pydantic
  services/        # regra de negócio e armazenamento em memória
tests/
  unit/            # testa schemas e service direto, sem HTTP
  integration/     # testa os endpoints com o TestClient
```

## Endpoints

```
GET    /items?available=true
GET    /items/{item_id}
POST   /items
PUT    /items/{item_id}
PATCH  /items/{item_id}
DELETE /items/{item_id}
```

## Testes

```bash
make test               # todos
make test-unit          # só unitários
make test-integration   # só integração
```

Ou, dentro de `backend/`: `poetry run pytest tests/unit` e `poetry run pytest tests/integration`.

## Lint e formatação

```bash
make lint
make format
```

## CI

O workflow [`ci-backend.yml`](../.github/workflows/ci-backend.yml) roda a cada `push` e `pull_request` que altere `backend/`, com um job para os testes unitários e outro para os de integração.
