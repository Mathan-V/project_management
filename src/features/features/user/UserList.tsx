import { MoreVertical, Trash2, X, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { usersAPI } from '../../../api/users.api';
import { authAPI } from '../../../api/auth.api';
import type { User } from '../../../utils/types';

interface ApiUser {
  id: number;
  user_name: string | { id: number; name: string; created_at: string; is_enabled: boolean; user: any };
  password: string;
  email: string;
  is_active: boolean;
  role: string | null | { id: number; name: string; created_at: string; is_enabled: boolean; user: any };
  role_id: number | null;
  created_at: string;
  projects: any[];
  timesheets: any[];
}

const transformApiUserToUser = (apiUser: ApiUser | null): User | null => {
  if (!apiUser || !apiUser.id) return null;

  const userName = typeof apiUser.user_name === 'string'
    ? apiUser.user_name
    : apiUser.user_name?.name || 'Unknown';

  const roleObj = typeof apiUser.role === 'object' && apiUser.role ? apiUser.role : null;
  const roleName = roleObj?.name || (typeof apiUser.role === 'string' ? apiUser.role : 'Employee');
  const roleId = roleObj?.id ?? apiUser.role_id ?? null;

  return {
    id: apiUser.id,
    user_name: userName,
    password: apiUser.password || '',
    email: apiUser.email || '',
    rolename: roleName,
    status: apiUser.is_active ? "Active" : "Inactive",
    created_at: apiUser.created_at || '',
    createdAt: apiUser.created_at || '',
    is_active: apiUser.is_active,
    role_id: roleId,
    role: roleObj
      ? {
          id: roleObj.id,
          name: roleObj.name,
          is_enabled: roleObj.is_enabled,
          created_at: roleObj.created_at || '',
        }
      : {
          id: roleId || 0,
          name: roleName,
          is_enabled: true,
          created_at: apiUser.created_at || '',
        },
  };
};

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: Partial<ApiUser>) => void;
  initialData?: User;
  isEditMode?: boolean;
  roles?: { id: number; name: string }[];
}

