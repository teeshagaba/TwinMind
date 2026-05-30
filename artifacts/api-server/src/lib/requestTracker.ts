import { type Request, type Response, type NextFunction } from "express";

interface RequestSample {
  duration: number;
  isError: boolean;
  timestamp: number;
}

const WINDOW_MS = 60_000;
const samples: RequestSample[] = [];

export function requestTrackerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 500;
    const now = Date.now();
    samples.push({ duration, isError, timestamp: now });
    const cutoff = now - WINDOW_MS;
    while (samples.length > 0 && samples[0].timestamp < cutoff) samples.shift();
  });
  next();
}

export function getRequestStats(): { latencyP50: number; latencyP95: number; throughputPerSec: number; errorRate: number } {
  const now = Date.now();
  const window10s = samples.filter(s => s.timestamp > now - 10_000);
  const window60s = samples.filter(s => s.timestamp > now - WINDOW_MS);

  if (window10s.length === 0) {
    return { latencyP50: 0, latencyP95: 0, throughputPerSec: 0, errorRate: 0 };
  }

  const sorted = [...window10s].map(s => s.duration).sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const throughputPerSec = window10s.length / 10;

  const errors60 = window60s.filter(s => s.isError).length;
  const errorRate = window60s.length > 0 ? (errors60 / window60s.length) * 100 : 0;

  return { latencyP50: p50, latencyP95: p95, throughputPerSec, errorRate };
}
