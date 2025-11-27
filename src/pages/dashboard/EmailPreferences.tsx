import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Mail, Bell, Loader2 } from "lucide-react";

interface EmailPreferences {
  notify_status_change: boolean;
  notify_new_comment: boolean;
  notify_assignment: boolean;
  notify_sla_warning: boolean;
}

export default function EmailPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<EmailPreferences>({
    notify_status_change: true,
    notify_new_comment: true,
    notify_assignment: true,
    notify_sla_warning: true,
  });

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("email_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences({
          notify_status_change: data.notify_status_change,
          notify_new_comment: data.notify_new_comment,
          notify_assignment: data.notify_assignment,
          notify_sla_warning: data.notify_sla_warning,
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("email_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Email preferences saved successfully");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof EmailPreferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
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
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Mail className="w-8 h-8 text-primary" />
            Email Preferences
          </h1>
          <p className="text-muted-foreground">
            Manage your email notification preferences
          </p>
        </div>

        <Card className="glass-strong border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Choose which email notifications you'd like to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl glass">
              <div>
                <Label htmlFor="status_change" className="font-medium cursor-pointer">
                  Status Change Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when your complaint status changes
                </p>
              </div>
              <Switch
                id="status_change"
                checked={preferences.notify_status_change}
                onCheckedChange={() => togglePreference("notify_status_change")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl glass">
              <div>
                <Label htmlFor="new_comment" className="font-medium cursor-pointer">
                  New Comment Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone comments on your complaint
                </p>
              </div>
              <Switch
                id="new_comment"
                checked={preferences.notify_new_comment}
                onCheckedChange={() => togglePreference("notify_new_comment")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl glass">
              <div>
                <Label htmlFor="assignment" className="font-medium cursor-pointer">
                  Assignment Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when a complaint is assigned to you
                </p>
              </div>
              <Switch
                id="assignment"
                checked={preferences.notify_assignment}
                onCheckedChange={() => togglePreference("notify_assignment")}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl glass">
              <div>
                <Label htmlFor="sla_warning" className="font-medium cursor-pointer">
                  SLA Warning Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when an SLA deadline is approaching
                </p>
              </div>
              <Switch
                id="sla_warning"
                checked={preferences.notify_sla_warning}
                onCheckedChange={() => togglePreference("notify_sla_warning")}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Preferences"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
