import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  BarChart3, 
  Sparkles, 
  FileDown, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  BookOpen
} from "lucide-react";
import { CountryRule, RowResult, ValidationSummary, ChatMessage } from "./types";
import { validateDataset } from "./utils/validation";

// Component imports
import UploadTab from "./components/UploadTab";
import DashboardTab from "./components/DashboardTab";
import AssistantTab from "./components/AssistantTab";
import ExportTab from "./components/ExportTab";
import GuideTab from "./components/GuideTab";

export default function App() {
  // Navigation active state - starts on the 'guide' or 'upload' panel
  const [activeTab, setActiveTab] = useState<"upload" | "dashboard" | "assistant" | "export" | "guide">("guide");
  
  // Custom rules configuration for phone digit checkpoints
  const [countryRules, setCountryRules] = useState<CountryRule[]>([
    { country: "India", digits: 10 },
    { country: "Singapore", digits: 8 },
    { country: "USA", digits: 10 },
    { country: "UK", digits: 11 },
    { country: "UAE", digits: 9 },
  ]);
  
  // Active date format string for checking valid calendars
  const [dateFormat, setDateFormat] = useState<string>("YYYY-MM-DD");

  // Loaded File States for storage
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileLabel, setFileLabel] = useState<string>("" /* holds current uploaded csv name */);

  // Validation States containing computed failures or summary rate
  const [results, setResults] = useState<RowResult[]>([]);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);

  // Chat conversation logs for AI diagnostic assist
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Toast notifications manager
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; visible: boolean }>({
    message: "",
    type: "success",
    visible: false,
  });

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type, visible: true });
  };

  // Automatically fade out toast notifications after delay
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // Handle uploaded spreadsheet files payload
  const handleFileLoaded = (parsedHeaders: string[], parsedRows: Record<string, string>[], filename: string) => {
    setHeaders(parsedHeaders);
    setRows(parsedRows);
    setFileLabel(filename);
    
    // Clear previous results to avoid stale reports
    setResults([]);
    setSummary(null);
  };

  // Run main validation sequence
  const handleRunValidation = () => {
    if (rows.length === 0) return;
    setIsValidating(true);
    setValidationProgress(0);

    // Progressive step simulation to keep the main event-loop non-blocking
    let currentPct = 0;
    const interval = setInterval(() => {
      currentPct += 15;
      if (currentPct >= 90) {
        clearInterval(interval);
        
        // Execute robust validation algorithm
        try {
          const { results: validationResults, summary: validationSummary } = validateDataset(
            headers,
            rows,
            countryRules,
            dateFormat,
            (progressPct) => {
              // progressive engine logs
            }
          );
          
          setResults(validationResults);
          setSummary(validationSummary);
          setValidationProgress(100);
          
          setTimeout(() => {
            setIsValidating(false);
            setActiveTab("dashboard");
            showToast(`Validation complete. Found ${validationSummary.failed} failing cells across ${validationSummary.total} entries!`, "success");
          }, 300);

        } catch (err: any) {
          clearInterval(interval);
          setIsValidating(false);
          showToast(`Validation pipeline failed: ${err.message}`, "error");
        }
      } else {
        setValidationProgress(currentPct);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans antialiased text-slate-800">
      
      {/* Toast alert system layout */}
      {toast.visible && (
        <div className="fixed top-5 right-5 z-50 animate-bounce-short">
          <div className={`flex items-center gap-2.5 px-4.5 py-3 rounded-xl shadow-lg border text-xs font-semibold ${
            toast.type === "success" 
              ? "bg-slate-900 border-slate-800 text-emerald-400" 
              : "bg-rose-900 border-rose-800 text-rose-100"
          }`}>
            {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Sidebar Navigator + Canvas Screens */}
      <div className="flex-1 flex flex-col md:flex-row h-full">
        
        {/* Dark Navy Sidebar Navigator */}
        <aside className="w-full md:w-[240px] bg-[#0f172a] text-[#f8fafc] flex flex-col justify-between py-6 shrink-0 z-10 p-5 border-r border-[#1e293b]">
          
          {/* Logo & Slogan Header Card */}
          <div className="space-y-8 text-left">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#3b82f6]" />
                <h1 className="text-[20px] font-bold tracking-tight text-[#f8fafc] font-sans">CleanIQ</h1>
              </div>
              <p className="text-[12px] text-[#64748b] mt-1 font-medium tracking-wide">AI-Powered Validation</p>
            </div>

            {/* Ingestion status monitor */}
            {fileLabel && (
              <div className="bg-[#1e293b]/70 border border-[#334155]/60 rounded-xl px-3.5 py-2.5 text-left space-y-1">
                <span className="text-[9px] uppercase tracking-wider text-[#94a3b8] font-semibold block">Loaded Spreadsheet</span>
                <span className="text-xs text-[#3b82f6] truncate block font-bold">{fileLabel}</span>
              </div>
            )}

            {/* Nav Links Stack */}
            <nav className="space-y-1">
              {/* Help & Guide Tab (Unlocked by default for zero-friction setup) */}
              <button
                onClick={() => setActiveTab("guide")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "guide"
                    ? "bg-[#1e293b] text-[#f8fafc] border-r-3 border-[#3b82f6]"
                    : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-[#f8fafc]"
                }`}
              >
                <BookOpen className="h-[18px] w-[18px]" />
                How to Use App
              </button>

              <button
                onClick={() => setActiveTab("upload")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === "upload"
                    ? "bg-[#1e293b] text-[#f8fafc] border-r-3 border-[#3b82f6]"
                    : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-[#f8fafc]"
                }`}
              >
                <FileSpreadsheet className="h-[18px] w-[18px]" />
                Upload & Configure
              </button>

              <button
                disabled={!summary}
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  !summary 
                    ? "opacity-45 cursor-not-allowed text-[#475569]" 
                    : activeTab === "dashboard"
                    ? "bg-[#1e293b] text-[#f8fafc] border-r-3 border-[#3b82f6]"
                    : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-[#f8fafc] cursor-pointer"
                }`}
              >
                <span className="flex items-center gap-3">
                  <BarChart3 className="h-[18px] w-[18px]" />
                  Validation Results
                </span>
                {!summary && <span className="text-[9px] font-bold text-[#64748b] bg-[#0f172a] border border-[#1e293b] px-1.5 py-0.5 rounded-sm">LOCK</span>}
              </button>

              <button
                disabled={!summary}
                onClick={() => setActiveTab("assistant")}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  !summary 
                    ? "opacity-45 cursor-not-allowed text-[#475569]" 
                    : activeTab === "assistant"
                    ? "bg-[#1e293b] text-[#f8fafc] border-r-3 border-[#3b82f6]"
                    : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-[#f8fafc] cursor-pointer"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Sparkles className="h-[18px] w-[18px]" />
                  AI Assistant
                </span>
                {!summary && <span className="text-[9px] font-bold text-[#64748b] bg-[#0f172a] border border-[#1e293b] px-1.5 py-0.5 rounded-sm">LOCK</span>}
              </button>

              <button
                disabled={!summary}
                onClick={() => setActiveTab("export")}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  !summary 
                    ? "opacity-45 cursor-not-allowed text-[#475569]" 
                    : activeTab === "export"
                    ? "bg-[#1e293b] text-[#f8fafc] border-r-3 border-[#3b82f6]"
                    : "text-[#94a3b8] hover:bg-[#1e293b]/50 hover:text-[#f8fafc] cursor-pointer"
                }`}
              >
                <span className="flex items-center gap-3">
                  <FileDown className="h-[18px] w-[18px]" />
                  Export Report
                </span>
                {!summary && <span className="text-[9px] font-bold text-[#64748b] bg-[#0f172a] border border-[#1e293b] px-1.5 py-0.5 rounded-sm">LOCK</span>}
              </button>
            </nav>
          </div>

          {/* Footer branding */}
          <div className="text-left py-2 border-t border-[#1e293b]/60 pt-4 hidden md:block">
            <span className="text-[10px] text-[#64748b] font-medium">Enterprise Engine v2.4</span>
            <div className="flex items-center gap-1.5 mt-1 text-[9px] text-[#94a3b8] font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
              Active Workspace
            </div>
          </div>
        </aside>

        {/* Main Workspace Frame */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
          
          {/* Top Info Banner */}
          <header className="h-[60px] bg-white border-b border-slate-100 px-8 flex items-center justify-between shrink-0">
            <div className="text-left font-sans">
              <h2 className="text-sm font-semibold text-slate-700 capitalize">
                Workspace / {
                  activeTab === "guide" ? "Interactive Manual" :
                  activeTab === "upload" ? "Upload & Rules Ingestion" : 
                  activeTab === "dashboard" ? "Data Integrity Diagnostics" : 
                  activeTab === "assistant" ? "AI Diagnostics Chat" : 
                  "Split & Export Package"
                }
              </h2>
            </div>
            
            {/* Session stats bubble */}
            {summary && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-sm">
                  Rate: <strong className="text-indigo-600 font-bold">{summary.passRate}%</strong>
                </span>
              </div>
            )}
          </header>

          {/* Tab Canvas Content area container */}
          <div className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
            {activeTab === "guide" && (
              <GuideTab />
            )}

            {activeTab === "upload" && (
              <UploadTab
                countryRules={countryRules}
                setCountryRules={setCountryRules}
                dateFormat={dateFormat}
                setDateFormat={setDateFormat}
                onFileLoaded={handleFileLoaded}
                onRunValidation={handleRunValidation}
                isValidating={isValidating}
                validationProgress={validationProgress}
                toastMessage={showToast}
              />
            )}

            {/* Safe lock banner guards for remaining panels */}
            {!summary && activeTab !== "upload" && activeTab !== "guide" ? (
              <div className="h-[350px] bg-white border border-slate-200/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-xs animate-fade-in max-w-md mx-auto my-12">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Diagnostics Sandbox Inactive</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2 mb-6">
                  Please upload a transaction CSV file and run the validation pipeline under the Upload panel to unlock analytics charts and AI co-pilots.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab("guide")}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    View Practical Guide
                  </button>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="px-4.5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Return to Upload Panel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {activeTab === "dashboard" && summary && (
                  <DashboardTab
                    summary={summary}
                    results={results}
                    headers={headers}
                  />
                )}

                {activeTab === "assistant" && summary && (
                  <AssistantTab
                    summary={summary}
                    results={results}
                    chatHistory={chatHistory}
                    setChatHistory={setChatHistory}
                  />
                )}

                {activeTab === "export" && summary && (
                  <ExportTab
                    summary={summary}
                    results={results}
                    headers={headers}
                    toastMessage={showToast}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

    </div>
  );
}
