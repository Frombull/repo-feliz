BACKEND = backend
POETRY = py -m poetry
HOST = 127.0.0.1
PORT = 8000
COMPOSE = docker compose

.PHONY: help install run test lint format clean \
	up up-build down build logs logs-api logs-db ps shell db-shell

help:
	@echo "make install   - instala as dependencias"
	@echo "make run       - roda o servidor localmente"
	@echo "make test      - roda os testes"
	@echo "make lint      - checa o codigo com ruff"
	@echo "make format    - formata com black"
	@echo "make clean     - limpa os caches locais"
	@echo "make up        - sobe os containers (api + banco) em background"
	@echo "make up-build  - reconstroi as imagens e sobe os containers"
	@echo "make down      - para e remove os containers"
	@echo "make build     - constroi as imagens do docker compose"
	@echo "make logs      - acompanha os logs de todos os servicos"
	@echo "make logs-api  - acompanha apenas os logs da api"
	@echo "make logs-db   - acompanha apenas os logs do banco"
	@echo "make ps        - mostra o status dos servicos"
	@echo "make shell     - abre um shell no container da api"
	@echo "make db-shell  - abre um psql no container do banco"
	@echo "make clean-docker - remove containers, rede e volumes do compose"

install:
	cd $(BACKEND) && $(POETRY) install

run:
	cd $(BACKEND) && $(POETRY) run uvicorn app.main:app --reload --host $(HOST) --port $(PORT)

test:
	cd $(BACKEND) && $(POETRY) run pytest

lint:
	cd $(BACKEND) && $(POETRY) run ruff check app tests

format:
	cd $(BACKEND) && $(POETRY) run black app tests

clean:
	cd $(BACKEND) && rm -rf .pytest_cache .ruff_cache

up:
	$(COMPOSE) up -d

up-build:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down

build:
	$(COMPOSE) build

logs:
	$(COMPOSE) logs -f

logs-api:
	$(COMPOSE) logs -f api

logs-db:
	$(COMPOSE) logs -f db

ps:
	$(COMPOSE) ps

shell:
	$(COMPOSE) exec api sh

db-shell:
	$(COMPOSE) exec db psql -U $${POSTGRES_USER:-app} -d $${POSTGRES_DB:-app}

clean-docker:
	$(COMPOSE) down -v
