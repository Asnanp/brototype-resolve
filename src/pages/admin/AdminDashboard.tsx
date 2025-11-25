import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  ArrowRight,
  Loader2,
  Activity,
} from "lucide-react";

interface DashboardStats {
  totalComplaints: number;
  openComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  totalUsers: number;
  urgentComplaints: number;
  avgResolutionTime: string;
  todayComplaints: number;
}

interface RecentComplaint {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
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
  const [stats, setStats] = useState<DashboardStats>({
    totalComplaints: 0,
    openComplaints: 0,
    inProgressComplaints: 0,
    resolvedComplaints: 0,
    totalUsers: 0,
    urgentComplaints: 0,
    avgResolutionTime: "N/A",
    todayComplaints: 0,
  });
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch complaint stats
      const { data: complaints } = await supabase
        .from("complaints")
        .select("status, priority, created_at, resolved_at");

      if (complaints) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        setStats({
          totalComplaints: complaints.length,
          openComplaints: complaints.filter((c) => c.status === "open").length,
          inProgressComplaints: complaints.filter((c) =>
            ["in_progress", "under_review"].includes(c.status)
          ).length,
          resolvedComplaints: complaints.filter((c) =>
            ["resolved", "closed"].includes(c.status)
          ).length,
          totalUsers: 0, // Will fetch separately
          urgentComplaints: complaints.filter(
            (c) => c.priority === "urgent" && !["resolved", "closed", "rejected"].includes(c.status)
          ).length,
          avgResolutionTime: calculateAvgResolutionTime(complaints),
          todayComplaints: complaints.filter(
            (c) => new Date(c.created_at) >= today
          ).length,
        });
      }

      // Fetch user count
      const { count: userCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      setStats((prev) => ({ ...prev, totalUsers: userCount || 0 }));

      // Fetch recent complaints with user info
      const { data: recent } = await supabase
        .from("complaints")
        .select(`
          id, ticket_number, title, status, priority, created_at,
          profiles!complaints_student_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recent) {
        setRecentComplaints(recent as any);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgResolutionTime = (complaints: any[]) => {
    const resolved = complaints.filter((c) => c.resolved_at);
    if (resolved.length === 0) return "N/A";

    const totalHours = resolved.reduce((acc, c) => {
      const created = new Date(c.created_at).getTime();
      const resolved = new Date(c.resolved_at).getTime();
      return acc + (resolved - created) / (1000 * 60 * 60);
    }, 0);

    const avgHours = totalHours / resolved.length;
    if (avgHours < 24) return `${Math.round(avgHours)}h`;
    return `${Math.round(avgHours / 24)}d`;
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of complaint management system</p>
          </div>
          <Link to="/admin/complaints">
            <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow">
              <FileText className="w-4 h-4 mr-2" />
              View All Complaints
            </Button>
          </Link>
        </div>

        {/* Alert for urgent complaints */}
        {stats.urgentComplaints > 0 && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <div className="flex-1">
                <p className="font-medium">
                  {stats.urgentComplaints} urgent complaint{stats.urgentComplaints > 1 ? "s" : ""} require
                  immediate attention
                </p>
              </div>
              <Link to="/admin/complaints?priority=urgent">
                <Button variant="destructive" size="sm">
                  View Urgent
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Complaints</CardTitle>
              <FileText className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalComplaints}</div>
              <p className="text-xs text-muted-foreground mt-1">
                +{stats.todayComplaints} today
              </p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
              <AlertCircle className="w-5 h-5 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-info">{stats.openComplaints}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              <Clock className="w-5 h-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{stats.inProgressComplaints}</div>
              <p className="text-xs text-muted-foreground mt-1">Being worked on</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
              <CheckCircle2 className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.resolvedComplaints}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully closed</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              <Users className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered students</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Resolution</CardTitle>
              <Activity className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.avgResolutionTime}</div>
              <p className="text-xs text-muted-foreground mt-1">Average time to resolve</p>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolution Rate</CardTitle>
              <TrendingUp className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">
                {stats.totalComplaints > 0
                  ? Math.round((stats.resolvedComplaints / stats.totalComplaints) * 100)
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">Complaints resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Complaints */}
        <Card className="glass-strong border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Recent Complaints
              </CardTitle>
              <CardDescription>Latest submitted complaints across all users</CardDescription>
            </div>
            <Link to="/admin/complaints">
              <Button variant="ghost" size="sm" className="text-primary">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentComplaints.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No complaints yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentComplaints.map((complaint) => (
                  <Link
                    key={complaint.id}
                    to={`/admin/complaints/${complaint.id}`}
                    className="block p-4 rounded-xl glass hover:bg-secondary/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {complaint.ticket_number}
                          </span>
                          <Badge variant="outline" className={priorityColors[complaint.priority]}>
                            {complaint.priority}
                          </Badge>
                        </div>
                        <p className="font-medium truncate group-hover:text-primary transition-colors">
                          {complaint.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {complaint.profiles?.full_name || complaint.profiles?.email || "Anonymous"} •{" "}
                          {new Date(complaint.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className={statusColors[complaint.status]}>
                        {complaint.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
