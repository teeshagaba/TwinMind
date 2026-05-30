// Synthetic metrics generation engine with simulation modes

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

function noise(base: number, spread: number): number {
  return base + (Math.random() - 0.5) * spread;
}

export function generateMetrics() {
  const elapsed = (Date.now() - simulationStartTime) / 1000;

  if (currentSimulation === "memory_leak") {
    memoryLeakAccumulator = Math.min(elapsed * 0.5, 45);
  }

  let cpu = noise(35, 15);
  let memory = noise(52, 12);
  let disk = noise(48, 5);
  let latency = noise(45, 20);
  let errorRate = noise(0.5, 0.5);
  let throughput = noise(1200, 300);
  let activeServices = 12;
  let uptime = 99.97;
  let networkIn = noise(150, 50);
  let networkOut = noise(80, 30);

  switch (currentSimulation) {
    case "normal":
      cpu = noise(30, 10);
      memory = noise(48, 8);
      latency = noise(38, 10);
      errorRate = noise(0.2, 0.2);
      throughput = noise(1400, 200);
      break;

    case "high_traffic":
      cpu = noise(78, 10);
      memory = noise(72, 8);
      latency = noise(180, 40);
      errorRate = noise(2.5, 1.0);
      throughput = noise(4500, 500);
      networkIn = noise(820, 100);
      networkOut = noise(450, 80);
      break;

    case "database_failure":
      cpu = noise(60, 15);
      memory = noise(75, 10);
      latency = noise(850, 200);
      errorRate = noise(28, 5);
      throughput = noise(200, 80);
      activeServices = 10;
      uptime = 87.3;
      break;

    case "server_crash":
      cpu = clamp(noise(95, 3), 90, 100);
      memory = clamp(noise(94, 3), 90, 100);
      latency = noise(2500, 500);
      errorRate = noise(75, 10);
      throughput = noise(50, 30);
      activeServices = 5;
      uptime = 23.5;
      break;

    case "api_overload":
      cpu = noise(88, 8);
      memory = noise(82, 6);
      latency = noise(650, 150);
      errorRate = noise(18, 4);
      throughput = noise(6800, 600);
      networkIn = noise(1200, 150);
      networkOut = noise(950, 120);
      break;

    case "ddos_attack":
      cpu = noise(96, 2);
      memory = noise(88, 4);
      latency = noise(3200, 800);
      errorRate = noise(85, 8);
      throughput = noise(15000, 2000);
      networkIn = noise(9800, 1000);
      networkOut = noise(500, 100);
      activeServices = 8;
      uptime = 45.2;
      break;

    case "memory_leak":
      cpu = noise(55 + memoryLeakAccumulator * 0.3, 8);
      memory = clamp(52 + memoryLeakAccumulator, 52, 98);
      latency = noise(120 + memoryLeakAccumulator * 1.2, 30);
      errorRate = noise(1.5 + memoryLeakAccumulator * 0.05, 0.5);
      throughput = noise(1000 - memoryLeakAccumulator * 5, 200);
      break;
  }

  return {
    cpuUsage: clamp(cpu, 0, 100),
    memoryUsage: clamp(memory, 0, 100),
    diskUsage: clamp(disk, 0, 100),
    apiLatency: clamp(latency, 5, 10000),
    errorRate: clamp(errorRate, 0, 100),
    requestThroughput: clamp(throughput, 0, 20000),
    activeServices,
    uptime: clamp(uptime, 0, 100),
    networkIn: clamp(networkIn, 0, 15000),
    networkOut: clamp(networkOut, 0, 5000),
    simulationMode: currentSimulation,
  };
}

