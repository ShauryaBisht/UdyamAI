# UdyamAI Makefile

.PHONY: install dev-backend dev-frontend docker-up docker-down db-init test

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

dev-backend:
	cd backend && uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && npm run dev

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down

db-init:
	docker exec -i udyam_db psql -U udyam_user -d udyam_db < infrastructure/database/init.sql

test:
	cd backend && pytest
	cd frontend && npm test
