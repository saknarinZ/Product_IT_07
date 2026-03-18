.PHONY: up down logs build restart backend-logs db-logs shell-db migrate

# ── Docker Compose Commands ──────────────────────────────────────────────────

## Start all services in detached mode
up:
	docker compose up -d

## Stop and remove all containers (keep volumes)
down:
	docker compose down

## Rebuild all images and start services
build:
	docker compose up -d --build

## Restart all services
restart:
	docker compose restart

## Stream logs from all services
logs:
	docker compose logs -f

## Stream logs from the backend API only
backend-logs:
	docker compose logs -f backend

## Stream logs from the PostgreSQL database only
db-logs:
	docker compose logs -f postgres

## Open a psql shell inside the running PostgreSQL container
shell-db:
	docker compose exec postgres psql -U postgres -d product_management

## Stop containers and also delete volumes (⚠️ destroys all data)
clean:
	docker compose down -v

# ── Local Development (without Docker) ─────────────────────────────────────

## Run the backend locally (requires a running PostgreSQL instance)
run-local:
	cd backend && go run ./cmd/api

## Run Go tests
test:
	cd backend && go test ./...

## Tidy Go modules
tidy:
	cd backend && go mod tidy

## Show help
help:
	@echo ""
	@echo "  make up            Start all services"
	@echo "  make down          Stop all services"
	@echo "  make build         Rebuild images & start"
	@echo "  make restart       Restart all services"
	@echo "  make logs          Tail logs (all)"
	@echo "  make backend-logs  Tail logs (API only)"
	@echo "  make db-logs       Tail logs (DB only)"
	@echo "  make shell-db      Open psql shell"
	@echo "  make clean         Remove containers + volumes"
	@echo "  make run-local     Run API without Docker"
	@echo "  make test          Run Go tests"
	@echo "  make tidy          Tidy Go modules"
	@echo ""
