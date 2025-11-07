import api from './axios';
import type { User, PaginatedResponse, PaginationParams } from '../utils/types';
import { API_ENDPOINTS } from '../services/endpoint';

export const usersAPI = {
  getUsers: async (params?: PaginationParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>(API_ENDPOINTS.USERS.GET_ALL, { params });
    return response.data;
  },

  createUser: async (userData: Partial<User>): Promise<User> => {
    const response = await api.post<User>(API_ENDPOINTS.USERS.CREATE, userData);
    return response.data;
  },

  getUserById: async (userId: number): Promise<User> => {
    const url = API_ENDPOINTS.USERS.GET_SINGLE.replace('{user_id}', String(userId));
    const response = await api.get<User>(url);
    return response.data;
  },

  updateUser: async (user_name: string, userData: Partial<User>): Promise<User> => {
  const url = API_ENDPOINTS.USERS.UPDATE.replace('{user_name}', String(user_name));

  // Send user_name + other fields as payload
  const payload = {
    ...(userData.user_name ? { user_name: userData.user_name } : {}),
    ...(userData.email ? { email: userData.email } : {}),
    ...(userData.password ? { password: userData.password } : {}),
    ...(userData.role_id ? { role_id: userData.role_id } : {}),
    ...(userData.status ? { status: userData.status } : {}),
    ...(userData.is_active !== undefined ? { is_active: userData.is_active } : {}),
  };

  const response = await api.put<User>(url, payload);
  return response.data;
},


  deleteUser: async (userId: number): Promise<void> => {
    const url = API_ENDPOINTS.USERS.DELETE.replace('{user_id}', String(userId));
    await api.delete(url);
  },
};
