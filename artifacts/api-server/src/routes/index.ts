import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import metricsRouter from "./metrics";
import predictionsRouter from "./predictions";
import simulationsRouter from "./simulations";
import alertsRouter from "./alerts";
import reportsRouter from "./reports";
import recommendationsRouter from "./recommendations";
import adminRouter from "./admin";
import openaiRouter from "./openai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(metricsRouter);
router.use(predictionsRouter);
router.use(simulationsRouter);
router.use(alertsRouter);
router.use(reportsRouter);
router.use(recommendationsRouter);
router.use(adminRouter);
router.use(openaiRouter);

export default router;
