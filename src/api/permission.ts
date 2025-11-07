import api from './axios';
import type { Permission, PaginatedResponse, PaginationParams } from '../utils/types';
import { API_ENDPOINTS } from '../services/endpoint';

export const permissionsAPI = {
  
  getPermissions: async (params?: PaginationParams): Promise<PaginatedResponse<Permission>> => {
    const response = await api.get<PaginatedResponse<Permission>>(API_ENDPOINTS.PERMISSIONS.GET_ALL, { params });
    return response.data;
  },

  createPermission: async (permissionData: Partial<Permission>): Promise<Permission> => {
    const response = await api.post<Permission>(API_ENDPOINTS.PERMISSIONS.CREATE, permissionData);
    return response.data;
  },

  getPermissionById: async (permissionId: number): Promise<Permission> => {
    const url = API_ENDPOINTS.PERMISSIONS.GET_SINGLE.replace('{permission_id}', String(permissionId));
    const response = await api.get<Permission>(url);
    return response.data;
  },

  updatePermission: async (permissionId: number, permissionData: Partial<Permission>): Promise<Permission> => {
    const url = API_ENDPOINTS.PERMISSIONS.UPDATE.replace('{permission_id}', String(permissionId));
    const response = await api.put<Permission>(url, permissionData);
    return response.data;
  },

  deletePermission: async (permissionId: number): Promise<void> => {
    const url = API_ENDPOINTS.PERMISSIONS.DELETE.replace('{permission_id}', String(permissionId));
    await api.delete(url);
  },
};
