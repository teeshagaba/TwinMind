import { useState } from "react";
import { 
  useListSimulations, 
  useGetActiveSimulation,
  useStartSimulation,
  useStopSimulation,
  useGetMetrics,
  getListSimulationsQueryKey,
  getGetActiveSimulationQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Play, 
  Square, 
  Users, 
  ServerCrash, 
  Database, 
  Network, 
  Cpu, 
  Activity,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const MODES = [
  { id: "normal", name: "Normal Traffic", icon: Users, desc: "Baseline traffic patterns", risk: "low" },
  { id: "high_traffic", name: "High Traffic Load", icon: Activity, desc: "10x normal traffic volume", risk: "medium" },
  { id: "database_failure", name: "Database Failure", icon: Database, desc: "Simulate primary DB node crash", risk: "critical" },
  { id: "server_crash", name: "Server Crash", icon: ServerCrash, desc: "Random worker node termination", risk: "high" },
  { id: "api_overload", name: "API Overload", icon: Network, desc: "Saturate gateway endpoints", risk: "high" },
  { id: "ddos_attack", name: "DDoS Attack", icon: AlertTriangle, desc: "Distributed denial of service", risk: "critical" },
  { id: "memory_leak", name: "Memory Leak", icon: Cpu, desc: "Gradual RAM exhaustion", risk: "medium" },
];

export default function Simulation() {
  const queryClient = useQueryClient();
  const { data: simulations = [] } = useListSimulations({ query: { refetchInterval: 5000 } });
  const { data: activeSim } = useGetActiveSimulation({ query: { refetchInterval: 3000 } });
  const { data: metrics } = useGetMetrics({ query: { refetchInterval: 3000 } });
  
  const startSim = useStartSimulation();
  const stopSim = useStopSimulation();

  const [selectedMode, setSelectedMode] = useState<string>("high_traffic");

  const handleStart = () => {
    startSim.mutate({ data: { mode: selectedMode as any } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetActiveSimulationQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSimulationsQueryKey() });
      }
    });
  };

  const handleStop = () => {
    if (!activeSim) return;
    stopSim.mutate({ id: activeSim.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetActiveSimulationQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListSimulationsQueryKey() });
      }
    });
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "medium": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "high": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "critical": return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default: return "bg-slate-500/10 text-slate-500";
    }
  };

  const isSimRunning = activeSim && activeSim.status === "running";

  return (
    <div className={`p-6 md:p-8 max-w-7xl mx-auto space-y-6 min-h-full transition-colors duration-1000 ${isSimRunning ? 'bg-destructive/5' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Simulation Control Center</h1>
          <p className="text-sm text-muted-foreground">Stress test infrastructure with chaotic scenarios</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MODES.map((mode) => (
              <Card 
                key={mode.id}
                className={`cursor-pointer transition-all border-border/50 backdrop-blur-sm ${selectedMode === mode.id ? 'ring-2 ring-primary bg-primary/5' : 'bg-card/30 hover:bg-card/50'}`}
                onClick={() => !isSimRunning && setSelectedMode(mode.id)}
                data-testid={`card-mode-${mode.id}`}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`p-2 rounded-md ${selectedMode === mode.id ? 'bg-primary/20 text-primary' : 'bg-white/5 text-muted-foreground'}`}>
                    <mode.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm">{mode.name}</p>
                      <Badge variant="outline" className={`text-[10px] uppercase tracking-wider ${getRiskColor(mode.risk)}`}>
                        {mode.risk}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{mode.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Card className={`border-border/50 backdrop-blur-md overflow-hidden relative ${isSimRunning ? 'border-destructive/50 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'bg-card/50'}`}>
            {isSimRunning && (
              <div className="absolute inset-0 bg-destructive/10 animate-pulse pointer-events-none" />
            )}
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center justify-between">
                Execution Engine
                {isSimRunning && <Badge variant="destructive" className="animate-pulse">ACTIVE</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                  <span>Selected Scenario</span>
                  <span className={isSimRunning ? "text-destructive" : "text-primary"}>
                    {isSimRunning ? activeSim.mode : MODES.find(m => m.id === selectedMode)?.name}
                  </span>
                </div>
              </div>

              {isSimRunning ? (
                <Button 
                  onClick={handleStop} 
                  disabled={stopSim.isPending}
                  variant="destructive"
                  className="w-full h-12 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                  data-testid="button-stop-sim"
                >
                  {stopSim.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Square className="mr-2 h-4 w-4 fill-current" />}
                  TERMINATE SIMULATION
                </Button>
              ) : (
                <Button 
                  onClick={handleStart} 
                  disabled={startSim.isPending}
                  className="w-full h-12 bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 shadow-[0_0_15px_rgba(0,212,255,0.2)]"
                  data-testid="button-start-sim"
                >
                  {startSim.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
                  EXECUTE SEQUENCE
                </Button>
              )}

              {isSimRunning && metrics && (
                <div className="pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider">CPU Spike</span>
                    <p className="text-lg font-mono text-destructive">{metrics.cpuUsage.toFixed(1)}%</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-muted-foreground tracking-wider">Error Rate</span>
                    <p className="text-lg font-mono text-destructive">{metrics.errorRate.toFixed(1)}%</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-md border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-wider">Recent Executions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {simulations.slice(0, 5).map(sim => (
                <div key={sim.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{MODES.find(m => m.id === sim.mode)?.name || sim.mode}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(sim.startedAt), "MMM d, HH:mm:ss")}</p>
                  </div>
                  <Badge variant="outline" className={sim.status === 'running' ? 'text-destructive border-destructive/50' : 'text-muted-foreground'}>
                    {sim.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}