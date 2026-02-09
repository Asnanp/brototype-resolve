import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  FileText,
  CheckCircle,
  UserPlus,
  AlertTriangle,
  MessageSquare,
  Loader2,
} from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  entity_type: string;
  details: any;
  created_at: string;
  user_id: string;
  userName?: string;
}

const actionConfig: Record<string, { icon: typeof Activity; color: string; label: string }> = {
  created: { icon: FileText, color: "text-info", label: "Created" },
  status_changed: { icon: CheckCircle, color: "text-success", label: "Status" },
  assigned: { icon: UserPlus, color: "text-primary", label: "Assigned" },
  priority_changed: { icon: AlertTriangle, color: "text-warning", label: "Priority" },
  comment_added: { icon: MessageSquare, color: "text-info", label: "Comment" },
  internal_comment_added: { icon: MessageSquare, color: "text-muted-foreground", label: "Internal" },
};

export function RealtimeActivityFeed() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    const channel = supabase
      .channel("dashboard-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, fetchActivities)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const userIds = [...new Set(data?.map((a) => a.user_id).filter(Boolean))];
      let profileMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
        profileMap = new Map(profiles?.map((p) => [p.user_id, p.full_name]) || []);
      }

      setActivities(
        (data || []).map((a) => ({
          ...a,
          userName: profileMap.get(a.user_id) || "System",
        }))
      );
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMessage = (a: ActivityLog) => {
    const d = a.details || {};
    switch (a.action) {
      case "created": return `created ${d.ticket_number || "complaint"}`;
      case "status_changed": return `${d.old_status} → ${d.new_status} on ${d.ticket_number}`;
      case "assigned": return `assigned ${d.ticket_number}`;
      case "priority_changed": return `${d.old_priority} → ${d.new_priority} on ${d.ticket_number}`;
      case "comment_added": return `commented on ${d.ticket_number}`;
      case "internal_comment_added": return `internal note on ${d.ticket_number}`;
      default: return a.action;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">No recent activity</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-2">
      <div className="space-y-1">
        {activities.map((a) => {
          const config = actionConfig[a.action] || { icon: Activity, color: "text-muted-foreground", label: a.action };
          const Icon = config.icon;
          return (
            <div key={a.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/30 transition-colors group">
              <div className={`mt-0.5 p-1.5 rounded-full bg-secondary/50 ${config.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">
                  <span className="font-medium">{a.userName}</span>{" "}
                  <span className="text-muted-foreground">{getMessage(a)}</span>
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </p>
              </div>
              <Badge variant="outline" className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                {config.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
