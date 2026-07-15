import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  position?: string;
  phone?: string;
}

export interface TenantInfo {
  tenantId: string;
  companyName: string;
  status: string;
  package: string; // "Free Trial" | "Growth" | "Enterprise"
}

export interface CompanyInfo {
  companyId: string;
  companyName: string;
  setupCompleted: boolean;
}

export interface FeatureFlags {
  crm: boolean;
  telecalling: boolean;
  settings: boolean;
  reports: boolean;
  documentVault: boolean;
  billing: boolean;
  hrms: boolean;
  payroll: boolean;
  fieldSales: boolean;
  analytics: boolean;
}

export interface PermissionsList {
  canManageTenants: boolean;
  canViewSystemAnalytics: boolean;
  canManageCompany: boolean;
  canViewAllLeads: boolean;
  canAssignLeads: boolean;
  canManageStaff: boolean;
  canViewReports: boolean;
  canManageBackups: boolean;
  canManagePayroll: boolean;
  canSubmitSupportTicket: boolean;
  canCheckInOut: boolean;
}

interface WorkspaceContextType {
  user: UserSession | null;
  tenant: TenantInfo | null;
  company: CompanyInfo | null;
  pkg: { name: string; features: FeatureFlags } | null;
  permissions: PermissionsList | null;
  featureFlags: FeatureFlags | null;
  loading: boolean;
  login: (userData: UserSession) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updatePackage: (newPackage: "Free Trial" | "Growth" | "Enterprise") => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [pkg, setPkg] = useState<{ name: string; features: FeatureFlags } | null>(null);
  const [permissions, setPermissions] = useState<PermissionsList | null>(null);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSessionDetails = async (currentUser: UserSession) => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "GET",
        headers: {
          "x-user-id": currentUser.id,
          "x-user-role": currentUser.role,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setTenant(data.tenant);
          setCompany(data.company);
          setPkg(data.package);
          setPermissions(data.permissions);
          setFeatureFlags(data.featureFlags);
          
          // Cache in localStorage too
          localStorage.setItem("telecrm_user_session", JSON.stringify(data.user));
          return;
        }
      }
    } catch (err) {
      console.error("Workspace Session API call failed. Using local fallback.", err);
    }

    // Fallback logic if API fails (offline or loading)
    setUser(currentUser);
    const mockPackage = currentUser.role === "admin" ? "Enterprise" : "Free Trial";
    setTenant({
      tenantId: currentUser.role === "admin" ? "t-default" : "t-trial",
      companyName: "Offline Company",
      status: "active",
      package: mockPackage,
    });
    setCompany({
      companyId: "c-offline",
      companyName: "Offline Company",
      setupCompleted: true,
    });
    const defaultFlags: FeatureFlags = {
      crm: true,
      telecalling: true,
      settings: true,
      reports: mockPackage === "Enterprise",
      documentVault: mockPackage === "Enterprise",
      billing: mockPackage === "Enterprise",
      hrms: mockPackage === "Enterprise",
      payroll: mockPackage === "Enterprise",
      fieldSales: mockPackage === "Enterprise",
      analytics: mockPackage === "Enterprise",
    };
    setFeatureFlags(defaultFlags);
    setPkg({ name: mockPackage, features: defaultFlags });
    setPermissions({
      canManageTenants: currentUser.role === "super_admin",
      canViewSystemAnalytics: ["super_admin", "admin"].includes(currentUser.role),
      canManageCompany: ["super_admin", "admin"].includes(currentUser.role),
      canViewAllLeads: ["super_admin", "admin", "sub-admin"].includes(currentUser.role),
      canAssignLeads: ["admin", "sub-admin"].includes(currentUser.role),
      canManageStaff: ["admin", "sub-admin"].includes(currentUser.role),
      canViewReports: ["admin", "sub-admin"].includes(currentUser.role),
      canManageBackups: currentUser.role === "admin",
      canManagePayroll: ["admin", "sub-admin"].includes(currentUser.role),
      canSubmitSupportTicket: true,
      canCheckInOut: true,
    });
  };

  const refreshSession = async () => {
    const cached = localStorage.getItem("telecrm_user_session");
    if (cached) {
      try {
        const currentUser = JSON.parse(cached);
        await fetchSessionDetails(currentUser);
      } catch (err) {
        console.error("Failed to parse cached session during recovery", err);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (userData: UserSession) => {
    setLoading(true);
    localStorage.setItem("telecrm_user_session", JSON.stringify(userData));
    await fetchSessionDetails(userData);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    if (user && user.id !== "u-admin") {
      try {
        await fetch("/api/attendance/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
            "x-user-role": user.role,
          },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (err) {
        console.error("Attendance logout check-out failed during session end", err);
      }
    }

    // Clear state
    setUser(null);
    setTenant(null);
    setCompany(null);
    setPkg(null);
    setPermissions(null);
    setFeatureFlags(null);
    localStorage.removeItem("telecrm_user_session");
    setLoading(false);
  };

  const updatePackage = async (newPackage: "Free Trial" | "Growth" | "Enterprise"): Promise<boolean> => {
    if (!user || !tenant) return false;
    try {
      const res = await fetch("/api/auth/update-package", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-role": user.role,
        },
        body: JSON.stringify({
          tenantId: tenant.tenantId,
          newPackage,
        }),
      });

      if (res.ok) {
        await fetchSessionDetails(user);
        return true;
      }
    } catch (err) {
      console.error("Failed to update tenant subscription package", err);
    }
    return false;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        tenant,
        company,
        pkg,
        permissions,
        featureFlags,
        loading,
        login,
        logout,
        refreshSession,
        updatePackage,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}

export function useFeature(featureName: keyof FeatureFlags): boolean {
  const { featureFlags } = useWorkspace();
  return featureFlags ? !!featureFlags[featureName] : false;
}

export function usePermission(permissionName: keyof PermissionsList): boolean {
  const { permissions } = useWorkspace();
  return permissions ? !!permissions[permissionName] : false;
}
