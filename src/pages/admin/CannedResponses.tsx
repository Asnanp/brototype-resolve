import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Plus, Edit, Trash2, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string | null;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

const categories = [
  "Acknowledgment",
  "Status Update",
  "Resolution",
  "Request Info",
  "Escalation",
  "Closure",
  "Other",
];

export default function CannedResponses() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    is_active: true,
  });

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from("canned_responses")
        .select("*")
        .order("usage_count", { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (error) {
      console.error("Error fetching responses:", error);
      toast.error("Failed to fetch canned responses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    try {
      if (editingResponse) {
        const { error } = await supabase
          .from("canned_responses")
          .update({
            title: formData.title,
            content: formData.content,
            category: formData.category || null,
            is_active: formData.is_active,
          })
          .eq("id", editingResponse.id);

        if (error) throw error;
        toast.success("Response updated successfully");
      } else {
        const { error } = await supabase
          .from("canned_responses")
          .insert({
            title: formData.title,
            content: formData.content,
            category: formData.category || null,
            is_active: formData.is_active,
            created_by: user?.id,
          });

        if (error) throw error;
        toast.success("Response created successfully");
      }

      setShowDialog(false);
      resetForm();
      fetchResponses();
    } catch (error) {
      console.error("Error saving response:", error);
      toast.error("Failed to save response");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this response?")) return;

    try {
      const { error } = await supabase
        .from("canned_responses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Response deleted successfully");
      fetchResponses();
    } catch (error) {
      console.error("Error deleting response:", error);
      toast.error("Failed to delete response");
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Copied to clipboard");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "",
      is_active: true,
    });
    setEditingResponse(null);
  };

  const openEditDialog = (response: CannedResponse) => {
    setEditingResponse(response);
    setFormData({
      title: response.title,
      content: response.content,
      category: response.category || "",
      is_active: response.is_active,
    });
    setShowDialog(true);
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
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              Canned Responses
            </h1>
            <p className="text-muted-foreground">Pre-written responses for quick replies</p>
          </div>
          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow">
                <Plus className="w-4 h-4 mr-2" />
                Add Response
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-border/50 max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingResponse ? "Edit Response" : "Add New Response"}
                </DialogTitle>
                <DialogDescription>
                  {editingResponse ? "Update response details" : "Create a reusable response template"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Response title"
                      className="glass border-border/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="glass border-border/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your response template..."
                    className="glass border-border/50 min-h-[200px]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Active</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingResponse ? "Update" : "Create"} Response
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Responses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {responses.map((response) => (
            <Card
              key={response.id}
              className={`glass-strong border-border/50 hover-lift transition-all ${
                !response.is_active ? "opacity-60" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{response.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {response.category && (
                        <Badge variant="secondary">{response.category}</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Used {response.usage_count} times
                      </span>
                    </div>
                  </div>
                  {!response.is_active && (
                    <Badge variant="outline">Inactive</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {response.content}
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(response.content)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(response)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(response.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {responses.length === 0 && (
          <Card className="glass-strong border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No canned responses found</p>
              <Button
                variant="link"
                onClick={() => setShowDialog(true)}
                className="mt-2"
              >
                Create your first response
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
