import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { StudentAIAssistant } from "@/components/StudentAIAssistant";
import { ComplaintStatistics } from "@/components/ComplaintStatistics";
import { QuickActions } from "@/components/QuickActions";
import { AnnouncementsBanner } from "@/components/AnnouncementsBanner";
import { SatisfactionSurvey } from "@/components/SatisfactionSurvey";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
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
  Trophy,
  Zap,
  Star,
  Target,
  Activity,
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

interface PendingSurvey {
  complaintId: string;
  complaintTitle: string;
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
  const [pendingSurvey, setPendingSurvey] = useState<PendingSurvey | null>(null);
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
        .select("id, title, status, satisfaction_rating")
        .eq("student_id", user?.id);

      if (complaints) {
        setStats({
          total: complaints.length,
          open: complaints.filter((c) => c.status === "open").length,
          inProgress: complaints.filter((c) => ["in_progress", "under_review"].includes(c.status)).length,
          resolved: complaints.filter((c) => ["resolved", "closed"].includes(c.status)).length,
        });

        // Check for pending surveys (resolved but not rated)
        const pendingRating = complaints.find(
          (c) => c.status === "resolved" && !c.satisfaction_rating
        );
        if (pendingRating) {
          setPendingSurvey({
            complaintId: pendingRating.id,
            complaintTitle: pendingRating.title,
          });
        }
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

  const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Gradient */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
              Welcome back! 👋
            </h1>
            <p className="text-muted-foreground text-lg">Here's what's happening with your complaints</p>
          </div>
          <Link to="/dashboard/complaints/new">
            <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow shadow-lg group">
              <PlusCircle className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
              New Complaint
            </Button>
          </Link>
        </motion.div>

        {/* Satisfaction Survey Prompt */}
        <AnimatePresence>
          {pendingSurvey && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <SatisfactionSurvey
                complaintId={pendingSurvey.complaintId}
                userId={user?.id || ""}
                onComplete={() => {
                  setPendingSurvey(null);
                  fetchDashboardData();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Announcements */}
        <AnnouncementsBanner />

        {/* Active Polls Banner */}
        {activePolls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-strong border-primary/30 glow overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 via-primary-glow/10 to-secondary/10 p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    Active Polls - Share Your Voice!
                  </CardTitle>
                  <CardDescription>Your feedback helps us improve</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-3 gap-4">
                    {activePolls.map((poll) => (
                      <Link key={poll.id} to="/dashboard/polls">
                        <Card className="glass hover:bg-primary/5 transition-all hover-lift border-border/50 h-full group">
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">{poll.title}</h3>
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
                            <Button variant="outline" size="sm" className="w-full bg-gradient-to-r from-primary/10 to-primary-glow/10 border-primary/30 group-hover:border-primary">
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
          </motion.div>
        )}

        {/* Quick Actions */}
        <QuickActions />

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <Card className="glass-strong border-border/50 hover-lift overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Complaints</CardTitle>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {stats.total}
              </div>
              <p className="text-sm text-muted-foreground mt-1">All time submissions</p>
              <Progress value={(stats.total / (stats.total + 10)) * 100} className="mt-3 h-1.5" />
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-info/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
              <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6 text-info" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-info">{stats.open}</div>
              <p className="text-sm text-muted-foreground mt-1">Awaiting response</p>
              <Progress value={(stats.open / Math.max(stats.total, 1)) * 100} className="mt-3 h-1.5" />
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-warning">{stats.inProgress}</div>
              <p className="text-sm text-muted-foreground mt-1">Being worked on</p>
              <Progress value={(stats.inProgress / Math.max(stats.total, 1)) * 100} className="mt-3 h-1.5" />
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-4xl font-bold text-success">{stats.resolved}</div>
              <p className="text-sm text-muted-foreground mt-1">Successfully closed</p>
              <Progress value={(stats.resolved / Math.max(stats.total, 1)) * 100} className="mt-3 h-1.5" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievement Card */}
        {stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-strong border-border/50 overflow-hidden">
              <div className="bg-gradient-to-r from-success/5 via-primary/5 to-warning/5">
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
                        <Trophy className="w-7 h-7 text-success" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-success">{resolutionRate}%</p>
                        <p className="text-sm text-muted-foreground">Resolution Rate</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Target className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.total}</p>
                        <p className="text-sm text-muted-foreground">Total Submissions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-warning/20 to-warning/5 flex items-center justify-center">
                        <Activity className="w-7 h-7 text-warning" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stats.open + stats.inProgress}</p>
                        <p className="text-sm text-muted-foreground">Active Cases</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Statistics Section */}
        {stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
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
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Complaints */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="glass-strong border-border/50 h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Recent Complaints
                  </CardTitle>
                  <CardDescription>Your latest submitted complaints</CardDescription>
                </div>
                <Link to="/dashboard/complaints">
                  <Button variant="ghost" size="sm" className="text-primary group">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentComplaints.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-10 h-10 text-primary/50" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No complaints yet</h3>
                    <p className="text-muted-foreground mb-4">Submit your first complaint to get started</p>
                    <Link to="/dashboard/complaints/new">
                      <Button className="bg-gradient-to-r from-primary to-primary-glow">
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Submit Complaint
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentComplaints.map((complaint, index) => (
                      <motion.div
                        key={complaint.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <Link
                          to={`/dashboard/complaints/${complaint.id}`}
                          className="block p-4 rounded-xl glass hover:bg-secondary/30 transition-all group border border-transparent hover:border-primary/20"
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
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="glass-strong border-border/50 h-full">
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
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-primary/50" />
                    </div>
                    <p className="text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif, index) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className={`p-3 rounded-lg glass ${!notif.is_read ? "border-l-2 border-primary bg-primary/5" : ""}`}
                      >
                        <p className="font-medium text-sm">{notif.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-muted-foreground/70 mt-2">
                          {new Date(notif.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* AI Assistant */}
        <StudentAIAssistant />
      </div>
    </DashboardLayout>
  );
}
