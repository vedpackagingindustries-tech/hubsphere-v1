import React, { ReactNode, useState } from "react";
import { useWorkspace, FeatureFlags } from "./WorkspaceContext";
import { ShieldAlert, Sparkles, Check, ArrowRight, Loader2, Home, Landmark, Lock } from "lucide-react";

interface RouteGuardProps {
  roles?: string[];
  feature?: keyof FeatureFlags;
  fallbackToHome?: boolean;
  children: ReactNode;
}

export function RouteGuard({ roles, feature, children }: RouteGuardProps) {
  const { user, featureFlags, updatePackage } = useWorkspace();
  const [upgrading, setUpgrading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!user) {
    return <AccessDenied reason="Not authenticated" />;
  }

  // 1. Role Check
  if (roles && roles.length > 0) {
    const hasRole = roles.map(r => r.toLowerCase()).includes(user.role.toLowerCase());
    if (!hasRole) {
      return <AccessDenied reason={`Insufficient permissions. Required roles: ${roles.join(", ")}`} />;
    }
  }

  // 2. Feature Flag Check
  if (feature && featureFlags) {
    const isFeatureEnabled = featureFlags[feature];
    if (!isFeatureEnabled) {
      return (
        <UpgradeRequired
          featureName={feature}
          onUpgrade={async (newPackage) => {
            setUpgrading(true);
            const success = await updatePackage(newPackage);
            setUpgrading(false);
            if (success) {
              setSuccessMsg(`Congratulations! Your workspace has been upgraded to the ${newPackage} Plan.`);
            }
          }}
          upgrading={upgrading}
          successMsg={successMsg}
        />
      );
    }
  }

  return <>{children}</>;
}

export function AccessDenied({ reason }: { reason: string }) {
  const { logout } = useWorkspace();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl max-w-xl mx-auto my-12 animate-fade-in text-white">
      <div className="bg-red-500/10 p-5 rounded-2xl border border-red-500/30 mb-6">
        <ShieldAlert className="w-12 h-12 text-red-400" />
      </div>
      <h2 className="text-2xl font-black tracking-tight mb-2">Access Denied (अनुमति अस्वीकृत)</h2>
      <p className="text-slate-400 text-sm max-w-sm mb-6 leading-relaxed">
        You do not have administrative authority or sufficient credentials to access this secure zone.
      </p>
      <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-red-300 font-mono mb-8 max-w-md break-all">
        {reason}
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
        >
          Retry Connection
        </button>
        <button
          onClick={logout}
          className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-500/10"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

interface UpgradeRequiredProps {
  featureName: string;
  onUpgrade: (pkgName: "Growth" | "Enterprise") => Promise<void>;
  upgrading: boolean;
  successMsg: string;
}

export function UpgradeRequired({ featureName, onUpgrade, upgrading, successMsg }: UpgradeRequiredProps) {
  const [selectedTier, setSelectedTier] = useState<"Growth" | "Enterprise">("Enterprise");

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 bg-slate-950 text-white selection:bg-orange-500 select-none">
      <div className="max-w-4xl w-full bg-slate-900/60 border border-slate-800/80 p-8 md:p-12 rounded-3xl shadow-3xl backdrop-blur-md relative overflow-hidden">
        {/* Abstract Background Accents */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        {successMsg ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="inline-flex bg-emerald-500/10 p-4 rounded-full border border-emerald-500/20 mb-6">
              <Check className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white mb-4">Workspace Activated!</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              {successMsg} Your subscription parameters have been dynamically rebuilt. Feel free to resume.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] shadow-lg shadow-orange-500/20"
            >
              Reload Workspace
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20 text-orange-400 text-[10px] font-bold tracking-widest uppercase mb-4">
                👑 Plan Upgrade Required
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                Unlock {featureName.toUpperCase()} Module
              </h2>
              <p className="text-slate-400 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
                Your current Free Trial subscription does not include the <span className="text-white font-bold">{featureName}</span> segment. Upgrade to unlock full enterprise productivity tools.
              </p>
            </div>

            {/* Bento Grid Packages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {/* Growth Tier */}
              <div
                onClick={() => setSelectedTier("Growth")}
                className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                  selectedTier === "Growth"
                    ? "bg-slate-900 border-orange-500/60 ring-2 ring-orange-500/20"
                    : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg text-white">Growth Plan</h3>
                  {selectedTier === "Growth" && <Check className="w-5 h-5 text-orange-500" />}
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-black text-white">₹3,499</span>
                  <span className="text-slate-500 text-xs">/month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Best for expanding small business teams who need leads management and call history reports.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" /> CRM Leads & Telecalling
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" /> Advanced Reports
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" /> Document Vault
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" /> Billing System
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <Lock className="w-3.5 h-3.5" /> Full HRMS & Payroll
                  </li>
                </ul>
              </div>

              {/* Enterprise Tier */}
              <div
                onClick={() => setSelectedTier("Enterprise")}
                className={`p-6 rounded-2xl border relative cursor-pointer transition-all ${
                  selectedTier === "Enterprise"
                    ? "bg-slate-900 border-orange-500/60 ring-2 ring-orange-500/20"
                    : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80"
                }`}
              >
                <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Highly Recommended
                </div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg text-white">Enterprise Plan</h3>
                  {selectedTier === "Enterprise" && <Check className="w-5 h-5 text-orange-500" />}
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-black text-white">₹7,999</span>
                  <span className="text-slate-500 text-xs">/month</span>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Full industrial parameters including employee payroll, real-time GPS tracking, and complete CRM dashboards.
                </p>
                <ul className="space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" /> All Growth Plan Features
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" /> Complete HRMS Dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" /> Payroll & Commission Engine
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" /> GPS-based Attendance Logging
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-orange-500" /> AI Copilot Analytics & Grounding
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-slate-800/60 gap-4">
              <span className="text-xs text-slate-400">
                100% Risk-Free. Switch plans or cancel anytime with simple, zero-hassle returns.
              </span>
              <button
                onClick={() => onUpgrade(selectedTier)}
                disabled={upgrading}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {upgrading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Provisioning...
                  </>
                ) : (
                  <>
                    Activate {selectedTier} Plan <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
