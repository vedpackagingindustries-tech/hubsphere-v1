import React, { useState } from "react";
import WizardProgress from "./setup-wizard/WizardProgress";
import Step1CompanyInfo from "./setup-wizard/Step1CompanyInfo";
import Step2OrgSetup from "./setup-wizard/Step2OrgSetup";
import Step3CrmConfig from "./setup-wizard/Step3CrmConfig";
import Step4HrConfig from "./setup-wizard/Step4HrConfig";
import Step5Finish from "./setup-wizard/Step5Finish";
import { Sparkles, HelpCircle } from "lucide-react";

interface SetupWizardProps {
  tenantId: string;
  companyId: string;
  companyName: string;
  onSetupComplete: () => void;
}

export default function SetupWizard({ tenantId, companyId, companyName, onSetupComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // Unified State for Onboarding Wizard Config with premium industrial defaults
  const [wizardData, setWizardData] = useState({
    companyInfo: {
      logo: "",
      address: "",
      gst: "",
      website: "",
      fiscalYear: "April"
    },
    orgSetup: {
      departments: ["Sales", "Marketing", "Tech", "Support", "HR"],
      branches: ["Headquarters"],
      designations: ["Telecaller", "Team Lead", "Sales Manager", "Admin"],
      employeePrefix: "EMP-",
      attendanceMethod: "GPS"
    },
    crmConfig: {
      leadSources: ["Google Ads", "Facebook CRM", "Website Form", "Direct Reference", "Cold Call"],
      pipelineStages: ["Lead Ingested", "Contacted", "Demo Booked", "Proposal Sent", "Negotiation", "Won", "Lost"],
      leadStatus: ["New Lead", "Ringing / No Answer", "Follow Up Scheduled", "Interested", "DND / Rejected"],
      defaultAssignmentRule: "RoundRobin"
    },
    hrConfig: {
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      workingHours: "09:30 AM - 06:30 PM",
      leavePolicy: "Standard",
      holidayCalendar: "India",
      payrollCycle: "Monthly_1st",
      salaryStructure: "BasePlusCommission"
    }
  });

  const updateCompanyInfo = (fields: Partial<typeof wizardData.companyInfo>) => {
    setWizardData((prev) => ({
      ...prev,
      companyInfo: { ...prev.companyInfo, ...fields }
    }));
  };

  const updateOrgSetup = (fields: Partial<typeof wizardData.orgSetup>) => {
    setWizardData((prev) => ({
      ...prev,
      orgSetup: { ...prev.orgSetup, ...fields }
    }));
  };

  const updateCrmConfig = (fields: Partial<typeof wizardData.crmConfig>) => {
    setWizardData((prev) => ({
      ...prev,
      crmConfig: { ...prev.crmConfig, ...fields }
    }));
  };

  const updateHrConfig = (fields: Partial<typeof wizardData.hrConfig>) => {
    setWizardData((prev) => ({
      ...prev,
      hrConfig: { ...prev.hrConfig, ...fields }
    }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinalize = async () => {
    const payload = {
      tenantId,
      companyId,
      wizardData
    };

    const response = await fetch("/api/v1/auth/complete-setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `HTTP error ${response.status}: Failed to finalize setup.`);
    }

    // Delay redirect slightly to show animated success screen
    await new Promise((resolve) => setTimeout(resolve, 3000));
    onSetupComplete();
  };

  return (
    <div className="min-h-screen py-10 px-4 flex items-center justify-center bg-gradient-to-tr from-slate-100 to-indigo-50/40 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-4xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xl p-6 md:p-8 space-y-6">
        
        {/* Header Branding */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-5 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20">
              T
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5 leading-none">
                TeleCRM Onboarding Setup <Sparkles className="w-4 h-4 text-orange-500 fill-orange-500" />
              </h1>
              <p className="text-xs text-slate-400 mt-1">Initializing tenant profile for {companyName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs rounded-full border border-amber-500/10">
            Enterprise Tenant Wizard
          </div>
        </div>

        {/* Stepper progress bar */}
        <WizardProgress currentStep={currentStep} />

        {/* Dynamic rendering of step contents */}
        <div className="bg-white/90 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300">
          {currentStep === 1 && (
            <Step1CompanyInfo
              data={wizardData.companyInfo}
              onChange={updateCompanyInfo}
              onNext={handleNext}
            />
          )}

          {currentStep === 2 && (
            <Step2OrgSetup
              data={wizardData.orgSetup}
              onChange={updateOrgSetup}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {currentStep === 3 && (
            <Step3CrmConfig
              data={wizardData.crmConfig}
              onChange={updateCrmConfig}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {currentStep === 4 && (
            <Step4HrConfig
              data={wizardData.hrConfig}
              onChange={updateHrConfig}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}

          {currentStep === 5 && (
            <Step5Finish
              companyName={companyName}
              wizardData={wizardData}
              onComplete={handleFinalize}
              onPrev={handlePrev}
            />
          )}
        </div>
        
        {/* Help footer */}
        <div className="flex items-center gap-1.5 justify-center text-xs text-slate-400 pt-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Need help setting up your company profile? Read our Onboarding Guide or call support.</span>
        </div>
      </div>
    </div>
  );
}
