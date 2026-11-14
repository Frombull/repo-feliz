# Reserva de Salas

Projeto Final de C216 (Sistemas Distribuídos): uma aplicação web para cadastrar salas e reservá-las
por horário, sem deixar duas reservas ocuparem a mesma sala ao mesmo tempo.

Vídeo demonstrativo: _link a ser adicionado_

## Objetivo e tema

Quem administra salas de reunião ou de aula costuma controlar as reservas em planilhas ou
mensagens, e o resultado são conflitos de horário e salas lotadas. A aplicação resolve isso: as
salas são cadastradas com capacidade e localização, e cada reserva passa por regras de negócio
(horário de funcionamento, duração, capacidade e conflito) antes de ser gravada no banco.

## Funcionalidades

- **Salas**: cadastrar, listar (com filtro de ativas e inativas), editar, desativar, ativar e excluir.
- **Reservas**: criar, listar (filtros por sala, situação e data), editar, cancelar e excluir.
- **Busca de salas livres**: informa um período e uma capacidade mínima, lista as salas que estão
  livres e leva para o formulário de reserva já preenchido com a sala e o horário.
- Mensagens de carregando, erro (com "Tentar novamente") e confirmação em todas as telas. Os erros
  de regra de negócio vêm da API e aparecem na tela, por exemplo o horário que já está ocupado.

### Regras de negócio

| Regra | Resposta da API |
| --- | --- |
| O nome da sala é único, sem diferenciar maiúsculas | 409 |
| Uma reserva não pode se sobrepor a outra reserva confirmada da mesma sala (reservas encostadas, uma terminando quando a outra começa, são aceitas) | 409 |
| Reservas canceladas liberam o horário | |
| A sala precisa estar ativa para receber reservas | 409 |
| Os participantes não podem passar da capacidade da sala | 422 |
| A reserva fica entre 07:00 e 22:00, no mesmo dia | 422 |
| A duração vai de 15 minutos a 8 horas | 422 |
| Não é possível reservar um horário que já passou | 422 |
| Só reservas confirmadas que ainda não começaram podem ser editadas ou canceladas | 409 |
| Uma reserva só é excluída depois de cancelada ou de terminar | 409 |
| Uma sala com reservas confirmadas que ainda não terminaram não pode ser desativada | 409 |
| Uma sala que já teve reservas não pode ser excluída (desative-a) | 409 |

Os horários são locais, sem fuso.

## Tecnologias

- **Backend**: Python 3.12, FastAPI, Pydantic, SQLAlchemy, Alembic, Poetry, Pytest, Ruff e Black
- **Banco**: PostgreSQL 16
- **Frontend**: React 19 (JavaScript), Vite, Tailwind CSS, Biome, Vitest, Testing Library e Playwright
- **Infra**: Docker, Docker Compose, Make e GitHub Actions

## Estrutura

```text
backend/
  app/
    api/routes/     # endpoints (health, rooms, bookings) e tradução dos erros de domínio em HTTP
    core/           # configuração do banco e erros de domínio
    db/             # Base do SQLAlchemy, engine e sessão
    models/         # RoomModel e BookingModel
    schemas/        # validação de entrada e saída (Pydantic)
    repositories/   # consultas ao banco
    services/       # regras de negócio
  migrations/       # migrations do Alembic
  tests/            # unit (services e schemas com repositories fakes) e integration (API, repositories, migrations)
frontend/
  src/
    pages/          # Reservas, Salas e Salas livres
    components/     # formulários, listas e peças de interface
    services/       # chamadas à API: um módulo por entidade
    hooks/          # useLoad (carregando, erro e nova tentativa)
    utils/          # formatação de datas e regras de exibição
  tests/            # unit, integration (com API falsa) e e2e (Playwright)
compose.yml         # frontend, api e db
Makefile            # comandos de execução, testes e manutenção
```

Mais detalhes em [backend/README.md](backend/README.md), [frontend/README.md](frontend/README.md)
e [README-docker.md](README-docker.md).

## Pré-requisitos

- Docker com Docker Compose
- Make
- Para rodar fora do Docker e para os testes: Python 3.12 com Poetry e Node 24 com npm

## Variáveis de ambiente

