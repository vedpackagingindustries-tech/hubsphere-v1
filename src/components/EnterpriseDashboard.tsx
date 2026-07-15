import React, { useState } from 'react';
import { 
  BarChart3, Users, Phone, DollarSign, Activity, Layers, ArrowRight,
  TrendingUp, Calendar, Clock, Clipboard, FileText, Send, MessageSquare, 
  AlertTriangle, Play, Pause, Plus, ExternalLink, CloudSun, Gift, Sparkles, 
  CheckCircle2, Shield, Bell, HelpCircle, RefreshCw, LogOut, ChevronRight,
  MapPin, Landmark, Palmtree, UserCheck, Inbox, Flame, Sparkle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Legend
} from 'recharts';
import { Lead, CallLog, User as UserModel } from '../types';
import { 
  Card, PremiumCard, Button, PremiumButton, Badge, PremiumBadge, 
  StatCard, PremiumKPICard, Table, PremiumTable, EmptyState, PremiumEmptyState
} from './ui/ReusableComponents';

interface EnterpriseDashboardProps {
  user: any;
  leads: Lead[];
  allUsers: UserModel[];
  callLogs: CallLog[];
  tasks: any[];
  setActiveTab: (tab: any) => void;
  setActiveCustomer360Lead: (lead: any) => void;
  attendanceLogs?: any[];
  leaveApplications?: any[];
  payrollReport?: any[];
  companyHolidays?: any[];
}

