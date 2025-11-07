import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { rolesAPI } from "../../../api/roles.api";

interface Permission {
  page: string;
  read: boolean;
  write: boolean;
  create: boolean;
  delete: boolean;
}

const RoleForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<"basic" | "permissions">("basic");
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [loading, setLoading] = useState(false);

  const pages = [
    "Dashboard",
    "Projects",
    "Timesheet",
    "Calendar",
    "Users",
    "Roles",
    "Clients",
    "Reports"
  ];

  const [permissions, setPermissions] = useState<Permission[]>(
    pages.map((page) => ({
      page,
      read: false,
      write: false,
      create: false,
      delete: false,
    }))
  );

  // Fetch role data when editing
  useEffect(() => {
    const fetchRoleData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await rolesAPI.getRoleById(parseInt(id));

        console.log("📥 Fetched role data:", response);

        setRoleName(response.name);
        setDescription(response.description || "");
        setStatus(response.is_enabled ? "Active" : "Inactive");

        // Default permission table
        const defaultPermissions = [
          { page: "Dashboard", read: false, write: false, create: false, delete: false },
          { page: "Projects", read: false, write: false, create: false, delete: false },
          { page: "Timesheet", read: false, write: false, create: false, delete: false },
          { page: "Calendar", read: false, write: false, create: false, delete: false },
          { page: "Users", read: false, write: false, create: false, delete: false },
          { page: "Roles", read: false, write: false, create: false, delete: false },
          { page: "Clients", read: false, write: false, create: false, delete: false },
          { page: "Reports", read: false, write: false, create: false, delete: false },
        ];

        // Helper to normalize name
        const normalize = (str: string) => str.toLowerCase().replace(/s$/, ""); // remove trailing 's'

        const updatedPermissions = defaultPermissions.map((perm) => {
          const pageKey = normalize(perm.page); // e.g. "projects" → "project"

          const relatedPerms = response.permissions.filter((p: any) =>
            p.code.toLowerCase().startsWith(pageKey)
          );

          return {
            ...perm,
            create: relatedPerms.some((p: any) => p.code.includes("_create")),
            delete: relatedPerms.some((p: any) => p.code.includes("_delete")),
            write: relatedPerms.some((p: any) => p.code.includes("_update") || p.code.includes("_edit")),
            read: relatedPerms.some((p: any) => p.code.includes("_view") || p.code.includes("_read")),
          };
        });

        setPermissions(updatedPermissions);
        console.log("✅ Mapped permissions to checkboxes:", updatedPermissions);
      } catch (error) {
        console.error("❌ Error fetching role:", error);
        alert("Failed to load role data");
      } finally {
        setLoading(false);
      }
    };

    fetchRoleData();
  }, [id]);

  const handlePermissionChange = (
    pageIndex: number,
    permissionType: keyof Omit<Permission, 'page'>
  ) => {
    const updated = [...permissions];
    const currentValue = updated[pageIndex][permissionType];
    const newValue = !currentValue;
    
    // Update the clicked permission
    updated[pageIndex][permissionType] = newValue;
    
    // Cascading logic when enabling permissions
    if (newValue) {
      if (permissionType === 'write') {
        // Write requires Read
        updated[pageIndex].read = true;
      } else if (permissionType === 'create') {
        // Create requires Read and Write
        updated[pageIndex].read = true;
        updated[pageIndex].write = true;
      } else if (permissionType === 'delete') {
        // Delete requires Read
        updated[pageIndex].read = true;
      }
    }
    
    // Cascading logic when disabling permissions
    if (!newValue) {
      if (permissionType === 'read') {
        // If Read is disabled, disable all dependent permissions
        updated[pageIndex].write = false;
        updated[pageIndex].create = false;
        updated[pageIndex].delete = false;
      } else if (permissionType === 'write') {
        // If Write is disabled, disable Create (which depends on Write)
        updated[pageIndex].create = false;
      }
    }
    
    setPermissions(updated);
  };

  const handleSelectAll = (permissionType: keyof Omit<Permission, 'page'>) => {
    const allChecked = permissions.every(p => p[permissionType]);
    const updated = permissions.map(p => ({
      ...p,
      [permissionType]: !allChecked
    }));
    setPermissions(updated);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // 🧠 Convert checkbox state to permission codes
      const selectedPermissionCodes: string[] = [];

      permissions.forEach((perm) => {
        const pageKey = perm.page.toLowerCase().replace(/s$/, ""); // e.g. "Projects" → "project"

        if (perm.create) selectedPermissionCodes.push(`${pageKey}_create`);
        if (perm.delete) selectedPermissionCodes.push(`${pageKey}_delete`);
        if (perm.write) selectedPermissionCodes.push(`${pageKey}_update`);
        if (perm.read) selectedPermissionCodes.push(`${pageKey}_view`);
      });

      // 🔍 DEBUG: Log what we're sending
      console.log("=== FRONTEND SAVE ===");
      console.log("📋 Current permissions state:", permissions);
      console.log("📤 Permission codes to send:", selectedPermissionCodes);
      console.log("=" .repeat(40));

      // 🧱 Build payload
      const payload = {
        name: roleName,
        is_enabled: status === "Active",
        permissions: selectedPermissionCodes,
      };

      console.log("🟢 Full payload being sent:", JSON.stringify(payload, null, 2));

      // 🧩 Call correct API
      if (id) {
        const response = await rolesAPI.updateRole(parseInt(id), payload);
        console.log("✅ Backend response:", response);
        alert("✅ Role updated successfully!");
        
        // Optional: Navigate back to roles list
        navigate('/role');
      } else {
        const response = await rolesAPI.createRole(payload);
        console.log("✅ Backend response:", response);
        alert("✅ Role created successfully!");
        navigate('/role');
      }

    } catch (error) {
      console.error("❌ Error saving role:", error);
      alert("Failed to save role. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && id) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-6 flex items-center justify-center h-64">
          <div className="text-gray-500">Loading role data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50">
      <div className="p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/role')}
          className="flex items-center gap-2 text-cyan-400 hover:text-cyan-500 mb-4 text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Roles
        </button>

        {/* Page Title */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {id ? `Edit Role: ${roleName}` : "Create New Role"}
        </h1>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("basic")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "basic"
                  ? "text-cyan-500 border-b-2 border-cyan-500 bg-gray-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Basic Role Details
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "permissions"
                  ? "text-cyan-500 border-b-2 border-cyan-500 bg-gray-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Role Permissions
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "basic" && (
              <div className="space-y-6 max-w-2xl">
                {/* Role Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Enter role name (e.g., Project Manager)"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none"
                    rows={4}
                    placeholder="Enter role description..."
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === "permissions" && (
              <div className="overflow-x-auto">
                <div className="mb-4 text-sm text-gray-600">
                  Select permissions for this role. Unchecking a permission will remove it when you save.
                </div>
                
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Page
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        <div className="flex flex-col items-center gap-1">
                          <span>Read</span>
                          <input
                            type="checkbox"
                            onChange={() => handleSelectAll('read')}
                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                            title="Select all"
                          />
                        </div>
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        <div className="flex flex-col items-center gap-1">
                          <span>Write</span>
                          <input
                            type="checkbox"
                            onChange={() => handleSelectAll('write')}
                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                            title="Select all"
                          />
                        </div>
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        <div className="flex flex-col items-center gap-1">
                          <span>Create</span>
                          <input
                            type="checkbox"
                            onChange={() => handleSelectAll('create')}
                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                            title="Select all"
                          />
                        </div>
                      </th>
                      <th className="border border-gray-200 px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                        <div className="flex flex-col items-center gap-1">
                          <span>Delete</span>
                          <input
                            type="checkbox"
                            onChange={() => handleSelectAll('delete')}
                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                            title="Select all"
                          />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((perm, index) => (
                      <tr key={perm.page} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900">
                          {perm.page}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm.read}
                            onChange={() => handlePermissionChange(index, 'read')}
                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm.write}
                            onChange={() => handlePermissionChange(index, 'write')}
                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm.create}
                            onChange={() => handlePermissionChange(index, 'create')}
                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm.delete}
                            onChange={() => handlePermissionChange(index, 'delete')}
                            className="w-4 h-4 accent-cyan-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate('/role')}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!roleName || loading}
                className="px-6 py-2 bg-cyan-400 text-white rounded-lg font-medium hover:bg-cyan-500 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : id ? "Update Role" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleForm;