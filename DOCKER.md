# 🐳 Running AI Meeting Copilot with Docker

This guide covers how to build, run, and manage the **AI Meeting Copilot** stack using Docker and Docker Compose. It containerises the NestJS backend, PostgreSQL (with pgvector), and Redis into a single reproducible environment.

---

## Table of Contents

- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Running Services](#-running-services)
  - [Full Stack (Backend + Infrastructure)](#1-full-stack-backend--infrastructure)
  - [Infrastructure Only (Database + Cache)](#2-infrastructure-only-database--cache)
  - [Backend Only (Standalone)](#3-backend-only-standalone)
- [Building the Docker Image](#-building-the-docker-image)
- [Common Operations](#-common-operations)
- [Connecting the Desktop App](#-connecting-the-desktop-app)
- [Troubleshooting](#-troubleshooting)
- [Production Deployment Tips](#-production-deployment-tips)

---

## 🏗️ Architecture

```text
┌────────────────────────┐
│   docker-compose.yml   │
│                        │
│  ┌──────────────────┐  │
│  │  backend          │  │──► Port 3000 (HTTP + WebSocket)
│  │  (NestJS)         │  │
│  └──────┬───────────┘  │
│         │depends_on    │
│  ┌──────┴───────────┐  │
│  │  postgres         │  │──► Port 5432
│  │  (pgvector)       │  │
│  └──────────────────┘  │
│                        │
│  ┌──────────────────┐  │
│  │  redis            │  │──► Port 6379
│  │  (Alpine)         │  │
│  └──────────────────┘  │
└────────────────────────┘
         ▲
         │ WebSocket / Socket.io
┌────────┴─────────┐
│ Tauri Desktop App │  (runs natively, not in Docker)
└──────────────────┘
```

> [!NOTE]
> The **Desktop App** (Tauri) is a native application and is **not** containerised. It connects to the backend over WebSocket from the host machine.

---

## 📋 Prerequisites

| Tool              | Minimum Version | Install Guide                                  |
|-------------------|-----------------|-------------------------------------------------|
| Docker Engine     | 20.10+          | [docs.docker.com/engine/install](https://docs.docker.com/engine/install/) |
| Docker Compose    | 2.0+ (V2)      | Included with Docker Desktop                    |
| Git               | Any             | [git-scm.com](https://git-scm.com/)            |

Verify your installation:

```bash
docker --version        # Docker version 20.10+
docker compose version  # Docker Compose version v2.x
```

---

## ⚡ Quick Start

Get up and running in **3 commands**:

```bash
# 1. Clone the repository
git clone https://github.com/yashtank09/ai-copilot.git
cd ai-copilot

# 2. Copy and configure environment variables
cp .env.example .env

# 3. Build and start all services
docker compose up --build -d
```

The backend is now available at **http://localhost:3000** and WebSocket connections are accepted at **ws://localhost:3000**.

---

## ⚙️ Configuration

All configurable values are managed through environment variables. Copy the example file and modify as needed:

```bash
cp .env.example .env
```

### Available Environment Variables

| Variable            | Default            | Description                          |
|---------------------|--------------------|--------------------------------------|
| `POSTGRES_USER`     | `copilot_user`     | PostgreSQL username                  |
| `POSTGRES_PASSWORD` | `copilot_password` | PostgreSQL password                  |
| `POSTGRES_DB`       | `ai_copilot_db`    | PostgreSQL database name             |
| `POSTGRES_PORT`     | `5432`             | Host port mapping for PostgreSQL     |
| `REDIS_PORT`        | `6379`             | Host port mapping for Redis          |
| `BACKEND_PORT`      | `3000`             | Host port mapping for NestJS backend |

> [!IMPORTANT]
> For production use, **always change** `POSTGRES_PASSWORD` to a strong, unique value.

> [!NOTE]
> The Gemini API key is **not** set as a server-side env var. It is securely sent per-request from the Desktop App's client-side configuration.

---

## 🚀 Running Services

### 1. Full Stack (Backend + Infrastructure)

Build and start the entire stack:

```bash
# Build images and start in detached mode
docker compose up --build -d
```

After the first build, start without rebuilding:

```bash
docker compose up -d
```

### 2. Infrastructure Only (Database + Cache)

If you prefer to run the backend locally for development (e.g., with `npm run start:dev`), start only the infrastructure:

```bash
docker compose up -d postgres redis
```

Then run the backend on your host:

```bash
cd backend
npm install
npm run start:dev
```

### 3. Backend Only (Standalone)

Build and run just the backend Docker image without Compose:

```bash
cd backend
docker build -t ai-copilot-backend .
docker run -p 3000:3000 --env PORT=3000 ai-copilot-backend
```

---

## 🔨 Building the Docker Image

The backend uses a **multi-stage Dockerfile** for optimised production builds:

```text
Stage 1 — Builder
├── Installs ALL dependencies (including devDependencies)
├── Compiles TypeScript → JavaScript (npm run build)
└── Output: /app/dist

Stage 2 — Production
├── Installs production dependencies ONLY (npm ci --omit=dev)
├── Copies compiled dist/ from builder stage
├── Result: ~150 MB image (vs ~500 MB with devDeps)
└── Runs: node dist/main.js
```

### Build Manually

```bash
cd backend

# Standard build
docker build -t ai-copilot-backend .

# Build with no cache (clean rebuild)
docker build --no-cache -t ai-copilot-backend .

# Build for a specific platform
docker build --platform linux/amd64 -t ai-copilot-backend .
```

---

## 🛠️ Common Operations

### View running containers

```bash
docker compose ps
```

### View real-time logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Postgres only
docker compose logs -f postgres
```

### Stop all services

```bash
docker compose down
```

### Stop and remove volumes (⚠️ destroys data)

```bash
docker compose down -v
```

### Restart a single service

```bash
docker compose restart backend
```

### Rebuild and restart backend only

```bash
docker compose up --build -d backend
```

### Open a shell in a running container

```bash
# Backend container
docker compose exec backend sh

# PostgreSQL interactive client
docker compose exec postgres psql -U copilot_user -d ai_copilot_db

# Redis CLI
docker compose exec redis redis-cli
```

### Check service health

```bash
docker compose ps
# Look for "(healthy)" status next to postgres and redis
```

---

## 🖥️ Connecting the Desktop App

The Tauri desktop app runs **natively** on your machine (not inside Docker). It connects to the containerised backend via WebSocket.

1. Ensure the Docker stack is running:
   ```bash
   docker compose up -d
   ```

2. In a separate terminal, start the desktop app:
   ```bash
   cd desktop
   npm install
   npm run tauri dev
   ```

3. The desktop app connects to `ws://localhost:3000` by default. If you changed `BACKEND_PORT` in your `.env`, update the connection URL in the desktop app's settings accordingly.

> [!TIP]
> If the desktop app can't connect, verify the backend is healthy:
> ```bash
> curl http://localhost:3000   # Should return a response from NestJS
> ```

---

## 🔧 Troubleshooting

### Port already in use

```
Error: Bind for 0.0.0.0:3000 failed: port is already allocated
```

**Fix**: Change the conflicting port in `.env` or stop the process using the port:

```bash
# Change port in .env
BACKEND_PORT=3001

# Or find and stop the process (Linux/macOS)
lsof -i :3000
kill -9 <PID>

# Windows PowerShell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

### Backend fails to start — `depends_on` issues

The `docker-compose.yml` uses health checks to ensure Postgres and Redis are fully ready before starting the backend. If the backend still fails:

```bash
# Check health of dependencies
docker compose ps

# Manually verify Postgres is accepting connections
docker compose exec postgres pg_isready

# Restart just the backend
docker compose restart backend
```

---

### Container runs out of memory

```bash
# Check container resource usage
docker stats
```

Increase Docker's memory allocation in **Docker Desktop → Settings → Resources**.

---

### Need a clean slate

```bash
# Stop everything, remove volumes, remove orphan containers
docker compose down -v --remove-orphans

# Prune unused Docker resources
docker system prune -a
```

> [!CAUTION]
> `docker compose down -v` **permanently deletes** all data in PostgreSQL and Redis volumes.

---

### Build fails with npm errors

```bash
# Clean Docker build cache and retry
docker builder prune
docker compose build --no-cache
```

---

## 🚢 Production Deployment Tips

### 1. Use a `.env` file with strong secrets

```bash
POSTGRES_PASSWORD=<generate-a-strong-password>
```

### 2. Pin image versions

Replace `latest` and `alpine` tags with specific versions in `docker-compose.yml`:

```yaml
postgres:
  image: ankane/pgvector:v0.8.0   # pin to specific version
redis:
  image: redis:7.4-alpine          # pin to specific version
```

### 3. Enable persistent logging

```yaml
backend:
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

### 4. Add resource limits

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: "1.0"
        memory: 512M
      reservations:
        cpus: "0.5"
        memory: 256M
```

### 5. Use Docker secrets for sensitive data

For production swarm or Kubernetes deployments, avoid embedding passwords in `.env`. Use Docker Secrets or a secrets manager instead.

### 6. Health check endpoint

Consider adding a `/health` endpoint to the NestJS backend for load balancer and orchestrator health probes.

---

## 📁 File Reference

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Orchestrates all services (backend, postgres, redis) |
| `backend/Dockerfile` | Multi-stage build for the NestJS backend |
| `backend/.dockerignore` | Excludes unnecessary files from the Docker build context |
| `.env.example` | Template for environment variables |
| `.env` | Your local environment configuration (git-ignored) |

---

## 📝 Quick Reference Card

```bash
# ── Lifecycle ──────────────────────────────────────
docker compose up --build -d       # Build & start all
docker compose up -d               # Start all (no rebuild)
docker compose down                # Stop all
docker compose down -v             # Stop all + delete data

# ── Logs ───────────────────────────────────────────
docker compose logs -f             # Tail all logs
docker compose logs -f backend     # Tail backend logs

# ── Debugging ──────────────────────────────────────
docker compose ps                  # List containers & status
docker compose exec backend sh     # Shell into backend
docker stats                       # Resource usage

# ── Selective Start ────────────────────────────────
docker compose up -d postgres redis  # Infra only
docker compose up --build -d backend # Rebuild backend only
```
