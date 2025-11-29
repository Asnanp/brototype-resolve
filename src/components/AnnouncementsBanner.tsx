import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, X, Info, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  created_at: string;
}

const announcementIcons = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle2,
  announcement: Megaphone,
};

const announcementColors = {
  info: "bg-info/20 text-info border-info/30",
  warning: "bg-warning/20 text-warning border-warning/30",
  success: "bg-success/20 text-success border-success/30",
  announcement: "bg-primary/20 text-primary border-primary/30",
};

export const AnnouncementsBanner = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncements();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('announcements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements'
        },
        () => fetchAnnouncements()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;

      // Filter out expired announcements
      const activeAnnouncements = (data || []).filter((a) => {
        if (!a.expires_at) return true;
        return new Date(a.expires_at) > new Date();
      });

      setAnnouncements(activeAnnouncements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissed(new Set([...dismissed, id]));
  };

  const visibleAnnouncements = announcements.filter((a) => !dismissed.has(a.id));

  if (visibleAnnouncements.length === 0) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {visibleAnnouncements.map((announcement, index) => {
          const Icon = announcementIcons[announcement.type as keyof typeof announcementIcons] || Megaphone;
          const colorClass = announcementColors[announcement.type as keyof typeof announcementColors] || announcementColors.announcement;

          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`glass-strong border ${colorClass}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">{announcement.title}</h4>
                          <p className="text-sm opacity-90">{announcement.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-6 w-6 p-0"
                          onClick={() => handleDismiss(announcement.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs opacity-70 mt-2">
                        {new Date(announcement.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
