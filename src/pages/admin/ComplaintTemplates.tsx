import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit, FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Template {
  id: string;
  name: string;
  title_template: string;
  description_template: string;
  category_id: string | null;
  default_priority: "low" | "medium" | "high" | "urgent";
  fields: any;
  is_active: boolean;
}

export default function ComplaintTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    title_template: "",
    description_template: "",
    category_id: "",
    default_priority: "medium" as "low" | "medium" | "high" | "urgent",
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [templatesRes, categoriesRes] = await Promise.all([
        supabase.from("complaint_templates").select("*").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").eq("is_active", true)
      ]);

      if (templatesRes.data) setTemplates(templatesRes.data as any);
      if (categoriesRes.data) setCategories(categoriesRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.title_template || !formData.description_template) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const templateData: any = {
        name: formData.name,
        title_template: formData.title_template,
        description_template: formData.description_template,
        category_id: formData.category_id || null,
        default_priority: formData.default_priority,
        is_active: formData.is_active,
        created_by: user?.id,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from("complaint_templates")
          .update(templateData)
          .eq("id", editingTemplate.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Template updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("complaint_templates")
          .insert([templateData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Template created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      title_template: template.title_template,
      description_template: template.description_template,
      category_id: template.category_id || "",
      default_priority: template.default_priority as "low" | "medium" | "high" | "urgent",
      is_active: template.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const { error } = await supabase
        .from("complaint_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      title_template: "",
      description_template: "",
      category_id: "",
      default_priority: "medium" as "low" | "medium" | "high" | "urgent",
      is_active: true,
    });
    setEditingTemplate(null);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Complaint Templates
            </h1>
            <p className="text-muted-foreground">
              Create templates to help students submit detailed complaints faster
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="premium-button">
                <Plus className="h-4 w-4 mr-2" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
                <DialogDescription>
                  Design a template that students can use to submit complaints
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Template Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Classroom Facility Issue"
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Title Template *</Label>
                  <Input
                    value={formData.title_template}
                    onChange={(e) => setFormData({ ...formData, title_template: e.target.value })}
                    placeholder="e.g., [Room Number] - [Brief Description]"
                    className="glass-input"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use placeholders like [Room Number], [Description], etc.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Description Template *</Label>
                  <Textarea
                    value={formData.description_template}
                    onChange={(e) => setFormData({ ...formData, description_template: e.target.value })}
                    placeholder="Please describe the issue in detail..."
                    rows={6}
                    className="glass-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger className="glass-input">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No category</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Default Priority</Label>
                    <Select
                      value={formData.default_priority}
                      onValueChange={(value: "low" | "medium" | "high" | "urgent") => setFormData({ ...formData, default_priority: value })}
                    >
                      <SelectTrigger className="glass-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={saving} className="premium-button">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingTemplate ? "Update" : "Create"} Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {templates.length === 0 ? (
            <Card className="glass-effect border-primary/20">
              <CardContent className="py-8 text-center text-muted-foreground">
                No templates created yet. Create one to help students submit complaints faster.
              </CardContent>
            </Card>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="glass-effect border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {template.name}
                        {!template.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <strong>Title:</strong> {template.title_template}
                      </CardDescription>
                      <CardDescription className="mt-1">
                        <strong>Description:</strong> {template.description_template}
                      </CardDescription>
                      <div className="flex gap-2 mt-2">
                        {template.category_id && (
                          <Badge variant="outline">
                            {categories.find(c => c.id === template.category_id)?.name}
                          </Badge>
                        )}
                        <Badge variant="outline">
                          Priority: {template.default_priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}