# Ambiente Docker

## Pré-requisitos

- Docker com Docker Compose
- Make (opcional; os comandos `docker compose` também podem ser usados diretamente)

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

A API ficará disponível em:

```text
http://localhost:8000
```

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
│   ├── tests/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── poetry.lock
│   └── pyproject.toml
├── .env.example
├── compose.yml
└── Makefile
```

O backend (serviço `api`) utiliza `./backend` como contexto de build. Dentro da rede criada pelo Compose, o PostgreSQL (serviço `db`) é acessível pelo hostname `db`.
