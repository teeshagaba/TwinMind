import { Router } from "express";
import { db, simulationsTable, alertsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { setSimulationMode, getSimulationMode, SimulationMode } from "../lib/metricsEngine";

const router = Router();

const VALID_MODES: SimulationMode[] = [
  "normal", "high_traffic", "database_failure", "server_crash",
  "api_overload", "ddos_attack", "memory_leak",
];

router.get("/simulations", async (_req, res): Promise<void> => {
  const rows = await db.select().from(simulationsTable).orderBy(desc(simulationsTable.startedAt)).limit(20);
  res.json(rows);
});

router.post("/simulations", async (req, res): Promise<void> => {
  const { mode } = req.body;
  if (!VALID_MODES.includes(mode)) {
    res.status(400).json({ error: `Invalid mode. Valid: ${VALID_MODES.join(", ")}` });
    return;
  }

  // Stop any active simulation
  await db.update(simulationsTable)
    .set({ status: "stopped", stoppedAt: new Date() })
    .where(eq(simulationsTable.status, "active"));

  setSimulationMode(mode as SimulationMode);

  const [sim] = await db.insert(simulationsTable).values({
    mode,
    status: "active",
    userId: null,
  }).returning();

  // Generate a relevant alert
  const alertMessages: Record<string, { type: string; severity: string; title: string; message: string; service: string }> = {
    high_traffic: { type: "throughput", severity: "warning", title: "High Traffic Detected", message: "Request throughput has spiked significantly above normal baseline.", service: "api-gateway" },
    database_failure: { type: "database", severity: "critical", title: "Database Failure", message: "Primary database connection pool exhausted. Failover initiated.", service: "postgres-primary" },
    server_crash: { type: "crash", severity: "critical", title: "Server Crash Detected", message: "Critical service nodes are unresponsive. Automated recovery in progress.", service: "user-service" },
    api_overload: { type: "latency", severity: "critical", title: "API Overload", message: "API gateway is rejecting requests due to overload. Circuit breaker active.", service: "api-gateway" },
    ddos_attack: { type: "security", severity: "critical", title: "DDoS Attack Detected", message: "Anomalous traffic pattern detected. Rate limiting and IP blocking engaged.", service: "load-balancer" },
    memory_leak: { type: "memory", severity: "warning", title: "Memory Leak Detected", message: "Service memory usage growing continuously. Heap analysis recommended.", service: "ml-service" },
    normal: { type: "info", severity: "info", title: "Simulation Reset", message: "Infrastructure returned to normal operating conditions.", service: "monitoring" },
  };

  const alertData = alertMessages[mode];
  if (alertData) {
    await db.insert(alertsTable).values({ ...alertData, acknowledged: false });
  }

  res.status(201).json(sim);
});

router.get("/simulations/active", async (_req, res): Promise<void> => {
  const [sim] = await db.select().from(simulationsTable)
    .where(eq(simulationsTable.status, "active"))
    .orderBy(desc(simulationsTable.startedAt))
    .limit(1);
  res.json(sim ?? null);
});

router.post("/simulations/:id/stop", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [sim] = await db.update(simulationsTable)
    .set({ status: "stopped", stoppedAt: new Date() })
    .where(eq(simulationsTable.id, id))
    .returning();

  if (!sim) {
    res.status(404).json({ error: "Simulation not found" });
    return;
  }

  setSimulationMode(null);
  res.json(sim);
});

export default router;
