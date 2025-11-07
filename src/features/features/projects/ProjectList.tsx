import React, { useState, useEffect, useRef } from "react";
import { Search, Star, MoreVertical, ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { projectsAPI } from "../../../api/projects.api";
import { clientsAPI } from "../../../api/client.api";
import type { Client } from "../../../utils/types";

// Frontend Project Interface (for UI display)
interface Project {
  id: number;
  name: string;
  client: string;
  tracked: string;
  status: string;
  access: string;
  billable: boolean;
  active: boolean;
  favorite: boolean;
  color: string;
  startDate: string;
}

// Backend Project Interface (API response)
interface BackendProject {
  id: number;
  project_name: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  status: string;
  client_id: number | null;
  user_id: number | null;
  user: any;
  client: any;
  timesheets: Array<{
    id: number;
    description: string;
    start_date: string;
    end_date: string;
    duration: number;
    status: string;
    projectId: number;
    userId: number;
  }>;
}

const ProjectsPage: React.FC = () => {
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [billableFilter, setBillableFilter] = useState<string>("all");

  const [showActiveDropdown, setShowActiveDropdown] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  
  const [activeProjectMenu, setActiveProjectMenu] = useState<number | null>(null);
  const today = new Date().toISOString().split("T")[0];

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCustomColorPicker, setShowCustomColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState("#8d6e63");

  // Form states
  const [projectName, setProjectName] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedColor, setSelectedColor] = useState("#a855f7");
  const [isPublic, setIsPublic] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setendDate] = useState("");

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      setClientsError(null);

      const response = await clientsAPI.getClients();
      let clientList: Client[] = [];

      if (Array.isArray(response)) {
        clientList = response;
      } else if (Array.isArray(response.data)) {
        clientList = response.data;
      } else {
        console.log("Unexpected response format:", response);
      }

      setClients(clientList);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClientsError("Failed to load clients");
    } finally {
      setLoadingClients(false);
    }
  };

  const colors = [
    "#84cc16",
    "#ec4899",
    "#a855f7",
    "#3b82f6",
    "#06b6d4",
    "#22d3ee",
    "#14b8a6",
    "#f97316",
    "#9e9e9e",
  ];

  // Transform backend data to frontend format
  const transformBackendProject = (backendProject: BackendProject): Project => {
    const totalTracked = backendProject.timesheets?.reduce((sum, ts) => sum + ts.duration, 0) || 0;

    return {
      id: backendProject.id,
      name: backendProject.project_name,
      client: backendProject.client?.name || "",
      tracked: `${totalTracked.toFixed(2)}h`,
      status: backendProject.status || "-",
      access: "Public",
      billable: true,
      active: backendProject.status === "IN_PROGRESS" || backendProject.status === "PLANNED",
      favorite: false,
      color: "#a855f7",
      startDate: backendProject.start_date.split("T")[0],
    };
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await projectsAPI.getProjects({ page: currentPage, limit: itemsPerPage });
      console.log("API Response:", response);

      let backendProjects: BackendProject[] = [];

      if (Array.isArray(response)) {
        backendProjects = response as unknown as BackendProject[];
      } else if (response.data && Array.isArray(response.data)) {
        backendProjects = response.data as unknown as BackendProject[];
      } else if (response.items && Array.isArray(response.items)) {
        backendProjects = response.items as unknown as BackendProject[];
      } else {
        console.error("Unexpected response structure:", response);
        throw new Error("Invalid response format from API");
      }

      const userData = localStorage.getItem("user");
      const currentUser = userData ? JSON.parse(userData) : null;
      const currentUserId = currentUser?.id;
      const currentUserRoleName = currentUser?.role?.name;

      const isAdmin = currentUserRoleName?.toLowerCase() === "admin";

      console.log("Current user role:", currentUserRoleName);
      console.log("Is admin?", isAdmin);

      const filteredProjects = isAdmin
        ? backendProjects
        : backendProjects.filter(project => project.created_by === currentUserId);

      const transformedProjects = filteredProjects.map(transformBackendProject);

      setProjects(transformedProjects);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load projects. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [currentPage, itemsPerPage]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive =
      activeFilter === "all" || (activeFilter === "active" && project.active) || (activeFilter === "inactive" && !project.active);
    const matchesClient =
      clientFilter === "all" || (clientFilter === "none" && !project.client) || project.client === clientFilter;
    const matchesBillable =
      billableFilter === "all" ||
      (billableFilter === "billable" && project.billable) ||
      (billableFilter === "non-billable" && !project.billable);

    return matchesSearch && matchesActive && matchesClient && matchesBillable;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleFavorite = (id: number) => {
    setProjects(projects.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)));
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setProjectName("");
    setSelectedClient("");
    setSelectedColor("#a855f7");
    setIsPublic(true);
    setStartDate("");
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setIsEditMode(true);
    setEditingProject(project);
    setProjectName(project.name);
    setSelectedClient(project.client);
    setSelectedColor(project.color);
    setIsPublic(project.access === "Public");
    setStartDate(project.startDate);
    setActiveProjectMenu(null);
    setShowModal(true);
  };

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      alert("Please enter a project name");
      return;
    }
    const userData = localStorage.getItem("user");
    const userId = userData ? JSON.parse(userData).id : null;

    try {
      const newProjectData = {
        project_name: projectName,
        description: "",
        start_date: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
        status: "PLANNED",
        client_id: selectedClient ? parseInt(selectedClient) : null,
        created_by: userId,
      };

      const createdProject = await projectsAPI.createProject(newProjectData);
      const backendProject = createdProject as unknown as BackendProject;
      const transformedProject = transformBackendProject(backendProject);

      transformedProject.color = selectedColor;
      transformedProject.access = isPublic ? "Public" : "Private";

      setProjects([...projects, transformedProject]);
      setShowModal(false);
      alert("Project created successfully!");
      setCurrentPage(1);
    } catch (err: any) {
      console.error("Error creating project:", err);
      alert(err.response?.data?.message || "Failed to create project. Please try again.");
    }
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !projectName.trim()) {
      alert("Please enter a project name");
      return;
    }

    try {
      const updateData = {
        project_name: projectName,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        description: "",
        client_id: null,
      };

      await projectsAPI.updateProject(String(editingProject.id), updateData);

      setProjects(
        projects.map((p) =>
          p.id === editingProject.id
            ? {
                ...p,
                name: projectName,
                client: selectedClient,
                color: selectedColor,
                access: isPublic ? "Public" : "Private",
                startDate: startDate,
              }
            : p
        )
      );

      setShowModal(false);
      alert("Project updated successfully!");
    } catch (err: any) {
      console.error("Error updating project:", err);
      alert(err.response?.data?.message || "Failed to update project. Please try again.");
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      await projectsAPI.deleteProject(String(id));
      setProjects(projects.filter((p) => p.id !== id));
      setActiveProjectMenu(null);
      alert("Project deleted successfully!");
      
      // Adjust current page if necessary
      const newFilteredLength = filteredProjects.length - 1;
      const newTotalPages = Math.ceil(newFilteredLength / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    } catch (err: any) {
      console.error("Error deleting project:", err);
      alert(err.response?.data?.message || "Failed to delete project. Please try again.");
    }
  };

  const handleDuplicateProject = (project: Project) => {
    const newProject: Project = {
      ...project,
      id: Date.now(),
      name: `${project.name} (Copy)`,
    };
    setProjects([...projects, newProject]);
    setActiveProjectMenu(null);
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push(-1); // Ellipsis marker
      }
      
      // Show pages around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push(-2); // Ellipsis marker
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveProjectMenu(null);
        setShowActiveDropdown(false);
        setShowClientDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, clientFilter, billableFilter]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
        padding: "2rem",
      }}
      ref={menuRef}
    >
      {loading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "400px",
            fontSize: "1.125rem",
            color: "#6b7280",
          }}
        >
          Loading projects...
        </div>
      )}

      {error && !loading && (
        <div
          style={{
            backgroundColor: "#fee2e2",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            color: "#991b1b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>{error}</span>
          <button
            onClick={fetchProjects}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#991b1b",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
            }}
          >
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "400",
                color: "#374151",
                margin: 0,
              }}
            >
              Projects
            </h1>
            <button
              onClick={openCreateModal}
              style={{
                padding: "0.625rem 1.5rem",
                backgroundColor: "#22d3ee",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              CREATE NEW PROJECT
            </button>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "1rem",
              marginBottom: "1rem",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#9ca3af",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                FILTER
              </span>

              <div style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    setShowActiveDropdown(!showActiveDropdown);
                    setShowClientDropdown(false);
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#374151",
                  }}
                >
                  Active <ChevronDown size={16} />
                </button>
                {showActiveDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: "0.25rem",
                      backgroundColor: "white",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      zIndex: 10,
                      minWidth: "150px",
                    }}
                  >
                    {["all", "active", "inactive"].map((filter) => (
                      <div
                        key={filter}
                        onClick={() => {
                          setActiveFilter(filter);
                          setShowActiveDropdown(false);
                        }}
                        style={{
                          padding: "0.625rem 1rem",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          color: "#374151",
                          backgroundColor: activeFilter === filter ? "#f3f4f6" : "white",
                        }}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    setShowClientDropdown(!showClientDropdown);
                    setShowActiveDropdown(false);
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#374151",
                  }}
                >
                  Client <ChevronDown size={16} />
                </button>
                {showClientDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: "0.25rem",
                      backgroundColor: "white",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      zIndex: 10,
                      minWidth: "150px",
                    }}
                  >
                    <div
                      onClick={() => {
                        setClientFilter("all");
                        setShowClientDropdown(false);
                      }}
                      style={{
                        padding: "0.625rem 1rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: "#374151",
                        backgroundColor: clientFilter === "all" ? "#f3f4f6" : "white",
                      }}
                    >
                      All Clients
                    </div>
                    <div
                      onClick={() => {
                        setClientFilter("none");
                        setShowClientDropdown(false);
                      }}
                      style={{
                        padding: "0.625rem 1rem",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        color: "#374151",
                        backgroundColor: clientFilter === "none" ? "#f3f4f6" : "white",
                      }}
                    >
                      No Client
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  position: "relative",
                  minWidth: "250px",
                }}
              >
                <Search
                  size={18}
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
                <input
                  type="text"
                  placeholder="Find by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem 0.5rem 2.5rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>

              <button
                onClick={fetchProjects}
                style={{
                  padding: "0.5rem 1.5rem",
                  backgroundColor: "transparent",
                  color: "#22d3ee",
                  border: "1px solid #22d3ee",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                REFRESH
              </button>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              overflow: "visible",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1.5rem",
                backgroundColor: "#f9fafb",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span
                style={{
                  fontSize: "0.875rem",
                  color: "#6b7280",
                  fontWeight: "500",
                }}
              >
                Projects ({filteredProjects.length})
              </span>
            </div>

            <div
              style={{
                maxHeight: "500px",
                overflowY: "auto",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  tableLayout: "fixed",
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "#f9fafb",
                    zIndex: 1,
                  }}
                >
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "0.75rem 1.5rem", textAlign: "left", width: "40px" }}>
                      <input type="checkbox" style={{ cursor: "pointer" }} />
                    </th>
                    <th
                      style={{
                        padding: "0.75rem 1.5rem",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      NAME ▲
                    </th>
                    <th
                      style={{
                        padding: "0.75rem 1.5rem",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      CLIENT
                    </th>
                    <th
                      style={{
                        padding: "0.75rem 1.5rem",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      TRACKED
                    </th>
                    <th
                      style={{
                        padding: "0.75rem 1.5rem",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      STATUS
                    </th>
                    <th
                      style={{
                        padding: "0.75rem 1.5rem",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      ACCESS
                    </th>
                    <th style={{ padding: "0.75rem 1.5rem", width: "80px" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "#6b7280",
                          fontSize: "0.875rem",
                        }}
                      >
                        No projects found. Create your first project to get started!
                      </td>
                    </tr>
                  ) : (
                    paginatedProjects.map((project) => (
                      <tr key={project.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <input type="checkbox" style={{ cursor: "pointer" }} />
                        </td>
                        <td style={{ padding: "1rem 1.5rem" }}>
                          <div
                            onClick={() => navigate(`/projects/${project.id}`)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              cursor: "pointer",
                            }}
                          >
                            <span
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: project.color,
                              }}
                            ></span>
                            <span style={{ fontSize: "0.875rem", color: "#374151" }}>{project.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
                          {project.client || "–"}
                        </td>
                        <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#374151" }}>
                          {project.tracked}
                        </td>
                        <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
                          {project.status}
                        </td>
                        <td style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", color: "#374151" }}>
                          {project.access}
                        </td>
                        <td style={{ padding: "1rem 1.5rem", position: "relative" }}>
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", position: "relative" }}>
                            <button
                              onClick={() => toggleFavorite(project.id)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: "0.25rem",
                              }}
                            >
                              <Star
                                size={18}
                                style={{
                                  color: project.favorite ? "#fbbf24" : "#d1d5db",
                                  fill: project.favorite ? "#fbbf24" : "none",
                                }}
                              />
                            </button>
                            <div style={{ position: "relative" }}>
                              <button
                                onClick={() => setActiveProjectMenu(activeProjectMenu === project.id ? null : project.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  padding: "0.25rem",
                                }}
                              >
                                <MoreVertical size={18} style={{ color: "#9ca3af" }} />
                              </button>
                              {activeProjectMenu === project.id && (
                                <div
                                  style={{
                                    position: "fixed",
                                    transform: "translate(-90%, 0)",
                                    marginTop: "0.25rem",
                                    backgroundColor: "white",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
                                    zIndex: 9999,
                                    minWidth: "180px",
                                    padding: "0.5rem 0",
                                  }}
                                >
                                  <div
                                    onClick={() => openEditModal(project)}
                                    style={{
                                      padding: "0.75rem 1.25rem",
                                      cursor: "pointer",
                                      fontSize: "0.875rem",
                                      color: "#374151",
                                      transition: "background-color 0.15s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                  >
                                    Edit
                                  </div>
                                  <div
                                    onClick={() => handleDuplicateProject(project)}
                                    style={{
                                      padding: "0.75rem 1.25rem",
                                      cursor: "pointer",
                                      fontSize: "0.875rem",
                                      color: "#374151",
                                      transition: "background-color 0.15s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                  >
                                    Duplicate
                                  </div>
                                  <div
                                    onClick={() => handleDeleteProject(project.id)}
                                    style={{
                                      padding: "0.75rem 1.25rem",
                                      cursor: "pointer",
                                      fontSize: "0.875rem",
                                      color: "#ef4444",
                                      transition: "background-color 0.15s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#fef2f2")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                  >
                                    Delete
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls - Custom Style */}
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
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
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
                  {[5, 10, 20, 50, 100].map((value) => (
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
                  Page {filteredProjects.length === 0 ? 0 : currentPage} of {totalPages}
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
                  
                  {generatePageNumbers().map((page, index) => {
                    if (page === -1 || page === -2) {
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
                        key={page}
                        onClick={() => handlePageChange(page)}
                        style={{
                          minWidth: "36px",
                          height: "36px",
                          padding: "0 0.5rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: currentPage === page ? "none" : "1px solid #d1d5db",
                          borderRadius: "4px",
                          backgroundColor: currentPage === page ? "#22d3ee" : "white",
                          color: currentPage === page ? "white" : "#374151",
                          fontSize: "0.875rem",
                          fontWeight: currentPage === page ? "500" : "400",
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== page) {
                            e.currentTarget.style.backgroundColor = "#f9fafb";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentPage !== page) {
                            e.currentTarget.style.backgroundColor = "white";
                          }
                        }}
                      >
                        {page}
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
          </div>
        </>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "600px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: "500",
                  color: "#6b7280",
                }}
              >
                {isEditMode ? "Edit Project" : "Create new Project"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.5rem",
                  color: "#9ca3af",
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                <input
                  type="text"
                  placeholder="Enter Project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />

                <select
                  id="client"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  style={{
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    backgroundColor: "white",
                    color: selectedClient ? "#374151" : "#9ca3af",
                    width: "100%",
                  }}
                >
                  <option value="">Select client</option>
                  {Array.isArray(clients) &&
                    clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.email}
                      </option>
                    ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: selectedColor,
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    <ChevronDown size={16} style={{ color: "white", position: "absolute", bottom: "2px", right: "2px" }} />
                  </button>
                  {showColorPicker && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: "0.5rem",
                        backgroundColor: "white",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        padding: "0.75rem",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        zIndex: 10,
                      }}
                    >
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setSelectedColor(color);
                              setShowColorPicker(false);
                            }}
                            style={{
                              width: "32px",
                              height: "32px",
                              backgroundColor: color,
                              border: selectedColor === color ? "2px solid #374151" : "1px solid #d1d5db",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          />
                        ))}
                      </div>
                      <div
                        style={{
                          paddingTop: "0.5rem",
                          borderTop: "1px solid #e5e7eb",
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Custom</span>
                        <input
                          type="checkbox"
                          checked={showCustomColorPicker}
                          onChange={(e) => setShowCustomColorPicker(e.target.checked)}
                          style={{ cursor: "pointer" }}
                        />
                        <button
                          onClick={() => setShowCustomColorPicker(!showCustomColorPicker)}
                          style={{
                            width: "24px",
                            height: "24px",
                            border: "1px solid #d1d5db",
                            borderRadius: "4px",
                            cursor: "pointer",
                            backgroundColor: "white",
                            fontSize: "1rem",
                          }}
                        >
                          +
                        </button>
                      </div>
                      {showCustomColorPicker && (
                        <div
                          style={{
                            marginTop: "0.75rem",
                            padding: "0.75rem",
                            border: "1px solid #e5e7eb",
                            borderRadius: "4px",
                            backgroundColor: "#f9fafb",
                          }}
                        >
                          <div
                            style={{
                              width: "180px",
                              height: "180px",
                              background: `linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,1)),
                                       linear-gradient(to right, rgba(255,255,255,1), transparent)`,
                              borderRadius: "4px",
                              position: "relative",
                              marginBottom: "0.75rem",
                              cursor: "crosshair",
                            }}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = e.clientX - rect.left;
                              const y = e.clientY - rect.top;
                              const lightness = Math.round((1 - y / 180) * 50 + 25);
                              const saturation = Math.round((x / 180) * 100);
                              setCustomColor(`hsl(30, ${saturation}%, ${lightness}%)`);
                            }}
                          >
                            <div
                              style={{
                                width: "12px",
                                height: "12px",
                                border: "2px solid white",
                                borderRadius: "50%",
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                transform: "translate(-50%, -50%)",
                                pointerEvents: "none",
                              }}
                            ></div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              marginBottom: "0.5rem",
                            }}
                          >
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                backgroundColor: customColor,
                                border: "1px solid #d1d5db",
                                borderRadius: "50%",
                              }}
                            ></div>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              defaultValue="30"
                              onChange={(e) => {
                                setCustomColor(`hsl(${e.target.value}, 70%, 50%)`);
                              }}
                              style={{
                                flex: 1,
                                height: "8px",
                                background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                                borderRadius: "4px",
                                outline: "none",
                              }}
                            />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <input
                              type="text"
                              value={customColor}
                              onChange={(e) => setCustomColor(e.target.value)}
                              style={{
                                flex: 1,
                                padding: "0.5rem",
                                border: "1px solid #d1d5db",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                textAlign: "center",
                              }}
                            />
                            <button
                              onClick={() => {
                                setSelectedColor(customColor);
                                setShowColorPicker(false);
                                setShowCustomColorPicker(false);
                              }}
                              style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "#22d3ee",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                              }}
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontSize: "0.875rem",
                    color: "#374151",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    style={{
                      width: "18px",
                      height: "18px",
                      cursor: "pointer",
                      accentColor: "#22d3ee",
                    }}
                  />
                  Public
                </label>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate || today}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    color: "#374151",
                  }}
                >
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate || today}
                  onChange={(e) => setendDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "0.875rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                padding: "1.5rem",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "0.5rem 1.5rem",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  backgroundColor: "transparent",
                  color: "#6b7280",
                }}
              >
                Cancel
              </button>
              <button
                onClick={isEditMode ? handleUpdateProject : handleCreateProject}
                style={{
                  padding: "0.5rem 1.5rem",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  backgroundColor: "#22d3ee",
                  color: "white",
                  textTransform: "uppercase",
                }}
              >
                {isEditMode ? "SAVE" : "CREATE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;