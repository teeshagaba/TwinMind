# TwinMind AI

AI-powered enterprise platform combining Digital Twin Technology, Generative AI, Predictive Analytics, and Infrastructure Intelligence for real-time infrastructure monitoring and management.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/twinmind run dev` — run the frontend (port auto-assigned)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- 3D: React Three Fiber (@react-three/fiber, @react-three/drei, three)
- Charts: Recharts
- AI Chat: Streaming SSE via OpenAI (Replit AI Integration)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (jsonwebtoken + bcryptjs), stored in localStorage
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Source of truth for all API endpoints
- `lib/db/src/schema/` — All DB table definitions (users, metrics, predictions, simulations, alerts, reports, conversations, messages)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/` — Auth utils (hashPassword, verifyPassword, signToken), metricsEngine
- `artifacts/twinmind/src/pages/` — All frontend pages
- `artifacts/twinmind/src/hooks/use-auth.tsx` — Auth context with JWT
- `lib/api-client-react/` — Generated React Query hooks from OpenAPI spec

## Architecture decisions

- Contract-first API: OpenAPI spec drives code generation for both client hooks and Zod schemas
- JWT auth stored in localStorage; `setAuthTokenGetter` from `@workspace/api-client-react` wires token into all generated hooks automatically
- Metrics engine generates realistic real-time telemetry with simulation modes (normal, high_traffic, database_failure, server_crash, api_overload, ddos_attack, memory_leak)
- SSE streaming for AI copilot chat — frontend reads `data:` events from the Express route
- Conversations/messages table names in DB are `conversations` and `messages` (not `conversationsTable`/`messagesTable`) — imported as aliases in the openai route

## Product

- **Dashboard**: Live CPU, memory, latency, throughput charts with health score gauge and alerts panel
- **3D Digital Twin**: React Three Fiber visualization of infrastructure nodes with status-driven colors and animations
- **Simulation Engine**: Trigger infrastructure failure scenarios (DDoS, memory leak, DB failure, etc.)
- **AI Failure Prediction**: ML-powered risk scoring with historical trend charts
- **AI Copilot**: Streaming chat with 5 specialist modes (General, Infrastructure, DevOps, Architect, Security)
- **Reports**: Generate and view AI-written markdown reports (health, optimization, incident, compliance)
- **Admin Panel**: User management and platform statistics

## Gotchas

- `conversations` table exports are named `conversations`/`messages`, not `conversationsTable`/`messagesTable` — the openai route imports them as aliases
- `/api/simulations/active` returns `null` (not 404) when no simulation is active — frontend must handle null
- `/api/metrics/current` is an alias for `/api/metrics` — both serve the same live snapshot
- Admin user `admin@twinmind.ai` / `admin123456` exists with role set to `admin` in DB directly

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
