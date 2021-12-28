.PHONY: start
start:
	docker-compose up --build

.PHONY: stop
stop:
	docker-compose down

.PHONY: start-postgres
start-postgres:
	docker-compose up postgres -d --build

.PHONY: restore-postgres
restore-postgres:
	docker exec -i postgres_container pg_restore -U postgres -d dvdrental /tmp/dvdrental.tar

.PHONY: backup-postgres
backup-postgres:
	pg_dump -h localhost -p 15432 -U postgres --password --format=t dvdrental > dvdrental.tar

.PHONY: typegen
typegen:
	cd server; yarn run typegen:db

.PHONY: start-server
start-server:
	cd server; yarn install; yarn run dev

.PHONY: start-graphiql
start-graphiql:
	docker-compose up -d graphiql
