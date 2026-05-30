import * as si from "systeminformation";
import * as os from "os";
import { getRequestStats } from "./requestTracker";

export type SimulationMode =
  | "normal"
  | "high_traffic"
  | "database_failure"
  | "server_crash"
  | "api_overload"
  | "ddos_attack"
  | "memory_leak";

let currentSimulation: SimulationMode | null = null;
let simulationStartTime: number = 0;
let memoryLeakAccumulator = 0;

export function setSimulationMode(mode: SimulationMode | null): void {
  currentSimulation = mode;
  simulationStartTime = Date.now();
  memoryLeakAccumulator = 0;
}

export function getSimulationMode(): SimulationMode | null {
  return currentSimulation;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ── Real system metrics ──────────────────────────────────────────────────────

export async function generateMetrics() {
  const [load, mem, disk, net] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.networkStats(),
  ]);

  const reqStats = getRequestStats();

  // Real values
  let cpu = load.currentLoad;
  let memory = ((mem.used) / mem.total) * 100;
  let diskUsage = disk.length > 0 ? disk[0].use : 0;
  let networkIn = net.reduce((s, n) => s + (n.rx_sec ?? 0), 0) / 1024; // KB/s
  let networkOut = net.reduce((s, n) => s + (n.tx_sec ?? 0), 0) / 1024; // KB/s

  // API latency: use real p95 from request tracker, floor at 5ms when no traffic yet
  let apiLatency = reqStats.latencyP95 > 0 ? reqStats.latencyP95 : rand(8, 18);
  // Throughput in req/s
  let throughput = reqStats.throughputPerSec;
  // Error rate in %
  let errorRate = reqStats.errorRate;

  const uptimeSecs = os.uptime();
  const maxUptime = 30 * 24 * 3600; // treat 30 days as 100%
  let uptime = clamp((uptimeSecs / maxUptime) * 100, 0, 99.99);

  let activeServices = 12;

  const elapsed = (Date.now() - simulationStartTime) / 1000;
  if (currentSimulation === "memory_leak") {
    memoryLeakAccumulator = Math.min(elapsed * 0.5, 45);
  }

  // Apply simulation overlays on top of real base values
  switch (currentSimulation) {
    case "normal":
      break;

    case "high_traffic":
      cpu = clamp(cpu + rand(35, 50), 0, 99);
      memory = clamp(memory + rand(18, 28), 0, 99);
      apiLatency = apiLatency + rand(130, 200);
      errorRate = clamp(errorRate + rand(1.8, 3.5), 0, 100);
      throughput = throughput + rand(3000, 4500);
      networkIn = networkIn + rand(600, 900);
      networkOut = networkOut + rand(350, 500);
      break;

    case "database_failure":
      cpu = clamp(cpu + rand(20, 35), 0, 99);
      memory = clamp(memory + rand(20, 30), 0, 99);
      apiLatency = apiLatency + rand(700, 1200);
      errorRate = clamp(errorRate + rand(24, 32), 0, 100);
      throughput = Math.max(0, throughput - rand(800, 1000));
      activeServices = 10;
      uptime = 87.3;
      break;

    case "server_crash":
      cpu = clamp(cpu + rand(55, 65), 90, 100);
      memory = clamp(memory + rand(45, 55), 90, 100);
      apiLatency = apiLatency + rand(2200, 3000);
      errorRate = clamp(errorRate + rand(70, 80), 0, 100);
      throughput = Math.max(0, throughput - rand(1100, 1200));
      activeServices = 5;
      uptime = 23.5;
      break;

    case "api_overload":
      cpu = clamp(cpu + rand(48, 60), 0, 99);
      memory = clamp(memory + rand(28, 38), 0, 99);
      apiLatency = apiLatency + rand(580, 700);
      errorRate = clamp(errorRate + rand(15, 22), 0, 100);
      throughput = throughput + rand(5500, 7000);
      networkIn = networkIn + rand(1000, 1300);
      networkOut = networkOut + rand(850, 1050);
      break;

    case "ddos_attack":
      cpu = clamp(cpu + rand(60, 68), 90, 100);
      memory = clamp(memory + rand(35, 45), 0, 99);
      apiLatency = apiLatency + rand(2900, 3800);
      errorRate = clamp(errorRate + rand(80, 90), 0, 100);
      throughput = throughput + rand(13000, 16000);
      networkIn = networkIn + rand(8500, 10500);
      activeServices = 8;
      uptime = 45.2;
      break;

    case "memory_leak":
      cpu = clamp(cpu + memoryLeakAccumulator * 0.3, 0, 99);
      memory = clamp(memory + memoryLeakAccumulator, 0, 99);
      apiLatency = apiLatency + memoryLeakAccumulator * 1.2;
      errorRate = clamp(errorRate + memoryLeakAccumulator * 0.05, 0, 100);
      throughput = Math.max(0, throughput - memoryLeakAccumulator * 5);
      break;
  }

  return {
    cpuUsage: clamp(Math.round(cpu * 10) / 10, 0, 100),
    memoryUsage: clamp(Math.round(memory * 10) / 10, 0, 100),
    diskUsage: clamp(Math.round(diskUsage * 10) / 10, 0, 100),
    apiLatency: clamp(Math.round(apiLatency), 1, 10000),
    errorRate: clamp(Math.round(errorRate * 100) / 100, 0, 100),
    requestThroughput: clamp(Math.round(throughput * 10) / 10, 0, 20000),
    activeServices,
    uptime: clamp(Math.round(uptime * 100) / 100, 0, 100),
    networkIn: clamp(Math.round(networkIn * 10) / 10, 0, 15000),
    networkOut: clamp(Math.round(networkOut * 10) / 10, 0, 5000),
    simulationMode: currentSimulation,
  };
}

