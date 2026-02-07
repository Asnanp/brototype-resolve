import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2, FileSpreadsheet, FileText, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface ComplaintExportProps {
  open: boolean;
  onClose: () => void;
}

type ExportFormat = "pdf" | "excel";

export function ComplaintExport({ open, onClose }: ComplaintExportProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [includeComments, setIncludeComments] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      let query = supabase
        .from("complaints")
        .select(`
          ticket_number, title, description, status, priority, 
          created_at, updated_at, resolved_at, is_anonymous,
          category:categories(name),
          profiles!complaints_student_id_fkey(full_name, email)
        `)
        .order("created_at", { ascending: false });

      if (dateFrom) {
        query = query.gte("created_at", dateFrom.toISOString());
      }
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as any);
      }
      if (priorityFilter !== "all") {
        query = query.eq("priority", priorityFilter as any);
      }

      const { data: complaints, error } = await query;

      if (error) throw error;

      if (!complaints || complaints.length === 0) {
        toast.error("No complaints found with the selected filters");
        return;
      }

      // Prepare data for export
      const exportData = complaints.map((c: any) => ({
        "Ticket #": c.ticket_number,
        "Title": c.title,
        "Description": c.description?.substring(0, 200) + (c.description?.length > 200 ? "..." : ""),
        "Status": c.status?.replace("_", " "),
        "Priority": c.priority,
        "Category": c.category?.name || "N/A",
        "Submitted By": c.is_anonymous ? "Anonymous" : (c.profiles?.full_name || c.profiles?.email || "Unknown"),
        "Created": format(new Date(c.created_at), "MMM dd, yyyy HH:mm"),
        "Resolved": c.resolved_at ? format(new Date(c.resolved_at), "MMM dd, yyyy HH:mm") : "N/A",
      }));

      if (exportFormat === "excel") {
        exportToExcel(exportData);
      } else {
        exportToPDF(exportData);
      }

      toast.success(`Exported ${complaints.length} complaints to ${exportFormat.toUpperCase()}`);
      onClose();
    } catch (error: any) {
      toast.error("Export failed", { description: error.message });
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = (data: any[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Complaints");
    
    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...data.map((row) => String(row[key] || "").length)).toString().length + 2,
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `complaints_export_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const exportToPDF = (data: any[]) => {
    const doc = new jsPDF({ orientation: "landscape" });
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(124, 58, 237); // Primary color
    doc.text("Complaint Management Report", 14, 20);
    
    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}`, 14, 28);
    doc.text(`Total Records: ${data.length}`, 14, 34);

    // Table
    autoTable(doc, {
      head: [Object.keys(data[0] || {})],
      body: data.map((row) => Object.values(row)),
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { 
        fillColor: [124, 58, 237], 
        textColor: 255,
        fontStyle: "bold"
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 60 },
        3: { cellWidth: 20 },
        4: { cellWidth: 18 },
        5: { cellWidth: 25 },
        6: { cellWidth: 30 },
        7: { cellWidth: 28 },
        8: { cellWidth: 28 },
      },
    });

    doc.save(`complaints_export_${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass-strong border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export Complaints
          </DialogTitle>
          <DialogDescription>
            Download complaint data in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as ExportFormat)}
              className="grid grid-cols-2 gap-4"
            >
              <div
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                  exportFormat === "excel" ? "border-primary bg-primary/10" : "border-border/50 hover:bg-secondary/30"
                }`}
                onClick={() => setExportFormat("excel")}
              >
                <RadioGroupItem value="excel" id="excel" />
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-success" />
                  <span className="font-medium">Excel</span>
                </div>
              </div>
              <div
                className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border ${
                  exportFormat === "pdf" ? "border-primary bg-primary/10" : "border-border/50 hover:bg-secondary/30"
                }`}
                onClick={() => setExportFormat("pdf")}
              >
                <RadioGroupItem value="pdf" id="pdf" />
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-destructive" />
                  <span className="font-medium">PDF</span>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left glass border-border/50">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-strong">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left glass border-border/50">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {dateTo ? format(dateTo, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 glass-strong">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="glass border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="glass border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-strong">
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-comments"
              checked={includeComments}
              onCheckedChange={(c) => setIncludeComments(!!c)}
            />
            <Label htmlFor="include-comments" className="text-sm">
              Include comments (Excel only)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
