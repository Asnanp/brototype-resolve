import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import StudentDashboard from "./pages/dashboard/StudentDashboard";
import MyComplaints from "./pages/dashboard/MyComplaints";
import NewComplaint from "./pages/dashboard/NewComplaint";
import ComplaintDetail from "./pages/dashboard/ComplaintDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AllComplaints from "./pages/admin/AllComplaints";
import UserManagement from "./pages/admin/UserManagement";
import Analytics from "./pages/admin/Analytics";
import AutomationRules from "./pages/admin/AutomationRules";
import ComplaintWidget from "./pages/ComplaintWidget";
import ActivityFeed from "./pages/admin/ActivityFeed";
import ComplaintTemplates from "./pages/admin/ComplaintTemplates";
import PollManagement from "./pages/admin/PollManagement";
import CategoryManagement from "./pages/admin/CategoryManagement";
import TagManagement from "./pages/admin/TagManagement";
import CannedResponses from "./pages/admin/CannedResponses";
import KnowledgeBaseAdmin from "./pages/admin/KnowledgeBase";
import Announcements from "./pages/admin/Announcements";
import FAQManagement from "./pages/admin/FAQManagement";
import Settings from "./pages/admin/Settings";
import ComplaintsWithBulkActions from "./pages/admin/ComplaintsWithBulkActions";
import Notifications from "./pages/dashboard/Notifications";
import KnowledgeBase from "./pages/dashboard/KnowledgeBase";
import FAQs from "./pages/dashboard/FAQs";
import Polls from "./pages/dashboard/Polls";
import EmailPreferences from "./pages/dashboard/EmailPreferences";
import AITraining from "./pages/admin/AITraining";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* Public widget route */}
            <Route path="/widget" element={<ComplaintWidget />} />
            
            {/* Student Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/complaints" element={<ProtectedRoute requiredRole="student"><MyComplaints /></ProtectedRoute>} />
            <Route path="/dashboard/complaints/new" element={<ProtectedRoute requiredRole="student"><NewComplaint /></ProtectedRoute>} />
            <Route path="/dashboard/complaints/:id" element={<ProtectedRoute><ComplaintDetail /></ProtectedRoute>} />
            <Route path="/dashboard/notifications" element={<ProtectedRoute requiredRole="student"><Notifications /></ProtectedRoute>} />
            <Route path="/dashboard/knowledge" element={<ProtectedRoute requiredRole="student"><KnowledgeBase /></ProtectedRoute>} />
            <Route path="/dashboard/faqs" element={<ProtectedRoute requiredRole="student"><FAQs /></ProtectedRoute>} />
            <Route path="/dashboard/polls" element={<ProtectedRoute requiredRole="student"><Polls /></ProtectedRoute>} />
            <Route path="/dashboard/email-preferences" element={<ProtectedRoute requiredRole="student"><EmailPreferences /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            
            {/* Admin Dashboard Routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/complaints" element={<ProtectedRoute requiredRole="admin"><ComplaintsWithBulkActions /></ProtectedRoute>} />
            <Route path="/admin/complaints/:id" element={<ProtectedRoute requiredRole="admin"><ComplaintDetail /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute requiredRole="admin"><Analytics /></ProtectedRoute>} />
            <Route path="/admin/automation" element={<ProtectedRoute requiredRole="admin"><AutomationRules /></ProtectedRoute>} />
            <Route path="/admin/activity" element={<ProtectedRoute requiredRole="admin"><ActivityFeed /></ProtectedRoute>} />
            <Route path="/admin/templates" element={<ProtectedRoute requiredRole="admin"><ComplaintTemplates /></ProtectedRoute>} />
            <Route path="/admin/polls" element={<ProtectedRoute requiredRole="admin"><PollManagement /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute requiredRole="admin"><CategoryManagement /></ProtectedRoute>} />
            <Route path="/admin/tags" element={<ProtectedRoute requiredRole="admin"><TagManagement /></ProtectedRoute>} />
            <Route path="/admin/responses" element={<ProtectedRoute requiredRole="admin"><CannedResponses /></ProtectedRoute>} />
            <Route path="/admin/knowledge" element={<ProtectedRoute requiredRole="admin"><KnowledgeBaseAdmin /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute requiredRole="admin"><Announcements /></ProtectedRoute>} />
            <Route path="/admin/faqs" element={<ProtectedRoute requiredRole="admin"><FAQManagement /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requiredRole="admin"><Settings /></ProtectedRoute>} />
            <Route path="/admin/ai-training" element={<ProtectedRoute requiredRole="admin"><AITraining /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
