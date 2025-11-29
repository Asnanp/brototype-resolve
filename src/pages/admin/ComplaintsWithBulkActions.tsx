import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdvancedSearchPanel } from "@/components/AdvancedSearchPanel";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { SLAIndicator } from "@/components/SLAIndicator";
import { ComplaintQRCode } from "@/components/ComplaintQRCode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { SearchFilters } from "@/hooks/useAdvancedSearch";
import { FileText, Loader2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Complaint {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  sla_breach_at: string | null;
  sla_status: string;
  category: { name: string; color: string } | null;
  profiles: { full_name: string } | null;
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

export default function ComplaintsWithBulkActions() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchComplaints();
  }, [page]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("complaints")
        .select(`
          id,
          ticket_number,
          title,
          status,
          priority,
          created_at,
          sla_breach_at,
          sla_status,
          student_id,
          category:categories(name, color)
        `, { count: "exact" });

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,ticket_number.ilike.%${filters.search}%`);
      }
      if (filters.status && filters.status.length > 0) {
        query = query.in("status", filters.status as any);
      }
      if (filters.priority && filters.priority.length > 0) {
        query = query.in("priority", filters.priority as any);
      }
      if (filters.category && filters.category.length > 0) {
        query = query.in("category_id", filters.category);
      }
      if (filters.slaStatus && filters.slaStatus.length > 0) {
        query = query.in("sla_status", filters.slaStatus);
      }
      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      // Fetch student profiles separately
      const studentIds = [...new Set(data?.map(c => c.student_id).filter(Boolean))];
      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", studentIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        const enrichedData = data?.map(complaint => ({
          ...complaint,
          profiles: profileMap.get(complaint.student_id)
        }));
        setComplaints((enrichedData || []) as any);
      } else {
        setComplaints((data || []) as any);
      }
      
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? complaints.map(c => c.id) : []);
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(sid => sid !== id)
    );
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  if (loading && page === 1) {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            All Complaints
          </h1>
          <p className="text-muted-foreground">
            Manage and track all complaints with advanced search
          </p>
        </div>

        <AdvancedSearchPanel
          onFiltersChange={handleFiltersChange}
          onSearch={fetchComplaints}
        />

        <Card className="glass-strong border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {complaints.length} Complaints
              </CardTitle>
              <div className="flex items-center gap-2">
                {selectedIds.length > 0 && (
                  <Badge variant="secondary">
                    {selectedIds.length} selected
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === complaints.length && complaints.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow key={complaint.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(complaint.id)}
                          onCheckedChange={(checked) =>
                            handleSelectOne(complaint.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {complaint.ticket_number}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {complaint.title}
                      </TableCell>
                      <TableCell>
                        {complaint.profiles?.full_name || "Anonymous"}
                      </TableCell>
                      <TableCell>
                        {complaint.category && (
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: complaint.category.color,
                              color: complaint.category.color,
                            }}
                          >
                            {complaint.category.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={priorityColors[complaint.priority]}
                        >
                          {complaint.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[complaint.status]}
                        >
                          {complaint.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <SLAIndicator
                          slaBreachAt={complaint.sla_breach_at}
                          slaStatus={complaint.sla_status}
                          status={complaint.status}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(complaint.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        <ComplaintQRCode
                          complaintId={complaint.id}
                          ticketNumber={complaint.ticket_number}
                        />
                        <Link to={`/admin/complaints/${complaint.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BulkActionsBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onActionComplete={fetchComplaints}
      />
    </DashboardLayout>
  );
}
