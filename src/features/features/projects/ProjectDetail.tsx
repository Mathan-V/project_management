import React, { useState, useEffect } from "react";
import { Star, MoreVertical, Plus, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { clientsAPI } from "../../../api/client.api";
import type { Client, PaginationParams } from "../../../utils/types";
import { projectsAPI } from "../../../api/projects.api";
import { usersAPI } from "../../../api/users.api";
import { rolesAPI } from "../../../api/roles.api";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  user_name: string;
  email: string;
  role_id: number;
  role_name?: string;
}

const ProjectDetail: React.FC = () => {
  const [activeTab, setActiveTab] = useState("status");
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Project data
  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [projectColor, setProjectColor] = useState("#84cc16");
  const [status, setStatus] = useState("IN_PROGRESS"); // ADD THIS LINE
  const [isBillable, setIsBillable] = useState(true);
  const [isNonBillable, setIsNonBillable] = useState(false);
  const [startDate, setStartDate] = useState("2025-10-01");
  const [endDate, setEndDate] = useState("");
  const [rate, setRate] = useState("0.00");
  const [visibility, setVisibility] = useState("public");

  // API state
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientsError, setClientsError] = useState<string | null>(null);

  // Stats
  const [totalTracked, settotalTracked] = useState("");
  const [billableTime, setbillableTime] = useState("");
  const [nonBillableTime] = useState("0.00h");
  const [totalAmount] = useState("");

  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  // Roles and Users state
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  // Fetch roles
  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const response = await rolesAPI.getRoles();
      
      if (Array.isArray(response)) {
        setRoles(response);
      } else if (response.data && Array.isArray(response.data)) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await usersAPI.getUsers();
      
      let usersList: User[] = [];
      if (Array.isArray(response)) {
        usersList = response;
      } else if (response.data && Array.isArray(response.data)) {
        usersList = response.data;
      }

      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users based on selected role
  useEffect(() => {
    if (selectedRole && selectedRole !== "") {
      const roleId = parseInt(selectedRole);
      const filtered = users.filter(user => user.role_id === roleId);
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
    setSelectedUser("");
  }, [selectedRole, users]);

  // Fetch clients
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
      }

      setClients(clientList);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClientsError("Failed to load clients");
    } finally {
      setLoadingClients(false);
    }
  };

  // Fetch project data
  useEffect(() => {
    const fetchTimesheetProject = async () => {
      try {
        const response = await projectsAPI.getProjectById(id);
        if (response && Array.isArray(response.timesheets)) {
          const total = response.timesheets.reduce(
            (sum: number, element: any) => sum + (Number(element.duration) || 0),
            0
          );
          const roundedTotal = Number(total.toFixed(2));
          settotalTracked(roundedTotal.toString());
          setbillableTime(roundedTotal.toString());
        }
        setProjectName(response.project_name);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchProject = async () => {
      if (!id) return;
      try {
        const res = await projectsAPI.getProjectById(id);
        const project = res.data || res;

        setProjectName(project.project_name || "");
        setStartDate(project.start_date ? project.start_date.split("T")[0] : "");
        setEndDate(project.end_date ? project.end_date.split("T")[0] : "");
        setClient(project.client_id ? String(project.client_id) : "");
        setProjectColor(project.color || "#84cc16");
        // setRate(project.hourly_rate ? String(project.hourly_rate) : "0.00");
        setVisibility(project.visibility || "public");
        setStatus(project.status || "IN_PROGRESS"); // ADD THIS LINE
        
        // Load team members from backend
        if (project.teamMembers && Array.isArray(project.teamMembers)) {
          setTeamMembers(project.teamMembers);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      }
    };

    fetchTimesheetProject();
    fetchProject();
  }, [id]);

  // Add member handler
  const handleAddMember = () => {
    if (selectedUser) {
      const user = users.find(u => u.id === parseInt(selectedUser));
      
      if (user) {
        let roleName = "Unknown";
        if (selectedRole) {
          const role = roles.find(r => r.id === parseInt(selectedRole));
          roleName = role?.name || "Unknown";
        } else {
          const userRole = roles.find(r => r.id === user.role_id);
          roleName = userRole?.name || "Unknown";
        }

        const alreadyAdded = teamMembers.find(m => m.id === user.id);
        if (alreadyAdded) {
          alert("This user is already a member of this project");
          return;
        }

        const newMember: TeamMember = {
          id: user.id,
          name: user.user_name,
          email: user.email,
          role: roleName,
        };
        
        setTeamMembers([...teamMembers, newMember]);
        setSelectedUser("");
        setSelectedRole("");
        setShowAddMember(false);
      }
    }
  };

  const handleRemoveMember = (id: number) => {
    setTeamMembers(teamMembers.filter((m) => m.id !== id));
  };

  // UPDATED: Save all settings with proper team members format and status
  const handleSaveSettings = async () => {
    try {
      if (!id) {
        alert("Project ID is missing");
        return;
      }

      // Prepare update data with all fields
      const updateData: any = {
        project_name: projectName,
        status: status, // ADD THIS LINE
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate).toISOString() : undefined,
      };

      // Add optional fields only if they have values
      if (projectColor) updateData.color = projectColor;
      // if (rate) updateData.hourly_rate = parseFloat(rate);
      if (visibility) updateData.visibility = visibility;

      // Add client if selected
      if (client && client !== "") {
        updateData.client_id = Number(client);
      }

      // Format team members as array of objects with id, name, email, role
      if (teamMembers && teamMembers.length > 0) {
        updateData.teamMembers = teamMembers.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role
        }));
      } else {
        updateData.teamMembers = [];
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );

      console.log("Sending update data:", updateData); // Debug log

      await projectsAPI.updateProject(id, updateData);
      alert("All settings saved successfully!");
      
      // Update local state if needed
      if (updateData.client_id) setClient(String(updateData.client_id));
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-4">
        <div 
          onClick={() => navigate(`/projects/`)} 
          className="text-sm text-cyan-400 mb-2 cursor-pointer hover:underline"
        >
          ⇦ Projects
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-normal text-gray-600">
            {projectName}
          </h1>
          <div className="flex gap-2">
            {/* Save Settings Button */}
            <button
              onClick={handleSaveSettings}
              className="px-6 py-2 bg-cyan-400 text-white font-semibold rounded uppercase text-sm hover:bg-cyan-500 transition-colors"
            >
              Save Settings
            </button>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="bg-white border border-gray-300 rounded p-2 hover:bg-gray-50"
            >
              <Star
                size={20}
                className={isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
              />
            </button>
            <button className="bg-white border border-gray-300 rounded p-2 hover:bg-gray-50">
              <MoreVertical size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {["status", "settings", "access"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-medium uppercase tracking-wide rounded-t transition-colors ${
              activeTab === tab
                ? "bg-gray-200 text-gray-800"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Status Tab */}
      {activeTab === "status" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            {/* STATUS FIELD */}
            <div className="mb-6">
              <label className="block text-xs text-gray-500 uppercase mb-2 tracking-wide">
                STATUS
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-lime-500"
              >
                <option value="PLANNED">Planned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* TRACKED TIME */}
            <div className="mb-6">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                TRACKED
              </div>
              <div className="text-2xl font-normal text-gray-800">{totalTracked}</div>
            </div>

            {/* BILLABLE / NON-BILLABLE */}
            <div className="flex justify-between pt-4 border-t border-gray-200">
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">BILLABLE</div>
                <div className="text-base text-gray-800">{billableTime}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase mb-1">NON-BILLABLE</div>
                <div className="text-base text-gray-800">{nonBillableTime}</div>
              </div>
            </div>
          </div>

          {/* Right Circular Chart */}
          <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center justify-center">
            <svg width="280" height="280" viewBox="0 0 280 280">
              <circle
                cx="140"
                cy="140"
                r="100"
                fill="none"
                stroke="#84cc16"
                strokeWidth="60"
              />
              <text
                x="140"
                y="150"
                textAnchor="middle"
                fontSize="24"
                fill="#374151"
              >
                {totalTracked}
              </text>
            </svg>
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-lime-500 rounded-sm"></div>
                <span className="text-sm text-gray-600">Billable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
                <span className="text-sm text-gray-600">Non-billable</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-700 mb-6">Project Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
              {loadingClients ? (
                <div className="p-3 text-sm text-gray-500">Loading...</div>
              ) : (
                <select
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-sm bg-white"
                >
                  <option value="">Select client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.email}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Color */}
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <input
                type="color"
                value={projectColor}
                onChange={(e) => setProjectColor(e.target.value)}
                className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
              />
            </div>

            {/* Hourly Rate */}
            {/* <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Hourly Rate (USD)
              </label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                step="0.01"
                className="w-full p-3 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
              />
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate || today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Access Tab */}
      {activeTab === "access" && (
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-800 mb-6">Project Access</h3>

          {/* Visibility */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-4">Visibility</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === "public"}
                  onChange={(e) => setVisibility(e.target.value)}
                />
                <span className="text-sm text-gray-700">Public</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === "private"}
                  onChange={(e) => setVisibility(e.target.value)}
                />
                <span className="text-sm text-gray-700">Private</span>
              </label>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-700">Team Members</h4>
              <button
                onClick={() => setShowAddMember(!showAddMember)}
                className="px-4 py-2 bg-cyan-400 text-white rounded text-sm flex items-center gap-2 hover:bg-cyan-500"
              >
                <Plus size={16} /> Add Member
              </button>
            </div>

            {/* Add Member Form */}
            {showAddMember && (
              <div className="p-4 bg-gray-50 rounded mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Role Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded text-sm bg-white"
                      disabled={loadingRoles}
                    >
                      <option value="">All Roles (Show all users)</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* User Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded text-sm bg-white"
                      disabled={loadingUsers || filteredUsers.length === 0}
                    >
                      <option value="">
                        {filteredUsers.length === 0 ? "No users available" : "Select User"}
                      </option>
                      {filteredUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.user_name} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddMember}
                    disabled={!selectedUser}
                    className="px-4 py-2 bg-cyan-400 text-white rounded text-sm hover:bg-cyan-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddMember(false);
                      setSelectedRole("");
                      setSelectedUser("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Members Table */}
            {teamMembers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">NAME</th>
                      <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">EMAIL</th>
                      <th className="p-3 text-left text-xs font-semibold text-gray-600 uppercase">ROLE</th>
                      <th className="p-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-4 text-sm text-gray-800">{member.name}</td>
                        <td className="p-4 text-sm text-gray-600">{member.email}</td>
                        <td className="p-4 text-sm text-gray-600">{member.role}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No team members added yet. Click "Add Member" to get started.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;