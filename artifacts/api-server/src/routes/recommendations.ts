import { Router } from "express";
import { generateMetrics, generateRecommendations } from "../lib/metricsEngine";

const router = Router();

router.get("/recommendations", async (_req, res): Promise<void> => {
  const m = generateMetrics();
  const recs = generateRecommendations(m);
  res.json(recs);
});

export default router;
