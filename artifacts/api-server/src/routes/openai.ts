import { Router } from "express";
import { db, conversations as conversationsTable, messages as messagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { openai } from "@workspace/integrations-openai-ai-server";
import { generateMetrics, predictFailure, getSimulationMode } from "../lib/metricsEngine";

const router = Router();

const MODE_SYSTEM_PROMPTS: Record<string, string> = {
  general: "You are TwinMind AI, an advanced AI assistant for infrastructure intelligence. You can answer questions about infrastructure, DevOps, software architecture, security, AI, programming, and general topics. Be helpful, precise, and professional.",
  infrastructure: "You are an Infrastructure Expert AI specializing in cloud architecture, distributed systems, networking, and operations. Analyze infrastructure metrics deeply, diagnose issues, and provide actionable remediation steps. Focus on reliability, scalability, and performance.",
  devops: "You are a DevOps Expert AI specializing in CI/CD pipelines, Kubernetes, Docker, monitoring, deployment automation, and site reliability engineering. Provide precise, actionable DevOps guidance with real-world examples.",
  architect: "You are a Software Architect AI specializing in system design, microservices, scalability patterns, domain-driven design, and enterprise architecture. Provide architectural guidance with trade-off analysis and pattern recommendations.",
  security: "You are a Security Analyst AI specializing in threat detection, vulnerability assessment, penetration testing concepts, security best practices, and incident response. Analyze security posture and provide defense-in-depth recommendations.",
};

router.get("/openai/conversations", async (_req, res): Promise<void> => {
  const convs = await db.select().from(conversationsTable).orderBy(desc(conversationsTable.createdAt)).limit(50);
  res.json(convs.map(c => ({ id: c.id, title: c.title, mode: (c as any).mode ?? "general", createdAt: c.createdAt })));
});

router.post("/openai/conversations", async (req, res): Promise<void> => {
  const { title, mode } = req.body;
  if (!title) {
    res.status(400).json({ error: "Title required" });
    return;
  }
  const [conv] = await db.insert(conversationsTable).values({ title }).returning();
  res.status(201).json({ id: conv.id, title: conv.title, mode: mode ?? "general", createdAt: conv.createdAt });
});

router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id)).orderBy(messagesTable.createdAt);
  res.json({
    id: conv.id, title: conv.title, mode: "general", createdAt: conv.createdAt,
    messages: msgs,
  });
});

router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(messagesTable).where(eq(messagesTable.conversationId, id));
  await db.delete(conversationsTable).where(eq(conversationsTable.id, id));
  res.sendStatus(204);
});

router.get("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const msgs = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id)).orderBy(messagesTable.createdAt);
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { content, mode = "general" } = req.body;

  if (!content) {
    res.status(400).json({ error: "Content required" });
    return;
  }

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  // Save user message
  await db.insert(messagesTable).values({ conversationId: id, role: "user", content });

  // Build message history
  const history = await db.select().from(messagesTable).where(eq(messagesTable.conversationId, id)).orderBy(messagesTable.createdAt);

  // Get current infra context for infrastructure-related modes
  let infraContext = "";
  if (["infrastructure", "devops", "architect", "security"].includes(mode)) {
    const m = await generateMetrics();
    const p = predictFailure(m);
    const simMode = getSimulationMode();
    infraContext = `\n\nCurrent Real-Time Infrastructure Context:\n- CPU: ${m.cpuUsage.toFixed(1)}%, Memory: ${m.memoryUsage.toFixed(1)}%, Disk: ${m.diskUsage.toFixed(1)}%\n- API Latency (P95): ${m.apiLatency}ms, Error Rate: ${m.errorRate.toFixed(2)}%, Throughput: ${m.requestThroughput.toFixed(1)} req/s\n- Network In: ${m.networkIn.toFixed(1)} KB/s, Network Out: ${m.networkOut.toFixed(1)} KB/s\n- Risk Score: ${p.riskScore}/100 (${p.riskLevel}), Active Simulation: ${simMode ?? "none"}\n- Factors: ${p.factors.join("; ")}\n`;
  }

  const systemPrompt = (MODE_SYSTEM_PROMPTS[mode] ?? MODE_SYSTEM_PROMPTS.general) + infraContext;

  const chatMessages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    await db.insert(messagesTable).values({ conversationId: id, role: "assistant", content: fullResponse });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "AI error occurred", done: true })}\n\n`);
    res.end();
  }
});

export default router;
