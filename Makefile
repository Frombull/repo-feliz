BACKEND = backend
POETRY = py -m poetry
HOST = 127.0.0.1
PORT = 8000
COMPOSE = docker compose

.PHONY: help install run test lint format clean \
	docker-build docker-up docker-down docker-logs docker-ps docker-restart docker-clean db-shell

help:
	@echo "make install        - instala as dependencias"
	@echo "make run            - roda o servidor"
	@echo "make test           - roda os testes"
	@echo "make lint           - checa o codigo com ruff"
	@echo "make format         - formata com black"
	@echo "make clean          - limpa os caches"
	@echo "make docker-build   - builda as imagens do docker compose"
	@echo "make docker-up      - sobe os containers (backend + banco) em background"
	@echo "make docker-down    - derruba os containers"
	@echo "make docker-logs    - mostra os logs dos containers em tempo real"
	@echo "make docker-ps      - lista os containers do projeto"
	@echo "make docker-restart - reinicia os containers"
	@echo "make docker-clean   - derruba os containers e remove volumes (apaga dados do banco)"
	@echo "make db-shell       - abre um psql dentro do container do banco"

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

docker-build:
	$(COMPOSE) build

docker-up:
	$(COMPOSE) up -d

docker-down:
	$(COMPOSE) down

docker-logs:
	$(COMPOSE) logs -f

docker-ps:
	$(COMPOSE) ps

docker-restart:
	$(COMPOSE) restart

docker-clean:
	$(COMPOSE) down -v

db-shell:
	$(COMPOSE) exec db psql -U postgres -d postgres
