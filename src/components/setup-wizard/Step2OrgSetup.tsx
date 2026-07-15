import React, { useState } from "react";
import { Plus, X, Users, MapPin, Award, ShieldAlert, CheckCircle, Fingerprint, Wifi, Navigation } from "lucide-react";

interface Step2Props {
  data: {
    departments: string[];
    branches: string[];
    designations: string[];
    employeePrefix: string;
    attendanceMethod: string;
  };
  onChange: (fields: Partial<Step2Props["data"]>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step2OrgSetup({ data, onChange, onNext, onPrev }: Step2Props) {
  const [error, setError] = useState("");
  const [newDept, setNewDept] = useState("");
  const [newBranch, setNewBranch] = useState("");
  const [newDesig, setNewDesig] = useState("");

  const addDepartment = () => {
    if (!newDept.trim()) return;
    if (data.departments.includes(newDept.trim())) {
      setError("Department already added.");
      return;
    }
    setError("");
    onChange({ departments: [...data.departments, newDept.trim()] });
    setNewDept("");
  };

  const removeDepartment = (index: number) => {
    const updated = data.departments.filter((_, i) => i !== index);
    onChange({ departments: updated });
  };

  const addBranch = () => {
    if (!newBranch.trim()) return;
    if (data.branches.includes(newBranch.trim())) {
      setError("Branch already added.");
      return;
    }
    setError("");
    onChange({ branches: [...data.branches, newBranch.trim()] });
    setNewBranch("");
  };

  const removeBranch = (index: number) => {
    const updated = data.branches.filter((_, i) => i !== index);
    onChange({ branches: updated });
  };

  const addDesignation = () => {
    if (!newDesig.trim()) return;
    if (data.designations.includes(newDesig.trim())) {
      setError("Designation already added.");
      return;
    }
    setError("");
    onChange({ designations: [...data.designations, newDesig.trim()] });
    setNewDesig("");
  };

  const removeDesignation = (index: number) => {
    const updated = data.designations.filter((_, i) => i !== index);
    onChange({ designations: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.departments.length === 0) {
      setError("Please add at least one department.");
      return;
    }
    if (data.branches.length === 0) {
      setError("Please add at least one branch location.");
      return;
    }
    if (data.designations.length === 0) {
      setError("Please add at least one job designation.");
      return;
    }
    if (!data.employeePrefix.trim()) {
      setError("Employee code prefix is required.");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Organization Setup</h2>
        <p className="text-sm text-slate-500 mt-1">Structure your departments, branches, roles, and employee code formatting.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Departments Chip Input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Departments (विभाग) <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Users className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              placeholder="e.g. Sales, Marketing, Support, Tech"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDepartment())}
            />
          </div>
          <button
            type="button"
            onClick={addDepartment}
            className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {data.departments.map((dept, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-medium rounded-full border border-orange-500/20"
            >
              {dept}
              <button type="button" onClick={() => removeDepartment(i)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Branches Chip Input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Branches / Offices (शाखाएं) <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              placeholder="e.g. Headquarters, Raipur Office, Delhi Hub"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBranch())}
            />
          </div>
          <button
            type="button"
            onClick={addBranch}
            className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {data.branches.map((br, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full border border-amber-500/20"
            >
              {br}
              <button type="button" onClick={() => removeBranch(i)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Designations Chip Input */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Designations / Roles (पद) <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Award className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={newDesig}
              onChange={(e) => setNewDesig(e.target.value)}
              placeholder="e.g. Sales Executive, Tech Lead, Senior Developer"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDesignation())}
            />
          </div>
          <button
            type="button"
            onClick={addDesignation}
            className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {data.designations.map((ds, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium rounded-full border border-indigo-500/20"
            >
              {ds}
              <button type="button" onClick={() => removeDesignation(i)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Employee Code Prefix */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Employee Code Prefix (कर्मचारी कोड उपसर्ग) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={data.employeePrefix}
            onChange={(e) => onChange({ employeePrefix: e.target.value.toUpperCase() })}
            placeholder="e.g. ACME-"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 font-mono text-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Attendance Method */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Default Attendance Check Method (हाजिरी विधि)
          </label>
          <select
            value={data.attendanceMethod}
            onChange={(e) => onChange({ attendanceMethod: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
          >
            <option value="GPS">Office GPS Geofencing (जीपीएस जियो-फेंसिंग - Recommended)</option>
            <option value="WiFi">Office WiFi MAC Verification (वाईफ़ाई सत्यापन)</option>
            <option value="Biometric">Biometric Device Integration (बायोमेट्रिक)</option>
            <option value="Manual">Manual Approval (मैनुअल मंजूरी)</option>
          </select>
        </div>
      </div>

      {/* Visual representation of attendance methods */}
      <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80">
        <div className={`p-2.5 rounded-xl text-center border transition-all ${data.attendanceMethod === 'GPS' ? 'border-orange-500/30 bg-orange-500/5 text-orange-500' : 'border-transparent text-slate-400'}`}>
          <Navigation className="w-5 h-5 mx-auto mb-1" />
          <span className="text-[10px] font-bold block uppercase">Geofenced GPS</span>
        </div>
        <div className={`p-2.5 rounded-xl text-center border transition-all ${data.attendanceMethod === 'WiFi' ? 'border-orange-500/30 bg-orange-500/5 text-orange-500' : 'border-transparent text-slate-400'}`}>
          <Wifi className="w-5 h-5 mx-auto mb-1" />
          <span className="text-[10px] font-bold block uppercase">WiFi Check-in</span>
        </div>
        <div className={`p-2.5 rounded-xl text-center border transition-all ${data.attendanceMethod === 'Biometric' ? 'border-orange-500/30 bg-orange-500/5 text-orange-500' : 'border-transparent text-slate-400'}`}>
          <Fingerprint className="w-5 h-5 mx-auto mb-1" />
          <span className="text-[10px] font-bold block uppercase">Biometrics</span>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          Previous Step
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md hover:shadow-lg hover:shadow-orange-500/10 transition-all flex items-center justify-center"
        >
          Continue to Step 3
        </button>
      </div>
    </form>
  );
}
