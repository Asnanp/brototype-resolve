import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";

interface DashboardChartsProps {
  weeklyTrend: { week: string; created: number; resolved: number }[];
  statusDistribution: { name: string; value: number }[];
  priorityDistribution: { name: string; value: number }[];
  categoryDistribution: { name: string; value: number }[];
  resolutionRate: number;
  slaCompliance: number;
}

const STATUS_COLORS: Record<string, string> = {
  Open: "#3b82f6",
  "In progress": "#f59e0b",
  "Under review": "#8b5cf6",
  Resolved: "#10b981",
  Closed: "#6b7280",
  Rejected: "#ef4444",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#f97316",
  Urgent: "#ef4444",
};

const CATEGORY_COLORS = ["#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#14B8A6"];

export function DashboardCharts({
  weeklyTrend,
  statusDistribution,
  priorityDistribution,
  categoryDistribution,
  resolutionRate,
  slaCompliance,
}: DashboardChartsProps) {
  const gaugeData = [
    { name: "Resolution", value: resolutionRate, fill: "#10b981" },
    { name: "SLA", value: slaCompliance, fill: "#8B5CF6" },
  ];

  return (
    <div className="space-y-6">
      {/* Row 1: Trend + Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-strong border-border/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Complaint Trend</CardTitle>
            <CardDescription>Created vs resolved over 7 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyTrend}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
                <XAxis dataKey="week" tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(240 8% 12% / 0.9)",
                    border: "1px solid hsl(240 6% 20%)",
                    borderRadius: "0.5rem",
                    color: "hsl(0 0% 98%)",
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="created" stroke="#8B5CF6" fill="url(#colorCreated)" strokeWidth={2} name="Created" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#colorResolved)" strokeWidth={2} name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-strong border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance</CardTitle>
            <CardDescription>Resolution & SLA rates</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={gaugeData} startAngle={180} endAngle={0}>
                <RadialBar background dataKey="value" cornerRadius={10} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(240 8% 12% / 0.9)",
                    border: "1px solid hsl(240 6% 20%)",
                    borderRadius: "0.5rem",
                    color: "hsl(0 0% 98%)",
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="flex gap-6 text-sm -mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-muted-foreground">Resolution {resolutionRate}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">SLA {slaCompliance}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-strong border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {statusDistribution.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] || CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(240 8% 12% / 0.9)",
                    border: "1px solid hsl(240 6% 20%)",
                    borderRadius: "0.5rem",
                    color: "hsl(0 0% 98%)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-strong border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
                <XAxis dataKey="name" tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 11 }} />
                <YAxis tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(240 8% 12% / 0.9)",
                    border: "1px solid hsl(240 6% 20%)",
                    borderRadius: "0.5rem",
                    color: "hsl(0 0% 98%)",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {priorityDistribution.map((entry, i) => (
                    <Cell key={i} fill={PRIORITY_COLORS[entry.name] || "#8B5CF6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-strong border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
                <XAxis type="number" tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(240 8% 12% / 0.9)",
                    border: "1px solid hsl(240 6% 20%)",
                    borderRadius: "0.5rem",
                    color: "hsl(0 0% 98%)",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {categoryDistribution.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
