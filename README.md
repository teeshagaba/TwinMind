# TwinMind AI

> AI-powered enterprise platform combining Digital Twin Technology, Generative AI, Predictive Analytics, and Infrastructure Intelligence for real-time infrastructure monitoring and management.

![TwinMind AI](https://img.shields.io/badge/TwinMind-AI%20Platform-00d4ff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTV6TTIgMTdsOSA1IDktNXYtNWwtOSA1LTktNXoiLz48L3N2Zz4=)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle%20ORM-336791?style=flat-square&logo=postgresql)](https://postgresql.org)

---

## Features

| Module | Description |
|---|---|
| **Live Dashboard** | Real-time CPU, memory, latency, throughput charts with health score gauge and alert panel |
| **3D Digital Twin** | Interactive React Three Fiber visualization of infrastructure topology with iridescent glitter effects |
| **Simulation Engine** | Trigger failure scenarios — DDoS, memory leak, database failure, server crash, API overload |
| **AI Failure Prediction** | ML-powered risk scoring with historical trend charts and factor analysis |
| **AI Copilot** | Streaming chat with 5 specialist modes: General, Infrastructure, DevOps, Architect, Security |
| **Reports** | Generate AI-written markdown reports: health, optimization, incident, compliance |
| **Admin Panel** | User management, role assignment, and platform statistics |
| **Real-time Alerts** | Live alert feed with severity levels and auto-resolution tracking |

---

## Tech Stack

**Frontend**
- React 19 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)
- React Three Fiber + `@react-three/drei` (3D / glitter effects)
- Recharts (data visualization)
- React Query (generated from OpenAPI via Orval)

**Backend**
- Express 5 + Node.js 24
- PostgreSQL + Drizzle ORM
- JWT authentication (jsonwebtoken + bcryptjs)
- Server-Sent Events (SSE) for AI streaming
- OpenAI API (Replit AI Integration)
- `systeminformation` for real system metrics

**Tooling**
- pnpm workspaces (monorepo)
- OpenAPI → code generation (Orval)
- Zod v4 validation
- esbuild (CJS bundle)

---

## Project Structure

```
twinmind/
├── artifacts/
│   ├── api-server/          # Express 5 backend (port 8080)
│   │   ├── src/routes/      # All API route handlers
│   │   └── src/lib/         # metricsEngine, requestTracker, auth utils
│   └── twinmind/            # React + Vite frontend
│       └── src/pages/       # All app pages
├── lib/
│   ├── api-spec/            # OpenAPI spec (source of truth)
│   ├── api-client-react/    # Generated React Query hooks
│   └── db/                  # Drizzle ORM schema + migrations
└── scripts/                 # Shared utility scripts
```

---

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 9+
- PostgreSQL database

### Setup

```bash
# Install dependencies
pnpm install

# Set environment variables
# DATABASE_URL=postgresql://...
# SESSION_SECRET=your-secret-key

# Push database schema
pnpm --filter @workspace/db run push

# Start development
pnpm --filter @workspace/api-server run dev   # API on :8080
pnpm --filter @workspace/twinmind run dev     # Frontend (auto port)
```

### Default Admin Account

```
Email:    admin@twinmind.ai
Password: admin123456
```

---

## API

The API follows an OpenAPI-first contract. The spec lives at `lib/api-spec/openapi.yaml` and drives both client hook generation and server-side Zod validation.

```bash
# Regenerate client hooks after spec changes
pnpm --filter @workspace/api-spec run codegen
```

Key endpoints:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | JWT login |
| `GET` | `/api/metrics` | Live system snapshot |
| `GET` | `/api/metrics/history` | Historical metrics |
| `GET` | `/api/metrics/services` | Service topology |
| `POST` | `/api/simulations/start` | Start failure simulation |
| `GET` | `/api/predictions` | AI risk score |
| `POST` | `/api/openai/conversations/:id/messages` | Streaming AI chat (SSE) |
| `POST` | `/api/reports/generate` | Generate AI report |

---

## 3D Digital Twin

The Digital Twin page (`artifacts/twinmind/src/pages/digital-twin.tsx`) renders a live infrastructure topology in WebGL using React Three Fiber with glitter effects:

- **`<Sparkles>`** — 630+ animated sparkle particles across the scene
- **`GlitterCore`** — Central iridescent icosahedron with orbiting rings and crystal shards
- **`CrystalShell`** — 40 floating gems on a rotating outer sphere
- **`GlitterRing`** — Per-node orbiting crystal ring color-matched to health status
- **`MeshPhysicalMaterial`** — `iridescence: 1`, `metalness: 1`, `roughness: 0` on all nodes

---

## Simulation Modes

Trigger from the Simulation page or `/api/simulations/start`:

| Mode | Effect |
|---|---|
| `normal` | Baseline metrics |
| `high_traffic` | Elevated throughput + latency |
| `database_failure` | DB error rate spike |
| `server_crash` | CPU + memory surge |
| `api_overload` | Latency + error rate spike |
| `ddos_attack` | Massive traffic + packet loss |
| `memory_leak` | Gradual memory growth |

---

## License

MIT
