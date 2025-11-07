import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, List, ChevronDown } from "lucide-react";
import { useAppContext } from "../../../contexts/AppContext";
// import type { Project } from "../../../utils/types";
import {
  getWeekDates,
  formatDate,
  formatDisplayDate,
  parseTime,
  formatTime,
} from "../../../utils/timeCalculations";
import { timesheetsAPI } from "../../../api/timesheet.api";

// Type for API response
interface TimeEntry {
  id: number;
  description: string;
  start_date: string;
  end_date: string;
  duration: number;
  status: string;
  projectId: number;
  userId: number | null;
  created_by: number | null;
  project: any | null;
  user: any | null;
  creator: any | null;
}

export const Timesheet: React.FC = () => {
  const { projects, users } = useAppContext();
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage, setProjectsPerPage] = useState(8);

  const weekDates = getWeekDates(currentWeekStart);

  // Fetch current user from localStorage or API
  useEffect(() => {
    const fetchCurrentUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          console.log('User loaded from localStorage:', parsedUser);
        } catch (err) {
          console.error('Error parsing user from localStorage:', err);
        }
      } else {
        if (users) {
          setCurrentUser(users);
          console.log('User loaded from context:', users);
        } else {
          console.warn('No users found in context or localStorage');
        }
      }
    };

    fetchCurrentUser();
  }, [users]);

  // Filter entries based on user role
  const filterEntriesByRole = (entries: TimeEntry[]): TimeEntry[] => {
    if (!currentUser) {
      console.log('No current user found, returning all entries');
      return entries;
    }
    
    console.log('Filtering entries for user:', currentUser.user_name);
    
    const isAdmin = 
      currentUser.role?.name?.toLowerCase() === 'admin' || 
      currentUser.role_id === 1 || 
      currentUser.role_id === 4;
    
    console.log('Is admin?', isAdmin, 'role_id:', currentUser.role_id);
    
    if (isAdmin) {
      console.log('User is admin, showing all entries');
      return entries;
    }
    
    const filtered = entries.filter(entry => {
      const creatorName = entry.creator?.user_name;
      const matches = creatorName === currentUser.user_name;
      console.log(`Entry ${entry.id}: creator=${creatorName}, user=${currentUser.user_name}, matches=${matches}`);
      return matches;
    });
    
    console.log(`Filtered ${filtered.length} entries out of ${entries.length}`);
    return filtered;
  };

  // Calculate pagination
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.ceil(projects.length / projectsPerPage);

  // Fetch time entries for all projects
  useEffect(() => {
    const fetchTimeEntries = async () => {
      if (projects.length === 0) return;

      console.log('Current user:', currentUser);
      console.log('User role_id:', currentUser?.role_id);
      console.log('User role:', currentUser?.role);
      console.log('User name:', currentUser?.user_name);

      setLoading(true);
      setError(null);
      
      try {
        const allEntries: TimeEntry[] = [];
        
        for (const project of projects) {
          try {
            const response = await timesheetsAPI.getTimesheetByProject(project.id);
            if (response && Array.isArray(response)) {
              allEntries.push(...response);
            }
          } catch (err) {
            console.error(`Error fetching entries for project ${project.id}:`, err);
          }
        }
        
        const filteredEntries = filterEntriesByRole(allEntries);
        console.log('Total entries fetched:', allEntries.length);
        console.log('Filtered entries:', filteredEntries.length);
        console.log('Sample entry:', allEntries[0]);
        setTimeEntries(filteredEntries);
      } catch (err) {
        console.error("Error fetching time entries:", err);
        setError("Failed to load time entries");
      } finally {
        setLoading(false);
      }
    };

    fetchTimeEntries();
  }, [projects, currentUser]);

  // Reset to first page when projects change
  useEffect(() => {
    setCurrentPage(1);
  }, [projects.length]);

  // Convert duration (hours) to HH:MM:SS format
  const durationToTimeString = (duration: number): string => {
    const hours = Math.floor(duration);
    const minutes = Math.floor((duration - hours) * 60);
    const seconds = Math.floor(((duration - hours) * 60 - minutes) * 60);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Get aggregated time entries for a project on a specific date
  const getTimeEntryForDate = (projectId: number, date: Date): string => {
    const dateKey = formatDate(date);
    
    const entriesForDate = timeEntries.filter(entry => {
      const entryDate = formatDate(new Date(entry.start_date));
      return entry.projectId === projectId && entryDate === dateKey;
    });

    const totalHours = entriesForDate.reduce((sum, entry) => {
      return sum + (entry.duration || 0);
    }, 0);
    
    return totalHours > 0 ? durationToTimeString(totalHours) : "";
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(new Date());
  };

  // Calculate row total for a project
  const getRowTotal = (projectId: number): string => {
    let total = 0;
    
    weekDates.forEach(date => {
      const timeStr = getTimeEntryForDate(projectId, date);
      if (timeStr) {
        total += parseTime(timeStr);
      }
    });
    
    return formatTime(total);
  };

  // Calculate column total for a date (for current page only)
  const getColumnTotal = (date: Date): string => {
    let total = 0;
    
    currentProjects.forEach(project => {
      const timeStr = getTimeEntryForDate(project.id, date);
      if (timeStr) {
        total += parseTime(timeStr);
      }
    });
    
    return formatTime(total);
  };

  // Calculate grand total (for current page only)
  const getGrandTotal = (): string => {
    let total = 0;
    
    currentProjects.forEach(project => {
      weekDates.forEach(date => {
        const timeStr = getTimeEntryForDate(project.id, date);
        if (timeStr) {
          total += parseTime(timeStr);
        }
      });
    });
    
    return formatTime(total);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleProjectsPerPageChange = (value: string) => {
    const newValue = parseInt(value);
    setProjectsPerPage(newValue);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push(-1); // Ellipsis marker
      }
      
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push(-2); // Ellipsis marker
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-[1600px] mx-auto bg-white rounded-lg shadow-sm flex flex-col" style={{ height: 'calc(100vh - 3rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h1 className="text-2xl font-semibold text-gray-800">Timesheet</h1>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
              Teammates
            </button>
            <button className="p-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
              <List size={20} />
            </button>
            <button
              onClick={goToCurrentWeek}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              This week
            </button>
            <button
              onClick={goToPreviousWeek}
              className="p-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={goToNextWeek}
              className="p-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="p-6 text-center text-gray-600">
            Loading time entries...
          </div>
        )}
        
        {error && (
          <div className="p-6 text-center text-red-600">
            {error}
          </div>
        )}

        {/* Timesheet Table */}
        {!loading && (
          <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100% - 12rem)' }}>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500 w-48">
                    Projects
                  </th>
                  {weekDates.map((date, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-center text-sm font-medium text-gray-500 w-32"
                    >
                      {formatDisplayDate(date, index)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 w-32">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: project.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900">
                          {project.name}
                        </span>
                      </div>
                    </td>
                    {weekDates.map((date, index) => {
                      const value = getTimeEntryForDate(project.id, date);
                      return (
                        <td key={index} className="px-4 py-4">
                          <input
                            type="text"
                            value={value}
                            readOnly
                            placeholder="00:00:00"
                            className="w-full px-3 py-2 text-sm text-center border border-gray-300 rounded bg-gray-50 text-gray-700"
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 py-4 text-center text-sm font-medium text-gray-900">
                      {getRowTotal(project.id)}
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="bg-gray-50 font-medium">
                  <td className="px-6 py-4 text-sm text-gray-600">Total:</td>
                  {weekDates.map((date, index) => (
                    <td
                      key={index}
                      className="px-4 py-4 text-center text-sm text-gray-900"
                    >
                      {getColumnTotal(date)}
                    </td>
                  ))}
                  <td className="px-4 py-4 text-center text-sm text-gray-900">
                    {getGrandTotal()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Custom Pagination Controls */}
        {!loading && projects.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem 1.5rem",
              borderTop: "1px solid #e5e7eb",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Rows per page:
              </span>
              <select
                value={projectsPerPage}
                onChange={(e) => handleProjectsPerPageChange(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  backgroundColor: "white",
                  color: "#374151",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {[5, 8, 10, 20, 50].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                }}
              >
                Page {projects.length === 0 ? 0 : currentPage} of {totalPages}
              </span>
              
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    color: currentPage === 1 ? "#d1d5db" : "#6b7280",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== 1) {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  <ChevronDown size={16} style={{ transform: "rotate(90deg)" }} />
                </button>
                
                {generatePageNumbers().map((pageNum, index) => {
                  if (pageNum === -1 || pageNum === -2) {
                    return (
                      <span
                        key={`ellipsis-${index}`}
                        style={{
                          width: "36px",
                          height: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#6b7280",
                          fontSize: "0.875rem",
                        }}
                      >
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      style={{
                        minWidth: "36px",
                        height: "36px",
                        padding: "0 0.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: currentPage === pageNum ? "none" : "1px solid #d1d5db",
                        borderRadius: "4px",
                        backgroundColor: currentPage === pageNum ? "#22d3ee" : "white",
                        color: currentPage === pageNum ? "white" : "#374151",
                        fontSize: "0.875rem",
                        fontWeight: currentPage === pageNum ? "500" : "400",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== pageNum) {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (currentPage !== pageNum) {
                          e.currentTarget.style.backgroundColor = "white";
                        }
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    color: (currentPage === totalPages || totalPages === 0) ? "#d1d5db" : "#6b7280",
                    cursor: (currentPage === totalPages || totalPages === 0) ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== totalPages && totalPages !== 0) {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "white";
                  }}
                >
                  <ChevronDown size={16} style={{ transform: "rotate(-90deg)" }} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timesheet;