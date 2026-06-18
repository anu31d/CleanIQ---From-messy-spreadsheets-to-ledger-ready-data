import React, { useState, useMemo } from "react";
import { CheckCircle2, XCircle, Percent, Search, ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";
import { RowResult, ValidationSummary } from "../types";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface DashboardTabProps {
  summary: ValidationSummary;
  results: RowResult[];
  headers: string[];
}

export default function DashboardTab({ summary, results, headers }: DashboardTabProps) {
  const [filter, setFilter] = useState<"ALL" | "PASS" | "FAIL">("ALL");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Prepare Pie (Doughnut) Chart Data for Error Types
  const pieData = useMemo(() => {
    const types = summary.errorTypes;
    return [
      { name: "Phone Errors", value: types.phone, color: "#f43f5e" }, // Rose-500
      { name: "Invalid Dates", value: types.date, color: "#f59e0b" }, // Amber-500
      { name: "Missing Fields", value: types.missing, color: "#3b82f6" }, // Blue-500
      { name: "Format Match", value: types.format, color: "#a855f7" }, // Purple-500
      { name: "Numeric / Pricing", value: types.numeric, color: "#14b8a6" }, // Teal-500
      { name: "Duplicate Entry", value: types.duplicate, color: "#e2e8f0" }, // Slate-200
      { name: "Other Errors", value: types.other, color: "#64748b" }, // Slate-500
    ].filter(item => item.value > 0);
  }, [summary]);

  // Prepare Bar Chart Data for Errors Per Column
  const barData = useMemo(() => {
    return Object.entries(summary.errorsPerColumn)
      .map(([col, count]) => ({
        column: col.length > 12 ? `${col.substring(0, 10)}...` : col,
        "Errors Count": count,
      }))
      .filter(item => item["Errors Count"] > 0)
      .slice(0, 12); // Limit to top 12 columns for beautiful visual layout
  }, [summary]);

  // Filter and Search Logic
  const filteredResults = useMemo(() => {
    return results.filter(row => {
      // Status Filter
      if (filter === "PASS" && row.status !== "PASS") return false;
      if (filter === "FAIL" && row.status !== "FAIL") return false;

      // Text Search across all cell values
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesContent = Object.values(row.data).some(val => 
          String(val).toLowerCase().includes(query)
        );
        const matchesError = row.errors.some(err => 
          err.message.toLowerCase().includes(query) || err.column.toLowerCase().includes(query)
        );
        return matchesContent || matchesError;
      }

      return true;
    });
  }, [results, filter, search]);

  // Reset page when filter or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter, search]);

  // Pagination bounds
  const totalItems = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredResults.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredResults, currentPage]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 4 Summary Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <div className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">Total Rows</div>
          <div className="text-3xl font-bold text-slate-800 tracking-tight font-mono">{summary.total}</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div>
            <div className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">Passed</div>
            <div className="text-3xl font-bold text-emerald-600 tracking-tight font-mono">{summary.passed}</div>
          </div>
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div>
            <div className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">Failed Errors</div>
            <div className="text-3xl font-bold text-red-500 tracking-tight font-mono">{summary.failed}</div>
          </div>
          <div className="p-2 bg-rose-50 rounded-lg text-red-500">
            <XCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div>
            <div className="text-slate-400 font-medium text-xs uppercase tracking-wider mb-1">Pass Rate</div>
            <div className="text-3xl font-bold text-[#3b82f6] tracking-tight font-mono">{summary.passRate}%</div>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg text-[#3b82f6]">
            <Percent className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut Chart of Error Types */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Error Breakdown by Type</h3>
          <div className="h-[240px] flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <div className="w-full h-full flex flex-col md:flex-row items-center gap-4">
                <div className="w-full md:w-3/5 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {pieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(val) => [`${val} occurrences`, "Count"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Visual Legend */}
                <div className="w-full md:w-2/5 flex flex-col gap-1.5 max-h-[190px] overflow-y-auto">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate font-medium flex-1">{item.name}</span>
                      <span className="font-mono font-bold text-slate-500">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs flex flex-col items-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-1" />
                No errors discovered. Full 100% data pass rate!
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart of Column Errors */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-xs">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">Errors Frequency per Column</h3>
          <div className="h-[240px]">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="column" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip formatter={(val) => [`${val} errors`, "Count"]} />
                  <Bar dataKey="Errors Count" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                <BarChart2 className="h-8 w-8 text-indigo-200 mb-1" />
                No columns show negative matches or schema rule failures.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Filterable Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Table Filters & Search UI Card */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/20">
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setFilter("ALL")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                filter === "ALL" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              All Rows ({results.length})
            </button>
            <button
              onClick={() => setFilter("PASS")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                filter === "PASS" ? "bg-white text-emerald-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Passed ({summary.passed})
            </button>
            <button
              onClick={() => setFilter("FAIL")}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                filter === "FAIL" ? "bg-white text-rose-600 shadow-xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Failed ({summary.failed})
            </button>
          </div>

          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contents or error state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/10 placeholder-slate-400 transition-all font-medium"
            />
          </div>
        </div>

        {/* The Rows Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100/50 text-slate-700 font-semibold border-b border-slate-100 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3 w-[80px]">Row</th>
                <th className="px-5 py-3 w-[100px]">Status</th>
                <th className="px-5 py-3 w-[260px]">Diagnostics & Errors</th>
                {headers.slice(0, 5).map((hdr, idx) => (
                  <th key={idx} className="px-5 py-3 truncate max-w-[150px]">{hdr}</th>
                ))}
                {headers.length > 5 && (
                  <th className="px-5 py-3 text-slate-400 italic">+{headers.length - 5} Columns</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {paginatedResults.length > 0 ? (
                paginatedResults.map((row) => (
                  <tr key={row.rowNum} className="hover:bg-slate-50/40">
                    {/* Row Num */}
                    <td className="px-5 py-3 text-slate-400 font-medium">#{row.rowNum}</td>
                    
                    {/* Pass badge */}
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          row.status === "PASS"
                            ? "bg-[#dcfce7] text-[#166534]"
                            : "bg-[#fee2e2] text-[#991b1b]"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    {/* Diagnostics error list */}
                    <td className="px-5 py-3 text-slate-700 max-w-[260px]">
                      {row.errors.length > 0 ? (
                        <div className="space-y-1 font-sans text-[11px]">
                          {row.errors.map((err, idx) => (
                            <div key={idx} className="text-red-600 leading-tight">
                              • <span className="font-semibold text-slate-500">[{err.column}]</span> {err.message}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px] font-sans">No errors detected.</span>
                      )}
                    </td>

                    {/* Cell Fields (Limit to 5 keys for UI design) */}
                    {headers.slice(0, 5).map((hdr, cellIdx) => (
                      <td key={cellIdx} className="px-5 py-3 truncate max-w-[150px] text-slate-500 text-[11px]">
                        {row.data[hdr] !== undefined ? String(row.data[hdr]) : ""}
                      </td>
                    ))}

                    {/* Plus Columns indicator */}
                    {headers.length > 5 && (
                      <td className="px-5 py-3 text-slate-300 italic text-[10px] font-sans">...</td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={headers.length + 3} className="px-5 py-10 text-center font-sans text-slate-400 text-xs">
                    No records match the current filters or query search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Minimal pagination UI and indicators */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/20">
            <span className="text-xs text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-850">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-semibold text-slate-850">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{" "}
              <span className="font-semibold text-slate-850">{totalItems}</span> rows
            </span>

            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 flex items-center shrink-0">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