// ── Real processes → services panel ─────────────────────────────────────────

const SERVICE_MAP: Record<string, { name: string; type: string }> = {
  postgres: { name: "PostgreSQL", type: "database" },
  node: { name: "Node.js API", type: "microservice" },
  nginx: { name: "Nginx", type: "gateway" },
  redis: { name: "Redis Cache", type: "cache" },
  python: { name: "ML Service", type: "microservice" },
  ruby: { name: "Worker Service", type: "microservice" },
  java: { name: "JVM Service", type: "microservice" },
  go: { name: "Go Service", type: "microservice" },
};

const STATIC_SERVICES = [
  { id: "api-gateway", name: "API Gateway", type: "gateway" },
  { id: "user-service", name: "User Service", type: "microservice" },
  { id: "auth-service", name: "Auth Service", type: "microservice" },
  { id: "data-service", name: "Data Service", type: "microservice" },
  { id: "ml-service", name: "ML Inference", type: "microservice" },
  { id: "postgres-primary", name: "PostgreSQL Primary", type: "database" },
  { id: "postgres-replica", name: "PostgreSQL Replica", type: "database" },
  { id: "redis-cache", name: "Redis Cache", type: "cache" },
  { id: "load-balancer", name: "Load Balancer", type: "loadbalancer" },
  { id: "cdn-edge", name: "CDN Edge", type: "cdn" },
  { id: "monitoring", name: "Monitoring Stack", type: "monitoring" },
  { id: "message-queue", name: "Message Queue", type: "queue" },
];

export async function generateServices() {
  let procs: si.Systeminformation.ProcessesProcessData[] = [];
  try {
    const data = await si.processes();
    // top 20 by cpu then memory
    procs = data.list
      .filter(p => p.name && p.pid > 1)
      .sort((a, b) => (b.cpu + b.mem) - (a.cpu + a.mem))
      .slice(0, 20);
  } catch { /* fallback to static */ }

  const mode = currentSimulation;

  return STATIC_SERVICES.map((svc, idx) => {
    // Try to find a matching real process
    const realProc = procs.find(p =>
      p.name.toLowerCase().startsWith(svc.id.split("-")[0]) ||
      Object.keys(SERVICE_MAP).some(k => p.name.toLowerCase().includes(k) && SERVICE_MAP[k].type === svc.type)
    );

    // Base values from real process or from system load divided across services
    let cpu = realProc ? realProc.cpu : clamp(rand(5, 30) + (idx % 3) * 2, 1, 60);
    let memory = realProc ? realProc.mem : clamp(rand(20, 55) + (idx % 4) * 3, 5, 70);
    let latency = clamp(rand(4, 45) + idx, 1, 200);
    let uptime = clamp(rand(99.5, 99.99), 95, 100);
    let replicas = 2;
    let status = "healthy";

    // Apply simulation overlays
    if (mode === "server_crash" && (svc.type === "microservice" || svc.id === "api-gateway")) {
      if (Math.random() > 0.4) { status = "critical"; cpu = rand(88, 100); memory = rand(85, 100); uptime = rand(20, 60); }
    } else if (mode === "database_failure" && svc.type === "database") {
      status = svc.id === "postgres-primary" ? "critical" : "warning";
      latency = rand(2000, 5000); uptime = rand(30, 70);
    } else if (mode === "ddos_attack") {
      status = Math.random() > 0.5 ? "warning" : "critical";
      cpu = rand(78, 100); memory = rand(72, 95); latency = rand(500, 4000);
    } else if (mode === "api_overload" && svc.type !== "database") {
      status = "warning"; cpu = clamp(cpu + rand(30, 50), 0, 99); latency = rand(300, 800);
    } else if (mode === "high_traffic") {
      status = Math.random() > 0.7 ? "warning" : "healthy";
      cpu = clamp(cpu + rand(30, 50), 0, 99); latency = rand(80, 250); replicas = 4;
    } else if (mode === "memory_leak" && svc.type === "microservice") {
      memory = clamp(memory + memoryLeakAccumulator * 0.8, 5, 97);
      status = memory > 85 ? "warning" : "healthy";
    } else {
      // Healthy: color based on cpu/mem
      if (cpu > 80 || memory > 85) status = "warning";
      if (cpu > 95 || memory > 95) status = "critical";
    }

    return {
      ...svc,
      status,
      cpuUsage: clamp(Math.round(cpu * 10) / 10, 0, 100),
      memoryUsage: clamp(Math.round(memory * 10) / 10, 0, 100),
      latency: Math.round(latency),
      uptime: clamp(Math.round(uptime * 100) / 100, 0, 100),
      replicas,
      pid: realProc?.pid ?? null,
    };
  });
}

