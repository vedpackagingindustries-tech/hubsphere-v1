import React, { useState, useMemo } from "react";
import { useWorkspace } from "./WorkspaceContext";
import { 
  BarChart3, Users, DollarSign, Calendar, RefreshCw, FileText, 
  Download, Printer, Plus, Briefcase, Clock, User, Eye, 
  ArrowUpRight, TrendingUp, Check, Trash2, Search, Filter, 
  TrendingDown, Sparkles, ChevronRight, Share2, Mail, Clock3, 
  Layout, EyeOff, Clipboard, HelpCircle, Table, BarChart, 
  CalendarDays, Settings, Play, Send, ChevronDown, CheckCircle
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Lead, CallLog, User as SystemUser } from "../types";

// Prop declarations
interface EnterpriseReportsProps {
  leads: Lead[];
  allUsers: any[];
  callLogs: CallLog[];
  attendanceLogs: any[];
  leaveApplications: any[];
  payrollReport: any[];
  companyHolidays: any[];
  tasks: any[];
}

// Custom Saved Report Type
interface SavedReport {
  id: string;
  name: string;
  module: string;
  dimension: string;
  metric: string;
  metricField: string;
  createdAt: string;
  notes: string;
}

// Custom Report Schedule Type
interface ReportSchedule {
  id: string;
  name: string;
  reportType: string;
  frequency: "Daily" | "Weekly" | "Monthly";
  email: string;
  hour: string;
  active: boolean;
  lastSent?: string;
}

