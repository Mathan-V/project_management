import api from './axios';
import type { Client, PaginatedResponse, PaginationParams } from '../utils/types';
import { API_ENDPOINTS } from '../services/endpoint';

export const clientsAPI = {
  getClients: async (params?: PaginationParams): Promise<PaginatedResponse<Client>> => {
    const response = await api.get<PaginatedResponse<Client>>(API_ENDPOINTS.CLIENTS.GET_ALL, { params });
    return response.data;
  },

  createClient: async (userData: Partial<Client>): Promise<Client> => {
    const response = await api.post<Client>(API_ENDPOINTS.CLIENTS.CREATE, userData);
    return response.data;
  },

  getClientById: async (userId: number): Promise<Client> => {
    const url = API_ENDPOINTS.CLIENTS.GET_SINGLE.replace('{client_id}', String(userId));
    const response = await api.get<Client>(url);
    return response.data;
  },

  updateClient: async (userId: number, userData: Partial<Client>): Promise<Client> => {
    const url = API_ENDPOINTS.CLIENTS.UPDATE.replace('{client_id}', String(userId));
    const response = await api.put<Client>(url, userData);
    return response.data;
  },

  deleteClient: async (userId: number): Promise<void> => {
    const url = API_ENDPOINTS.CLIENTS.DELETE.replace('{client_id}', String(userId));
    await api.delete(url);
  },
};
