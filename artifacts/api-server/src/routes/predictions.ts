import { Router } from "express";
import { db, predictionsTable, metricsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { generateMetrics, predictFailure } from "../lib/metricsEngine";

const router = Router();

router.get("/predictions", async (_req, res): Promise<void> => {
  const m = generateMetrics();
  const p = predictFailure(m);
  const [row] = await db.insert(predictionsTable).values({
    ...p,
    timestamp: new Date(),
  }).returning();
  res.json(row);
});

router.get("/predictions/history", async (_req, res): Promise<void> => {
  const rows = await db.select().from(predictionsTable).orderBy(desc(predictionsTable.timestamp)).limit(24);
  res.json(rows.reverse());
});

export default router;
