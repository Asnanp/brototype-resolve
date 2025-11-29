import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { 
  PlusCircle, 
  FileText, 
  BookOpen, 
  HelpCircle,
  Vote,
  Bell,
} from "lucide-react";

interface QuickAction {
  icon: React.ElementType;
  label: string;
  path: string;
  color: string;
  bgGradient: string;
}

const quickActions: QuickAction[] = [
  {
    icon: PlusCircle,
    label: "New Complaint",
    path: "/dashboard/complaints/new",
    color: "text-primary",
    bgGradient: "from-primary/20 to-primary-glow/20",
  },
  {
    icon: FileText,
    label: "My Complaints",
    path: "/dashboard/complaints",
    color: "text-info",
    bgGradient: "from-info/20 to-info/10",
  },
  {
    icon: Vote,
    label: "Active Polls",
    path: "/dashboard/polls",
    color: "text-secondary",
    bgGradient: "from-secondary/20 to-secondary/10",
  },
  {
    icon: BookOpen,
    label: "Knowledge Base",
    path: "/dashboard/knowledge",
    color: "text-accent",
    bgGradient: "from-accent/20 to-accent/10",
  },
  {
    icon: HelpCircle,
    label: "FAQs",
    path: "/dashboard/faqs",
    color: "text-warning",
    bgGradient: "from-warning/20 to-warning/10",
  },
  {
    icon: Bell,
    label: "Notifications",
    path: "/dashboard/notifications",
    color: "text-success",
    bgGradient: "from-success/20 to-success/10",
  },
];

export const QuickActions = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {quickActions.map((action) => (
        <Link key={action.path} to={action.path}>
          <Card className="glass-strong border-border/50 hover-lift cursor-pointer group overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <CardContent className="p-6 flex flex-col items-center gap-3 relative z-10">
              <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${action.bgGradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <action.icon className={`w-6 h-6 ${action.color}`} />
              </div>
              <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">
                {action.label}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};
