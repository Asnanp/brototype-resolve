import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Search, Merge, Loader2, FileText, AlertCircle } from "lucide-react";

interface ComplaintMergeProps {
  sourceComplaint: {
    id: string;
    ticket_number: string;
    title: string;
  };
  open: boolean;
  onClose: () => void;
  onMergeComplete: () => void;
}

interface SearchResult {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  created_at: string;
}

export function ComplaintMerge({ sourceComplaint, open, onClose, onMergeComplete }: ComplaintMergeProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [mergeReason, setMergeReason] = useState("");
  const [searching, setSearching] = useState(false);
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchComplaints();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchComplaints = async () => {
    setSearching(true);
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select("id, ticket_number, title, status, created_at")
        .neq("id", sourceComplaint.id)
        .eq("is_merged", false)
        .or(`title.ilike.%${searchQuery}%,ticket_number.ilike.%${searchQuery}%`)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleMerge = async () => {
    if (!selectedTarget) {
      toast.error("Please select a target complaint");
      return;
    }

    setMerging(true);
    try {
      // Create merge record
      const { error: mergeError } = await supabase.from("merged_complaints").insert({
        primary_complaint_id: selectedTarget,
        merged_complaint_id: sourceComplaint.id,
        merged_by: user?.id,
        merge_reason: mergeReason || null,
      });

      if (mergeError) throw mergeError;

      // Update source complaint as merged
      const { error: updateError } = await supabase
        .from("complaints")
        .update({
          is_merged: true,
          merged_into: selectedTarget,
          status: "closed",
          closed_at: new Date().toISOString(),
        })
        .eq("id", sourceComplaint.id);

      if (updateError) throw updateError;

      // Copy comments to target complaint
      const { data: comments } = await supabase
        .from("comments")
        .select("*")
        .eq("complaint_id", sourceComplaint.id);

      if (comments && comments.length > 0) {
        const newComments = comments.map((c) => ({
          complaint_id: selectedTarget,
          user_id: c.user_id,
          content: `[Merged from ${sourceComplaint.ticket_number}] ${c.content}`,
          is_internal: true,
          is_solution: false,
        }));

        await supabase.from("comments").insert(newComments);
      }

      toast.success("Complaints merged successfully");
      onMergeComplete();
      onClose();
    } catch (error: any) {
      toast.error("Failed to merge complaints", { description: error.message });
    } finally {
      setMerging(false);
    }
  };

  const statusColors: Record<string, string> = {
    open: "bg-info/20 text-info",
    in_progress: "bg-warning/20 text-warning",
    resolved: "bg-success/20 text-success",
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glass-strong border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5 text-primary" />
            Merge Complaint
          </DialogTitle>
          <DialogDescription>
            Merge <span className="font-mono text-primary">{sourceComplaint.ticket_number}</span> into another complaint
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg glass border border-border/50">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Merging will:</p>
                <ul className="text-muted-foreground mt-1 space-y-1">
                  <li>• Move all comments to the target complaint</li>
                  <li>• Mark this complaint as closed and merged</li>
                  <li>• Keep the merge history for reference</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Search for target complaint</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or ticket number..."
                className="pl-10 glass border-border/50"
              />
            </div>
          </div>

          {searching && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {searchResults.length > 0 && (
            <ScrollArea className="h-[200px] rounded-lg border border-border/50">
              <RadioGroup value={selectedTarget || ""} onValueChange={setSelectedTarget}>
                <div className="p-2 space-y-2">
                  {searchResults.map((complaint) => (
                    <div
                      key={complaint.id}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedTarget === complaint.id ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary/30"
                      }`}
                      onClick={() => setSelectedTarget(complaint.id)}
                    >
                      <RadioGroupItem value={complaint.id} id={complaint.id} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">
                            {complaint.ticket_number}
                          </span>
                          <Badge variant="outline" className={statusColors[complaint.status] || ""}>
                            {complaint.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{complaint.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </ScrollArea>
          )}

          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <div className="text-center py-4">
              <FileText className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No matching complaints found</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">Merge reason (optional)</Label>
            <Textarea
              id="reason"
              value={mergeReason}
              onChange={(e) => setMergeReason(e.target.value)}
              placeholder="Why are these complaints being merged?"
              className="glass border-border/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!selectedTarget || merging}
            className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
          >
            {merging ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Merging...
              </>
            ) : (
              <>
                <Merge className="w-4 h-4 mr-2" />
                Merge Complaints
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
