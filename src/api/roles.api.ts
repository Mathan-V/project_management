import api from './axios';
import type { Role, PaginatedResponse, PaginationParams } from '../utils/types';
import { API_ENDPOINTS } from '../services/endpoint';

export const rolesAPI = {
  getRoles: async (params?: PaginationParams): Promise<PaginatedResponse<Role>> => {
    const response = await api.get<PaginatedResponse<Role>>(API_ENDPOINTS.ROLES.GET_ALL, { params });
    return response.data;
  },

  createRole: async (roleData: Partial<Role>): Promise<Role> => {
    const response = await api.post<Role>(API_ENDPOINTS.ROLES.CREATE, roleData);
    return response.data;
  },

  getRoleById: async (roleId: number): Promise<Role> => {
    const url = API_ENDPOINTS.ROLES.GET_SINGLE.replace('{role_id}', String(roleId));
    const response = await api.get<Role>(url);
    return response.data;
  },

  updateRole: async (roleId: number, roleData: Partial<Role>): Promise<Role> => {
    const url = API_ENDPOINTS.ROLES.UPDATE.replace('{role_id}', String(roleId));
    const response = await api.put<Role>(url, roleData);
    return response.data;
  },

  deleteRole: async (roleId: number): Promise<void> => {
    const url = API_ENDPOINTS.ROLES.DELETE.replace('{role_id}', String(roleId));
    await api.delete(url);
  },

  // ✅ NEW: Update role permissions
  updateRolePermissions: async (roleId: number, permissionIds: number[]): Promise<Role> => {
    const url = API_ENDPOINTS.ROLES.UPDATE_PERMISSIONS?.replace('{role_id}', String(roleId)) 
      || `/roles/${roleId}/permissions/`;
    const response = await api.put<Role>(url, { permission_ids: permissionIds });
    return response.data;
  },

  // ✅ NEW: Get all unique permissions from all roles
  getAllPermissions: async () => {
    try {
      // Fetch all roles without pagination
      const response = await api.get<PaginatedResponse<Role>>(API_ENDPOINTS.ROLES.GET_ALL);
      const roles = response.data.results || response.data;
      
      const permissionsMap = new Map();
      
      // Extract unique permissions
      if (Array.isArray(roles)) {
        roles.forEach((role: any) => {
          if (role.permissions && Array.isArray(role.permissions)) {
            role.permissions.forEach((perm: any) => {
              if (!permissionsMap.has(perm.id)) {
                permissionsMap.set(perm.id, perm);
              }
            });
          }
        });
      }
      
      return Array.from(permissionsMap.values());
    } catch (error) {
      console.error('Error fetching all permissions:', error);
      return [];
    }
  },

  // ✅ NEW: Get permissions for a specific role
  getRolePermissions: async (roleId: number) => {
    const url = API_ENDPOINTS.ROLES.GET_PERMISSIONS?.replace('{role_id}', String(roleId))
      || `/roles/${roleId}/permissions/`;
    const response = await api.get(url);
    return response.data;
  },
};