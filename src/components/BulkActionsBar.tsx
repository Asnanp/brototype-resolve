import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, Check, Trash2, UserPlus, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BulkActionsBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onActionComplete: () => void;
}

export function BulkActionsBar({ selectedIds, onClearSelection, onActionComplete }: BulkActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleBulkStatusChange = async (status: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("complaints")
        .update({ 
          status: status as any,
          updated_at: new Date().toISOString() 
        })
        .in("id", selectedIds);

      if (error) throw error;

      toast.success(`${selectedIds.length} complaint(s) updated to ${status}`);
      onActionComplete();
      onClearSelection();
    } catch (error: any) {
      console.error("Error updating complaints:", error);
      toast.error("Failed to update complaints");
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkPriorityChange = async (priority: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("complaints")
        .update({ 
          priority: priority as any,
          updated_at: new Date().toISOString() 
        })
        .in("id", selectedIds);

      if (error) throw error;

      toast.success(`${selectedIds.length} complaint(s) priority updated to ${priority}`);
      onActionComplete();
      onClearSelection();
    } catch (error: any) {
      console.error("Error updating priority:", error);
      toast.error("Failed to update priority");
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from("complaints")
        .delete()
        .in("id", selectedIds);

      if (error) throw error;

      toast.success(`${selectedIds.length} complaint(s) deleted`);
      onActionComplete();
      onClearSelection();
      setShowDeleteDialog(false);
    } catch (error: any) {
      console.error("Error deleting complaints:", error);
      toast.error("Failed to delete complaints");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="glass-strong border-border/50 rounded-xl p-4 shadow-2xl glow">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {selectedIds.length} selected
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                disabled={processing}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-border/50" />

            {/* Status Change */}
            <Select onValueChange={handleBulkStatusChange} disabled={processing}>
              <SelectTrigger className="w-[160px] glass border-border/50">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-border/50">
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Change */}
            <Select onValueChange={handleBulkPriorityChange} disabled={processing}>
              <SelectTrigger className="w-[160px] glass border-border/50">
                <SelectValue placeholder="Change Priority" />
              </SelectTrigger>
              <SelectContent className="glass-strong border-border/50">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-border/50" />

            {/* Delete */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={processing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-strong border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Complaints
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} complaint(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={processing}
              className="bg-destructive text-destructive-foreground"
            >
              {processing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
