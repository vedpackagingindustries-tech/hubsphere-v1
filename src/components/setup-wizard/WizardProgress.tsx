import React from "react";
import { Building2, Users, Sliders, CalendarClock, ShieldCheck } from "lucide-react";

interface ProgressProps {
  currentStep: number;
}

const STEPS = [
  { step: 1, label: "Info", desc: "Company Profile", icon: Building2 },
  { step: 2, label: "Structure", desc: "Org Hierarchy", icon: Users },
  { step: 3, label: "CRM", desc: "Lead Pipelines", icon: Sliders },
  { step: 4, label: "HR", desc: "Work & Pay", icon: CalendarClock },
  { step: 5, label: "Finish", desc: "Activation", icon: ShieldCheck }
];

export default function WizardProgress({ currentStep }: ProgressProps) {
  return (
    <div className="py-4 px-2 md:px-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/80 mb-6">
      {/* Mobile progress indicator */}
      <div className="flex md:hidden justify-between items-center px-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          Step {currentStep} of 5: {STEPS[currentStep - 1].label}
        </span>
        <div className="h-2 w-24 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop progress indicator */}
      <div className="hidden md:grid grid-cols-5 gap-4 relative">
        {STEPS.map((item, idx) => {
          const Icon = item.icon;
          const isCompleted = currentStep > item.step;
          const isActive = currentStep === item.step;

          return (
            <div key={item.step} className="flex flex-col items-center text-center relative">
              {/* Connector lines between steps */}
              {idx < STEPS.length - 1 && (
                <div className="absolute top-5 left-[55%] w-[90%] h-0.5 bg-slate-200 dark:bg-slate-800 -z-0">
                  <div
                    className="h-full bg-orange-500 transition-all duration-300"
                    style={{ width: currentStep > item.step ? "100%" : "0%" }}
                  />
                </div>
              )}

              {/* Step Circle */}
              <div
                className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                    : isActive
                    ? "bg-slate-800 text-orange-500 dark:bg-slate-100 dark:text-orange-500 shadow-md ring-2 ring-orange-500/20"
                    : "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              {/* Labels */}
              <div className="mt-2.5">
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isActive ? "text-orange-500" : isCompleted ? "text-slate-700 dark:text-slate-300" : "text-slate-400"
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
