import React, { useState, useMemo } from "react";
import Papa from "papaparse";
import JSZip from "jszip";
import { Download, Library, FileCheck, FileWarning, HelpCircle, Archive, ClipboardList } from "lucide-react";
import { RowResult, ValidationSummary, NumericStats } from "../types";
import { calculateNumericStats } from "../utils/validation";

interface ExportTabProps {
  summary: ValidationSummary;
  results: RowResult[];
  headers: string[];
  toastMessage: (msg: string, type: "success" | "error") => void;
}

export default function ExportTab({ summary, results, headers, toastMessage }: ExportTabProps) {
  const [isSplitting, setIsSplitting] = useState(false);

  // Compute stats on numeric columns
  const numericStats = useMemo(() => {
    // Collect raw row formats
    const rawRows = results.map(r => r.data);
    return calculateNumericStats(headers, rawRows);
  }, [results, headers]);

  // Utility to convert parsed arrays back into CSV contents
  const makeCsvString = (headersToUse: string[], dataRows: Record<string, any>[]) => {
    return Papa.unparse({
      fields: headersToUse,
      data: dataRows,
    });
  };

  const triggerDownload = (csvString: string, filename: string) => {
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastMessage(`Downloaded ${filename} successfully!`, "success");
  };

  // 1. Download Cleaned CSV (Only PASS)
  const downloadCleanedCsv = () => {
    const cleanRows = results.filter(r => r.status === "PASS").map(r => r.data);
    if (cleanRows.length === 0) {
      toastMessage("There are no passed/correct rows to export.", "error");
      return;
    }
    const csv = makeCsvString(headers, cleanRows);
    triggerDownload(csv, "cleaned_transactions_report.csv");
  };

  // 2. Download Error Report (Only FAIL with errors appended)
  const downloadErrorReport = () => {
    const failedResults = results.filter(r => r.status === "FAIL");
    if (failedResults.length === 0) {
      toastMessage("Amazing! No errors detected. Nothing to export here.", "success");
      return;
    }

    const compiledRows = failedResults.map(r => ({
      ...r.data,
      DIAGNOSTICS_ERRORS: r.errors.map(err => `[${err.column}] ${err.message}`).join(" || "),
    }));

    const csvHeaders = [...headers, "DIAGNOSTICS_ERRORS"];
    const csv = makeCsvString(csvHeaders, compiledRows);
    triggerDownload(csv, "failed_transactions_diagnostics.csv");
  };

  // 3. Download Full Report (All rows with STATUS and ERROR_DETAILS)
  const downloadFullReport = () => {
    const compiledRows = results.map(r => ({
      ...r.data,
      STATUS: r.status,
      ERROR_DETAILS: r.errors.map(err => `[${err.column}] ${err.message}`).join(" || "),
    }));

    const csvHeaders = [...headers, "STATUS", "ERROR_DETAILS"];
    const csv = makeCsvString(csvHeaders, compiledRows);
    triggerDownload(csv, "transactiq_comprehensive_validation_report.csv");
  };

  // 4. Split and Download in chunks of 500 rows zipped if > 500 rows
  const handleSplitAndDownload = async () => {
    setIsSplitting(true);
    try {
      const zip = new JSZip();
      const chunkSize = 500;
      const totalPartitions = Math.ceil(results.length / chunkSize);

      for (let i = 0; i < totalPartitions; i++) {
        const sliceStart = i * chunkSize;
        const sliceEnd = sliceStart + chunkSize;
        
        // Map row content
        const chunkResults = results.slice(sliceStart, sliceEnd);
        const compiledRows = chunkResults.map(r => ({
          ...r.data,
          STATUS: r.status,
          ERROR_DETAILS: r.errors.map(err => `[${err.column}] ${err.message}`).join(" || "),
        }));

        const csvHeaders = [...headers, "STATUS", "ERROR_DETAILS"];
        const csvString = makeCsvString(csvHeaders, compiledRows);
        
        zip.file(`transactiq_report_part${i + 1}.csv`, csvString);
      }

      // Generate the ZIP
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(content);
      link.setAttribute("href", url);
      link.setAttribute("download", "transactiq_split_reports_package.zip");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toastMessage(`Zipped ${totalPartitions} files in a package downloaded successfully!`, "success");
    } catch (err: any) {
      console.error(err);
      toastMessage(`Failed to build zipped split segments: ${err.message}`, "error");
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
      {/* Downloads Actions Section */}
      <div className="lg:col-span-6 space-y-6">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Download className="h-4 w-4 text-slate-500" />
          Export Reports
        </h3>
        
        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <p className="text-xs text-slate-400 font-medium">
            Generate and trigger native fast downloads on high-fidelity structured validation outputs.
          </p>

          <div className="space-y-3">
            {/* Clean CSV Action */}
            <button
              onClick={downloadCleanedCsv}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100/60 transition-colors">
                  <FileCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Download Cleaned Dataset</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Exports only correct ({summary.passed}) rows</div>
                </div>
              </div>
              <Download className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </button>

            {/* Error CSV Action */}
            <button
              onClick={downloadErrorReport}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100/60 transition-colors">
                  <FileWarning className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Download Error diagnostics</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Exports error rows ({summary.failed}) with details columns</div>
                </div>
              </div>
              <Download className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </button>

            {/* Full Report CSV Action */}
            <button
              onClick={downloadFullReport}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-[#3b82f6] rounded-lg group-hover:bg-blue-100/60 transition-colors">
                  <ClipboardList className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Download Full Comprehensive Report</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">All ({summary.total}) records with Status and Diagnostics columns</div>
                </div>
              </div>
              <Download className="h-4 w-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
            </button>
          </div>
        </div>

        {/* Chunk Auto-split feature */}
        {results.length > 500 && (
          <div className="bg-white border-2 border-blue-100 rounded-2xl p-5 shadow-xs bg-blue-50/5">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-blue-50 text-[#3b82f6] rounded-xl">
                <Archive className="h-5 w-5" />
              </div>
              <div className="text-left flex-1 space-y-1">
                <h4 className="text-xs font-bold text-slate-800">Large Dataset splitting detected ( {results.length} rows )</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  This spreadsheet has over 500 rows. We support splitting this instantly into clean 500-row chunk spreadsheets and compressing them inside a single .ZIP package.
                </p>
                <button
                  onClick={handleSplitAndDownload}
                  disabled={isSplitting}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all shadow-xs"
                >
                  {isSplitting ? "Unifying and Zipping parts..." : "Split & Zipped Download"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profiling / Metrics Stats on Numeric Fields */}
      <div className="lg:col-span-6 space-y-6">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Library className="h-4 w-4 text-slate-500" />
          Numeric Columns Analytics Profile
        </h3>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          {numericStats.length > 0 ? (
            <div className="space-y-4">
              <p className="text-[11px] text-slate-400 font-medium">
                Descriptive telemetry automatically processed for identified numeric metrics in the transaction:
              </p>
              <div className="divide-y divide-slate-100">
                {numericStats.map((stat, idx) => (
                  <div key={idx} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-1.5 first:pt-0 last:pb-0">
                    <span className="text-xs font-semibold text-slate-750 font-mono">{stat.column}</span>
                    <div className="flex gap-4 items-center">
                      <div className="text-left">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Min</span>
                        <span className="text-xs font-mono font-bold text-slate-650">{stat.min}</span>
                      </div>
                      <div className="text-left">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Max</span>
                        <span className="text-xs font-mono font-bold text-slate-650">{stat.max}</span>
                      </div>
                      <div className="text-left font-sans">
                        <span className="block text-[9px] text-slate-400 font-bold uppercase">Average</span>
                        <span className="text-xs font-mono font-bold text-[#3b82f6]">{stat.avg}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400 text-xs gap-1.5">
              <HelpCircle className="h-7 w-7 text-slate-300" />
              <span>No major numeric metrics detected in the parsed headers.</span>
              <span className="text-[10px] text-slate-400">At least 50% non-empty records must compile numerically.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
