.PHONY: dev up build

dev:
	@docker compose up --build

up:
	@docker compose up

build:
	cd frontend && npm ci && npm run build
	docker build -t iris-api ./server
