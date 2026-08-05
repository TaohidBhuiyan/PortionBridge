# Deploy with Docker Compose

Prerequisites:
- Docker and Docker Compose installed on the host.

Quick start (development/demo):

1. Copy the example env to a real `.env` and update secrets if desired:

```
cp portionbridge/server/.env.example portionbridge/server/.env
# Edit portionbridge/server/.env to configure CLIENT_URL, JWT secrets, email, etc.
```

2. Start the stack:

```
docker compose up --build
```

3. Access the frontend at `http://localhost` and backend API at `http://localhost:5000`.

Notes:
- The compose file creates a MySQL 8 container with database `portionbridge` and root password `examplepassword`. Change that value in `docker-compose.yml` and `portionbridge/server/.env` for production.
- The frontend is built and served by `nginx` and proxies `/api` and `/socket.io` to the backend service inside the compose network.
- For production, run behind a proper reverse proxy, configure TLS, and secure secrets via a secrets manager or environment variables.
