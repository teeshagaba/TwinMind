import { useState } from "react";
import { 
  useListReports, 
  useGetReport,
  useGenerateReport,
  getListReportsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  FileText, 
  AlertTriangle, 
  Activity, 
  Zap, 
  Search,
  Download,
  Loader2,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const REPORT_TYPES = [
  { id: "incident", label: "Incident Post-Mortem", icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  { id: "health", label: "System Health Summary", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  { id: "optimization", label: "Resource Optimization", icon: Zap, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  { id: "deployment_risk", label: "Deployment Risk", icon: FileText, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { id: "root_cause", label: "Root Cause Analysis", icon: Search, color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/20" },
];

export default function Reports() {
  const queryClient = useQueryClient();
  const { data: reports = [] } = useListReports();
  const [activeReportId, setActiveReportId] = useState<number | null>(null);
  
  const { data: activeReport, isLoading: isReportLoading } = useGetReport(activeReportId as number, { 
    query: { enabled: !!activeReportId } 
  });
  
  const generateReport = useGenerateReport();

  const handleGenerate = (type: any) => {
    generateReport.mutate({ data: { type } }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListReportsQueryKey() });
        setActiveReportId(data.id);
      }
    });
  };

  return (
    <div className="flex h-full bg-[#0a0f1e]">
      {/* Sidebar: Report Generation & History */}
      <div className="w-80 border-r border-border/50 flex flex-col bg-card/30 backdrop-blur-xl">
        <div className="p-4 border-b border-border/50 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Generate Report</h2>
          <div className="grid grid-cols-1 gap-2">
            {REPORT_TYPES.map(type => (
              <Button
                key={type.id}
                variant="outline"
                className={`w-full justify-start h-10 ${type.bg} ${type.border} hover:bg-white/10`}
                onClick={() => handleGenerate(type.id)}
                disabled={generateReport.isPending}
                data-testid={`btn-generate-${type.id}`}
              >
                <type.icon className={`mr-2 h-4 w-4 ${type.color}`} />
                <span className="text-xs font-medium text-foreground">{type.label}</span>
              </Button>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-background/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50">
          Document Archive
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {reports.map(report => {
              const typeInfo = REPORT_TYPES.find(t => t.id === report.type) || REPORT_TYPES[1];
              const Icon = typeInfo.icon;
              
              return (
                <div 
                  key={report.id}
                  onClick={() => setActiveReportId(report.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    activeReportId === report.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${typeInfo.color}`} />
                    <div className="space-y-1 overflow-hidden">
                      <p className="text-sm font-medium text-foreground truncate">{report.title}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(report.createdAt), "MMM d, yyyy HH:mm")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Area: Report Viewer */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-background">
        {generateReport.isPending && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-bold">AI synthesizing data...</h2>
            <p className="text-muted-foreground mt-2">Compiling telemetry across all systems</p>
          </div>
        )}

        {activeReport ? (
          <>
            <div className="h-16 border-b border-border/50 flex items-center justify-between px-6 bg-card/20 backdrop-blur-md">
              <div className="space-y-1">
                <h2 className="text-lg font-bold">{activeReport.title}</h2>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  Generated {format(new Date(activeReport.createdAt), "MMM d, yyyy 'at' HH:mm:ss")}
                </p>
              </div>
              <Button variant="outline" size="sm" className="bg-white/5 border-white/10">
                <Download className="h-4 w-4 mr-2" /> Export
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-8">
              <div className="max-w-4xl mx-auto">
                <Card className="bg-card/30 border-border/50 shadow-xl">
                  <CardContent className="p-8 prose prose-invert prose-primary max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeReport.content}
                    </ReactMarkdown>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <FileText className="h-16 w-16 mb-4 opacity-20" />
            <p>Select a report from the archive or generate a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}