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

## Testes

O projeto usa [Pytest](https://docs.pytest.org/) e o `TestClient` do FastAPI para testes unitários dos endpoints.

Rodar todos os testes:

```bash
make test
```

Rodar em modo verboso:

```bash
make test-v
```

Ou, dentro de `backend/`:

```bash
poetry run pytest
```

Os testes ficam em [`backend/tests`](tests) e cobrem:

- casos de sucesso (`GET /`, `GET /health`, `GET /items/{item_id}`);
- casos de erro (item inexistente → 404, id inválido → 422);
- parametrização (`GET /items/{item_id}` para múltiplos ids);
- uma fixture (`client`) que cria o `TestClient` compartilhado entre os testes.

## Lint e formatação

```bash
make lint
make format
```

## CI

O workflow [`ci-backend.yml`](../.github/workflows/ci-backend.yml) executa os testes automaticamente a cada `push` e `pull_request` que altere arquivos em `backend/`.
