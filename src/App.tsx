import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
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
            
            {/* Student Dashboard Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/complaints" element={
              <ProtectedRoute requiredRole="student">
                <MyComplaints />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/complaints/new" element={
              <ProtectedRoute requiredRole="student">
                <NewComplaint />
              </ProtectedRoute>
            } />
            <Route path="/dashboard/complaints/:id" element={
              <ProtectedRoute>
                <ComplaintDetail />
              </ProtectedRoute>
            } />
            
            {/* Admin Dashboard Routes */}
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/complaints" element={
              <ProtectedRoute requiredRole="admin">
                <AllComplaints />
              </ProtectedRoute>
            } />
            <Route path="/admin/complaints/:id" element={
              <ProtectedRoute requiredRole="admin">
                <ComplaintDetail />
              </ProtectedRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
