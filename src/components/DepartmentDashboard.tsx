import React, { useState, useEffect } from "react";
import { useWorkspace } from "./WorkspaceContext";
import { LayoutDashboard, Users, FolderCheck, Calendar, FileText, CheckCircle2, PhoneCall, TrendingUp, LogOut } from "lucide-react";

export default function DepartmentDashboard() {
  const { user, logout } = useWorkspace();
  const [deptLeads, setDeptLeads] = useState<any[]>([]);
  const [deptStaff, setDeptStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch departments members and assigned leads
    const loadDeptData = async () => {
      try {
        const headers = {
          "x-user-id": user?.id || "",
          "x-user-role": user?.role || "",
        };

        const [leadsRes, usersRes] = await Promise.all([
          fetch("/api/leads", { headers }).then(r => r.json()),
          fetch("/api/admin/users", { headers }).then(r => r.json()).catch(() => ({ success: false, users: [] }))
        ]);

        const allLeads = Array.isArray(leadsRes) ? leadsRes : (leadsRes.leads || []);
        const allUsers = usersRes.users || [];

        // Filter by user's department
        const filteredStaff = allUsers.filter((u: any) => u.department === user?.department);
        setDeptStaff(filteredStaff);

        const staffIds = filteredStaff.map((s: any) => s.id);
        const filteredLeads = allLeads.filter((l: any) => l.assignedTo && staffIds.includes(l.assignedTo));
        setDeptLeads(filteredLeads);
      } catch (err) {
        console.error("Failed to load department metrics", err);
      } finally {
        setLoading(false);
      }
    };

    loadDeptData();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 mb-8 gap-4">
        <div>
          <span className="bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
            {user?.department || "General"} Operations
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-orange-500" /> Department Head Dashboard
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Welcome back, <span className="text-slate-900 font-bold">{user?.name}</span> • Position: {user?.position || "Sub-Admin"}
          </p>
        </div>

        <button
          onClick={logout}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-500 text-xs font-semibold">Active Department Staff</span>
            <Users className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{deptStaff.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">All members working in {user?.department}</p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-500 text-xs font-semibold">Assigned Sales Leads</span>
            <FolderCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{deptLeads.length}</div>
          <p className="text-[10px] text-slate-500 mt-1">Direct responsibility pipeline</p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-500 text-xs font-semibold">Performance Standing</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">Excellent</div>
          <p className="text-[10px] text-slate-500 mt-1">Updated in real-time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Staff List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight mb-4">Department Members ({user?.department})</h2>
          {loading ? (
            <p className="text-xs text-slate-500 py-4">Loading staff...</p>
          ) : deptStaff.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No staff registered in your department yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {deptStaff.map((staff) => (
                <div key={staff.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{staff.name}</p>
                    <p className="text-[10px] text-slate-400">{staff.email} • {staff.position || "Staff"}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                    staff.status === "active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-600 border-red-100"
                  }`}>
                    {staff.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department Leads Assignment overview */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-black tracking-tight mb-4">Assigned Active Leads</h2>
          {loading ? (
            <p className="text-xs text-slate-500 py-4">Loading leads...</p>
          ) : deptLeads.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No leads assigned to department staff currently.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {deptLeads.map((lead) => (
                <div key={lead.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{lead.name}</p>
                    <p className="text-[10px] text-slate-400">Assigned To: {lead.assignedName || "Unknown"} • {lead.phone}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[10px]">
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
