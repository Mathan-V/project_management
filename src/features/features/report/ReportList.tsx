import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppContext } from "../../../contexts/AppContext";
import { timesheetsAPI } from "../../../api/timesheet.api";

/* ------------------------------------------------- TYPES ------------------------------------------------- */
interface Timesheet {
  id: number;
  projectId: number;
  userId: number;
  start_date: string;
  end_date: string;
  duration: number; // hours
  description?: string;
  user?: { id: number; user_name: string; email: string };
  project?: { id: number; project_name: string };
}

interface ReportEntry {
  id: string;
  project_id: number;
  project_name: string;
  user_id: number;
  user_name: string;
  date: string; // YYYY-MM-DD
  worked_hours: number;
  description: string;
}

/* ------------------------------------------- FIXED DATE RANGE (LOCAL SAFE) ------------------------------------------- */
const getDatesInRange = (startStr: string, endStr: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startStr + "T00:00:00");
  const end = new Date(endStr + "T00:00:00");

  let current = new Date(start);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/* ------------------------------------------- REUSABLE PAGINATION COMPONENT ------------------------------------------- */
interface PaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  className = "",
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  const goPrev = () => onPageChange(Math.max(currentPage - 1, 1));
  const goNext = () => onPageChange(Math.min(currentPage + 1, totalPages));

  return (
    <div className={`flex items-center justify-between px-4 py-2 bg-white border-t ${className}`}>
      {/* Left side – “Showing …” */}
      <div className="text-sm text-gray-600">
        Showing {start} to {end} of {totalItems} {totalItems === 1 ? "entry" : "entries"}
      </div>

      {/* Right side – items-per-page + navigation */}
      <div className="flex items-center gap-4">
        {/* Items per page */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Items per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            disabled={currentPage === 1}
            className={`p-1.5 rounded border transition-colors ${
              currentPage === 1
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-gray-300 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Current page number */}
          <div className="px-3 py-1.5 rounded bg-cyan-400 text-white text-sm font-medium">
            {currentPage}
          </div>

          <button
            onClick={goNext}
            disabled={currentPage === totalPages}
            className={`p-1.5 rounded border transition-colors ${
              currentPage === totalPages
                ? "border-gray-200 text-gray-300 cursor-not-allowed"
                : "border-gray-300 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------- DATE FIX HELPERS ------------------------------------------- */
const toLocalDateKey = (isoStr: string) => {
  const d = new Date(isoStr);
  const local = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return local.toISOString().split("T")[0];
};

/* ------------------------------------------------ COMPONENT ------------------------------------------------ */
const Reports: React.FC = () => {
  const { projects, users } = useAppContext();

  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState("All Projects");
  const [userFilter, setUserFilter] = useState("All Users");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  /* ------------------------------ FETCH TIMESHEETS ------------------------------ */
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      const all: Timesheet[] = [];
      for (const p of projects) {
        try {
          const data = await timesheetsAPI.getTimesheetByProject(p.id);
          if (Array.isArray(data)) all.push(...data);
        } catch (e) {
          console.error(`Project ${p.name} failed`, e);
        }
      }
      setTimesheets(all);
      setIsLoading(false);
    };
    if (projects.length && users.length) fetchAll();
  }, [projects, users]);

  /* --------------------------- BUILD DAILY ENTRIES -------------------------- */
  const reportData = useMemo(() => {
    const entries: ReportEntry[] = [];

    timesheets.forEach((ts) => {
      const proj = projects.find((p) => p.id === ts.projectId);
      const projName = proj?.name ?? ts.project?.project_name ?? "Unknown Project";
      const usr = users.find((u) => u.id === ts.userId);
      const usrName = usr?.user_name ?? ts.user?.user_name ?? "Unknown User";
      const description = ts.description ?? "";

      const startDateObj = new Date(ts.start_date);
      const endDateObj = new Date(ts.end_date);

      const startDateStr = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, "0")}-${String(startDateObj.getDate()).padStart(2, "0")}`;
      const endDateStr = `${endDateObj.getFullYear()}-${String(endDateObj.getMonth() + 1).padStart(2, "0")}-${String(endDateObj.getDate()).padStart(2, "0")}`;

      const dates = getDatesInRange(startDateStr, endDateStr);
      const hoursPerDay = dates.length > 0 ? ts.duration / dates.length : 0;

      dates.forEach((date) => {
        entries.push({
          id: `${ts.id}-${date}`,
          project_id: ts.projectId,
          project_name: projName,
          user_id: ts.userId,
          user_name: usrName,
          date,
          worked_hours: Number(hoursPerDay.toFixed(2)),
          description,
        });
      });
    });

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [timesheets, projects, users]);

  /* --------------------------------- FIXED DISPLAY DATE --------------------------------- */
  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d, 12, 0, 0);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  /* ----------------------------------- FILTERS ----------------------------------- */
  const filteredData = useMemo(() => {
    return reportData.filter((e) => {
      const projOk = projectFilter === "All Projects" || e.project_name === projectFilter;
      const userOk = userFilter === "All Users" || e.user_name === userFilter;

      let dateOk = true;
      if (startDate && endDate) {
        const ed = new Date(e.date);
        const s = new Date(startDate);
        const en = new Date(endDate);
        dateOk = ed >= s && ed <= en;
      }

      const searchOk =
        !searchQuery ||
        e.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.date.includes(searchQuery) ||
        e.description.toLowerCase().includes(searchQuery.toLowerCase());

      return projOk && userOk && dateOk && searchOk;
    });
  }, [reportData, projectFilter, userFilter, startDate, endDate, searchQuery]);

  const totalHours = useMemo(
    () => filteredData.reduce((s, e) => s + e.worked_hours, 0).toFixed(2),
    [filteredData]
  );

  /* --------------------------------- PAGINATION DATA --------------------------------- */
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Reset to first page when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredData.length, pageSize]);

  const handleReset = () => {
    setProjectFilter("All Projects");
    setUserFilter("All Users");
    setStartDate("");
    setEndDate("");
    setSearchQuery("");
  };

  const projectOptions = useMemo(() => ["All Projects", ...projects.map((p) => p.name)], [projects]);
  const userOptions = useMemo(() => ["All Users", ...users.map((u) => u.user_name)], [users]);

  const handleExport = () => {
    const headers = ["Project", "User", "Date", "Worked Hours", "Description"];
    const rows = filteredData.map((e) => [
      e.project_name,
      e.user_name,
      formatDisplayDate(e.date),
      `${e.worked_hours.toFixed(2)}h`,
      e.description,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ----------------------------------- RENDER ----------------------------------- */
  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm flex flex-col" style={{ maxHeight: "calc(100vh - 120px)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b flex-shrink-0">
            <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
            <button
              onClick={handleExport}
              disabled={isLoading}
              className="px-6 py-2.5 bg-cyan-400 text-white rounded font-medium hover:bg-cyan-500 transition-colors"
            >
              EXPORT REPORT
            </button>
          </div>

          {/* Filters */}
          <div className="px-6 py-5 border-b bg-gray-50 flex-shrink-0">
            <div className="mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filters</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase">Project</label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                >
                  {projectOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase">User</label>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                >
                  {userOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 uppercase">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by project, user, date, or description..."
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 pl-10 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="px-6 py-2.5 border border-gray-300 rounded hover:bg-gray-50 font-medium text-gray-700 text-sm"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Table Info */}
          <div className="px-6 py-4 flex items-center justify-between bg-white border-b flex-shrink-0">
            <span className="text-sm text-gray-600">
              {isLoading ? "Loading..." : `Showing ${filteredData.length} entries`}
            </span>
            <span className="text-sm font-semibold text-gray-900">Total Hours: {totalHours}h</span>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Worked Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      Loading timesheet data...
                    </td>
                  </tr>
                ) : paginatedData.length ? (
                  paginatedData.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{entry.project_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{entry.user_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDisplayDate(entry.date)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {entry.worked_hours.toFixed(2)}h
                      </td>
                      <td
                        className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate"
                        title={entry.description}
                      >
                        {entry.description || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                      No timesheet entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* NEW PAGINATION (matches screenshot exactly) */}
          {filteredData.length > 0 && (
            <Pagination
              totalItems={filteredData.length}
              pageSize={pageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;