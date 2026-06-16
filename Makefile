.PHONY: start server client install test

start:
	@trap 'kill 0' INT TERM; \
	(cd server && DB_PATH=$(HOME)/.sensorario-tracker/tracker.db php -S localhost:8000 -t public/) & \
	(cd client && npm run dev) & \
	wait

server:
	cd server && DB_PATH=$(HOME)/.sensorario-tracker/tracker.db php -S localhost:8000 -t public/

client:
	cd client && npm run dev

install:
	cd server && /tmp/composer install
	cd client && npm install

test:
	cd server && php vendor/bin/phpunit