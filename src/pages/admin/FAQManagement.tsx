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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle, Plus, Edit, Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_active: boolean;
  order_index: number;
  views: number;
  created_at: string;
}

const categories = [
  "General",
  "Account",
  "Complaints",
  "Technical",
  "Policies",
  "Other",
];

export default function FAQManagement() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    is_active: true,
  });

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      const { data, error } = await supabase
        .from("faqs")
        .select("*")
        .order("order_index");

      if (error) throw error;
      setFaqs(data || []);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      toast.error("Failed to fetch FAQs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    try {
      if (editingFaq) {
        const { error } = await supabase
          .from("faqs")
          .update({
            question: formData.question,
            answer: formData.answer,
            category: formData.category || null,
            is_active: formData.is_active,
          })
          .eq("id", editingFaq.id);

        if (error) throw error;
        toast.success("FAQ updated successfully");
      } else {
        const maxOrder = Math.max(...faqs.map(f => f.order_index || 0), 0);
        const { error } = await supabase
          .from("faqs")
          .insert({
            question: formData.question,
            answer: formData.answer,
            category: formData.category || null,
            is_active: formData.is_active,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success("FAQ created successfully");
      }

      setShowDialog(false);
      resetForm();
      fetchFaqs();
    } catch (error) {
      console.error("Error saving FAQ:", error);
      toast.error("Failed to save FAQ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return;

    try {
      const { error } = await supabase
        .from("faqs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("FAQ deleted successfully");
      fetchFaqs();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      toast.error("Failed to delete FAQ");
    }
  };

  const handleToggleActive = async (faq: FAQ) => {
    try {
      const { error } = await supabase
        .from("faqs")
        .update({ is_active: !faq.is_active })
        .eq("id", faq.id);

      if (error) throw error;
      setFaqs(faqs.map(f => 
        f.id === faq.id ? { ...f, is_active: !f.is_active } : f
      ));
      toast.success(`FAQ ${!faq.is_active ? "activated" : "deactivated"}`);
    } catch (error) {
      console.error("Error toggling FAQ:", error);
      toast.error("Failed to update FAQ");
    }
  };

  const resetForm = () => {
    setFormData({
      question: "",
      answer: "",
      category: "",
      is_active: true,
    });
    setEditingFaq(null);
  };

  const openEditDialog = (faq: FAQ) => {
    setEditingFaq(faq);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "",
      is_active: faq.is_active,
    });
    setShowDialog(true);
  };

  // Group FAQs by category
  const groupedFaqs = faqs.reduce((acc, faq) => {
    const category = faq.category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

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
              <HelpCircle className="w-8 h-8 text-primary" />
              FAQ Management
            </h1>
            <p className="text-muted-foreground">Frequently asked questions</p>
          </div>
          <Dialog open={showDialog} onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow">
                <Plus className="w-4 h-4 mr-2" />
                Add FAQ
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-border/50 max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingFaq ? "Edit FAQ" : "Add New FAQ"}
                </DialogTitle>
                <DialogDescription>
                  {editingFaq ? "Update FAQ details" : "Create a new frequently asked question"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="Enter the question"
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
                <div className="space-y-2">
                  <Label>Answer</Label>
                  <Textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Write the answer..."
                    className="glass border-border/50 min-h-[150px]"
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
                    {editingFaq ? "Update" : "Create"} FAQ
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* FAQs by Category */}
        {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
          <Card key={category} className="glass-strong border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{category}</span>
                <Badge variant="secondary">{categoryFaqs.length} FAQs</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {categoryFaqs.map((faq) => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className={`border-border/50 ${!faq.is_active ? "opacity-60" : ""}`}
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="font-medium">{faq.question}</span>
                        {!faq.is_active && (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <p className="text-muted-foreground">{faq.answer}</p>
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Eye className="w-3 h-3" />
                            <span>{faq.views} views</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={faq.is_active}
                              onCheckedChange={() => handleToggleActive(faq)}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(faq)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(faq.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}

        {faqs.length === 0 && (
          <Card className="glass-strong border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <HelpCircle className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No FAQs found</p>
              <Button
                variant="link"
                onClick={() => setShowDialog(true)}
                className="mt-2"
              >
                Create your first FAQ
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
