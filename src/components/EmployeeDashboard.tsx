import React, { useState, useEffect } from "react";
import { useWorkspace } from "./WorkspaceContext";
import { ClipboardList, LogOut, CheckCircle, Clock, HeartHandshake, AlertCircle, Sparkles, Send, Loader2 } from "lucide-react";

export default function EmployeeDashboard() {
  const { user, logout } = useWorkspace();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checking, setChecking] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Leave Form
  const [leaveType, setLeaveType] = useState("Sick");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [leaveSuccess, setLeaveSuccess] = useState("");
  const [leaveError, setLeaveError] = useState("");

  const headers = {
    "x-user-id": user?.id || "",
    "x-user-role": user?.role || "",
  };

  const fetchEmployeeData = async () => {
    if (!user) return;
    try {
      // 1. Fetch check-in status
      const attendRes = await fetch(`/api/attendance/status?userId=${user.id}`, { headers });
      if (attendRes.ok) {
        const attStatus = await attendRes.json();
        setIsCheckedIn(attStatus.checkedIn);
      }

      // 2. Fetch Tasks & Leaves
      const [tasksRes, leavesRes] = await Promise.all([
        fetch("/api/tasks", { headers }).then(r => r.json()).catch(() => []),
        fetch("/api/leaves", { headers }).then(r => r.json()).catch(() => [])
      ]);

      const allTasks = Array.isArray(tasksRes) ? tasksRes : [];
      setTasks(allTasks.filter((t: any) => t.assignedTo === user.id || t.userId === user.id));
      
      const allLeaves = Array.isArray(leavesRes) ? leavesRes : [];
      setLeaves(allLeaves.filter((l: any) => l.employeeId === user.id));
    } catch (err) {
      console.error("Failed to load employee metrics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, [user]);

  const handleCheckInOut = async () => {
    setChecking(true);
    const endpoint = isCheckedIn ? "/api/attendance/logout" : "/api/attendance/login";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers
        },
        body: JSON.stringify({ userId: user?.id })
      });
      if (res.ok) {
        setIsCheckedIn(!isCheckedIn);
      }
    } catch (err) {
      console.error("Check-in/out request failed", err);
    } finally {
      setChecking(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveSuccess("");
    setLeaveError("");

    if (!startDate || !endDate || !reason) {
      setLeaveError("Please complete all leave parameters first.");
      return;
    }

    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers
        },
        body: JSON.stringify({
          startDate,
          endDate,
          type: leaveType,
          reason,
          employeeName: user?.name,
          employeeId: user?.id
        })
      });
      if (res.ok) {
        setLeaveSuccess("Leave application submitted successfully!");
        setStartDate("");
        setEndDate("");
        setReason("");
        fetchEmployeeData(); // reload list
      } else {
        const d = await res.json();
        setLeaveError(d.error || "Failed to log leave.");
      }
    } catch (err) {
      setLeaveError("Failed to apply leave. Please check backend connection.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6 selection:bg-orange-500 selection:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 mb-8 gap-4">
        <div>
          <span className="bg-orange-500/10 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
            Employee Workspace
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-orange-500" /> Employee Self-Service Dashboard
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Welcome, <span className="text-slate-900 font-bold">{user?.name}</span> • Department: {user?.department || "General Staff"}
          </p>
        </div>

        <button
          onClick={logout}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Attendance & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black tracking-tight mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" /> Work Hour Tracking
            </h2>

            <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-100 mb-6">
              <p className="text-xs text-slate-400 font-semibold mb-1">CURRENT STATUS</p>
              <h3 className={`text-xl font-extrabold ${isCheckedIn ? "text-emerald-600" : "text-amber-600"}`}>
                {isCheckedIn ? "Checked In (ड्यूटी पर हैं)" : "Checked Out (ड्यूटी से बाहर)"}
              </h3>
            </div>

            <button
              onClick={handleCheckInOut}
              disabled={checking}
              className={`w-full py-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                isCheckedIn
                  ? "bg-amber-600 hover:bg-amber-500 text-white"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating Status...
                </>
              ) : isCheckedIn ? (
                "Clock Out (ड्यूटी समाप्त करें)"
              ) : (
                "Clock In (ड्यूटी शुरू करें)"
              )}
            </button>
          </div>

          {/* Assigned Tasks */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black tracking-tight mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-500" /> My Tasks ({tasks.length})
            </h2>
            {loading ? (
              <p className="text-xs text-slate-400 py-3">Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No active tasks assigned to you.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {tasks.map((task) => (
                  <div key={task.id} className="py-2.5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{task.title}</p>
                      <p className="text-[10px] text-slate-400">Due: {task.dueDate} • Priority: {task.priority}</p>
                    </div>
                    {task.completed ? (
                      <span className="text-emerald-600 font-semibold text-[10px]">Completed</span>
                    ) : (
                      <span className="text-amber-600 font-semibold text-[10px]">Pending</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leave Application Form and History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black tracking-tight mb-4 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-orange-500" /> Apply for Leave
            </h2>

            {leaveSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl mb-4 font-semibold">{leaveSuccess}</div>}
            {leaveError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl mb-4 font-semibold">{leaveError}</div>}

            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Sick">Sick Leave</option>
                    <option value="Casual">Casual Leave</option>
                    <option value="Maternity">Maternity Leave</option>
                    <option value="Paternity">Paternity Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Reason for Leave</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why you are applying for leave..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Send className="w-4 h-4" /> Apply Now
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-black tracking-tight mb-4">My Leave History ({leaves.length})</h2>
            {loading ? (
              <p className="text-xs text-slate-400 py-3">Loading history...</p>
            ) : leaves.length === 0 ? (
              <p className="text-xs text-slate-400 py-3">No leave logs present.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaves.map((l) => (
                  <div key={l.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{l.type} Leave</p>
                      <p className="text-[10px] text-slate-400">{l.startDate} to {l.endDate} • {l.reason}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      l.status === "approved"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                        : l.status === "pending"
                        ? "bg-amber-50 text-amber-600 border-amber-100"
                        : "bg-red-50 text-red-600 border-red-100"
                    }`}>
                      {l.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
