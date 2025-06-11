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

.PHONY: logs-frontend
logs-frontend: ## Show frontend logs
	docker compose logs -f frontend

.PHONY: lint
lint: ## Run linting
	docker compose exec -T backend ./scripts/lint.sh
	docker compose exec -T frontend npm run lint
	docker compose exec -T frontend npm run type-check

.PHONY: lint-fix
lint-fix: ## Fix linting issues
	docker compose exec -T backend ./scripts/lint.sh --fix
	docker compose exec -T frontend npm run lint --fix
	docker compose exec -T frontend npm run type-check
	docker compose exec -T frontend npm run format --fix

.PHONY: test
test: ## Run tests. Usage: make test [path=path/to/test]
	docker compose exec -T backend ./scripts/test.sh $(path)

.PHONY: test-frontend
test-frontend: ## Run frontend tests with coverage
	docker compose exec -T frontend npm run test:coverage

.PHONY: test-all
test-all: ## Run all tests (backend + frontend) with coverage
	docker compose exec -T backend ./scripts/test.sh
	docker compose exec -T frontend npm run test:coverage

.PHONY: test-ci
test-ci: ## Run tests with coverage for CI/CD pipeline
	docker compose exec -T -e CI=true backend ./scripts/test.sh
	docker compose exec -T -e CI=true frontend npm run test:coverage

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

.PHONY: generate-openapi-client
generate-openapi-client: ## Generate OpenAPI client
	./scripts/generate-client.sh

.PHONY: makemigrations
makemigrations: ## Create new migrations based on changes to your models
	docker compose exec -T backend ./scripts/makemigrations.sh $(msg)

.PHONY: migrate
migrate: ## Apply migrations
	docker compose exec -T backend ./scripts/migrate.sh

.PHONY: setup-precommit
setup-precommit: ## Setup pre-commit hooks
	./scripts/setup-precommit.sh

.PHONY: precommit-run
precommit-run: ## Run pre-commit hooks on all files
	pre-commit run --all-files

.PHONY: precommit-update
precommit-update: ## Update pre-commit hooks to latest versions
	pre-commit autoupdate
