import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StudentAIAssistant } from "@/components/StudentAIAssistant";
import { ComplaintStatistics } from "@/components/ComplaintStatistics";
import { QuickActions } from "@/components/QuickActions";
import { AnnouncementsBanner } from "@/components/AnnouncementsBanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Bell,
  ArrowRight,
  Loader2,
  BarChart3,
  Calendar,
  Sparkles,
} from "lucide-react";

interface ComplaintStats {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

interface RecentComplaint {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Poll {
  id: string;
  title: string;
  description: string | null;
  ends_at: string | null;
  is_active: boolean;
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

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ComplaintStats>({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch complaint stats
      const { data: complaints } = await supabase
        .from("complaints")
        .select("status")
        .eq("student_id", user?.id);

      if (complaints) {
        setStats({
          total: complaints.length,
          open: complaints.filter((c) => c.status === "open").length,
          inProgress: complaints.filter((c) => ["in_progress", "under_review"].includes(c.status)).length,
          resolved: complaints.filter((c) => ["resolved", "closed"].includes(c.status)).length,
        });
      }

      // Fetch recent complaints
      const { data: recent } = await supabase
        .from("complaints")
        .select("id, ticket_number, title, status, priority, created_at")
        .eq("student_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recent) {
        setRecentComplaints(recent);
      }

      // Fetch notifications
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (notifs) {
        setNotifications(notifs);
      }

      // Fetch active polls
      const { data: polls } = await supabase
        .from("polls")
        .select("id, title, description, ends_at, is_active")
        .eq("is_active", true)
        .gte("ends_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(3);

      if (polls) {
        setActivePolls(polls);
      }
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
              Welcome back!
            </h1>
            <p className="text-muted-foreground">Here's an overview of your complaints and updates</p>
          </div>
          <Link to="/dashboard/complaints/new">
            <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow shadow-lg">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Complaint
            </Button>
          </Link>
        </div>

        {/* Announcements */}
        <AnnouncementsBanner />

        {/* Active Polls Banner */}
        {activePolls.length > 0 && (
          <Card className="glass-strong border-primary/30 glow overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 via-primary-glow/10 to-secondary/10 p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  Active Polls
                </CardTitle>
                <CardDescription>Share your opinion on these important topics</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid md:grid-cols-3 gap-4">
                  {activePolls.map((poll) => (
                    <Link key={poll.id} to="/dashboard/polls">
                      <Card className="glass hover:bg-primary/5 transition-all hover-lift border-border/50 h-full">
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2">{poll.title}</h3>
                          {poll.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {poll.description}
                            </p>
                          )}
                          {poll.ends_at && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                              <Calendar className="w-3 h-3" />
                              Ends {new Date(poll.ends_at).toLocaleDateString()}
                            </div>
                          )}
                          <Button variant="outline" size="sm" className="w-full bg-gradient-to-r from-primary/10 to-primary-glow/10 border-primary/30">
                            Vote Now
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <QuickActions />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-strong border-border/50 hover-lift overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Complaints</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {stats.total}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All time submissions</p>
              <Progress value={(stats.total / (stats.total + 10)) * 100} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-info/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
              <div className="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="w-5 h-5 text-info" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-info">{stats.open}</div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
              <Progress value={(stats.open / Math.max(stats.total, 1)) * 100} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              <div className="h-10 w-10 rounded-full bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5 text-warning" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-warning">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground mt-1">Being worked on</p>
              <Progress value={(stats.inProgress / Math.max(stats.total, 1)) * 100} className="mt-2 h-1" />
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-success">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground mt-1">Successfully closed</p>
              <Progress value={(stats.resolved / Math.max(stats.total, 1)) * 100} className="mt-2 h-1" />
            </CardContent>
          </Card>
        </div>

        {/* Statistics Section */}
        {stats.total > 0 && (
          <Card className="glass-strong border-border/50">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Complaint Analytics
              </CardTitle>
              <CardDescription>Visual breakdown of your complaint history</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ComplaintStatistics studentId={user?.id} />
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Complaints */}
          <Card className="lg:col-span-2 glass-strong border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Recent Complaints
                </CardTitle>
                <CardDescription>Your latest submitted complaints</CardDescription>
              </div>
              <Link to="/dashboard/complaints">
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
                  <Link to="/dashboard/complaints/new">
                    <Button variant="link" className="text-primary mt-2">
                      Submit your first complaint
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentComplaints.map((complaint) => (
                    <Link
                      key={complaint.id}
                      to={`/dashboard/complaints/${complaint.id}`}
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

          {/* Notifications */}
          <Card className="glass-strong border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Notifications
                </CardTitle>
                <CardDescription>Recent updates</CardDescription>
              </div>
              <Link to="/dashboard/notifications">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg glass ${!notif.is_read ? "border-l-2 border-primary" : ""}`}
                    >
                      <p className="font-medium text-sm">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <StudentAIAssistant />
    </DashboardLayout>
  );
}
