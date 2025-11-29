import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Stats {
  totalComplaints: number;
  openComplaints: number;
  resolvedToday: number;
  avgResponseTime: number;
  slaBreaches: number;
  totalStudents: number;
  prevPeriodComplaints: number;
}

export const AdminStatsSummary = () => {
  const [stats, setStats] = useState<Stats>({
    totalComplaints: 0,
    openComplaints: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    slaBreaches: 0,
    totalStudents: 0,
    prevPeriodComplaints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Realtime updates
    const channel = supabase
      .channel('admin-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        allComplaintsResult,
        openComplaintsResult,
        resolvedTodayResult,
        breachesResult,
        studentsResult,
        prevWeekResult,
      ] = await Promise.all([
        supabase.from("complaints").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("status", "resolved").gte("resolved_at", today.toISOString()),
        supabase.from("complaints").select("*", { count: "exact", head: true }).eq("sla_status", "breached"),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("complaints").select("*", { count: "exact", head: true }).gte("created_at", weekAgo.toISOString()).lt("created_at", today.toISOString()),
      ]);

      setStats({
        totalComplaints: allComplaintsResult.count || 0,
        openComplaints: openComplaintsResult.count || 0,
        resolvedToday: resolvedTodayResult.count || 0,
        avgResponseTime: 0,
        slaBreaches: breachesResult.count || 0,
        totalStudents: studentsResult.count || 0,
        prevPeriodComplaints: prevWeekResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const complaintsGrowth = stats.prevPeriodComplaints > 0
    ? ((stats.totalComplaints - stats.prevPeriodComplaints) / stats.prevPeriodComplaints) * 100
    : 0;

  const statCards = [
    {
      title: "Total Complaints",
      value: stats.totalComplaints,
      icon: FileText,
      color: "primary",
      trend: complaintsGrowth,
      progress: 100,
    },
    {
      title: "Open Complaints",
      value: stats.openComplaints,
      icon: AlertTriangle,
      color: "warning",
      progress: (stats.openComplaints / Math.max(stats.totalComplaints, 1)) * 100,
    },
    {
      title: "Resolved Today",
      value: stats.resolvedToday,
      icon: CheckCircle2,
      color: "success",
      progress: (stats.resolvedToday / Math.max(stats.openComplaints, 1)) * 100,
    },
    {
      title: "SLA Breaches",
      value: stats.slaBreaches,
      icon: Clock,
      color: "destructive",
      progress: (stats.slaBreaches / Math.max(stats.totalComplaints, 1)) * 100,
    },
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      color: "info",
      progress: 100,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statCards.map((stat, index) => (
        <Card key={stat.title} className="glass-strong border-border/50 hover-lift overflow-hidden relative group">
          <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className={`h-10 w-10 rounded-full bg-${stat.color}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold">{stat.value}</div>
            {stat.trend !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs ${stat.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                {stat.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(stat.trend).toFixed(1)}% vs last week
              </div>
            )}
            <Progress value={stat.progress} className="mt-2 h-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
