import { MoreVertical, Trash2, X, ChevronDown } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { rolesAPI } from '../../../api/roles.api';
import type { Role } from "../../../utils/types";
import { useNavigate } from "react-router-dom";

const RoleList: React.FC = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState<Role[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRoles = async (pageNum = 1) => {
    setLoading(true);
    try {
      const params : any = { page: pageNum, limit };
      const response = await rolesAPI.getRoles(params);

      if (Array.isArray(response)) {
        setRoles(response);
        setTotalCount(response.length);
      } else if (response?.data) {
        setRoles(response.data);
        setTotalCount(response.total || 0);
      } else {
        setRoles([]);
      }
    } catch (err) {
      setError("Failed to fetch roles. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles(page);
  }, [page, limit]);

  const handleCreate = async () => {
    if (!roleName.trim()) {
      alert("Role name is required!");
      return;
    }

    setLoading(true);
    try {
      const newRoleData: Partial<Role> = {
        name: roleName,
        is_enabled: true,
      };
      const newRole = await rolesAPI.createRole(newRoleData);
      setRoles([...roles, newRole]);
      setRoleName("");
      setShowModal(false);
      setPage(1);
      fetchRoles(1);
    } catch (err) {
      setError("Failed to create role. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (id: number) => {
    setLoading(true);
    try {
      const updatedRole = await rolesAPI.updateRole(id, { is_enabled: true });
      setRoles((prev) =>
        prev.map((role) => (role.id === id ? updatedRole : role))
      );
      setShowMenu(null);
    } catch (err) {
      setError("Failed to update role status. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetInactive = async (id: number) => {
    setLoading(true);
    try {
      const updatedRole = await rolesAPI.updateRole(id, { is_enabled: false });
      setRoles((prev) =>
        prev.map((role) => (role.id === id ? updatedRole : role))
      );
      setShowMenu(null);
    } catch (err) {
      setError("Failed to update role status. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this role?"
    );
    if (confirmDelete) {
      setLoading(true);
      try {
        await rolesAPI.deleteRole(id);
        setRoles((prev) => prev.filter((r) => r.id !== id));
        setShowMenu(null);
        
        // Adjust page if needed
        const newTotalCount = totalCount - 1;
        const newTotalPages = Math.ceil(newTotalCount / limit) || 1;
        if (page > newTotalPages && newTotalPages > 0) {
          setPage(newTotalPages);
        } else {
          fetchRoles(page);
        }
      } catch (err) {
        setError("Failed to delete role. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handleLimitChange = (value: string) => {
    const newLimit = parseInt(value);
    setLimit(newLimit);
    setPage(1);
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
      
      if (page > 3) {
        pages.push(-1); // Ellipsis marker
      }
      
      const startPage = Math.max(2, page - 1);
      const endPage = Math.min(totalPages - 1, page + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      if (page < totalPages - 2) {
        pages.push(-2); // Ellipsis marker
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div style={{ padding: "1.5rem" }} ref={menuRef}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
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
          Roles
        </h1>
        <button
          onClick={() => setShowModal(true)}
          disabled={loading}
          style={{
            padding: "0.625rem 1.5rem",
            backgroundColor: loading ? "#a5f3fc" : "#22d3ee",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          ✚ Create Role
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && <div>Loading...</div>}

      {/* Table */}
      {!loading && (
        <div
          style={{
            overflow: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            backgroundColor: "white",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
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
                  <b>Role Name</b>
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
                  <b>Status</b>
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
                ></th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: "#F9FAFB", fontSize: "0.875rem" }}>
              {Array.isArray(roles) && roles.length > 0 ? (
                roles.map((role) => (
                  <tr key={role.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <input type="checkbox" style={{ cursor: "pointer" }} />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600" style={{ padding: "1rem 1.5rem", color: "#374151" }}
                     onClick={() => navigate(`/role/${role.id}`)}>
                      {role.name}
                    </td>
                    <td style={{ padding: "1rem 1.5rem", color: "#374151" }}>
                      <span
                        style={{
                          padding: "0.25rem 0.75rem",
                          borderRadius: "9999px",
                          fontSize: "0.75rem",
                          fontWeight: "500",
                          backgroundColor:
                            role.is_enabled ? "#d1fae5" : "#fee2e2",
                          color: role.is_enabled ? "#065f46" : "#991b1b",
                        }}
                      >
                        {role.is_enabled ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        position: "relative",
                        width: "10px",
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(showMenu === role.id ? null : role.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "0.25rem",
                        }}
                      >
                        <MoreVertical size={18} color="#6b7280" />
                      </button>
                      {/* Dropdown Menu */}
                      {showMenu === role.id && (
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
                          <button
                            onClick={() => handleSetActive(role.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.75rem 1.25rem",
                              width: "100%",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              color: "#374151",
                              transition: "background-color 0.15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = "#f3f4f6")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "transparent")
                            }
                          >
                            ✓ Active
                          </button>
                          <button
                            onClick={() => handleSetInactive(role.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.75rem 1.25rem",
                              width: "100%",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              color: "#374151",
                              transition: "background-color 0.15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = "#f3f4f6")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "transparent")
                            }
                          >
                            ✗ Inactive
                          </button>
                          <button
                            onClick={() => handleDelete(role.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              padding: "0.75rem 1.25rem",
                              width: "100%",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              cursor: "pointer",
                              fontSize: "0.875rem",
                              color: "#dc2626",
                              transition: "background-color 0.15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = "#fef2f2")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor = "transparent")
                            }
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    style={{ textAlign: "center", padding: "1rem", color: "#9ca3af" }}
                  >
                    {loading ? "Loading..." : "No roles found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

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
                value={limit}
                onChange={(e) => handleLimitChange(e.target.value)}
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
                Page {roles.length === 0 ? 0 : page} of {totalPages}
              </span>
              
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    color: page === 1 ? "#d1d5db" : "#6b7280",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (page !== 1) {
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
                        border: page === pageNum ? "none" : "1px solid #d1d5db",
                        borderRadius: "4px",
                        backgroundColor: page === pageNum ? "#22d3ee" : "white",
                        color: page === pageNum ? "white" : "#374151",
                        fontSize: "0.875rem",
                        fontWeight: page === pageNum ? "500" : "400",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (page !== pageNum) {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (page !== pageNum) {
                          e.currentTarget.style.backgroundColor = "white";
                        }
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages || totalPages === 0}
                  style={{
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    backgroundColor: "white",
                    color: (page === totalPages || totalPages === 0) ? "#d1d5db" : "#6b7280",
                    cursor: (page === totalPages || totalPages === 0) ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (page !== totalPages && totalPages !== 0) {
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
      )}

      {/* Create Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "1rem",
              width: "24rem",
              padding: "1.5rem",
              position: "relative",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
          >
            <button
              onClick={() => {
                setShowModal(false);
                setRoleName("");
              }}
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "0.75rem",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <X size={20} color="#6b7280" />
            </button>

            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                marginBottom: "1rem",
                color: "#374151",
              }}
            >
              Create Role
            </h2>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#374151",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                }}
              >
                Role Name
              </label>
              <input
                type="text"
                placeholder="Enter role name"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
                disabled={loading}
              />
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "#374151",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                }}
              >
                Status
              </label>
              <input
                type="text"
                value="Active"
                readOnly
                disabled
                style={{
                  width: "100%",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  backgroundColor: "#f9fafb",
                  color: "#6b7280",
                  cursor: "not-allowed",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setRoleName("");
                }}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "#e5e7eb",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  color: "#374151",
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  backgroundColor: loading ? "#a5f3fc" : "#22d3ee",
                  color: "white",
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                }}
                disabled={loading}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleList;