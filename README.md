# 🎙️ AI Meeting Copilot

An intelligent, real-time desktop assistant that listens to meeting audio, processes it on a scalable backend, and delivers live insights, action items, and context-aware suggestions.

---

## 🏗️ Architecture & Component Overview

The application is structured as a monorepo consisting of the following core parts:

```text
 ┌───────────────────┐               ┌────────────────────────┐
 │ Tauri Desktop App │ ◄───────────► │ NestJS Backend Gateway │
 └───────────────────┘  WebSocket/   └───────────┬────────────┘
                        Socket.io                │
                                       ┌─────────┴─────────┐
                                       ▼                   ▼
                              ┌────────────────┐   ┌──────────────┐
                              │  PostgreSQL    │   │ Redis Cache  │
                              │ (with pgvector)│   └──────────────┘
                              └────────────────┘
```


### 1. 🖥️ Desktop Application ([desktop](file:///c:/Yash%20Stuff/Learning%20Stuff/Side%20Projects/ai-copilot/desktop))
* **Framework**: Built with **Tauri** (Rust backend) and **React** + **Vite** + **TypeScript** (Frontend).
* **Role**: Captures system or microphone audio in real-time, streams chunks via WebSockets to the NestJS backend, and renders live AI recommendations.
* **Features**: Compact overlay window, start/stop hotkeys, real-time insights stream.

### 2. ⚙️ Backend API & Gateway ([backend](file:///c:/Yash%20Stuff/Learning%20Stuff/Side%20Projects/ai-copilot/backend))
* **Framework**: **NestJS** (TypeScript).
* **Role**: Orchestrates real-time communication using Socket.io gateways, manages audio buffering/transcription integrations, handles semantic search/vector retrieval, and runs background analysis jobs.
* **Features**: Scalable WebSocket gateway, background worker structures, mock simulation engine.

### 3. 🗄️ Infrastructure ([docker-compose.yml](file:///c:/Yash%20Stuff/Learning%20Stuff/Side%20Projects/ai-copilot/docker-compose.yml))
* **Database**: **PostgreSQL** with the `pgvector` extension, enabling semantic search and context memory storage for meeting transcripts.
* **Cache**: **Redis** for state tracking, session management, and task queuing.

---

## 🚀 Getting Started

### 📋 Prerequisites
Ensure you have the following installed on your local machine:
* [Node.js](https://nodejs.org/) (v18+ recommended)
* [Docker & Docker Compose](https://www.docker.com/)
* [Rust & Cargo](https://www.rust-lang.org/) (required for compiling the Tauri desktop app)

---

### 🛠️ Step 1: Start Infrastructure (PostgreSQL & Redis)
Spin up the PostgreSQL database (equipped with `pgvector`) and Redis cache using Docker:

```bash
docker-compose up -d
```

* Postgres runs on port `5432` with database `ai_copilot_db`
* Redis runs on port `6379`

---

### 🛠️ Step 2: Set Up and Run the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the NestJS development server (with watch mode):
   ```bash
   npm run start:dev
   ```

* The server will run on [http://localhost:3000](http://localhost:3000)
* WebSocket connections are accepted on `ws://localhost:3000`

---

### 🛠️ Step 3: Set Up and Run the Desktop App

1. Navigate to the desktop directory:
   ```bash
   cd desktop
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the app in Tauri's development mode:
   ```bash
   npm run tauri dev
   ```

* This command compiles the Rust source (`src-tauri`) and runs the React frontend inside a Tauri webview window.
* Click **Start Copilot** to simulate real-time audio chunk transmission and receive live insights.

---

## 🔮 Roadmap / Future Work

- [ ] **Native Audio Capture**: Implement high-performance loopback/microphone audio capture using Rust's `cpal` or `rodio` library inside `src-tauri`.
- [ ] **Speech-to-Text Integration**: Pipe audio chunks from NestJS backend into deep learning transcription APIs (e.g., Whisper, Deepgram) to generate live transcripts.
- [ ] **LLM Suggestions**: Process transcribed text using LLM APIs to extract summaries, action items, and real-time answer suggestions.
- [ ] **Semantic History Search**: Embed meeting transcripts using text-embedding models and save to PostgreSQL `pgvector` to allow long-term conversational memory and semantic querying.

---

## 📝 License
This project is licensed under the MIT License.