// ── Prediction, health score, recommendations (unchanged logic) ──────────────

export function predictFailure(metrics: Awaited<ReturnType<typeof generateMetrics>>) {
  const { cpuUsage, memoryUsage, apiLatency, errorRate, requestThroughput } = metrics;

  const cpuScore = cpuUsage / 100;
  const memScore = memoryUsage / 100;
  const latencyScore = Math.min(apiLatency / 3000, 1);
  const errorScore = Math.min(errorRate / 50, 1);
  const throughputScore = requestThroughput > 10000 ? 0.8 : requestThroughput > 5000 ? 0.4 : 0.1;

  const riskScore = clamp(
    cpuScore * 0.25 + memScore * 0.25 + latencyScore * 0.2 + errorScore * 0.2 + throughputScore * 0.1,
    0, 1
  ) * 100;

  const failureProbability = clamp(riskScore * 0.9 + rand(-5, 5), 0, 100);
  const crashProbability = clamp(cpuScore * memScore * 100 * 0.85 + rand(-5, 5), 0, 100);
  const overloadProbability = clamp((latencyScore + throughputScore) * 50 + rand(-5, 5), 0, 100);
  const confidenceScore = clamp(85 + rand(-8, 8), 70, 98);

  const riskLevel =
    riskScore >= 75 ? "critical" :
    riskScore >= 50 ? "high" :
    riskScore >= 25 ? "medium" : "low";

  const factors: string[] = [];
  if (cpuUsage > 80) factors.push(`High CPU utilization (${cpuUsage.toFixed(1)}%)`);
  if (memoryUsage > 80) factors.push(`High memory pressure (${memoryUsage.toFixed(1)}%)`);
  if (apiLatency > 500) factors.push(`Elevated API latency (${apiLatency.toFixed(0)}ms)`);
  if (errorRate > 5) factors.push(`Elevated error rate (${errorRate.toFixed(2)}%)`);
  if (requestThroughput > 8000) factors.push(`Request throughput spike (${requestThroughput.toFixed(0)} rps)`);
  if (factors.length === 0) factors.push("System operating within normal parameters");

  const recommendation =
    riskScore >= 75 ? "Immediate action required: scale infrastructure, enable circuit breakers, prepare failover." :
    riskScore >= 50 ? "Warning: investigate performance bottlenecks, consider horizontal scaling." :
    riskScore >= 25 ? "Monitor closely: review resource utilization trends and set alerts." :
    "System healthy. Continue routine monitoring and scheduled maintenance.";

  return {
    riskScore: Math.round(riskScore * 10) / 10,
    failureProbability: Math.round(failureProbability * 10) / 10,
    crashProbability: Math.round(crashProbability * 10) / 10,
    overloadProbability: Math.round(overloadProbability * 10) / 10,
    confidenceScore: Math.round(confidenceScore * 10) / 10,
    riskLevel,
    factors,
    recommendation,
  };
}

