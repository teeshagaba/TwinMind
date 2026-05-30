import { pgTable, serial, timestamp, real, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  riskScore: real("risk_score").notNull(),
  failureProbability: real("failure_probability").notNull(),
  crashProbability: real("crash_probability").notNull(),
  overloadProbability: real("overload_probability").notNull(),
  confidenceScore: real("confidence_score").notNull(),
  riskLevel: text("risk_level").notNull(),
  factors: text("factors").array().notNull().default([]),
  recommendation: text("recommendation").notNull(),
});

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
