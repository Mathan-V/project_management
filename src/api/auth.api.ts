import api from './axios';
import type { LoginInput, SignupInput, AuthResponse, User, Role } from '../utils/types';
import { API_ENDPOINTS } from '../services/endpoint';

export const authAPI = {
  login: async (credentials: LoginInput): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNIN, credentials);
    return response.data;
  },

  signup: async (userData: SignupInput): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, userData);
    return response.data;
  },


  forgotPassword: async (email: string): Promise<void> => {
    await api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await api.post('/auth/reset-password', { token, newPassword });
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  updateProfile: async (userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/auth/profile', userData);
    return response.data;
  },
  getAllRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>(API_ENDPOINTS.ROLES.GET_ALL);
    return response.data;
  },
  
};