export function getHealthScore(metrics: Awaited<ReturnType<typeof generateMetrics>>) {
  const cpuScore = Math.max(0, 100 - metrics.cpuUsage);
  const memScore = Math.max(0, 100 - metrics.memoryUsage);
  const latencyScore = Math.max(0, 100 - (metrics.apiLatency / 30));
  const errorScore = Math.max(0, 100 - metrics.errorRate * 5);
  const uptimeScore = metrics.uptime;

  const score = cpuScore * 0.2 + memScore * 0.2 + latencyScore * 0.2 + errorScore * 0.25 + uptimeScore * 0.15;
  const clamped = clamp(Math.round(score), 0, 100);
  const grade = clamped >= 90 ? "A" : clamped >= 75 ? "B" : clamped >= 60 ? "C" : clamped >= 40 ? "D" : "F";

  return {
    score: clamped,
    grade,
    components: {
      cpu: Math.round(cpuScore),
      memory: Math.round(memScore),
      latency: Math.round(Math.max(0, latencyScore)),
      errorRate: Math.round(Math.max(0, errorScore)),
      uptime: Math.round(uptimeScore),
    },
  };
}

export function generateRecommendations(metrics: Awaited<ReturnType<typeof generateMetrics>>) {
  const recs = [];

  if (metrics.cpuUsage > 70) {
    recs.push({
      id: "rec-cpu-scale", category: "Scaling", priority: "high",
      title: "Scale CPU Resources",
      description: `CPU is at ${metrics.cpuUsage.toFixed(1)}% — above 70%. Add horizontal replicas or upgrade the instance to prevent degradation.`,
      impact: "Reduce CPU bottleneck by ~40%", effort: "Low",
      metric: "cpuUsage", currentValue: metrics.cpuUsage, targetValue: 50,
    });
  }

  if (metrics.memoryUsage > 75) {
    recs.push({
      id: "rec-mem-optimize", category: "Memory", priority: metrics.memoryUsage > 90 ? "critical" : "high",
      title: "Optimize Memory Usage",
      description: `Memory at ${metrics.memoryUsage.toFixed(1)}%. Enable profiling, optimize data structures, or increase heap allocation.`,
      impact: "Prevent OOM crashes", effort: "Medium",
      metric: "memoryUsage", currentValue: metrics.memoryUsage, targetValue: 60,
    });
  }

  if (metrics.apiLatency > 200) {
    recs.push({
      id: "rec-caching", category: "Performance", priority: "high",
      title: "Enable Response Caching",
      description: `P95 latency is ${metrics.apiLatency}ms — above 200ms. Add Redis caching to reduce DB load on hot endpoints.`,
      impact: "Reduce latency 60–80%", effort: "Medium",
      metric: "apiLatency", currentValue: metrics.apiLatency, targetValue: 50,
    });
  }

  if (metrics.errorRate > 2) {
    recs.push({
      id: "rec-circuit-breaker", category: "Reliability", priority: "critical",
      title: "Enable Circuit Breakers",
      description: `Error rate is ${metrics.errorRate.toFixed(2)}%. Circuit breakers will prevent cascading failures across services.`,
      impact: "Reduce error propagation by 90%", effort: "Medium",
      metric: "errorRate", currentValue: metrics.errorRate, targetValue: 0.5,
    });
  }

  if (metrics.requestThroughput > 5000) {
    recs.push({
      id: "rec-load-balance", category: "Load Balancing", priority: "medium",
      title: "Optimize Load Balancer Config",
      description: `Throughput is ${metrics.requestThroughput.toFixed(0)} req/s. Enable least-connections and increase connection pool.`,
      impact: "Even traffic distribution", effort: "Low",
      metric: "requestThroughput", currentValue: metrics.requestThroughput, targetValue: 3000,
    });
  }

  recs.push({
    id: "rec-db-index", category: "Database", priority: "medium",
    title: "Optimize Database Indexes",
    description: "Run EXPLAIN ANALYZE on slow queries. Add composite indexes on frequently joined columns.",
    impact: "Reduce query time by 50%", effort: "Medium",
    metric: "apiLatency", currentValue: metrics.apiLatency, targetValue: 30,
  });

  recs.push({
    id: "rec-replicas", category: "Scaling", priority: "low",
    title: "Increase Service Replicas",
    description: "Running single replicas for critical services. Increase to 3 replicas for high availability.",
    impact: "99.99% uptime SLA", effort: "Low",
    metric: "uptime", currentValue: metrics.uptime, targetValue: 99.99,
  });

  return recs;
}
