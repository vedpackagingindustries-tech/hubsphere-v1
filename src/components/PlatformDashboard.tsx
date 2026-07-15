import React, { useState, useEffect } from "react";
import { useWorkspace } from "./WorkspaceContext";
import { Users, Building, ShieldCheck, Activity, Database, Key, Globe, Search, ArrowUpRight, CheckCircle, Trash2, Award } from "lucide-react";

export default function PlatformDashboard() {
  const { user, logout } = useWorkspace();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [metrics, setMetrics] = useState({
    cpu: 24,
    memory: 42,
    disk: 18,
    activeSockets: 142,
    databaseStatus: "Optimal",
    backupsCount: 12,
  });

  const fetchTenants = async () => {
    try {
      const res = await fetch("/api/auth/all-tenants", {
        headers: {
          "x-user-id": user?.id || "",
          "x-user-role": user?.role || "",
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error("Failed to load platform tenants", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [user]);

  // Handle tenant plan upgrade directly on platform
  const handleUpgradeTenant = async (tenantId: string, newPackage: string) => {
    try {
      const res = await fetch("/api/auth/update-package", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          "x-user-role": user?.role || "",
        },
        body: JSON.stringify({ tenantId, newPackage }),
      });
      if (res.ok) {
        fetchTenants(); // reload
      }
    } catch (err) {
      console.error("Failed to upgrade tenant plan", err);
    }
  };

  // Simulated live resource updates
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        cpu: Math.min(Math.max(prev.cpu + Math.floor(Math.random() * 5) - 2, 5), 90),
        memory: Math.min(Math.max(prev.memory + Math.floor(Math.random() * 3) - 1, 30), 85),
      }));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const filteredTenants = tenants.filter((t) =>
    t.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tenantId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-orange-500 selection:text-white p-6">
      {/* Upper Navigation Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full">
              Core Platform Control
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Globe className="w-8 h-8 text-orange-500" /> Platform Infrastructure Dashboard
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Logged in as Super Admin: <span className="text-white font-semibold">{user?.name}</span> ({user?.email})
          </p>
        </div>

        <button
          onClick={logout}
          className="px-5 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white text-xs font-bold rounded-xl transition-all border border-red-500/20"
        >
          Exit Platform Console
        </button>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-xs font-semibold">Total Tenants</span>
            <Building className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-black">{tenants.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Multi-tenant microservices running</p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-xs font-semibold">CPU Utilization</span>
            <Activity className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div className="text-3xl font-black">{metrics.cpu}%</div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${metrics.cpu}%` }} />
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-xs font-semibold">RAM Usage</span>
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-black">{metrics.memory}%</div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${metrics.memory}%` }} />
          </div>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-400 text-xs font-semibold">DB Health Status</span>
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400">{metrics.databaseStatus}</div>
          <p className="text-[10px] text-slate-500 mt-1">Database locks / sync verified</p>
        </div>
      </div>

      {/* Tenants Table & Details */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-6 border-b border-slate-800 gap-4">
          <div>
            <h2 className="text-xl font-black tracking-tight">Active Customer Tenants</h2>
            <p className="text-slate-400 text-xs">Verify billing tier, setup records, and operational configurations.</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search companies or tenant IDs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading tenants...</div>
        ) : filteredTenants.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No tenants matched search parameters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Company Details</th>
                  <th className="py-3 px-4">Tenant ID</th>
                  <th className="py-3 px-4">Active Subscription Package</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.tenantId} className="hover:bg-slate-800/20 transition-all">
                    <td className="py-4 px-4 font-bold text-white flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-600/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-black">
                        {tenant.companyName?.substring(0, 2).toUpperCase() || "TN"}
                      </div>
                      <div>
                        <div>{tenant.companyName}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{tenant.companyEmail || "No registered email"}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-[10px] text-slate-400">{tenant.tenantId}</td>
                    <td className="py-4 px-4">
                      <select
                        value={tenant.package || (tenant.status === "trial" ? "Free Trial" : "Enterprise")}
                        onChange={(e) => handleUpgradeTenant(tenant.tenantId, e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-orange-500"
                      >
                        <option value="Free Trial">Free Trial</option>
                        <option value="Growth">Growth</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${
                        tenant.status === "active" || tenant.status === "trial"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {tenant.status || "active"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-[10px]">
                      {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : "Default System"}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleUpgradeTenant(tenant.tenantId, "Enterprise")}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[10px] font-bold transition-all"
                      >
                        Enforce Enterprise Package
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