export function predictFailure(metrics: ReturnType<typeof generateMetrics>) {
  const { cpuUsage, memoryUsage, apiLatency, errorRate, requestThroughput } = metrics;

  const cpuScore = cpuUsage / 100;
  const memScore = memoryUsage / 100;
  const latencyScore = Math.min(apiLatency / 3000, 1);
  const errorScore = Math.min(errorRate / 50, 1);
  const throughputScore = requestThroughput > 10000 ? 0.8 : requestThroughput > 5000 ? 0.4 : 0.1;

  const riskScore = clamp(
    cpuScore * 0.25 + memScore * 0.25 + latencyScore * 0.2 + errorScore * 0.2 + throughputScore * 0.1,
    0,
    1
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

export function generateServices() {
  const mode = currentSimulation;
  const services = [
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

  return services.map((svc) => {
    let status = "healthy";
    let cpu = rand(15, 45);
    let memory = rand(30, 60);
    let latency = rand(5, 50);
    let uptime = rand(99.5, 99.99);
    let replicas = 2;

    if (mode === "server_crash" && (svc.type === "microservice" || svc.id === "api-gateway")) {
      if (Math.random() > 0.4) { status = "critical"; cpu = rand(90, 100); memory = rand(88, 100); uptime = rand(20, 60); }
    } else if (mode === "database_failure" && svc.type === "database") {
      status = svc.id === "postgres-primary" ? "critical" : "warning";
      latency = rand(2000, 5000); uptime = rand(30, 70);
    } else if (mode === "ddos_attack") {
      status = Math.random() > 0.5 ? "warning" : "critical";
      cpu = rand(80, 100); memory = rand(75, 95); latency = rand(500, 4000);
    } else if (mode === "api_overload" && svc.type !== "database") {
      status = "warning"; cpu = rand(70, 95); latency = rand(300, 800);
    } else if (mode === "high_traffic") {
      status = Math.random() > 0.7 ? "warning" : "healthy";
      cpu = rand(55, 85); latency = rand(80, 250); replicas = 4;
    } else if (mode === "memory_leak" && svc.type === "microservice") {
      memory = clamp(52 + memoryLeakAccumulator * 0.8, 52, 96);
      status = memory > 85 ? "warning" : "healthy";
    }

    return {
      ...svc,
      status,
      cpuUsage: clamp(cpu, 0, 100),
      memoryUsage: clamp(memory, 0, 100),
      latency: clamp(latency, 0, 10000),
      uptime: clamp(uptime, 0, 100),
      replicas,
    };
  });
}

export function getHealthScore(metrics: ReturnType<typeof generateMetrics>) {
  const cpuScore = Math.max(0, 100 - metrics.cpuUsage);
  const memScore = Math.max(0, 100 - metrics.memoryUsage);
  const latencyScore = Math.max(0, 100 - (metrics.apiLatency / 30));
  const errorScore = Math.max(0, 100 - metrics.errorRate * 5);
  const uptimeScore = metrics.uptime;

  const score = cpuScore * 0.2 + memScore * 0.2 + latencyScore * 0.2 + errorScore * 0.25 + uptimeScore * 0.15;
  const clampedScore = clamp(Math.round(score), 0, 100);
  const grade = clampedScore >= 90 ? "A" : clampedScore >= 75 ? "B" : clampedScore >= 60 ? "C" : clampedScore >= 40 ? "D" : "F";

  return {
    score: clampedScore,
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

export function generateRecommendations(metrics: ReturnType<typeof generateMetrics>) {
  const recs = [];

  if (metrics.cpuUsage > 70) {
    recs.push({
      id: "rec-cpu-scale",
      category: "Scaling",
      priority: "high",
      title: "Scale CPU Resources",
      description: "CPU utilization is above 70%. Add horizontal replicas or upgrade instance type to prevent performance degradation.",
      impact: "Reduce CPU bottleneck by ~40%",
      effort: "Low",
      metric: "cpuUsage",
      currentValue: metrics.cpuUsage,
      targetValue: 50,
    });
  }

  if (metrics.memoryUsage > 75) {
    recs.push({
      id: "rec-mem-optimize",
      category: "Memory",
      priority: metrics.memoryUsage > 90 ? "critical" : "high",
      title: "Optimize Memory Usage",
      description: "Memory pressure detected. Enable memory profiling, optimize data structures, or increase heap allocation.",
      impact: "Prevent OOM crashes",
      effort: "Medium",
      metric: "memoryUsage",
      currentValue: metrics.memoryUsage,
      targetValue: 60,
    });
  }

  if (metrics.apiLatency > 200) {
    recs.push({
      id: "rec-caching",
      category: "Performance",
      priority: "high",
      title: "Enable Response Caching",
      description: "API latency exceeds 200ms. Implement Redis caching for frequently accessed endpoints to reduce database load.",
      impact: "Reduce latency by 60-80%",
      effort: "Medium",
      metric: "apiLatency",
      currentValue: metrics.apiLatency,
      targetValue: 50,
    });
  }

  if (metrics.errorRate > 2) {
    recs.push({
      id: "rec-circuit-breaker",
      category: "Reliability",
      priority: "critical",
      title: "Enable Circuit Breakers",
      description: "High error rate detected. Implement circuit breaker pattern to prevent cascade failures across services.",
      impact: "Reduce error propagation by 90%",
      effort: "Medium",
      metric: "errorRate",
      currentValue: metrics.errorRate,
      targetValue: 0.5,
    });
  }

  if (metrics.requestThroughput > 5000) {
    recs.push({
      id: "rec-load-balance",
      category: "Load Balancing",
      priority: "medium",
      title: "Optimize Load Balancer Configuration",
      description: "High throughput detected. Enable least-connections algorithm and increase connection pool size.",
      impact: "Even traffic distribution",
      effort: "Low",
      metric: "requestThroughput",
      currentValue: metrics.requestThroughput,
      targetValue: 3000,
    });
  }

  recs.push({
    id: "rec-db-index",
    category: "Database",
    priority: "medium",
    title: "Optimize Database Indexes",
    description: "Run EXPLAIN ANALYZE on slow queries. Add composite indexes on frequently joined columns to reduce query time.",
    impact: "Reduce query time by 50%",
    effort: "Medium",
    metric: "apiLatency",
    currentValue: metrics.apiLatency,
    targetValue: 30,
  });

  recs.push({
    id: "rec-replicas",
    category: "Scaling",
    priority: "low",
    title: "Increase Service Replicas",
    description: "Running single replicas for critical services. Increase to at least 3 replicas for high availability.",
    impact: "99.99% uptime SLA",
    effort: "Low",
    metric: "uptime",
    currentValue: metrics.uptime,
    targetValue: 99.99,
  });

  return recs;
}
