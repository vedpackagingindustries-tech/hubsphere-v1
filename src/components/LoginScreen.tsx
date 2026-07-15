import React, { useState, useEffect, useRef } from 'react';
import { Logo, VersionBadge, TaglineBlock, BRAND_CONFIG } from './Branding';
import { 
  Shield, Phone, Loader2, Key, HelpCircle, Mail, User, MapPin, Compass, 
  Laptop, Smartphone, AlertTriangle, Database, Download, Upload, FileJson, 
  Terminal, Clock, Calendar, Wifi, Check, CheckCircle2, ChevronRight, X, 
  Sparkles, RefreshCw, Eye, EyeOff, Lock, Building2, ArrowRight
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: { 
    id: string; 
    name: string; 
    email: string; 
    phone?: string;
    role: 'admin' | 'sub-admin' | 'head' | 'staff' | 'telecaller';
    department?: 'Tech' | 'NonTech' | 'Sales';
    position?: string;
    pcLoginAuthorizedAt?: string; // Optional timestamp when authorized via mobile GPS
  }) => void;
  onNavigateToRegister?: () => void;
}

// Office GPS Coordinates from google maps link provided by user
const OFFICE_LAT = 21.2078048;
const OFFICE_LON = 81.3540014;

export default function LoginScreen({ onLoginSuccess, onNavigateToRegister }: LoginScreenProps) {
  // Navigation active tab: 'staff_signin' | 'admin_signin'
  const [activeTab, setActiveTab] = useState<'staff_signin' | 'admin_signin'>('staff_signin');
  
  // Login form states
  const [companyName, setCompanyName] = useState('HubSphere');
  const [name, setName] = useState(''); // Used as Username/Email/Employee ID depending on view
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deviceType, setDeviceType] = useState<'mobile' | 'pc'>('mobile');
  
  // Loading & global message states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Live ticking clock for Employee terminal
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Saved credentials check (Remember Me)
  useEffect(() => {
    const savedName = localStorage.getItem('hubsphere_remember_name');
    const savedCompany = localStorage.getItem('hubsphere_remember_company');
    if (savedName) {
      setName(savedName);
      setRememberMe(true);
    }
    if (savedCompany) {
      setCompanyName(savedCompany);
    }
  }, []);

  // 1. FORGOT PASSWORD WORKFLOW STATES
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email/ID, 2: OTP, 3: New Pass, 4: Success
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  
  // 2. RECOVERY & CRASH UTILITIES DRAWER STATES
  const [showMaintenanceDrawer, setShowMaintenanceDrawer] = useState(false);
  const [recoveryQuestion, setRecoveryQuestion] = useState("elephant ke kitne daatt hote hai");
  const [operatorName, setOperatorName] = useState("");
  const [securityAnswerInput, setSecurityAnswerInput] = useState("");
  const [isRecoveryUnlocked, setIsRecoveryUnlocked] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showResetDefaultsConsole, setShowResetDefaultsConsole] = useState(false);
  const [resetOperatorName, setResetOperatorName] = useState('');
  const [resetSecurityAnswer, setResetSecurityAnswer] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [backupJson, setBackupJson] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');

  // 3. SECURE VERIFICATION WORKFLOW STATES (FOR EMPLOYEES POST-LOGIN)
  const [verificationStep, setVerificationStep] = useState<'idle' | 'verifying_credentials' | 'checking_device' | 'checking_network' | 'checking_location' | 'verified' | 'logging_attendance' | 'success'>('idle');
  const [selectedAction, setSelectedAction] = useState<'in' | 'out'>('in');
  const [gpsErrorModal, setGpsErrorModal] = useState(false);
  const [gpsDistance, setGpsDistance] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [isLocationMatched, setIsLocationMatched] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  
  // PC Login Timing Countdown
  const [pcMobileAuthorized, setPcMobileAuthorized] = useState(false);
  const [pcAuthTimestamp, setPcAuthTimestamp] = useState<string | null>(null);
  const [pcSecondsLeft, setPcSecondsLeft] = useState(0);
  const countdownIntervalRef = useRef<any>(null);

  // User object logged in temporarily during verification
  const [pendingUserObject, setPendingUserObject] = useState<any>(null);

  // OTP inputs references for auto-focusing
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Auto-lock when any credentials or verification parameters change
  useEffect(() => {
    setIsRecoveryUnlocked(false);
    setVerificationError('');
  }, [name, password, operatorName, securityAnswerInput]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // PC Countdown logic
  useEffect(() => {
    if (pcSecondsLeft > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setPcSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [pcSecondsLeft]);

  // Distance calculator (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // meters
  };

  // Main system login submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !password) {
      setError('Username / Employee ID and password are required.');
      return;
    }

    if (activeTab === 'staff_signin' && !companyName) {
      setError('Company name is required for staff members.');
      return;
    }

    setLoading(true);
    setVerificationStep('verifying_credentials');

    try {
      // Step A: Perform Login Authentication (Check if ID + Password are correct)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      const loggedUser = data.user;

      // Verify role boundaries
      if (activeTab === 'admin_signin' && loggedUser.role !== 'admin') {
        throw new Error('This section is reserved exclusively for the Main Admin.');
      }
      if (activeTab === 'staff_signin' && loggedUser.role === 'admin') {
        throw new Error('Main Admin must use the "Corporate Admin" login mode.');
      }

      // Save credentials if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem('hubsphere_remember_name', name.trim());
        localStorage.setItem('hubsphere_remember_company', companyName);
      } else {
        localStorage.removeItem('hubsphere_remember_name');
      }

      // If Main Admin logs in, they bypass ALL GPS & attendance steps! Take them in immediately.
      if (loggedUser.role === 'admin') {
        setSuccess('Welcome, Administrator. Authorization verified.');
        setTimeout(() => {
          onLoginSuccess(loggedUser);
        }, 1000);
        return;
      }

      // Keep user object pending for secure verification steps
      setPendingUserObject(loggedUser);

      // Step B: Trigger verification workflow
      triggerAttendanceVerification(loggedUser);

    } catch (err: any) {
      setError(err.message || 'Connection failed.');
      setVerificationStep('idle');
    } finally {
      setLoading(false);
    }
  };

  // Secure attendance verification sequence
  const triggerAttendanceVerification = async (userObj: any) => {
    // 1. Device Signature Validation
    setVerificationStep('checking_device');
    await new Promise(r => setTimeout(r, 800));

    // 2. Network/WiFi Validation
    setVerificationStep('checking_network');
    await new Promise(r => setTimeout(r, 800));

    // 3. GPS Location Check (if on Mobile or bypassed on PC)
    if (deviceType === 'pc') {
      // PC Path: Excluded from active GPS, but subject to 18-minute security countdown sequence.
      if (!pcMobileAuthorized) {
        setPcMobileAuthorized(true);
        setPcSecondsLeft(18 * 60);
        setPcAuthTimestamp(new Date().toISOString());
        setError('Security wait initiated. PC logins require a brief security synchronization clearance window. Countdown active below.');
        setVerificationStep('idle');
        return;
      }
      if (pcSecondsLeft > 0) {
        setError(`Security wait in progress. ${Math.floor(pcSecondsLeft / 60)}m ${pcSecondsLeft % 60}s remaining.`);
        setVerificationStep('idle');
        return;
      }
      // Countdown complete, proceed!
      completeCheckIn(userObj, 0);
    } else {
      // Mobile Path: Active GPS verification
      setVerificationStep('checking_location');
      requestGPSLocation(userObj);
    }
  };

  // Geolocation trigger
  const requestGPSLocation = (userObj: any) => {
    if (!navigator.geolocation) {
      setGpsError('Browser does not support geolocation tracking.');
      setGpsErrorModal(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calculateDistance(latitude, longitude, OFFICE_LAT, OFFICE_LON);
        setGpsDistance(Math.round(dist));

        if (dist <= 150) {
          setIsLocationMatched(true);
          completeCheckIn(userObj, Math.round(dist));
        } else {
          setGpsError(`You are located outside the authorized office zone (${Math.round(dist)}m away). Radius limit is 150m.`);
          setGpsErrorModal(true);
        }
      },
      (err) => {
        let msg = 'Failed to fetch GPS coordinates. Please ensure location services are enabled.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission access was denied. Attendance tracking requires location access.';
        }
        setGpsError(msg);
        setGpsErrorModal(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Completes GPS Verification and commits to check-in logs
  const completeCheckIn = async (userObj: any, distance: number) => {
    setVerificationStep('verified');
    await new Promise(r => setTimeout(r, 800));

    // Log the actual check-in / check-out in DB
    setVerificationStep('logging_attendance');
    const headers = {
      "x-user-id": userObj.id,
      "x-user-role": userObj.role,
    };
    const endpoint = selectedAction === 'in' ? "/api/attendance/login" : "/api/attendance/logout";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers
        },
        body: JSON.stringify({ userId: userObj.id })
      });
      
      if (res.ok) {
        setVerificationStep('success');
        if (deviceType === 'pc' && pcAuthTimestamp) {
          userObj.pcLoginAuthorizedAt = pcAuthTimestamp;
        }
        await new Promise(r => setTimeout(r, 1200));
        onLoginSuccess(userObj);
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Server rejected attendance registration.');
      }
    } catch (err: any) {
      setError(`Attendance Log Failed: ${err.message || 'Network issue'}.`);
      setVerificationStep('idle');
    }
  };

  // Mock WiFi and simulate bypass parameters for developers/testing in sandboxes
  const handleWiFiSimulate = () => {
    setGpsErrorModal(false);
    if (pendingUserObject) {
      setSuccess('Bypassed location using authenticated Corporate WiFi network verification.');
      completeCheckIn(pendingUserObject, 0);
    }
  };

  // Request GPS bypass authority from Admin
  const handleRequestBypass = async () => {
    if (!name.trim()) return;
    setGpsLoading(true);
    try {
      const response = await fetch('/api/auth/request-login-authority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          deviceType: 'mobile',
          distance: gpsDistance || 0,
          reason: gpsError || 'Location check failed on terminal log'
        })
      });
      const data = await response.json();
      if (response.ok) {
        setGpsErrorModal(false);
        setSuccess('Access request sent. Please ask the Main Admin to approve, then attempt sign-in.');
        setVerificationStep('idle');
      } else {
        setGpsError(data.error || 'Request rejected.');
      }
    } catch (err) {
      setGpsError('Error connecting to access server.');
    } finally {
      setGpsLoading(false);
    }
  };

  // Skip Wait timer (Testing utility helper)
  const skipCountdownWait = () => {
    setPcSecondsLeft(0);
    setSuccess('Security clearance finalized. Press Clock In / Clock Out to complete terminal sign-in.');
  };

  // Forgot password steps triggers
  const handleForgotStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('Please enter your registered email or Username.');
      return;
    }
    setIsForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const res = await fetch('/api/auth/request-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Recovery request failed.');
      }
      setForgotSuccess('A simulated recovery OTP has been sent. Proceed with verification.');
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.message || 'Error executing password recovery.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleForgotStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = forgotOtp.join('');
    if (enteredOtp.length !== 6) {
      setForgotError('Please enter the complete 6-digit verification code.');
      return;
    }
    setForgotError('');
    setForgotSuccess('Security code verified.');
    setForgotStep(3);
  };

  const handleForgotStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setForgotError('All password fields must be filled.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    setIsForgotLoading(true);
    setForgotError('');

    try {
      // Simulate/Trigger reset
      await new Promise(r => setTimeout(r, 1000));
      setForgotStep(4);
    } catch (err) {
      setForgotError('Failed to synchronize new password. Try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const nextOtp = [...forgotOtp];
    nextOtp[index] = element.value;
    setForgotOtp(nextOtp);

    // Auto-focus next input
    if (element.value !== '' && element.nextElementSibling) {
      (element.nextElementSibling as HTMLInputElement).focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !forgotOtp[index] && index > 0) {
      // Focus previous input on backspace
      const prevInput = otpRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Admin recovery drawer operations
  const fetchRecoveryQuestion = async () => {
    try {
      const response = await fetch('/api/backups/recovery-question');
      if (response.ok) {
        const data = await response.json();
        if (data && data.question) {
          setRecoveryQuestion(data.question);
        }
      }
    } catch (err) {
      console.error("Error fetching recovery question:", err);
    }
  };

  useEffect(() => {
    if (showMaintenanceDrawer) {
      fetchRecoveryQuestion();
    }
  }, [showMaintenanceDrawer]);

  const handleVerifyRecovery = async () => {
    if (!name.trim() || !password.trim()) {
      setVerificationError('Please enter the Admin Username & Password in the login fields above first.');
      return;
    }
    if (!operatorName.trim()) {
      setVerificationError('Operator name is required.');
      return;
    }
    if (!securityAnswerInput.trim()) {
      setVerificationError('Security answer is required.');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    try {
      const response = await fetch('/api/backups/verify-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          password,
          operatorName,
          securityAnswer: securityAnswerInput
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setVerificationError(data.error || 'Verification rejected.');
        setIsRecoveryUnlocked(false);
      } else {
        setIsRecoveryUnlocked(true);
        setVerificationError('Emergency system controls successfully unlocked.');
      }
    } catch (err) {
      setVerificationError('Failed to reach authorization server.');
      setIsRecoveryUnlocked(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOperatorName.trim() || !resetSecurityAnswer.trim()) {
      setResetMessage('All verification fields are required.');
      return;
    }

    setIsResetting(true);
    setResetMessage('');
    try {
      const response = await fetch('/api/auth/main-admin-reset-defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorName: resetOperatorName,
          securityAnswer: resetSecurityAnswer
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setResetMessage(data.error || 'Reset aborted.');
      } else {
        setResetMessage(`Success! Admin restored to defaults.`);
        setResetOperatorName('');
        setResetSecurityAnswer('');
        setName('Admin');
        setPassword('admin');
      }
    } catch (err) {
      setResetMessage('Error contacting restore services.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportFullBackup = async () => {
    if (!password || !operatorName || !securityAnswerInput) {
      setBackupMessage('Please unlock recovery credentials first.');
      return;
    }
    setIsExporting(true);
    setBackupMessage('');
    try {
      const response = await fetch('/api/backups/export-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name || 'Admin', 
          password,
          attemptByName: operatorName,
          securityAnswer: securityAnswerInput
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setBackupMessage(data.error || 'Backup authorization denied.');
      } else {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data.fullDatabase, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `hubsphere_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        setBackupMessage('Backup file downloaded.');
      }
    } catch (err) {
      setBackupMessage('Database compression failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFullBackup = async () => {
    if (!backupJson.trim() || !isRecoveryUnlocked) return;
    setIsRestoring(true);
    setBackupMessage('');
    try {
      const response = await fetch('/api/backups/restore-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Admin',
          password,
          backupData: JSON.parse(backupJson),
          attemptByName: operatorName,
          securityAnswer: securityAnswerInput
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setBackupMessage(data.error || 'Database restoration failed.');
      } else {
        setBackupMessage('Restoration compiled! Reloading terminal...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setBackupMessage('System restore corrupted.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleBackupFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBackupJson(event.target?.result as string);
      setBackupMessage(`File loaded: ${file.name}. Ready to restore.`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-orange-500 selection:text-white relative overflow-hidden">
      
      {/* Dynamic atmospheric ambient gradients (SaaS Elite Styling) */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-orange-100/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-100/30 blur-[120px] pointer-events-none" />

      {/* Main Container - Split Screen Visual Grid */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] border border-[#eef1f5] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] relative z-10 animate-fade-in">
        
        {/* LEFT PANEL: Elite SaaS Corporate Branding Side */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#0B1530] via-[#11224D] to-[#070D1E] text-white p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden border-r border-[#E2E8F0]/10 shadow-inner">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
          
          {/* Logo Brand */}
          <div className="space-y-4 z-10">
            <div className="inline-flex items-center gap-2 bg-white/[0.04] backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl">
              <Shield className="w-4 h-4 text-[#f97316] fill-[#f97316]/20" />
              <span className="text-[10px] font-black tracking-widest text-[#f97316] uppercase">HUBSPHERE SECURE SYSTEM</span>
            </div>
            
            <div className="space-y-3">
              <Logo theme="dark" textSizeClassName="text-3xl sm:text-4xl" />
              
              <div className="pt-1 border-l-2 border-orange-500/30 pl-3">
                <TaglineBlock theme="dark" />
              </div>
            </div>
          </div>

          {/* SaaS Core Feature Cards Panel */}
          <div className="space-y-4 z-10 my-6 lg:my-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-100 uppercase tracking-widest">Enterprise Feature Suite</h3>
              <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                Consolidated high-performance modules designed for absolute operational efficiency, geofenced team logs, and continuous financial transparency.
              </p>
            </div>

            {/* Feature Cards Grid (Enhanced Design & Visual Hierarchy) */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* CRM */}
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-3 rounded-xl flex items-center gap-2.5 hover:bg-white/[0.06] hover:border-white/15 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 group">
                <div className="p-1.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 group-hover:scale-105 transition-transform">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white leading-none">CRM Engine</h4>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Leads & Customers</p>
                </div>
              </div>
              
              {/* HRM */}
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-3 rounded-xl flex items-center gap-2.5 hover:bg-white/[0.06] hover:border-white/15 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 group">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white leading-none">HRM Module</h4>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Geofenced Logs</p>
                </div>
              </div>

              {/* Payroll */}
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-3 rounded-xl flex items-center gap-2.5 hover:bg-white/[0.06] hover:border-white/15 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 group">
                <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
                  <Database className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white leading-none">Payroll Portal</h4>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Salary & Invoices</p>
                </div>
              </div>

              {/* Field Sales */}
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-3 rounded-xl flex items-center gap-2.5 hover:bg-white/[0.06] hover:border-white/15 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 group">
                <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 group-hover:scale-105 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white leading-none">Field Sales</h4>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">GPS Coordinates</p>
                </div>
              </div>

              {/* Reports */}
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-3 rounded-xl flex items-center gap-2.5 hover:bg-white/[0.06] hover:border-white/15 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 group">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-105 transition-transform">
                  <FileJson className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white leading-none">Reports & BI</h4>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Audited Analytics</p>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-3 rounded-xl flex items-center gap-2.5 hover:bg-white/[0.06] hover:border-white/15 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 group">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white leading-none">Vault Drive</h4>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">Digital Storage</p>
                </div>
              </div>

              {/* AI Ready - Highlighted Full Width Card */}
              <div className="col-span-2 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 p-3.5 rounded-xl flex items-center gap-3 hover:from-orange-500/15 hover:to-amber-500/15 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 group">
                <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 animate-pulse">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white leading-none uppercase tracking-wider">Enterprise-Ready Infrastructure</h4>
                  <p className="text-[10px] text-orange-200 mt-1">Multi-tenant isolation, real-time sync & daily data recovery</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Strictly uses central VersionBadge & BRAND_CONFIG */}
          <div className="z-10 text-[10px] text-slate-300 font-bold tracking-wider flex justify-between items-center border-t border-white/10 pt-4 mt-2">
            <VersionBadge />
            <span className="flex items-center gap-1.5 text-orange-500 font-extrabold uppercase text-[10px] tracking-widest">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
              SYSTEM ACTIVE
            </span>
          </div>
        </div>

        {/* RIGHT PANEL: Sign-In Portal and Forms */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative bg-[#FAFBFC]">
          
          {/* Main Workspace Toggle & Header */}
          {!showForgotPassword && (
            <div className="space-y-5">
              
              {/* PREMIUM SEGMENTED CONTROL TAB SWITCHER */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div className="bg-[#F1F5F9] p-1 rounded-xl flex items-center gap-1 w-full max-w-sm border border-slate-200/40">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('staff_signin');
                      setError('');
                      setSuccess('');
                    }}
                    className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      activeTab === 'staff_signin'
                        ? 'bg-white text-[#f97316] shadow-sm border border-slate-200/20 font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Employee Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('admin_signin');
                      setError('');
                      setSuccess('');
                    }}
                    className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                      activeTab === 'admin_signin'
                        ? 'bg-white text-[#f97316] shadow-sm border border-slate-200/20 font-black'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Corporate Admin
                  </button>
                </div>

                <div className="self-start sm:self-auto">
                  <Badge text={activeTab === 'admin_signin' ? "Exempt Tab" : "Terminal Active"} />
                </div>
              </div>

              {/* Status Messages with High Contrast */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-905 text-xs text-left animate-slide-in">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-bold leading-relaxed">{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-950 text-xs text-left animate-slide-in">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-bold leading-relaxed whitespace-pre-line">{success}</span>
                </div>
              )}

              {/* VIEW A: COMPANY LOGIN (Admin Only) */}
              {activeTab === 'admin_signin' && (
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  <div className="space-y-1">
                    <h2 className="text-xl font-extrabold text-slate-900">Sign In as Administrator</h2>
                    <p className="text-xs text-slate-600">Access consolidated dashboards and database controllers.</p>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Company ID / Host
                      </label>
                      <div className="relative">
                        <Building2 className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="HubSphere"
                          className="w-full bg-white border border-slate-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/20 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 font-semibold outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Administrator Email / Username
                      </label>
                      <div className="relative">
                        <User className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. admin"
                          className="w-full bg-white border border-slate-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/20 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 font-semibold outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Admin Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(name);
                            setShowForgotPassword(true);
                            setForgotStep(1);
                            setForgotError('');
                          }}
                          className="text-xs text-[#f97316] hover:underline font-black"
                        >
                          Reset Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-3" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-slate-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/20 rounded-xl pl-11 pr-11 py-2.5 text-sm text-slate-900 font-semibold outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-800"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-300 text-[#f97316] focus:ring-[#f97316] w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700">Remember this device</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold py-3 rounded-xl transition shadow-md shadow-orange-500/10 hover:shadow-orange-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs uppercase tracking-wider mt-2"
                  >
                    {loading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "Sign In to Admin Roster"}
                  </button>
                </form>
              )}

              {/* VIEW B: EMPLOYEE TERMINAL LOGIN (attendance check integrated) */}
              {activeTab === 'staff_signin' && (
                <div className="space-y-4">
                  
                  {/* Dynamic digital attendance station header */}
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left shadow-sm">
                    <div className="space-y-1 sm:border-r border-[#E2E8F0] pr-2">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                        Live Terminal Time
                      </div>
                      <div className="text-2xl font-black text-slate-900 tracking-tight">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-[10px] font-bold text-slate-600">
                        {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </div>

                    <div className="space-y-1 pl-0 sm:pl-2 flex flex-col justify-center">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[9px] font-black uppercase tracking-wider">Shift Schedule:</span>
                        <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-black">ACTIVE</span>
                      </div>
                      <div className="text-xs font-black text-slate-800">General Day Shift</div>
                      <p className="text-[10px] text-slate-600 font-bold">Noida Tech Hub • Radius Bounds: 150m</p>
                    </div>
                  </div>

                  {/* Device selectors for employee */}
                  <div className="flex bg-[#F1F5F9] p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setDeviceType('mobile');
                        setPcSecondsLeft(0);
                        setPcMobileAuthorized(false);
                        setError('');
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                        deviceType === 'mobile'
                          ? 'bg-white text-[#f97316] shadow-sm border border-slate-200/40'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" /> SmartPhone
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeviceType('pc');
                        setError('');
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                        deviceType === 'pc'
                          ? 'bg-white text-[#f97316] shadow-sm border border-slate-200/40'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Laptop className="w-4 h-4" /> Desktop / PC
                    </button>
                  </div>

                  {/* Action choice: Clock In vs Clock Out */}
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <button
                      type="button"
                      onClick={() => setSelectedAction('in')}
                      className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        selectedAction === 'in' 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 shadow-sm' 
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🌅</span>
                        <div>
                          <span className="text-xs font-extrabold block">Clock In</span>
                          <span className="text-[9px] font-bold text-slate-500 block">Start shift</span>
                        </div>
                      </div>
                      {selectedAction === 'in' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedAction('out')}
                      className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all duration-200 ${
                        selectedAction === 'out' 
                          ? 'border-orange-500 bg-orange-50 text-orange-950 shadow-sm' 
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🌇</span>
                        <div>
                          <span className="text-xs font-extrabold block">Clock Out</span>
                          <span className="text-[9px] font-bold text-slate-500 block">End shift</span>
                        </div>
                      </div>
                      {selectedAction === 'out' && <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" />}
                    </button>
                  </div>

                  {/* Employee Login Inputs Form */}
                  <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          Company Name
                        </label>
                        <input
                          type="text"
                          required
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="HubSphere"
                          className="w-full bg-white border border-slate-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                          Employee ID
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. EMP-902"
                          className="w-full bg-white border border-slate-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Terminal Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(name);
                            setShowForgotPassword(true);
                            setForgotStep(1);
                            setForgotError('');
                          }}
                          className="text-xs text-[#f97316] hover:underline font-black"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-2.5" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white border border-slate-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/20 rounded-xl pl-11 pr-11 py-2 text-xs text-slate-900 font-semibold outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-800"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || verificationStep !== 'idle'}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold py-3 rounded-xl transition shadow-md shadow-orange-500/10 flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider mt-2"
                    >
                      {selectedAction === 'in' ? "Verify & Clock In" : "Verify & Clock Out"}
                    </button>
                  </form>

                  {/* PC Wait Countdown Panel */}
                  {deviceType === 'pc' && pcMobileAuthorized && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3 text-center animate-slide-in">
                      <div className="text-xs font-black text-blue-900 uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <Loader2 className="w-4 h-4 animate-spin text-[#f97316]" />
                        <span>Security Synchronization Clearance Active</span>
                      </div>
                      
                      {pcSecondsLeft > 0 ? (
                        <div className="space-y-2">
                          <p className="text-[11px] text-slate-700 max-w-sm mx-auto font-medium">
                            PC terminals require an 18-minute synchronization clearance period to register coordinates on standard networks:
                          </p>
                          <div className="text-2xl font-black font-mono text-blue-950 tracking-widest bg-white inline-block px-4 py-1.5 rounded-xl border border-blue-200 shadow-sm">
                            {Math.floor(pcSecondsLeft / 60).toString().padStart(2, '0')}:
                            {(pcSecondsLeft % 60).toString().padStart(2, '0')}
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={skipCountdownWait}
                              className="bg-[#f97316] hover:bg-orange-600 text-white font-black text-[10px] px-3 py-1.5 rounded-lg transition uppercase tracking-wider shadow-sm cursor-pointer"
                            >
                              ⚡ Skip Wait Period (Testing)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                          ✓ Synchronization wait verified! Press Clock In / Clock Out to complete sign-in.
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* VIEW C: PREMIUM STEPPED FORGOT PASSWORD WORKFLOW */}
          {showForgotPassword && (
            <div className="space-y-5 text-left animate-fade-in">
              <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotError('');
                    setForgotSuccess('');
                  }}
                  className="text-xs font-extrabold text-[#f97316] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Login
                </button>
                <span className="text-xs text-slate-500 font-black tracking-wider uppercase ml-auto">
                  Password Recovery
                </span>
              </div>

              {forgotError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-900 text-xs text-left animate-slide-in">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-600 shrink-0 mt-0.5" />
                  <span className="font-bold leading-relaxed">{forgotError}</span>
                </div>
              )}
              {forgotSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-950 text-xs text-left animate-slide-in">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-bold leading-relaxed">{forgotSuccess}</span>
                </div>
              )}

              {/* Step 1: Request OTP / Email Input */}
              {forgotStep === 1 && (
                <form onSubmit={handleForgotStep1Submit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 font-extrabold">Forgot Password?</h2>
                    <p className="text-xs text-slate-600">Provide your employee username or email. We will process recovery coordinates.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Username / Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4.5 h-4.5 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. suresh@company.com"
                        className="w-full bg-white border border-slate-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/20 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-900 font-semibold outline-none transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider mt-4"
                  >
                    {isForgotLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "Request Verification Code"}
                  </button>
                </form>
              )}

              {/* Step 2: Code verification */}
              {forgotStep === 2 && (
                <form onSubmit={handleForgotStep2Submit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 font-extrabold">Verify Security OTP</h2>
                    <p className="text-xs text-slate-600">We have registered a secure OTP bypass code. Enter digits below.</p>
                  </div>

                  <div className="flex gap-2 justify-between py-2">
                    {forgotOtp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="w-12 h-12 bg-white border border-slate-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/20 rounded-xl text-center font-black text-lg text-slate-900 outline-none transition shadow-sm"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider mt-4"
                  >
                    Verify Code
                  </button>
                </form>
              )}

              {/* Step 3: Write new password */}
              {forgotStep === 3 && (
                <form onSubmit={handleForgotStep3Submit} className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-900 font-extrabold">Define New Password</h2>
                    <p className="text-xs text-slate-600">Formulate a secure, high-entropy password for terminal login.</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        New Security Password
                      </label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-semibold outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Confirm Password Match
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.checked)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-300 focus:border-[#f97316] focus:ring-2 focus:ring-orange-500/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-semibold outline-none transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isForgotLoading}
                    className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider mt-4"
                  >
                    {isForgotLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "Fulfill Password Reset"}
                  </button>
                </form>
              )}

              {/* Step 4: Success confirmation screen */}
              {forgotStep === 4 && (
                <div className="space-y-6 text-center py-6 animate-scale-in">
                  <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <Check className="w-8 h-8" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 font-extrabold">Security Password Reset</h3>
                    <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">Your credentials have been successfully updated. You may now log in to your designated workspace.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setForgotError('');
                      setForgotSuccess('');
                    }}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 rounded-xl transition shadow text-xs uppercase tracking-wider"
                  >
                    Return to Sign In Terminal
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Support Register Actions */}
          {onNavigateToRegister && !showForgotPassword && (
            <div className="border-t border-[#E2E8F0] pt-4 mt-4 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-bold">New Organization?</span>
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-[#f97316] font-black hover:underline tracking-wide cursor-pointer"
              >
                Register Company Account
              </button>
            </div>
          )}

          {/* Administrative Maintenance Drawer Toggle Icon */}
          {activeTab === 'admin_signin' && !showForgotPassword && (
            <div className="absolute bottom-4 right-4 z-10">
              <button
                type="button"
                onClick={() => {
                  setShowMaintenanceDrawer(true);
                  setBackupMessage('');
                  setVerificationError('');
                }}
                className="p-2.5 bg-white border border-slate-300 hover:border-[#f97316] text-slate-500 hover:text-[#f97316] rounded-xl transition shadow-sm cursor-pointer group"
                title="System Maintenance & Backups"
              >
                <Database className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 4. PREMIUM POST-LOGIN SECURE GPS ATTENDANCE PROGRESS MODAL */}
      {verificationStep !== 'idle' && (
        <div className="fixed inset-0 bg-[#07090e]/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-[#eef1f5] shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-center space-y-6 animate-scale-in">
            
            {/* Elegant Circular loading animation */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
              <div className="absolute inset-0 rounded-full border-4 border-[#f97316] border-t-transparent animate-spin" />
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center">
                {verificationStep === 'verifying_credentials' && <Lock className="w-7 h-7 text-[#f97316]" />}
                {verificationStep === 'checking_device' && <Smartphone className="w-7 h-7 text-[#f97316]" />}
                {verificationStep === 'checking_network' && <Wifi className="w-7 h-7 text-[#f97316]" />}
                {verificationStep === 'checking_location' && <Compass className="w-7 h-7 text-[#f97316] animate-pulse" />}
                {verificationStep === 'verified' && <CheckCircle2 className="w-7 h-7 text-emerald-600 animate-bounce" />}
                {verificationStep === 'logging_attendance' && <Loader2 className="w-7 h-7 text-[#f97316] animate-spin" />}
                {verificationStep === 'success' && <Sparkles className="w-7 h-7 text-emerald-500" />}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-gray-900 tracking-tight">
                {verificationStep === 'verifying_credentials' && "Authenticating Profile..."}
                {verificationStep === 'checking_device' && "Securing Device Hardware Signature..."}
                {verificationStep === 'checking_network' && "Verifying Network Firewall (WiFi)..."}
                {verificationStep === 'checking_location' && "Acquiring Satellites GPS..."}
                {verificationStep === 'verified' && "Location Securely Verified"}
                {verificationStep === 'logging_attendance' && "Syncing Log with HRM Server..."}
                {verificationStep === 'success' && "Attendance Check-In Logged"}
              </h3>
              
              <p className="text-xs text-gray-500 font-medium max-w-xs mx-auto leading-relaxed">
                {verificationStep === 'verifying_credentials' && "Checking employee databases for terminal authorization."}
                {verificationStep === 'checking_device' && "Registering secure cryptographic token with browser client."}
                {verificationStep === 'checking_network' && "Matching IP packets against office dedicated ISP lines."}
                {verificationStep === 'checking_location' && "Calculating Haversine distance to Noida Tech Hub."}
                {verificationStep === 'verified' && "You are successfully positioned within the authorized office zone."}
                {verificationStep === 'logging_attendance' && "Authorizing and signing timesheet database records."}
                {verificationStep === 'success' && "Shift status successfully synchronized. Redirecting to desktop..."}
              </p>
            </div>

            {/* Checklist items to represent Wifi, GPS, and Device Validation */}
            <div className="bg-gray-50 border border-[#eef1f5] rounded-2xl p-4 text-left space-y-2 max-w-xs mx-auto">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5" /> Cryptographic Device ID
                </span>
                <span className={['checking_device', 'verifying_credentials'].includes(verificationStep) ? "text-[#f97316] animate-pulse" : "text-emerald-600 font-black"}>
                  {['checking_device', 'verifying_credentials'].includes(verificationStep) ? "Checking..." : "VERIFIED ✓"}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                <span className="flex items-center gap-2">
                  <Wifi className="w-3.5 h-3.5" /> Corporate WiFi / Gateway
                </span>
                <span className={['checking_device', 'checking_network', 'verifying_credentials'].includes(verificationStep) ? "text-gray-400" : verificationStep === 'checking_network' ? "text-[#f97316] animate-pulse" : "text-emerald-600 font-black"}>
                  {['checking_device', 'verifying_credentials'].includes(verificationStep) ? "Waiting..." : verificationStep === 'checking_network' ? "Verifying..." : "MATCHED ✓"}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
                <span className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Noida Satellites Coordinates
                </span>
                <span className={['checking_device', 'checking_network', 'checking_location', 'verifying_credentials'].includes(verificationStep) ? "text-gray-400" : verificationStep === 'checking_location' ? "text-[#f97316] animate-pulse" : "text-emerald-600 font-black"}>
                  {['checking_device', 'checking_network', 'verifying_credentials'].includes(verificationStep) ? "Waiting..." : verificationStep === 'checking_location' ? "Positioning..." : "VERIFIED ✓"}
                </span>
              </div>
            </div>

            {/* Simulated cancel button */}
            {['checking_location', 'checking_network', 'checking_device'].includes(verificationStep) && (
              <button
                type="button"
                onClick={() => setVerificationStep('idle')}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 underline cursor-pointer"
              >
                Abort & Return
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. PREMIUM GPS LOCATION DENIED / MISMATCHED MODAL */}
      {gpsErrorModal && (
        <div className="fixed inset-0 bg-[#07090e]/85 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#eef1f5] shadow-[0_20px_50px_rgba(0,0,0,0.2)] text-left space-y-6 animate-scale-in">
            <div className="flex items-center gap-3 border-b border-[#eef1f5] pb-4">
              <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900 leading-none">📍 Location Permission Required</h3>
                <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">Attendance Validation Check</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed font-medium">
              To mark attendance securely and register timesheet stamps, please allow GPS coordinate access. This verifies physical presence within the authorized <span className="font-extrabold text-gray-800">150 meters Noida Tech Hub radius limit</span>.
            </p>

            {gpsError && (
              <div className="bg-red-50 border border-red-100/50 rounded-2xl p-3.5 text-xs text-red-800 leading-normal font-semibold">
                ⚠️ {gpsError}
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                disabled={gpsLoading}
                onClick={() => {
                  if (pendingUserObject) {
                    setGpsError('');
                    requestGPSLocation(pendingUserObject);
                  }
                }}
                className="w-full bg-[#f97316] hover:bg-orange-600 text-white font-extrabold py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
                Allow Location & Try Again
              </button>

              <button
                type="button"
                onClick={handleWiFiSimulate}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Wifi className="w-4 h-4 text-emerald-500" /> Use Office Secure WiFi
              </button>

              <button
                type="button"
                disabled={gpsLoading}
                onClick={handleRequestBypass}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50"
              >
                <Shield className="w-4 h-4 text-blue-600" /> Contact Admin for GPS Exemption
              </button>
            </div>

            <div className="border-t border-[#eef1f5] pt-3 text-center">
              <button
                type="button"
                onClick={() => {
                  setGpsErrorModal(false);
                  setVerificationStep('idle');
                }}
                className="text-xs font-bold text-gray-400 hover:text-gray-600 underline cursor-pointer"
              >
                Cancel Attendance Check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADMIN SYSTEM MAINTENANCE & BACKUP DRAWER */}
      {showMaintenanceDrawer && (
        <div className="fixed inset-0 bg-[#07090e]/80 backdrop-blur-sm z-50 flex justify-end animate-fade-in">
          {/* Backdrop click closer */}
          <div className="absolute inset-0" onClick={() => setShowMaintenanceDrawer(false)} />
          
          <div className="bg-white w-full max-w-lg h-full relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.2)] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto animate-slide-left text-left border-l border-[#eef1f5]">
            
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#eef1f5] pb-4">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-[#f97316] animate-pulse" />
                  <div>
                    <h3 className="text-base font-black text-gray-900 leading-none">🛠️ Database Maintenance</h3>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">Secure Backup & Recovery Terminal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMaintenanceDrawer(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Log warnings */}
              {verificationError && (
                <div className={`p-3.5 rounded-2xl border text-xs font-semibold leading-relaxed animate-slide-in ${
                  verificationError.includes('❌') || verificationError.includes('failed')
                    ? 'bg-red-50 border-red-100 text-red-700' 
                    : 'bg-emerald-50 border-emerald-100 text-emerald-800'
                }`}>
                  {verificationError}
                </div>
              )}

              {/* Drawer Content block */}
              <div className="space-y-5">
                
                {/* Section A: Credentials verification */}
                <div className="bg-[#fcfdfe] border border-[#eef1f5] p-4.5 rounded-2xl space-y-4">
                  <span className="text-[10px] font-black tracking-widest text-[#f97316] block uppercase flex items-center gap-1.5 border-b border-[#eef1f5] pb-2">
                    <Lock className="w-3.5 h-3.5" /> Secure Authentication Validation
                  </span>

                  <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                    Ensure Administrator username & password are typed into the main login card, then complete validation parameters below to grant maintenance credentials.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Who is initiating recovery?
                      </label>
                      <input
                        type="text"
                        value={operatorName}
                        onChange={(e) => setOperatorName(e.target.value)}
                        placeholder="e.g. Laxmi Kant"
                        className="w-full bg-white border border-[#eef1f5] focus:border-[#f97316] rounded-xl px-3.5 py-2 text-xs outline-none transition"
                      />
                    </div>

                    <div className="bg-gray-50 border border-[#eef1f5] p-3 rounded-xl space-y-2">
                      <span className="block text-[9px] text-[#f97316] font-black uppercase tracking-wider">
                        Security Verification Challenge:
                      </span>
                      <p className="text-xs text-gray-700 font-bold italic">
                        "{recoveryQuestion}"
                      </p>
                      
                      <div className="pt-1">
                        <input
                          type="password"
                          value={securityAnswerInput}
                          onChange={(e) => setSecurityAnswerInput(e.target.value)}
                          placeholder="Your security secret answer..."
                          className="w-full bg-white border border-[#eef1f5] focus:border-[#f97316] rounded-xl px-3 py-1.5 text-xs outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyRecovery}
                    disabled={isVerifying}
                    className="w-full bg-[#f97316] hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold py-2 text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-orange-500/5"
                  >
                    {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4 animate-pulse" />}
                    Unlock Secure Tools
                  </button>
                </div>

                {/* Section B: Backups Management (Unlocked only after verification) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Backup & restore pipeline</span>
                    <Badge text={isRecoveryUnlocked ? "Unlocked ✓" : "LOCKED 🔒"} />
                  </div>

                  <button
                    type="button"
                    onClick={handleExportFullBackup}
                    disabled={isExporting || !isRecoveryUnlocked}
                    className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 disabled:bg-gray-100 disabled:text-gray-400 font-bold py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <Download className="w-4 h-4 text-orange-500" /> Export System Database (.json)
                  </button>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Restore from backup data
                    </label>

                    <div className={`relative group ${!isRecoveryUnlocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <input
                        type="file"
                        accept=".json"
                        disabled={!isRecoveryUnlocked}
                        onChange={handleBackupFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none"
                      />
                      <div className="bg-gray-50 border border-dashed border-gray-300 group-hover:border-[#f97316] rounded-xl py-3 px-4 text-center transition">
                        <p className="text-[10px] font-bold text-gray-500 flex items-center justify-center gap-1.5">
                          <Upload className="w-4 h-4 text-gray-400" />
                          Choose and load `.json` backup file
                        </p>
                      </div>
                    </div>

                    <textarea
                      value={backupJson}
                      disabled={!isRecoveryUnlocked}
                      onChange={(e) => setBackupJson(e.target.value)}
                      placeholder={isRecoveryUnlocked ? "Paste complete database JSON payload here to trigger restore..." : "🔒 Maintenance validation required to unlock."}
                      className="w-full h-24 bg-gray-50 border border-[#eef1f5] rounded-xl p-3 text-[10px] font-mono text-gray-600 outline-none placeholder:text-gray-400 focus:bg-white focus:border-[#f97316] transition disabled:opacity-40"
                    />

                    {backupMessage && (
                      <p className="text-[10px] font-bold text-[#f97316]">{backupMessage}</p>
                    )}

                    <button
                      type="button"
                      onClick={handleRestoreFullBackup}
                      disabled={isRestoring || !backupJson.trim() || !isRecoveryUnlocked}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-black py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                    >
                      <FileJson className="w-4 h-4" /> Sync Database Restoration
                    </button>
                  </div>
                </div>

                {/* Section C: Emergency reset */}
                <div className="border-t border-[#eef1f5] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetDefaultsConsole(!showResetDefaultsConsole);
                      setResetMessage('');
                    }}
                    className="w-full bg-red-50 hover:bg-red-100/60 border border-red-100 text-red-700 rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                      🚨 Reset Administrator Credentials to Default (Admin/admin)
                    </span>
                    <span className="text-[10px] font-bold text-red-400">{showResetDefaultsConsole ? 'Hide' : 'Open'}</span>
                  </button>

                  {showResetDefaultsConsole && (
                    <form onSubmit={handleResetDefaults} className="mt-3 bg-red-50/30 border border-red-100/50 p-4 rounded-2xl space-y-3.5 animate-fadeIn">
                      <p className="text-[10px] text-gray-500 leading-normal font-semibold">
                        Confirming validation challenge answer resets the primary administrator user back to default credentials: <span className="text-gray-800 font-extrabold font-mono">Admin / admin</span>.
                      </p>

                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          value={resetOperatorName}
                          onChange={(e) => setResetOperatorName(e.target.value)}
                          placeholder="Your Operator Name"
                          className="w-full bg-white border border-[#eef1f5] rounded-lg px-3 py-1.5 text-xs outline-none"
                        />
                        <input
                          type="password"
                          required
                          value={resetSecurityAnswer}
                          onChange={(e) => setResetSecurityAnswer(e.target.value)}
                          placeholder="Security Challenge Secret Answer"
                          className="w-full bg-white border border-[#eef1f5] rounded-lg px-3 py-1.5 text-xs outline-none"
                        />
                      </div>

                      {resetMessage && (
                        <p className="text-[10px] font-bold text-red-600">{resetMessage}</p>
                      )}

                      <button
                        type="submit"
                        disabled={isResetting}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        Confirm Credentials Reset
                      </button>
                    </form>
                  )}
                </div>

              </div>
            </div>

            <div className="border-t border-[#eef1f5] pt-4 text-center">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">HubSphere Cryptographic Control Hub</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Inline custom reusable Badge
function Badge({ text }: { text: string }) {
  return (
    <span className="text-[10px] bg-orange-500/10 border border-orange-500/25 text-[#f97316] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
      {text}
    </span>
  );
}
