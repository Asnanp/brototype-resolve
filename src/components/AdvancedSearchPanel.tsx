import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Filter, Save, Star, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdvancedSearch, SearchFilters } from "@/hooks/useAdvancedSearch";
import { toast } from "sonner";

interface AdvancedSearchPanelProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
}

export function AdvancedSearchPanel({ onFiltersChange, onSearch }: AdvancedSearchPanelProps) {
  const { savedFilters, saveFilter, deleteFilter, setDefaultFilter } = useAdvancedSearch();
  const [filters, setFilters] = useState<SearchFilters>({});
  const [categories, setCategories] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState("");
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  useEffect(() => {
    fetchCategories();
    loadDefaultFilter();
  }, [savedFilters]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true);
    if (data) setCategories(data);
  };

  const loadDefaultFilter = () => {
    const defaultFilter = savedFilters.find(f => f.is_default);
    if (defaultFilter && Object.keys(filters).length === 0) {
      setFilters(defaultFilter.filter_data);
      onFiltersChange(defaultFilter.filter_data);
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleArrayFilterToggle = (key: keyof SearchFilters, value: string) => {
    const current = (filters[key] as string[]) || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    handleFilterChange(key, newValue.length > 0 ? newValue : undefined);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      toast.error("Please enter a filter name");
      return;
    }

    await saveFilter(filterName, filters, saveAsDefault);
    setShowSaveDialog(false);
    setFilterName("");
    setSaveAsDefault(false);
  };

  const activeFilterCount = Object.keys(filters).filter(key => filters[key as keyof SearchFilters]).length;

  return (
    <Card className="glass-strong border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Advanced Search
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {activeFilterCount > 0 && (
              <>
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save Filter
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-strong border-border/50">
                    <DialogHeader>
                      <DialogTitle>Save Search Filter</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Filter Name</Label>
                        <Input
                          value={filterName}
                          onChange={(e) => setFilterName(e.target.value)}
                          placeholder="e.g., High Priority Open"
                          className="glass border-border/50"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="default"
                          checked={saveAsDefault}
                          onChange={(e) => setSaveAsDefault(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="default">Set as default filter</Label>
                      </div>
                      <Button onClick={handleSaveFilter} className="w-full">
                        Save Filter
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div>
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or ticket number..."
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10 glass border-border/50"
            />
          </div>
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <Label>Status</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {["open", "in_progress", "under_review", "resolved", "closed", "rejected"].map((status) => (
                <Badge
                  key={status}
                  variant={(filters.status || []).includes(status) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleArrayFilterToggle("status", status)}
                >
                  {status.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <Label>Priority</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {["low", "medium", "high", "urgent"].map((priority) => (
                <Badge
                  key={priority}
                  variant={(filters.priority || []).includes(priority) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleArrayFilterToggle("priority", priority)}
                >
                  {priority}
                </Badge>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <Label>Category</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {categories.map((cat) => (
                <Badge
                  key={cat.id}
                  variant={(filters.category || []).includes(cat.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleArrayFilterToggle("category", cat.id)}
                  style={{
                    borderColor: (filters.category || []).includes(cat.id) ? cat.color : undefined,
                  }}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* SLA Status Filter */}
          <div>
            <Label>SLA Status</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {["on_track", "at_risk", "breached", "met"].map((sla) => (
                <Badge
                  key={sla}
                  variant={(filters.slaStatus || []).includes(sla) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleArrayFilterToggle("slaStatus", sla)}
                >
                  {sla.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <Label>Date From</Label>
            <Input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              className="glass border-border/50"
            />
          </div>
          <div>
            <Label>Date To</Label>
            <Input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              className="glass border-border/50"
            />
          </div>
        </div>

        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div>
            <Label>Saved Filters</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {savedFilters.map((savedFilter) => (
                <div key={savedFilter.id} className="flex items-center gap-1">
                  <Badge
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      setFilters(savedFilter.filter_data);
                      onFiltersChange(savedFilter.filter_data);
                    }}
                  >
                    {savedFilter.is_default && <Star className="w-3 h-3 mr-1 fill-current" />}
                    {savedFilter.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => deleteFilter(savedFilter.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={onSearch} className="w-full bg-gradient-to-r from-primary to-primary-glow">
          <Search className="w-4 h-4 mr-2" />
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}
