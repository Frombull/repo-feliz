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
  core/            # configuração (DATABASE_URL)
  db/              # Base do SQLAlchemy, engine e sessão
  models/          # modelos ORM (SQLAlchemy)
  schemas/         # schemas Pydantic (entrada e saída da API)
  repositories/    # acesso ao banco
  services/        # regra de negócio, usa o repository
migrations/        # migrations do Alembic
tests/
  unit/            # testa schemas e service (com repository fake)
  integration/     # testa endpoints, repository e migrations
```

## Banco de dados

A API usa PostgreSQL com SQLAlchemy. A conexão vem da variável `DATABASE_URL`
(veja o `.env.example` na raiz). Para subir só o banco:

```bash
docker compose up -d db
make migrate
```

Migrations (Alembic):

```bash
make migrate                       # aplica as migrations
make migration m="descricao"       # gera uma nova a partir dos modelos
make downgrade                     # desfaz a última
```

No Docker, a API roda `alembic upgrade head` antes de iniciar.

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

Os testes de integração usam a variável `TEST_DATABASE_URL`. Sem ela, rodam em SQLite
em memória; no CI apontam para um PostgreSQL. Para rodar contra o Postgres local:

```bash
TEST_DATABASE_URL=postgresql+psycopg://app:change-me@localhost:5432/app make test
```

> Os testes apagam e recriam as tabelas do banco indicado, então use um banco de teste.

## Lint e formatação

```bash
make lint
make format
```

## CI

O workflow [`ci-backend.yml`](../.github/workflows/ci-backend.yml) roda a cada `push` e `pull_request` que altere `backend/`, com um job para os testes unitários e outro para os de integração (este com um PostgreSQL como service).
