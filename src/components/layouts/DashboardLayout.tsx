import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  LayoutDashboard,
  FileText,
  PlusCircle,
  Bell,
  Settings,
  LogOut,
  Users,
  BarChart3,
  MessageSquare,
  FolderOpen,
  Tag,
  BookOpen,
  Megaphone,
  HelpCircle,
  Menu,
  X,
  ChevronDown,
  Brain,
  Vote,
  Zap,
  Activity,
  FileStack,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

const studentNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: FileText, label: "My Complaints", path: "/dashboard/complaints" },
  { icon: PlusCircle, label: "New Complaint", path: "/dashboard/complaints/new" },
  { icon: Vote, label: "Polls", path: "/dashboard/polls" },
  { icon: Bell, label: "Notifications", path: "/dashboard/notifications" },
  { icon: BookOpen, label: "Knowledge Base", path: "/dashboard/knowledge" },
  { icon: HelpCircle, label: "FAQs", path: "/dashboard/faqs" },
];

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: FileText, label: "All Complaints", path: "/admin/complaints" },
  { icon: Activity, label: "Activity Feed", path: "/admin/activity" },
  { icon: Users, label: "Users", path: "/admin/users" },
  { icon: BarChart3, label: "Analytics", path: "/admin/analytics" },
  { icon: Vote, label: "Polls", path: "/admin/polls" },
  { icon: Brain, label: "AI Training", path: "/admin/ai-training" },
  { icon: Zap, label: "Automation", path: "/admin/automation" },
  { icon: FileStack, label: "Templates", path: "/admin/templates" },
  { icon: FolderOpen, label: "Categories", path: "/admin/categories" },
  { icon: Tag, label: "Tags", path: "/admin/tags" },
  { icon: MessageSquare, label: "Canned Responses", path: "/admin/responses" },
  { icon: BookOpen, label: "Knowledge Base", path: "/admin/knowledge" },
  { icon: Megaphone, label: "Announcements", path: "/admin/announcements" },
  { icon: HelpCircle, label: "FAQs", path: "/admin/faqs" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Enable realtime notifications
  useRealtimeNotifications(user?.id);

  const navItems = role === "admin" ? adminNavItems : studentNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Animated orbs */}
      <div className="orb w-96 h-96 bg-primary -top-48 -left-48 fixed" style={{ animationDelay: '0s' }} />
      <div className="orb w-80 h-80 bg-primary-glow bottom-0 right-0 fixed" style={{ animationDelay: '4s' }} />

      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 glass rounded-lg"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-72 glass-strong border-r border-border/50 z-40 transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border/50 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold gradient-text">Brototype</span>
            </Link>
            <ThemeToggle />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                    isActive
                      ? "bg-gradient-to-r from-primary/20 to-primary-glow/20 text-primary border border-primary/30"
                      : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-border/50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-3 px-4 hover:bg-secondary/50">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                      {user?.email ? getInitials(user.email) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{role}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass-strong border-border/50">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-72 min-h-screen relative z-10">
        <div className="p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
