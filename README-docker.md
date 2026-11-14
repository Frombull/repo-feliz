# Ambiente Docker

## Pré-requisitos

- Docker com Docker Compose
- Make (opcional; os comandos `docker compose` também podem ser usados diretamente)

## Serviços

- `frontend`: React servido pelo nginx, em `http://localhost:5173`
- `api`: FastAPI, em `http://localhost:8000` (Swagger em `http://localhost:8000/docs`)
- `db`: PostgreSQL

O `frontend` só sobe depois que a `api` responde em `/health`, e a `api` só sobe depois que o
`db` está saudável.

## Configuração

Copie `.env.example` para `.env` e ajuste os valores se necessário.

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

O `.env` não deve ser versionado.

## Subir o ambiente

```bash
make up-build
```

Ou:

```bash
docker compose up -d --build
```

O frontend ficará disponível em `http://localhost:5173` e a API em `http://localhost:8000`.

Quem chama a API é o navegador, então a `VITE_API_URL` precisa ser um endereço que o navegador
alcance (`localhost`, e não `api`). Ela é embutida no build do frontend: ao mudar, rode
`make up-build` de novo. Se mudar a `FRONTEND_PORT`, ajuste também a `CORS_ORIGINS`, que precisa
ter a origem exata do frontend.

Para subir só o banco (por exemplo para rodar a API fora do Docker ou os testes e2e), use `make db-up`.

Ao iniciar, a API aplica as migrations (`alembic upgrade head`). O PostgreSQL também
fica exposto em `localhost:5432` (porta configurável por `POSTGRES_PORT`), para rodar
`make migrate` e `make run` fora do Docker. Os dados ficam no volume `postgres_data`.

## Verificar os serviços

```bash
make ps
```

Logs:

```bash
make logs
```

Somente da API:

```bash
make logs-api
```

Somente do banco:

```bash
make logs-db
```

Somente do frontend:

```bash
make logs-frontend
```

## Acessar os containers

Shell da API:

```bash
make shell
```

psql do banco:

```bash
make db-shell
```

## Parar o ambiente

```bash
make down
```

Para remover também o volume do PostgreSQL:

```bash
make clean-docker
```

> `make clean-docker` apaga os dados persistidos do PostgreSQL.

## Estrutura

```text
repo-feliz/
├── backend/
│   ├── app/
│   ├── migrations/
│   ├── tests/
│   ├── alembic.ini
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── poetry.lock
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   ├── tests/
│   ├── .dockerignore
│   ├── Dockerfile
│   └── package.json
├── .env.example
├── compose.yml
└── Makefile
```

O backend (serviço `api`) utiliza `./backend` como contexto de build e o frontend (serviço `frontend`) utiliza `./frontend`. Dentro da rede criada pelo Compose, o PostgreSQL (serviço `db`) é acessível pelo hostname `db`.
