import React, { useState, useEffect } from "react";
import { useWorkspace } from "./WorkspaceContext";
import { Users, FileSpreadsheet, LogOut, CheckCircle2, Calendar, ClipboardList, Wallet, HeartHandshake } from "lucide-react";

export default function HRDashboard() {
  const { user, logout } = useWorkspace();
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHRDetails = async () => {
      try {
        const headers = {
          "x-user-id": user?.id || "",
          "x-user-role": user?.role || "",
        };
        const [usersRes, leavesRes] = await Promise.all([
          fetch("/api/admin/users", { headers }).then(r => r.json()).catch(() => ({ users: [] })),
          fetch("/api/leaves", { headers }).then(r => r.json()).catch(() => [])
        ]);

        setEmployees(usersRes.users || []);
        setLeaves(Array.isArray(leavesRes) ? leavesRes : []);
      } catch (err) {
        console.error("Failed to load HR data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHRDetails();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 mb-8 gap-4">
        <div>
          <span className="bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
            Human Resources Management
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <Users className="w-8 h-8 text-orange-500" /> HR Administrator Dashboard
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Logged in as: <span className="text-slate-900 font-bold">{user?.name}</span> • Position: HR Head / Manager
          </p>
        </div>

        <button
          onClick={logout}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Grid Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-500 text-xs font-semibold">Total Sub-Admin / Employees</span>
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{employees.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Personnel records registered in system</p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-500 text-xs font-semibold">Pending Leave Requests</span>
            <ClipboardList className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{leaves.filter(l => l.status === "pending").length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Leaves awaiting review</p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-500 text-xs font-semibold">Active Org Tiers</span>
            <Wallet className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">Unified Payroll</div>
          <p className="text-[10px] text-slate-500 mt-1">Base salaries + monthly commissions active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Employees Listing */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight mb-4">Organizational Directory</h2>
          {loading ? (
            <p className="text-xs text-slate-500 py-4">Loading directory...</p>
          ) : employees.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No employees registered yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {employees.map((emp) => (
                <div key={emp.id} className="py-3.5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">Department: {emp.department || "Sales"} • Position: {emp.position || "Telecaller"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">Base: ₹{emp.salaryBase || 12000}</p>
                    <p className="text-[10px] text-slate-400">Comm: ₹{emp.commissionRate || 100}/lead</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Requests */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight mb-4">Recent Leave Requests</h2>
          {loading ? (
            <p className="text-xs text-slate-500 py-4">Loading leaves...</p>
          ) : leaves.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No leave requests logged in the system.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {leaves.map((leave) => (
                <div key={leave.id} className="py-3 flex flex-col sm:flex-row justify-between text-xs gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{leave.employeeName || "Employee"}</p>
                    <p className="text-[10px] text-slate-400">Duration: {leave.startDate} to {leave.endDate} • {leave.type}</p>
                    <p className="text-[10px] text-slate-500 italic mt-0.5">Reason: "{leave.reason}"</p>
                  </div>
                  <div className="self-start sm:self-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      leave.status === "approved"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : leave.status === "pending"
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-red-50 text-red-600 border-red-100"
                    }`}>
                      {leave.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
