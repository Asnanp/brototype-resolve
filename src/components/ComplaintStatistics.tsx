import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";

interface ComplaintStatisticsProps {
  studentId?: string;
}

export const ComplaintStatistics = ({ studentId }: ComplaintStatisticsProps) => {
  const [statusData, setStatusData] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    fetchStatistics();
  }, [studentId]);

  const fetchStatistics = async () => {
    try {
      let query = supabase.from("complaints").select("status, priority, category:categories(name, color)");
      
      if (studentId) {
        query = query.eq("student_id", studentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Process status data
      const statusCounts = data?.reduce((acc: any, complaint) => {
        acc[complaint.status] = (acc[complaint.status] || 0) + 1;
        return acc;
      }, {});

      const statusChartData = Object.entries(statusCounts || {}).map(([status, count]) => ({
        name: status.replace("_", " "),
        value: count as number,
      }));

      setStatusData(statusChartData);

      // Process priority data
      const priorityCounts = data?.reduce((acc: any, complaint) => {
        acc[complaint.priority] = (acc[complaint.priority] || 0) + 1;
        return acc;
      }, {});

      const priorityChartData = Object.entries(priorityCounts || {}).map(([priority, count]) => ({
        name: priority,
        value: count as number,
      }));

      setPriorityData(priorityChartData);

      // Process category data
      const categoryCounts = data?.reduce((acc: any, complaint) => {
        const categoryName = complaint.category?.name || "Uncategorized";
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {});

      const categoryChartData = Object.entries(categoryCounts || {})
        .map(([category, count]) => ({
          name: category,
          value: count as number,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      setCategoryData(categoryChartData);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--info))', 'hsl(var(--warning))'];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="glass-strong border-border/50 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Complaints by Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="glass-strong border-border/50 hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-primary" />
            Priority Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
