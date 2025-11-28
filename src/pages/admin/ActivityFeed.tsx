import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Loader2, MessageSquare, AlertTriangle, CheckCircle, UserPlus, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string;
  };
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();

    // Set up real-time subscription
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
        fetchActivities();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(data?.map(a => a.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        const enrichedData = data?.map(activity => ({
          ...activity,
          profiles: profileMap.get(activity.user_id)
        }));
        setActivities((enrichedData || []) as any);
      } else {
        setActivities((data || []) as any);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (action: string) => {
    switch (action) {
      case "created":
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "status_changed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "assigned":
        return <UserPlus className="h-5 w-5 text-purple-500" />;
      case "priority_changed":
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case "comment_added":
      case "internal_comment_added":
        return <MessageSquare className="h-5 w-5 text-cyan-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getActivityMessage = (activity: ActivityLog) => {
    const userName = activity.profiles?.full_name || "Unknown User";
    const details = activity.details || {};

    switch (activity.action) {
      case "created":
        return `${userName} created complaint ${details.ticket_number}`;
      case "status_changed":
        return `${userName} changed status from ${details.old_status} to ${details.new_status} for ${details.ticket_number}`;
      case "assigned":
        return `${userName} assigned complaint ${details.ticket_number}`;
      case "priority_changed":
        return `${userName} changed priority from ${details.old_priority} to ${details.new_priority} for ${details.ticket_number}`;
      case "comment_added":
        return `${userName} added a comment to ${details.ticket_number}`;
      case "internal_comment_added":
        return `${userName} added an internal note to ${details.ticket_number}`;
      default:
        return `${userName} performed action: ${activity.action}`;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Activity Feed
          </h1>
          <p className="text-muted-foreground">
            Real-time updates on complaint activities and changes
          </p>
        </div>

        <Card className="glass-effect border-primary/20">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No activities yet
                </p>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
                  >
                    <div className="mt-1">{getIcon(activity.action)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{getActivityMessage(activity)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.entity_type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}