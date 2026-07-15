import React, { useState, useEffect } from "react";
import { useWorkspace } from "./WorkspaceContext";
import { 
  TrendingUp, Users, DollarSign, Calendar, RefreshCw, Lock, Unlock, 
  CheckCircle, AlertCircle, FileText, Download, Printer, Plus, Award, 
  Briefcase, Clock, Building, User, Eye, ArrowUpRight, TrendingDown, 
  BookOpen, Sparkles, ChevronRight, Check, Trash2, Search, Filter, 
  AlertTriangle, Receipt, CreditCard, Landmark, History
} from "lucide-react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell 
} from "recharts";

interface EnterprisePayrollProps {
  users: any[];
  onNotify?: (msg: string) => void;
}

// Interfaces
interface SalaryStructure {
  userId: string;
  basic: number;
  hra: number;
  da: number;
  specialAllowance: number;
  medicalAllowance: number;
  travelAllowance: number;
  otherAllowances: number;
  pf: number;
  esi: number;
  profTax: number;
  incomeTax: number;
  loanRecovery: number;
  advanceRecovery: number;
  otherDeductions: number;
}

interface SalaryRevision {
  id: string;
  userId: string;
  previousSalary: number;
  newSalary: number;
  type: "Increment" | "Promotion";
  effectiveDate: string;
  revisionDate: string;
  notes: string;
}

interface BonusRecord {
  id: string;
  userId: string;
  amount: number;
  type: string;
  month: string;
  notes: string;
  status: "Pending" | "Approved";
}

interface OvertimeRecord {
  id: string;
  userId: string;
  hours: number;
  rate: number;
  month: string;
  status: "Pending" | "Approved" | "Rejected";
}

interface LoanRecord {
  id: string;
  userId: string;
  amount: number;
  type: "Loan" | "Advance";
  emi: number;
  outstanding: number;
  status: "Active" | "Completed";
  history: { date: string; amount: number; type: string }[];
}

interface PayrollRun {
  id: string;
  month: string; // YYYY-MM
  status: "Draft" | "Pending Approval" | "Approved" | "Locked" | "Released";
  processedEmployees: string[]; // userIds
  netPayout: number;
  processedAt: string;
  approvedBy?: string;
  auditTrail: { timestamp: string; action: string; user: string }[];
}

