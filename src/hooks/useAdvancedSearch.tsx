import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SearchFilters {
  search?: string;
  status?: string[];
  priority?: string[];
  category?: string[];
  dateFrom?: string;
  dateTo?: string;
  assignedTo?: string;
  slaStatus?: string[];
}

export interface SavedFilter {
  id: string;
  name: string;
  filter_data: SearchFilters;
  is_default: boolean;
}

export function useAdvancedSearch() {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSavedFilters();
  }, []);

  const fetchSavedFilters = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_filters")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedFilters((data || []) as SavedFilter[]);
    } catch (error) {
      console.error("Error fetching saved filters:", error);
    }
  };

  const saveFilter = async (name: string, filters: SearchFilters, isDefault = false) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // If setting as default, unset other defaults
      if (isDefault) {
        await supabase
          .from("saved_filters")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { error } = await supabase.from("saved_filters").insert([{
        user_id: user.id,
        name,
        filter_data: filters as any,
        is_default: isDefault,
      }]);

      if (error) throw error;

      toast.success("Filter saved successfully");
      fetchSavedFilters();
    } catch (error: any) {
      console.error("Error saving filter:", error);
      toast.error("Failed to save filter");
    } finally {
      setLoading(false);
    }
  };

  const deleteFilter = async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_filters")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Filter deleted");
      fetchSavedFilters();
    } catch (error: any) {
      console.error("Error deleting filter:", error);
      toast.error("Failed to delete filter");
    }
  };

  const setDefaultFilter = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Unset all defaults
      await supabase
        .from("saved_filters")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Set new default
      const { error } = await supabase
        .from("saved_filters")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      toast.success("Default filter updated");
      fetchSavedFilters();
    } catch (error: any) {
      console.error("Error setting default:", error);
      toast.error("Failed to set default filter");
    }
  };

  return {
    savedFilters,
    loading,
    saveFilter,
    deleteFilter,
    setDefaultFilter,
    refreshFilters: fetchSavedFilters,
  };
}
