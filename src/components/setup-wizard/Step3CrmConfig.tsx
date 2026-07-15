import React, { useState } from "react";
import { Plus, X, Layers, Share2, ToggleLeft, HelpCircle, GitPullRequest, Info } from "lucide-react";

interface Step3Props {
  data: {
    leadSources: string[];
    pipelineStages: string[];
    leadStatus: string[];
    defaultAssignmentRule: string;
  };
  onChange: (fields: Partial<Step3Props["data"]>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Step3CrmConfig({ data, onChange, onNext, onPrev }: Step3Props) {
  const [error, setError] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newStage, setNewStage] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const addSource = () => {
    if (!newSource.trim()) return;
    if (data.leadSources.includes(newSource.trim())) {
      setError("Lead source already exists.");
      return;
    }
    setError("");
    onChange({ leadSources: [...data.leadSources, newSource.trim()] });
    setNewSource("");
  };

  const removeSource = (index: number) => {
    onChange({ leadSources: data.leadSources.filter((_, i) => i !== index) });
  };

  const addStage = () => {
    if (!newStage.trim()) return;
    if (data.pipelineStages.includes(newStage.trim())) {
      setError("Pipeline stage already exists.");
      return;
    }
    setError("");
    onChange({ pipelineStages: [...data.pipelineStages, newStage.trim()] });
    setNewStage("");
  };

  const removeStage = (index: number) => {
    onChange({ pipelineStages: data.pipelineStages.filter((_, i) => i !== index) });
  };

  const addStatus = () => {
    if (!newStatus.trim()) return;
    if (data.leadStatus.includes(newStatus.trim())) {
      setError("Lead status already exists.");
      return;
    }
    setError("");
    onChange({ leadStatus: [...data.leadStatus, newStatus.trim()] });
    setNewStatus("");
  };

  const removeStatus = (index: number) => {
    onChange({ leadStatus: data.leadStatus.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.leadSources.length === 0) {
      setError("At least one lead source is required.");
      return;
    }
    if (data.pipelineStages.length === 0) {
      setError("At least one pipeline stage is required.");
      return;
    }
    if (data.leadStatus.length === 0) {
      setError("At least one lead status is required.");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">CRM Configuration</h2>
        <p className="text-sm text-slate-500 mt-1">Configure lead generation sources, pipeline stages, status tracking, and dispatch rules.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Lead Sources */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Lead Sources (लीड स्रोत) <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Share2 className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="e.g. Google Ads, Facebook CRM, Indiamart, Cold Call"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSource())}
            />
          </div>
          <button
            type="button"
            onClick={addSource}
            className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {data.leadSources.map((src, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full border border-amber-500/20"
            >
              {src}
              <button type="button" onClick={() => removeSource(i)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Sales Pipeline Stages (बिक्री चरण) <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <GitPullRequest className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              placeholder="e.g. Lead, Contacted, Demo Scheduled, Won, Lost"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStage())}
            />
          </div>
          <button
            type="button"
            onClick={addStage}
            className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {data.pipelineStages.map((stg, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-medium rounded-full border border-teal-500/20"
            >
              {stg}
              <button type="button" onClick={() => removeStage(i)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Lead Status */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Lead Status Filters (स्थिति फ़िल्टर) <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Layers className="absolute left-3 w-4 h-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              placeholder="e.g. New Lead, Ringing, Interested, DND"
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addStatus())}
            />
          </div>
          <button
            type="button"
            onClick={addStatus}
            className="px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {data.leadStatus.map((stat, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium rounded-full border border-violet-500/20"
            >
              {stat}
              <button type="button" onClick={() => removeStatus(i)} className="hover:text-red-500 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Default Lead Assignment Rule */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Auto Assignment Algorithm (लीड वितरण नियम)
          </label>
          <div className="group relative">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-950 text-[10px] text-white rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10 shadow-lg leading-relaxed">
              Determines how newly ingested leads are distributed among active telecallers.
            </div>
          </div>
        </div>
        <select
          value={data.defaultAssignmentRule}
          onChange={(e) => onChange({ defaultAssignmentRule: e.target.value })}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
        >
          <option value="RoundRobin">Round Robin (क्रमवार वितरण - Recommended)</option>
          <option value="Manual">Manual Allocation by Admin (मैनुअल आवंटन)</option>
          <option value="PerformanceBased">Performance Ratio (प्रदर्शन के आधार पर)</option>
          <option value="Random">Random Equal Distribution (यादृच्छिक समान वितरण)</option>
        </select>
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
          Continue to Step 4
        </button>
      </div>
    </form>
  );
}