export default function EnterprisePayrollWorkspace({ users, onNotify }: EnterprisePayrollProps) {
  const { tenant, company, user: currentUser } = useWorkspace();
  const tenantId = tenant?.tenantId || "t-default";
  const companyId = company?.companyId || "c-default";

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "structures" | "processing" | "revisions" | "bonus" | "overtime" | "loans" | "compliance" | "bank" | "ai"
  >("dashboard");

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-07");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [selectedBranch, setSelectedBranch] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sub-tab / Details Drawer State
  const [selected360EmployeeId, setSelected360EmployeeId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<
    "structure" | "history" | "revisions" | "loans" | "bonus" | "overtime" | "payslips" | "timeline"
  >("structure");

  // Selected Payslip for View
  const [viewingPayslipUser, setViewingPayslipUser] = useState<any | null>(null);
  const [viewingPayslipMonth, setViewingPayslipMonth] = useState<string>("2026-07");

  // --- Dynamic Core Database Mock Setup (Isolated by Tenant/Company) ---
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [revisions, setRevisions] = useState<SalaryRevision[]>([]);
  const [bonuses, setBonuses] = useState<BonusRecord[]>([]);
  const [overtimes, setOvertimes] = useState<OvertimeRecord[]>([]);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);

  // Trigger Notification helper
  const notify = (msg: string) => {
    if (onNotify) onNotify(msg);
    else alert(msg);
  };

  // 1. Initial State Sync on load (with tenant and company isolation)
  useEffect(() => {
    const key = `hub_payroll_${tenantId}_${companyId}`;
    const stored = localStorage.getItem(key);
    
    // Default initial data generator based on users list
    const initialStructures: SalaryStructure[] = users.map(u => {
      const base = Number(u.salaryBase) || 30000;
      return {
        userId: u.id,
        basic: Math.round(base * 0.5),
        hra: Math.round(base * 0.2),
        da: Math.round(base * 0.1),
        specialAllowance: Math.round(base * 0.1),
        medicalAllowance: 1250,
        travelAllowance: 1600,
        otherAllowances: Math.round(base * 0.05),
        pf: Math.round(base * 0.06),
        esi: Math.round(base * 0.01),
        profTax: 200,
        incomeTax: Math.round(base * 0.05),
        loanRecovery: 0,
        advanceRecovery: 0,
        otherDeductions: 0,
      };
    });

    const initialRevisions: SalaryRevision[] = [
      {
        id: "rev-1",
        userId: users[0]?.id || "u-staff",
        previousSalary: 25000,
        newSalary: Number(users[0]?.salaryBase) || 30000,
        type: "Increment",
        effectiveDate: "2026-04-01",
        revisionDate: "2026-03-25",
        notes: "Excellent performance in Lead conversion ratios.",
      }
    ];

    const initialBonuses: BonusRecord[] = [
      { id: "b-1", userId: users[1]?.id || "u-caller", amount: 5000, type: "Performance Bonus", month: "2026-07", notes: "Achieved highest outbound lead target", status: "Approved" },
      { id: "b-2", userId: users[0]?.id || "u-staff", amount: 2000, type: "Festival Bonus", month: "2026-07", notes: "Regional festival allowance", status: "Pending" }
    ];

    const initialOvertimes: OvertimeRecord[] = [
      { id: "ot-1", userId: users[0]?.id || "u-staff", hours: 8, rate: 150, month: "2026-07", status: "Approved" },
      { id: "ot-2", userId: users[1]?.id || "u-caller", hours: 12, rate: 150, month: "2026-07", status: "Pending" }
    ];

    const initialLoans: LoanRecord[] = [
      {
        id: "loan-1",
        userId: users[1]?.id || "u-caller",
        amount: 15000,
        type: "Loan",
        emi: 3000,
        outstanding: 9000,
        status: "Active",
        history: [
          { date: "2026-05-10", amount: 15000, type: "Disbursement" },
          { date: "2026-06-01", amount: 3000, type: "EMI Recovery" },
          { date: "2026-07-01", amount: 3000, type: "EMI Recovery" }
        ]
      }
    ];

    const initialRuns: PayrollRun[] = [
      {
        id: "run-jun",
        month: "2026-06",
        status: "Released",
        processedEmployees: users.map(u => u.id),
        netPayout: users.reduce((acc, u) => acc + (Number(u.salaryBase) || 30000), 0) - 2000,
        processedAt: "2026-06-30T18:00:00.000Z",
        approvedBy: "u-admin",
        auditTrail: [
          { timestamp: "2026-06-28T10:00:00.000Z", action: "Payroll Calculated & Draft Mode", user: "u-admin" },
          { timestamp: "2026-06-29T12:00:00.000Z", action: "Locked & Approved for Release", user: "u-admin" },
          { timestamp: "2026-06-30T18:15:00.000Z", action: "Payout Bank NEFT Transferred", user: "u-admin" }
        ]
      },
      {
        id: "run-jul",
        month: "2026-07",
        status: "Draft",
        processedEmployees: [],
        netPayout: 0,
        processedAt: "",
        auditTrail: [
          { timestamp: "2026-07-14T08:00:00.000Z", action: "Payroll Workspace Opened & Synchronized", user: "System Engine" }
        ]
      }
    ];

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setStructures(parsed.structures || initialStructures);
        setRevisions(parsed.revisions || initialRevisions);
        setBonuses(parsed.bonuses || initialBonuses);
        setOvertimes(parsed.overtimes || initialOvertimes);
        setLoans(parsed.loans || initialLoans);
        setRuns(parsed.runs || initialRuns);
      } catch (e) {
        setStructures(initialStructures);
        setRevisions(initialRevisions);
        setBonuses(initialBonuses);
        setOvertimes(initialOvertimes);
        setLoans(initialLoans);
        setRuns(initialRuns);
      }
    } else {
      setStructures(initialStructures);
      setRevisions(initialRevisions);
      setBonuses(initialBonuses);
      setOvertimes(initialOvertimes);
      setLoans(initialLoans);
      setRuns(initialRuns);
    }
  }, [tenantId, companyId, users]);

  // Persist State Helper
  const persistState = (
    updatedStructures = structures,
    updatedRevisions = revisions,
    updatedBonuses = bonuses,
    updatedOvertimes = overtimes,
    updatedLoans = loans,
    updatedRuns = runs
  ) => {
    const key = `hub_payroll_${tenantId}_${companyId}`;
    localStorage.setItem(key, JSON.stringify({
      structures: updatedStructures,
      revisions: updatedRevisions,
      bonuses: updatedBonuses,
      overtimes: updatedOvertimes,
      loans: updatedLoans,
      runs: updatedRuns
    }));
  };

  // Helper selectors and formulas
  const getEmployeeStructure = (userId: string): SalaryStructure => {
    const struct = structures.find(s => s.userId === userId);
    if (struct) return struct;
    const emp = users.find(u => u.id === userId);
    const base = Number(emp?.salaryBase) || 30000;
    return {
      userId,
      basic: Math.round(base * 0.5),
      hra: Math.round(base * 0.2),
      da: Math.round(base * 0.1),
      specialAllowance: Math.round(base * 0.1),
      medicalAllowance: 1250,
      travelAllowance: 1600,
      otherAllowances: Math.round(base * 0.05),
      pf: Math.round(base * 0.06),
      esi: Math.round(base * 0.01),
      profTax: 200,
      incomeTax: Math.round(base * 0.05),
      loanRecovery: 0,
      advanceRecovery: 0,
      otherDeductions: 0,
    };
  };

  const getGrossSalary = (s: SalaryStructure) => {
    return s.basic + s.hra + s.da + s.specialAllowance + s.medicalAllowance + s.travelAllowance + s.otherAllowances;
  };

  const getTotalDeductions = (s: SalaryStructure) => {
    return s.pf + s.esi + s.profTax + s.incomeTax + s.loanRecovery + s.advanceRecovery + s.otherDeductions;
  };

  const getNetSalary = (s: SalaryStructure) => {
    return getGrossSalary(s) - getTotalDeductions(s);
  };

  const getEmpTotalPayoutForMonth = (userId: string, month: string) => {
    const s = getEmployeeStructure(userId);
    const basicNet = getNetSalary(s);
    const empBonus = bonuses
      .filter(b => b.userId === userId && b.month === month && b.status === "Approved")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const empOT = overtimes
      .filter(ot => ot.userId === userId && ot.month === month && ot.status === "Approved")
      .reduce((acc, curr) => acc + (curr.hours * curr.rate), 0);
    return basicNet + empBonus + empOT;
  };

  // Departments List (Derived or customized)
  const departments = Array.from(new Set(users.map(u => u.department || "General")));

  // Active Run object
  const currentRun = runs.find(r => r.month === selectedMonth) || {
    id: `run-${selectedMonth}`,
    month: selectedMonth,
    status: "Draft" as const,
    processedEmployees: [],
    netPayout: 0,
    processedAt: "",
    auditTrail: []
  };

  // Quick Action: Update Salary Structure Component
  const updateStructureField = (userId: string, field: keyof SalaryStructure, val: number) => {
    const updated = structures.map(s => {
      if (s.userId === userId) {
        return { ...s, [field]: val };
      }
      return s;
    });
    setStructures(updated);
    persistState(updated);
    notify("Employee salary component updated successfully.");
  };

  // Run Operations
  const handleGeneratePayroll = () => {
    // Collect all isolated employees
    const filteredUsers = users.filter(u => {
      if (selectedDept !== "All" && u.department !== selectedDept) return false;
      return u.id !== "u-admin";
    });

    const netPayout = filteredUsers.reduce((acc, u) => acc + getEmpTotalPayoutForMonth(u.id, selectedMonth), 0);

    const newAudit = {
      timestamp: new Date().toISOString(),
      action: `Payroll Generated for ${filteredUsers.length} employees. Total Net ₹${netPayout.toLocaleString()}`,
      user: currentUser?.name || "Admin"
    };

    const updatedRuns = runs.map(r => {
      if (r.month === selectedMonth) {
        return {
          ...r,
          status: "Pending Approval" as const,
          processedEmployees: filteredUsers.map(u => u.id),
          netPayout,
          processedAt: new Date().toISOString(),
          auditTrail: [...(r.auditTrail || []), newAudit]
        };
      }
      return r;
    });

    if (!runs.some(r => r.month === selectedMonth)) {
      updatedRuns.push({
        id: "run-" + Date.now(),
        month: selectedMonth,
        status: "Pending Approval",
        processedEmployees: filteredUsers.map(u => u.id),
        netPayout,
        processedAt: new Date().toISOString(),
        auditTrail: [newAudit]
      });
    }

    setRuns(updatedRuns);
    persistState(undefined, undefined, undefined, undefined, undefined, updatedRuns);
    notify(`Payroll generated. Status: Pending Approval. (Total: ₹${netPayout.toLocaleString()})`);
  };

  const handleRecalculatePayroll = () => {
    if (currentRun.status !== "Draft" && currentRun.status !== "Pending Approval") {
      notify("Cannot recalculate locked or released payrolls.");
      return;
    }
    handleGeneratePayroll();
    notify("Payroll recalculated dynamically with current allowances, overtime and loan EMI deductions.");
  };

  const handleLockPayroll = () => {
    const newAudit = {
      timestamp: new Date().toISOString(),
      action: `Payroll Locked and Approved`,
      user: currentUser?.name || "Admin"
    };
    const updatedRuns = runs.map(r => {
      if (r.month === selectedMonth) {
        return {
          ...r,
          status: "Locked" as const,
          auditTrail: [...(r.auditTrail || []), newAudit]
        };
      }
      return r;
    });
    setRuns(updatedRuns);
    persistState(undefined, undefined, undefined, undefined, undefined, updatedRuns);
    notify("Payroll Locked. Prepared for Release Disbursement.");
  };

  const handleReleasePayroll = () => {
    const newAudit = {
      timestamp: new Date().toISOString(),
      action: `Payroll Released and Confirmed`,
      user: currentUser?.name || "Admin"
    };
    
    // Deduct EMIs from Active loans
    const processedIds = currentRun.processedEmployees;
    const updatedLoans = loans.map(ln => {
      if (processedIds.includes(ln.userId) && ln.status === "Active") {
        const s = getEmployeeStructure(ln.userId);
        const recovery = ln.emi;
        const newOutstanding = Math.max(0, ln.outstanding - recovery);
        return {
          ...ln,
          outstanding: newOutstanding,
          status: (newOutstanding <= 0 ? "Completed" as const : "Active" as const),
          history: [...ln.history, { date: new Date().toISOString().split("T")[0], amount: recovery, type: "EMI Recovery" }]
        };
      }
      return ln;
    });

    const updatedRuns = runs.map(r => {
      if (r.month === selectedMonth) {
        return {
          ...r,
          status: "Released" as const,
          auditTrail: [...(r.auditTrail || []), newAudit]
        };
      }
      return r;
    });

    setLoans(updatedLoans);
    setRuns(updatedRuns);
    persistState(undefined, undefined, undefined, undefined, updatedLoans, updatedRuns);
    notify("Salary disbursement complete. Bank NEFT files generated, and payslips sent to registered emails!");
  };

  // Revisions Engine
  const handleAddRevision = (userId: string, newSalary: number, type: "Increment" | "Promotion", notes: string) => {
    const emp = users.find(u => u.id === userId);
    if (!emp) return;

    const previousSalary = Number(emp.salaryBase) || 30000;
    const rev: SalaryRevision = {
      id: "rev-" + Date.now(),
      userId,
      previousSalary,
      newSalary,
      type,
      effectiveDate: new Date().toISOString().split("T")[0],
      revisionDate: new Date().toISOString().split("T")[0],
      notes
    };

    const updatedRevisions = [rev, ...revisions];
    setRevisions(updatedRevisions);

    // Dynamically adjust salaryBase of user
    emp.salaryBase = newSalary;

    // Dynamically recalculate/reset their structure basic, hra, da
    const updatedStructures = structures.map(s => {
      if (s.userId === userId) {
        return {
          ...s,
          basic: Math.round(newSalary * 0.5),
          hra: Math.round(newSalary * 0.2),
          da: Math.round(newSalary * 0.1),
          specialAllowance: Math.round(newSalary * 0.1),
          pf: Math.round((newSalary * 0.5) * 0.06),
          esi: Math.round(newSalary * 0.01),
          incomeTax: Math.round(newSalary * 0.05),
        };
      }
      return s;
    });

    setStructures(updatedStructures);
    persistState(updatedStructures, updatedRevisions);
    notify(`Salary Revision logged successfully for ${emp.name}.`);
  };

  // Add Bonus / Incentive
  const handleAddBonus = (userId: string, amount: number, type: any, notes: string) => {
    const newBonus: BonusRecord = {
      id: "b-" + Date.now(),
      userId,
      amount,
      type,
      month: selectedMonth,
      notes,
      status: "Approved"
    };
    const updated = [newBonus, ...bonuses];
    setBonuses(updated);
    persistState(undefined, undefined, updated);
    notify("Bonus incentive logged & approved.");
  };

  // Manage Loans
  const handleAddLoan = (userId: string, amount: number, type: "Loan" | "Advance", emi: number) => {
    const newLoan: LoanRecord = {
      id: "loan-" + Date.now(),
      userId,
      amount,
      type,
      emi,
      outstanding: amount,
      status: "Active",
      history: [{ date: new Date().toISOString().split("T")[0], amount, type: "Disbursement" }]
    };
    const updated = [newLoan, ...loans];
    setLoans(updated);
    persistState(undefined, undefined, undefined, undefined, updated);
    notify(`${type} of ₹${amount.toLocaleString()} disbursed to employee.`);
  };

  // Manage Overtime
  const handleAddOvertime = (userId: string, hours: number, rate: number) => {
    const ot: OvertimeRecord = {
      id: "ot-" + Date.now(),
      userId,
      hours,
      rate,
      month: selectedMonth,
      status: "Approved"
    };
    const updated = [ot, ...overtimes];
    setOvertimes(updated);
    persistState(undefined, undefined, undefined, updated);
    notify(`Logged ${hours} hours of overtime at ₹${rate}/hr.`);
  };

  // Calculate high-level metrics for selected month
  const getDashboardMetrics = () => {
    const filteredUsers = users.filter(u => u.id !== "u-admin");
    const pendingCount = currentRun.status === "Draft" || currentRun.status === "Pending Approval" ? filteredUsers.length : 0;
    const processedCount = currentRun.status !== "Draft" ? filteredUsers.length : 0;
    const releasedCount = currentRun.status === "Released" ? filteredUsers.length : 0;

    const baseSum = filteredUsers.reduce((sum, u) => sum + (Number(u.salaryBase) || 30000), 0);
    const activeRevisions = revisions.length;

    // Summations of allowances/deductions
    let totalPF = 0;
    let totalESI = 0;
    let totalPT = 0;
    let totalTDS = 0;
    let totalDeductSum = 0;
    let totalBonus = 0;
    let totalOT = 0;
    let totalLoanDeduct = 0;

    filteredUsers.forEach(u => {
      const s = getEmployeeStructure(u.id);
      totalPF += s.pf;
      totalESI += s.esi;
      totalPT += s.profTax;
      totalTDS += s.incomeTax;
      totalDeductSum += getTotalDeductions(s);

      // Bonuses
      totalBonus += bonuses
        .filter(b => b.userId === u.id && b.month === selectedMonth && b.status === "Approved")
        .reduce((acc, curr) => acc + curr.amount, 0);

      // OT
      totalOT += overtimes
        .filter(ot => ot.userId === u.id && ot.month === selectedMonth && ot.status === "Approved")
        .reduce((acc, curr) => acc + (curr.hours * curr.rate), 0);

      // Loan Recovery
      const userActiveLoan = loans.find(l => l.userId === u.id && l.status === "Active");
      if (userActiveLoan) {
        totalLoanDeduct += userActiveLoan.emi;
      }
    });

    const finalNetPay = (baseSum + totalBonus + totalOT) - (totalDeductSum + totalLoanDeduct);

    return {
      totalEmployees: filteredUsers.length,
      pendingCount,
      processedCount,
      releasedCount,
      totalSalary: baseSum + totalBonus + totalOT,
      netPay: Math.max(0, finalNetPay),
      bonus: totalBonus,
      overtime: totalOT,
      loanDeductions: totalLoanDeduct,
      pf: totalPF,
      esi: totalESI,
      profTax: totalPT,
      tds: totalTDS,
      activeRevisions
    };
  };

  const metrics = getDashboardMetrics();

  // Filtered staff list for lists and tables
  const displayedUsers = users
    .filter(u => u.id !== "u-admin")
    .filter(u => {
      if (selectedDept !== "All" && u.department !== selectedDept) return false;
      if (searchQuery) {
        return (
          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (u.position && u.position.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return true;
    });

  // Recharts Chart Data Formatters
  const departmentChartData = departments.map(dept => {
    const deptUsers = users.filter(u => u.department === dept && u.id !== "u-admin");
    const cost = deptUsers.reduce((sum, u) => sum + getEmpTotalPayoutForMonth(u.id, selectedMonth), 0);
    return { name: dept, Cost: cost };
  });

  const salaryDistributionData = [
    { name: "₹10k - ₹20k", count: users.filter(u => (Number(u.salaryBase) || 30000) <= 20000 && u.id !== "u-admin").length },
    { name: "₹20k - ₹35k", count: users.filter(u => (Number(u.salaryBase) || 30000) > 20000 && (Number(u.salaryBase) || 30000) <= 35000 && u.id !== "u-admin").length },
    { name: "₹35k - ₹50k", count: users.filter(u => (Number(u.salaryBase) || 30000) > 35000 && (Number(u.salaryBase) || 30000) <= 50000 && u.id !== "u-admin").length },
    { name: "₹50k+", count: users.filter(u => (Number(u.salaryBase) || 30000) > 50000 && u.id !== "u-admin").length },
  ];

  const trendData = [
    { month: "Jan", Cost: 240000 },
    { month: "Feb", Cost: 255000 },
    { month: "Mar", Cost: 280000 },
    { month: "Apr", Cost: 295000 },
    { month: "May", Cost: 310000 },
    { month: "Jun", Cost: metrics.totalSalary - 10000 },
    { month: "Jul", Cost: metrics.totalSalary },
  ];

  // Colors for charts
  const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899"];

  return (
    <div className="bg-[#f8fafc] text-slate-800 rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden text-left flex flex-col h-full min-h-[750px] font-sans">
      
      {/* Premium Header Bar with White Theme / Glassmorphism */}
      <div className="bg-white/95 border-b border-slate-200/80 px-6 py-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Enterprise Payroll Engine</h1>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200 uppercase">
                SAP SuccessFactors V3
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Corporate salaries, structured allowances, compliance deductions, audits, and real-time bank transfers
            </p>
          </div>
        </div>

        {/* Global Workplace / Tenant Context Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            <span className="font-bold text-slate-700">Workspace Context:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border text-[#f97316] font-extrabold">
              {companyId} ({tenantId})
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-1 rounded-xl flex gap-1">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white text-xs font-bold text-slate-800 border border-slate-200 focus:border-[#f97316] rounded-lg px-2.5 py-1 outline-none cursor-pointer"
            >
              <option value="2026-06">June 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-08">August 2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-50/50 border-b border-slate-200/80 px-6 overflow-x-auto flex gap-1.5 scrollbar-thin">
        {[
          { id: "dashboard", label: "Dashboard", icon: TrendingUp },
          { id: "structures", label: "Salary Structures", icon: CreditCard },
          { id: "processing", label: "Run Payroll", icon: RefreshCw },
          { id: "revisions", label: "Salary Revisions", icon: Award },
          { id: "bonus", label: "Bonus & Incentives", icon: Sparkles },
          { id: "overtime", label: "Overtime", icon: Clock },
          { id: "loans", label: "Loans & Advances", icon: Landmark },
          { id: "compliance", label: "Compliance & Taxes", icon: Landmark },
          { id: "bank", label: "Bank Transfer", icon: History },
          { id: "ai", label: "AI Forecasts", icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-4 text-xs font-bold tracking-wide border-b-2 transition duration-200 shrink-0 uppercase cursor-pointer ${
                active 
                  ? "border-[#f97316] text-[#f97316] bg-white font-extrabold" 
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-[#f97316]" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* -------------------------------------------------------------
            TAB 1: PAYROLL DASHBOARD
            ------------------------------------------------------------- */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* KPI Cards Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Payroll Headcount</p>
                  <h3 className="text-2xl font-black text-slate-900">{metrics.totalEmployees}</h3>
                  <div className="flex gap-2 text-[10px] text-slate-500 font-semibold">
                    <span className="text-emerald-600">Active Node</span>
                    <span>•</span>
                    <span>100% On-boarded</span>
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-xl text-[#f97316]">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Monthly Salary Cost</p>
                  <h3 className="text-2xl font-black text-slate-900">₹{metrics.totalSalary.toLocaleString('en-IN')}</h3>
                  <div className="flex gap-2 text-[10px] text-[#f97316] font-bold">
                    <span>Inc. Overtime & Bonus</span>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Net Payable Outstanding</p>
                  <h3 className="text-2xl font-black text-slate-900">₹{metrics.netPay.toLocaleString('en-IN')}</h3>
                  <div className="flex gap-2 text-[10px] text-slate-500 font-semibold">
                    <span>After statutory PF & Tax deductions</span>
                  </div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Salary Run Status</p>
                  <span className={`inline-block text-xs px-3 py-1 rounded-full font-black uppercase mt-1 ${
                    currentRun.status === "Released" ? "bg-emerald-100 text-emerald-800" :
                    currentRun.status === "Locked" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {currentRun.status}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Current Month: {selectedMonth}</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Statutory Compliance / Tax Deductions breakdown */}
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest">Statutory Compliance Contribution (Current Month Drafts)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { name: "Provident Fund (PF)", amount: metrics.pf, bg: "bg-[#f97316]/5", text: "text-[#f97316]" },
                  { name: "ESI Contribution", amount: metrics.esi, bg: "bg-blue-500/5", text: "text-blue-600" },
                  { name: "Professional Tax", amount: metrics.profTax, bg: "bg-indigo-500/5", text: "text-indigo-600" },
                  { name: "Income Tax (TDS)", amount: metrics.tds, bg: "bg-purple-500/5", text: "text-purple-600" },
                  { name: "Bonus Additions", amount: metrics.bonus, bg: "bg-emerald-500/5", text: "text-emerald-600" },
                  { name: "Overtime Accumulations", amount: metrics.overtime, bg: "bg-pink-500/5", text: "text-pink-600" },
                ].map(item => (
                  <div key={item.name} className={`${item.bg} border border-slate-200/60 p-3.5 rounded-xl space-y-1`}>
                    <p className="text-[9px] text-slate-500 font-extrabold uppercase truncate">{item.name}</p>
                    <p className={`text-base font-black ${item.text}`}>₹{item.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Department Salary distribution cost */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Departmental Cost Allocation</h4>
                  <p className="text-[10px] text-slate-400">Total payroll expense divided by operational business units</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Bar dataKey="Cost" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Salary Bracket Spread */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Salary Range Spread Distribution</h4>
                  <p className="text-[10px] text-slate-400">Segment of workforce divided by monthly payout grade brackets</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      <Line type="monotone" dataKey="Cost" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 2: EMPLOYEE SALARY STRUCTURES
            ------------------------------------------------------------- */}
        {activeTab === "structures" && (
          <div className="space-y-6">
            
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search employee or role structure..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] outline-none text-xs rounded-xl pl-9 pr-4 py-2.5"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-white border border-slate-200 text-xs font-bold px-3 py-2.5 rounded-xl cursor-pointer"
                >
                  <option value="All">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* List and inline editing */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500">Employee Details</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500">Base CTC</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500">Basic (50%)</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500">HRA (20%)</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500">DA (10%)</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500">Allowances</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500">TDS/Tax</th>
                      <th className="px-6 py-4 text-xs font-bold text-[#f97316]">Net Monthly</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {displayedUsers.map(emp => {
                      const s = getEmployeeStructure(emp.id);
                      const baseVal = Number(emp.salaryBase) || 30000;
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">{emp.role} • {emp.department || "General"}</div>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-slate-700">₹{baseVal.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={s.basic}
                              onChange={(e) => updateStructureField(emp.id, "basic", Number(e.target.value))}
                              className="w-16 bg-slate-50 border border-slate-200 font-mono font-semibold text-[11px] p-1 rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={s.hra}
                              onChange={(e) => updateStructureField(emp.id, "hra", Number(e.target.value))}
                              className="w-16 bg-slate-50 border border-slate-200 font-mono font-semibold text-[11px] p-1 rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={s.da}
                              onChange={(e) => updateStructureField(emp.id, "da", Number(e.target.value))}
                              className="w-16 bg-slate-50 border border-slate-200 font-mono font-semibold text-[11px] p-1 rounded"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-0.5 font-mono text-[10px] text-slate-500">
                              <p>Med: ₹{s.medicalAllowance}</p>
                              <p>Trav: ₹{s.travelAllowance}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              value={s.incomeTax}
                              onChange={(e) => updateStructureField(emp.id, "incomeTax", Number(e.target.value))}
                              className="w-16 bg-slate-50 border border-slate-200 font-mono font-semibold text-[11px] p-1 rounded"
                            />
                          </td>
                          <td className="px-6 py-4 font-mono font-black text-[#f97316] text-sm">
                            ₹{getNetSalary(s).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelected360EmployeeId(emp.id);
                                setDrawerTab("structure");
                              }}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer mx-auto"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#f97316]" />
                              360 View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: PAYROLL PROCESSING ENGINE
            ------------------------------------------------------------- */}
        {activeTab === "processing" && (
          <div className="space-y-6">
            
            {/* Status Flow representation */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row justify-around items-center gap-4 text-center relative">
              {[
                { label: "1. Create Draft", desc: "Select Month & compute Base", status: "Draft", active: currentRun.status === "Draft" },
                { label: "2. Awaiting Signoff", desc: "Audit and verify structures", status: "Pending Approval", active: currentRun.status === "Pending Approval" },
                { label: "3. Locked & Prepared", desc: "Lock structure & prevent edits", status: "Locked", active: currentRun.status === "Locked" },
                { label: "4. Disbursed & Released", desc: "Export bank wire & release", status: "Released", active: currentRun.status === "Released" },
              ].map((step, idx) => (
                <div key={idx} className="flex flex-col items-center space-y-1 relative z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                    step.active ? "bg-[#f97316] text-white" : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}>
                    {idx + 1}
                  </div>
                  <h5 className={`text-xs font-black ${step.active ? "text-[#f97316]" : "text-slate-700"}`}>{step.label}</h5>
                  <p className="text-[10px] text-slate-400">{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Run Actions and calculation metrics */}
            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-1.5">
                <span className="text-[10px] bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-black uppercase">
                  Current Engine Phase: {currentRun.status}
                </span>
                <h3 className="text-base font-black text-slate-800">
                  Execute Salary Cycle for month: <span className="text-[#f97316]">{selectedMonth}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Calculates salaries, adds bonus rewards, overtime allowances, recovers loan EMI balances, and generates payslip registers.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleGeneratePayroll}
                  disabled={currentRun.status !== "Draft"}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 ${
                    currentRun.status === "Draft" ? "bg-[#f97316] text-white hover:bg-orange-600" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate Draft Payroll
                </button>

                <button
                  onClick={handleRecalculatePayroll}
                  disabled={currentRun.status !== "Pending Approval"}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 ${
                    currentRun.status === "Pending Approval" ? "bg-slate-800 text-white hover:bg-slate-950" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Recalculate Payouts
                </button>

                <button
                  onClick={handleLockPayroll}
                  disabled={currentRun.status !== "Pending Approval"}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 ${
                    currentRun.status === "Pending Approval" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Lock & Approve
                </button>

                <button
                  onClick={handleReleasePayroll}
                  disabled={currentRun.status !== "Locked"}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 ${
                    currentRun.status === "Locked" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Release Salaries
                </button>
              </div>
            </div>

            {/* Run Audit Trail and Log History */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Payroll Activity Logs & Audit Trail</h4>
                <p className="text-[10px] text-slate-400">Chronological history of edits, calculations, and lock commands for security audits.</p>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {(currentRun.auditTrail || []).map((trail, index) => (
                  <div key={index} className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs">
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{new Date(trail.timestamp).toLocaleTimeString()}</span>
                    <span className="bg-[#f97316]/10 text-[#f97316] font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">{trail.user}</span>
                    <span className="text-slate-600 font-medium">{trail.action}</span>
                  </div>
                ))}
                {(currentRun.auditTrail || []).length === 0 && (
                  <p className="text-slate-400 text-center text-xs py-4">No audit logs for current selection. Click 'Generate' to initiate calculations.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 4: SALARY REVISIONS & PROMOTIONS
            ------------------------------------------------------------- */}
        {activeTab === "revisions" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Log a Promotion / Increment Form */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 text-left h-fit">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Log Promotion / Increment</h3>
                <p className="text-[11px] text-slate-400">Permanently adjust CTC and generate professional increment letters.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const empId = fd.get("employeeId") as string;
                const newCTC = Number(fd.get("newCTC"));
                const revType = fd.get("revType") as any;
                const notes = fd.get("notes") as string;

                if (!empId || !newCTC) {
                  notify("Please fill all required inputs.");
                  return;
                }
                handleAddRevision(empId, newCTC, revType, notes);
                e.currentTarget.reset();
              }} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Select Employee</label>
                  <select name="employeeId" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold">
                    {users.filter(u => u.id !== "u-admin").map(u => (
                      <option key={u.id} value={u.id}>{u.name} (Base: ₹{u.salaryBase})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Revision Type</label>
                    <select name="revType" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold">
                      <option value="Increment">Salary Increment</option>
                      <option value="Promotion">Promotion Cycle</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">New CTC (Base)</label>
                    <input type="number" name="newCTC" placeholder="e.g. 35000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Revision Notes & Approval details</label>
                  <textarea name="notes" placeholder="Reasons for CTC hike, department vote etc." rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium" />
                </div>

                <button type="submit" className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold py-2.5 rounded-xl cursor-pointer">
                  Hike Salary & Update Struct
                </button>
              </form>
            </div>

            {/* Revisions History Logs */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Salary Revision Logs & Timelines</h4>
                <p className="text-[10px] text-slate-400">Audit trail of increments, old vs new payout CTC rates, and notes.</p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {revisions.map(rev => {
                  const emp = users.find(u => u.id === rev.userId);
                  return (
                    <div key={rev.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2 text-left">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-extrabold text-slate-800">{emp?.name || "Staff Member"}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{rev.type} • Effective: {rev.effectiveDate}</p>
                        </div>
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg font-bold">
                          Hike: +{Math.round(((rev.newSalary - rev.previousSalary) / rev.previousSalary) * 100)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-200/50 py-2 text-xs font-mono">
                        <div>
                          <p className="text-slate-400">Previous CTC</p>
                          <p className="font-bold text-slate-700">₹{rev.previousSalary.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">New Revised CTC</p>
                          <p className="font-extrabold text-[#f97316]">₹{rev.newSalary.toLocaleString()}</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium italic">" {rev.notes} "</p>
                    </div>
                  );
                })}
                {revisions.length === 0 && (
                  <p className="text-slate-400 text-center text-xs py-8">No revision histories recorded yet.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 5: BONUS & INCENTIVES
            ------------------------------------------------------------- */}
        {activeTab === "bonus" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Add Bonus form */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 text-left h-fit">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Disburse Bonus / Incentive</h3>
                <p className="text-[11px] text-slate-400">Apply festival, performance or sales commission bonuses.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const empId = fd.get("employeeId") as string;
                const amt = Number(fd.get("amount"));
                const type = fd.get("bonusType") as string;
                const notes = fd.get("notes") as string;

                if (!empId || !amt) {
                  notify("Please fill all required fields.");
                  return;
                }
                handleAddBonus(empId, amt, type as any, notes);
                e.currentTarget.reset();
              }} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Select Employee</label>
                  <select name="employeeId" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold">
                    {users.filter(u => u.id !== "u-admin").map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Bonus Type</label>
                    <select name="bonusType" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold">
                      <option value="Performance Bonus">Performance Bonus</option>
                      <option value="Festival Bonus">Festival Bonus</option>
                      <option value="Monthly Bonus">Monthly Bonus</option>
                      <option value="Sales Incentive">Sales Incentive</option>
                      <option value="Custom Incentive">Custom Incentive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Bonus Amount (₹)</label>
                    <input type="number" name="amount" placeholder="e.g. 5000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Notes / Achievements</label>
                  <input type="text" name="notes" placeholder="Special achievement reference" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium" />
                </div>

                <button type="submit" className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold py-2.5 rounded-xl cursor-pointer">
                  Award & Approve Bonus
                </button>
              </form>
            </div>

            {/* List and display */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Current Month Bonus disbursements</h4>
                <p className="text-[10px] text-slate-400">Bonus, incentives, and rewards queued to be added to next salary paycycle.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold text-slate-500">
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Remarks</th>
                      <th className="px-4 py-3">Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {bonuses.filter(b => b.month === selectedMonth).map(b => {
                      const emp = users.find(u => u.id === b.userId);
                      return (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-800">{emp?.name || "Staff"}</td>
                          <td className="px-4 py-3 text-slate-600 font-medium">{b.type}</td>
                          <td className="px-4 py-3 font-mono font-bold text-emerald-600">₹{b.amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-400">{b.notes}</td>
                          <td className="px-4 py-3">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Approved</span>
                          </td>
                        </tr>
                      );
                    })}
                    {bonuses.filter(b => b.month === selectedMonth).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No bonus disbursements logged for current month.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 6: OVERTIME TRACKING
            ------------------------------------------------------------- */}
        {activeTab === "overtime" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* OT Log Form */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 text-left h-fit">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Log Overtime Hours</h3>
                <p className="text-[11px] text-slate-400">Award overtime based on extra corporate hours logged.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const empId = fd.get("employeeId") as string;
                const hours = Number(fd.get("hours"));
                const rate = Number(fd.get("rate"));

                if (!empId || !hours || !rate) {
                  notify("Please fill all required inputs.");
                  return;
                }
                handleAddOvertime(empId, hours, rate);
                e.currentTarget.reset();
              }} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Select Employee</label>
                  <select name="employeeId" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold">
                    {users.filter(u => u.id !== "u-admin").map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">OT Hours</label>
                    <input type="number" name="hours" placeholder="e.g. 10" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold" />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Hourly Rate (₹)</label>
                    <input type="number" name="rate" placeholder="e.g. 150" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold py-2.5 rounded-xl cursor-pointer">
                  Approve & Log Overtime
                </button>
              </form>
            </div>

            {/* OT Table */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Overtime Accumulations</h4>
                <p className="text-[10px] text-slate-400">Total approved extra hours and calculated payout multiplier.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-extrabold text-slate-500">
                      <th className="px-4 py-3">Employee</th>
                      <th className="px-4 py-3">Hours Logged</th>
                      <th className="px-4 py-3">Overtime Rate</th>
                      <th className="px-4 py-3">Final Amount</th>
                      <th className="px-4 py-3">Approval</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {overtimes.filter(ot => ot.month === selectedMonth).map(ot => {
                      const emp = users.find(u => u.id === ot.userId);
                      return (
                        <tr key={ot.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-800">{emp?.name || "Staff"}</td>
                          <td className="px-4 py-3 font-semibold text-slate-600">{ot.hours} Hours</td>
                          <td className="px-4 py-3 font-mono">₹{ot.rate}/Hr</td>
                          <td className="px-4 py-3 font-mono font-bold text-[#f97316]">₹{(ot.hours * ot.rate).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">Approved</span>
                          </td>
                        </tr>
                      );
                    })}
                    {overtimes.filter(ot => ot.month === selectedMonth).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No overtime records logged for current month.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 7: LOANS & SALARY ADVANCES
            ------------------------------------------------------------- */}
        {activeTab === "loans" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Issue Loan Form */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4 text-left h-fit">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Disburse Loan / Advance</h3>
                <p className="text-[11px] text-slate-400">Issue salary advances or medium-term company loans.</p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const empId = fd.get("employeeId") as string;
                const amt = Number(fd.get("amount"));
                const type = fd.get("loanType") as "Loan" | "Advance";
                const emi = Number(fd.get("emi"));

                if (!empId || !amt || !emi) {
                  notify("Please fill all inputs.");
                  return;
                }
                handleAddLoan(empId, amt, type, emi);
                e.currentTarget.reset();
              }} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Select Employee</label>
                  <select name="employeeId" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold">
                    {users.filter(u => u.id !== "u-admin").map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Type</label>
                    <select name="loanType" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold">
                      <option value="Loan">Company Loan</option>
                      <option value="Advance">Salary Advance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Disbursed (₹)</label>
                    <input type="number" name="amount" placeholder="e.g. 20000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Monthly EMI Recovery (₹)</label>
                  <input type="number" name="emi" placeholder="e.g. 5000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold" />
                </div>

                <button type="submit" className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold py-2.5 rounded-xl cursor-pointer">
                  Disburse Funds & Set recovery EMI
                </button>
              </form>
            </div>

            {/* Active Loan recovery history display */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Loans & Advance Ledger</h4>
                <p className="text-[10px] text-slate-400">Total outstanding balances and automated monthly EMI recovery timeline statuses.</p>
              </div>

              <div className="space-y-4">
                {loans.map(loan => {
                  const emp = users.find(u => u.id === loan.userId);
                  const progress = Math.round(((loan.amount - loan.outstanding) / loan.amount) * 100);
                  return (
                    <div key={loan.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 text-left">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm">{emp?.name || "Staff Member"}</p>
                          <span className="text-[9px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-black uppercase tracking-wider">{loan.type}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xs text-slate-400">Outstanding</p>
                          <p className="font-mono font-extrabold text-slate-800">₹{loan.outstanding.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span>EMI Recovery Progress</span>
                          <span>{progress}% Recovered</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="bg-[#f97316] h-full" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                        <span>Original: ₹{loan.amount.toLocaleString()}</span>
                        <span>EMI Auto-Deduction: ₹{loan.emi}/Mo</span>
                      </div>
                    </div>
                  );
                })}
                {loans.length === 0 && (
                  <p className="text-slate-400 text-center text-xs py-8">No employee loans or advance balances active.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 8: STATUTORY COMPLIANCE & TDS
            ------------------------------------------------------------- */}
        {activeTab === "compliance" && (
          <div className="space-y-6">
            
            {/* Dynamic visual parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Provident Fund (PF) Rule</h4>
                <p className="text-sm font-bold text-slate-800">12% of Basic Salary</p>
                <div className="text-[10px] text-slate-500 font-semibold bg-slate-50 p-2 rounded-lg">
                  Employer & Employee statutory matching contributions computed.
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">ESI Premium Premium Rule</h4>
                <p className="text-sm font-bold text-slate-800">0.75% of Gross Payout</p>
                <div className="text-[10px] text-slate-500 font-semibold bg-slate-50 p-2 rounded-lg">
                  Applicable dynamically if monthly gross salary is below ₹21,000 threshold.
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Professional Tax Bracket</h4>
                <p className="text-sm font-bold text-slate-800">₹200 Standard Flat Deduct</p>
                <div className="text-[10px] text-slate-500 font-semibold bg-slate-50 p-2 rounded-lg">
                  Monthly statutory state professional tax slab recovery standard deduction.
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">TDS Tax slabs (Income Tax)</h4>
                <p className="text-sm font-bold text-slate-800">Dynamic slab placeholder</p>
                <div className="text-[10px] text-slate-500 font-semibold bg-slate-50 p-2 rounded-lg">
                  Income Tax calculated dynamically according to Indian Financial Union budget slabs.
                </div>
              </div>
            </div>

            {/* Compliance Report Placeholder Table */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">EPFO & ESIC Union Return Filing Sheet</h4>
                <p className="text-[10px] text-slate-400">Monthly statutory reports ready for direct EPFO ECR upload and ESIC submission.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-extrabold text-slate-500">
                      <th className="px-4 py-3">Employee UAN / ID</th>
                      <th className="px-4 py-3">EPF Basic Wages</th>
                      <th className="px-4 py-3">Employee Share (12%)</th>
                      <th className="px-4 py-3">Employer Share (3.67%)</th>
                      <th className="px-4 py-3">Pension Fund Share (8.33%)</th>
                      <th className="px-4 py-3">ESIC Monthly Wages</th>
                      <th className="px-4 py-3">Employee ESIC (0.75%)</th>
                      <th className="px-4 py-3">LWF Deducted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-mono">
                    {users.filter(u => u.id !== "u-admin").map(u => {
                      const s = getEmployeeStructure(u.id);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-800 font-sans font-bold">{u.name}</td>
                          <td className="px-4 py-3">₹{s.basic}</td>
                          <td className="px-4 py-3">₹{s.pf}</td>
                          <td className="px-4 py-3">₹{Math.round(s.pf * 0.305)}</td>
                          <td className="px-4 py-3">₹{Math.round(s.pf * 0.695)}</td>
                          <td className="px-4 py-3">₹{getGrossSalary(s)}</td>
                          <td className="px-4 py-3">₹{s.esi}</td>
                          <td className="px-4 py-3">₹30</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 9: BANK TRANSFER LIST GENERATION
            ------------------------------------------------------------- */}
        {activeTab === "bank" && (
          <div className="space-y-6">
            
            {/* NEFT Export tools */}
            <div className="bg-[#f8fafc] border border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-left">
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-800">Generate Bulk Bank Transfer Gateway List</h3>
                <p className="text-xs text-slate-500">
                  Export structured text files to upload directly inside ICICI Corporate Banking, HDFC, SBI or Axis NetBanking portals.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => notify("NEFT Gateway payment text file generated successfully. Download started.")} className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <Download className="w-4 h-4" />
                  NEFT / RTGS Export
                </button>
                <button onClick={() => notify("Excel Bank Sheet spreadsheet compiled. Check download notifications.")} className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm">
                  <FileText className="w-4 h-4" />
                  Excel Salary Sheet
                </button>
              </div>
            </div>

            {/* Bank Transfer list table */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Salary Disbursement Beneficiary Accounts</h4>
                <p className="text-[10px] text-slate-400">Authorized bank accounts of employees with queued payouts.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-extrabold text-slate-500">
                      <th className="px-4 py-3">Account Beneficiary Name</th>
                      <th className="px-4 py-3">Bank Name</th>
                      <th className="px-4 py-3">IFSC Swift Code</th>
                      <th className="px-4 py-3">Account Number</th>
                      <th className="px-4 py-3">Branch location</th>
                      <th className="px-4 py-3 text-right">Net Payable Transfer (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-mono">
                    {users.filter(u => u.id !== "u-admin").map((u, idx) => {
                      const s = getEmployeeStructure(u.id);
                      const banks = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank"];
                      return (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-sans font-bold text-slate-800">{u.name}</td>
                          <td className="px-4 py-3 font-sans font-medium text-slate-600">{banks[idx % banks.length]}</td>
                          <td className="px-4 py-3">IFSC000{3040 + idx}</td>
                          <td className="px-4 py-3">91040502040{idx}</td>
                          <td className="px-4 py-3 font-sans text-slate-500">New Delhi HQ</td>
                          <td className="px-4 py-3 font-extrabold text-[#f97316] text-right text-sm">₹{getNetSalary(s).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 10: AI HUB PLACEHOLDERS
            ------------------------------------------------------------- */}
        {activeTab === "ai" && (
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm text-center max-w-xl mx-auto space-y-6 my-12">
            <div className="bg-orange-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto text-[#f97316] shadow-md shadow-orange-500/10">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">AI Payroll Intel Hub</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                Predictive payroll intelligence, dynamic tax optimization sheets, and automated budget forecast indicators.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left">
              {[
                "AI Payroll Insights",
                "AI Salary Forecast",
                "AI Cost Optimization",
                "AI Payroll Summary"
              ].map(feat => (
                <div key={feat} className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col justify-between space-y-2">
                  <p className="text-xs font-black text-slate-700">{feat}</p>
                  <span className="text-[9px] font-bold text-[#f97316]/80 tracking-widest uppercase bg-orange-500/5 border border-orange-500/10 px-2 py-1 rounded w-fit">
                    V4 Premium
                  </span>
                </div>
              ))}
            </div>

            <div className="inline-block bg-[#0a0d14] text-white text-xs font-black px-6 py-2 rounded-xl tracking-widest border border-slate-800">
              🚀 COMING IN HUBSPHERE V4
            </div>
          </div>
        )}

      </div>

      {/* -------------------------------------------------------------
          SLIDEOVER DRAWER: EMPLOYEE PAYROLL 360 PROFILE
          ------------------------------------------------------------- */}
      {selected360EmployeeId && (() => {
        const emp = users.find(u => u.id === selected360EmployeeId);
        const s = getEmployeeStructure(selected360EmployeeId);
        
        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
            <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col text-left">
              
              {/* Slideover Header */}
              <div className="bg-[#0a0d14] text-white p-6 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#f97316]/25 text-[#f97316] flex items-center justify-center font-black text-sm">
                    {emp?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-sm font-black tracking-tight">{emp?.name}</h2>
                    <p className="text-[11px] text-gray-400 capitalize">{emp?.position || "Employee"} • {emp?.department || "General"}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setSelected360EmployeeId(null)}
                  className="text-gray-400 hover:text-white font-black text-lg outline-none cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 flex gap-1 overflow-x-auto">
                {[
                  { id: "structure", label: "CTC Structure" },
                  { id: "history", label: "History" },
                  { id: "revisions", label: "CTC Revisions" },
                  { id: "loans", label: "Loans" },
                  { id: "bonus", label: "Bonuses" },
                  { id: "overtime", label: "Overtime" },
                  { id: "payslips", label: "Payslip Portal" },
                  { id: "timeline", label: "Audit Timeline" }
                ].map(dTab => (
                  <button
                    key={dTab.id}
                    onClick={() => setDrawerTab(dTab.id as any)}
                    className={`py-3 px-3 text-[11px] font-black uppercase border-b-2 shrink-0 cursor-pointer ${
                      drawerTab === dTab.id ? "border-[#f97316] text-[#f97316] font-extrabold" : "border-transparent text-slate-500"
                    }`}
                  >
                    {dTab.label}
                  </button>
                ))}
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* TAB 1: CTC Structure breakdown */}
                {drawerTab === "structure" && (
                  <div className="space-y-4 text-xs">
                    <h3 className="font-black text-slate-800 uppercase tracking-wide">Breakdown Components</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2.5">
                        <p className="font-extrabold text-[#f97316] uppercase tracking-wider text-[10px]">Monthly Allowances</p>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between"><span>Basic Pay (50%):</span><span className="font-mono font-bold">₹{s.basic}</span></div>
                          <div className="flex justify-between"><span>HRA (20%):</span><span className="font-mono font-bold">₹{s.hra}</span></div>
                          <div className="flex justify-between"><span>DA (10%):</span><span className="font-mono font-bold">₹{s.da}</span></div>
                          <div className="flex justify-between"><span>Special Allowance:</span><span className="font-mono font-bold">₹{s.specialAllowance}</span></div>
                          <div className="flex justify-between"><span>Medical Allowance:</span><span className="font-mono font-bold">₹{s.medicalAllowance}</span></div>
                          <div className="flex justify-between"><span>Travel Allowance:</span><span className="font-mono font-bold">₹{s.travelAllowance}</span></div>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        <p className="font-extrabold text-indigo-600 uppercase tracking-wider text-[10px]">Monthly Deductions</p>
                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between"><span>Provident Fund (PF):</span><span className="font-mono font-bold text-red-500">₹{s.pf}</span></div>
                          <div className="flex justify-between"><span>ESIC Premium:</span><span className="font-mono font-bold text-red-500">₹{s.esi}</span></div>
                          <div className="flex justify-between"><span>Professional Tax:</span><span className="font-mono font-bold text-red-500">₹{s.profTax}</span></div>
                          <div className="flex justify-between"><span>TDS / Income Tax:</span><span className="font-mono font-bold text-red-500">₹{s.incomeTax}</span></div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 text-white p-4 rounded-2xl flex justify-between items-center font-mono">
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Consolidated Net Salary Outstanding</p>
                        <p className="text-xl font-black text-[#f97316]">₹{getNetSalary(s).toLocaleString()}</p>
                      </div>
                      <span className="bg-[#f97316]/20 border border-[#f97316]/40 px-3 py-1 rounded text-[10px] text-[#f97316] font-bold">COMPLIANT</span>
                    </div>
                  </div>
                )}

                {/* TAB 2: Payroll Payout History */}
                {drawerTab === "history" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase">Historic Released Payments</h3>
                    <div className="space-y-2">
                      {runs.filter(r => r.status === "Released").map(r => (
                        <div key={r.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex justify-between items-center text-xs font-mono">
                          <div>
                            <p className="font-bold text-slate-700 font-sans">{r.month} Cycle Payout</p>
                            <p className="text-[10px] text-slate-400">Processed: {new Date(r.processedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-emerald-600 font-bold">₹{getEmpTotalPayoutForMonth(selected360EmployeeId, r.month).toLocaleString()}</span>
                            <span className="block text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase mt-1">Released</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: Revisions */}
                {drawerTab === "revisions" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase">Hikes & Promotions Timeline</h3>
                    <div className="space-y-3">
                      {revisions.filter(rev => rev.userId === selected360EmployeeId).map(rev => (
                        <div key={rev.id} className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-xs space-y-2">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-800 font-black">{rev.type}</span>
                            <span className="text-emerald-600">₹{rev.previousSalary} → ₹{rev.newSalary}</span>
                          </div>
                          <p className="text-slate-500 font-medium">"{rev.notes}"</p>
                          <p className="text-[9px] text-slate-400">Logged on: {rev.revisionDate}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 4: Loans */}
                {drawerTab === "loans" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase">Advances Ledger</h3>
                    {loans.filter(l => l.userId === selected360EmployeeId).map(l => (
                      <div key={l.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 text-xs">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-700">{l.type} Disbursement</span>
                          <span className="font-mono text-[#f97316] font-bold">₹{l.outstanding} Outstanding</span>
                        </div>
                        <div className="space-y-2">
                          <p className="font-black text-[10px] text-slate-500 uppercase tracking-widest">Payment Recovery Ledger</p>
                          {l.history.map((h, hIdx) => (
                            <div key={hIdx} className="flex justify-between text-[10px] font-mono border-b border-slate-200/50 pb-1">
                              <span>{h.date} - {h.type}</span>
                              <span className="font-bold text-slate-700">₹{h.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 5: Bonuses */}
                {drawerTab === "bonus" && (
                  <div className="space-y-4 text-xs">
                    <h3 className="font-black text-slate-800 uppercase">Awarded Bonuses</h3>
                    {bonuses.filter(b => b.userId === selected360EmployeeId).map(b => (
                      <div key={b.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center font-mono">
                        <div>
                          <p className="font-bold text-slate-700 font-sans">{b.type}</p>
                          <p className="text-[10px] text-slate-400">{b.notes}</p>
                        </div>
                        <p className="font-bold text-emerald-600">₹{b.amount}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 6: Overtime */}
                {drawerTab === "overtime" && (
                  <div className="space-y-4 text-xs">
                    <h3 className="font-black text-slate-800 uppercase">Overtime Ledger</h3>
                    {overtimes.filter(ot => ot.userId === selected360EmployeeId).map(ot => (
                      <div key={ot.id} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center font-mono">
                        <div>
                          <p className="font-bold text-slate-700 font-sans">{ot.hours} Approved Hours</p>
                          <p className="text-[10px] text-slate-400">Rate: ₹{ot.rate}/Hr</p>
                        </div>
                        <p className="font-bold text-[#f97316]">₹{ot.hours * ot.rate}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 7: Payslip Portal */}
                {drawerTab === "payslips" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase">Download Monthly Payslip PDFs</h3>
                    <div className="space-y-3">
                      {["2026-06", "2026-07"].map(mStr => (
                        <div key={mStr} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-700">Salary Payslip ({mStr})</p>
                            <p className="text-[10px] text-slate-400 font-medium">EPF, Income Tax Fully Complied</p>
                          </div>
                          <button
                            onClick={() => {
                              setViewingPayslipUser(emp);
                              setViewingPayslipMonth(mStr);
                            }}
                            className="bg-[#f97316] hover:bg-orange-600 text-white font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Payslip
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 8: Timeline */}
                {drawerTab === "timeline" && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase">Employment Financial Timeline</h3>
                    <div className="border-l-2 border-[#f97316] ml-2 pl-4 space-y-4 text-xs text-left">
                      <div className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-[#f97316] rounded-full"></span>
                        <p className="font-bold text-slate-800">UAN Activated & PF Complied</p>
                        <p className="text-[10px] text-slate-400">Date: 2026-06-01</p>
                      </div>
                      <div className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-[#f97316] rounded-full"></span>
                        <p className="font-bold text-slate-800">Initial Employment Setup</p>
                        <p className="text-[10px] text-slate-400">CTC initialized at ₹{emp?.salaryBase || 30000}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        );
      })()}

      {/* -------------------------------------------------------------
          PAYSLIP LIGHTBOX MODAL DIALOG
          ------------------------------------------------------------- */}
      {viewingPayslipUser && (() => {
        const s = getEmployeeStructure(viewingPayslipUser.id);
        const gross = getGrossSalary(s);
        const deduct = getTotalDeductions(s);
        const net = getNetSalary(s);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-300 shadow-2xl p-6 space-y-6">
              
              {/* Close and prints */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <span className="text-xs font-black uppercase text-[#f97316]">Professional Salary Slip Register</span>
                <div className="flex gap-2">
                  <button onClick={() => window.print()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer">
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button onClick={() => notify("Payslip PDF compiled & sent to local Downloads directory.")} className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer">
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button onClick={() => setViewingPayslipUser(null)} className="text-slate-400 hover:text-slate-700 font-bold ml-2">✕</button>
                </div>
              </div>

              {/* Company Logo placeholder */}
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 bg-slate-950 text-white px-2.5 py-1 rounded-lg font-black text-xs w-fit">
                    <Receipt className="w-4 h-4 text-[#f97316]" /> HubSphere
                  </div>
                  <h2 className="text-xs font-extrabold text-slate-500 uppercase">HubSphere Technologies Private Limited</h2>
                  <p className="text-[10px] text-slate-400">Building 4, Sector 62, Noida, Uttar Pradesh - 201301</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-slate-900 text-sm">Payslip for {viewingPayslipMonth}</p>
                  <p className="text-[10px] text-slate-400">Payment Status: <span className="text-emerald-600 font-extrabold uppercase">PAID</span></p>
                </div>
              </div>

              {/* Employee Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-150 p-4 rounded-2xl text-[11px] text-slate-600">
                <div className="space-y-1">
                  <p>Employee Name: <span className="font-bold text-slate-800">{viewingPayslipUser.name}</span></p>
                  <p>Designation Position: <span className="font-bold text-slate-800">{viewingPayslipUser.position || "Staff"}</span></p>
                  <p>Department: <span className="font-bold text-slate-800">{viewingPayslipUser.department || "General"}</span></p>
                  <p>PF UAN: <span className="font-mono font-bold text-slate-800">10094050204</span></p>
                </div>
                <div className="space-y-1 text-right">
                  <p>Joining Date: <span className="font-bold text-slate-800">{viewingPayslipUser.joiningDate || "01-01-2026"}</span></p>
                  <p>Bank Name: <span className="font-bold text-slate-800">ICICI Bank</span></p>
                  <p>Account Number: <span className="font-mono font-bold text-slate-800">*****2039485</span></p>
                  <p>PAN Code: <span className="font-mono font-bold text-slate-800">ABCDE1234F</span></p>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-[10px]">Earnings & Allowances</h4>
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr className="py-2 flex justify-between"><span>Basic Salary</span><span className="font-mono">₹{s.basic}</span></tr>
                      <tr className="py-2 flex justify-between"><span>HRA Allowance</span><span className="font-mono">₹{s.hra}</span></tr>
                      <tr className="py-2 flex justify-between"><span>Dearness Allowance (DA)</span><span className="font-mono">₹{s.da}</span></tr>
                      <tr className="py-2 flex justify-between"><span>Medical Allowance</span><span className="font-mono">₹{s.medicalAllowance}</span></tr>
                      <tr className="py-2 flex justify-between"><span>Travel Conveyance</span><span className="font-mono">₹{s.travelAllowance}</span></tr>
                      <tr className="py-2 flex justify-between border-t border-slate-200 font-extrabold pt-2"><span>Gross Earnings</span><span className="font-mono">₹{gross}</span></tr>
                    </tbody>
                  </table>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-indigo-600 uppercase tracking-wider text-[10px]">Statutory Deductions</h4>
                  <table className="w-full">
                    <tbody className="divide-y divide-slate-100 font-medium">
                      <tr className="py-2 flex justify-between"><span>Provident Fund (PF)</span><span className="font-mono text-red-500">₹{s.pf}</span></tr>
                      <tr className="py-2 flex justify-between"><span>ESIC Contribution</span><span className="font-mono text-red-500">₹{s.esi}</span></tr>
                      <tr className="py-2 flex justify-between"><span>Professional Tax</span><span className="font-mono text-red-500">₹{s.profTax}</span></tr>
                      <tr className="py-2 flex justify-between"><span>TDS / Income Tax</span><span className="font-mono text-red-500">₹{s.incomeTax}</span></tr>
                      <tr className="py-2 flex justify-between"><span>Other Deductions</span><span className="font-mono text-red-500">₹{s.otherDeductions}</span></tr>
                      <tr className="py-2 flex justify-between border-t border-slate-200 font-extrabold pt-2"><span>Total Deductions</span><span className="font-mono">₹{deduct}</span></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Net Payout Summary with QR Code Placeholder */}
              <div className="border-t border-slate-200 pt-4 flex justify-between items-center bg-slate-950 text-white p-5 rounded-2xl">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Net Payable Bank Transfer Amount</span>
                  <h3 className="text-2xl font-black text-[#f97316] font-mono">₹{net.toLocaleString()}</h3>
                  <p className="text-[9px] text-slate-300 italic mt-0.5">In Words: Rupees {net.toLocaleString('en-IN')} Only</p>
                </div>

                {/* QR Placeholder */}
                <div className="bg-white p-2 rounded-xl border border-slate-200 shrink-0">
                  <div className="w-16 h-16 bg-slate-100 border-2 border-slate-300 flex flex-col items-center justify-center font-bold text-[8px] text-slate-400 text-center uppercase tracking-wide">
                    <span>Verified</span>
                    <span>QR Code</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
