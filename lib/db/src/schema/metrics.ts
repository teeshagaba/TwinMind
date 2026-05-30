import { pgTable, serial, timestamp, real, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const metricsTable = pgTable("metrics", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  cpuUsage: real("cpu_usage").notNull(),
  memoryUsage: real("memory_usage").notNull(),
  diskUsage: real("disk_usage").notNull(),
  apiLatency: real("api_latency").notNull(),
  errorRate: real("error_rate").notNull(),
  requestThroughput: real("request_throughput").notNull(),
  activeServices: integer("active_services").notNull(),
  uptime: real("uptime").notNull(),
  networkIn: real("network_in").notNull(),
  networkOut: real("network_out").notNull(),
  simulationMode: text("simulation_mode"),
});

export const insertMetricSchema = createInsertSchema(metricsTable).omit({ id: true });
export type InsertMetric = z.infer<typeof insertMetricSchema>;
export type Metric = typeof metricsTable.$inferSelect;
