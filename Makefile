.PHONY: up down logs restart pshell psql init

ENV_FILE=backend/.env

init:
	@if [ ! -f $(ENV_FILE) ]; then \
	  echo "Creating $(ENV_FILE) with Docker defaults"; \
	  cp backend/.env.example $(ENV_FILE) || true; \
	  sed -i.bak 's#postgres://[^ ]\+#postgres://postgres:postgres@db:5432/yourapp?sslmode=disable#g' $(ENV_FILE) || true; \
	  grep -q '^FRONTEND_ORIGIN=' $(ENV_FILE) || echo 'FRONTEND_ORIGIN=http://localhost:3000' >> $(ENV_FILE); \
	  grep -q '^PORT=' $(ENV_FILE) || echo 'PORT=8080' >> $(ENV_FILE); \
	  grep -q '^JWT_ACCESS_SECRET=' $(ENV_FILE) || echo 'JWT_ACCESS_SECRET=change_me_access' >> $(ENV_FILE); \
	  rm -f $(ENV_FILE).bak; \
	fi

up: init
	docker compose up -d --build

down:
	docker compose down -v

logs:
	docker compose logs -f --tail=200

restart:
	docker compose restart

pshell:
	docker exec -it yourapp-backend sh

psql:
	docker exec -it yourapp-pg psql -U postgres -d yourapp