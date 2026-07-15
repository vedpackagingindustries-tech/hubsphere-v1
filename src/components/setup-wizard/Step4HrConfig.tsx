import React, { useState } from "react";
import { Clock, Calendar, HelpCircle, FileText, Check, Award, AlertCircle } from "lucide-react";

interface Step4Props {
  data: {
    workingDays: string[];
    workingHours: string;
    leavePolicy: string;
    holidayCalendar: string;
    payrollCycle: string;
    salaryStructure: string;
  };
  onChange: (fields: Partial<Step4Props["data"]>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const ALL_DAYS = [
  { label: "Mon", value: "Monday" },
  { label: "Tue", value: "Tuesday" },
  { label: "Wed", value: "Wednesday" },
  { label: "Thu", value: "Thursday" },
  { label: "Fri", value: "Friday" },
  { label: "Sat", value: "Saturday" },
  { label: "Sun", value: "Sunday" }
];

export default function Step4HrConfig({ data, onChange, onNext, onPrev }: Step4Props) {
  const [error, setError] = useState("");

  const toggleDay = (day: string) => {
    let updated;
    if (data.workingDays.includes(day)) {
      updated = data.workingDays.filter((d) => d !== day);
    } else {
      updated = [...data.workingDays, day];
    }
    onChange({ workingDays: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.workingDays.length === 0) {
      setError("Please select at least one working day.");
      return;
    }
    if (!data.workingHours.trim()) {
      setError("Working hours are required.");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">HR & Payroll Configuration</h2>
        <p className="text-sm text-slate-500 mt-1">Set work weeks, standard working hours, leave rules, and employee payment structures.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Working Days Select */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Working Days (कार्य दिवस) <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-7 gap-1.5">
          {ALL_DAYS.map((day) => {
            const isSelected = data.workingDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`py-2 rounded-xl text-xs font-semibold transition-all border ${
                  isSelected
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/10"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Working Hours / Shifts */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Working Shift Hours (काम के घंटे) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={data.workingHours}
              onChange={(e) => onChange({ workingHours: e.target.value })}
              placeholder="e.g. 09:30 AM - 06:30 PM"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Holiday Calendar */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Holiday Calendar (छुट्टियों का कैलेंडर)
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={data.holidayCalendar}
              onChange={(e) => onChange({ holidayCalendar: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
            >
              <option value="India">Indian National & Gazetted Holidays (भारतीय छुट्टियां)</option>
              <option value="US">US Federal Holidays (यूएस छुट्टियां)</option>
              <option value="UK">UK Bank Holidays</option>
              <option value="None">Custom Holidays List Only</option>
            </select>
          </div>
        </div>

        {/* Leave Policy */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Leave Allotment Policy (अवकाश आवंटन नीति)
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={data.leavePolicy}
              onChange={(e) => onChange({ leavePolicy: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
            >
              <option value="Standard">18 Casual Leaves + 12 Sick Leaves / Year</option>
              <option value="Liberal">24 Casual Leaves + 15 Sick + 10 Earned / Year</option>
              <option value="Minimalist">12 Casual Leaves + 8 Sick Leaves / Year</option>
              <option value="UnpaidOnly">Loss of Pay / Unpaid Leaves Only</option>
            </select>
          </div>
        </div>

        {/* Payroll Cycle */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Payroll Settlement Cycle (वेतन चक्र)
          </label>
          <select
            value={data.payrollCycle}
            onChange={(e) => onChange({ payrollCycle: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
          >
            <option value="Monthly_1st">Monthly (1st to Last Day of Month)</option>
            <option value="Monthly_7th">Monthly (7th to 7th of next Month)</option>
            <option value="BiWeekly">Bi-Weekly (Every 2 weeks)</option>
            <option value="Weekly">Weekly (Every Friday)</option>
          </select>
        </div>

        {/* Salary Structure */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Standard Employee Compensation Model (वेतन संरचना)
          </label>
          <select
            value={data.salaryStructure}
            onChange={(e) => onChange({ salaryStructure: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
          >
            <option value="BasePlusCommission">Fixed Salary Base + TeleCRM Sales Commission (Recommended)</option>
            <option value="PureCommission">Commission / Incentive-Only Model (No Base)</option>
            <option value="FlatSalary">Fixed Flat Salary Model (No Incentives)</option>
            <option value="HourlyRate">Hourly Work Rates with Timesheet Logs</option>
          </select>
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
          Continue to Summary
        </button>
      </div>
    </form>
  );
}
