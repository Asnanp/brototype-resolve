import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Loader2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AssignmentRule {
  id: string;
  name: string;
  priority: number;
  is_active: boolean;
  conditions: any;
  assigned_to: string;
  created_at: string;
}

export default function AutomationRules() {
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const { toast } = useToast();

  const [newRule, setNewRule] = useState({
    name: "",
    priority: 0,
    is_active: true,
    category_id: "",
    priority_level: "",
    keywords: "",
    assigned_to: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rulesRes, adminsRes, categoriesRes] = await Promise.all([
        supabase.from("assignment_rules").select("*").order("priority", { ascending: false }),
        supabase.from("user_roles").select("user_id, profiles(*)").eq("role", "admin"),
        supabase.from("categories").select("*").eq("is_active", true)
      ]);

      if (rulesRes.data) setRules(rulesRes.data);
      if (adminsRes.data) setAdmins(adminsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load automation rules",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.assigned_to) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const conditions: any = {};
      if (newRule.category_id) conditions.category_id = newRule.category_id;
      if (newRule.priority_level) conditions.priority = newRule.priority_level;
      if (newRule.keywords) {
        conditions.keywords = newRule.keywords.split(",").map(k => k.trim());
      }

      const { error } = await supabase.from("assignment_rules").insert({
        name: newRule.name,
        priority: newRule.priority,
        is_active: newRule.is_active,
        conditions,
        assigned_to: newRule.assigned_to,
        created_by: user?.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Automation rule created successfully",
      });

      setNewRule({
        name: "",
        priority: 0,
        is_active: true,
        category_id: "",
        priority_level: "",
        keywords: "",
        assigned_to: ""
      });

      fetchData();
    } catch (error) {
      console.error("Error creating rule:", error);
      toast({
        title: "Error",
        description: "Failed to create automation rule",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("assignment_rules")
        .update({ is_active: isActive })
        .eq("id", ruleId);

      if (error) throw error;

      setRules(rules.map(r => r.id === ruleId ? { ...r, is_active: isActive } : r));
      
      toast({
        title: "Success",
        description: `Rule ${isActive ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      console.error("Error toggling rule:", error);
      toast({
        title: "Error",
        description: "Failed to update rule",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from("assignment_rules")
        .delete()
        .eq("id", ruleId);

      if (error) throw error;

      setRules(rules.filter(r => r.id !== ruleId));
      
      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      });
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
            <Zap className="h-8 w-8" />
            Automation Rules
          </h1>
          <p className="text-muted-foreground">
            Automatically assign complaints based on category, priority, or keywords
          </p>
        </div>

        <Card className="glass-strong border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New Rule
            </CardTitle>
            <CardDescription>
              Rules are evaluated in order of priority (highest first)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Name *</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., High Priority Technical Issues"
                  className="glass border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority Level (0-100)</Label>
                <Input
                  type="number"
                  value={newRule.priority}
                  onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) || 0 })}
                  placeholder="Higher = evaluated first"
                  className="glass border-border/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category (Optional)</Label>
                <Select
                  value={newRule.category_id}
                  onValueChange={(value) => setNewRule({ ...newRule, category_id: value })}
                >
                  <SelectTrigger className="glass border-border/50">
                    <SelectValue placeholder="Any category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority (Optional)</Label>
                <Select
                  value={newRule.priority_level}
                  onValueChange={(value) => setNewRule({ ...newRule, priority_level: value })}
                >
                   <SelectTrigger className="glass border-border/50">
                    <SelectValue placeholder="Any priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign To *</Label>
                <Select
                  value={newRule.assigned_to}
                  onValueChange={(value) => setNewRule({ ...newRule, assigned_to: value })}
                >
                  <SelectTrigger className="glass border-border/50">
                    <SelectValue placeholder="Select admin" />
                  </SelectTrigger>
                  <SelectContent>
                    {admins.map((admin: any) => (
                      <SelectItem key={admin.user_id} value={admin.user_id}>
                        {admin.profiles?.full_name || admin.profiles?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Keywords (Optional, comma-separated)</Label>
              <Input
                value={newRule.keywords}
                onChange={(e) => setNewRule({ ...newRule, keywords: e.target.value })}
                placeholder="e.g., urgent, bug, crash"
                className="glass border-border/50"
              />
              <p className="text-xs text-muted-foreground">
                Complaint will be assigned if title or description contains any of these keywords
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={newRule.is_active}
                  onCheckedChange={(checked) => setNewRule({ ...newRule, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <Button onClick={handleCreateRule} disabled={saving} className="premium-button">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Existing Rules</h2>
          {rules.length === 0 ? (
            <Card className="glass-effect border-primary/20">
              <CardContent className="py-8 text-center text-muted-foreground">
                No automation rules created yet
              </CardContent>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card key={rule.id} className="glass-effect border-primary/20">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{rule.name}</h3>
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">Priority: {rule.priority}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {rule.conditions.category_id && (
                          <span className="px-2 py-1 bg-primary/10 rounded">
                            Category: {categories.find(c => c.id === rule.conditions.category_id)?.name}
                          </span>
                        )}
                        {rule.conditions.priority && (
                          <span className="px-2 py-1 bg-primary/10 rounded">
                            Priority: {rule.conditions.priority}
                          </span>
                        )}
                        {rule.conditions.keywords && rule.conditions.keywords.length > 0 && (
                          <span className="px-2 py-1 bg-primary/10 rounded">
                            Keywords: {rule.conditions.keywords.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}