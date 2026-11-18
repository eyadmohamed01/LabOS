.DEFAULT_GOAL := help

DEV_COMPOSE := docker compose -f docker-compose.dev.yml
PROD_COMPOSE := docker compose -f docker-compose.prod.yml

.PHONY: help dev dev-wifi dev-down dev-logs build prod prod-down prod-logs test \
	docs-build docs-help

help:
	@echo "LabOS"
	@echo ""
	@echo "Application"
	@echo "  make dev          Start the development environment with live reload and logs"
	@echo "  make dev-wifi     Start development and print URLs for other devices on the LAN"
	@echo "  make dev-down     Stop the development environment"
	@echo "  make dev-logs     Follow development logs"
	@echo "  make build        Download dependencies, start the app, and write docs/build/index.html"
	@echo "  make prod         Start the production environment in the background"
	@echo "  make prod-down    Stop the production environment"
	@echo "  make prod-logs    Follow production logs"
	@echo "  make test         Run backend tests"
	@echo "  make help         Show this list"
	@echo ""
	@echo "Documentation"
	@echo "  make docs-build   Rebuild docs/build/index.html"
	@echo "  make docs-help    Show documentation commands"

dev:
	@bash scripts/dev.sh local

dev-wifi:
	@bash scripts/dev.sh wifi

dev-down:
	@$(DEV_COMPOSE) down --timeout 30 --remove-orphans
	@echo "LabOS development environment has stopped."

dev-logs:
	@$(DEV_COMPOSE) logs -f --tail 100

build:
	@$(PROD_COMPOSE) up -d --build --remove-orphans
	@bash scripts/docs.sh build
	@echo "LabOS is running at http://localhost"
	@echo "API health: http://localhost/api/health"
	@echo "API docs:   http://localhost/docs"
	@echo "Open the documentation file docs/build/index.html"

prod:
	@$(PROD_COMPOSE) up -d --build --remove-orphans
	@echo "LabOS production environment is running at http://localhost"
	@echo "API health: http://localhost/api/health"
	@echo "API docs:   http://localhost/docs"

prod-down:
	@$(PROD_COMPOSE) down --timeout 30 --remove-orphans
	@echo "LabOS production environment has stopped."

prod-logs:
	@$(PROD_COMPOSE) logs -f --tail 100

test:
	@$(DEV_COMPOSE) run --rm --build --no-deps backend pytest

docs-build:
	@bash scripts/docs.sh build

docs-help:
	@echo "Documentation"
	@echo "  make docs-build   Rebuild docs/build/index.html"
	@echo "  make docs-help    Show this list"
	@echo ""
	@echo "Open docs/build/index.html in a browser. No server and no port are required."
	@echo "make build also builds this file the first time and starts the application."
