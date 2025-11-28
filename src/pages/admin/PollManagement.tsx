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
import { Plus, Trash2, BarChart3, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function PollManagement() {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [options, setOptions] = useState<string[]>(["", ""]);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target_audience: "all",
    allow_multiple: false,
    is_anonymous: false,
    is_active: true,
  });

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    setLoading(true);
    try {
      const { data: pollsData, error } = await supabase
        .from("polls")
        .select(`
          *,
          poll_options(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch vote counts for each poll
      const pollsWithVotes = await Promise.all(
        (pollsData || []).map(async (poll) => {
          const { data: votes } = await supabase
            .from("poll_votes")
            .select("option_id")
            .eq("poll_id", poll.id);

          const voteCounts = votes?.reduce((acc, vote) => {
            acc[vote.option_id] = (acc[vote.option_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>) || {};

          return {
            ...poll,
            voteCounts,
            totalVotes: votes?.length || 0,
          };
        })
      );

      setPolls(pollsWithVotes);
    } catch (error) {
      console.error("Error fetching polls:", error);
      toast({
        title: "Error",
        description: "Failed to load polls",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || options.filter(o => o.trim()).length < 2) {
      toast({
        title: "Error",
        description: "Please provide a title and at least 2 options",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({
          title: formData.title,
          description: formData.description,
          target_audience: formData.target_audience,
          allow_multiple: formData.allow_multiple,
          is_anonymous: formData.is_anonymous,
          is_active: formData.is_active,
          created_by: user?.id,
        })
        .select()
        .single();

      if (pollError) throw pollError;

      // Insert poll options
      const optionsData = options
        .filter(o => o.trim())
        .map((option, index) => ({
          poll_id: poll.id,
          option_text: option.trim(),
          order_index: index,
        }));

      const { error: optionsError } = await supabase
        .from("poll_options")
        .insert(optionsData);

      if (optionsError) throw optionsError;

      toast({
        title: "Success",
        description: "Poll created successfully",
      });

      setDialogOpen(false);
      resetForm();
      fetchPolls();
    } catch (error) {
      console.error("Error saving poll:", error);
      toast({
        title: "Error",
        description: "Failed to save poll",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this poll?")) return;

    try {
      const { error } = await supabase
        .from("polls")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Poll deleted successfully",
      });

      fetchPolls();
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast({
        title: "Error",
        description: "Failed to delete poll",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      target_audience: "all",
      allow_multiple: false,
      is_anonymous: false,
      is_active: true,
    });
    setOptions(["", ""]);
  };

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
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
              <BarChart3 className="h-8 w-8" />
              Poll Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage polls for students and admins
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="premium-button">
                <Plus className="h-4 w-4 mr-2" />
                New Poll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Poll</DialogTitle>
                <DialogDescription>
                  Create a poll for students to participate in
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Poll Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="What is your question?"
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Additional details..."
                    rows={3}
                    className="glass-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Poll Options *</Label>
                  {options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="glass-input"
                      />
                      {options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" onClick={addOption} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select
                    value={formData.target_audience}
                    onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                  >
                    <SelectTrigger className="glass-input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.allow_multiple}
                      onCheckedChange={(checked) => setFormData({ ...formData, allow_multiple: checked })}
                    />
                    <Label>Allow multiple selections</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_anonymous}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_anonymous: checked })}
                    />
                    <Label>Anonymous voting</Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={saving} className="premium-button">
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Create Poll
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {polls.length === 0 ? (
            <Card className="glass-effect border-primary/20">
              <CardContent className="py-8 text-center text-muted-foreground">
                No polls created yet. Create one to gather feedback from users.
              </CardContent>
            </Card>
          ) : (
            polls.map((poll) => (
              <Card key={poll.id} className="glass-effect border-primary/20">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {poll.title}
                        {!poll.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      {poll.description && (
                        <CardDescription className="mt-2">{poll.description}</CardDescription>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">
                          {poll.totalVotes} votes
                        </Badge>
                        <Badge variant="outline">
                          {poll.target_audience}
                        </Badge>
                        {poll.allow_multiple && (
                          <Badge variant="outline">Multiple choice</Badge>
                        )}
                        {poll.is_anonymous && (
                          <Badge variant="outline">Anonymous</Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(poll.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {poll.poll_options?.map((option: any) => {
                      const votes = poll.voteCounts[option.id] || 0;
                      const percentage = poll.totalVotes > 0 ? (votes / poll.totalVotes) * 100 : 0;
                      
                      return (
                        <div key={option.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{option.option_text}</span>
                            <span className="text-muted-foreground">
                              {votes} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
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