Copie o `.env.example` para o `.env` (que não é versionado) e ajuste se precisar.

| Variável | Para que serve | Padrão |
| --- | --- | --- |
| `API_PORT` | porta da API no host | `8000` |
| `FRONTEND_PORT` | porta do frontend no host | `5173` |
| `VITE_API_URL` | endereço da API visto pelo navegador, embutido no build do frontend | `http://localhost:8000` |
| `CORS_ORIGINS` | origens do frontend aceitas pela API, separadas por vírgula (`*` não é aceito) | `http://localhost:5173` |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | credenciais do PostgreSQL | `app`, `app`, `app` |
| `POSTGRES_PORT` | porta do banco no host | `5432` |
| `DATABASE_URL` | conexão usada pela API fora do Docker | `postgresql+psycopg://app:app@localhost:5432/app` |
| `TEST_DATABASE_URL` | banco dos testes de integração (sem ela usam SQLite em memória) | |

Se mudar `FRONTEND_PORT`, ajuste também `CORS_ORIGINS`.

## Executar com Docker

```bash
cp .env.example .env     # opcional, os padrões já funcionam
make up-build
```

Os três serviços sobem em ordem (banco, API, frontend) e a API aplica as migrations ao iniciar.

- Aplicação: <http://localhost:5173>
- API: <http://localhost:8000> (Swagger em <http://localhost:8000/docs>)

Outros comandos: `make ps`, `make logs`, `make logs-api`, `make logs-frontend`, `make down` e
`make clean-docker` (apaga também os dados do banco).

## Executar sem Docker

```bash
make install            # dependências do backend
make front-install      # dependências do frontend
make db-up              # só o PostgreSQL, no Docker
make migrate            # aplica as migrations
make run                # API em http://127.0.0.1:8000
make front-dev          # frontend em http://localhost:5173 (outro terminal)
```

## Migrations

```bash
make migrate                     # aplica as migrations (alembic upgrade head)
make migration m="descricao"     # gera uma nova a partir dos modelos
make downgrade                   # desfaz a última
```

## Testes

```bash
make test-all             # sobe o banco e roda tudo: backend, frontend e e2e
make test                 # backend (Pytest)
make front-test           # frontend (Vitest e Testing Library)
make front-test-e2e       # e2e (Playwright, com a API e o PostgreSQL de verdade)
make lint                 # Ruff
make front-check          # Biome
```

- O backend tem testes unitários dos services (com repositories em memória) e dos schemas, e de
  integração dos endpoints, dos repositories e das migrations. Sem `TEST_DATABASE_URL` os de
  integração usam SQLite em memória.
- O frontend tem testes unitários (validação, serviços, hook e componentes) e de integração das
  páginas com uma API falsa por cima do `fetch`.
- O e2e abre o navegador e exercita o frontend, a API e o banco, inclusive a persistência depois de
  recarregar a página. Precisa do banco no ar (`make db-up`, que o `make test-all` já faz) e da
  primeira instalação dos navegadores: `make front-browsers`.

## CI

Dois workflows do GitHub Actions rodam a cada `push` e `pull_request`:

- [ci-backend.yml](.github/workflows/ci-backend.yml): Ruff e Black, testes unitários e de
  integração (com PostgreSQL), aplicação das migrations e `alembic check`, que falha se um modelo
  mudou sem migration.
- [ci-frontend.yml](.github/workflows/ci-frontend.yml): Biome, testes unitários e de integração e o
  e2e com a API e o PostgreSQL.

## API

```text
GET    /rooms?active=true
GET    /rooms/available?start_at=2030-05-10T09:00&end_at=2030-05-10T10:00&min_capacity=5
GET    /rooms/{id}
POST   /rooms
PATCH  /rooms/{id}
DELETE /rooms/{id}

GET    /bookings?room_id=1&status=confirmed&date=2030-05-10
GET    /bookings/{id}
POST   /bookings
PATCH  /bookings/{id}
POST   /bookings/{id}/cancel
DELETE /bookings/{id}
```

Os erros voltam como `{"detail": "mensagem"}`, com 404 (não encontrado), 409 (conflito com o
estado dos dados) ou 422 (dado inválido ou regra de negócio).
