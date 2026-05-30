import { useAdminListUsers, useAdminGetStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Activity, 
  FileText, 
  AlertTriangle,
  Database,
  Cpu
} from "lucide-react";
import { format } from "date-fns";

export default function Admin() {
  const { data: stats } = useAdminGetStats();
  const { data: users = [] } = useAdminListUsers();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Administration</h1>
        <p className="text-sm text-muted-foreground">Global oversight and user management</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} />
        <StatCard title="Simulations" value={stats?.totalSimulations || 0} icon={Activity} />
        <StatCard title="Reports Gen." value={stats?.totalReports || 0} icon={FileText} />
        <StatCard title="Alerts Fired" value={stats?.totalAlerts || 0} icon={AlertTriangle} />
        <StatCard title="Active Sims" value={stats?.activeSimulations || 0} icon={Database} color="text-destructive" />
        <StatCard title="AI Requests (24h)" value={stats?.aiRequestsToday || 0} icon={Cpu} color="text-secondary" />
      </div>

      <Card className="bg-card/50 backdrop-blur-md border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider">User Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-muted-foreground text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium border-b border-border/50">ID</th>
                  <th className="px-4 py-3 font-medium border-b border-border/50">Email</th>
                  <th className="px-4 py-3 font-medium border-b border-border/50">Role</th>
                  <th className="px-4 py-3 font-medium border-b border-border/50">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-muted-foreground">#{u.id}</td>
                    <td className="px-4 py-3 text-foreground font-medium">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={u.role === 'admin' ? 'bg-secondary/10 text-secondary border-secondary/20' : 'bg-primary/10 text-primary border-primary/20'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{format(new Date(u.createdAt), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "text-muted-foreground" }: { title: string, value: number, icon: any, color?: string }) {
  return (
    <Card className="bg-card/50 backdrop-blur-md border-border/50">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{title}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="text-2xl font-bold tracking-tight font-mono text-white">
          {value}
        </div>
      </CardContent>
    </Card>
  );
}