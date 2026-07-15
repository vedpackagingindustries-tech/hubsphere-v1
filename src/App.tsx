import { useState } from "react";
import { WorkspaceProvider, useWorkspace } from "./components/WorkspaceContext";
import { RouteGuard } from "./components/RouteGuard";
import LoginScreen from "./components/LoginScreen";
import AdminDashboard from "./components/AdminDashboard";
import TelecallerDashboard from "./components/TelecallerDashboard";
import CompanyRegistration from "./components/CompanyRegistration";
import SetupWizard from "./components/SetupWizard";

// Role-based Dashboards
import PlatformDashboard from "./components/PlatformDashboard";
import DepartmentDashboard from "./components/DepartmentDashboard";
import HRDashboard from "./components/HRDashboard";
import EmployeeDashboard from "./components/EmployeeDashboard";

import { Loader2 } from "lucide-react";

function RootApp() {
  const { user, loading, login, logout } = useWorkspace();
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'setup'>('login');
  const [registeredCompany, setRegisteredCompany] = useState<{
    tenantId: string;
    companyId: string;
    adminUserId: string;
    adminName: string;
    adminEmail: string;
    companyName: string;
  } | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
        <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
          Initializing secure workspace context...
        </p>
      </div>
    );
  }

  // Not authenticated view router
  if (!user) {
    if (currentView === "register") {
      return (
        <CompanyRegistration
          onRegisterSuccess={(data) => {
            setRegisteredCompany(data);
            setCurrentView("setup");
          }}
          onNavigateToLogin={() => setCurrentView("login")}
        />
      );
    }

    if (currentView === "setup" && registeredCompany) {
      return (
        <SetupWizard
          tenantId={registeredCompany.tenantId}
          companyId={registeredCompany.companyId}
          companyName={registeredCompany.companyName}
          onSetupComplete={() => {
            setCurrentView("login");
            setRegisteredCompany(null);
          }}
        />
      );
    }

    return (
      <LoginScreen
        onLoginSuccess={async (userData) => {
          await login(userData);
          setCurrentView("login");
        }}
        onNavigateToRegister={() => setCurrentView("register")}
      />
    );
  }

  // Authenticated: Route intelligently based on user role
  const role = user.role.toLowerCase();

  if (role === "super_admin") {
    return (
      <RouteGuard roles={["super_admin"]}>
        <PlatformDashboard />
      </RouteGuard>
    );
  }

  if (role === "admin") {
    return (
      <RouteGuard roles={["admin"]}>
        <AdminDashboard user={user as any} onLogout={logout} />
      </RouteGuard>
    );
  }

  if (role === "sub-admin" || role === "head") {
    // If head of HR department, show HR dashboard, else standard department head dashboard
    if (user.department?.toLowerCase() === "hr" || user.department?.toLowerCase() === "hrm") {
      return (
        <RouteGuard roles={["sub-admin", "head"]}>
          <HRDashboard />
        </RouteGuard>
      );
    }
    return (
      <RouteGuard roles={["sub-admin", "head"]}>
        <DepartmentDashboard />
      </RouteGuard>
    );
  }

  if (role === "hr_manager") {
    return (
      <RouteGuard roles={["hr_manager"]}>
        <HRDashboard />
      </RouteGuard>
    );
  }

  if (role === "telecaller") {
    return (
      <RouteGuard roles={["telecaller"]}>
        <TelecallerDashboard user={user as any} onLogout={logout} />
      </RouteGuard>
    );
  }

  // Fallback for staff or employees
  return (
    <RouteGuard roles={["employee", "staff"]}>
      <EmployeeDashboard />
    </RouteGuard>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <div className="bg-slate-50 min-h-screen text-slate-800 font-sans selection:bg-orange-500 selection:text-white">
        <RootApp />
      </div>
    </WorkspaceProvider>
  );
}
