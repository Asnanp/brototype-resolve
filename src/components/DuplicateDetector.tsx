import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface DuplicateDetectorProps {
  title: string;
  userId?: string;
}

interface SimilarComplaint {
  id: string;
  ticket_number: string;
  title: string;
  status: string;
  created_at: string;
}

export function DuplicateDetector({ title, userId }: DuplicateDetectorProps) {
  const [similar, setSimilar] = useState<SimilarComplaint[]>([]);

  useEffect(() => {
    if (title.length < 5) {
      setSimilar([]);
      return;
    }
    const timer = setTimeout(() => searchSimilar(title), 500);
    return () => clearTimeout(timer);
  }, [title]);

  const searchSimilar = async (query: string) => {
    const words = query.split(" ").filter((w) => w.length > 3).slice(0, 3);
    if (words.length === 0) return;

    const orConditions = words.map((w) => `title.ilike.%${w}%`).join(",");

    const queryBuilder = supabase
      .from("complaints")
      .select("id, ticket_number, title, status, created_at")
      .or(orConditions)
      .not("status", "in", '("closed","rejected")')
      .order("created_at", { ascending: false })
      .limit(3);

    if (userId) {
      queryBuilder.eq("student_id", userId);
    }

    const { data } = await queryBuilder;
    setSimilar(data || []);
  };

  if (similar.length === 0) return null;

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-warning">Possible duplicates found</p>
            <p className="text-xs text-muted-foreground">
              Similar complaints already exist. Check before submitting:
            </p>
            <div className="space-y-1.5">
              {similar.map((c) => (
                <Link
                  key={c.id}
                  to={`/dashboard/complaints/${c.id}`}
                  target="_blank"
                  className="flex items-center gap-2 text-xs hover:text-primary transition-colors"
                >
                  <span className="font-mono text-muted-foreground">{c.ticket_number}</span>
                  <span className="truncate">{c.title}</span>
                  <Badge variant="outline" className="text-[10px] ml-auto">
                    {c.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
