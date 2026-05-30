import { 
  useGetMetrics, 
  useGetHealthScore,
  useGetMetricsHistory,
  useGetAlerts,
  useGetServices,
  useGetActiveSimulation,
  useAcknowledgeAlert,
  getGetAlertsQueryKey,
} from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Clock, 
  AlertCircle, 
  ActivitySquare, 
  Server, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: metrics } = useGetMetrics({ query: { refetchInterval: 3000 } });
  const { data: healthScore } = useGetHealthScore({ query: { refetchInterval: 5000 } });
  const { data: history = [] } = useGetMetricsHistory({ limit: 30 }, { query: { refetchInterval: 3000 } });
  const { data: alerts = [] } = useGetAlerts({ limit: 5 }, { query: { refetchInterval: 5000 } });
  const { data: services = [] } = useGetServices({ query: { refetchInterval: 5000 } });
  const { data: simulation } = useGetActiveSimulation({ query: { refetchInterval: 5000 } });
  const ackAlert = useAcknowledgeAlert();

  const handleAckAlert = (id: number) => {
    ackAlert.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAlertsQueryKey() });
      }
    });
  };

  const getColorClass = (val: number, reverse = false) => {
    const isGood = reverse ? val > 80 : val < 50;
    const isWarn = reverse ? val > 50 && val <= 80 : val >= 50 && val <= 80;
    if (isGood) return "text-emerald-500";
    if (isWarn) return "text-amber-500";
    return "text-rose-500";
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy": return "bg-emerald-500";
      case "warning": return "bg-amber-500";
      case "critical": return "bg-rose-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
          <p className="text-sm text-muted-foreground">Live telemetry and health monitoring</p>
        </div>
        
        {simulation?.status === "running" && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2 rounded-full animate-pulse">
            <Play className="h-4 w-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Simulation Active: {simulation.mode}</span>
          </div>
        )}
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4"
      >
        <MetricCard title="CPU" value={`${metrics?.cpuUsage.toFixed(1) || 0}%`} icon={Cpu} colorClass={getColorClass(metrics?.cpuUsage || 0)} />
        <MetricCard title="Memory" value={`${metrics?.memoryUsage.toFixed(1) || 0}%`} icon={Activity} colorClass={getColorClass(metrics?.memoryUsage || 0)} />
        <MetricCard title="Disk" value={`${metrics?.diskUsage.toFixed(1) || 0}%`} icon={HardDrive} colorClass={getColorClass(metrics?.diskUsage || 0)} />
        <MetricCard title="Latency" value={`${metrics?.apiLatency.toFixed(0) || 0}ms`} icon={Clock} colorClass={getColorClass(metrics?.apiLatency || 0)} />
        <MetricCard title="Errors" value={`${metrics?.errorRate.toFixed(2) || 0}%`} icon={AlertCircle} colorClass={getColorClass(metrics?.errorRate || 0)} />
        <MetricCard title="Req/s" value={`${metrics?.requestThroughput.toFixed(0) || 0}`} icon={ActivitySquare} colorClass="text-primary" />
        <MetricCard title="Services" value={`${metrics?.activeServices || 0}`} icon={Server} colorClass="text-primary" />
        <MetricCard title="Uptime" value={`${metrics?.uptime.toFixed(2) || 0}%`} icon={Zap} colorClass={getColorClass(metrics?.uptime || 100, true)} />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur-md border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-wider">Resource Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="timestamp" tickFormatter={(t) => format(new Date(t), "HH:mm:ss")} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      labelFormatter={(t) => format(new Date(t), "HH:mm:ss")}
                    />
                    <Area type="monotone" dataKey="cpuUsage" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
                    <Area type="monotone" dataKey="memoryUsage" stroke="hsl(var(--secondary))" fillOpacity={1} fill="url(#colorMem)" name="Memory %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur-md border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase tracking-wider">Latency (ms)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Line type="monotone" dataKey="apiLatency" stroke="hsl(var(--chart-3))" dot={false} name="Latency ms" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-md border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase tracking-wider">Throughput (req/s)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                      <Line type="monotone" dataKey="requestThroughput" stroke="hsl(var(--chart-4))" dot={false} name="Req/s" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-md border-border/50 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Health Score</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pb-6">
              <div className="relative flex items-center justify-center w-40 h-40">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                  <circle 
                    cx="80" cy="80" r="70" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="8" fill="none" 
                    strokeDasharray="439.8"
                    strokeDashoffset={439.8 - (439.8 * (healthScore?.score || 0)) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-5xl font-bold tracking-tighter text-white">{healthScore?.grade || "-"}</span>
                  <span className="text-sm text-primary font-mono">{healthScore?.score?.toFixed(1) || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-md border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center justify-between">
                Active Alerts
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  {alerts.filter(a => !a.acknowledged).length} New
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No active alerts.</div>
              ) : alerts.map(alert => (
                <div key={alert.id} className="flex items-start justify-between gap-3 p-3 rounded-md bg-white/5 border border-white/5">
                  <div className="flex gap-3">
                    {alert.severity === "critical" ? <XCircle className="h-5 w-5 text-rose-500 mt-0.5" /> : 
                     alert.severity === "warning" ? <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" /> : 
                     <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />}
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleAckAlert(alert.id)}>
                      Ack
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur-md border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-wider">Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {services.slice(0, 5).map(service => (
                <div key={service.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(service.status)} shadow-[0_0_8px_currentColor]`} />
                    <span className="text-sm font-medium">{service.name}</span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {service.latency}ms
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: any, colorClass?: string }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-card/50 backdrop-blur-md border-border/50 h-full">
        <CardContent className="p-4 flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{title}</span>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className={`text-xl font-bold tracking-tight font-mono ${colorClass || 'text-white'}`}>
            {value}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
