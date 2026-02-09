import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeActivityFeed } from "@/components/admin/RealtimeActivityFeed";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import {
  FileText,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Activity,
  Zap,
  Target,
  ShieldCheck,
  BarChart3,
  Star,
} from "lucide-react";

interface DashboardData {
  totalComplaints: number;
  openComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  closedComplaints: number;
  rejectedComplaints: number;
  totalUsers: number;
  urgentComplaints: number;
  avgResolutionTime: string;
  avgFirstResponse: string;
  todayComplaints: number;
  slaBreaches: number;
  slaMet: number;
  resolutionRate: number;
  slaCompliance: number;
  avgSatisfaction: number;
  weeklyTrend: { week: string; created: number; resolved: number }[];
  statusDistribution: { name: string; value: number }[];
  priorityDistribution: { name: string; value: number }[];
  categoryDistribution: { name: string; value: number }[];
  recentComplaints: any[];
}

const statusColors: Record<string, string> = {
  open: "bg-info/20 text-info border-info/30",
  in_progress: "bg-warning/20 text-warning border-warning/30",
  under_review: "bg-primary/20 text-primary border-primary/30",
  resolved: "bg-success/20 text-success border-success/30",
  closed: "bg-muted text-muted-foreground border-border",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
};

const priorityColors: Record<string, string> = {
  low: "bg-success/20 text-success border-success/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
  urgent: "bg-destructive text-destructive-foreground",
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel("admin-dashboard-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, fetchDashboardData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [complaintsRes, usersRes, surveysRes] = await Promise.all([
        supabase.from("complaints").select("*, categories(name)"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("satisfaction_surveys").select("overall_rating"),
      ]);

      const complaints = complaintsRes.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const total = complaints.length;
      const open = complaints.filter((c) => c.status === "open").length;
      const inProgress = complaints.filter((c) => ["in_progress", "under_review"].includes(c.status)).length;
      const resolved = complaints.filter((c) => c.status === "resolved").length;
      const closed = complaints.filter((c) => c.status === "closed").length;
      const rejected = complaints.filter((c) => c.status === "rejected").length;
      const urgent = complaints.filter((c) => c.priority === "urgent" && !["resolved", "closed", "rejected"].includes(c.status)).length;
      const todayCount = complaints.filter((c) => new Date(c.created_at) >= today).length;

      // Avg resolution time
      const resolvedWithTime = complaints.filter((c) => c.resolved_at);
      const avgResHours = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((acc, c) => acc + (new Date(c.resolved_at!).getTime() - new Date(c.created_at).getTime()) / 3600000, 0) / resolvedWithTime.length
        : 0;

      // Avg first response
      const withResponse = complaints.filter((c) => c.first_response_at);
      const avgRespHours = withResponse.length > 0
        ? withResponse.reduce((acc, c) => acc + (new Date(c.first_response_at!).getTime() - new Date(c.created_at).getTime()) / 3600000, 0) / withResponse.length
        : 0;

      // SLA
      const withSLA = complaints.filter((c) => c.sla_status);
      const slaMet = withSLA.filter((c) => c.sla_status === "met" || c.sla_status === "on_track").length;
      const slaBreaches = withSLA.filter((c) => c.sla_status === "breached").length;
      const slaCompliance = withSLA.length > 0 ? Math.round((slaMet / withSLA.length) * 100) : 100;

      // Satisfaction
      const ratings = surveysRes.data || [];
      const avgSatisfaction = ratings.length > 0
        ? ratings.reduce((acc, r) => acc + r.overall_rating, 0) / ratings.length
        : 0;

      // Status distribution
      const statusCounts = complaints.reduce((acc, c) => {
        const s = c.status.replace("_", " ");
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      // Priority distribution
      const priorityCounts = complaints.reduce((acc, c) => {
        acc[c.priority] = (acc[c.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const priorityDistribution = Object.entries(priorityCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      // Category distribution
      const categoryCounts = complaints.reduce((acc, c) => {
        const cat = (c as any).categories?.name || "Uncategorized";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const categoryDistribution = Object.entries(categoryCounts).map(([name, value]) => ({
        name,
        value,
      }));

      // Weekly trend
      const now = new Date();
      const weeklyTrend = [];
      for (let i = 6; i >= 0; i--) {
        const wStart = new Date(now);
        wStart.setDate(now.getDate() - i * 7);
        const wEnd = new Date(wStart);
        wEnd.setDate(wStart.getDate() + 7);
        weeklyTrend.push({
          week: `W${7 - i}`,
          created: complaints.filter((c) => { const d = new Date(c.created_at); return d >= wStart && d < wEnd; }).length,
          resolved: complaints.filter((c) => { if (!c.resolved_at) return false; const d = new Date(c.resolved_at); return d >= wStart && d < wEnd; }).length,
        });
      }

      // Recent
      const recent = [...complaints]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8);

      // Fetch profiles for recent
      const studentIds = [...new Set(recent.map((c) => c.student_id))];
      let profileMap = new Map<string, any>();
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", studentIds);
        profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      }

      const recentComplaints = recent.map((c) => ({
        ...c,
        profiles: profileMap.get(c.student_id) || null,
      }));

      setData({
        totalComplaints: total,
        openComplaints: open,
        inProgressComplaints: inProgress,
        resolvedComplaints: resolved,
        closedComplaints: closed,
        rejectedComplaints: rejected,
        totalUsers: usersRes.count || 0,
        urgentComplaints: urgent,
        avgResolutionTime: avgResHours < 24 ? `${Math.round(avgResHours)}h` : `${Math.round(avgResHours / 24)}d`,
        avgFirstResponse: avgRespHours < 24 ? `${Math.round(avgRespHours)}h` : `${Math.round(avgRespHours / 24)}d`,
        todayComplaints: todayCount,
        slaBreaches,
        slaMet,
        resolutionRate: total > 0 ? Math.round(((resolved + closed) / total) * 100) : 0,
        slaCompliance,
        avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
        weeklyTrend,
        statusDistribution,
        priorityDistribution,
        categoryDistribution,
        recentComplaints,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground text-sm">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const statCards = [
    { title: "Total", value: data.totalComplaints, icon: FileText, color: "text-primary", bg: "bg-primary/10", sub: `+${data.todayComplaints} today` },
    { title: "Open", value: data.openComplaints, icon: AlertCircle, color: "text-info", bg: "bg-info/10", sub: "Awaiting response" },
    { title: "In Progress", value: data.inProgressComplaints, icon: Clock, color: "text-warning", bg: "bg-warning/10", sub: "Being worked on" },
    { title: "Resolved", value: data.resolvedComplaints, icon: CheckCircle2, color: "text-success", bg: "bg-success/10", sub: `${data.resolutionRate}% rate` },
    { title: "Urgent", value: data.urgentComplaints, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", sub: "Needs attention" },
    { title: "Users", value: data.totalUsers, icon: Users, color: "text-primary", bg: "bg-primary/10", sub: "Total registered" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Command Center</h1>
            <p className="text-muted-foreground">Real-time system overview & analytics</p>
          </div>
          <div className="flex gap-3">
            <Link to="/admin/analytics">
              <Button variant="outline" className="glass border-border/50">
                <BarChart3 className="w-4 h-4 mr-2" />
                Full Analytics
              </Button>
            </Link>
            <Link to="/admin/complaints">
              <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow">
                <FileText className="w-4 h-4 mr-2" />
                All Complaints
              </Button>
            </Link>
          </div>
        </div>

        {/* Urgent Alert */}
        {data.urgentComplaints > 0 && (
          <Card className="border-destructive/50 bg-destructive/5 animate-pulse-slow">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 rounded-full bg-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-destructive">
                  {data.urgentComplaints} urgent complaint{data.urgentComplaints > 1 ? "s" : ""} need immediate action
                </p>
                <p className="text-sm text-muted-foreground">SLA breach risk is high for these tickets</p>
              </div>
              <Link to="/admin/complaints?priority=urgent">
                <Button variant="destructive" size="sm">
                  <Zap className="w-4 h-4 mr-1" />
                  Handle Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => (
            <Card key={stat.title} className="glass-strong border-border/50 hover-lift group overflow-hidden relative">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</span>
                  <div className={`p-1.5 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-strong border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Target className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resolution Rate</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-success">{data.resolutionRate}%</span>
                  <Progress value={data.resolutionRate} className="w-16 h-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">SLA Compliance</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{data.slaCompliance}%</span>
                  <Progress value={data.slaCompliance} className="w-16 h-1.5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <span className="text-xl font-bold">{data.avgFirstResponse}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Star className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Satisfaction</p>
                <span className="text-xl font-bold">{data.avgSatisfaction > 0 ? `${data.avgSatisfaction}/5` : "N/A"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <DashboardCharts
          weeklyTrend={data.weeklyTrend}
          statusDistribution={data.statusDistribution}
          priorityDistribution={data.priorityDistribution}
          categoryDistribution={data.categoryDistribution}
          resolutionRate={data.resolutionRate}
          slaCompliance={data.slaCompliance}
        />

        {/* Bottom Row: Recent Complaints + Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Recent Complaints */}
          <Card className="glass-strong border-border/50 lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Recent Complaints
                </CardTitle>
                <CardDescription>Latest submissions across all users</CardDescription>
              </div>
              <Link to="/admin/complaints">
                <Button variant="ghost" size="sm" className="text-primary text-xs">
                  View All <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.recentComplaints.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No complaints yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {data.recentComplaints.map((c) => (
                    <Link
                      key={c.id}
                      to={`/admin/complaints/${c.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-mono text-muted-foreground">{c.ticket_number}</span>
                          <Badge variant="outline" className={`text-[10px] ${priorityColors[c.priority]}`}>
                            {c.priority}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {c.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.profiles?.full_name || "Anonymous"} • {new Date(c.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${statusColors[c.status]}`}>
                        {c.status.replace("_", " ")}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="glass-strong border-border/50 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Live Activity
                </CardTitle>
                <CardDescription>Real-time system events</CardDescription>
              </div>
              <Link to="/admin/activity">
                <Button variant="ghost" size="sm" className="text-primary text-xs">
                  Full Feed <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <RealtimeActivityFeed />
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
