import React from "react";
import { 
  BookOpen, 
  Settings, 
  HelpCircle, 
  CheckCircle2, 
  Smartphone, 
  Calendar, 
  AlertCircle, 
  Sparkles,
  Layers,
  FileSpreadsheet
} from "lucide-react";

/**
 * GuideTab Component
 * 
 * Provides responsive, highly styled instructional content explaining the application 
 * features, validation logic parameters, and dataset mapping standard guidelines.
 */
export default function GuideTab() {
  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* Welcome Banner Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-[#3b82f6] text-[11px] font-bold uppercase tracking-wider rounded">
            <BookOpen className="h-3 w-3" /> Quick Setup Manual
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Welcome to CleanIQ</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            CleanIQ provides robust regional constraint checking, ISO formatting checks, duplicate tracking, and AI-assisted debugging to sanitize your spreadsheets before ledger integration.
          </p>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hidden lg:block">
          <FileSpreadsheet className="h-10 w-10 text-[#3b82f6]" />
        </div>
      </div>

      {/* Grid: 3 Steps Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Step 1 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#3b82f6]" />
          <div className="text-xs font-bold text-slate-400 mb-2 font-mono">STEP 01</div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">Upload & Rules Configuration</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Upload CSV/XLSX text transaction datasets (supports columns like order-level ids, numeric fields, phone numbers, date formats). Refine country-specific phone digit rules and standard date formats in real time.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#ef4444]" />
          <div className="text-xs font-bold text-slate-400 mb-2 font-mono">STEP 02</div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">Diagnostic Isolation</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Review failures via the interactive **Validation Results** tab. Look at high-level error distributions, column failure levels, and locate row conflicts with inline descriptions.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <div className="text-xs font-bold text-slate-400 mb-2 font-mono">STEP 03</div>
          <h3 className="text-sm font-bold text-slate-800 mb-2">Cleanse & Export Pack</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Choose to download the complete file with standard validation indicators, or download partitioned CSV safe zip structures if your list is too large for legacy memory targets.
          </p>
        </div>

      </div>

      {/* Grid Layout: Detailed Rules Specifications & Column Schemas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Phone & Date Formats Validation Guides */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-[#3b82f6]" /> Phone & Date Validation Engines
          </h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">Country Regional Rules Mapping</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                The engine cleanses punctuation codes (e.g., brackets <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">()</code>, dashes <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">-</code>, leading <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">+</code> signs) and compares the resulting absolute numeric length with your configurable list parameters:
              </p>
              <ul className="grid grid-cols-2 gap-2 mt-2">
                <li className="text-[11px] bg-slate-50 border border-slate-100 p-2 rounded flex items-center justify-between">
                  <span className="font-semibold text-slate-650">India</span>
                  <span className="font-mono text-slate-500">10 Digits</span>
                </li>
                <li className="text-[11px] bg-slate-50 border border-slate-100 p-2 rounded flex items-center justify-between">
                  <span className="font-semibold text-slate-650">Singapore</span>
                  <span className="font-mono text-slate-500">8 Digits</span>
                </li>
                <li className="text-[11px] bg-slate-50 border border-slate-100 p-2 rounded flex items-center justify-between">
                  <span className="font-semibold text-slate-650">USA</span>
                  <span className="font-mono text-slate-500">10 Digits</span>
                </li>
                <li className="text-[11px] bg-slate-50 border border-slate-100 p-2 rounded flex items-center justify-between">
                  <span className="font-semibold text-slate-650">UK</span>
                  <span className="font-mono text-slate-500">11 Digits</span>
                </li>
              </ul>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#3b82f6]" /> ISO 8601 & Date Compliance
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Configure your dataset timestamp format (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">YYYY-MM-DD</code> or <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono">DD/MM/YYYY</code>). The system tests validity checks to prevent out-of-bounds days, leap-year overflows, or string parsing breakdowns.
              </p>
            </div>
          </div>
        </div>

        {/* Data Schema Specs & Data Fields Guidance */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#3b82f6]" /> Automated Field & Header Mapping
          </h3>

          <div className="space-y-4 text-xs text-slate-500 leading-relaxed">
            <p>
              CleanIQ automatically crawls common CSV file headers to determine your dataset schema context. Here are the column heuristics used in validation logic:
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6] mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-850 font-semibold block">Data Integrity check:</strong>
                  Matches mandatory fields (IDs, emails) for invalid blank cells. It validates syntactic emails based on RFC patterns.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-850 font-semibold block">Numeric check:</strong>
                  Identifies columns containing numeric tokens (e.g., transaction prices, units, indices) to verify non-negative limits, zero offsets, or corrupt floats.
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div>
                  <strong className="text-slate-850 font-semibold block">Duplicate tracking:</strong>
                  Scours transaction datasets for non-unique order records or overlapping keys, raising flags for dual-submitted actions.
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] text-slate-450 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#3b82f6]" />
              <span>
                <strong>Smart Diagnostics Tool:</strong> Use the <strong>AI Diagnostics Assistant</strong> to converse with your dataset report natively and write customized formulas.
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
