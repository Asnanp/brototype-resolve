import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  ArrowLeft,
  FileText,
  Clock,
  User,
  Calendar,
  Tag,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Star,
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  is_internal: boolean;
  is_solution: boolean;
  user_id: string;
  profiles: { full_name: string; email: string } | null;
}

interface Complaint {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  is_anonymous: boolean;
  is_public: boolean;
  resolution_notes: string | null;
  satisfaction_rating: number | null;
  category: { name: string; color: string } | null;
  profiles: { full_name: string; email: string } | null;
}

const statusColors: Record<string, string> = {
  open: "bg-info/20 text-info border-info/30",
  in_progress: "bg-warning/20 text-warning border-warning/30",
  under_review: "bg-primary/20 text-primary border-primary/30",
  resolved: "bg-success/20 text-success border-success/30",
  closed: "bg-muted text-muted-foreground border-border",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
};

const priorityColors: Record<string, string> = {
  low: "bg-success/20 text-success border-success/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
  urgent: "bg-destructive text-destructive-foreground",
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <AlertCircle className="w-4 h-4" />,
  in_progress: <Clock className="w-4 h-4" />,
  under_review: <FileText className="w-4 h-4" />,
  resolved: <CheckCircle2 className="w-4 h-4" />,
  closed: <CheckCircle2 className="w-4 h-4" />,
  rejected: <AlertCircle className="w-4 h-4" />,
};

export default function ComplaintDetail() {
  const { id } = useParams();
  const { user, role } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    if (id) {
      fetchComplaint();
      fetchComments();
    }
  }, [id]);

  const fetchComplaint = async () => {
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select(`
          *,
          category:categories(name, color),
          profiles!complaints_student_id_fkey(full_name, email)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setComplaint(data as any);
      
      // Show rating form if resolved and no rating yet
      if (data.status === "resolved" && !data.satisfaction_rating && data.student_id === user?.id) {
        setShowRating(true);
      }
    } catch (error) {
      console.error("Error fetching complaint:", error);
      toast.error("Failed to load complaint");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles!comments_user_id_fkey(full_name, email)
        `)
        .eq("complaint_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setComments((data || []) as any);
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        complaint_id: id,
        user_id: user?.id,
        content: newComment.trim(),
        is_internal: false,
      });

      if (error) throw error;

      toast.success("Comment added");
      setNewComment("");
      fetchComments();
    } catch (error: any) {
      toast.error("Failed to add comment", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const submitRating = async () => {
    if (rating === 0) return;

    try {
      const { error } = await supabase
        .from("complaints")
        .update({ satisfaction_rating: rating, status: "closed", closed_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast.success("Thank you for your feedback!");
      setShowRating(false);
      fetchComplaint();
    } catch (error: any) {
      toast.error("Failed to submit rating", { description: error.message });
    }
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

  if (!complaint) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium mb-2">Complaint not found</h3>
          <Link to={role === "admin" ? "/admin/complaints" : "/dashboard/complaints"}>
            <Button variant="link" className="text-primary">
              Go back to complaints
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <Link to={role === "admin" ? "/admin/complaints" : "/dashboard/complaints"}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Complaints
          </Button>
        </Link>

        {/* Complaint Header */}
        <Card className="glass-strong border-border/50">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-mono text-muted-foreground">
                    {complaint.ticket_number}
                  </span>
                  {complaint.category && (
                    <Badge
                      variant="outline"
                      style={{ borderColor: complaint.category.color, color: complaint.category.color }}
                    >
                      {complaint.category.name}
                    </Badge>
                  )}
                  <Badge variant="outline" className={priorityColors[complaint.priority]}>
                    {complaint.priority}
                  </Badge>
                </div>
                <CardTitle className="text-2xl">{complaint.title}</CardTitle>
                <CardDescription>
                  Submitted by{" "}
                  {complaint.is_anonymous
                    ? "Anonymous"
                    : complaint.profiles?.full_name || complaint.profiles?.email}
                  {" • "}
                  {new Date(complaint.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </CardDescription>
              </div>
              <Badge variant="outline" className={`${statusColors[complaint.status]} text-sm py-1.5 px-3`}>
                {statusIcons[complaint.status]}
                <span className="ml-1.5 capitalize">{complaint.status.replace("_", " ")}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert max-w-none">
              <p className="text-foreground whitespace-pre-wrap">{complaint.description}</p>
            </div>

            {complaint.resolution_notes && (
              <div className="mt-6 p-4 rounded-xl bg-success/10 border border-success/30">
                <h4 className="font-semibold text-success flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Resolution Notes
                </h4>
                <p className="text-sm">{complaint.resolution_notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating Section */}
        {showRating && (
          <Card className="glass-strong border-primary/30 glow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Rate Your Experience
              </CardTitle>
              <CardDescription>
                Your complaint has been resolved. How would you rate the support?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 transition-all ${
                      star <= rating ? "text-warning scale-110" : "text-muted-foreground hover:text-warning"
                    }`}
                  >
                    <Star className={`w-8 h-8 ${star <= rating ? "fill-current" : ""}`} />
                  </button>
                ))}
              </div>
              <Button
                onClick={submitRating}
                disabled={rating === 0}
                className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
              >
                Submit Rating
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Comments Section */}
        <Card className="glass-strong border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Comments ({comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No comments yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-xl ${
                      comment.is_solution
                        ? "bg-success/10 border border-success/30"
                        : "glass"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {(comment.profiles?.full_name || comment.profiles?.email || "U")
                            .substring(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.profiles?.full_name || comment.profiles?.email || "User"}
                          </span>
                          {comment.is_solution && (
                            <Badge variant="outline" className="bg-success/20 text-success border-success/30 text-xs">
                              Solution
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator className="bg-border/50" />

            {/* Add Comment */}
            <div className="space-y-3">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="glass border-border/50 min-h-[100px]"
                disabled={submitting}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || submitting}
                  className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Comment
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
