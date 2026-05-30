import { Router } from "express";
import { db, metricsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { generateMetrics, generateServices, getHealthScore } from "../lib/metricsEngine";

const router = Router();

async function getCurrentMetrics(_req: any, res: any): Promise<void> {
  const m = await generateMetrics();
  const [row] = await db.insert(metricsTable).values({
    ...m,
    timestamp: new Date(),
  }).returning();
  res.json(row);
}

router.get("/metrics", getCurrentMetrics);
router.get("/metrics/current", getCurrentMetrics);

router.get("/metrics/history", async (req, res): Promise<void> => {
  const limit = parseInt(String(req.query.limit ?? "60"), 10);
  const rows = await db.select().from(metricsTable).orderBy(desc(metricsTable.timestamp)).limit(limit);
  res.json(rows.reverse());
});

router.get("/metrics/services", async (_req, res): Promise<void> => {
  const services = await generateServices();
  res.json(services);
});

router.get("/metrics/health-score", async (_req, res): Promise<void> => {
  const m = await generateMetrics();
  const score = getHealthScore(m);
  res.json(score);
});

export default router;