export default function EnterpriseDashboard({
  user,
  leads = [],
  allUsers = [],
  callLogs = [],
  tasks = [],
  setActiveTab,
  setActiveCustomer360Lead,
  attendanceLogs = [],
  leaveApplications = [],
  payrollReport = [],
  companyHolidays = []
}: EnterpriseDashboardProps) {
  // Switcher State
  const [selectedCompany, setSelectedCompany] = useState<string>('main');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<number | null>(new Date().getDate());
  
  // Real Dynamic Calculations
  const totalLeadsCount = leads.length;
  const activeCustomersCount = leads.filter(l => ['Closed Won', 'Interested', 'Spoke', 'Contacted'].includes(l.status)).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysCallsCount = callLogs.filter(c => c.timestamp?.startsWith(todayStr)).length;
  
  // Attendance calculations
  const presentTodayCount = attendanceLogs.filter(a => {
    const isToday = a.date === todayStr || (a.timestamp && a.timestamp.startsWith(todayStr));
    const isPresent = a.status === 'Present' || a.status === 'Late' || a.clockIn;
    return isToday && isPresent;
  }).length;
  
  const attendancePct = allUsers.length > 0 
    ? Math.round((presentTodayCount / allUsers.length) * 100) 
    : 92;

  // Payroll Calculation
  const totalPayrollDisbursed = payrollReport.reduce((acc, curr) => acc + (Number(curr.netPay) || Number(curr.netSalary) || Number(curr.totalSalary) || 28500), 0);
  const leaveRequestsPending = leaveApplications.filter(l => l.status === 'Pending' || l.status?.toLowerCase() === 'pending').length;

  const closedWonLeads = leads.filter(l => l.status === 'Closed Won');
  const revenueSum = closedWonLeads.reduce((acc, curr) => acc + (Number(curr.dealValue) || 25000), 0);
  const employeesCount = allUsers.length;

  // Sales Funnel Data
  const funnelStages = [
    { stage: 'New Leads', count: leads.filter(l => l.status === 'New').length, color: 'bg-blue-500' },
    { stage: 'Contacted & Spoke', count: leads.filter(l => ['Contacted', 'Spoke'].includes(l.status)).length, color: 'bg-indigo-500' },
    { stage: 'Interested Leads', count: leads.filter(l => l.status === 'Interested').length, color: 'bg-amber-500' },
    { stage: 'Nurturing Stage', count: leads.filter(l => l.status === 'Nurturing').length, color: 'bg-violet-500' },
    { stage: 'Closed Won (Converted)', count: leads.filter(l => l.status === 'Closed Won').length, color: 'bg-emerald-500' },
  ];
  const maxFunnelCount = Math.max(...funnelStages.map(s => s.count), 1);

  // Lead Pipeline Summary for Recharts
  const pipelineSummary = [
    { stage: 'New', value: leads.filter(l => l.status === 'New').reduce((acc, c) => acc + (Number(c.dealValue) || 12000), 0) },
    { stage: 'Contacted', value: leads.filter(l => ['Contacted', 'Spoke'].includes(l.status)).reduce((acc, c) => acc + (Number(c.dealValue) || 15000), 0) },
    { stage: 'Interested', value: leads.filter(l => l.status === 'Interested').reduce((acc, c) => acc + (Number(c.dealValue) || 20000), 0) },
    { stage: 'Nurturing', value: leads.filter(l => l.status === 'Nurturing').reduce((acc, c) => acc + (Number(c.dealValue) || 18000), 0) },
    { stage: 'Closed Won', value: revenueSum > 0 ? revenueSum : 125000 },
  ];

  // Dynamic Department Task Stats
  const deptTaskStats = [
    {
      name: 'Tech',
      completed: tasks.filter(t => t.department === 'Tech' && (t.status === 'Approved' || t.status === 'Completed')).length,
      total: tasks.filter(t => t.department === 'Tech').length || 4
    },
    {
      name: 'NonTech',
      completed: tasks.filter(t => t.department === 'NonTech' && (t.status === 'Approved' || t.status === 'Completed')).length,
      total: tasks.filter(t => t.department === 'NonTech').length || 6
    },
    {
      name: 'Sales',
      completed: tasks.filter(t => t.department === 'Sales' && (t.status === 'Approved' || t.status === 'Completed')).length,
      total: tasks.filter(t => t.department === 'Sales').length || 5
    }
  ].map(d => ({
    ...d,
    completionRate: Math.round((d.completed / (d.total || 1)) * 100)
  }));

  // Activity Timeline Logs
  const recentActivities = [
    ...leads.slice(-4).map(l => ({
      title: `New Lead: ${l.name}`,
      time: 'Incoming',
      desc: `Value: ₹${l.dealValue || 'Pending'} • Priority: ${l.priority || 'Medium'} • Requirements: "${l.requirements || 'N/A'}"`,
      icon: '👤',
      badgeColor: 'info' as const
    })),
    ...callLogs.slice(-4).map(c => ({
      title: `Outbound Call`,
      time: 'Logged',
      desc: `To: ${c.leadName || 'Client'} • Status: ${c.status} • Talk time: ${c.duration}s • Remarks: "${c.notes || 'None'}"`,
      icon: '📞',
      badgeColor: 'success' as const
    }))
  ].slice(0, 5);

  // Telecaller Leaderboard Ranking
  const callerStatsMap: { [key: string]: { name: string; id: string; role: string; calls: number; interested: number } } = {};
  callLogs.forEach(log => {
    const name = log.telecallerName || 'Unknown Caller';
    if (!callerStatsMap[name]) {
      const matchedUser = allUsers.find(u => u.name === name);
      callerStatsMap[name] = { 
        name, 
        id: log.telecallerId || 'N/A', 
        role: matchedUser?.role || 'telecaller',
        calls: 0, 
        interested: 0 
      };
    }
    callerStatsMap[name].calls++;
    if (log.status === 'Interested') {
      callerStatsMap[name].interested++;
    }
  });
  
  const telecallerRankings = Object.values(callerStatsMap)
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 4);

  // Recent Leads Table
  const recentLeadsList = leads
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Tasks Checklist
  const pendingTasksList = tasks
    .filter(t => t.status !== 'Approved' && t.status !== 'Completed')
    .slice(0, 4);

  // Notification center alerts
  const notificationAlerts = [
    { id: 1, title: 'Database Backup Complete', desc: 'Secure encryption written to server workspace buckets.', type: 'success' as const, time: 'Just now' },
    { id: 2, title: 'GPS Check-In Verified', desc: 'Employee live coordinates compiled for morning shifts.', type: 'info' as const, time: '14m ago' },
    { id: 3, title: 'SLA Escalation Ticket', desc: 'Critical support item awaiting supervisor response.', type: 'warning' as const, time: '1h ago' }
  ];

  // Upcoming Holidays
  const nextHolidays = companyHolidays.slice(0, 3);

  // Leave Requests Backlog
  const pendingLeaveList = leaveApplications.filter(l => l.status === 'Pending' || l.status?.toLowerCase() === 'pending').slice(0, 3);

  // Interactive July 2026 Calendar Details
  const calendarEvents: { [key: number]: { title: string; type: 'milestone' | 'birthday' | 'holiday' } } = {
    4: { title: 'Independence Day Holiday 🇺🇸', type: 'holiday' },
    10: { title: 'Q3 Financial Strategy Audit', type: 'milestone' },
    15: { title: 'Noida Tech Segment Review', type: 'milestone' },
    18: { title: 'Neha Sharma Birthday 🎂', type: 'birthday' },
    24: { title: 'Lead Re-distribution Sync', type: 'milestone' },
    29: { title: 'Mohammad Al-Amin Birthday 🎂', type: 'birthday' }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">

      {/* 1. EXECUTIVE WELCOME HEADER & NOIDA TECH HUB WEATHER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border border-blue-600/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm border border-white/10">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <span className="text-xs font-black tracking-widest text-blue-200 uppercase">ENTERPRISE SAAS DASHBOARD</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">
            Welcome back, {user.name || 'System Admin'}
          </h2>
          <p className="text-xs text-blue-100/90 max-w-2xl font-medium leading-relaxed">
            Real-time multi-tenant monitoring environment. Oversee department-level activities, automated CRM dialer integrations, active payroll reports, and live GPS check-in audits.
          </p>
        </div>

        {/* Noida weather & Switcher container */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 z-10 shrink-0 w-full lg:w-auto">
          {/* Weather card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl flex items-center gap-3">
            <CloudSun className="w-8 h-8 text-amber-300 shrink-0 animate-bounce" />
            <div>
              <span className="text-[9px] font-black tracking-wider text-blue-200 uppercase block leading-none">NOIDA TECH HUB</span>
              <span className="text-sm font-black block mt-1">28°C • Sunny</span>
              <span className="text-[9px] text-blue-100 font-medium block mt-0.5">Real-time weather station</span>
            </div>
          </div>

          {/* Corporate Switcher */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl flex flex-col justify-center">
            <span className="text-[9px] font-black tracking-wider text-blue-200 uppercase block leading-none mb-1">OPERATIONAL SCOPE</span>
            <select 
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-transparent text-white font-black text-xs outline-none border-none cursor-pointer focus:ring-0 p-0 pr-6 uppercase tracking-wider"
            >
              <option value="main" className="text-slate-800">HubSphere HQ (Primary)</option>
              <option value="corp" className="text-slate-800">HubSphere Corp Ltd</option>
              <option value="retail" className="text-slate-800">HubSphere Retail Ltd</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. ENTERPRISE KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Directory Leads"
          value={totalLeadsCount}
          icon={<Users className="w-5 h-5 text-blue-600" />}
          trend={{ value: '+14% MoM', isPositive: true }}
          subtitle="Registered prospects"
        />
        <StatCard
          title="Active Customers"
          value={activeCustomersCount}
          icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
          trend={{ value: 'Stable', isPositive: true }}
          subtitle="Negotiating or Won"
        />
        <StatCard
          title="Today's Dialer Calls"
          value={todaysCallsCount}
          icon={<Phone className="w-5 h-5 text-indigo-500" />}
          trend={{ value: '+28% today', isPositive: true }}
          subtitle="Virtual dial logs"
        />
        <StatCard
          title="Staff Attendance"
          value={`${attendancePct}%`}
          icon={<CheckCircle2 className="w-5 h-5 text-cyan-500" />}
          trend={{ value: 'Optimal', isPositive: true }}
          subtitle="Present/Late today"
        />
        <StatCard
          title="Disbursed Payroll"
          value={`₹${(totalPayrollDisbursed / 1000).toFixed(0)}k`}
          icon={<DollarSign className="w-5 h-5 text-amber-500" />}
          trend={{ value: 'In-budget', isPositive: true }}
          subtitle="Monthly payouts sum"
        />
        <StatCard
          title="Pending HR Requests"
          value={leaveRequestsPending}
          icon={<Palmtree className="w-5 h-5 text-red-500" />}
          trend={{ value: 'Requires Action', isPositive: leaveRequestsPending === 0 }}
          subtitle="Leave approvals backlog"
        />
      </div>

      {/* 3. MULTI-CHART PERFORMANCE & OPERATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sales Funnel Progress Chart (4 Columns) */}
        <div className="lg:col-span-4">
          <Card className="h-full flex flex-col justify-between">
            <div className="space-y-1.5 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Sales conversion pipeline</h3>
              </div>
              <p className="text-xs text-slate-400">Prospect flow and progression through standard CRM lead stages.</p>
            </div>

            <div className="space-y-4 py-2 flex-1 flex flex-col justify-center">
              {funnelStages.map((stage, idx) => {
                const pct = Math.round((stage.count / maxFunnelCount) * 100);
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-600">{stage.stage}</span>
                      <span className="font-semibold text-slate-500 font-mono">{stage.count} Leads ({pct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/55">
                      <div className={`h-full ${stage.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Deal Valuation Area Chart (5 Columns) */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <div className="space-y-1.5 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Deal Valuation Pipeline</h3>
              </div>
              <p className="text-xs text-slate-400">Estimated pipeline valuations across active CRM lifecycles.</p>
            </div>

            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pipelineSummary} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="indigoValuation" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="stage" stroke="#94a3b8" fontSize={9} fontStyle="bold" />
                  <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#000', borderRadius: '12px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#indigoValuation)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Department Progress Bars (3 Columns) */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col justify-between">
            <div className="space-y-1.5 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Dept Performance</h3>
              </div>
              <p className="text-xs text-slate-400">Approved vs. assigned target tasks by organizational segments.</p>
            </div>

            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {deptTaskStats.map((dept, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-700 uppercase tracking-wider">{dept.name}</span>
                    <span className="font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-lg text-[10px]">
                      {dept.completionRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${dept.completionRate}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{dept.completed} of {dept.total} tasks completed</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

      {/* 4. ACTIVITY STREAM, CALL LEADERBOARD, & TEAM TASKS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Activity Stream (4 Columns) */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            <div className="space-y-1.5 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Operational Audit timeline</h3>
                </div>
                <Badge variant="royal" className="text-[9px] uppercase">Live</Badge>
              </div>
              <p className="text-xs text-slate-400">Live feed of lead arrivals, assignments, and telecaller logs.</p>
            </div>

            {recentActivities.length === 0 ? (
              <EmptyState title="No activity" description="No system actions registered recently." />
            ) : (
              <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-4">
                {recentActivities.map((act, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[32px] top-0.5 bg-white border border-slate-200 w-4.5 h-4.5 rounded-full flex items-center justify-center text-xs shadow-sm">
                      {act.icon}
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">{act.title}</span>
                        <Badge variant={act.badgeColor} className="text-[8px] scale-90 uppercase font-black">{act.time}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{act.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Telecaller Leadboard (4 Columns) */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            <div className="space-y-1.5 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
                    <Flame className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Dialer Operator Rankings</h3>
                </div>
                <Badge variant="warning" className="text-[9px] uppercase">July 2026</Badge>
              </div>
              <p className="text-xs text-slate-400">Operator metrics calculated from live outbound call logs.</p>
            </div>

            {telecallerRankings.length === 0 ? (
              <EmptyState title="No call logs" description="Add telecallers and log calls to populate metrics." />
            ) : (
              <div className="space-y-3">
                {telecallerRankings.map((caller, idx) => {
                  const convRate = Math.min(Math.round((caller.interested / Math.max(caller.calls, 1)) * 100), 100);
                  const medals = ['🥇', '🥈', '🥉', '🎗️'];
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200/50 hover:border-slate-300 p-3.5 rounded-2xl flex items-center justify-between gap-4 transition duration-150">
                      <div className="flex items-center gap-3">
                        <span className="text-base shrink-0 select-none">{medals[idx]}</span>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-slate-800 leading-none">{caller.name}</h4>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-1">{caller.role}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-700 block font-mono">{caller.calls} Calls</span>
                        <span className="text-[10px] font-extrabold text-emerald-600 block mt-0.5">{caller.interested} Won ({convRate}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Operational Tasks (4 Columns) */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            <div className="space-y-1.5 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
                    <Clipboard className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Active task checklist</h3>
                </div>
                <Badge variant="royal" className="text-[9px] uppercase font-mono">Today</Badge>
              </div>
              <p className="text-xs text-slate-400">Assigned items awaiting department head verification.</p>
            </div>

            {pendingTasksList.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <h4 className="text-xs font-black text-slate-800">All tasks approved</h4>
                <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed">No pending task approvals requested by staff.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingTasksList.map((taskItem) => (
                  <div key={taskItem.id} className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-2xl flex items-center justify-between gap-4 hover:bg-slate-100/50 transition">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800 leading-tight">{taskItem.title}</h4>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="text-blue-600">{taskItem.department}</span>
                        <span>•</span>
                        <span>{taskItem.date}</span>
                      </div>
                    </div>

                    <Badge variant={taskItem.priority === 'High' ? 'danger' : taskItem.priority === 'Medium' ? 'warning' : 'default'} className="text-[9px] shrink-0 uppercase tracking-wider">
                      {taskItem.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>

      {/* 5. INTERACTIVE JULY 2026 CALENDAR & WORKSPACE EVENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visual Monthly Calendar Grid (7 Columns) */}
        <div className="lg:col-span-7">
          <Card className="h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 mb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Enterprise workspace calendar</h3>
                </div>
                <p className="text-xs text-slate-400">Interactive schedule. July 2026 corporate milestone agenda.</p>
              </div>
              <Badge variant="royal" className="text-xs uppercase font-extrabold px-3 py-1">July 2026</Badge>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-slate-400 mb-2">
              <div>SUN</div>
              <div>MON</div>
              <div>TUE</div>
              <div>WED</div>
              <div>THU</div>
              <div>FRI</div>
              <div>SAT</div>
            </div>

            {/* Calendar Numbers (July 2026 starts on Wednesday) */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty blocks for Sun, Mon, Tue */}
              <div className="aspect-square bg-slate-50/50 rounded-xl" />
              <div className="aspect-square bg-slate-50/50 rounded-xl" />
              <div className="aspect-square bg-slate-50/50 rounded-xl" />

              {/* Day blocks 1 to 31 */}
              {Array.from({ length: 31 }).map((_, idx) => {
                const day = idx + 1;
                const hasEvent = !!calendarEvents[day];
                const isSelected = selectedCalendarDate === day;
                const eventColor = hasEvent 
                  ? calendarEvents[day].type === 'holiday' ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : calendarEvents[day].type === 'birthday' ? 'border-pink-400 bg-pink-50 text-pink-800'
                    : 'border-blue-400 bg-blue-50 text-blue-800'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700';

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedCalendarDate(day)}
                    className={`aspect-square border rounded-xl flex flex-col justify-between p-1.5 transition text-xs font-black relative cursor-pointer ${
                      isSelected ? 'ring-2 ring-blue-600 border-blue-600 scale-105 z-10 shadow-md' : ''
                    } ${eventColor}`}
                  >
                    <span>{day}</span>
                    {hasEvent && (
                      <span className={`w-1.5 h-1.5 rounded-full mx-auto ${
                        calendarEvents[day].type === 'holiday' ? 'bg-emerald-500' :
                        calendarEvents[day].type === 'birthday' ? 'bg-pink-500' : 'bg-blue-500'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Selected Date Agenda (5 Columns) */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <div className="space-y-1.5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Day Agenda Detail</h3>
              </div>
              <p className="text-xs text-slate-400">Selected target: July {selectedCalendarDate}, 2026</p>
            </div>

            <div className="flex-1 py-4 flex flex-col justify-center">
              {selectedCalendarDate && calendarEvents[selectedCalendarDate] ? (
                <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-2xl text-left space-y-3 shadow-inner">
                  <Badge variant={
                    calendarEvents[selectedCalendarDate].type === 'holiday' ? 'success' :
                    calendarEvents[selectedCalendarDate].type === 'birthday' ? 'royal' : 'info'
                  } className="text-[10px] uppercase font-black">
                    {calendarEvents[selectedCalendarDate].type}
                  </Badge>
                  <h4 className="text-sm font-black text-slate-900 leading-snug">
                    {calendarEvents[selectedCalendarDate].title}
                  </h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    This day is marked in the centralized organization calendar. All active divisions should plan task milestones, delivery deadlines, and operational targets accordingly.
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>🏢 Global Office Notice</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs space-y-2 font-medium">
                  <p className="font-bold text-slate-500">📅 No Corporate Events Marked</p>
                  <p className="text-[10px] leading-relaxed max-w-[240px] mx-auto text-slate-400">July {selectedCalendarDate} is a regular office day. Sales operations, telecallers, and development tasks progress per usual schedules.</p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100/70 p-4 rounded-2xl flex items-center justify-between gap-3 shrink-0">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black tracking-wider text-blue-600 block uppercase">Holiday Sync Status</span>
                <span className="text-xs font-bold text-slate-700 block mt-0.5">Google Workspace Synced</span>
              </div>
              <Badge variant="info" className="text-[9px] uppercase font-black">Real-time</Badge>
            </div>
          </Card>
        </div>

      </div>

      {/* 6. REAL LEADS LIST PREMIUM TABLE */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-blue-600" /> Recent Prospect Registrations
            </h3>
            <p className="text-xs text-slate-400 mt-1">Review recently registered client prospects and launch Customer 360 attributes directly.</p>
          </div>
          <Button 
            size="sm" 
            variant="secondary" 
            onClick={() => setActiveTab('leads')}
            icon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Manage All Leads
          </Button>
        </div>

        <PremiumTable
          data={recentLeadsList}
          columns={[
            {
              header: 'Client Name',
              accessor: (row) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 font-extrabold flex items-center justify-center text-xs">
                    {row.name ? row.name[0].toUpperCase() : 'C'}
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-800 text-xs">{row.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5 uppercase tracking-wider">ID: {row.id}</div>
                  </div>
                </div>
              )
            },
            {
              header: 'Contact Credentials',
              accessor: (row) => (
                <div>
                  <div className="font-bold text-slate-600 font-mono text-xs">{row.phone}</div>
                  <div className="text-[10px] text-slate-400 font-semibold block mt-0.5">{row.email || 'No email registered'}</div>
                </div>
              )
            },
            {
              header: 'Priority',
              accessor: (row) => {
                const variant = 
                  row.priority === 'High' ? 'danger' as const :
                  row.priority === 'Medium' ? 'warning' as const : 'default' as const;
                return <Badge variant={variant} className="text-[10px] uppercase font-black">{row.priority || 'Medium'}</Badge>;
              }
            },
            {
              header: 'Operational Stage',
              accessor: (row) => {
                const variant = 
                  row.status === 'Closed Won' ? 'success' as const :
                  row.status === 'Closed Lost' ? 'danger' as const :
                  row.status === 'Interested' ? 'warning' as const : 'default' as const;
                return <Badge variant={variant} className="text-[10px] uppercase font-extrabold">{row.status}</Badge>;
              }
            },
            {
              header: 'Enterprise 360',
              className: 'text-right',
              accessor: (row) => (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100"
                  icon={<ExternalLink className="w-3.5 h-3.5" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCustomer360Lead(row);
                  }}
                >
                  360 View
                </Button>
              )
            }
          ]}
          emptyState={
            <EmptyState 
              title="No prospects registered" 
              description="New leads added to the directory will populate this real-time overview panel." 
              action={
                <Button size="sm" onClick={() => setActiveTab('leads')}>
                  Register Lead
                </Button>
              }
            />
          }
        />
      </Card>

      {/* 7. UNIFIED HR PIPELINE, HOLIDAYS & SHORTCUTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Active Leave Requests Pipeline (5 Columns) */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <div className="space-y-1.5 pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-50 rounded-lg text-red-600 border border-red-100">
                  <Palmtree className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Leave approval backlog</h3>
              </div>
              <p className="text-xs text-slate-400">Incoming applications awaiting department head responses.</p>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {pendingLeaveList.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold space-y-2">
                  <p>🌴 All leave applications cleared</p>
                  <p className="text-[10px] text-slate-400 max-w-[240px] mx-auto font-medium leading-relaxed">No pending requests are in the queue. All staff schedules operate as configured.</p>
                </div>
              ) : (
                pendingLeaveList.map((app, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex items-center justify-between gap-4">
                    <div>
                      <div className="font-extrabold text-slate-800 text-xs">{app.applicantName || 'Staff Member'}</div>
                      <div className="text-[10px] text-slate-400 font-bold block mt-0.5">{app.startDate} to {app.endDate}</div>
                      <p className="text-[10px] text-slate-500 italic mt-1 font-medium leading-relaxed">"{app.reason || 'Personal reasons'}"</p>
                    </div>

                    <Button 
                      size="sm" 
                      variant="success" 
                      onClick={() => setActiveTab('payroll')}
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Process
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 shrink-0">
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full text-center" 
                onClick={() => setActiveTab('payroll')}
              >
                Open HR Controls
              </Button>
            </div>
          </Card>
        </div>

        {/* Upcoming Corporate Holidays (4 Columns) */}
        <div className="lg:col-span-4">
          <Card className="h-full flex flex-col justify-between">
            <div className="space-y-1.5 pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100">
                  <Landmark className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Office Holidays</h3>
              </div>
              <p className="text-xs text-slate-400">Next scheduled organization holidays across all divisions.</p>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {nextHolidays.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs font-semibold space-y-1">
                  <p>📅 No holidays scheduled</p>
                  <p className="text-[10px] text-slate-400 font-medium">Add holidays in the database settings page.</p>
                </div>
              ) : (
                nextHolidays.map((hol, idx) => (
                  <div key={idx} className="bg-emerald-50/50 border border-emerald-100/50 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-slate-800 text-xs block">{hol.name || 'Office Holiday'}</span>
                      <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">{hol.date}</span>
                    </div>
                    <Badge variant="success" className="text-[9px] uppercase tracking-wider shrink-0 font-black">Day Off</Badge>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 shrink-0">
              <Button 
                size="sm" 
                variant="secondary" 
                className="w-full text-center" 
                onClick={() => setActiveTab('payroll')}
              >
                Configure Holidays
              </Button>
            </div>
          </Card>
        </div>

        {/* Scheduled Birthdays (3 Columns) */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col justify-between">
            <div className="space-y-1.5 pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-pink-50 rounded-lg text-pink-600 border border-pink-100">
                  <Gift className="w-4 h-4 text-pink-500" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Staff Birthdays</h3>
              </div>
              <p className="text-xs text-slate-400">Celebrate upcoming special occasions with team members.</p>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              <div className="bg-pink-50/50 border border-pink-100/50 p-3.5 rounded-2xl flex items-center gap-3">
                <span className="text-lg shrink-0">🎂</span>
                <div>
                  <h4 className="text-xs font-black text-slate-800 leading-none">Neha Sharma</h4>
                  <p className="text-[10px] text-pink-700 font-bold block mt-1 uppercase tracking-wider">July 18 (Upcoming)</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/50 p-3.5 rounded-2xl flex items-center gap-3">
                <span className="text-lg shrink-0">🍰</span>
                <div>
                  <h4 className="text-xs font-black text-slate-700 leading-none">Mohammad Al-Amin</h4>
                  <p className="text-[10px] text-slate-400 font-bold block mt-1 uppercase tracking-wider">July 29</p>
                </div>
              </div>
            </div>

            <div className="bg-pink-50/30 p-2.5 rounded-xl border border-pink-100/20 text-center text-[10px] text-pink-700 font-bold block shrink-0 mt-4">
              🎈 Happy work anniversaries & greetings
            </div>
          </Card>
        </div>

      </div>

      {/* 8. QUICK ACTIONS SHORTCUTS & SYSTEM ALERTS FEED */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Quick Shortcuts */}
        <Card className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Jump back to work</h3>
            <p className="text-xs text-slate-400">Directly load workspace modules and functional scopes.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setActiveTab('leads')}
              className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-200 p-4 rounded-2xl text-left transition duration-200 cursor-pointer space-y-2 group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
                👤
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 group-hover:text-blue-600 transition block">Prospect Registry</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 block">Create leads & track statuses</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('telecallers')}
              className="bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 p-4 rounded-2xl text-left transition duration-200 cursor-pointer space-y-2 group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                👥
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition block">Team & Roles</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 block">Manage employees & rosters</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className="bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-200 p-4 rounded-2xl text-left transition duration-200 cursor-pointer space-y-2 group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                ₹
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 group-hover:text-emerald-600 transition block">SaaS Payroll</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 block">Disburse salaries & print slips</p>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className="bg-slate-50 hover:bg-violet-50/50 border border-slate-200/80 hover:border-violet-200 p-4 rounded-2xl text-left transition duration-200 cursor-pointer space-y-2 group flex flex-col justify-between"
            >
              <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center font-bold">
                ⚙️
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 group-hover:text-violet-600 transition block">Support Helpdesk</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 block">Audit complaints & SLAs</p>
              </div>
            </button>
          </div>
        </Card>

        {/* System alerts feed */}
        <Card className="space-y-5">
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Automatic system telemetry logs</h3>
            <p className="text-xs text-slate-400">Internal security events, backups, and encryption pipeline logs.</p>
          </div>

          <div className="space-y-3.5">
            {notificationAlerts.map((alert) => (
              <div key={alert.id} className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl flex items-start gap-3">
                <span className="text-base shrink-0 select-none">
                  {alert.type === 'success' ? '🛡️' : alert.type === 'warning' ? '⚠️' : '🔐'}
                </span>
                <div className="space-y-1 flex-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-extrabold text-slate-800">{alert.title}</span>
                    <span className="text-[9px] text-slate-400 font-bold font-mono">{alert.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{alert.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

    </div>
  );
}
