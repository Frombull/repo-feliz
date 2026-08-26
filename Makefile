BACKEND = backend
POETRY = py -m poetry
HOST = 127.0.0.1
PORT = 8000

.PHONY: help install run test lint format clean

help:
	@echo "make install  - instala as dependencias"
	@echo "make run      - roda o servidor"
	@echo "make test     - roda os testes"
	@echo "make lint     - checa o codigo com ruff"
	@echo "make format   - formata com black"
	@echo "make clean    - limpa os caches"

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
