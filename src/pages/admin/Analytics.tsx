import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  PieChart,
  Activity,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface AnalyticsData {
  totalComplaints: number;
  resolvedComplaints: number;
  avgResolutionTime: number;
  complaintsByStatus: { name: string; value: number; color: string }[];
  complaintsByPriority: { name: string; value: number; color: string }[];
  complaintsByCategory: { name: string; count: number }[];
  weeklyTrend: { day: string; complaints: number; resolved: number }[];
  resolutionRate: number;
  pendingComplaints: number;
}

const statusColors: Record<string, string> = {
  open: "#3B82F6",
  in_progress: "#F59E0B",
  under_review: "#8B5CF6",
  resolved: "#10B981",
  closed: "#6B7280",
  rejected: "#EF4444",
};

const priorityColors: Record<string, string> = {
  low: "#10B981",
  medium: "#F59E0B",
  high: "#F97316",
  urgent: "#EF4444",
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all complaints
      const { data: complaints } = await supabase
        .from("complaints")
        .select("*, category:categories(name)");

      if (!complaints) return;

      // Calculate stats
      const totalComplaints = complaints.length;
      const resolvedComplaints = complaints.filter(c => 
        ["resolved", "closed"].includes(c.status)
      ).length;
      const pendingComplaints = complaints.filter(c => 
        !["resolved", "closed", "rejected"].includes(c.status)
      ).length;

      // Complaints by status
      const statusCounts: Record<string, number> = {};
      complaints.forEach(c => {
        statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
      });
      const complaintsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.replace("_", " "),
        value,
        color: statusColors[name] || "#6B7280",
      }));

      // Complaints by priority
      const priorityCounts: Record<string, number> = {};
      complaints.forEach(c => {
        priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
      });
      const complaintsByPriority = Object.entries(priorityCounts).map(([name, value]) => ({
        name,
        value,
        color: priorityColors[name] || "#6B7280",
      }));

      // Complaints by category
      const categoryCounts: Record<string, number> = {};
      complaints.forEach(c => {
        const categoryName = (c.category as any)?.name || "Uncategorized";
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });
      const complaintsByCategory = Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Weekly trend (last 7 days)
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const weeklyTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));
        
        const dayComplaints = complaints.filter(c => {
          const created = new Date(c.created_at);
          return created >= dayStart && created <= dayEnd;
        }).length;
        
        const dayResolved = complaints.filter(c => {
          if (!c.resolved_at) return false;
          const resolved = new Date(c.resolved_at);
          return resolved >= dayStart && resolved <= dayEnd;
        }).length;

        weeklyTrend.push({
          day: days[new Date(dayStart).getDay()],
          complaints: dayComplaints,
          resolved: dayResolved,
        });
      }

      // Average resolution time
      const resolvedWithTime = complaints.filter(c => c.resolved_at);
      const avgResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((acc, c) => {
            const created = new Date(c.created_at).getTime();
            const resolved = new Date(c.resolved_at).getTime();
            return acc + (resolved - created) / (1000 * 60 * 60);
          }, 0) / resolvedWithTime.length
        : 0;

      const resolutionRate = totalComplaints > 0
        ? Math.round((resolvedComplaints / totalComplaints) * 100)
        : 0;

      setData({
        totalComplaints,
        resolvedComplaints,
        avgResolutionTime,
        complaintsByStatus,
        complaintsByPriority,
        complaintsByCategory,
        weeklyTrend,
        resolutionRate,
        pendingComplaints,
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
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">Insights and statistics about complaint management</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Rate</CardTitle>
              <TrendingUp className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{data.resolutionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {data.resolvedComplaints} of {data.totalComplaints} resolved
              </p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              <AlertCircle className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{data.pendingComplaints}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting resolution</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Resolution</CardTitle>
              <Clock className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.avgResolutionTime < 24
                  ? `${Math.round(data.avgResolutionTime)}h`
                  : `${Math.round(data.avgResolutionTime / 24)}d`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Average time to resolve</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <Activity className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalComplaints}</div>
              <p className="text-xs text-muted-foreground mt-1">All time complaints</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Trend */}
          <Card className="glass-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Weekly Trend
              </CardTitle>
              <CardDescription>Complaints created and resolved this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.weeklyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="complaints"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      dot={{ fill: "#8B5CF6" }}
                      name="Created"
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: "#10B981" }}
                      name="Resolved"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* By Category */}
          <Card className="glass-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                By Category
              </CardTitle>
              <CardDescription>Complaints distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.complaintsByCategory} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Status */}
          <Card className="glass-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                By Status
              </CardTitle>
              <CardDescription>Current status distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={data.complaintsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.complaintsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* By Priority */}
          <Card className="glass-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                By Priority
              </CardTitle>
              <CardDescription>Priority level distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={data.complaintsByPriority}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.complaintsByPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
