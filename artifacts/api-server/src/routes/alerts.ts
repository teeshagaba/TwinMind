import { Router } from "express";
import { db, alertsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/alerts", async (req, res): Promise<void> => {
  const limit = parseInt(String(req.query.limit ?? "20"), 10);
  const rows = await db.select().from(alertsTable).orderBy(desc(alertsTable.createdAt)).limit(limit);
  res.json(rows);
});

router.post("/alerts/:id/acknowledge", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [alert] = await db.update(alertsTable)
    .set({ acknowledged: true })
    .where(eq(alertsTable.id, id))
    .returning();
  if (!alert) {
    res.status(404).json({ error: "Alert not found" });
    return;
  }
  res.json(alert);
});

export default router;