interface DeleteConfirmModalProps {
  isOpen: boolean;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditMode = false,
  roles = [],
}) => {
  const [userName, setUserName] = useState(initialData?.user_name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState("");
  const [roleName, setRoleName] = useState(initialData?.rolename || "Employee");
  const [status, setStatus] = useState<"Active" | "Inactive">(initialData?.status || "Active");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isEditMode && initialData) {
      setUserName(initialData.user_name || "");
      setEmail(initialData.email || "");
      setPassword("");
      setRoleName(initialData.rolename || "Employee");
      setStatus(initialData.status || "Active");
    }
  }, [isEditMode, initialData, isOpen]);

  const handleSubmit = () => {
    if (!userName.trim() || !email.trim() || (!isEditMode && !password.trim())) {
      alert("Required fields are missing!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address!");
      return;
    }

    if (password && password.length <= 6) {
      alert("Password must be more than 6 characters!");
      return;
    }

    const selectedRole = roles.find(role => role.name === roleName);
    const roleId = selectedRole ? selectedRole.id : null;

    onSubmit({
      user_name: userName,
      email,
      password: isEditMode ? (password || undefined) : password,
      role_id: roleId,
      is_active: status === "Active",
    });

    setUserName("");
    setEmail("");
    setPassword("");
    setRoleName("Employee");
    setStatus("Active");
  };

  if (!isOpen) return null;

  return (
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
          width: "28rem",
          padding: "1.5rem",
          position: "relative",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
        role="dialog"
        aria-label={isEditMode ? "Edit User Modal" : "Create User Modal"}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          aria-label="Close modal"
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
          {isEditMode ? "Edit User" : "Create User"}
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
            User Name
          </label>
          <input
            type="text"
            placeholder="Enter username"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              outline: "none",
            }}
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
            Email
          </label>
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              outline: "none",
            }}
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
            {isEditMode ? "New Password (optional)" : "Password"}
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder={isEditMode ? "Enter new password or leave blank" : "Enter password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "0.5rem",
                padding: "0.5rem 0.75rem",
                fontSize: "0.875rem",
                outline: "none",
                paddingRight: "2.5rem",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} color="#6b7280" /> : <Eye size={18} color="#6b7280" />}
            </button>
          </div>
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
            Role
          </label>
          <select
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              outline: "none",
              backgroundColor: "white",
            }}
          >
            <option value="">Select a role</option>
            {roles.length > 0 ? (
              roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))
            ) : (
              <>
                <option value="Administrator">Administrator</option>
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
              </>
            )}
          </select>
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
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.75rem",
              fontSize: "0.875rem",
              outline: "none",
              backgroundColor: "white",
            }}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#e5e7eb",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              color: "#374151",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#22d3ee",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "600",
            }}
          >
            {isEditMode ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
};

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  userName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "0.75rem",
          padding: "2rem",
          maxWidth: "400px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
        }}
        role="dialog"
        aria-label="Delete confirmation"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Trash2 size={24} color="#dc2626" />
          </div>
        </div>

        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: "600",
            color: "#1f2937",
            textAlign: "center",
            marginBottom: "0.5rem",
          }}
        >
          Delete User
        </h3>

        <p
          style={{
            color: "#6b7280",
            textAlign: "center",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          Are you sure you want to delete <strong>{userName}</strong>? This action cannot be undone.
        </p>

        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onCancel}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#e5e7eb",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              color: "#374151",
              fontWeight: "500",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "600",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: number; name: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    try {
      const data: ApiUser[] = await usersAPI.getUsers({ page, limit });
      console.log("API Response:", JSON.stringify(data, null, 2));
      const transformedUsers = Array.isArray(data)
        ? data.map(transformApiUserToUser).filter((u): u is User => u !== null).sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        })
        : [];
      setUsers(transformedUsers);
      setTotalUsers(transformedUsers.length); // You may want to get total count from API
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to fetch users. Please try again.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, itemsPerPage);

    const fetchRoles = async () => {
      try {
        const rolesData = await authAPI.getAllRoles();
        if (Array.isArray(rolesData)) {
          setRoles(rolesData);
        }
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      }
    };

    fetchRoles();
  }, [currentPage, itemsPerPage]);

  const handleCreate = async (user: Partial<ApiUser>) => {
    try {
      const newApiUser = await usersAPI.createUser(user);
      const newUser = transformApiUserToUser(newApiUser);
      setUsers((prev) => [newUser, ...prev]);
      setShowCreateModal(false);
      fetchUsers(currentPage, itemsPerPage); // Refresh the list
    } catch (err) {
      console.error("Failed to create user:", err);
      alert("Failed to create user. Please try again.");
    }
  };

  const handleUpdate = async (user: Partial<ApiUser>) => {
    if (!editingUser) return;

    try {
      await usersAPI.updateUser(editingUser.user_name, user);
      await fetchUsers(currentPage, itemsPerPage); // Refetch users
      setShowEditModal(false);
      setEditingUser(null);
      alert("User updated successfully!");
    } catch (err: any) {
      console.error("Update failed:", err);
      alert("Failed to update user: " + (err.message || "Unknown error"));
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

  const handleDeleteClick = (userId: number, userName: string) => {
    setUserToDelete({ id: userId, name: userName });
    setShowDeleteConfirm(true);
    setShowMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await usersAPI.deleteUser(userToDelete.name);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      fetchUsers(currentPage, itemsPerPage); // Refresh the list
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user. Please try again.");
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalUsers / itemsPerPage);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div style={{ padding: "1.5rem", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }} ref={menuRef}>
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
          Users
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
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
          aria-label="Create new user"
        >
          Create User
        </button>
      </div>

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

      {loading && (
        <div style={{ textAlign: "center", padding: "1rem", color: "#374151" }}>
          <div
            style={{
              border: "4px solid #f3f4f6",
              borderTop: "4px solid #22d3ee",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              animation: "spin 1s linear infinite",
              margin: "0 auto",
            }}
          ></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          Loading...
        </div>
      )}

      {!loading && (
        <>
          <div
            style={{
              overflow: "auto",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              backgroundColor: "white",
              flex: 1,
              marginBottom: "1rem",
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
                  <th
                    style={{ padding: "0.75rem 1.5rem", textAlign: "left", width: "40px" }}
                  >
                    <input type="checkbox" style={{ cursor: "pointer" }} aria-label="Select all users" />
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
                    User Name
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
                    Email
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
                    Role
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
                    Status
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
                    Created At
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
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <input
                          type="checkbox"
                          style={{ cursor: "pointer" }}
                          aria-label={`Select user ${user.user_name || "Unknown"}`}
                        />
                      </td>
                      <td style={{ padding: "1rem 1.5rem", color: "#374151" }}>
                        {typeof user.user_name === "string" ? user.user_name : "Unknown"}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", color: "#6b7280" }}>
                        {typeof user.email === "string" ? user.email : "Unknown"}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", color: "#374151" }}>
                        {typeof user.rolename === "string" ? user.rolename : "Employee"}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", color: "#374151" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "500",
                            backgroundColor: user.status === "Active" ? "#d1fae5" : "#fee2e2",
                            color: user.status === "Active" ? "#065f46" : "#991b1b",
                          }}
                        >
                          {typeof user.status === "string" ? user.status : "Unknown"}
                        </span>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", color: "#6b7280", fontSize: "0.875rem" }}>
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}
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
                            setShowMenu(showMenu === user.id ? null : user.id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: "0.25rem",
                          }}
                          aria-label={`More options for ${user.user_name || "Unknown"}`}
                        >
                          <MoreVertical size={18} color="#6b7280" />
                        </button>

                        {showMenu === user.id && (
                          <div
                            style={{
                              position: "absolute",
                              right: "1rem",
                              top: "2rem",
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
                              onClick={() => {
                                setEditingUser(user);
                                setShowEditModal(true);
                                setShowMenu(null);
                              }}
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
                              aria-label={`Edit user ${user.user_name || "Unknown"}`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(user.id, user.user_name)}
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
                              aria-label={`Delete user ${user.user_name || "Unknown"}`}
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
                      colSpan={7}
                      style={{
                        textAlign: "center",
                        padding: "1rem",
                        color: "#9ca3af",
                      }}
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "1rem",
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                Rows per page:
              </span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                style={{
                  padding: "0.25rem 0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  cursor: "pointer",
                  backgroundColor: "white",
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "#6b7280" }}>
              <span>
                Page {currentPage} of {totalPages || 1}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  backgroundColor: currentPage === 1 ? "#f3f4f6" : "white",
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} color="#6b7280" />
              </button>

              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span
                    key={`ellipsis-${index}`}
                    style={{
                      padding: "0.5rem 0.75rem",
                      fontSize: "0.875rem",
                      color: "#6b7280",
                    }}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page as number)}
                    style={{
                      padding: "0.5rem 0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.375rem",
                      backgroundColor: currentPage === page ? "#22d3ee" : "white",
                      color: currentPage === page ? "white" : "#374151",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      fontWeight: currentPage === page ? "600" : "400",
                      minWidth: "36px",
                    }}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                  >
                    {page}
                  </button>
                )
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                style={{
                  padding: "0.5rem",
                  border: "1px solid #d1d5db",
                  borderRadius: "0.375rem",
                  backgroundColor: currentPage === totalPages || totalPages === 0 ? "#f3f4f6" : "white",
                  cursor: currentPage === totalPages || totalPages === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  opacity: currentPage === totalPages || totalPages === 0 ? 0.5 : 1,
                }}
                aria-label="Next page"
              >
                <ChevronRight size={18} color="#6b7280" />
              </button>
            </div>
          </div>
        </>
      )}

      <UserFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        roles={roles}
      />

      <UserFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
        }}
        onSubmit={handleUpdate}
        initialData={editingUser || undefined}
        isEditMode
        roles={roles}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        userName={userToDelete?.name || ""}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default UserList;