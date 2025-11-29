import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  FileText,
  Send,
  Loader2,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import { z } from "zod";

const complaintSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title too long"),
  description: z.string().min(20, "Please provide more details (at least 20 characters)").max(5000, "Description too long"),
  category_id: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  is_anonymous: z.boolean(),
  is_public: z.boolean(),
});

interface Category {
  id: string;
  name: string;
  color: string;
  description: string | null;
}

export default function NewComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    priority: "medium" as const,
    is_anonymous: false,
    is_public: false,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (data) {
      setCategories(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = complaintSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      // Generate ticket number
      const { data: ticketData, error: ticketError } = await supabase.rpc("generate_ticket_number");
      
      if (ticketError) throw ticketError;

      const { data, error } = await supabase
        .from("complaints")
        .insert({
          student_id: user?.id,
          ticket_number: ticketData,
          title: formData.title,
          description: formData.description,
          category_id: formData.category_id || null,
          priority: formData.priority,
          is_anonymous: formData.is_anonymous,
          is_public: formData.is_public,
          status: "open",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Complaint submitted successfully!", {
        description: `Ticket number: ${ticketData}`,
      });

      navigate(`/dashboard/complaints/${data.id}`);
    } catch (error: any) {
      console.error("Error submitting complaint:", error);
      toast.error("Failed to submit complaint", {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Submit New Complaint</h1>
          <p className="text-muted-foreground">
            Fill out the form below to submit a new complaint
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="glass-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Complaint Details
              </CardTitle>
              <CardDescription>
                Provide as much detail as possible to help us resolve your issue quickly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of your complaint"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="glass border-border/50"
                  required
                  disabled={loading}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="glass border-border/50">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border/50">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="glass border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border/50">
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        Low - Minor issue, can wait
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-warning" />
                        Medium - Regular priority
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        High - Important issue
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 text-destructive" />
                        Urgent - Needs immediate attention
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <RichTextEditor
                  content={formData.description}
                  onChange={(content) => setFormData({ ...formData, description: content })}
                  placeholder="Describe your complaint in detail. Include any relevant information such as dates, times, people involved, etc."
                />
                <p className="text-xs text-muted-foreground">
                  Use the toolbar above for rich text formatting
                </p>
              </div>

              {/* Privacy Options */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <h4 className="font-medium flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  Privacy Options
                </h4>

                <div className="flex items-center justify-between p-4 rounded-xl glass">
                  <div className="flex items-center gap-3">
                    <EyeOff className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="anonymous" className="font-medium cursor-pointer">
                        Submit Anonymously
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Your identity will be hidden from admins
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="anonymous"
                    checked={formData.is_anonymous}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_anonymous: checked })
                    }
                    disabled={loading}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl glass">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <Label htmlFor="public" className="font-medium cursor-pointer">
                        Make Public
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Other students can see this complaint
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_public: checked })
                    }
                    disabled={loading || formData.is_anonymous}
                  />
                </div>

                {formData.is_anonymous && (
                  <p className="text-sm text-warning flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Anonymous complaints cannot be made public
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard/complaints")}
                  disabled={loading}
                  className="glass border-border/50"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Complaint
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
