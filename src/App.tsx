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
import ArchivedEmployees  from "./pages/ArchivedEmployees";
import Login              from "./pages/Login";
import NotFound           from "./pages/NotFound";

// ── New pages (copy files from the outputs folder into src/pages/) ─────────────
import Recruitment        from "./pages/Recruitment";
import Leave              from "./pages/Leave";
import Overtime           from "./pages/Overtime";
import HolidayCalendar    from "./pages/HolidayCalendar";
import SalaryRevision     from "./pages/SalaryRevision";
import TrainingModule     from "./pages/TrainingModule";
import YearEndTax         from "./pages/YearEndTax";
import ShiftManagement    from "./pages/ShiftManagement";

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
          <Route path="/archived-employees" element={<PrivateRoute><ArchivedEmployees /></PrivateRoute>} />

          {/* ── New protected pages ──────────────────────────────────────────── */}
          <Route path="/recruitment"        element={<PrivateRoute><Recruitment /></PrivateRoute>} />
          <Route path="/leave"              element={<PrivateRoute><Leave /></PrivateRoute>} />
          <Route path="/overtime"           element={<PrivateRoute><Overtime /></PrivateRoute>} />
          <Route path="/holidays"           element={<PrivateRoute><HolidayCalendar /></PrivateRoute>} />
          <Route path="/salary-revisions"   element={<PrivateRoute><SalaryRevision /></PrivateRoute>} />
          <Route path="/training"           element={<PrivateRoute><TrainingModule /></PrivateRoute>} />
          <Route path="/year-end-tax"       element={<PrivateRoute><YearEndTax /></PrivateRoute>} />
          <Route path="/shifts"             element={<PrivateRoute><ShiftManagement /></PrivateRoute>} />

          {/* ── 404 ─────────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;