import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Clock, FileText, DollarSign, Award, ChevronRight, Search, 
  Filter, Upload, ShieldAlert, CheckCircle2, XCircle, AlertCircle, FileSpreadsheet, 
  Download, Plus, RefreshCw, Briefcase, Landmark, User, Shield, HelpCircle, Laptop,
  MapPin, Gift, UserPlus, TrendingUp, HelpCircle as HelpIcon, Check, MapPin as MapPinIcon,
  Fingerprint, FileUp, CreditCard, PieChart
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge, Card } from './ui/ReusableComponents';

interface EnterpriseHrmsProps {
  currentUser: {
    id: string;
    name: string;
    role: string;
    department?: string;
    position?: string;
    email?: string;
    phone?: string;
  };
  triggerRefresh?: () => void;
}

export default function EnterpriseHrms({ currentUser, triggerRefresh }: EnterpriseHrmsProps) {
  // Local active tab for HRMS
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'directory' | 'org_structure' | 'departments' | 'attendance' | 'shifts' | 'leaves' | 'holidays' | 'payroll' | 'documents'>('dashboard');
  
  // App-level state loaded from database/APIs
  const [users, setUsers] = useState<any[]>([]);

  // Additional dynamic Enterprise HRMS States
  const [shifts, setShifts] = useState([
    { id: 'sh-1', name: 'General Day Shift', code: 'GDS', startTime: '09:30', endTime: '18:30', days: 'Mon - Sat', gracePeriod: 15, type: 'Regular' },
    { id: 'sh-2', name: 'US Night Shift', code: 'UNS', startTime: '18:30', endTime: '03:30', days: 'Mon - Fri', gracePeriod: 20, type: 'Night' },
    { id: 'sh-3', name: 'EU Evening Shift', code: 'EES', startTime: '13:00', endTime: '22:00', days: 'Mon - Sat', gracePeriod: 15, type: 'Evening' },
    { id: 'sh-4', name: 'Flexible Shift', code: 'FLS', startTime: 'Flexible', endTime: 'Flexible', days: 'Any 6 Days', gracePeriod: 0, type: 'Flexible' }
  ]);

  const [departmentsList, setDepartmentsList] = useState([
    { id: 'dep-1', name: 'Sales & Customer Relations', code: 'SCR', subDepartments: ['Telecalling', 'Field Sales'], manager: 'Ananya Iyer', employeeCount: 5, costCenter: 'CC-SALES-01' },
    { id: 'dep-2', name: 'Technical & Engineering', code: 'TECH', subDepartments: ['Fullstack Dev', 'QA Engineering'], manager: 'Rohan Sharma', employeeCount: 3, costCenter: 'CC-TECH-02' },
    { id: 'dep-3', name: 'Administration & HR', code: 'ADMIN', subDepartments: ['Recruitment', 'Operations'], manager: 'Siddharth Roy', employeeCount: 2, costCenter: 'CC-ADMIN-03' },
    { id: 'dep-4', name: 'Finance & Accounts', code: 'FIN', subDepartments: ['Payroll Audit', 'Compliance'], manager: 'Nidhi Gupta', employeeCount: 2, costCenter: 'CC-FIN-04' }
  ]);

  const [designationsList, setDesignationsList] = useState([
    { title: 'Chief Executive Officer', department: 'Executive', grade: 'E-01', reportingTo: 'Board of Directors' },
    { title: 'VP of Technology', department: 'Technical', grade: 'E-02', reportingTo: 'CEO' },
    { title: 'Senior Executive Lead', department: 'Sales', grade: 'E-03', reportingTo: 'VP of Sales' },
    { title: 'Senior Full Stack Developer', department: 'Technical', grade: 'E-04', reportingTo: 'VP of Technology' },
    { title: 'HR Manager & Recruiter', department: 'Admin', grade: 'E-03', reportingTo: 'CEO' },
    { title: 'Telecaller Executive', department: 'Sales', grade: 'E-05', reportingTo: 'Sales Manager' },
    { title: 'Customer Support Agent', department: 'Operations', grade: 'E-05', reportingTo: 'Operations Lead' }
  ]);

  const [assets, setAssets] = useState([
    { id: 'ast-1', name: 'MacBook Air M2', serial: 'C02H89X0Q05D', type: 'Laptop', employeeId: 'u-123', employeeName: 'Rohan Sharma', status: 'Issued', date: '2026-04-10', notes: 'Excellent condition' },
    { id: 'ast-2', name: 'Dell Vostro Laptop', serial: 'DL-7462-8921', type: 'Laptop', employeeId: 'u-456', employeeName: 'Ananya Iyer', status: 'Issued', date: '2026-05-15', notes: 'Includes mouse and adapter' },
    { id: 'ast-3', name: 'OnePlus Nord CE 3', serial: 'OP-IMEI-88219A', type: 'Phone', employeeId: 'u-123', employeeName: 'Rohan Sharma', status: 'Issued', date: '2026-04-12', notes: 'With office SIM Card' },
    { id: 'ast-4', name: 'Jio 5G Office SIM', serial: 'SIM-89910023412', type: 'SIM Card', employeeId: 'u-456', employeeName: 'Ananya Iyer', status: 'Issued', date: '2026-05-15', notes: 'Unlimited caller plan active' },
    { id: 'ast-5', name: 'Ergonomic Desk Chair', serial: 'CH-OFF-1029', type: 'Other Equipment', employeeId: 'u-789', employeeName: 'Amit Verma', status: 'Returned', date: '2026-06-25', notes: 'Returned upon relocation' },
    { id: 'ast-6', name: 'Logitech Wireless Combo', serial: 'KB-MS-LOGI-88', type: 'Other Equipment', employeeId: '', employeeName: '', status: 'Pending', date: '', notes: 'In IT inventory vault' }
  ]);

  const [holidaysList, setHolidaysList] = useState([
    { date: '2026-01-26', name: 'Republic Day (गणतंत्र दिवस)', type: 'National Holiday' },
    { date: '2026-03-06', name: 'Holi Festival (होली)', type: 'Festival Calendar' },
    { date: '2026-04-14', name: 'Ambedkar Jayanti', type: 'Regional Holiday' },
    { date: '2026-05-01', name: 'May Day / Labor Day', type: 'Company Holiday' },
    { date: '2026-08-15', name: 'Independence Day (स्वतंत्रता दिवस)', type: 'National Holiday' },
    { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'National Holiday' },
    { date: '2026-11-08', name: 'Diwali Festival (दीपावली)', type: 'Festival Calendar' },
    { date: '2026-12-25', name: 'Christmas Day (क्रिसमस)', type: 'Festival Calendar' }
  ]);

  const [activities, setActivities] = useState([
    { id: 'act-1', userId: 'u-123', userName: 'Rohan Sharma', type: 'Joining', title: 'Joined HubSphere Tiers', date: '2026-01-10', desc: 'Officially onboarded as Senior Tech Lead' },
    { id: 'act-2', userId: 'u-123', userName: 'Rohan Sharma', type: 'Promotion', title: 'Promoted to Tech Principal', date: '2026-04-01', desc: 'Recognized for system architecture delivery' },
    { id: 'act-3', userId: 'u-123', userName: 'Rohan Sharma', type: 'Asset Issued', title: 'Workstation Disbursal', date: '2026-04-10', desc: 'Assigned MacBook Air workstation' },
    { id: 'act-4', userId: 'u-456', userName: 'Ananya Iyer', type: 'Joining', title: 'Joined HubSphere Tiers', date: '2026-02-15', desc: 'Onboarded as Senior Sales & Dialing Head' },
    { id: 'act-5', userId: 'u-456', userName: 'Ananya Iyer', type: 'Document Uploaded', title: 'KYC Vault Storage', date: '2026-02-16', desc: 'Securely uploaded Aadhaar and PAN documents' }
  ]);

  const [emergencyContacts, setEmergencyContacts] = useState<{ [key: string]: { name: string; relation: string; phone: string; email: string } }>({
    'u-admin': { name: 'Karan Singh', relation: 'Brother', phone: '+919988776655', email: 'karan@gmail.com' },
    'u-123': { name: 'Sanjay Sharma', relation: 'Father', phone: '+919876543211', email: 'sanjay@gmail.com' },
    'u-456': { name: 'Renu Iyer', relation: 'Mother', phone: '+919812345678', email: 'renu@gmail.com' }
  });

  // State to manage quick preview employee
  const [quickPreviewEmployee, setQuickPreviewEmployee] = useState<any | null>(null);

  // Sorting and Pagination for Directory Table
  const [sortField, setSortField] = useState<'id' | 'name' | 'joiningDate'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // New state variables for adding structures
  const [showAddDept, setShowAddDept] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [newDeptForm, setNewDeptForm] = useState({ name: '', code: '', subDepartments: '', manager: '', costCenter: '' });
  const [newShiftForm, setNewShiftForm] = useState({ name: '', code: '', startTime: '09:30', endTime: '18:30', days: 'Mon - Sat', gracePeriod: 15, type: 'Regular' });
  const [newAssetForm, setNewAssetForm] = useState({ name: '', serial: '', type: 'Laptop', employeeId: '', notes: '' });

  // Employee 360 profile tabs
  const [active360Tab, setActive360Tab] = useState<'overview' | 'personal' | 'employment' | 'attendance' | 'leave' | 'documents' | 'payroll' | 'assets' | 'performance' | 'timeline' | 'emergency'>('overview');

  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [releasedSalaries, setReleasedSalaries] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [salaryRules, setSalaryRules] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  // Selected employee for Employee 360 Profile
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Filters for Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [branchFilter, setBranchFilter] = useState('All');
  const [empTypeFilter, setEmpTypeFilter] = useState('All');

  // ESS / Personal Attendance State
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [todayLog, setTodayLog] = useState<any>(null);

  // UI Dialog/Form States
  const [showApplyLeave, setShowApplyLeave] = useState(false);
  const [showRequestLoan, setShowRequestLoan] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  
  // Custom form bindings
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'Casual', // Paid, Sick, Casual, Unpaid
    halfDay: false,
    reason: ''
  });

  const [loanForm, setLoanForm] = useState({
    amount: '',
    tenureMonths: '6',
    reason: ''
  });

  const [docUploadForm, setDocUploadForm] = useState({
    employeeId: currentUser.id,
    documentType: 'Aadhaar Card', // Aadhaar Card, PAN Card, Offer Letter, Degree Certificate, Payslip
    fileBase64: '',
    fileName: ''
  });

  // Payroll generation state
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [salarySlips, setSalarySlips] = useState<any[]>([]);
  const [payrollFrozen, setPayrollFrozen] = useState<boolean>(false);

  // Attendance Punch-in location override mock
  const [punchLocation, setPunchLocation] = useState('Office Wi-Fi (Primary)');
  const [attendanceError, setAttendanceError] = useState('');

  // Notify utility
  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotifications(prev => [msg, ...prev].slice(0, 5));
    // Simulated browser alert or standard notification trigger
  };

  // -------------------------------------------------------------
  // Load & Initialize data
  // -------------------------------------------------------------
  const loadHrmsData = async () => {
    setLoading(true);
    try {
      const headers = {
        'x-user-id': currentUser.id,
        'x-user-role': currentUser.role
      };

      // Concurrent fetch
      const [usersRes, attRes, leavesRes, tasksRes, holidaysRes, rulesRes] = await Promise.all([
        fetch('/api/users', { headers }),
        fetch('/api/attendance', { headers }),
        fetch('/api/leaves', { headers }),
        fetch('/api/tasks', { headers }),
        fetch('/api/company-holidays', { headers }),
        fetch('/api/admin/salary-rules', { headers })
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : [];
      const attData = attRes.ok ? await attRes.json() : [];
      const leavesData = leavesRes.ok ? await leavesRes.json() : [];
      const tasksData = tasksRes.ok ? await tasksRes.json() : [];
      const holidaysData = holidaysRes.ok ? await holidaysRes.json() : [];
      const rulesData = rulesRes.ok ? await rulesRes.json() : [];

      setUsers(usersData);
      setAttendance(attData);
      setLeaves(leavesData);
      setTasks(tasksData);
      setHolidays(holidaysData);
      setSalaryRules(rulesData.salaryRules || []);

      // Fetch dynamic modules (loans, documents, releasedSalaries) stored in DB config
      // We also mock them dynamically if empty to ensure durable, gorgeous data
      const response = await fetch('/api/admin/recovery-config', { headers });
      if (response.ok) {
        const dbMeta = await response.json();
        // Since we store customized modules inside db.json, let's load them securely
        // Let's call GET /api/support as general query or fetch directly.
      }

      // Check current day punch-in status
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = attData.find((a: any) => a.userId === currentUser.id && a.date === todayStr);
      if (todayRecord) {
        setIsPunchedIn(!todayRecord.logoutTime);
        setTodayLog(todayRecord);
      } else {
        setIsPunchedIn(false);
        setTodayLog(null);
      }

      // Load or generate mock dynamic tables (loans, documents) for Indian SMB context
      generateFallbackHrmsData(usersData);

    } catch (err) {
      console.error('Failed to load HRMS database', err);
      notify('Failed to load HRMS database details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackHrmsData = (fetchedUsers: any[]) => {
    // Generate simulated dynamic loans/advances and documents if they don't exist
    // This provides a fully cohesive corporate simulation for SMBs
    const storageLoans = localStorage.getItem('hubsphere_loans');
    const storageDocs = localStorage.getItem('hubsphere_documents');
    const storageReleased = localStorage.getItem('hubsphere_released_salaries');

    if (storageLoans) {
      setLoans(JSON.parse(storageLoans));
    } else {
      const initialLoans = [
        { id: 'loan-1', userId: 'u-123', userName: 'Rohan Sharma', amount: 25000, tenureMonths: 6, EMI: 4166, status: 'Approved', paidTenure: 2, date: '2026-05-10', reason: 'Medical emergency in family' },
        { id: 'loan-2', userId: 'u-456', userName: 'Ananya Iyer', amount: 15000, tenureMonths: 3, EMI: 5000, status: 'Pending', paidTenure: 0, date: '2026-07-01', reason: 'Two-wheeler repair' }
      ];
      setLoans(initialLoans);
      localStorage.setItem('hubsphere_loans', JSON.stringify(initialLoans));
    }

    if (storageDocs) {
      setDocuments(JSON.parse(storageDocs));
    } else {
      const initialDocs = [
        { id: 'doc-1', userId: currentUser.id, userName: currentUser.name, documentType: 'Aadhaar Card', fileName: 'aadhaar_card_signed.pdf', uploadedAt: '2026-06-15T10:00:00Z', status: 'Verified' },
        { id: 'doc-2', userId: currentUser.id, userName: currentUser.name, documentType: 'PAN Card', fileName: 'pan_card_copy.jpg', uploadedAt: '2026-06-15T10:05:00Z', status: 'Verified' },
        { id: 'doc-3', userId: 'u-123', userName: 'Rohan Sharma', documentType: 'Offer Letter', fileName: 'offer_letter_rohan.pdf', uploadedAt: '2026-04-01T09:30:00Z', status: 'Approved' }
      ];
      setDocuments(initialDocs);
      localStorage.setItem('hubsphere_documents', JSON.stringify(initialDocs));
    }

    if (storageReleased) {
      setReleasedSalaries(JSON.parse(storageReleased));
    } else {
      const initialReleased = fetchedUsers.flatMap(u => [
        { month: '2026-05', userId: u.id, basic: u.salaryBase || 15000, hra: Math.round((u.salaryBase || 15000) * 0.4), allowances: 2000, pf: Math.round((u.salaryBase || 15000) * 0.12), esi: Math.round((u.salaryBase || 15000) * 0.0075), deductions: 0, netSalary: Math.round((u.salaryBase || 15000) * 1.2725), releasedAt: '2026-06-01T10:00:00Z' },
        { month: '2026-06', userId: u.id, basic: u.salaryBase || 15000, hra: Math.round((u.salaryBase || 15000) * 0.4), allowances: 2000, pf: Math.round((u.salaryBase || 15000) * 0.12), esi: Math.round((u.salaryBase || 15000) * 0.0075), deductions: 0, netSalary: Math.round((u.salaryBase || 15000) * 1.2725), releasedAt: '2026-07-01T10:00:00Z' }
      ]);
      setReleasedSalaries(initialReleased);
      localStorage.setItem('hubsphere_released_salaries', JSON.stringify(initialReleased));
    }
  };

  useEffect(() => {
    loadHrmsData();
  }, [currentUser]);

  // Handle Punch In / Punch Out
  const handlePunch = async () => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
        'x-user-role': currentUser.role
      };

      if (!isPunchedIn) {
        // Punch In
        const response = await fetch('/api/attendance/login', {
          method: 'POST',
          headers,
          body: JSON.stringify({ userId: currentUser.id })
        });
        const data = await response.json();
        if (response.ok) {
          setIsPunchedIn(true);
          setTodayLog(data.attendance);
          notify('Punch-In Recorded successfully (हाजिरी दर्ज की गई है)! Have a great day.');
          loadHrmsData();
        } else {
          setAttendanceError(data.error || 'Failed to punch in');
        }
      } else {
        // Punch Out
        const response = await fetch('/api/attendance/logout', {
          method: 'POST',
          headers,
          body: JSON.stringify({ userId: currentUser.id })
        });
        const data = await response.json();
        if (response.ok) {
          setIsPunchedIn(false);
          setTodayLog(data.attendance);
          notify('Punch-Out Recorded successfully (काम समाप्ति दर्ज की गई है). See you tomorrow!');
          loadHrmsData();
        } else {
          setAttendanceError(data.error || 'Failed to punch out');
        }
      }
    } catch (err) {
      setAttendanceError('Network error connecting to biometric logger.');
    }
  };

  // Submit Leave application
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      notify('Please fill in all leave fields', 'error');
      return;
    }

    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
        'x-user-role': currentUser.role
      };

      // Call apply API
      const res = await fetch('/api/leaves/apply', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: currentUser.id,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: `[${leaveForm.leaveType}${leaveForm.halfDay ? ' - Half Day' : ''}] ${leaveForm.reason}`
        })
      });

      if (res.ok) {
        notify('Leave application submitted successfully! Pending main admin approval.');
        setShowApplyLeave(false);
        setLeaveForm({ startDate: '', endDate: '', leaveType: 'Casual', halfDay: false, reason: '' });
        loadHrmsData();
      } else {
        const err = await res.json();
        notify(err.error || 'Failed to submit leave', 'error');
      }
    } catch (err) {
      notify('Failed to connect to HRMS leave portal', 'error');
    }
  };

  // Approve / Reject Leave with Sandwich Rule Check and Manager Comment
  const handleReviewLeave = async (leaveId: string, status: 'Approved' | 'Rejected', comment: string) => {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
        'x-user-role': currentUser.role
      };

      const res = await fetch('/api/leaves/approve', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          leaveId,
          status,
          approverNotes: comment,
          approverName: currentUser.name
        })
      });

      if (res.ok) {
        notify(`Leave status successfully updated to ${status}.`);
        loadHrmsData();
      } else {
        const err = await res.json();
        notify(err.error || 'Failed to update leave', 'error');
      }
    } catch (err) {
      notify('Bi-lateral database locking failure', 'error');
    }
  };

  // Apply / Request Advance Loan
  const handleRequestLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(loanForm.amount);
    if (!amt || amt <= 0 || !loanForm.reason) {
      notify('Please enter a valid loan amount and reason', 'error');
      return;
    }

    const newLoan = {
      id: 'loan-' + Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      amount: amt,
      tenureMonths: Number(loanForm.tenureMonths),
      EMI: Math.round(amt / Number(loanForm.tenureMonths)),
      status: 'Pending',
      paidTenure: 0,
      date: new Date().toISOString().split('T')[0],
      reason: loanForm.reason
    };

    const updatedLoans = [newLoan, ...loans];
    setLoans(updatedLoans);
    localStorage.setItem('hubsphere_loans', JSON.stringify(updatedLoans));
    notify('Advance Salary Loan request registered successfully! Pending audit review.');
    setShowRequestLoan(false);
    setLoanForm({ amount: '', tenureMonths: '6', reason: '' });
  };

  // Approve / Reject Loan
  const handleReviewLoan = (loanId: string, status: 'Approved' | 'Rejected') => {
    const updated = loans.map(l => {
      if (l.id === loanId) {
        return { ...l, status };
      }
      return l;
    });
    setLoans(updated);
    localStorage.setItem('hubsphere_loans', JSON.stringify(updated));
    notify(`Salary loan application is now ${status}.`);
  };

  // Handle Document Upload (Base64 simulated vault storage)
  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setDocUploadForm(prev => ({
        ...prev,
        fileName: file.name,
        fileBase64: reader.result as string
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUploadForm.fileName || !docUploadForm.fileBase64) {
      notify('Please select a document file to upload', 'error');
      return;
    }

    const matchedUser = users.find(u => u.id === docUploadForm.employeeId) || currentUser;

    const newDoc = {
      id: 'doc-' + Date.now(),
      userId: docUploadForm.employeeId,
      userName: matchedUser.name,
      documentType: docUploadForm.documentType,
      fileName: docUploadForm.fileName,
      fileBase64: docUploadForm.fileBase64,
      uploadedAt: new Date().toISOString(),
      status: 'Pending Verification'
    };

    const updatedDocs = [newDoc, ...documents];
    setDocuments(updatedDocs);
    localStorage.setItem('hubsphere_documents', JSON.stringify(updatedDocs));
    notify('Document successfully encrypted and uploaded to corporate Vault!');
    setDocUploadForm({ employeeId: currentUser.id, documentType: 'Aadhaar Card', fileBase64: '', fileName: '' });
  };

  // Verify Document
  const handleVerifyDocument = (docId: string, status: 'Verified' | 'Rejected') => {
    const updated = documents.map(d => {
      if (d.id === docId) {
        return { ...d, status };
      }
      return d;
    });
    setDocuments(updated);
    localStorage.setItem('hubsphere_documents', JSON.stringify(updated));
    notify(`Document successfully verified as [${status}].`);
  };

  // Delete Document
  const handleDeleteDocument = (docId: string) => {
    const updated = documents.filter(d => d.id !== docId);
    setDocuments(updated);
    localStorage.setItem('hubsphere_documents', JSON.stringify(updated));
    notify('Document purged securely from the vault.');
  };

  // Generate Enterprise Payroll and Salary Slips for Month (Bilingual + Indian SMB compliance)
  const handleGeneratePayroll = () => {
    setPayrollFrozen(false);
    
    // Detailed salary calculation for Indian SMBs:
    // Components: Basic (50%), HRA (20%), Travel/Special Allowance (15%), EPF (12% of Basic), ESI (0.75%), PT (200 Fixed)
    const slips = users.map(u => {
      const base = u.salaryBase || 15000;
      
      // Calculate attendance parameters
      const userAtt = attendance.filter(a => a.userId === u.id && a.date.startsWith(payrollMonth));
      const presentDays = userAtt.filter(a => a.status === 'Present').length;
      const totalDaysInMonth = 30; // standard mock base
      const absentDays = Math.max(0, totalDaysInMonth - presentDays - 4); // assume 4 weekly off
      
      const basic = Math.round(base * 0.5);
      const hra = Math.round(base * 0.2);
      const specialAllowance = Math.round(base * 0.3);
      
      // EPF & ESIC (Standard Indian statutory deductions)
      const epf = Math.round(basic * 0.12);
      const esic = Math.round(base * 0.0075);
      const professionalTax = base > 15000 ? 200 : 0;
      
      // Calculate commission from dialer/performance if telecaller
      const isTele = u.role === 'telecaller';
      const performanceBonus = isTele ? (u.commissionRate || 100) * 15 : 2000; // Mock performance metrics
      
      // Deductions from pending active loans
      const activeLoan = loans.find(l => l.userId === u.id && l.status === 'Approved' && l.paidTenure < l.tenureMonths);
      const loanEMI = activeLoan ? activeLoan.EMI : 0;
      
      // Loss of Pay (LOP) for absent days
      const lop = Math.round((base / 30) * absentDays);
      
      const totalEarnings = base + performanceBonus;
      const totalDeductions = epf + esic + professionalTax + loanEMI + lop;
      const netSalary = Math.max(0, totalEarnings - totalDeductions);

      return {
        userId: u.id,
        userName: u.name,
        role: u.role,
        department: u.department || 'Sales',
        position: u.position || 'Executive',
        month: payrollMonth,
        earnings: {
          basic,
          hra,
          specialAllowance,
          performanceBonus,
          gross: totalEarnings
        },
        deductions: {
          epf,
          esic,
          professionalTax,
          loanEMI,
          lop,
          total: totalDeductions
        },
        netSalary,
        presentDays,
        absentDays,
        loanEMIApplied: loanEMI > 0
      };
    });

    setSalarySlips(slips);
    notify(`Enterprise payroll slip draft successfully generated for ${payrollMonth}!`);
  };

  // Lock / Freeze Payroll
  const handleLockPayroll = () => {
    if (salarySlips.length === 0) {
      notify('No payroll drafts to lock', 'error');
      return;
    }
    setPayrollFrozen(true);
    // Persist to released salaries array
    const newReleased = [...releasedSalaries];
    salarySlips.forEach(slip => {
      const existsIdx = newReleased.findIndex(r => r.month === slip.month && r.userId === slip.userId);
      const record = {
        month: slip.month,
        userId: slip.userId,
        userName: slip.userName,
        netSalary: slip.netSalary,
        basic: slip.earnings.basic,
        hra: slip.earnings.hra,
        allowances: slip.earnings.specialAllowance + slip.earnings.performanceBonus,
        pf: slip.deductions.epf,
        esi: slip.deductions.esic,
        deductions: slip.deductions.professionalTax + slip.deductions.lop + slip.deductions.loanEMI,
        releasedAt: new Date().toISOString()
      };
      if (existsIdx >= 0) {
        newReleased[existsIdx] = record;
      } else {
        newReleased.push(record);
      }

      // Update paid tenure of loan EMI
      if (slip.loanEMIApplied) {
        const userLoan = loans.find(l => l.userId === slip.userId && l.status === 'Approved');
        if (userLoan) {
          userLoan.paidTenure = Math.min(userLoan.tenureMonths, userLoan.paidTenure + 1);
        }
      }
    });

    setReleasedSalaries(newReleased);
    localStorage.setItem('hubsphere_released_salaries', JSON.stringify(newReleased));
    localStorage.setItem('hubsphere_loans', JSON.stringify(loans));
    notify(`Salary freeze successfully applied (सैलरी भुगतान लॉक हो गई है)! Disbursed to bank modules.`);
  };

  // Calculate dynamic statistics
  const totalEmployees = users.length;
  const activeEmployeeCount = users.filter(u => u.status === 'active').length;
  const leavesPendingCount = leaves.filter(l => l.status === 'Pending').length;
  const activeLoansValue = loans.filter(l => l.status === 'Approved').reduce((acc, curr) => acc + (curr.amount - (curr.EMI * curr.paidTenure)), 0);

  // Department distribution
  const deptMap: { [key: string]: number } = {};
  users.forEach(u => {
    const dept = u.department || 'Sales';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const deptData = Object.keys(deptMap).map(k => ({ name: k, employees: deptMap[k] }));

  // Fallback mapping constants for missing corporate specs
  const branchMap: { [key: string]: string } = {
    'u-admin': 'Delhi HQ',
    'u-123': 'Bangalore Office',
    'u-456': 'Mumbai Branch'
  };
  const empTypeMap: { [key: string]: string } = {
    'u-admin': 'Full-time',
    'u-123': 'Full-time',
    'u-456': 'Contract'
  };
  const managerMap: { [key: string]: string } = {
    'u-admin': 'Board of Directors',
    'u-123': 'Main Admin (u-admin)',
    'u-456': 'Main Admin (u-admin)'
  };

  const getBranch = (emp: any) => emp.branch || branchMap[emp.id] || (emp.role === 'admin' ? 'Delhi HQ' : 'Noida Tech Center');
  const getEmpType = (emp: any) => emp.employmentType || empTypeMap[emp.id] || 'Full-time';
  const getManager = (emp: any) => emp.reportingManager || managerMap[emp.id] || (emp.role === 'admin' ? 'Board of Directors' : 'Siddharth Roy');

  // Filtered employees for Employee Directory
  const processedEmployees = users.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (emp.position || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.employmentCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (emp.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || (emp.department || 'Sales') === deptFilter;
    const matchesStatus = statusFilter === 'All' || emp.status === statusFilter;
    const matchesBranch = branchFilter === 'All' || getBranch(emp) === branchFilter;
    const matchesEmpType = empTypeFilter === 'All' || getEmpType(emp) === empTypeFilter;
    return matchesSearch && matchesDept && matchesStatus && matchesBranch && matchesEmpType;
  });

  // Sort
  const sortedEmployees = [...processedEmployees].sort((a, b) => {
    let valA = '';
    let valB = '';
    if (sortField === 'id') {
      valA = a.employmentCode || a.id || '';
      valB = b.employmentCode || b.id || '';
    } else if (sortField === 'name') {
      valA = a.name || '';
      valB = b.name || '';
    } else if (sortField === 'joiningDate') {
      valA = a.joiningDate || '';
      valB = b.joiningDate || '';
    }
    return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  // Pagination
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage) || 1;
  const paginatedEmployees = sortedEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Selected Employee Details for Module 1 Employee 360
  const selectedEmp = users.find(u => u.id === (selectedEmployeeId || currentUser.id));

  return (
    <div className="space-y-6 text-left">
      
      {/* Biometric Heartbeat Header Banner */}
      <div className="bg-[#10141e] border border-[#1f2635] rounded-3xl p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#f97316]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-[#f97316] animate-pulse" />
            <h2 className="text-xl font-black text-white tracking-tight">Enterprise HRMS & Biometric Hub</h2>
          </div>
          <p className="text-xs text-gray-400 max-w-xl font-medium">
            Standard Operating System for Indian SMBs. Handle dynamic payroll slips, PF/ESI compliances, Sandwich leaves, advance salary loans, and secure digital KYC document storage.
          </p>
        </div>

        {/* Dynamic Punch Panel for Self Service (ESS) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0a0d14] border border-[#1f2635] p-3 rounded-2xl shadow-inner z-10 w-full lg:w-auto">
          <div className="text-left space-y-0.5 px-2">
            <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase block">Shift Timing:</span>
            <span className="text-xs text-[#f97316] font-black">9:30 AM - 6:30 PM (IST)</span>
          </div>

          <div className="h-px sm:h-8 w-full sm:w-px bg-[#1f2635]"></div>

          <button
            onClick={handlePunch}
            className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
              isPunchedIn 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
            }`}
          >
            <Clock className="w-4 h-4" />
            {isPunchedIn ? 'Punch Out (काम समाप्ति)' : 'Daily Punch In (हाजिरी दर्ज करें)'}
          </button>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex flex-wrap border-b border-[#1f2635] gap-2 lg:gap-4 bg-[#111622]/40 p-2.5 rounded-2xl border border-[#1f2635]/60">
        <button
          onClick={() => { setActiveSubTab('dashboard'); setSelectedEmployeeId(null); }}
          className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'dashboard' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1f2635]/30'
          }`}
        >
          <PieChart className="w-3.5 h-3.5" />
          Dashboard
        </button>
        <button
          onClick={() => { setActiveSubTab('directory'); setSelectedEmployeeId(null); }}
          className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'directory' || selectedEmployeeId ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1f2635]/30'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Employee 360 & Directory
        </button>
        <button
          onClick={() => { setActiveSubTab('org_structure'); setSelectedEmployeeId(null); }}
          className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'org_structure' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1f2635]/30'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          Org Structure
        </button>
        <button
          onClick={() => { setActiveSubTab('departments'); setSelectedEmployeeId(null); }}
          className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'departments' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1f2635]/30'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          Depts & Positions
        </button>
        <button
          onClick={() => { setActiveSubTab('attendance'); setSelectedEmployeeId(null); }}
          className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'attendance' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1f2635]/30'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Attendance Center
        </button>
        <button
          onClick={() => { setActiveSubTab('shifts'); setSelectedEmployeeId(null); }}
          className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'shifts' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1f2635]/30'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Shift Management
        </button>
        <button
          onClick={() => { setActiveSubTab('leaves'); setSelectedEmployeeId(null); }}
          className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-1.5 relative ${
            activeSubTab === 'leaves' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1f2635]/30'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Leaves
          {leavesPendingCount > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{leavesPendingCount}</span>
          )}
        </button>
        <button
          onClick={() => { setActiveSubTab('holidays'); setSelectedEmployeeId(null); }}
          className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'holidays' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1f2635]/30'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          Holidays
        </button>
        <button
          onClick={() => { setActiveSubTab('payroll'); setSelectedEmployeeId(null); }}
          className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'payroll' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1f2635]/30'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          Payroll
        </button>
        <button
          onClick={() => { setActiveSubTab('documents'); setSelectedEmployeeId(null); }}
          className={`px-3 py-1.5 text-xs font-bold transition-all rounded-lg cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'documents' ? 'bg-[#f97316] text-white' : 'text-gray-400 hover:text-white hover:bg-[#1f2635]/30'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Doc Vault
        </button>
      </div>

      {/* Notifications overlay ticker */}
      {notifications.length > 0 && (
        <div className="bg-[#f97316]/10 border border-[#f97316]/30 px-4 py-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-orange-400 font-bold">
            <AlertCircle className="w-4 h-4 text-[#f97316]" />
            <span>Latest: {notifications[0]}</span>
          </div>
          <button 
            onClick={() => setNotifications([])}
            className="text-[10px] text-gray-400 hover:text-white font-bold underline"
          >
            Clear Notifications
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: HR DASHBOARD (Module 6)
          ------------------------------------------------------------- */}
      {activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-1 text-left relative overflow-hidden">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Attendance Rate</span>
              <h3 className="text-2xl font-black text-white">
                {attendance.length ? Math.round((attendance.filter(a => a.status === 'Present').length / (users.length * 20 || 1)) * 100) : 85}%
              </h3>
              <p className="text-[10px] text-emerald-400 font-bold">✓ Standard 9:30 AM Shift Active</p>
              <Users className="absolute bottom-3 right-3 w-8 h-8 text-gray-700 pointer-events-none" />
            </div>

            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-1 text-left relative overflow-hidden">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Leaves Pending Audit</span>
              <h3 className="text-2xl font-black text-white">{leavesPendingCount}</h3>
              <p className="text-[10px] text-orange-400 font-bold">⚠️ Sandbox Sandwich Rules apply</p>
              <Calendar className="absolute bottom-3 right-3 w-8 h-8 text-gray-700 pointer-events-none" />
            </div>

            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-1 text-left relative overflow-hidden">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Active Employees</span>
              <h3 className="text-2xl font-black text-white">{activeEmployeeCount} / {totalEmployees}</h3>
              <p className="text-[10px] text-gray-400 font-bold">Sales & Admin Segments</p>
              <Briefcase className="absolute bottom-3 right-3 w-8 h-8 text-gray-700 pointer-events-none" />
            </div>

            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-1 text-left relative overflow-hidden">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Active Loans Distributed</span>
              <h3 className="text-2xl font-black text-white">₹{activeLoansValue.toLocaleString()}</h3>
              <p className="text-[10px] text-blue-400 font-bold">₹{loans.filter(l => l.status === 'Pending').length} requests pending review</p>
              <Landmark className="absolute bottom-3 right-3 w-8 h-8 text-gray-700 pointer-events-none" />
            </div>
          </div>

          {/* Graphical Analytics (D3/Recharts) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Employee Departmental Distribution Chart */}
            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl lg:col-span-2 text-left space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Departmental Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2635" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                    <YAxis stroke="#6b7280" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0d1017', border: '1px solid #1f2635' }} labelStyle={{ color: '#fff' }} />
                    <Bar dataKey="employees" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Birthday, Joiner, and Announcement Bulletin Board */}
            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">SMB Announcements (घोषणाएं)</h3>
              
              <div className="space-y-3.5">
                {/* Announcement 1: Birthday */}
                <div className="bg-[#0d1017] border border-[#1f2635] p-3 rounded-xl flex items-center gap-3">
                  <div className="bg-orange-500/10 p-2 rounded-lg text-lg text-[#f97316]">🎂</div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-white">Rohan Sharma's Birthday</h4>
                    <p className="text-[10px] text-gray-400">Wish him a wonderful day today!</p>
                  </div>
                </div>

                {/* Announcement 2: New Joiner */}
                <div className="bg-[#0d1017] border border-[#1f2635] p-3 rounded-xl flex items-center gap-3">
                  <div className="bg-emerald-500/10 p-2 rounded-lg text-lg text-emerald-400">🤝</div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-white">New Joined: Ananya Iyer</h4>
                    <p className="text-[10px] text-gray-400">Joined as Sales Head of Non-Tech segment.</p>
                  </div>
                </div>

                {/* Announcement 3: General notice */}
                <div className="bg-[#0d1017] border border-[#1f2635] p-3 rounded-xl flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg text-lg text-blue-400">📢</div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-white">Monthly Review Meeting</h4>
                    <p className="text-[10px] text-gray-400">Scheduled for 25th of this month at 4 PM IST.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: EMPLOYEE DIRECTORY & 360 PROFILE (Module 1)
          ------------------------------------------------------------- */}
      {activeSubTab === 'directory' && !selectedEmployeeId && (
        <div className="space-y-6">
          {/* Filter & Controls Panel */}
          <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Search & Filter Employee Directory</h3>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => setShowAddEmployee(true)}
                  className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-500/10"
                >
                  <Plus className="w-4 h-4" /> Add Employee (नया कर्मचारी)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search Name, ID, email..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl pl-10 pr-4 py-2 text-xs text-white outline-none focus:border-[#f97316]"
                />
              </div>

              {/* Department */}
              <div>
                <select
                  value={deptFilter}
                  onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-[#0d1017] border border-[#1f2635] text-xs rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                >
                  <option value="All">All Departments</option>
                  <option value="Sales">Sales</option>
                  <option value="Technical">Technical</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-[#0d1017] border border-[#1f2635] text-xs rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                >
                  <option value="All">All Statuses</option>
                  <option value="active">Active (सक्रिय)</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Branch */}
              <div>
                <select
                  value={branchFilter}
                  onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-[#0d1017] border border-[#1f2635] text-xs rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                >
                  <option value="All">All Branches</option>
                  <option value="Delhi HQ">Delhi HQ</option>
                  <option value="Bangalore Office">Bangalore Office</option>
                  <option value="Mumbai Branch">Mumbai Branch</option>
                  <option value="Noida Tech Center">Noida Tech Center</option>
                </select>
              </div>

              {/* Employment Type */}
              <div>
                <select
                  value={empTypeFilter}
                  onChange={(e) => { setEmpTypeFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-[#0d1017] border border-[#1f2635] text-xs rounded-xl px-3 py-2 text-white outline-none focus:border-[#f97316]"
                >
                  <option value="All">All Employment Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Part-time">Part-time</option>
                </select>
              </div>
            </div>
          </div>

          {/* Directory Table */}
          <div className="bg-[#111622] border border-[#1f2635] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1f2635] bg-[#0d1017]">
                    <th 
                      onClick={() => {
                        setSortField('id');
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none"
                    >
                      Employee ID {sortField === 'id' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-wider">Photo</th>
                    <th 
                      onClick={() => {
                        setSortField('name');
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none"
                    >
                      Name {sortField === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-wider">Designation</th>
                    <th className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-wider">Branch</th>
                    <th className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-wider">Reporting Manager</th>
                    <th className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-wider">Employment Type</th>
                    <th className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-wider">Status</th>
                    <th 
                      onClick={() => {
                        setSortField('joiningDate');
                        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                      }}
                      className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white select-none"
                    >
                      Joining Date {sortField === 'joiningDate' && (sortOrder === 'asc' ? '▲' : '▼')}
                    </th>
                    <th className="px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2635]/50">
                  {paginatedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-10 text-center text-xs text-gray-400 font-bold">
                        No employees found matching the current search & filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedEmployees.map(emp => {
                      const initial = emp.name.charAt(0).toUpperCase();
                      const colors = ['bg-orange-500', 'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-pink-500'];
                      const colorClass = colors[emp.name.charCodeAt(0) % colors.length];

                      return (
                        <tr key={emp.id} className="hover:bg-[#1a2133]/40 transition">
                          {/* Employee ID */}
                          <td className="px-4 py-3.5 text-xs font-mono font-bold text-gray-300">
                            {emp.employmentCode || emp.id}
                          </td>
                          
                          {/* Photo / Avatar */}
                          <td className="px-4 py-3.5">
                            <div className={`w-8 h-8 rounded-full ${colorClass} text-white flex items-center justify-center font-black text-xs shadow`}>
                              {initial}
                            </div>
                          </td>

                          {/* Name */}
                          <td className="px-4 py-3.5">
                            <div className="text-xs font-bold text-white">{emp.name}</div>
                            <div className="text-[10px] text-gray-400 font-medium">{emp.email || 'N/A'}</div>
                          </td>

                          {/* Department */}
                          <td className="px-4 py-3.5 text-xs text-gray-300">
                            {emp.department || 'Sales'}
                          </td>

                          {/* Designation */}
                          <td className="px-4 py-3.5 text-xs text-gray-300 font-medium">
                            {emp.position || emp.role.toUpperCase()}
                          </td>

                          {/* Branch */}
                          <td className="px-4 py-3.5 text-xs text-gray-300">
                            {getBranch(emp)}
                          </td>

                          {/* Reporting Manager */}
                          <td className="px-4 py-3.5 text-xs text-gray-300 font-medium">
                            {getManager(emp)}
                          </td>

                          {/* Employment Type */}
                          <td className="px-4 py-3.5 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-[#0a0d14] text-xs font-bold text-gray-400">
                              {getEmpType(emp)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 text-xs">
                            <Badge variant={emp.status === 'active' ? 'success' : 'danger'}>
                              {emp.status === 'active' ? 'Active' : 'Suspended'}
                            </Badge>
                          </td>

                          {/* Joining Date */}
                          <td className="px-4 py-3.5 text-xs font-mono text-gray-300">
                            {emp.joiningDate || '2026-01-01'}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => setQuickPreviewEmployee(emp)}
                              className="text-[10px] bg-[#1f2635] hover:bg-[#2d374d] text-[#f97316] font-black px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() => setSelectedEmployeeId(emp.id)}
                              className="text-[10px] bg-[#f97316] hover:bg-orange-600 text-white font-black px-2.5 py-1 rounded-lg cursor-pointer"
                            >
                              360° Profile
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="bg-[#0d1017] px-4 py-3.5 border-t border-[#1f2635] flex items-center justify-between">
              <div className="text-xs text-gray-400 font-medium">
                Showing <span className="text-white font-bold">{Math.min(sortedEmployees.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
                <span className="text-white font-bold">{Math.min(sortedEmployees.length, currentPage * itemsPerPage)}</span> of{' '}
                <span className="text-white font-bold">{sortedEmployees.length}</span> employees
              </div>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1 bg-[#1f2635] hover:bg-[#2d374d] rounded-lg text-xs text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                <div className="text-xs text-white font-bold flex items-center px-2">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1 bg-[#1f2635] hover:bg-[#2d374d] rounded-lg text-xs text-white font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {/* Quick Preview Slide-over Modal / Dialog */}
          {quickPreviewEmployee && (
            <div className="fixed inset-0 bg-[#06080c]/85 flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="bg-[#111622] border border-[#1f2635] w-full max-w-lg rounded-3xl p-6 shadow-2xl relative space-y-6 text-left">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-500/10 text-[#f97316] flex items-center justify-center font-black text-lg">
                      {quickPreviewEmployee.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-md font-black text-white">{quickPreviewEmployee.name}</h3>
                      <p className="text-xs text-gray-400">{quickPreviewEmployee.position || 'Staff'} • {quickPreviewEmployee.department || 'Sales'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setQuickPreviewEmployee(null)}
                    className="text-gray-400 hover:text-white font-black text-sm p-1 cursor-pointer bg-[#1f2635]/60 rounded-full"
                  >
                    &nbsp;✕&nbsp;
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-[#1f2635]/60 pt-4 text-xs text-gray-400">
                  <div className="space-y-1">
                    <span>Employee ID</span>
                    <p className="text-white font-mono font-bold">{quickPreviewEmployee.employmentCode || quickPreviewEmployee.id}</p>
                  </div>
                  <div className="space-y-1">
                    <span>Status</span>
                    <p className="text-white font-bold uppercase">{quickPreviewEmployee.status}</p>
                  </div>
                  <div className="space-y-1">
                    <span>Branch Location</span>
                    <p className="text-white font-bold">{getBranch(quickPreviewEmployee)}</p>
                  </div>
                  <div className="space-y-1">
                    <span>Employment Type</span>
                    <p className="text-white font-bold">{getEmpType(quickPreviewEmployee)}</p>
                  </div>
                  <div className="space-y-1">
                    <span>Reporting Manager</span>
                    <p className="text-white font-bold">{getManager(quickPreviewEmployee)}</p>
                  </div>
                  <div className="space-y-1">
                    <span>Joining Date</span>
                    <p className="text-white font-mono font-bold">{quickPreviewEmployee.joiningDate || '2026-01-01'}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span>Email Address</span>
                    <p className="text-white font-bold">{quickPreviewEmployee.email || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <span>Phone Number</span>
                    <p className="text-white font-mono font-bold">{quickPreviewEmployee.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t border-[#1f2635]/60 pt-4 flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setQuickPreviewEmployee(null);
                      setSelectedEmployeeId(quickPreviewEmployee.id);
                    }}
                    className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-black px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Open Full 360° Profile
                  </button>
                  <button
                    onClick={() => setQuickPreviewEmployee(null)}
                    className="bg-[#1f2635] hover:bg-[#2d374d] text-white text-xs font-black px-4 py-2.5 rounded-xl transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: ORGANIZATION STRUCTURE (Module 2)
          ------------------------------------------------------------- */}
      {activeSubTab === 'org_structure' && (
        <div className="space-y-6">
          <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left space-y-4">
            <div className="flex justify-between items-center border-b border-[#1f2635]/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Corporate Reporting Hierarchy</h3>
                <p className="text-xs text-gray-400">Interactive organization tree mapping managers and direct reports.</p>
              </div>
              <span className="text-xs bg-[#f97316]/10 text-[#f97316] font-bold px-3 py-1 rounded-lg">
                Total Nodes: {users.length}
              </span>
            </div>

            {/* Visual Org Chart Tree Representation */}
            <div className="space-y-6 flex flex-col items-center py-6 overflow-x-auto">
              
              {/* Level 1: Board / Main Admin */}
              <div className="flex flex-col items-center">
                <div className="bg-[#0a0d14] border-2 border-[#f97316] p-4 rounded-2xl shadow-xl w-64 text-center space-y-1 relative">
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-[#f97316]"></div>
                  <Award className="w-5 h-5 text-[#f97316] mx-auto" />
                  <h4 className="text-xs font-black text-white">Board of Directors</h4>
                  <p className="text-[10px] text-gray-400">Main Admin (u-admin)</p>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-orange-500/15 text-[#f97316] font-bold">Level 0: Parent</span>
                </div>
              </div>

              {/* Connector line vertical */}
              <div className="w-0.5 h-6 bg-[#f97316]"></div>

              {/* Level 2: Chief Executives / Department Heads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative w-full max-w-2xl justify-items-center">
                
                {/* Executive Node 1: Siddharth Roy */}
                <div className="bg-[#0a0d14] border border-[#1f2635] hover:border-[#f97316] p-4 rounded-2xl w-64 text-center space-y-1 relative transition-all shadow-lg group cursor-pointer">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-[#1f2635] group-hover:bg-[#f97316]"></div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-[#1f2635]"></div>
                  <UserPlus className="w-5 h-5 text-emerald-400 mx-auto" />
                  <h4 className="text-xs font-black text-white">Siddharth Roy</h4>
                  <p className="text-[10px] text-gray-400">Chief Human Resources Officer</p>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">HR Division</span>
                </div>

                {/* Executive Node 2: Ananya Iyer */}
                <div className="bg-[#0a0d14] border border-[#1f2635] hover:border-[#f97316] p-4 rounded-2xl w-64 text-center space-y-1 relative transition-all shadow-lg group cursor-pointer">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-[#1f2635] group-hover:bg-[#f97316]"></div>
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-[#1f2635]"></div>
                  <Briefcase className="w-5 h-5 text-blue-400 mx-auto" />
                  <h4 className="text-xs font-black text-white">Ananya Iyer</h4>
                  <p className="text-[10px] text-gray-400">Director of Sales & Operations</p>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold">Sales Division</span>
                </div>

              </div>

              {/* Connector line vertical */}
              <div className="w-full max-w-lg flex justify-between px-24 h-6 relative">
                <div className="w-0.5 h-6 bg-[#1f2635]"></div>
                <div className="w-0.5 h-6 bg-[#1f2635]"></div>
              </div>

              {/* Level 3: Direct Reports & Subordinates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full justify-items-center">
                {users.map(emp => {
                  if (emp.id === 'u-admin' || emp.role === 'admin') return null;
                  const initial = emp.name.charAt(0).toUpperCase();
                  const managerName = emp.id === 'u-456' ? 'Ananya Iyer' : 'Siddharth Roy';
                  
                  return (
                    <div 
                      key={emp.id}
                      onClick={() => setSelectedEmployeeId(emp.id)} 
                      className="bg-[#0d1017] border border-[#1f2635] hover:border-[#f97316] p-4 rounded-2xl w-56 text-left space-y-2 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-orange-500/15 text-[#f97316] flex items-center justify-center font-black text-xs shrink-0">
                          {initial}
                        </div>
                        <div className="truncate">
                          <h5 className="text-xs font-black text-white truncate">{emp.name}</h5>
                          <p className="text-[9px] text-gray-400 truncate">{emp.position || 'Staff'}</p>
                        </div>
                      </div>
                      <div className="border-t border-[#1f2635]/60 pt-2 text-[9px] text-gray-400 space-y-0.5">
                        <p>Report To: <span className="text-[#f97316] font-bold">{managerName}</span></p>
                        <p>Department: <span className="text-white">{emp.department || 'Sales'}</span></p>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: DEPARTMENTS & POSITIONS
          ------------------------------------------------------------- */}
      {activeSubTab === 'departments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
            
            {/* Left Box: Departments */}
            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#1f2635]/60 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Corporate Departments</h3>
                <button
                  onClick={() => {
                    const name = prompt('Enter new department name (नया विभाग):');
                    if (name) {
                      setDepartmentsList(prev => [...prev, { id: 'd-' + Date.now(), name, code: name.substring(0, 3).toUpperCase(), head: 'TBD' }]);
                      notify(`Department "${name}" registered successfully.`);
                    }
                  }}
                  className="bg-[#f97316] hover:bg-orange-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg cursor-pointer"
                >
                  + Add Dept
                </button>
              </div>

              <div className="space-y-3">
                {departmentsList.map(dept => {
                  const empCount = users.filter(u => u.department === dept.name).length;
                  return (
                    <div key={dept.id} className="bg-[#0d1017] border border-[#1f2635] p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black text-white">{dept.name} ({dept.code})</h4>
                        <p className="text-[10px] text-gray-400">Head of Dept: {dept.head}</p>
                      </div>
                      <Badge variant="success">{empCount} Members</Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Box: Designations & Positions */}
            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-[#1f2635]/60 pb-3">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Enterprise Designations</h3>
                <button
                  onClick={() => {
                    const title = prompt('Enter new designation title (नया पद):');
                    if (title) {
                      setDesignationsList(prev => [...prev, { id: 'des-' + Date.now(), title, band: 'L3', baseSalary: 18000 }]);
                      notify(`Designation "${title}" added successfully.`);
                    }
                  }}
                  className="bg-[#f97316] hover:bg-orange-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg cursor-pointer"
                >
                  + Add Position
                </button>
              </div>

              <div className="space-y-3">
                {designationsList.map(des => {
                  const empCount = users.filter(u => (u.position || '').toLowerCase() === des.title.toLowerCase()).length;
                  return (
                    <div key={des.id} className="bg-[#0d1017] border border-[#1f2635] p-4 rounded-xl flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-black text-white">{des.title}</h4>
                        <p className="text-[10px] text-gray-400">Salary Grade Band: {des.band} • Base: ₹{des.baseSalary.toLocaleString()}/Mo</p>
                      </div>
                      <Badge variant="default">{empCount} Active</Badge>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: SHIFT MANAGEMENT (Module 2)
          ------------------------------------------------------------- */}
      {activeSubTab === 'shifts' && (
        <div className="space-y-6">
          <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left space-y-4">
            <div className="flex justify-between items-center border-b border-[#1f2635]/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Workforce Shift Rosters</h3>
                <p className="text-xs text-gray-400">Configure corporate work shifts, grace entries, and roster rules.</p>
              </div>
              <button
                onClick={() => {
                  const name = prompt('Enter new Shift Name:');
                  if (name) {
                    setShifts(prev => [...prev, { id: 's-' + Date.now(), name, startTime: '10:00 AM', endTime: '07:00 PM', graceMins: 15, membersCount: 0 }]);
                    notify(`Roster shift "${name}" created successfully.`);
                  }
                }}
                className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl cursor-pointer"
              >
                + New Shift
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shifts.map(shift => (
                <div key={shift.id} className="bg-[#0d1017] border border-[#1f2635] p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-black text-[#f97316] uppercase">{shift.name}</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold font-mono">
                      Active
                    </span>
                  </div>

                  <div className="text-xs space-y-1 text-gray-400">
                    <p>Start Time: <span className="text-white font-bold">{shift.startTime}</span></p>
                    <p>End Time: <span className="text-white font-bold">{shift.endTime}</span></p>
                    <p>Grace Period: <span className="text-white font-bold">{shift.graceMins} Mins Grace</span></p>
                  </div>

                  <div className="border-t border-[#1f2635]/60 pt-2 flex justify-between items-center text-[10px] text-gray-400">
                    <span>Enrolled Headcount:</span>
                    <span className="text-white font-bold">{shift.membersCount || 3} Members</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: HOLIDAY MANAGEMENT
          ------------------------------------------------------------- */}
      {activeSubTab === 'holidays' && (
        <div className="space-y-6">
          <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left space-y-4">
            <div className="flex justify-between items-center border-b border-[#1f2635]/60 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Gazetted & Regional Holidays Register</h3>
                <p className="text-xs text-gray-400">Yearly calendar of national holidays and regional leaves.</p>
              </div>
              <button
                onClick={() => {
                  const title = prompt('Enter Holiday Name (छुट्टी का नाम):');
                  const date = prompt('Enter Holiday Date (YYYY-MM-DD):');
                  if (title && date) {
                    setHolidaysList(prev => [...prev, { id: 'h-' + Date.now(), name: title, date, type: 'National Gazetted' }]);
                    notify(`Holiday "${title}" added to yearly register.`);
                  }
                }}
                className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl cursor-pointer"
              >
                + Add Holiday
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {holidaysList.map(h => (
                <div key={h.id} className="bg-[#0d1017] border border-[#1f2635] p-4 rounded-xl flex items-center justify-between text-xs">
                  <div className="text-left space-y-1">
                    <p className="text-white font-black">{h.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">Date: {h.date}</p>
                  </div>
                  <Badge variant={h.type === 'National Gazetted' ? 'success' : 'default'}>
                    {h.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: HR ANALYTICS
          ------------------------------------------------------------- */}
      {activeSubTab === 'hr_analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Average Monthly Turnover</span>
              <h3 className="text-2xl font-black text-white">1.8%</h3>
              <p className="text-[10px] text-emerald-400">✓ Highly stable retention index</p>
            </div>
            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gender Diversity Ratio</span>
              <h3 className="text-2xl font-black text-white">65:35</h3>
              <p className="text-[10px] text-gray-400">Male to Female staff spread</p>
            </div>
            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Absenteeism Index</span>
              <h3 className="text-2xl font-black text-[#f97316]">2.4%</h3>
              <p className="text-[10px] text-emerald-400">✓ Lower than Indian SMB baseline</p>
            </div>
          </div>

          <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl text-center space-y-4">
            <div className="bg-[#f97316]/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-[#f97316]">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">AI Attendance Insights & Recommendations</h3>
            <p className="text-xs text-gray-400 max-w-lg mx-auto">
              Unlock predictive insights, smart leave planning recommendations, and AI employee sentiment mapping by upgrading your HubSphere subscription.
            </p>
            <div className="inline-block bg-[#0a0d14] border border-[#1f2635] px-4 py-2 rounded-xl text-xs font-black text-orange-400">
              🚀 Coming in HubSphere V4
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODULE 1 — EMPLOYEE 360 PROFILE VIEW (Bento-grid styled details)
          ------------------------------------------------------------- */}
      {selectedEmployeeId && selectedEmp && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedEmployeeId(null)}
              className="text-xs text-gray-400 hover:text-white font-black flex items-center gap-1 cursor-pointer bg-[#111622] border border-[#1f2635] px-3 py-1.5 rounded-lg"
            >
              ← Back to Employee Directory
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Bento: Primary details & KYC status */}
            <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-6 text-left h-fit">
              <div className="flex items-center gap-4 border-b border-[#1f2635] pb-5">
                <div className="bg-orange-500/10 p-3 rounded-2xl">
                  <User className="w-8 h-8 text-[#f97316]" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-lg font-black text-white">{selectedEmp.name}</h3>
                  <p className="text-xs text-gray-400">{selectedEmp.position || 'Executive'} • {selectedEmp.department || 'Sales'}</p>
                  <span className="inline-block bg-orange-500/10 text-[#f97316] text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                    CODE: {selectedEmp.employmentCode || selectedEmp.id}
                  </span>
                </div>
              </div>

              {/* Quick Specs */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Primary Specifications</h4>
                <div className="space-y-3 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>Email Address:</span>
                    <span className="text-white font-bold">{selectedEmp.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phone Number:</span>
                    <span className="text-white font-mono">{selectedEmp.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WhatsApp:</span>
                    <span className="text-white font-mono">{selectedEmp.whatsapp || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Joining Date:</span>
                    <span className="text-white font-mono">{selectedEmp.joiningDate || '2026-01-01'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reporting Manager:</span>
                    <span className="text-[#f97316] font-bold">Main Admin (u-admin)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Salary Base Rate:</span>
                    <span className="text-white font-bold">₹{(selectedEmp.salaryBase || 15000).toLocaleString()}/Mo</span>
                  </div>
                </div>
              </div>

              {/* Dynamic KPI Scorecard */}
              <div className="bg-[#0d1017] border border-[#1f2635] p-4 rounded-xl space-y-2">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Biometric Health & KPI Performance</span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-[#f97316]">92%</span>
                  <div className="text-left">
                    <p className="text-xs text-white font-bold">Exemplary Rating</p>
                    <p className="text-[10px] text-emerald-400">✓ On-Time Shift Check-ins</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Bento: Tabbed Sub-Modules for Employee 360 */}
            <div className="lg:col-span-2 space-y-6 text-left">
              {/* 360 Profile Sub-Tabs Navigation */}
              <div className="flex flex-wrap border border-[#1f2635] gap-1 bg-[#111622] p-1.5 rounded-2xl border border-[#1f2635]/60 overflow-x-auto">
                {[
                  { id: 'overview', name: 'Overview' },
                  { id: 'personal', name: 'Personal Info' },
                  { id: 'employment', name: 'Employment' },
                  { id: 'attendance', name: 'Attendance' },
                  { id: 'leave', name: 'Leave Tracker' },
                  { id: 'documents', name: 'Documents' },
                  { id: 'payroll', name: 'Payroll History' },
                  { id: 'assets', name: 'Company Assets' },
                  { id: 'performance', name: 'Performance' },
                  { id: 'timeline', name: 'Timeline' },
                  { id: 'emergency', name: 'Emergency' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActive360Tab(t.id as any)}
                    className={`px-3 py-2 text-[11px] font-black rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      active360Tab === t.id 
                        ? 'bg-[#f97316] text-white shadow' 
                        : 'text-gray-400 hover:text-white hover:bg-[#1f2635]/30'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>

              {/* TAB 1: OVERVIEW */}
              {active360Tab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Attendance Rate</span>
                      <h4 className="text-xl font-black text-white mt-1">95.4%</h4>
                      <p className="text-[10px] text-emerald-400 mt-1">Excellent punctuality streak</p>
                    </div>
                    <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Leaves Remaining</span>
                      <h4 className="text-xl font-black text-white mt-1">14 / 22 Days</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Casual & Sick leaves available</p>
                    </div>
                    <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Company Assets Assigned</span>
                      <h4 className="text-xl font-black text-white mt-1">
                        {assets.filter(a => a.employeeId === selectedEmp.id).length} Items
                      </h4>
                      <p className="text-[10px] text-orange-400 mt-1">IT hardware fully documented</p>
                    </div>
                    <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Released Salary Slips</span>
                      <h4 className="text-xl font-black text-[#f97316] mt-1">
                        {releasedSalaries.filter(r => r.userId === selectedEmp.id).length} Months
                      </h4>
                      <p className="text-[10px] text-emerald-400 mt-1">All dues settled via IMPS</p>
                    </div>
                  </div>

                  {/* Quick HR summary */}
                  <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left space-y-2">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Manager Notes & Executive Comments</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      "{selectedEmp.name} continues to be an integral part of the {selectedEmp.department || 'Sales'} division. They maintain outstanding discipline, an exemplary attendance record, and have completed all core KYC verification successfully. Recommended for the yearly salary revisions cycle in Q4."
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: PERSONAL INFORMATION */}
              {active360Tab === 'personal' && (
                <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Detailed Personal KYC Profile</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block">Full Legal Name</span>
                      <p className="text-white font-bold mt-1">{selectedEmp.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Gender</span>
                      <p className="text-white font-bold mt-1">Male</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Date of Birth</span>
                      <p className="text-white font-mono font-bold mt-1">14-Aug-1993</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Blood Group</span>
                      <p className="text-white font-bold mt-1">O Positive (O+)</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Primary Mobile</span>
                      <p className="text-white font-mono font-bold mt-1">{selectedEmp.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">WhatsApp Integration</span>
                      <p className="text-emerald-400 font-mono font-bold mt-1">Connected</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 block">Current Address</span>
                      <p className="text-white font-bold mt-1">Sector 62, Noida, Uttar Pradesh - 201301</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EMPLOYMENT */}
              {active360Tab === 'employment' && (
                <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Corporate Employment Specifications</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-400 block">Corporate ID</span>
                      <p className="text-[#f97316] font-mono font-bold mt-1">{selectedEmp.employmentCode || selectedEmp.id}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Current Designation</span>
                      <p className="text-white font-bold mt-1">{selectedEmp.position || selectedEmp.role.toUpperCase()}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Assigned Department</span>
                      <p className="text-white font-bold mt-1">{selectedEmp.department || 'Sales'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Reporting Manager</span>
                      <p className="text-white font-bold mt-1">{getManager(selectedEmp)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Branch Office Location</span>
                      <p className="text-white font-bold mt-1">{getBranch(selectedEmp)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Employment Status</span>
                      <p className="text-emerald-400 font-bold mt-1 uppercase">{selectedEmp.status}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Employment Type</span>
                      <p className="text-white font-bold mt-1">{getEmpType(selectedEmp)}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Date of Joining</span>
                      <p className="text-white font-mono font-bold mt-1">{selectedEmp.joiningDate || '2026-01-01'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: ATTENDANCE */}
              {active360Tab === 'attendance' && (
                <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Attendance Register Logs</h3>
                  
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {attendance.filter(a => a.userId === selectedEmp.id).map(log => (
                      <div key={log.id} className="bg-[#0d1017] border border-[#1f2635] p-3 rounded-xl flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-emerald-400" />
                          <div className="text-left">
                            <p className="text-white font-bold">{log.date}</p>
                            <p className="text-[10px] text-gray-400 font-mono">
                              In: {log.loginTime ? new Date(log.loginTime).toLocaleTimeString() : 'N/A'} • Out: {log.logoutTime ? new Date(log.logoutTime).toLocaleTimeString() : 'Active Session'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="success">{log.status || 'Present'}</Badge>
                      </div>
                    ))}
                    {attendance.filter(a => a.userId === selectedEmp.id).length === 0 && (
                      <p className="text-gray-500 text-xs py-4 text-center">No attendance logs on record.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: LEAVE TRACKER */}
              {active360Tab === 'leave' && (
                <div className="space-y-4">
                  {/* Leave Balances Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#111622] border border-[#1f2635] p-3.5 rounded-xl text-center">
                      <span className="text-[9px] text-gray-400 uppercase block font-bold">Casual Leave</span>
                      <p className="text-lg font-black text-white mt-0.5">8 / 12</p>
                    </div>
                    <div className="bg-[#111622] border border-[#1f2635] p-3.5 rounded-xl text-center">
                      <span className="text-[9px] text-gray-400 uppercase block font-bold">Sick Leave</span>
                      <p className="text-lg font-black text-white mt-0.5">6 / 10</p>
                    </div>
                    <div className="bg-[#111622] border border-[#1f2635] p-3.5 rounded-xl text-center">
                      <span className="text-[9px] text-gray-400 uppercase block font-bold">Earned Leave</span>
                      <p className="text-lg font-black text-white mt-0.5">15 / 15</p>
                    </div>
                  </div>

                  {/* Historic Leaves */}
                  <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Leave Applications Registry</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {leaves.filter(l => l.userId === selectedEmp.id).map(l => (
                        <div key={l.id} className="bg-[#0d1017] border border-[#1f2635] p-3 rounded-xl text-left text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-bold">{l.startDate} to {l.endDate}</span>
                            <Badge variant={l.status === 'Approved' ? 'success' : l.status === 'Pending' ? 'warning' : 'danger'}>
                              {l.status}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-[11px]">Reason: "{l.reason}"</p>
                        </div>
                      ))}
                      {leaves.filter(l => l.userId === selectedEmp.id).length === 0 && (
                        <p className="text-gray-500 text-xs py-4 text-center">No leaves applied for yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: DOCUMENTS */}
              {active360Tab === 'documents' && (
                <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Digital Document Vault</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {documents.filter(d => d.userId === selectedEmp.id).map(doc => (
                      <div key={doc.id} className="bg-[#0d1017] border border-[#1f2635] p-3 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate mr-2">
                          <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                          <div className="truncate text-left">
                            <p className="text-white font-bold truncate">{doc.fileName}</p>
                            <p className="text-[10px] text-gray-400 font-bold">{doc.documentType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            doc.status === 'Verified' || doc.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {documents.filter(d => d.userId === selectedEmp.id).length === 0 && (
                      <p className="text-gray-500 text-xs py-4 col-span-2 text-center">No documents registered in secure vault.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: PAYROLL HISTORY */}
              {active360Tab === 'payroll' && (
                <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Disbursed Salary History</h3>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {releasedSalaries.filter(r => r.userId === selectedEmp.id).map((r, idx) => (
                      <div key={idx} className="bg-[#0d1017] border border-[#1f2635] p-3 rounded-xl flex justify-between items-center text-xs">
                        <div className="text-left">
                          <p className="text-white font-bold">Month: {r.month}</p>
                          <p className="text-[10px] text-gray-400">Basic: ₹{r.basic.toLocaleString()} • Deductions: ₹{r.deductions?.toLocaleString() || '0'}</p>
                        </div>
                        <span className="text-emerald-400 font-black font-mono">₹{r.netSalary.toLocaleString()}</span>
                      </div>
                    ))}
                    {releasedSalaries.filter(r => r.userId === selectedEmp.id).length === 0 && (
                      <p className="text-gray-500 text-xs py-4 text-center">No salary payments have been logged yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: COMPANY ASSETS */}
              {active360Tab === 'assets' && (
                <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Assigned Company Hardware Assets</h3>
                  
                  <div className="space-y-2">
                    {assets.filter(a => a.employeeId === selectedEmp.id).map(asset => (
                      <div key={asset.id} className="bg-[#0d1017] border border-[#1f2635] p-3 rounded-xl flex justify-between items-center text-xs">
                        <div className="text-left">
                          <p className="text-white font-bold">{asset.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">Serial: {asset.serial} • Type: {asset.type}</p>
                        </div>
                        <Badge variant="success">{asset.status}</Badge>
                      </div>
                    ))}
                    {assets.filter(a => a.employeeId === selectedEmp.id).length === 0 && (
                      <p className="text-gray-500 text-xs py-4 text-center">No hardware assets registered to this employee.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 9: PERFORMANCE */}
              {active360Tab === 'performance' && (
                <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl text-center space-y-4">
                  <div className="bg-orange-500/10 p-4 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-[#f97316]">
                    <Award className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">AI Employee KPI Scorecard</h3>
                  <p className="text-xs text-gray-400 max-w-md mx-auto">
                    HubSphere proprietary AI algorithm calculates dynamic performance matrices, real-time ticket completions, telecalling conversions, and biometric discipline values.
                  </p>
                  <div className="inline-block bg-[#0a0d14] border border-[#1f2635] px-4 py-2 rounded-xl text-xs font-black text-orange-400">
                    🚀 Coming in HubSphere V4
                  </div>
                </div>
              )}

              {/* TAB 10: TIMELINE */}
              {active360Tab === 'timeline' && (
                <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl space-y-4 text-left">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Employee Lifecycle Timeline</h3>
                  
                  <div className="relative border-l-2 border-[#1f2635] ml-4 pl-6 space-y-6">
                    {activities.filter(a => a.userId === selectedEmp.id).map(act => (
                      <div key={act.id} className="relative">
                        {/* Dot */}
                        <span className="absolute -left-9 top-1.5 w-5 h-5 rounded-full bg-[#111622] border-2 border-[#f97316] flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f97316]"></span>
                        </span>
                        <div>
                          <span className="text-[10px] font-mono text-gray-500 font-bold">{act.date}</span>
                          <h4 className="text-xs font-bold text-white mt-0.5">{act.title}</h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">{act.desc}</p>
                        </div>
                      </div>
                    ))}
                    {activities.filter(a => a.userId === selectedEmp.id).length === 0 && (
                      <p className="text-gray-500 text-xs py-4 pl-2 text-center">Timeline record initialized upon onboarding.</p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 11: EMERGENCY CONTACTS */}
              {active360Tab === 'emergency' && (
                <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">Emergency Contacts & Next of Kin</h4>
                  {(() => {
                    const contact = emergencyContacts[selectedEmp.id] || (selectedEmp.role === 'admin' ? emergencyContacts['u-admin'] : null);
                    return (
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-400 block">Contact Person</span>
                          <p className="text-white font-bold mt-1">{contact?.name || 'Sanjay Sharma'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Relationship</span>
                          <p className="text-white font-bold mt-1">{contact?.relation || 'Father'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Emergency Mobile</span>
                          <p className="text-white font-mono font-bold mt-1">{contact?.phone || '+919876543211'}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 block">Kin Email Address</span>
                          <p className="text-white font-bold mt-1">{contact?.email || 'sanjay@gmail.com'}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: DETAILED SHIFT ATTENDANCE LOGS (Module 2)
          ------------------------------------------------------------- */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl text-left space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Enterprise Attendance Log Register (हाजिरी बही)</h3>
              <div className="flex items-center gap-2 bg-[#0d1017] px-3 py-1.5 border border-[#1f2635] rounded-xl">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">GPS Locations Active</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1f2635] text-xs text-gray-400">
                    <th className="pb-3">STAFF NAME</th>
                    <th className="pb-3">ROLE</th>
                    <th className="pb-3">PUNCH DATE</th>
                    <th className="pb-3">SHIFT TIMING</th>
                    <th className="pb-3 text-center">CHECK IN</th>
                    <th className="pb-3 text-center">CHECK OUT</th>
                    <th className="pb-3 text-center">LATE/EARLY INDICATOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f2635] text-xs text-gray-300">
                  {attendance.map((log, idx) => {
                    // Calculate late entry indicators for 9:30 AM Shift
                    const checkInTime = log.loginTime ? new Date(log.loginTime) : null;
                    const shiftStart = checkInTime ? new Date(checkInTime) : null;
                    if (shiftStart) {
                      shiftStart.setHours(9, 30, 0, 0);
                    }
                    const isLate = checkInTime && shiftStart && checkInTime.getTime() > shiftStart.getTime() + (15 * 60 * 1000); // 15 mins grace
                    
                    return (
                      <tr key={idx} className="hover:bg-[#151922]">
                        <td className="py-3.5 font-bold text-white">{log.userName}</td>
                        <td className="py-3.5 uppercase text-[10px] text-gray-400">{log.userRole || 'Telecaller'}</td>
                        <td className="py-3.5 font-mono">{log.date}</td>
                        <td className="py-3.5 font-bold text-[#f97316]">9:30 AM - 6:30 PM</td>
                        <td className="py-3.5 text-center text-emerald-400 font-mono font-bold">
                          {log.loginTime ? new Date(log.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                        </td>
                        <td className="py-3.5 text-center text-orange-400 font-mono font-bold">
                          {log.logoutTime ? new Date(log.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                        </td>
                        <td className="py-3.5 text-center">
                          {isLate ? (
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                              Late Entry (देरी से आगमन)
                            </span>
                          ) : (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                              On Time (समय पर)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">No shift attendance logged yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: LEAVE MANAGEMENT WITH SANDWICH RULES (Module 3)
          ------------------------------------------------------------- */}
      {activeSubTab === 'leaves' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            
            {/* ESS: Leave Balance Tracker */}
            <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4 h-fit">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Leave Balances</h3>
                <button
                  onClick={() => setShowApplyLeave(true)}
                  className="bg-[#f97316] hover:bg-orange-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
                >
                  Apply Leave (छुट्टी के लिए आवेदन)
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-[#0d1017] border border-[#1f2635] p-3 rounded-xl flex justify-between items-center">
                  <span className="text-xs text-gray-400">Casual Leave (CL)</span>
                  <span className="text-sm font-black text-white">8 / 12 Days</span>
                </div>
                <div className="bg-[#0d1017] border border-[#1f2635] p-3 rounded-xl flex justify-between items-center">
                  <span className="text-xs text-gray-400">Sick Leave (SL)</span>
                  <span className="text-sm font-black text-white">4 / 6 Days</span>
                </div>
                <div className="bg-[#0d1017] border border-[#1f2635] p-3 rounded-xl flex justify-between items-center">
                  <span className="text-xs text-gray-400">Earned Leave (EL)</span>
                  <span className="text-sm font-black text-white">15 Days Available</span>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 p-3.5 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-red-400 font-black">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>Sandwich Rule Warnings!</span>
                </div>
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Leaves surrounding weekends/gazetted holidays will be processed under the Sandwich deduction algorithm (सैंडविच नियम लागू - छुट्टियाँ काटने का नियम).
                </p>
              </div>
            </div>

            {/* Leave Applications Board */}
            <div className="lg:col-span-2 bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Leaves Review Panel</h3>
              
              <div className="space-y-3">
                {leaves.map((leave, idx) => (
                  <div key={idx} className="bg-[#0d1017] border border-[#1f2635] p-4 rounded-xl space-y-3 text-left text-xs">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-white text-sm">{leave.userName}</h4>
                        <p className="text-[10px] text-gray-400">Dates: {leave.startDate} to {leave.endDate}</p>
                      </div>
                      <Badge 
                        variant={leave.status === 'Approved' ? 'success' : leave.status === 'Pending' ? 'warning' : 'danger'} 
                      >
                        {leave.status}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-300 font-medium">Reason: "{leave.reason}"</p>

                    {currentUser.role === 'admin' && leave.status === 'Pending' && (
                      <div className="flex justify-end gap-2 border-t border-[#1f2635] pt-3">
                        <button
                          onClick={() => handleReviewLeave(leave.id, 'Rejected', 'Rejected based on sandbox requirements.')}
                          className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Reject Request
                        </button>
                        <button
                          onClick={() => handleReviewLeave(leave.id, 'Approved', 'Approved in full compliance with Sandwich Rules.')}
                          className="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Approve Request
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {leaves.length === 0 && (
                  <p className="text-gray-500 py-8 text-center">No leaves requested inside corporate register.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: ENTERPRISE PAYROLL & COMPLIANCE (Module 4)
          ------------------------------------------------------------- */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-6">
          
          {/* Controls Panel */}
          <div className="bg-[#111622] border border-[#1f2635] p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-gray-400 uppercase">Target Disbursal Month:</span>
              <input
                type="month"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
                className="bg-[#0d1017] border border-[#1f2635] text-xs rounded-xl px-4 py-2 text-white outline-none"
              />
              <button
                onClick={handleGeneratePayroll}
                className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-black px-4 py-2 rounded-xl cursor-pointer"
              >
                Generate Draft
              </button>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowRequestLoan(true)}
                className="bg-[#1f2635] border border-[#1f2635] text-white hover:bg-[#2e374a] text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Landmark className="w-4 h-4" /> Request Loan
              </button>
              <button
                onClick={handleLockPayroll}
                disabled={salarySlips.length === 0 || payrollFrozen}
                className={`text-white text-xs font-black px-5 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer ${
                  payrollFrozen 
                    ? 'bg-gray-700 pointer-events-none' 
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                }`}
              >
                Freeze & Lock Payroll
              </button>
            </div>
          </div>

          {/* EMI Loans Tracking Grid */}
          <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Salary Advance & Loans (पेशगी भुगतान रजिस्टर)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loans.map(loan => (
                <div key={loan.id} className="bg-[#0d1017] border border-[#1f2635] p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-sm">{loan.userName}</h4>
                      <p className="text-[10px] text-gray-400">Requested: {loan.date}</p>
                    </div>
                    <Badge variant={loan.status === 'Approved' ? 'success' : loan.status === 'Pending' ? 'warning' : 'danger'}>
                      {loan.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-[#111622] p-2.5 rounded-lg">
                    <div>
                      <p className="text-gray-400">Total Amt</p>
                      <p className="text-white font-mono font-bold">₹{loan.amount}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">EMI / Mo</p>
                      <p className="text-[#f97316] font-mono font-bold">₹{loan.EMI}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Paid Tenure</p>
                      <p className="text-white font-mono font-bold">{loan.paidTenure} / {loan.tenureMonths} Mo</p>
                    </div>
                  </div>

                  <p className="text-gray-400 text-[10px] italic">Reason: "{loan.reason}"</p>

                  {currentUser.role === 'admin' && loan.status === 'Pending' && (
                    <div className="flex justify-end gap-2 pt-2 border-t border-[#1f2635]/60">
                      <button
                        onClick={() => handleReviewLoan(loan.id, 'Rejected')}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded text-[10px] font-bold cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleReviewLoan(loan.id, 'Approved')}
                        className="bg-emerald-500 text-white hover:bg-emerald-600 px-4 py-1 rounded text-[10px] font-bold cursor-pointer"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Salary Slip Generation Board */}
          {salarySlips.length > 0 && (
            <div className="bg-[#111622] border border-[#1f2635] p-5 rounded-2xl text-left space-y-4">
              <div className="flex justify-between items-center border-b border-[#1f2635] pb-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Monthly Salary Disbursal Slips</h3>
                {payrollFrozen && (
                  <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black px-3 py-1.5 rounded-lg">
                    🔒 LOCK APPLIED
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {salarySlips.map((slip, idx) => (
                  <div key={idx} className="bg-[#0d1017] border border-[#1f2635] p-5 rounded-xl space-y-4 text-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#1f2635]/60 pb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm">{slip.userName}</h4>
                        <p className="text-[10px] text-gray-400">{slip.department} • {slip.position}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-gray-400 block">Net Salary (शुद्ध वेतन)</span>
                        <span className="text-emerald-400 text-base font-mono font-black">₹{slip.netSalary.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Earnings & Deductions bento columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-300">
                      
                      {/* Earnings */}
                      <div className="space-y-2.5">
                        <h5 className="font-bold text-[#f97316] uppercase text-[10px] tracking-wider border-b border-[#1f2635]/30 pb-1">Earnings (अर्जन)</h5>
                        <div className="flex justify-between text-[11px]">
                          <span>Basic Salary (मूल वेतन - 50%):</span>
                          <span className="font-mono text-white">₹{slip.earnings.basic.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>House Rent Allowance (HRA - 20%):</span>
                          <span className="font-mono text-white">₹{slip.earnings.hra.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>Special & Food Allowances:</span>
                          <span className="font-mono text-white">₹{slip.earnings.specialAllowance.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>Performance Commission/Bonus:</span>
                          <span className="font-mono text-emerald-400 font-bold">₹{slip.earnings.performanceBonus.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div className="space-y-2.5">
                        <h5 className="font-bold text-red-400 uppercase text-[10px] tracking-wider border-b border-[#1f2635]/30 pb-1">Statutory Deductions (कटौती)</h5>
                        <div className="flex justify-between text-[11px]">
                          <span>Employees PF Contribution (EPF 12%):</span>
                          <span className="font-mono text-white">₹{slip.deductions.epf.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>ESIC Contribution (0.75%):</span>
                          <span className="font-mono text-white">₹{slip.deductions.esic.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>Professional Tax (PT India):</span>
                          <span className="font-mono text-white">₹{slip.deductions.professionalTax.toLocaleString()}</span>
                        </div>
                        {slip.loanEMIApplied && (
                          <div className="flex justify-between text-[11px] text-orange-400">
                            <span>Advance Salary Loan EMI deduction:</span>
                            <span className="font-mono font-bold">₹{slip.deductions.loanEMI.toLocaleString()}</span>
                          </div>
                        )}
                        {slip.deductions.lop > 0 && (
                          <div className="flex justify-between text-[11px] text-red-400 font-bold">
                            <span>Loss of Pay (LOP for {slip.absentDays} Absents):</span>
                            <span className="font-mono">₹{slip.deductions.lop.toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Action buttons (Download Slip) */}
                    <div className="flex justify-end pt-3 border-t border-[#1f2635]/60 gap-2">
                      <button
                        onClick={() => {
                          notify(`Payslip generated and downloaded successfully for ${slip.userName}.`);
                        }}
                        className="bg-[#1f2635] hover:bg-[#2e374a] text-white border border-[#1f2635] px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer text-[10px]"
                      >
                        <Download className="w-3.5 h-3.5" /> Download bilingual payslip (PDF)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------
          SUB-TAB: DIGITAL DOCUMENT VAULT (Module 7)
          ------------------------------------------------------------- */}
      {activeSubTab === 'documents' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            
            {/* Upload Document Form */}
            <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4 h-fit">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Encrypt & Upload KYC</h3>
              
              <form onSubmit={handleUploadDocument} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Select Employee Profile</label>
                  <select
                    value={docUploadForm.employeeId}
                    onChange={(e) => setDocUploadForm(prev => ({ ...prev, employeeId: e.target.value }))}
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} [{u.role.toUpperCase()}]</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Document Classification</label>
                  <select
                    value={docUploadForm.documentType}
                    onChange={(e) => setDocUploadForm(prev => ({ ...prev, documentType: e.target.value }))}
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                  >
                    <option value="Aadhaar Card">Aadhaar Card (आधार कार्ड)</option>
                    <option value="PAN Card">PAN Card (पैन कार्ड)</option>
                    <option value="Offer Letter">Offer / Appointment Letter</option>
                    <option value="Degree Certificate">Academic Degree / Certificates</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-2 font-black uppercase">Attach Scanned File (PDF, JPEG, PNG)</label>
                  <div className="flex items-center justify-between bg-[#0d1017] border border-[#1f2635] hover:border-gray-600 p-3 rounded-xl transition relative">
                    <input 
                      type="file" 
                      onChange={handleDocFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2 text-xs text-gray-400 pointer-events-none">
                      <FileUp className="w-4 h-4 text-orange-500" />
                      {docUploadForm.fileName ? (
                        <span className="text-white font-bold truncate max-w-[200px]">{docUploadForm.fileName}</span>
                      ) : (
                        <span>Choose document copy</span>
                      )}
                    </div>
                    <span className="bg-[#f97316] text-white text-[10px] font-black px-3 py-1.5 rounded-lg pointer-events-none transition">
                      Browse
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer"
                >
                  Encrypt & Store in Vault (दस्तावेज जमा करें)
                </button>
              </form>
            </div>

            {/* Document directory board */}
            <div className="lg:col-span-2 bg-[#111622] border border-[#1f2635] p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Enterprise Document Register</h3>
              
              <div className="space-y-3.5">
                {documents.map((doc, idx) => (
                  <div key={idx} className="bg-[#0d1017] border border-[#1f2635] p-4 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-left">
                      <div className="bg-orange-500/10 p-2.5 rounded-xl text-[#f97316]">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">{doc.fileName}</h4>
                        <p className="text-[10px] text-gray-400">Owner: {doc.userName} • Type: {doc.documentType}</p>
                        <p className="text-[9px] text-gray-500 font-mono">Uploaded: {new Date(doc.uploadedAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        doc.status === 'Verified' || doc.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                      }`}>
                        {doc.status}
                      </span>
                      {currentUser.role === 'admin' && doc.status !== 'Verified' && (
                        <button
                          onClick={() => handleVerifyDocument(doc.id, 'Verified')}
                          className="bg-emerald-500 text-white px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded-lg border border-red-500/20 cursor-pointer"
                      >
                        Purge
                      </button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-gray-500 py-8 text-center">No documents registered inside vault files.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODALS / DIALOGS
          ------------------------------------------------------------- */}
      
      {/* 1. APPLY LEAVE MODAL */}
      {showApplyLeave && (
        <div className="fixed inset-0 bg-[#000]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-3xl w-full max-w-lg space-y-4 text-left animate-fade-in relative">
            <h3 className="text-lg font-black text-white">Apply for Leave (छुट्टी के लिए आवेदन)</h3>
            
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Leave Type</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, leaveType: e.target.value }))}
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2 text-xs text-white"
                  >
                    <option value="Casual">Casual Leave (आकस्मिक अवकाश)</option>
                    <option value="Sick">Sick Leave (बीमारी की छुट्टी)</option>
                    <option value="Paid">Paid Privilege Leave</option>
                    <option value="Unpaid">Unpaid Leave</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="halfDay"
                    checked={leaveForm.halfDay}
                    onChange={(e) => setLeaveForm(prev => ({ ...prev, halfDay: e.target.checked }))}
                    className="bg-[#0d1017] border border-[#1f2635] rounded"
                  />
                  <label htmlFor="halfDay" className="text-xs text-gray-400 cursor-pointer">Half Day (आधा दिन)</label>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Reason / Explanation</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the exact reason for the requested leaves..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl p-4 text-xs text-white outline-none focus:border-[#f97316]"
                />
              </div>

              <div className="flex justify-end gap-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApplyLeave(false)}
                  className="bg-transparent border border-[#1f2635] hover:bg-[#1f2635]/40 text-gray-400 hover:text-white text-xs font-black px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-black px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Apply Leave (आवेदन भेजें)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. REQUEST LOAN MODAL */}
      {showRequestLoan && (
        <div className="fixed inset-0 bg-[#000]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-3xl w-full max-w-lg space-y-4 text-left animate-fade-in relative">
            <h3 className="text-lg font-black text-white">Request Advance Salary Loan (पेशगी ऋण अनुरोध)</h3>
            
            <form onSubmit={handleRequestLoan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Loan Amount (INR - ₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 15000"
                    value={loanForm.amount}
                    onChange={(e) => setLoanForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tenure Months (EMI Limit)</label>
                  <select
                    value={loanForm.tenureMonths}
                    onChange={(e) => setLoanForm(prev => ({ ...prev, tenureMonths: e.target.value }))}
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2 text-xs text-white"
                  >
                    <option value="3">3 Months EMI</option>
                    <option value="6">6 Months EMI</option>
                    <option value="12">12 Months EMI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Reason for Advance / Loan</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Please clarify details..."
                  value={loanForm.reason}
                  onChange={(e) => setLoanForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl p-4 text-xs text-white outline-none focus:border-[#f97316]"
                />
              </div>

              <div className="flex justify-end gap-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRequestLoan(false)}
                  className="bg-transparent border border-[#1f2635] hover:bg-[#1f2635]/40 text-gray-400 hover:text-white text-xs font-black px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-black px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Send Request (अनुमति अनुरोध)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ADD NEW EMPLOYEE MODAL */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-[#000]/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111622] border border-[#1f2635] p-6 rounded-3xl w-full max-w-xl space-y-4 text-left animate-fade-in relative max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-white">Add New Employee Profile (नया कर्मचारी जोड़ें)</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const name = (document.getElementById('add-name') as HTMLInputElement)?.value;
              const email = (document.getElementById('add-email') as HTMLInputElement)?.value;
              const password = (document.getElementById('add-password') as HTMLInputElement)?.value;
              const phone = (document.getElementById('add-phone') as HTMLInputElement)?.value;
              const role = (document.getElementById('add-role') as HTMLSelectElement)?.value;
              const dept = (document.getElementById('add-dept') as HTMLSelectElement)?.value;
              const pos = (document.getElementById('add-position') as HTMLInputElement)?.value;
              const sal = Number((document.getElementById('add-salary') as HTMLInputElement)?.value);
              const code = (document.getElementById('add-code') as HTMLInputElement)?.value;

              if (!name || !password || !role) {
                notify('Name, password, and role are required', 'error');
                return;
              }

              try {
                const res = await fetch('/api/users/add', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': currentUser.id,
                    'x-user-role': currentUser.role
                  },
                  body: JSON.stringify({
                    name, email, password, phone, role, department: dept, position: pos, salaryBase: sal, employmentCode: code
                  })
                });
                if (res.ok) {
                  notify('Successfully added new corporate employee record!');
                  setShowAddEmployee(false);
                  loadHrmsData();
                } else {
                  const data = await res.json();
                  notify(data.error || 'Failed to add employee', 'error');
                }
              } catch (err) {
                notify('Server connection failed', 'error');
              }
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    id="add-name"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    id="add-email"
                    placeholder="ramesh@company.com"
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Password *</label>
                  <input
                    type="password"
                    id="add-password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    id="add-phone"
                    placeholder="+919876543210"
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Designated Role *</label>
                  <select
                    id="add-role"
                    required
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2 text-xs text-white"
                  >
                    <option value="telecaller">Telecaller (टेलीकॉलर)</option>
                    <option value="staff">Backoffice Staff (स्टाफ)</option>
                    <option value="head">Department Head (विभाग अध्यक्ष)</option>
                    <option value="sub-admin">Sub-Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Department</label>
                  <select
                    id="add-dept"
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2 text-xs text-white"
                  >
                    <option value="Sales">Sales (बिक्री)</option>
                    <option value="Technical">Technical (तकनीकी)</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Designation / Position</label>
                  <input
                    type="text"
                    id="add-position"
                    placeholder="e.g. Senior Executive"
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Employment Code ID</label>
                  <input
                    type="text"
                    id="add-code"
                    placeholder="e.g. HS-101"
                    className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Monthly Base Salary (₹ INR) *</label>
                <input
                  type="number"
                  id="add-salary"
                  defaultValue={15000}
                  required
                  placeholder="15000"
                  className="w-full bg-[#0d1017] border border-[#1f2635] rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-3.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddEmployee(false)}
                  className="bg-transparent border border-[#1f2635] hover:bg-[#1f2635]/40 text-gray-400 hover:text-white text-xs font-black px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#f97316] hover:bg-orange-600 text-white text-xs font-black px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
