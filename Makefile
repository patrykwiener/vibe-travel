.PHONY: help
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.PHONY: build
build: ## Build containers
	docker compose build

.PHONY: up
up: ## Start development environment
	docker compose up

.PHONY: down
down: ## Stop development environment
	docker compose down

.PHONY: logs
logs: ## Show logs
	docker compose logs -f

.PHONY: logs-backend
logs-backend: ## Show backend logs
	docker compose logs -f backend

.PHONY: lint
lint: ## Run linting
	docker compose exec backend ./scripts/lint.sh

.PHONY: lint-fix
lint-fix: ## Fix linting issues
	docker compose exec backend ./scripts/lint.sh --fix

.PHONY: test
test: ## Run tests. Usage: make test [path=path/to/test]
	docker compose exec backend ./scripts/test.sh $(path)

.PHONY: shell
shell: ## Enter backend shell
	docker compose exec backend sh

.PHONY: create-env
create-env: ## Create .env file from template
	cp -n .env.template .env || true

.PHONY: init
init: create-env build up ## Initialize project (create .env, build images, start containers)

.PHONY: reset-db
reset-db: ## Reset the database (drops all data)
	docker compose down -v
	docker compose up -d db
