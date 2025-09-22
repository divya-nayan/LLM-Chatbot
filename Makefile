.PHONY: help install dev build test clean docker-up docker-down

help: ## Show this help message
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

install: ## Install all dependencies
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

dev: ## Run development servers
	@echo "Starting backend and frontend servers..."
	@(cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) & \
	(cd frontend && npm run dev) & \
	wait

backend: ## Run backend server only
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend: ## Run frontend server only
	cd frontend && npm run dev

build: ## Build production images
	cd frontend && npm run build
	docker-compose build

test: ## Run tests
	cd backend && pytest tests/ -v
	cd frontend && npm test

lint: ## Run linters
	cd backend && flake8 app/ --max-line-length=100
	cd backend && black app/ --check
	cd frontend && npm run lint

format: ## Format code
	cd backend && black app/
	cd backend && isort app/
	cd frontend && npm run lint --fix

clean: ## Clean up generated files
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf backend/.pytest_cache
	rm -rf frontend/.next
	rm -rf frontend/node_modules
	rm -rf data/uploads/*
	rm -rf data/processed/*
	rm -rf logs/*

docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## View Docker logs
	docker-compose logs -f

migrate: ## Run database migrations
	cd backend && alembic upgrade head

check-groq: ## Check Groq API connectivity
	@echo "Checking Groq API..."
	@curl -s -H "Authorization: Bearer ${GROQ_API_KEY}" https://api.groq.com/openai/v1/models | jq '.' || echo "Failed to connect to Groq API"