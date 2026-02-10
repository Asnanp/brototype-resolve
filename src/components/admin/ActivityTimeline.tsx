import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle, CheckCircle2, Clock, MessageSquare, UserPlus, 
  TrendingUp, Flag, Loader2, GitMerge
} from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  created_at: string;
  details: any;
  user_id: string | null;
  profile?: { full_name: string; email: string } | null;
}

const actionConfig: Record<string, { icon: any; color: string; label: string }> = {
  created: { icon: AlertCircle, color: "text-info", label: "Created" },
  status_changed: { icon: Clock, color: "text-warning", label: "Status Changed" },
  assigned: { icon: UserPlus, color: "text-primary", label: "Assigned" },
  priority_changed: { icon: Flag, color: "text-destructive", label: "Priority Changed" },
  comment_added: { icon: MessageSquare, color: "text-success", label: "Comment Added" },
  internal_comment_added: { icon: MessageSquare, color: "text-warning", label: "Internal Note" },
  resolved: { icon: CheckCircle2, color: "text-success", label: "Resolved" },
  merged: { icon: GitMerge, color: "text-primary", label: "Merged" },
};

export function ActivityTimeline({ complaintId }: { complaintId: string }) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [complaintId]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("entity_id", complaintId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles
      const userIds = [...new Set(data?.map((a) => a.user_id).filter(Boolean))];
      let profileMap = new Map<string, any>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", userIds);
        profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      }

      setActivities(
        (data || []).map((a) => ({
          ...a,
          profile: a.user_id ? profileMap.get(a.user_id) : null,
        }))
      );
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">No activity recorded yet</p>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border/50" />
      <div className="space-y-4">
        {activities.map((activity) => {
          const config = actionConfig[activity.action] || actionConfig.created;
          const Icon = config.icon;
          return (
            <div key={activity.id} className="relative flex gap-4 pl-2">
              <div className={`z-10 flex-shrink-0 w-6 h-6 rounded-full bg-background border border-border/50 flex items-center justify-center`}>
                <Icon className={`w-3 h-3 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {activity.profile?.full_name || "System"}
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
                {activity.details && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {activity.details.old_status && activity.details.new_status && (
                      <span>
                        {activity.details.old_status.replace("_", " ")} → {activity.details.new_status.replace("_", " ")}
                      </span>
                    )}
                    {activity.details.old_priority && activity.details.new_priority && (
                      <span>
                        {activity.details.old_priority} → {activity.details.new_priority}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
