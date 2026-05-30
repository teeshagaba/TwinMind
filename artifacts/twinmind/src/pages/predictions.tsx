import { useGetPredictions, useGetPredictionHistory } from "@workspace/api-client-react";
import { motion } from "framer-motion";
import { 
  AlertTriangle, 
  Activity, 
  Database, 
  Server, 
  Network,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Predictions() {
  const { data: prediction } = useGetPredictions({ query: { refetchInterval: 10000 } });
  const { data: history = [] } = useGetPredictionHistory();

  const getRiskColor = (level: string = "") => {
    switch (level.toLowerCase()) {
      case "low": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "high": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "critical": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      default: return "text-slate-500 bg-slate-500/10 border-slate-500/20";
    }
  };

  const getStrokeColor = (level: string = "") => {
    switch (level.toLowerCase()) {
      case "low": return "hsl(142.1 76.2% 36.3%)"; // emerald-500
      case "medium": return "hsl(45.4 93.4% 47.5%)"; // amber-500
      case "high": return "hsl(24.6 95% 53.1%)"; // orange-500
      case "critical": return "hsl(346.8 77.2% 49.8%)"; // rose-500
      default: return "hsl(215.4 16.3% 46.9%)"; // slate-500
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Failure Prediction</h1>
          <p className="text-sm text-muted-foreground">Proactive infrastructure intelligence engine</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="lg:col-span-1 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-md border-border/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 to-transparent pointer-events-none" />
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Global Risk Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center pb-8 pt-4">
                <div className="relative flex items-center justify-center w-48 h-48 mb-4">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="96" cy="96" r="86" stroke="hsl(var(--muted))" strokeWidth="12" fill="none" />
                    <circle 
                      cx="96" cy="96" r="86" 
                      stroke={getStrokeColor(prediction?.riskLevel)} 
                      strokeWidth="12" fill="none" 
                      strokeDasharray="540.35"
                      strokeDashoffset={540.35 - (540.35 * (prediction?.riskScore || 0)) / 100}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-6xl font-bold tracking-tighter text-white">{prediction?.riskScore?.toFixed(0) || 0}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`px-4 py-1.5 text-sm uppercase tracking-wider font-semibold ${getRiskColor(prediction?.riskLevel)}`}>
                  {prediction?.riskLevel || "Unknown"} RISK
                </Badge>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-md border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase tracking-wider flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> AI Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/5 border border-primary/20 rounded-md p-4 text-sm text-primary-foreground leading-relaxed font-medium">
                  {prediction?.recommendation || "System is healthy. No actions required."}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" animate="show" className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <ProbabilityCard title="Failure Probability" value={prediction?.failureProbability || 0} icon={AlertTriangle} />
            <ProbabilityCard title="Crash Probability" value={prediction?.crashProbability || 0} icon={Server} />
            <ProbabilityCard title="Overload Probability" value={prediction?.overloadProbability || 0} icon={Network} />
            <ProbabilityCard title="AI Confidence" value={prediction?.confidenceScore || 0} icon={Activity} isConfidence />
          </div>

          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-md border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase tracking-wider">Risk Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="timestamp" tickFormatter={(t) => format(new Date(t), "HH:mm")} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} labelFormatter={(t) => format(new Date(t), "HH:mm:ss")} />
                      <Line type="monotone" dataKey="riskScore" stroke="hsl(var(--secondary))" dot={false} name="Risk Score" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <Card className="bg-card/50 backdrop-blur-md border-border/50">
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase tracking-wider">Contributing Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {prediction?.factors?.length ? prediction.factors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-md border border-white/5">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground/90">{factor}</span>
                    </li>
                  )) : (
                    <li className="flex items-start gap-3 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20 text-emerald-500">
                      <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
                      <span className="text-sm">No significant risk factors identified.</span>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function ProbabilityCard({ title, value, icon: Icon, isConfidence = false }: { title: string, value: number, icon: any, isConfidence?: boolean }) {
  const color = isConfidence ? "hsl(var(--primary))" : "hsl(var(--chart-5))";
  
  return (
    <motion.div variants={itemVariants}>
      <Card className="bg-card/50 backdrop-blur-md border-border/50">
        <CardContent className="p-5 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {title}
            </p>
            <p className="text-2xl font-bold font-mono tracking-tight">{value.toFixed(1)}%</p>
          </div>
          <div className="relative w-12 h-12">
             <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r="20" stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
                <circle 
                  cx="24" cy="24" r="20" 
                  stroke={color} 
                  strokeWidth="4" fill="none" 
                  strokeDasharray="125.6"
                  strokeDashoffset={125.6 - (125.6 * value) / 100}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}