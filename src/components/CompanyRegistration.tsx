import React, { useState, useEffect } from "react";
import { Building2, Mail, Phone, User, Key, Check, ShieldAlert, Sparkles, ArrowRight, Loader2, Landmark, Globe, RefreshCcw, LogIn } from "lucide-react";

interface CompanyRegistrationProps {
  onRegisterSuccess: (data: {
    tenantId: string;
    companyId: string;
    adminUserId: string;
    adminName: string;
    adminEmail: string;
    companyName: string;
  }) => void;
  onNavigateToLogin: () => void;
}

export default function CompanyRegistration({ onRegisterSuccess, onNavigateToLogin }: CompanyRegistrationProps) {
  // Input fields state
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companySize, setCompanySize] = useState("1-10");
  const [industry, setIndustry] = useState("Information Technology");
  const [country, setCountry] = useState("India");
  const [timeZone, setTimeZone] = useState("IST (UTC+05:30)");
  const [currency, setCurrency] = useState("INR");

  // Status and Validation states
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "Weak", color: "bg-red-500" });
  
  // Real-time error state for individual fields
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time validations on value changes
  useEffect(() => {
    const nextErrors: Record<string, string> = {};

    if (companyName && companyName.trim().length < 3) {
      nextErrors.companyName = "Company name must be at least 3 characters.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (companyEmail && !emailRegex.test(companyEmail.trim())) {
      nextErrors.companyEmail = "Invalid company email format.";
    }

    if (adminEmail && !emailRegex.test(adminEmail.trim())) {
      nextErrors.adminEmail = "Invalid admin email format.";
    }

    if (companyPhone && !/^\+?[0-9\s\-]{8,15}$/.test(companyPhone.trim())) {
      nextErrors.companyPhone = "Please enter a valid phone number (8-15 digits).";
    }

    if (password) {
      // Calculate password strength
      let score = 0;
      if (password.length >= 6) score += 1;
      if (password.length >= 10) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^A-Za-z0-9]/.test(password)) score += 1;

      let text = "Weak";
      let color = "bg-red-500";
      if (score >= 4) {
        text = "Strong";
        color = "bg-green-500";
      } else if (score >= 2) {
        text = "Medium";
        color = "bg-yellow-500";
      }
      setPasswordStrength({ score, text, color });

      if (password.length < 6) {
        nextErrors.password = "Password must be at least 6 characters.";
      }
    }

    if (confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(nextErrors);
  }, [companyName, companyEmail, companyPhone, adminEmail, password, confirmPassword]);

  // Handle country/timezone auto-pairing to make onboarding delightful
  const handleCountryChange = (val: string) => {
    setCountry(val);
    if (val === "India") {
      setTimeZone("IST (UTC+05:30)");
      setCurrency("INR");
    } else if (val === "United States") {
      setTimeZone("EST (UTC-05:00)");
      setCurrency("USD");
    } else if (val === "United Kingdom") {
      setTimeZone("GMT (UTC+00:00)");
      setCurrency("GBP");
    } else if (val === "Singapore") {
      setTimeZone("SGT (UTC+08:00)");
      setCurrency("SGD");
    } else if (val === "United Arab Emirates") {
      setTimeZone("GST (UTC+04:00)");
      setCurrency("AED");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    // Final checks
    if (Object.keys(errors).length > 0) {
      setSubmitError("Please correct all validation errors first.");
      return;
    }

    if (!companyName || !companyEmail || !companyPhone || !adminName || !adminEmail || !password || !confirmPassword) {
      setSubmitError("Please fill out all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/v1/auth/register-company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          companyName,
          companyEmail,
          companyPhone,
          adminName,
          adminEmail,
          password,
          companySize,
          industry,
          country,
          timeZone,
          currency
        })
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error || "Failed to register. Please try again.");
      }

      // Success
      onRegisterSuccess({
        tenantId: body.data.tenantId,
        companyId: body.data.companyId,
        adminUserId: body.data.adminUserId,
        adminName: body.data.adminName,
        adminEmail: body.data.adminEmail,
        companyName: body.data.companyName
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      setSubmitError(err.message || "An unexpected error occurred during company registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center bg-gradient-to-tr from-slate-100 to-indigo-50/40 dark:from-slate-950 dark:to-slate-900">
      
      {/* Background visual accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xl overflow-hidden relative z-10 p-6 md:p-8 space-y-6">
        
        {/* Header Section */}
        <div className="text-center space-y-1.5 pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-orange-500 items-center justify-center text-white font-black text-2xl shadow-lg shadow-orange-500/20 mb-2">
            T
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
            Register Your Enterprise <Sparkles className="w-5 h-5 text-orange-500 fill-orange-500" />
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Launch your company portal on TeleCRM and coordinate your entire sales workforce.
          </p>
        </div>

        {submitError && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-semibold rounded-2xl flex items-center gap-3 border border-red-500/10">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          
          {/* Section 1: Company Profile */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> 1. Company Profile (कंपनी विवरण)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Company Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Company Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Industries Ltd"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/50 dark:bg-slate-900/50 focus:ring-1 text-sm outline-none transition-all placeholder:text-slate-400 ${
                      errors.companyName
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 dark:border-slate-800 focus:border-orange-500 focus:ring-orange-500/20"
                    } text-slate-800 dark:text-slate-200`}
                  />
                </div>
                {errors.companyName && <p className="text-[10px] text-red-500 font-medium">{errors.companyName}</p>}
              </div>

              {/* Company Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Company Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="e.g. hello@acme.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/50 dark:bg-slate-900/50 focus:ring-1 text-sm outline-none transition-all placeholder:text-slate-400 ${
                      errors.companyEmail
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 dark:border-slate-800 focus:border-orange-500 focus:ring-orange-500/20"
                    } text-slate-800 dark:text-slate-200`}
                  />
                </div>
                {errors.companyEmail && <p className="text-[10px] text-red-500 font-medium">{errors.companyEmail}</p>}
              </div>

              {/* Company Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Company Phone *</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    disabled={loading}
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/50 dark:bg-slate-900/50 focus:ring-1 text-sm outline-none transition-all placeholder:text-slate-400 ${
                      errors.companyPhone
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 dark:border-slate-800 focus:border-orange-500 focus:ring-orange-500/20"
                    } text-slate-800 dark:text-slate-200`}
                  />
                </div>
                {errors.companyPhone && <p className="text-[10px] text-red-500 font-medium">{errors.companyPhone}</p>}
              </div>

              {/* Company Size */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Company Size *</label>
                <select
                  disabled={loading}
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
                >
                  <option value="1-10">1-10 Employees</option>
                  <option value="11-50">11-50 Employees</option>
                  <option value="51-200">51-200 Employees</option>
                  <option value="201-500">201-500 Employees</option>
                  <option value="500+">500+ Employees</option>
                </select>
              </div>

              {/* Industry */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Industry *</label>
                <select
                  disabled={loading}
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
                >
                  <option value="Information Technology">Information Technology</option>
                  <option value="Real Estate">Real Estate (रियल एस्टेट)</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Healthcare">Healthcare & Biotech</option>
                  <option value="Education">Education / EdTech</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail & E-commerce">Retail & E-commerce</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Country */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Country *</label>
                <select
                  disabled={loading}
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
                >
                  <option value="India">India (भारत)</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Singapore">Singapore</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                </select>
              </div>

              {/* Time Zone */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Time Zone *</label>
                <select
                  disabled={loading}
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
                >
                  <option value="IST (UTC+05:30)">IST (UTC+05:30) Kolkata/Raipur</option>
                  <option value="EST (UTC-05:00)">EST (UTC-05:00) Eastern Time</option>
                  <option value="PST (UTC-08:00)">PST (UTC-08:00) Pacific Time</option>
                  <option value="GMT (UTC+00:00)">GMT (UTC+00:00) London</option>
                  <option value="GST (UTC+04:00)">GST (UTC+04:00) Dubai</option>
                  <option value="SGT (UTC+08:00)">SGT (UTC+08:00) Singapore</option>
                </select>
              </div>

              {/* Currency */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Currency *</label>
                <select
                  disabled={loading}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
                >
                  <option value="INR">INR (₹) Indian Rupee</option>
                  <option value="USD">USD ($) US Dollar</option>
                  <option value="GBP">GBP (£) British Pound</option>
                  <option value="SGD">SGD (S$) Singapore Dollar</option>
                  <option value="AED">AED (DH) UAE Dirham</option>
                </select>
              </div>

            </div>
          </div>

          {/* Section 2: Main Admin Profile */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <h3 className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
              <User className="w-4 h-4" /> 2. Admin Security Credentials (व्यवस्थापक क्रेडेंशियल)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Admin Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Admin Name *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="e.g. Shrikant Patel"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Admin Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Admin Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    disabled={loading}
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="e.g. shrikant@acme.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/50 dark:bg-slate-900/50 focus:ring-1 text-sm outline-none transition-all placeholder:text-slate-400 ${
                      errors.adminEmail
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 dark:border-slate-800 focus:border-orange-500 focus:ring-orange-500/20"
                    } text-slate-800 dark:text-slate-200`}
                  />
                </div>
                {errors.adminEmail && <p className="text-[10px] text-red-500 font-medium">{errors.adminEmail}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Password *</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/50 dark:bg-slate-900/50 focus:ring-1 text-sm outline-none transition-all placeholder:text-slate-400 ${
                      errors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 dark:border-slate-800 focus:border-orange-500 focus:ring-orange-500/20"
                    } text-slate-800 dark:text-slate-200`}
                  />
                </div>
                {/* Password strength indicator */}
                {password && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                      <span>STRENGTH: <span className="uppercase text-slate-600 dark:text-slate-200">{passwordStrength.text}</span></span>
                      <span>{passwordStrength.score}/5</span>
                    </div>
                    <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
                {errors.password && <p className="text-[10px] text-red-500 font-medium">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">Confirm Password *</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    disabled={loading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border bg-white/50 dark:bg-slate-900/50 focus:ring-1 text-sm outline-none transition-all placeholder:text-slate-400 ${
                      errors.confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-200 dark:border-slate-800 focus:border-orange-500 focus:ring-orange-500/20"
                    } text-slate-800 dark:text-slate-200`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-[10px] text-red-500 font-medium">{errors.confirmPassword}</p>}
              </div>

            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" /> Already have an account? Sign In
            </button>
            <button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full sm:w-auto px-8 py-3 text-sm font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md hover:shadow-lg hover:shadow-orange-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Workspace...
                </>
              ) : (
                <>
                  Register & Configure Setup
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
