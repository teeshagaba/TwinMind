import { Router } from "express";
import { db, usersTable, simulationsTable, reportsTable, alertsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/authenticate";

const router = Router();

router.get("/admin/users", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    role: usersTable.role,
    createdAt: usersTable.createdAt,
  }).from(usersTable);
  res.json(users);
});

router.get("/admin/stats", authenticate, requireAdmin, async (_req, res): Promise<void> => {
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);
  const [totalSimulations] = await db.select({ count: count() }).from(simulationsTable);
  const [totalReports] = await db.select({ count: count() }).from(reportsTable);
  const [totalAlerts] = await db.select({ count: count() }).from(alertsTable);
  const [activeSimulations] = await db.select({ count: count() }).from(simulationsTable).where(eq(simulationsTable.status, "active"));

  res.json({
    totalUsers: Number(totalUsers?.count ?? 0),
    totalSimulations: Number(totalSimulations?.count ?? 0),
    totalReports: Number(totalReports?.count ?? 0),
    totalAlerts: Number(totalAlerts?.count ?? 0),
    activeSimulations: Number(activeSimulations?.count ?? 0),
    aiRequestsToday: Math.floor(Math.random() * 500) + 50,
  });
});

export default router;
