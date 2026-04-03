// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// ── Existing pages ─────────────────────────────────────────────────────────────
import Dashboard          from "./pages/Dashboard";
import Employees          from "./pages/Employees";
import Attendance         from "./pages/Attendance";
import Accounting         from "./pages/Accounting";
import Performance        from "./pages/Performance";
import Leave              from "./pages/Leave";
import Recruitment        from "./pages/Recruitment";
import Training           from "./pages/Training";
import ArchivedEmployees  from "./pages/ArchivedEmployees";
import Login              from "./pages/Login";
import NotFound           from "./pages/NotFound";

// ── New pages (copy files from the outputs folder into src/pages/) ─────────────


const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ── Public ──────────────────────────────────────────────────────── */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* ── Existing protected pages ─────────────────────────────────────── */}
          <Route path="/"                   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/employees"          element={<PrivateRoute><Employees /></PrivateRoute>} />
          <Route path="/attendance"         element={<PrivateRoute><Attendance /></PrivateRoute>} />
          <Route path="/payroll"            element={<PrivateRoute><Accounting /></PrivateRoute>} />
          <Route path="/performance"        element={<PrivateRoute><Performance /></PrivateRoute>} />
          <Route path="/leave"              element={<PrivateRoute><Leave /></PrivateRoute>} />
          <Route path="/recruitment"        element={<PrivateRoute><Recruitment /></PrivateRoute>} />
          <Route path="/training"           element={<PrivateRoute><Training /></PrivateRoute>} />
          <Route path="/archived-employees" element={<PrivateRoute><ArchivedEmployees /></PrivateRoute>} />

          {/* ── New protected pages ──────────────────────────────────────────── */}
    

          {/* ── 404 ─────────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;