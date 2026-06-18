import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { Upload, HelpCircle, Check, AlertCircle, Plus, Trash2, Calendar, FileText } from "lucide-react";
import { CountryRule } from "../types";

interface UploadTabProps {
  countryRules: CountryRule[];
  setCountryRules: React.Dispatch<React.SetStateAction<CountryRule[]>>;
  dateFormat: string;
  setDateFormat: (format: string) => void;
  onFileLoaded: (headers: string[], rows: Record<string, string>[], fileLabel: string) => void;
  onRunValidation: () => void;
  isValidating: boolean;
  validationProgress: number;
  toastMessage: (msg: string, type: "success" | "error") => void;
}

export default function UploadTab({
  countryRules,
  setCountryRules,
  dateFormat,
  setDateFormat,
  onFileLoaded,
  onRunValidation,
  isValidating,
  validationProgress,
  toastMessage,
}: UploadTabProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  
  // Rules management states
  const [newCountry, setNewCountry] = useState("");
  const [newDigits, setNewDigits] = useState<number | "">("");

  const fileInputRef = useRef<HTMLInputElement>(null);

// Helper function to process and parse CSV files using PapaParse
  const handleCsvParse = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy", // Ignore completely empty rows
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        let headers = results.meta.fields || [];

        // Warn user if the parsed document is empty
        if (data.length === 0) {
          toastMessage("The uploaded CSV is empty or contains no readable rows.", "error");
          return;
        }

        // If headers are empty or missing, auto-generate standard numeric indices headers
        if (headers.length === 0) {
          const maxCols = Math.max(...data.map(row => Object.keys(row).length));
          headers = Array.from({ length: maxCols }, (_, ix) => `Column_${ix + 1}`);
        }

        // Update local React states with the header keys & first five rows for preview
        setPreviewHeaders(headers);
        setPreviewRows(data.slice(0, 5));
        
        // Propagate loaded document data to root App component layout
        onFileLoaded(headers, data, `${file.name} (${data.length} rows)`);
        setActiveFile(file.name);
        toastMessage(`Successfully parsed ${file.name}!`, "success");
      },
      error: (err) => {
        console.error(err);
        toastMessage(`Failed to parse CSV: ${err.message}`, "error");
      }
    });
  };

  // Drag & drop file event listeners
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // File-type constraint validator
      if (file.name.endsWith(".csv") || file.type === "text/csv") {
        handleCsvParse(file);
      } else {
        toastMessage("Please upload a CSV file format only.", "error");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleCsvParse(files[0]);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  // Appends a new phone number length rule mapped to a specific country
  const addCountryRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountry.trim()) {
      toastMessage("Country name cannot be empty.", "error");
      return;
    }
    if (newDigits === "" || newDigits < 4 || newDigits > 20) {
      toastMessage("Digit count must be an integer between 4 and 20.", "error");
      return;
    }

    const checkExists = countryRules.some(
      r => r.country.toLowerCase() === newCountry.trim().toLowerCase()
    );

    if (checkExists) {
      toastMessage(`A validation rule for "${newCountry.trim()}" already exists.`, "error");
      return;
    }

    // Set updated rules array
    setCountryRules(prev => [...prev, { country: newCountry.trim(), digits: Number(newDigits) }]);
    setNewCountry("");
    setNewDigits("");
    toastMessage(`Added phone validation rule for ${newCountry.trim()}`, "success");
  };

  const deleteRule = (countryName: string) => {
    setCountryRules(prev => prev.filter(r => r.country !== countryName));
    toastMessage(`Removed ${countryName} rule`, "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Upload and Preview Column */}
      <div className="lg:col-span-7 space-y-6">
        <h2 className="text-xl font-medium tracking-tight text-slate-800">1. Data Ingestion</h2>

        {/* Drag and Drop Container */}
        <div
          id="dropzone"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={triggerInputClick}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
            isDragOver
              ? "border-emerald-500 bg-emerald-50/50 scale-[0.99]"
              : activeFile
              ? "border-emerald-200 bg-slate-50/50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/20"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
          />
          <div className={`p-4 rounded-full mb-4 ${activeFile ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
            <Upload className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            {activeFile ? `Selected: ${activeFile}` : "Drag & drop your CSV transactions spreadsheet"}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            No size limit. Handled safely with client chunking. Supports standard headers.
          </p>
          <button
            type="button"
            className="mt-4 px-4 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-xs"
          >
            Browse Files Selection
          </button>
        </div>

        {/* Table Preview */}
        {previewRows.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs animate-fade-in">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Data Preview (First 5 Rows)
                </span>
              </div>
              <span className="text-slate-400 text-xs font-mono">{activeFile}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100/50 text-slate-700 font-medium">
                  <tr>
                    {previewHeaders.map((hdr, key) => (
                      <th key={key} className="px-4 py-3 font-medium truncate max-w-[150px]">
                        {hdr}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-slate-50/40">
                      {previewHeaders.map((hdr, valIdx) => (
                        <td key={valIdx} className="px-4 py-2.5 truncate max-w-[150px] font-mono text-[11px]">
                          {row[hdr] !== undefined ? String(row[hdr]) : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Rules Configurations Column */}
      <div className="lg:col-span-5 space-y-6">
        <h2 className="text-xl font-medium tracking-tight text-slate-800">2. Country Rules & Settings</h2>

        {/* Configurations Box */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
          {/* Expected Date Formatter Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              Expected Date Format
            </label>
            <select
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#3b82f6]/10 focus:border-[#3b82f6] transition-all font-mono"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-18)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 18/06/2026)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 06/18/2026)</option>
              <option value="ISO 8601">ISO 8601 (Auto ISO UTC parsers)</option>
            </select>
          </div>

          {/* Validation Phone Country Rules */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                Phone Number Rules Mapping
              </label>
            </div>

            <div className="max-h-[180px] overflow-y-auto border border-slate-100 rounded-lg divide-y divide-slate-100 mb-4 bg-slate-50/30">
              {countryRules.map((rule) => (
                <div key={rule.country} className="flex items-center justify-between px-3.5 py-2 hover:bg-slate-50">
                  <span className="text-xs font-medium text-slate-700">{rule.country}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono bg-slate-100/80 px-2 py-0.5 rounded-sm">
                      {rule.digits} digits
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteRule(rule.country)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Form to add rule */}
            <form onSubmit={addCountryRule} className="grid grid-cols-2 gap-2 mt-2">
              <input
                type="text"
                placeholder="Country (e.g. USA)"
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10"
              />
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Digits check"
                  value={newDigits}
                  onChange={(e) => setNewDigits(e.target.value === "" ? "" : Number(e.target.value))}
                  className="bg-white border border-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 flex-1"
                />
                <button
                  type="submit"
                  className="bg-slate-800 text-white hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Validation Button Trigger */}
        <div className="pt-4">
          {isValidating ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Engaging Rule Validators...</span>
                <span>{validationProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3b82f6] transition-all duration-300 ease-out"
                  style={{ width: `${validationProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={onRunValidation}
              disabled={!activeFile}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all duration-200 cursor-pointer ${
                activeFile
                  ? "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99] cursor-pointer"
                  : "bg-slate-100 text-slate-400 border border-slate-200/80 cursor-not-allowed"
              }`}
            >
              <Check className="h-4 w-4" />
              Apply Validation Pipeline
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