export default function EnterpriseReportsWorkspace({
  leads = [],
  allUsers = [],
  callLogs = [],
  attendanceLogs = [],
  leaveApplications = [],
  payrollReport = [],
  companyHolidays = [],
  tasks = []
}: EnterpriseReportsProps) {
  const { tenant, company, user: currentUser } = useWorkspace();
  const tenantId = tenant?.tenantId || "t-default";
  const companyId = company?.companyId || "c-default";

  // Active workspace tab
  const [activeTab, setActiveTab] = useState<"executive" | "crm" | "hr" | "payroll" | "sales" | "builder" | "schedules">("executive");

  // Global filters
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "quarter" | "year" | "custom">("month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("All");

  // Custom Report Builder States
  const [builderModule, setBuilderModule] = useState<string>("leads");
  const [builderDimension, setBuilderDimension] = useState<string>("status");
  const [builderMetric, setBuilderMetric] = useState<"count" | "sum" | "avg">("count");
  const [builderMetricField, setBuilderMetricField] = useState<string>("dealValue");
  const [builderReportName, setBuilderReportName] = useState<string>("");
  const [builderNotes, setBuilderNotes] = useState<string>("");
  const [savedReports, setSavedReports] = useState<SavedReport[]>([
    {
      id: "sr-1",
      name: "High Value Lead Distribution by Source",
      module: "leads",
      dimension: "source",
      metric: "sum",
      metricField: "dealValue",
      createdAt: "2026-07-10T12:00:00Z",
      notes: "Monitors which marketing sources bring high-ticket prospects."
    },
    {
      id: "sr-2",
      name: "Telecaller Call Activity Status Breakdown",
      module: "calls",
      dimension: "status",
      metric: "count",
      metricField: "duration",
      createdAt: "2026-07-12T09:30:00Z",
      notes: "Tracks call outcome percentage for standard campaigns."
    }
  ]);
  const [activeCustomReport, setActiveCustomReport] = useState<SavedReport | null>(null);

  // Scheduled Reports States
  const [schedules, setSchedules] = useState<ReportSchedule[]>([
    {
      id: "sch-1",
      name: "Daily Executive Flash Summary",
      reportType: "Executive Dashboard",
      frequency: "Daily",
      email: "ipgroup2002@gmail.com",
      hour: "08:00",
      active: true,
      lastSent: "2026-07-13 08:00 AM"
    },
    {
      id: "sch-2",
      name: "Weekly HR Attendance and Burn Rate Report",
      reportType: "HR & Payroll Audit",
      frequency: "Weekly",
      email: "contact.grahicsworld@gmail.com",
      hour: "18:00",
      active: true,
      lastSent: "2026-07-10 06:00 PM"
    }
  ]);
  const [newScheduleName, setNewScheduleName] = useState("");
  const [newScheduleType, setNewScheduleType] = useState("Executive Dashboard");
  const [newScheduleFreq, setNewScheduleFreq] = useState<"Daily" | "Weekly" | "Monthly">("Weekly");
  const [newScheduleEmail, setNewScheduleEmail] = useState("");
  const [newScheduleHour, setNewScheduleHour] = useState("09:00");
  const [scheduleLogs, setScheduleLogs] = useState<any[]>([
    { id: "log-1", scheduleName: "Daily Executive Flash Summary", sentTo: "ipgroup2002@gmail.com", time: "2026-07-13 08:00 AM", status: "Success" },
    { id: "log-2", scheduleName: "Weekly HR Attendance and Burn Rate Report", sentTo: "contact.grahicsworld@gmail.com", time: "2026-07-10 06:00 PM", status: "Success" },
    { id: "log-3", scheduleName: "Daily Executive Flash Summary", sentTo: "ipgroup2002@gmail.com", time: "2026-07-12 08:00 AM", status: "Success" }
  ]);

  // Dashboard Personalization state
  const [layoutPreset, setLayoutPreset] = useState<"bento" | "focus" | "compact">("bento");
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);
  const [showPersonalizer, setShowPersonalizer] = useState(false);

  // Drill-down Detail Modal State
  const [drillDownData, setDrillDownData] = useState<{
    title: string;
    description: string;
    headers: string[];
    rows: any[][];
  } | null>(null);

  // Search queries for individual report grids
  const [crmSearch, setCrmSearch] = useState("");
  const [hrSearch, setHrSearch] = useState("");
  const [payrollSearch, setPayrollSearch] = useState("");
  const [salesSearch, setSalesSearch] = useState("");

  // Helper: Date filter range logic
  const dateBounds = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (dateRange === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === "week") {
      const currentDay = now.getDay();
      const distance = currentDay === 0 ? -6 : 1 - currentDay; // Monday
      start.setDate(now.getDate() + distance);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === "quarter") {
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999);
    } else if (dateRange === "year") {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (dateRange === "custom") {
      if (startDate) start = new Date(startDate);
      else start = new Date(2020, 0, 1);
      if (endDate) {
        end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date();
      }
    }
    return { start, end };
  }, [dateRange, startDate, endDate]);

  // Helper: Filter records respecting dateRange & department & multi-tenant scope
  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      // Isolation verification
      if (l.tenantId && l.tenantId !== tenantId) return false;
      if (l.companyId && l.companyId !== companyId) return false;

      // Date check
      const leadDate = new Date(l.createdAt);
      if (leadDate < dateBounds.start || leadDate > dateBounds.end) return false;

      // Department/segment check
      if (selectedDept !== "All" && selectedDept !== "Sales") {
        return false; // Leads belong to Sales
      }
      return true;
    });
  }, [leads, dateBounds, selectedDept, tenantId, companyId]);

  const filteredCalls = useMemo(() => {
    return callLogs.filter(c => {
      if (c.tenantId && c.tenantId !== tenantId) return false;
      if (c.companyId && c.companyId !== companyId) return false;

      const callDate = new Date(c.timestamp);
      if (callDate < dateBounds.start || callDate > dateBounds.end) return false;

      if (selectedDept !== "All" && selectedDept !== "Sales") return false; // Calls are sales
      return true;
    });
  }, [callLogs, dateBounds, selectedDept, tenantId, companyId]);

  const filteredStaff = useMemo(() => {
    return allUsers.filter(u => {
      if (u.tenantId && u.tenantId !== tenantId) return false;
      if (u.companyId && u.companyId !== companyId) return false;

      if (selectedDept !== "All" && u.department !== selectedDept) return false;
      return true;
    });
  }, [allUsers, selectedDept, tenantId, companyId]);

  const filteredAttendance = useMemo(() => {
    return attendanceLogs.filter(a => {
      if (a.tenantId && a.tenantId !== tenantId) return false;
      if (a.companyId && a.companyId !== companyId) return false;

      const attDate = new Date(a.date);
      if (attDate < dateBounds.start || attDate > dateBounds.end) return false;

      if (selectedDept !== "All") {
        const staffMember = allUsers.find(u => u.id === a.userId);
        if (!staffMember || staffMember.department !== selectedDept) return false;
      }
      return true;
    });
  }, [attendanceLogs, dateBounds, selectedDept, allUsers, tenantId, companyId]);

  const filteredPayroll = useMemo(() => {
    // Payroll report generally maps to months
    return payrollReport.filter(p => {
      if (p.tenantId && p.tenantId !== tenantId) return false;
      if (p.companyId && p.companyId !== companyId) return false;

      if (selectedDept !== "All") {
        const staffMember = allUsers.find(u => u.id === p.userId);
        if (!staffMember || staffMember.department !== selectedDept) return false;
      }
      return true;
    });
  }, [payrollReport, selectedDept, allUsers, tenantId, companyId]);

  // Executive KPI Calculations
  const metrics = useMemo(() => {
    // Total Revenue (Deal Value of Converted Leads)
    const wonLeads = filteredLeads.filter(l => l.status === "Closed Won");
    const totalRevenue = wonLeads.reduce((acc, l) => acc + (Number(l.dealValue) || 0), 0);

    // Monthly Revenue (Won in current calendar month)
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const wonThisMonth = wonLeads.filter(l => new Date(l.createdAt) >= startOfCurrentMonth);
    const monthlyRevenue = wonThisMonth.reduce((acc, l) => acc + (Number(l.dealValue) || 0), 0);

    // Sales Pipeline Value (Non-closed interested lead pipelines)
    const pipelineLeads = filteredLeads.filter(l => 
      ["New", "Interested", "Spoke", "Contacted", "Nurturing"].includes(l.status)
    );
    const pipelineValue = pipelineLeads.reduce((acc, l) => acc + (Number(l.dealValue) || 0), 0);

    // Lead Conversion Rate %
    const totalLeadsCount = filteredLeads.length;
    const conversionRate = totalLeadsCount > 0 
      ? Math.round((wonLeads.length / totalLeadsCount) * 100) 
      : 0;

    // Active Customers (Total Won leads)
    const activeCustomers = wonLeads.length;

    // New Customers (Won in this date selection window)
    const newCustomers = wonLeads.length; 

    // Employee Attendance Rate
    const totalExpectedDays = filteredAttendance.length;
    const presentDays = filteredAttendance.filter(a => a.status === "Present" || a.status === "Half Day").length;
    const attendanceRate = totalExpectedDays > 0 
      ? Math.round((presentDays / totalExpectedDays) * 100) 
      : 92; // default simulated healthy rate if no records are logged yet

    // Payroll Burn Rate
    // If we have actual released salary records, sum them up. Otherwise sum the base salaries of staff in selected department
    const releasedSalaryTotal = filteredPayroll.reduce((acc, p) => acc + (Number(p.netPay) || Number(p.finalSalary) || 0), 0);
    const staffSalaryBaseSum = filteredStaff.reduce((acc, u) => acc + (Number(u.salaryBase) || 15000), 0);
    const payrollBurnRate = releasedSalaryTotal > 0 ? releasedSalaryTotal : staffSalaryBaseSum;

    // Average Deal Size
    const avgDealSize = activeCustomers > 0 
      ? Math.round(totalRevenue / activeCustomers) 
      : 0;

    // Customer Acquisition Cost (CAC)
    // Formula: (Payroll Burn Rate + simulated marketing overhead) / New Customers
    const simulatedMarketingOverhead = 12000;
    const cac = newCustomers > 0 
      ? Math.round((payrollBurnRate + simulatedMarketingOverhead) / newCustomers) 
      : 4200; // Simulated CAC fallback

    return {
      totalRevenue,
      monthlyRevenue,
      pipelineValue,
      conversionRate,
      activeCustomers,
      newCustomers,
      attendanceRate,
      payrollBurnRate,
      avgDealSize,
      cac
    };
  }, [filteredLeads, filteredAttendance, filteredPayroll, filteredStaff]);

  // Executive Charts Data Prep
  const trendChartData = useMemo(() => {
    // Generate daily/weekly trend increments
    const dataPoints: any[] = [];
    const dateIntervals = 6;
    const timeDelta = dateBounds.end.getTime() - dateBounds.start.getTime();
    const step = timeDelta / dateIntervals;

    for (let i = 0; i <= dateIntervals; i++) {
      const pointDate = new Date(dateBounds.start.getTime() + step * i);
      const label = pointDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      
      // Filter won leads up to this timestamp
      const leadsUpToNow = filteredLeads.filter(l => l.status === "Closed Won" && new Date(l.createdAt) <= pointDate);
      const revenueAcc = leadsUpToNow.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0);
      
      const callsUpToNow = filteredCalls.filter(c => new Date(c.timestamp) <= pointDate);
      const callsCount = callsUpToNow.length;

      dataPoints.push({
        name: label,
        "Total Revenue": revenueAcc,
        "Sales Leads": filteredLeads.filter(l => new Date(l.createdAt) <= pointDate).length,
        "Completed Calls": callsCount
      });
    }
    return dataPoints;
  }, [filteredLeads, filteredCalls, dateBounds]);

  const pipelineDistributionData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredLeads.forEach(l => {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  }, [filteredLeads]);

  const departmentPerformanceData = useMemo(() => {
    const departments = ["Tech", "NonTech", "Sales"];
    return departments.map(dept => {
      const deptStaff = allUsers.filter(u => u.department === dept);
      const completedTasks = tasks.filter(t => t.department === dept && (t.status === "Approved" || t.status === "Completed")).length;
      const totalDeptTasks = tasks.filter(t => t.department === dept).length;
      const taskComplianceRate = totalDeptTasks > 0 ? Math.round((completedTasks / totalDeptTasks) * 100) : 85;

      const payrollSpend = payrollReport
        .filter(p => {
          const userObj = allUsers.find(u => u.id === p.userId);
          return userObj && userObj.department === dept;
        })
        .reduce((sum, p) => sum + (Number(p.netPay) || Number(p.finalSalary) || 0), 0);

      const deptSalaryFallback = deptStaff.reduce((sum, s) => sum + (Number(s.salaryBase) || 15000), 0);

      return {
        name: dept,
        "Staff Size": deptStaff.length,
        "Task Compliance %": taskComplianceRate,
        "Budget Spend (₹)": payrollSpend > 0 ? payrollSpend : deptSalaryFallback
      };
    });
  }, [allUsers, tasks, payrollReport]);

  // Export functions
  const handleExportCSV = (title: string, headers: string[], rows: any[][]) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      const cleanRow = row.map(cell => {
        const str = String(cell).replace(/"/g, '""');
        return str.includes(",") || str.includes("\n") ? `"${str}"` : str;
      });
      csvContent += cleanRow.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, "_")}_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyClipboard = (headers: string[], rows: any[][]) => {
    let text = headers.join("\t") + "\n";
    rows.forEach(row => {
      text += row.join("\t") + "\n";
    });
    navigator.clipboard.writeText(text);
    alert("Report data successfully copied to your clipboard as TSV!");
  };

  const handlePrint = () => {
    window.print();
  };

  // Scheduled Reports actions
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScheduleName || !newScheduleEmail) {
      alert("Please fill in schedule name and recipient email address.");
      return;
    }
    const newSch: ReportSchedule = {
      id: `sch-${Date.now()}`,
      name: newScheduleName,
      reportType: newScheduleType,
      frequency: newScheduleFreq,
      email: newScheduleEmail,
      hour: newScheduleHour,
      active: true
    };
    setSchedules(prev => [newSch, ...prev]);
    setNewScheduleName("");
    setNewScheduleEmail("");
    
    // Add simulated trigger log
    setScheduleLogs(prev => [
      {
        id: `log-${Date.now()}`,
        scheduleName: newSch.name,
        sentTo: newSch.email,
        time: `Configured active recurring starting ${newSch.frequency}`,
        status: "Armed"
      },
      ...prev
    ]);
  };

  const handleDeleteSchedule = (id: string) => {
    setSchedules(prev => prev.filter(s => s.id !== id));
  };

  const handleToggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  // Custom Report Builder generation
  const generatedCustomReport = useMemo(() => {
    let records: any[] = [];
    if (builderModule === "leads") records = filteredLeads;
    else if (builderModule === "calls") records = filteredCalls;
    else if (builderModule === "staff") records = filteredStaff;
    else if (builderModule === "attendance") records = filteredAttendance;
    else if (builderModule === "payroll") records = filteredPayroll;

    // Grouping dimension logic
    const groups: Record<string, any[]> = {};
    records.forEach(r => {
      let key = "Unknown";
      if (builderDimension === "status") key = r.status || "No Status";
      else if (builderDimension === "department") key = r.department || r.dept || "No Department";
      else if (builderDimension === "source") key = r.source || "Direct/Organic";
      else if (builderDimension === "role") key = r.role || "No Role";
      else if (builderDimension === "position") key = r.position || "Employee";
      else if (builderDimension === "date") {
        const d = r.createdAt || r.timestamp || r.date;
        key = d ? d.slice(0, 10) : "No Date";
      }
      groups[key] = groups[key] || [];
      groups[key].push(r);
    });

    const reportRows = Object.entries(groups).map(([dimensionValue, items]) => {
      let resultVal = 0;
      if (builderMetric === "count") {
        resultVal = items.length;
      } else if (builderMetric === "sum") {
        resultVal = items.reduce((sum, item) => sum + (Number(item[builderMetricField]) || 0), 0);
      } else if (builderMetric === "avg") {
        const sum = items.reduce((sum, item) => sum + (Number(item[builderMetricField]) || 0), 0);
        resultVal = items.length > 0 ? Math.round(sum / items.length) : 0;
      }

      return {
        dimension: dimensionValue,
        metricValue: resultVal,
        recordCount: items.length,
        rawRecords: items
      };
    });

    return reportRows;
  }, [builderModule, builderDimension, builderMetric, builderMetricField, filteredLeads, filteredCalls, filteredStaff, filteredAttendance, filteredPayroll]);

  const handleSaveCustomReport = () => {
    const name = builderReportName || `Custom ${builderModule} report grouped by ${builderDimension}`;
    const newReport: SavedReport = {
      id: `sr-${Date.now()}`,
      name,
      module: builderModule,
      dimension: builderDimension,
      metric: builderMetric,
      metricField: builderMetricField,
      createdAt: new Date().toISOString(),
      notes: builderNotes || "Saved user-defined custom report."
    };
    setSavedReports(prev => [newReport, ...prev]);
    setBuilderReportName("");
    setBuilderNotes("");
    alert("Custom BI report template saved successfully!");
  };

  const handleApplySavedReport = (sr: SavedReport) => {
    setBuilderModule(sr.module);
    setBuilderDimension(sr.dimension);
    setBuilderMetric(sr.metric as any);
    setBuilderMetricField(sr.metricField);
    setActiveCustomReport(sr);
    setActiveTab("builder");
  };

  const handleDeleteSavedReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedReports(prev => prev.filter(r => r.id !== id));
    if (activeCustomReport?.id === id) setActiveCustomReport(null);
  };

  // Personalization settings toggler
  const togglePersonalizer = () => setShowPersonalizer(!showPersonalizer);

  const toggleWidgetVisibility = (widgetKey: string) => {
    setHiddenWidgets(prev => 
      prev.includes(widgetKey) 
        ? prev.filter(w => w !== widgetKey) 
        : [...prev, widgetKey]
    );
  };

  const isWidgetVisible = (widgetKey: string) => !hiddenWidgets.includes(widgetKey);

  // Drill-down launcher helpers
  const launchDrillDown = (metricKey: string, title: string, description: string) => {
    let headers: string[] = [];
    let rows: any[][] = [];

    if (metricKey === "totalRevenue" || metricKey === "pipelineValue" || metricKey === "newCustomers") {
      headers = ["ID", "Name", "Status", "Requirements", "Deal Value", "Created At"];
      const targetLeads = filteredLeads.filter(l => {
        if (metricKey === "totalRevenue") return l.status === "Closed Won";
        if (metricKey === "pipelineValue") return ["New", "Interested", "Spoke", "Contacted", "Nurturing"].includes(l.status);
        if (metricKey === "newCustomers") return l.status === "Closed Won";
        return true;
      });
      rows = targetLeads.map(l => [
        l.id,
        l.name,
        l.status,
        l.requirements || "None",
        `₹${(Number(l.dealValue) || 0).toLocaleString()}`,
        new Date(l.createdAt).toLocaleDateString()
      ]);
    } else if (metricKey === "attendanceRate") {
      headers = ["Staff Name", "Date", "Punch In", "Punch Out", "Status"];
      rows = filteredAttendance.map(a => {
        const staff = allUsers.find(u => u.id === a.userId) || { name: a.userName || "Unknown" };
        return [
          staff.name,
          a.date,
          a.punchIn || "--:--",
          a.punchOut || "--:--",
          a.status
        ];
      });
    } else if (metricKey === "payrollBurnRate") {
      headers = ["Employee ID", "Name", "Role", "Department", "Base Salary", "Released Net Pay"];
      rows = filteredStaff.map(s => {
        const payrollRecord = filteredPayroll.find(p => p.userId === s.id);
        const netPaid = payrollRecord ? `₹${(payrollRecord.netPay || payrollRecord.finalSalary || 0).toLocaleString()}` : "Pending Audit";
        return [
          s.id,
          s.name,
          s.role,
          s.department || "General",
          `₹${(s.salaryBase || 0).toLocaleString()}`,
          netPaid
        ];
      });
    } else if (metricKey === "calls") {
      headers = ["Lead Name", "Telecaller", "Outcome Status", "Duration (Sec)", "Date/Time"];
      rows = filteredCalls.map(c => [
        c.leadName,
        c.telecallerName,
        c.status,
        c.duration,
        new Date(c.timestamp).toLocaleString()
      ]);
    } else {
      // Fallback
      headers = ["Info Title", "System Count"];
      rows = [
        ["Total Leads Screened", filteredLeads.length],
        ["Connected Calls Handled", filteredCalls.length],
        ["Active Staff Monitored", filteredStaff.length]
      ];
    }

    setDrillDownData({
      title,
      description,
      headers,
      rows
    });
  };

  // Color arrays for Recharts pie cells
  const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#f59e0b", "#6366f1", "#14b8a6"];

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white border border-slate-100 p-5 rounded-3xl shadow-sm">
        <div className="text-left space-y-1">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5.5 h-5.5 text-orange-500" />
            Enterprise Reports & Business Intelligence
          </h2>
          <p className="text-xs font-semibold text-slate-400">
            Real-time multi-dimensional operational insights, scheduled alerts & custom builder dashboard.
          </p>
        </div>

        {/* CONTROLS: FILTERS & VIEWS */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset range selection */}
          <div className="flex bg-slate-50 border border-slate-200 p-1 rounded-xl gap-1">
            {(["today", "week", "month", "quarter", "year", "custom"] as const).map(p => (
              <button
                key={p}
                onClick={() => setDateRange(p)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer ${
                  dateRange === p 
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/15" 
                    : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Department Filter dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase">Dept:</span>
            <select
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-orange-500 text-slate-700"
            >
              <option value="All">All Departments</option>
              <option value="Sales">Sales & Telecallers</option>
              <option value="Tech">Technical Department</option>
              <option value="NonTech">Non-Technical Operations</option>
            </select>
          </div>

          {/* Personalizer Toggle button */}
          <button
            onClick={togglePersonalizer}
            className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 text-xs font-bold ${
              showPersonalizer 
                ? "bg-orange-50 border-orange-200 text-orange-600" 
                : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
            }`}
            title="Personalize Widgets"
          >
            <Layout className="w-4 h-4" />
            <span className="hidden sm:inline">Personalize</span>
          </button>
        </div>
      </div>

      {/* CUSTOM DATE PICKERS (Conditional) */}
      {dateRange === "custom" && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm flex flex-wrap gap-4 items-center text-left"
        >
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 block">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 block">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="pt-5 text-slate-400 text-xs italic">
            Showing records between {startDate || "earliest"} and {endDate || "today"}
          </div>
        </motion.div>
      )}

      {/* PERSONALIZATION CONTROLS PANEL */}
      <AnimatePresence>
        {showPersonalizer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-50 border border-slate-200 p-5 rounded-3xl"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-orange-500" />
                Customize Workspace Widgets & Layout
              </h3>
              <button onClick={() => setShowPersonalizer(false)} className="text-slate-400 hover:text-slate-700 text-xs font-bold">Close ×</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {/* Preset selection */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dashboard Preset Layout</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input 
                      type="radio" 
                      name="preset" 
                      checked={layoutPreset === "bento"} 
                      onChange={() => setLayoutPreset("bento")} 
                      className="accent-orange-500"
                    />
                    <span>Bento Grid (Dynamic / Multi-chart)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input 
                      type="radio" 
                      name="preset" 
                      checked={layoutPreset === "focus"} 
                      onChange={() => setLayoutPreset("focus")}
                      className="accent-orange-500"
                    />
                    <span>Analytical Focus (Large trend visualizers)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input 
                      type="radio" 
                      name="preset" 
                      checked={layoutPreset === "compact"} 
                      onChange={() => setLayoutPreset("compact")}
                      className="accent-orange-500"
                    />
                    <span>Compact Summary (High density / Less spacing)</span>
                  </label>
                </div>
              </div>

              {/* Toggle KPI Cards */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Configure Metric Cards</span>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isWidgetVisible("totalRevenue")} onChange={() => toggleWidgetVisibility("totalRevenue")} className="rounded accent-orange-500" />
                    <span>Total Revenue</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isWidgetVisible("pipelineValue")} onChange={() => toggleWidgetVisibility("pipelineValue")} className="rounded accent-orange-500" />
                    <span>Pipeline Value</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isWidgetVisible("conversionRate")} onChange={() => toggleWidgetVisibility("conversionRate")} className="rounded accent-orange-500" />
                    <span>Lead Conversion</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isWidgetVisible("attendanceRate")} onChange={() => toggleWidgetVisibility("attendanceRate")} className="rounded accent-orange-500" />
                    <span>Staff Attendance</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isWidgetVisible("payrollBurn")} onChange={() => toggleWidgetVisibility("payrollBurn")} className="rounded accent-orange-500" />
                    <span>Payroll Burn</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={isWidgetVisible("avgDeal")} onChange={() => toggleWidgetVisibility("avgDeal")} className="rounded accent-orange-500" />
                    <span>Avg Deal Size</span>
                  </label>
                </div>
              </div>

              {/* Saved custom reports shortcuts */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">BI Saved Report Shortcut Templates</span>
                {savedReports.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No templates created. Use Custom Report Builder to save.</p>
                ) : (
                  <div className="space-y-1.5 max-h-24 overflow-y-auto">
                    {savedReports.map(sr => (
                      <div key={sr.id} className="flex justify-between items-center text-xs p-1 hover:bg-slate-50 rounded-lg">
                        <button onClick={() => handleApplySavedReport(sr)} className="font-extrabold text-orange-600 hover:underline text-left truncate flex-1">{sr.name}</button>
                        <button onClick={(e) => handleDeleteSavedReport(sr.id, e)} className="text-red-500 hover:text-red-700 px-1 font-bold">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRIMARY WORKSPACE MODULE SELECTION TAB STRIP */}
      <div className="flex flex-wrap border-b border-slate-100 gap-6 text-left">
        <button
          onClick={() => setActiveTab("executive")}
          className={`pb-3 text-xs font-black uppercase transition-all relative cursor-pointer ${
            activeTab === "executive" ? "text-orange-500 font-extrabold" : "text-slate-400 hover:text-slate-800"
          }`}
        >
          📈 Executive BI Dashboard
          {activeTab === "executive" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></span>}
        </button>
        <button
          onClick={() => setActiveTab("crm")}
          className={`pb-3 text-xs font-black uppercase transition-all relative cursor-pointer ${
            activeTab === "crm" ? "text-orange-500 font-extrabold" : "text-slate-400 hover:text-slate-800"
          }`}
        >
          👤 CRM Leads Analytics
          {activeTab === "crm" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></span>}
        </button>
        <button
          onClick={() => setActiveTab("hr")}
          className={`pb-3 text-xs font-black uppercase transition-all relative cursor-pointer ${
            activeTab === "hr" ? "text-orange-500 font-extrabold" : "text-slate-400 hover:text-slate-800"
          }`}
        >
          👥 HR Attendance Analytics
          {activeTab === "hr" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></span>}
        </button>
        <button
          onClick={() => setActiveTab("payroll")}
          className={`pb-3 text-xs font-black uppercase transition-all relative cursor-pointer ${
            activeTab === "payroll" ? "text-orange-500 font-extrabold" : "text-slate-400 hover:text-slate-800"
          }`}
        >
          ₹ Payroll Burn Reports
          {activeTab === "payroll" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></span>}
        </button>
        <button
          onClick={() => setActiveTab("sales")}
          className={`pb-3 text-xs font-black uppercase transition-all relative cursor-pointer ${
            activeTab === "sales" ? "text-orange-500 font-extrabold" : "text-slate-400 hover:text-slate-800"
          }`}
        >
          📞 Sales & Call Logs BI
          {activeTab === "sales" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></span>}
        </button>
        <button
          onClick={() => setActiveTab("builder")}
          className={`pb-3 text-xs font-black uppercase transition-all relative cursor-pointer ${
            activeTab === "builder" ? "text-orange-500 font-extrabold" : "text-slate-400 hover:text-slate-800"
          }`}
        >
          🛠️ Custom BI Report Builder
          {activeTab === "builder" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></span>}
        </button>
        <button
          onClick={() => setActiveTab("schedules")}
          className={`pb-3 text-xs font-black uppercase transition-all relative cursor-pointer ${
            activeTab === "schedules" ? "text-orange-500 font-extrabold" : "text-slate-400 hover:text-slate-800"
          }`}
        >
          📬 Scheduled Reports Manager
          {activeTab === "schedules" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"></span>}
        </button>
      </div>

      {/* TAB CONTENT PORT */}
      <div className="relative">

        {/* 1. EXECUTIVE BUSINESS DASHBOARD */}
        {activeTab === "executive" && (
          <div className="space-y-6">
            
            {/* KPI WIDGETS GRID */}
            <div className={`grid grid-cols-2 md:grid-cols-5 gap-4 ${layoutPreset === "compact" ? "gap-2" : ""}`}>
              {isWidgetVisible("totalRevenue") && (
                <button 
                  onClick={() => launchDrillDown("totalRevenue", "Closed Won Customer Revenue Breakdown", "Detailed ledger of converted leads contribution")}
                  className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm text-left hover:border-orange-500/40 hover:shadow-lg transition group cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Revenue</span>
                    <span className="p-1 rounded-lg bg-orange-50 text-orange-500 text-[10px] font-bold group-hover:scale-110 transition flex items-center gap-0.5">₹ <ArrowUpRight className="w-2.5 h-2.5" /></span>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">₹{metrics.totalRevenue.toLocaleString()}</h3>
                    <div className="text-[10px] font-extrabold text-slate-400 mt-1 uppercase flex items-center gap-1">
                      <span className="text-emerald-500">✨ Converted CRM deal</span>
                    </div>
                  </div>
                </button>
              )}

              {isWidgetVisible("pipelineValue") && (
                <button 
                  onClick={() => launchDrillDown("pipelineValue", "Sales Pipeline Lead Distribution", "Ongoing sales cycle potentials awaiting contract close")}
                  className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm text-left hover:border-orange-500/40 hover:shadow-lg transition group cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pipeline Value</span>
                    <span className="p-1 rounded-lg bg-blue-50 text-blue-500 text-[10px] font-bold group-hover:scale-110 transition"><Briefcase className="w-2.5 h-2.5" /></span>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">₹{metrics.pipelineValue.toLocaleString()}</h3>
                    <div className="text-[10px] font-extrabold text-slate-400 mt-1 uppercase flex items-center gap-1">
                      <span className="text-blue-500">🔄 In-flight pipeline</span>
                    </div>
                  </div>
                </button>
              )}

              {isWidgetVisible("conversionRate") && (
                <button 
                  onClick={() => launchDrillDown("totalRevenue", "Lead Funnel Efficiency Details", "Historical success rates of imported CRM lead pools")}
                  className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm text-left hover:border-orange-500/40 hover:shadow-lg transition group cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lead Conversion %</span>
                    <span className="p-1 rounded-lg bg-emerald-50 text-emerald-500 text-[10px] font-bold group-hover:scale-110 transition"><TrendingUp className="w-2.5 h-2.5" /></span>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{metrics.conversionRate}%</h3>
                    <div className="text-[10px] font-extrabold text-emerald-500 mt-1 uppercase">
                      Conversion efficiency
                    </div>
                  </div>
                </button>
              )}

              {isWidgetVisible("attendanceRate") && (
                <button 
                  onClick={() => launchDrillDown("attendanceRate", "Employee Shift Punching & Attendance Log", "Monthly clockings and punch-card audits")}
                  className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm text-left hover:border-orange-500/40 hover:shadow-lg transition group cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Shift Attendance Rate</span>
                    <span className="p-1 rounded-lg bg-purple-50 text-purple-500 text-[10px] font-bold group-hover:scale-110 transition"><Clock className="w-2.5 h-2.5" /></span>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{metrics.attendanceRate}%</h3>
                    <div className="text-[10px] font-extrabold text-slate-400 mt-1 uppercase">
                      Shift compliance rate
                    </div>
                  </div>
                </button>
              )}

              {isWidgetVisible("payrollBurn") && (
                <button 
                  onClick={() => launchDrillDown("payrollBurnRate", "Salary Liability Ledger", "Active staff wages and contract expenses calculated")}
                  className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm text-left hover:border-orange-500/40 hover:shadow-lg transition group cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Payroll Burn Rate</span>
                    <span className="p-1 rounded-lg bg-amber-50 text-amber-500 text-[10px] font-bold group-hover:scale-110 transition"><DollarSign className="w-2.5 h-2.5" /></span>
                  </div>
                  <div className="mt-3">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">₹{metrics.payrollBurnRate.toLocaleString()}</h3>
                    <div className="text-[10px] font-extrabold text-amber-600 mt-1 uppercase">
                      Monthly operational cost
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* ADVISORY SECONDARY KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Average Deal Size</span>
                <span className="text-base font-black text-slate-800 block mt-1">₹{metrics.avgDealSize.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-bold">Total revenue / active accounts</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Customer Acquisition Cost (CAC)</span>
                <span className="text-base font-black text-slate-800 block mt-1">₹{metrics.cac.toLocaleString()}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-bold">Sales payroll & ads amortized</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Active Converted Accounts</span>
                <span className="text-base font-black text-slate-800 block mt-1">{metrics.activeCustomers} Clients</span>
                <span className="text-[9px] text-emerald-600 block mt-0.5 font-bold">Closed Won lead accounts</span>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Outstanding Lead Pool</span>
                <span className="text-base font-black text-slate-800 block mt-1">{filteredLeads.length} Prospects</span>
                <span className="text-[9px] text-slate-400 block mt-0.5 font-bold">Leads in current window</span>
              </div>
            </div>

            {/* DYNAMIC CHARTS AND TRENDS SECTIONS */}
            <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 ${layoutPreset === "focus" ? "xl:grid-cols-1" : ""}`}>
              
              {/* TREND CHART: REVENUE & LEADS (Line Chart) */}
              <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm text-left space-y-4 xl:col-span-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cumulative Income & Operational Velocity</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Real-time ledger projection inside dates context</p>
                  </div>
                  <button 
                    onClick={() => handleExportCSV("Revenue_Time_Trend", ["Date Label", "Total Revenue (₹)", "Cumulative Leads", "Connected Calls"], trendChartData.map(d => [d.name, d["Total Revenue"], d["Sales Leads"], d["Completed Calls"]]))}
                    className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-orange-500 rounded-lg transition"
                    title="Export Chart Data"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendChartData}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                      <YAxis stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                      <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Area type="monotone" dataKey="Total Revenue" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" />
                      <Line type="monotone" dataKey="Sales Leads" stroke="#3b82f6" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PIE CHART: PIPELINE DISTRIBUTION */}
              <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm text-left space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Deal Stage Pool Distribution</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">Funnels status breakdown of leads</p>
                  </div>
                  <button 
                    onClick={() => handleExportCSV("Pipeline_Funnel_Distribution", ["Stage Status", "Leads Count"], pipelineDistributionData.map(d => [d.name, d.value]))}
                    className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-orange-500 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>

                {pipelineDistributionData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs italic">
                    No active leads registered in this period.
                  </div>
                ) : (
                  <div className="h-60 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pipelineDistributionData}
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pipelineDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Centered Total Indicator */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-black text-slate-800">{filteredLeads.length}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">Proposals</span>
                    </div>
                  </div>
                )}

                {/* Pie legend */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-extrabold text-slate-500 mt-2">
                  {pipelineDistributionData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full block shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="truncate">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* SEGMENT PERFORMANCE SUMMARY BARS (Recharts Bar Chart) */}
            <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm text-left space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cross-Department Operational Spend & Task Compliance</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">Budget burn against task compliance and workforce size</p>
                </div>
                <button 
                  onClick={() => handleExportCSV("Department_Compliance_Budget", ["Dept", "Staff Size", "Task Compliance %", "Budget Spend (₹)"], departmentPerformanceData.map(d => [d.name, d["Staff Size"], d["Task Compliance %"], d["Budget Spend (₹)"]]))}
                  className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-orange-500 rounded-lg transition"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={departmentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                    <YAxis stroke="#94a3b8" fontSize={10} fontStyle="bold" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Budget Spend (₹)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Task Compliance %" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Staff Size" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}


        {/* 2. CRM LEADS ANALYTICS MODULE */}
        {activeTab === "crm" && (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 text-left space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">CRM Customer Pipeline Ledger</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Dynamic client records matching current date filters</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-initial">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search leads names/source..."
                    value={crmSearch}
                    onChange={e => setCrmSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500 w-full"
                  />
                </div>
                
                <button 
                  onClick={() => handleExportCSV("CRM_Leads_Report", ["Name", "Phone", "Email", "Requirements", "Status", "Source", "Assigned Operator"], filteredLeads.map(l => [l.name, l.phone, l.email, l.requirements, l.status, l.source || "None", l.assignedName || "Unassigned"]))}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button 
                  onClick={() => handleCopyClipboard(["Name", "Phone", "Status", "Value"], filteredLeads.map(l => [l.name, l.phone, l.status, l.dealValue || 0]))}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition flex items-center gap-1.5"
                  title="Copy Table to Clipboard"
                >
                  <Clipboard className="w-4 h-4" /> Copy TSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                    <th className="px-4 py-3.5">Lead Name</th>
                    <th className="px-4 py-3.5">Phone Number</th>
                    <th className="px-4 py-3.5">Current Status</th>
                    <th className="px-4 py-3.5">Deal Size (₹)</th>
                    <th className="px-4 py-3.5">Source Channel</th>
                    <th className="px-4 py-3.5">Assigned Operator</th>
                    <th className="px-4 py-3.5 text-right">Registered On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                  {filteredLeads
                    .filter(l => l.name.toLowerCase().includes(crmSearch.toLowerCase()) || (l.source && l.source.toLowerCase().includes(crmSearch.toLowerCase())))
                    .map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/40 transition">
                        <td className="px-4 py-3.5 text-slate-900 font-extrabold">{l.name}</td>
                        <td className="px-4 py-3.5 font-mono">{l.phone}</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            l.status === "Closed Won" ? "bg-emerald-500/10 text-emerald-600" :
                            l.status === "Closed Lost" ? "bg-red-500/10 text-red-600" :
                            l.status === "Interested" ? "bg-orange-500/10 text-orange-600" : "bg-slate-100 text-slate-600"
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-900">₹{(Number(l.dealValue) || 0).toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-slate-500">{l.source || "Organic Direct"}</td>
                        <td className="px-4 py-3.5 text-slate-600">{l.assignedName || "Unassigned"}</td>
                        <td className="px-4 py-3.5 text-right text-slate-400">{new Date(l.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 italic">No matching lead records logged within date bounds.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* 3. HR ATTENDANCE ANALYTICS */}
        {activeTab === "hr" && (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 text-left space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">Staff Attendance & Shift Punching Log</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Punch registers and compliance history matching current filters</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-initial">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search staff shift logs..."
                    value={hrSearch}
                    onChange={e => setHrSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500 w-full"
                  />
                </div>
                
                <button 
                  onClick={() => handleExportCSV("HR_Attendance_Report", ["Name", "Date", "Punch In", "Punch Out", "Status", "GPS Coordinates"], filteredAttendance.map(a => [a.userName || "Unknown", a.date, a.punchIn || "", a.punchOut || "", a.status, a.coordinates || ""]))}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                    <th className="px-4 py-3.5">Employee Name</th>
                    <th className="px-4 py-3.5">Shift Date</th>
                    <th className="px-4 py-3.5">Clock In</th>
                    <th className="px-4 py-3.5">Clock Out</th>
                    <th className="px-4 py-3.5">Duty Status</th>
                    <th className="px-4 py-3.5 text-right">GPS Auth Loc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                  {filteredAttendance
                    .filter(a => {
                      const staff = allUsers.find(u => u.id === a.userId);
                      const name = staff ? staff.name : (a.userName || "");
                      return name.toLowerCase().includes(hrSearch.toLowerCase());
                    })
                    .map(a => {
                      const staff = allUsers.find(u => u.id === a.userId) || { name: a.userName || "Unknown Employee" };
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/40 transition">
                          <td className="px-4 py-3.5 text-slate-900 font-extrabold">{staff.name}</td>
                          <td className="px-4 py-3.5">{a.date}</td>
                          <td className="px-4 py-3.5 font-mono">{a.punchIn || "Absent"}</td>
                          <td className="px-4 py-3.5 font-mono">{a.punchOut || "--:--"}</td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              a.status === "Present" ? "bg-emerald-500/10 text-emerald-600" :
                              a.status === "Half Day" ? "bg-amber-500/10 text-amber-600" : "bg-red-500/10 text-red-600"
                            }`}>
                              {a.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right text-slate-400 font-mono truncate max-w-[150px]">{a.coordinates || "Office Registered Wifi"}</td>
                        </tr>
                      );
                    })}
                  {filteredAttendance.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 italic">No attendance/shift entries registered within these filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* 4. PAYROLL BURN REPORTS */}
        {activeTab === "payroll" && (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 text-left space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">Corporate Payroll & Compensation liability</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Calculated wages, PF/ESI deductions, custom bonuses and Professional Tax logs</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-initial">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search payroll records..."
                    value={payrollSearch}
                    onChange={e => setPayrollSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500 w-full"
                  />
                </div>
                
                <button 
                  onClick={() => handleExportCSV("Payroll_Wages_Report", ["Name", "Role", "Department", "Base Salary", "Bonus/Comm", "Deductions", "Net Pay Payable"], filteredStaff.map(s => {
                    const pay = filteredPayroll.find(p => p.userId === s.id) || {};
                    return [s.name, s.role, s.department || "", s.salaryBase, pay.bonus || 0, pay.deductions || 0, pay.netPay || s.salaryBase];
                  }))}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                    <th className="px-4 py-3.5">Employee</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Department</th>
                    <th className="px-4 py-3.5">Contract Base (₹)</th>
                    <th className="px-4 py-3.5">TDS / Deductions (₹)</th>
                    <th className="px-4 py-3.5">Durable PF/ESI (₹)</th>
                    <th className="px-4 py-3.5 text-right">Net Released (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                  {filteredStaff
                    .filter(s => s.name.toLowerCase().includes(payrollSearch.toLowerCase()) || s.role.toLowerCase().includes(payrollSearch.toLowerCase()))
                    .map(s => {
                      const payrollRecord = filteredPayroll.find(p => p.userId === s.id);
                      const baseSalary = s.salaryBase || 15000;
                      const pfContribution = Math.round(baseSalary * 0.12);
                      const tdsSimulated = Math.round(baseSalary * 0.05);
                      const netWagesReleased = payrollRecord ? (payrollRecord.netPay || payrollRecord.finalSalary) : (baseSalary + 2000 - pfContribution - tdsSimulated);

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/40 transition">
                          <td className="px-4 py-3.5 text-slate-900 font-extrabold">{s.name}</td>
                          <td className="px-4 py-3.5 text-slate-500 capitalize">{s.role}</td>
                          <td className="px-4 py-3.5">{s.department || "General"}</td>
                          <td className="px-4 py-3.5">₹{baseSalary.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-red-500">-₹{tdsSimulated.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-red-500">-₹{pfContribution.toLocaleString()}</td>
                          <td className="px-4 py-3.5 text-right text-slate-950 font-black">
                            ₹{netWagesReleased.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* 5. SALES & CALL LOGS BI */}
        {activeTab === "sales" && (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 text-left space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">Telecaller Conversion Velocity Logs</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Physical call records, durations, pitches and conversion outcomes</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-initial">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search callers performance..."
                    value={salesSearch}
                    onChange={e => setSalesSearch(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500 w-full"
                  />
                </div>
                
                <button 
                  onClick={() => handleExportCSV("Calls_BI_Report", ["Lead Name", "Phone", "Telecaller Operator", "Duration (Sec)", "Outcome Status", "Timestamp"], filteredCalls.map(c => [c.leadName, c.leadPhone, c.telecallerName, c.duration, c.status, c.timestamp]))}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/60 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                    <th className="px-4 py-3.5">Contact Prospect</th>
                    <th className="px-4 py-3.5">Phone Call Dialed</th>
                    <th className="px-4 py-3.5">Telecaller Assigned</th>
                    <th className="px-4 py-3.5 text-center">Connected Duration (s)</th>
                    <th className="px-4 py-3.5">Call Pitch Status</th>
                    <th className="px-4 py-3.5 text-right">Call Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                  {filteredCalls
                    .filter(c => c.leadName.toLowerCase().includes(salesSearch.toLowerCase()) || c.telecallerName.toLowerCase().includes(salesSearch.toLowerCase()))
                    .map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/40 transition">
                        <td className="px-4 py-3.5 text-slate-900 font-extrabold">{c.leadName}</td>
                        <td className="px-4 py-3.5 font-mono">{c.leadPhone}</td>
                        <td className="px-4 py-3.5 text-slate-500">{c.telecallerName}</td>
                        <td className="px-4 py-3.5 text-center font-mono text-slate-900">{c.duration}s</td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            c.status === "Interested" ? "bg-emerald-500/10 text-emerald-600" :
                            c.status === "Spoke" ? "bg-blue-500/10 text-blue-600" : "bg-red-500/10 text-red-600"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-400 font-mono">
                          {new Date(c.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  {filteredCalls.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 italic">No dialed call logs recorded inside filtered date ranges.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* 6. CUSTOM BI REPORT BUILDER */}
        {activeTab === "builder" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* BUILDER CONFIGURATOR FORM */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 text-left space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-orange-500" />
                  Configure Custom BI Pivot
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Group corporate modules dimensions and sum metrics</p>
              </div>

              {/* Step 1: Select Module */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">1. Core Analytics Module</label>
                <select
                  value={builderModule}
                  onChange={e => {
                    setBuilderModule(e.target.value);
                    // Defaults for dimensions based on module
                    if (e.target.value === "leads") setBuilderDimension("status");
                    else if (e.target.value === "calls") setBuilderDimension("status");
                    else if (e.target.value === "staff") setBuilderDimension("role");
                    else if (e.target.value === "attendance") setBuilderDimension("status");
                    else if (e.target.value === "payroll") setBuilderDimension("department");
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-orange-500 text-slate-700"
                >
                  <option value="leads">CRM Leads Database (लीड्स सूची)</option>
                  <option value="calls">Connected Call History (कॉल लॉग्स)</option>
                  <option value="staff">Workforce & Staff Directory (कर्मचारी सूची)</option>
                  <option value="attendance">Shift Attendance Logs (हाजिरी रजिस्टर)</option>
                  <option value="payroll">Payroll Release Ledger (सैलरी विवरण)</option>
                </select>
              </div>

              {/* Step 2: Select Dimension Grouping */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">2. Grouping Dimension (X-Axis)</label>
                <select
                  value={builderDimension}
                  onChange={e => setBuilderDimension(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-orange-500 text-slate-700"
                >
                  {builderModule === "leads" && (
                    <>
                      <option value="status">Funnel Status (लीड स्थिति)</option>
                      <option value="source">Marketing Source (लीड स्रोत)</option>
                      <option value="date">Creation Date (रजिस्टर तिथि)</option>
                    </>
                  )}
                  {builderModule === "calls" && (
                    <>
                      <option value="status">Call Outcome Status (कॉल परिणाम)</option>
                      <option value="date">Dial Date (कॉल तिथि)</option>
                    </>
                  )}
                  {builderModule === "staff" && (
                    <>
                      <option value="role">System Role Permission (यूजर पद)</option>
                      <option value="department">Business Department (विभाग)</option>
                      <option value="position">Contract Title (जॉब पोस्ट)</option>
                    </>
                  )}
                  {builderModule === "attendance" && (
                    <>
                      <option value="status">Shift Presence Status (हाजिरी स्थिति)</option>
                      <option value="date">Register Date (हाजिरी तिथि)</option>
                    </>
                  )}
                  {builderModule === "payroll" && (
                    <>
                      <option value="department">Department Cost Center (विभाग)</option>
                      <option value="status">Audit Status (सैलरी स्थिति)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Step 3: Select Metric Calculation */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">3. Formula</label>
                  <select
                    value={builderMetric}
                    onChange={e => setBuilderMetric(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-orange-500 text-slate-700"
                  >
                    <option value="count">Count Total (रिकॉर्ड गिनती)</option>
                    <option value="sum">Sum Aggregation (योगफल)</option>
                    <option value="avg">Mathematical Avg (औसत)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Target Field</label>
                  <select
                    value={builderMetricField}
                    onChange={e => setBuilderMetricField(e.target.value)}
                    disabled={builderMetric === "count"}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-orange-500 text-slate-700 disabled:opacity-40"
                  >
                    {builderModule === "leads" && <option value="dealValue">Deal Value (₹)</option>}
                    {builderModule === "calls" && <option value="duration">Call Duration (Sec)</option>}
                    {builderModule === "staff" && <option value="salaryBase">Salary Contract Base (₹)</option>}
                    {builderModule === "attendance" && <option value="duration">Punch Hours</option>}
                    {builderModule === "payroll" && <option value="netPay">Net Salary Released (₹)</option>}
                  </select>
                </div>
              </div>

              {/* Step 4: Save Options */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Template Title / Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Converted Deals by Inbound source"
                    value={builderReportName}
                    onChange={e => setBuilderReportName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Analytical Notes</label>
                  <textarea
                    placeholder="Provide description context for executive peers..."
                    rows={2}
                    value={builderNotes}
                    onChange={e => setBuilderNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveCustomReport}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-xs shadow-md shadow-orange-500/10 cursor-pointer transition"
                >
                  💾 Save Template Template
                </button>
              </div>
            </div>

            {/* BUILDER PREVIEW STAGE & CHARTS */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 text-left xl:col-span-2 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-black text-slate-900 uppercase">Interactive pivot output visualizer</h4>
                  <p className="text-[10px] font-extrabold text-orange-500 mt-0.5">
                    Currently calculated: {builderMetric.toUpperCase()}({builderMetric === "count" ? "records" : builderMetricField}) grouped by {builderDimension.toUpperCase()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleExportCSV(builderReportName || "Custom_BI_Report", ["Dimension", "Calculated Metric", "Raw Sample Records"], generatedCustomReport.map(r => [r.dimension, r.metricValue, r.recordCount]))}
                    className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-600 flex items-center gap-1 text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                  <button 
                    onClick={() => handleCopyClipboard(["Dimension", "Value"], generatedCustomReport.map(r => [r.dimension, r.metricValue]))}
                    className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-600 flex items-center gap-1 text-xs font-bold"
                  >
                    <Clipboard className="w-3.5 h-3.5" /> TSV
                  </button>
                </div>
              </div>

              {/* CHART PREVIEW */}
              <div className="h-56 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                {generatedCustomReport.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 italic text-xs">
                    No constituent dataset records found matching date bounds.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={generatedCustomReport}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="dimension" fontSize={10} fontStyle="bold" stroke="#64748b" />
                      <YAxis fontSize={10} fontStyle="bold" stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey="metricValue" fill="#f97316" radius={[4, 4, 0, 0]} label={{ position: "top", fill: "#1e293b", fontSize: 9, fontWeight: "bold" }}>
                        {generatedCustomReport.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* TABLE LIST PREVIEW */}
              <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] border-b border-slate-100">
                      <th className="px-4 py-3">Group Segment Value ({builderDimension.toUpperCase()})</th>
                      <th className="px-4 py-3 text-center">Record Sample Count</th>
                      <th className="px-4 py-3 text-right">Calculated Metric ({builderMetric.toUpperCase()})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                    {generatedCustomReport.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 text-slate-900 font-extrabold">{row.dimension}</td>
                        <td className="px-4 py-3 text-center text-slate-500 font-mono">{row.recordCount} records</td>
                        <td className="px-4 py-3 text-right text-orange-500 font-black font-mono">
                          {builderMetricField.toLowerCase().includes("value") || builderMetricField.toLowerCase().includes("salary") || builderMetricField.toLowerCase().includes("pay")
                            ? `₹${row.metricValue.toLocaleString()}`
                            : row.metricValue.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {generatedCustomReport.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-slate-400 italic">No aggregated metric data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}


        {/* 7. SCHEDULED REPORTS MANAGER */}
        {activeTab === "schedules" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* SCHEDULE CONFIGURATOR FORM */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 text-left space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-orange-500" />
                  Configure Automatic Report Dispatcher
                </h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Setup scheduled emails with direct analytical digests</p>
              </div>

              <form onSubmit={handleAddSchedule} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Schedule Dispatch Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Daily Executive Sales Digest"
                    value={newScheduleName}
                    onChange={e => setNewScheduleName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Report Format Preset</label>
                  <select
                    value={newScheduleType}
                    onChange={e => setNewScheduleType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-orange-500"
                  >
                    <option value="Executive Dashboard">Complete Executive BI Summary (PDF + CSV)</option>
                    <option value="CRM Leads Funnel">Sales CRM Funnel ledger (CSV only)</option>
                    <option value="HR & Payroll Audit">HR Workforce wages and Punch registers (Excel)</option>
                    <option value="Custom Builder Pivot">Active saved pivot templates</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Frequency</label>
                    <select
                      value={newScheduleFreq}
                      onChange={e => setNewScheduleFreq(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-orange-500"
                    >
                      <option value="Daily">Daily (दैनिक)</option>
                      <option value="Weekly">Weekly (साप्ताहिक)</option>
                      <option value="Monthly">Monthly (मासिक)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Dispatch Hour</label>
                    <input
                      type="time"
                      value={newScheduleHour}
                      onChange={e => setNewScheduleHour(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">Recipient Email ID</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. ipgroup2002@gmail.com"
                    value={newScheduleEmail}
                    onChange={e => setNewScheduleEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[9px] font-extrabold text-slate-400 block mt-1 uppercase">Recommended backup email: ipgroup2002@gmail.com</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-xs shadow-md shadow-orange-500/10 cursor-pointer transition mt-3"
                >
                  ⚡ Arm Automation Trigger
                </button>
              </form>
            </div>

            {/* ACTIVE SCHEDULED CHANNELS & LOGS */}
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-6 text-left xl:col-span-2 space-y-6">
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase">Armed recurring dispatcher pipelines</h4>
                <p className="text-[10px] font-extrabold text-slate-400 mt-0.5">Active cron pipelines delivering scheduled secure digests</p>
              </div>

              {/* Pipeline List */}
              <div className="space-y-3.5">
                {schedules.map(sch => (
                  <div key={sch.id} className="border border-slate-100 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-orange-500/10 transition">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{sch.name}</span>
                        <span className="text-[8px] font-black uppercase bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100">{sch.frequency}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold space-y-0.5">
                        <div>Format: <span className="text-slate-800">{sch.reportType}</span></div>
                        <div>Target: <span className="text-slate-800 font-mono">{sch.email}</span> • Delivery hour: <span className="text-slate-800 font-mono">{sch.hour}</span></div>
                        {sch.lastSent && <div className="text-[9px] text-emerald-600 font-semibold">✓ Last successfully dispatched on: {sch.lastSent}</div>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleSchedule(sch.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border transition cursor-pointer ${
                          sch.active 
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                            : "bg-slate-50 border-slate-200 text-slate-400"
                        }`}
                      >
                        {sch.active ? "● Armed / Active" : "○ Disarmed"}
                      </button>
                      <button
                        onClick={() => {
                          alert(`Simulating immediate manual dispatch of ${sch.name} to ${sch.email}!`);
                          setScheduleLogs(prev => [
                            { id: `log-${Date.now()}`, scheduleName: sch.name, sentTo: sch.email, time: "Just Now (Manual Force Send)", status: "Success" },
                            ...prev
                          ]);
                        }}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition"
                        title="Force Trigger Email Now"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(sch.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery log queues */}
              <div className="border-t border-slate-100 pt-6 space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Simulated cron engine logs & receipts</span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {scheduleLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-900 truncate max-w-xs">{log.scheduleName}</span>
                        <span className="text-slate-400 font-mono">({log.sentTo})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 font-mono">{log.time}</span>
                        <span className="text-emerald-600 font-black tracking-widest uppercase">{log.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* DETAIL DRILL-DOWN CONTAINER MODAL */}
      <AnimatePresence>
        {drillDownData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl p-6 text-left space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-3 shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-950 uppercase">{drillDownData.title}</h3>
                  <p className="text-[10px] text-slate-400 font-extrabold mt-0.5">{drillDownData.description}</p>
                </div>
                <button 
                  onClick={() => setDrillDownData(null)}
                  className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Data Table block */}
              <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] border-b border-slate-100 sticky top-0">
                      {drillDownData.headers.map((h, idx) => (
                        <th key={idx} className="px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-bold text-slate-700">
                    {drillDownData.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        {row.map((cell, cidx) => (
                          <td key={cidx} className="px-4 py-3 truncate max-w-xs">{cell}</td>
                        ))}
                      </tr>
                    ))}
                    {drillDownData.rows.length === 0 && (
                      <tr>
                        <td colSpan={drillDownData.headers.length} className="text-center py-8 text-slate-400 italic">No constituent rows match.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Drawer footer controls */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 shrink-0">
                <button 
                  onClick={() => handleExportCSV(drillDownData.title, drillDownData.headers, drillDownData.rows)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" /> Download Sheet (CSV)
                </button>
                <button 
                  onClick={() => handleCopyClipboard(drillDownData.headers, drillDownData.rows)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  Copy Sheet (TSV)
                </button>
                <button 
                  onClick={() => setDrillDownData(null)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl text-xs"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Minimal missing component definitions
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
