import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  PlusCircle,
  Filter,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Complaint {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  category: { name: string; color: string } | null;
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

const ITEMS_PER_PAGE = 10;

export default function MyComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchComplaints();
    }
  }, [user, searchQuery, statusFilter, priorityFilter, currentPage]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("complaints")
        .select(`
          id, ticket_number, title, description, status, priority, created_at, updated_at,
          category:categories(name, color)
        `, { count: "exact" })
        .eq("student_id", user?.id)
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,ticket_number.ilike.%${searchQuery}%`);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }

      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter as any);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) throw error;

      setComplaints(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My Complaints</h1>
            <p className="text-muted-foreground">View and manage all your submitted complaints</p>
          </div>
          <Link to="/dashboard/complaints/new">
            <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 glow">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Complaint
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="glass-strong border-border/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title or ticket number..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 glass border-border/50"
                />
              </div>
              <div className="flex gap-3">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] glass border-border/50">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border/50">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={priorityFilter}
                  onValueChange={(value) => {
                    setPriorityFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] glass border-border/50">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="glass-strong border-border/50">
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Complaints List */}
        <Card className="glass-strong border-border/50">
          <CardHeader>
            <CardTitle>Complaints ({totalCount})</CardTitle>
            <CardDescription>Click on a complaint to view details</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">No complaints found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" || priorityFilter !== "all"
                    ? "Try adjusting your filters"
                    : "You haven't submitted any complaints yet"}
                </p>
                {!searchQuery && statusFilter === "all" && priorityFilter === "all" && (
                  <Link to="/dashboard/complaints/new">
                    <Button className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Submit Your First Complaint
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {complaints.map((complaint) => (
                  <Link
                    key={complaint.id}
                    to={`/dashboard/complaints/${complaint.id}`}
                    className="block p-4 rounded-xl glass hover:bg-secondary/30 transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-muted-foreground">
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
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {complaint.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {complaint.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            Updated {new Date(complaint.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant="outline" className={statusColors[complaint.status]}>
                          {complaint.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="glass border-border/50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="glass border-border/50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
