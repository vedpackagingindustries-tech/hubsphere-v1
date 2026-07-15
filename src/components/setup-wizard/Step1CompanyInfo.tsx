import React, { useState } from "react";
import { Upload, Building2, MapPin, Globe, Award, Calendar, AlertCircle } from "lucide-react";

interface Step1Props {
  data: {
    logo: string;
    address: string;
    gst: string;
    website: string;
    fiscalYear: string;
  };
  onChange: (fields: Partial<Step1Props["data"]>) => void;
  onNext: () => void;
}

export default function Step1CompanyInfo({ data, onChange, onNext }: Step1Props) {
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file for the company logo.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onloadend = () => {
      onChange({ logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.address.trim()) {
      setError("Company address is required.");
      return;
    }
    if (!data.fiscalYear) {
      setError("Fiscal year starting month is required.");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <form id="step1-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Company Information</h2>
        <p className="text-sm text-slate-500 mt-1">Provide basic information about your business to set up the default profile.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Logo Upload Section */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Company Logo (कंपनी लोगो)
        </label>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {data.logo ? (
            <div className="relative group w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shrink-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
              <img src={data.logo} alt="Uploaded logo" className="w-full h-full object-contain p-2" />
              <button
                type="button"
                onClick={() => onChange({ logo: "" })}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs text-white font-medium transition-opacity"
              >
                Change Logo
              </button>
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`w-full h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                dragActive
                  ? "border-orange-500 bg-orange-50/10"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50"
              }`}
              onClick={() => document.getElementById("logo-input")?.click()}
            >
              <Upload className="w-5 h-5 text-slate-400 mb-1" />
              <p className="text-xs text-slate-500">Drag & drop logo, or <span className="text-orange-500 font-semibold">browse</span></p>
              <p className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, WebP</p>
              <input
                id="logo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Address */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Registered Address (पंजीकृत पता) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <textarea
              required
              rows={2}
              value={data.address}
              onChange={(e) => onChange({ address: e.target.value })}
              placeholder="e.g. Suite 404, Tech Park, Raipur, CG - 492001"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* GST / Tax ID */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            GSTIN / Tax ID (वैकल्पिक)
          </label>
          <div className="relative">
            <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={data.gst}
              onChange={(e) => onChange({ gst: e.target.value.toUpperCase() })}
              placeholder="e.g. 22AAAAA0000A1Z5"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Website */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Website (वेबसाइट)
          </label>
          <div className="relative">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="url"
              value={data.website}
              onChange={(e) => onChange({ website: e.target.value })}
              placeholder="e.g. https://www.acme-ent.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all placeholder:text-slate-400 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>

        {/* Fiscal Year Cycle */}
        <div className="space-y-1.5 md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Fiscal Year Starting Month (वित्तीय वर्ष की शुरुआत) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              required
              value={data.fiscalYear}
              onChange={(e) => onChange({ fiscalYear: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm outline-none transition-all text-slate-800 dark:text-slate-200"
            >
              <option value="April">April - March (Standard Indian FY / भारतीय वित्तीय वर्ष)</option>
              <option value="January">January - December (Calendar Year / कैलेंडर वर्ष)</option>
              <option value="July">July - June</option>
              <option value="October">October - September</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-md hover:shadow-lg hover:shadow-orange-500/10 transition-all flex items-center justify-center"
        >
          Continue to Step 2
        </button>
      </div>
    </form>
  );
}
