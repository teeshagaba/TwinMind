import { Router } from "express";
import { db, reportsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { generateMetrics, predictFailure } from "../lib/metricsEngine";

const router = Router();

const REPORT_TITLES: Record<string, string> = {
  incident: "Incident Analysis Report",
  health: "Infrastructure Health Report",
  optimization: "Optimization Recommendations Report",
  deployment_risk: "Deployment Risk Assessment",
  root_cause: "Root Cause Analysis Report",
};

const REPORT_PROMPTS: Record<string, (ctx: string) => string> = {
  incident: (ctx) => `You are a senior SRE. Generate a professional incident report based on this infrastructure data:\n${ctx}\n\nInclude: Executive Summary, Timeline, Impact Analysis, Root Cause (hypothetical), Remediation Steps, Prevention Measures. Use markdown formatting.`,
  health: (ctx) => `You are a cloud architect. Generate a comprehensive infrastructure health report:\n${ctx}\n\nInclude: Health Score Analysis, Component Status, Bottlenecks, Trend Analysis, SLA Compliance, Recommendations. Use markdown.`,
  optimization: (ctx) => `You are a performance engineer. Generate an optimization report:\n${ctx}\n\nInclude: Executive Summary, Top Optimization Opportunities (ranked by ROI), Implementation Roadmap, Expected Outcomes, Cost-Benefit Analysis. Use markdown.`,
  deployment_risk: (ctx) => `You are a DevOps expert. Generate a deployment risk assessment:\n${ctx}\n\nInclude: Current Risk Level, Risk Factors, Go/No-Go Recommendation, Mitigation Strategies, Rollback Plan, Monitoring Requirements. Use markdown.`,
  root_cause: (ctx) => `You are a reliability engineer. Perform root cause analysis:\n${ctx}\n\nInclude: Problem Statement, Contributing Factors, 5-Why Analysis, Technical Deep Dive, Corrective Actions, Preventive Measures. Use markdown.`,
};

router.get("/reports", async (_req, res): Promise<void> => {
  const rows = await db.select().from(reportsTable).orderBy(desc(reportsTable.createdAt)).limit(20);
  res.json(rows);
});

router.post("/reports", async (req, res): Promise<void> => {
  const { type } = req.body;
  if (!REPORT_TITLES[type]) {
    res.status(400).json({ error: "Invalid report type" });
    return;
  }

  const m = generateMetrics();
  const p = predictFailure(m);
  const ctx = JSON.stringify({ metrics: m, predictions: p }, null, 2);
  const prompt = REPORT_PROMPTS[type](ctx);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });
    const content = response.choices[0]?.message?.content ?? "Report generation failed.";
    const [report] = await db.insert(reportsTable).values({
      type,
      title: REPORT_TITLES[type],
      content,
      userId: null,
    }).returning();
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate report" });
  }
});

router.get("/reports/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [report] = await db.select().from(reportsTable).where(eq(reportsTable.id, id));
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(report);
});

export default router;
