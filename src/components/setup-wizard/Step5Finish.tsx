import React, { useState } from "react";
import { Check, Loader2, Sparkles, AlertCircle, ShieldCheck, Landmark, Workflow, CalendarCheck2 } from "lucide-react";

interface Step5Props {
  companyName: string;
  wizardData: {
    companyInfo: {
      logo: string;
      address: string;
      gst: string;
      website: string;
      fiscalYear: string;
    };
    orgSetup: {
      departments: string[];
      branches: string[];
      designations: string[];
      employeePrefix: string;
      attendanceMethod: string;
    };
    crmConfig: {
      leadSources: string[];
      pipelineStages: string[];
      leadStatus: string[];
      defaultAssignmentRule: string;
    };
    hrConfig: {
      workingDays: string[];
      workingHours: string;
      leavePolicy: string;
      holidayCalendar: string;
      payrollCycle: string;
      salaryStructure: string;
    };
  };
  onComplete: () => Promise<void>;
  onPrev: () => void;
}

export default function Step5Finish({ companyName, wizardData, onComplete, onPrev }: Step5Props) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleActivate = async () => {
    setStatus("submitting");
    setErrorMessage("");
    try {
      await onComplete();
      setStatus("success");
    } catch (err: any) {
      console.error("Setup activation failed:", err);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred during activation. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-10 space-y-6">
        <div className="relative inline-flex items-center justify-center">
          {/* Animated pulsing rings */}
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping duration-1000" />
          <div className="absolute -inset-3 bg-green-500/10 rounded-full animate-pulse" />
          <div className="relative w-20 h-20 bg-gradient-to-tr from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/20 scale-100 animate-[bounce_1s_infinite]">
            <Check className="w-10 h-10 stroke-[3]" />
          </div>
        </div>

        <div className="space-y-2 max-w-sm mx-auto">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center justify-center gap-1.5">
            Workspace Active! <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Congratulations! <strong>{companyName}</strong> has been initialized successfully. Your enterprise portal is now ready.
          </p>
        </div>

        <div className="pt-4 max-w-xs mx-auto">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-mono">
            Redirecting to Admin Dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Review & Activate</h2>
        <p className="text-sm text-slate-500 mt-1">Verify your company configurations before generating the workspace.</p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-1">
        {/* Company Info Box */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5" /> Company & Legal Info
          </h3>
          <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
            <div><span className="font-medium text-slate-400">Name:</span> <span className="font-semibold text-slate-800 dark:text-slate-200">{companyName}</span></div>
            <div><span className="font-medium text-slate-400">Address:</span> {wizardData.companyInfo.address}</div>
            <div><span className="font-medium text-slate-400">GSTIN:</span> {wizardData.companyInfo.gst || "Not Provided"}</div>
            <div><span className="font-medium text-slate-400">Website:</span> {wizardData.companyInfo.website || "Not Provided"}</div>
            <div><span className="font-medium text-slate-400">Fiscal Year:</span> Starts in {wizardData.companyInfo.fiscalYear}</div>
          </div>
        </div>

        {/* Org Setup Box */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Organizational Setup
          </h3>
          <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
            <div><span className="font-medium text-slate-400">Departments ({wizardData.orgSetup.departments.length}):</span> {wizardData.orgSetup.departments.join(", ")}</div>
            <div><span className="font-medium text-slate-400">Branches ({wizardData.orgSetup.branches.length}):</span> {wizardData.orgSetup.branches.join(", ")}</div>
            <div><span className="font-medium text-slate-400">Designations ({wizardData.orgSetup.designations.length}):</span> {wizardData.orgSetup.designations.join(", ")}</div>
            <div><span className="font-medium text-slate-400">Employee Prefix:</span> <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{wizardData.orgSetup.employeePrefix}</span></div>
            <div><span className="font-medium text-slate-400">Attendance:</span> {wizardData.orgSetup.attendanceMethod}</div>
          </div>
        </div>

        {/* CRM Config Box */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Workflow className="w-3.5 h-3.5" /> CRM Configuration
          </h3>
          <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
            <div><span className="font-medium text-slate-400">Lead Sources ({wizardData.crmConfig.leadSources.length}):</span> {wizardData.crmConfig.leadSources.join(", ")}</div>
            <div><span className="font-medium text-slate-400">Pipeline Stages ({wizardData.crmConfig.pipelineStages.length}):</span> {wizardData.crmConfig.pipelineStages.join(", ")}</div>
            <div><span className="font-medium text-slate-400">Lead Statuses ({wizardData.crmConfig.leadStatus.length}):</span> {wizardData.crmConfig.leadStatus.join(", ")}</div>
            <div><span className="font-medium text-slate-400">Assignment algorithm:</span> {wizardData.crmConfig.defaultAssignmentRule}</div>
          </div>
        </div>

        {/* HR Config Box */}
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <CalendarCheck2 className="w-3.5 h-3.5" /> HR & Leave Config
          </h3>
          <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
            <div><span className="font-medium text-slate-400">Work Week:</span> {wizardData.hrConfig.workingDays.join(", ")}</div>
            <div><span className="font-medium text-slate-400">Shift Hours:</span> {wizardData.hrConfig.workingHours}</div>
            <div><span className="font-medium text-slate-400">Leave Policy:</span> {wizardData.hrConfig.leavePolicy}</div>
            <div><span className="font-medium text-slate-400">Holiday Calendar:</span> {wizardData.hrConfig.holidayCalendar} Holidays</div>
            <div><span className="font-medium text-slate-400">Payroll settlement:</span> {wizardData.hrConfig.payrollCycle}</div>
            <div><span className="font-medium text-slate-400">Salary structure:</span> {wizardData.hrConfig.salaryStructure}</div>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-orange-500/5 dark:bg-orange-500/10 rounded-2xl border border-orange-500/20 flex gap-3 text-xs text-orange-600 dark:text-orange-400 leading-relaxed">
        <Sparkles className="w-5 h-5 shrink-0 text-orange-500" />
        <p>
          By activating the workspace, we will automatically set up CRM pipelines, generate payroll calendars, map organizational databases, and configure administrator security roles for instant operation.
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <button
          type="button"
          disabled={status === "submitting"}
          onClick={onPrev}
          className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
        >
          Previous Step
        </button>
        <button
          type="button"
          disabled={status === "submitting"}
          onClick={handleActivate}
          className="px-6 py-2.5 text-sm font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md hover:shadow-lg hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2 min-w-[160px]"
        >
          {status === "submitting" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Activating...
            </>
          ) : (
            <>
              Activate Workspace
            </>
          )}
        </button>
      </div>
    </div>
  );
}
