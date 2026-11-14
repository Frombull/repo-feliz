# Backend

API em FastAPI do Projeto Final de C216 (reserva de salas).

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
  main.py          # cria o app, configura o CORS e registra os routers
  config.py        # lê as origens do CORS da variável de ambiente
  api/routes/      # endpoints (health, rooms e bookings)
  api/errors.py    # converte os erros de domínio em 404, 409 e 422
  core/            # configuração (DATABASE_URL) e erros de domínio
  db/              # Base do SQLAlchemy, engine e sessão
  models/          # modelos ORM (SQLAlchemy): RoomModel e BookingModel
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
GET    /rooms?active=true
GET    /rooms/available?start_at=2030-05-10T09:00&end_at=2030-05-10T10:00&min_capacity=5
GET    /rooms/{room_id}
POST   /rooms
PATCH  /rooms/{room_id}
DELETE /rooms/{room_id}

GET    /bookings?room_id=1&status=confirmed&date=2030-05-10
GET    /bookings/{booking_id}
POST   /bookings
PATCH  /bookings/{booking_id}
POST   /bookings/{booking_id}/cancel
DELETE /bookings/{booking_id}
```

## Regras de negócio e erros

As regras ficam nos services (`room_service.py` e `booking_service.py`), que levantam erros de
domínio (`app/core/errors.py`). A camada da API (`app/api/errors.py`) converte cada um em uma
resposta `{"detail": "mensagem"}`: `NotFoundError` vira 404, `ConflictError` (horário ocupado, sala
desativada, estado que não permite a operação) vira 409 e `BusinessRuleError` (capacidade, horário
de funcionamento, duração) vira 422. A lista completa das regras está no [README da raiz](../README.md).

Os services recebem um relógio (`clock`) em vez de chamar `datetime.now()` direto, para os testes
controlarem o "agora".

## CORS

O navegador só deixa o frontend ler a resposta da API se a origem dele estiver autorizada. As
origens vêm da variável `CORS_ORIGINS`, separadas por vírgula (padrão `http://localhost:5173`).
Os métodos liberados são `GET`, `POST`, `PATCH` e `DELETE`, e o único header é
`Content-Type`. Usar `*` não é aceito: a API não sobe com ele.

```bash
CORS_ORIGINS=http://localhost:5173,http://localhost:3000 make run
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

O workflow [`ci-backend.yml`](../.github/workflows/ci-backend.yml) roda a cada `push` e `pull_request` que altere `backend/`, com um job de lint e formatação (Ruff e Black), outro para os testes unitários e outro para os de integração. Este último usa um PostgreSQL como service, aplica as migrations e roda o `alembic check`, que falha se um modelo mudou sem migration.
