import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Brain,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface TrainingData {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  keywords: string[] | null;
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export default function AITraining() {
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    keywords: "",
    is_active: true,
  });

  useEffect(() => {
    fetchTrainingData();
  }, []);

  const fetchTrainingData = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_training_data")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrainingData(data || []);
    } catch (error: any) {
      toast.error("Failed to load training data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const keywords = formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const dataToSave = {
        question: formData.question,
        answer: formData.answer,
        category: formData.category || null,
        keywords: keywords.length > 0 ? keywords : null,
        is_active: formData.is_active,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("ai_training_data")
          .update(dataToSave)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Training data updated successfully");
      } else {
        const { error } = await supabase
          .from("ai_training_data")
          .insert(dataToSave);

        if (error) throw error;
        toast.success("Training data added successfully");
      }

      setDialogOpen(false);
      setEditingId(null);
      setFormData({
        question: "",
        answer: "",
        category: "",
        keywords: "",
        is_active: true,
      });
      fetchTrainingData();
    } catch (error: any) {
      toast.error("Failed to save training data");
    }
  };

  const handleEdit = (item: TrainingData) => {
    setEditingId(item.id);
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category || "",
      keywords: item.keywords?.join(", ") || "",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this training data?")) return;

    try {
      const { error } = await supabase
        .from("ai_training_data")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Training data deleted");
      fetchTrainingData();
    } catch (error: any) {
      toast.error("Failed to delete training data");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("ai_training_data")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Training data ${isActive ? "activated" : "deactivated"}`);
      fetchTrainingData();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const filteredData = trainingData.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 bg-gradient-to-r from-primary via-primary-glow to-secondary bg-clip-text text-transparent">
              <Brain className="w-8 h-8 text-primary" />
              AI Assistant Training
            </h1>
            <p className="text-muted-foreground mt-1">
              Teach the student AI assistant with custom Q&A pairs
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    question: "",
                    answer: "",
                    category: "",
                    keywords: "",
                    is_active: true,
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Training Data
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong border-border/50 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {editingId ? "Edit Training Data" : "Add Training Data"}
                </DialogTitle>
                <DialogDescription>
                  Add Q&A pairs to train the AI assistant for better student support
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question *</Label>
                  <Textarea
                    id="question"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="What question might students ask?"
                    className="glass border-border/50 min-h-[80px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answer">Answer *</Label>
                  <Textarea
                    id="answer"
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="Provide a helpful, clear answer"
                    className="glass border-border/50 min-h-[120px]"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Process, Technical, General"
                      className="glass border-border/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                    <Input
                      id="keywords"
                      value={formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                      placeholder="submit, file, complaint"
                      className="glass border-border/50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active">Active (AI can use this data)</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
                  >
                    {editingId ? "Update" : "Add"} Training Data
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Q&A Pairs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{trainingData.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {trainingData.filter((d) => d.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {trainingData.filter((d) => !d.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-border/50 hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {trainingData.reduce((sum, d) => sum + d.usage_count, 0)}
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="glass-strong border-border/50">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search questions, answers, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass border-border/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Training Data Table */}
        <Card className="glass-strong border-border/50 shadow-xl">
          <CardHeader className="border-b border-border/50">
            <CardTitle>Training Data</CardTitle>
            <CardDescription>
              Manage Q&A pairs that the AI assistant uses to help students
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">No training data yet</h3>
                <p className="text-muted-foreground mb-4">
                  Add Q&A pairs to train your AI assistant
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50">
                      <TableHead className="font-semibold">Question</TableHead>
                      <TableHead className="font-semibold">Answer</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Usage</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id} className="hover:bg-primary/5 border-border/30">
                        <TableCell className="max-w-xs">
                          <div className="font-medium line-clamp-2">{item.question}</div>
                          {item.keywords && item.keywords.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {item.keywords.slice(0, 3).map((keyword, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {item.answer}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.category && (
                            <Badge variant="outline" className="bg-primary/10">
                              {item.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{item.usage_count}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={item.is_active}
                            onCheckedChange={(checked) =>
                              handleToggleActive(item.id, checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="hover:bg-primary/10"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
