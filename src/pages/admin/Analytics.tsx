import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Loader2, TrendingUp, Clock, CheckCircle2, AlertCircle, BarChart3, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";

interface AnalyticsData {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  avgResolutionTime: number;
  avgFirstResponseTime: number;
  resolutionRate: number;
  slaCompliance: number;
  complaintsByStatus: { name: string; value: number }[];
  complaintsByPriority: { name: string; value: number }[];
  complaintsByCategory: { name: string; value: number }[];
  weeklyTrend: { week: string; created: number; resolved: number }[];
  responseTimeTrend: { date: string; avgTime: number }[];
  slaPerformance: { month: string; met: number; breached: number; atRisk: number }[];
}

const statusColors: Record<string, string> = {
  Open: "#3b82f6",
  "In progress": "#f59e0b",
  "Under review": "#8b5cf6",
  Resolved: "#10b981",
  Closed: "#6b7280",
  Rejected: "#ef4444",
};

const priorityColors: Record<string, string> = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#f97316",
  Urgent: "#ef4444",
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const applyPreset = (preset: string) => {
    setDateRange(preset);
    const now = new Date();
    switch (preset) {
      case "7d":
        setDateFrom(subDays(now, 7)); setDateTo(now); break;
      case "30d":
        setDateFrom(subDays(now, 30)); setDateTo(now); break;
      case "90d":
        setDateFrom(subDays(now, 90)); setDateTo(now); break;
      case "this_month":
        setDateFrom(startOfMonth(now)); setDateTo(endOfMonth(now)); break;
      case "last_month":
        const last = subMonths(now, 1);
        setDateFrom(startOfMonth(last)); setDateTo(endOfMonth(last)); break;
      default:
        setDateFrom(undefined); setDateTo(undefined);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateFrom, dateTo]);
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, () => {
        fetchAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: complaints, error } = await supabase
        .from("complaints")
        .select(`
          *,
          categories (name)
        `);

      if (error) throw error;

      const totalComplaints = complaints?.length || 0;
      const resolvedComplaints =
        complaints?.filter((c) => c.status === "resolved" || c.status === "closed").length || 0;
      const pendingComplaints =
        complaints?.filter((c) => c.status === "open" || c.status === "in_progress").length || 0;

      // Calculate average resolution time
      const resolvedWithTime = complaints?.filter(
        (c) => c.resolved_at && (c.status === "resolved" || c.status === "closed")
      ) || [];
      
      const totalResolutionTime = resolvedWithTime.reduce((acc, c) => {
        const created = new Date(c.created_at).getTime();
        const resolved = new Date(c.resolved_at!).getTime();
        return acc + (resolved - created);
      }, 0);

      const avgResolutionTime =
        resolvedWithTime.length > 0
          ? Math.round(totalResolutionTime / resolvedWithTime.length / (1000 * 60 * 60))
          : 0;

      // Calculate average first response time
      const withFirstResponse = complaints?.filter(c => c.first_response_at) || [];
      const totalFirstResponseTime = withFirstResponse.reduce((acc, c) => {
        const created = new Date(c.created_at).getTime();
        const responded = new Date(c.first_response_at!).getTime();
        return acc + (responded - created);
      }, 0);

      const avgFirstResponseTime =
        withFirstResponse.length > 0
          ? Math.round(totalFirstResponseTime / withFirstResponse.length / (1000 * 60 * 60))
          : 0;

      const resolutionRate =
        totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

      // Calculate SLA compliance
      const withSLA = complaints?.filter(c => c.sla_status) || [];
      const slaMetCount = withSLA.filter(c => c.sla_status === 'met' || c.sla_status === 'on_track').length;
      const slaCompliance = withSLA.length > 0 ? Math.round((slaMetCount / withSLA.length) * 100) : 0;

      // Group by status
      const statusCounts = complaints?.reduce((acc, c) => {
        const status = c.status.replace("_", " ");
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const complaintsByStatus = Object.entries(statusCounts || {}).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      // Group by priority
      const priorityCounts = complaints?.reduce((acc, c) => {
        acc[c.priority] = (acc[c.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const complaintsByPriority = Object.entries(priorityCounts || {}).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      // Group by category
      const categoryCounts = complaints?.reduce((acc, c) => {
        const categoryName = c.categories?.name || "Uncategorized";
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const complaintsByCategory = Object.entries(categoryCounts || {}).map(([name, value]) => ({
        name,
        value,
      }));

      // Weekly trend
      const now = new Date();
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const created =
          complaints?.filter((c) => {
            const date = new Date(c.created_at);
            return date >= weekStart && date < weekEnd;
          }).length || 0;

        const resolved =
          complaints?.filter((c) => {
            if (!c.resolved_at) return false;
            const date = new Date(c.resolved_at);
            return date >= weekStart && date < weekEnd;
          }).length || 0;

        weeklyData.push({
          week: `Week ${7 - i}`,
          created,
          resolved,
        });
      }

      // Response time trend (last 30 days)
      const responseTimeTrend = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayComplaints = complaints?.filter(c => {
          if (!c.first_response_at) return false;
          const responseDate = new Date(c.first_response_at).toISOString().split('T')[0];
          return responseDate === dateStr;
        }) || [];

        if (dayComplaints.length > 0) {
          const avgTime = dayComplaints.reduce((acc, c) => {
            const created = new Date(c.created_at).getTime();
            const responded = new Date(c.first_response_at!).getTime();
            return acc + (responded - created) / (1000 * 60 * 60);
          }, 0) / dayComplaints.length;

          responseTimeTrend.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            avgTime: Math.round(avgTime * 10) / 10
          });
        }
      }

      // SLA performance by month (last 6 months)
      const slaPerformance = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now);
        monthDate.setMonth(now.getMonth() - i);
        const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short' });

        const monthComplaints = complaints?.filter(c => {
          const created = new Date(c.created_at);
          return created.getMonth() === monthDate.getMonth() && 
                 created.getFullYear() === monthDate.getFullYear();
        }) || [];

        const met = monthComplaints.filter(c => c.sla_status === 'met' || c.sla_status === 'on_track').length;
        const breached = monthComplaints.filter(c => c.sla_status === 'breached').length;
        const atRisk = monthComplaints.filter(c => c.sla_status === 'at_risk').length;

        slaPerformance.push({ month: monthStr, met, breached, atRisk });
      }

      setData({
        totalComplaints,
        resolvedComplaints,
        pendingComplaints,
        avgResolutionTime,
        avgFirstResponseTime,
        resolutionRate,
        slaCompliance,
        complaintsByStatus,
        complaintsByPriority,
        complaintsByCategory,
        weeklyTrend: weeklyData,
        responseTimeTrend,
        slaPerformance,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Real-time insights and performance metrics</p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="glass-effect border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalComplaints}</div>
              <p className="text-xs text-muted-foreground">All time complaints</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.resolutionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {data.resolvedComplaints} resolved
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.avgFirstResponseTime}h</div>
              <p className="text-xs text-muted-foreground">First response time</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.avgResolutionTime}h</div>
              <p className="text-xs text-muted-foreground">Time to resolve</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.slaCompliance}%</div>
              <p className="text-xs text-muted-foreground">Within SLA targets</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <CardTitle>Weekly Trend</CardTitle>
              <CardDescription>Complaints created vs resolved</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="created" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Created" />
                  <Area type="monotone" dataKey="resolved" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <CardTitle>Response Time Trend</CardTitle>
              <CardDescription>Average first response time (hours)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.responseTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgTime" stroke="#EC4899" strokeWidth={2} name="Avg Hours" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* SLA Performance */}
        <Card className="glass-effect border-primary/20">
          <CardHeader>
            <CardTitle>SLA Performance by Month</CardTitle>
            <CardDescription>SLA compliance tracking over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.slaPerformance}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="met" fill="#10b981" name="Met SLA" />
                <Bar dataKey="atRisk" fill="#f59e0b" name="At Risk" />
                <Bar dataKey="breached" fill="#ef4444" name="Breached" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <CardTitle>Complaints by Category</CardTitle>
              <CardDescription>Distribution across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.complaintsByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="glass-effect border-primary/20">
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Current complaint statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.complaintsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.complaintsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.name] || "#8B5CF6"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Priority Distribution */}
        <Card className="glass-effect border-primary/20">
          <CardHeader>
            <CardTitle>Priority Distribution</CardTitle>
            <CardDescription>Complaints by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.complaintsByPriority}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#EC4899">
                  {data.complaintsByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={priorityColors[entry.name] || "#EC4899"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}