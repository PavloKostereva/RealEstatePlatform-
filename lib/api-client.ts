import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Створюємо базовий axios інстанс з налаштуваннями
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: typeof window !== 'undefined' ? window.location.origin : '',
    timeout: 30000,
    withCredentials: true, // Важливо: передаємо cookies для авторизації
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor для додавання токенів тощо
  client.interceptors.request.use(
    (config) => {
      // Можна додати токени авторизації тут
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // Response interceptor для обробки помилок
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Глобальна обробка помилок
      if (error.response?.status === 401) {
        // Можна додати логіку редиректу на логін
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient();

// Типи для API відповідей
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface ListingsResponse {
  listings: any[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

// API функції з кешуванням
export const listingsApi = {
  getListings: async (params?: Record<string, any>): Promise<ListingsResponse> => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const { data } = await apiClient.get<ListingsResponse>(
      `/api/listings?${queryParams.toString()}`,
    );
    return data;
  },

  getListing: async (id: string): Promise<any> => {
    const { data } = await apiClient.get(`/api/listings/${id}`);
    return data;
  },

  createListing: async (listing: any): Promise<any> => {
    const { data } = await apiClient.post('/api/listings', listing);
    return data;
  },

  updateListing: async (id: string, listing: any): Promise<any> => {
    const { data } = await apiClient.put(`/api/listings/${id}`, listing);
    return data;
  },
};

export const savedApi = {
  checkSaved: async (listingId: string): Promise<{ saved: boolean }> => {
    const { data } = await apiClient.get(`/api/saved/${listingId}`);
    return data;
  },

  toggleSaved: async (listingId: string, isSaved: boolean): Promise<void> => {
    if (isSaved) {
      await apiClient.delete(`/api/saved/${listingId}`);
    } else {
      await apiClient.post(`/api/saved/${listingId}`);
    }
  },
};

export const adminApi = {
  getStats: async (): Promise<any> => {
    const { data } = await apiClient.get('/api/admin/stats');
    return data;
  },

  getAdminListings: async (status?: string): Promise<any[]> => {
    const params = status ? `?status=${status}` : '?status=all';
    try {
      const response = await apiClient.get(`/api/admin/listings${params}`);
      console.log('adminApi.getAdminListings response:', {
        status: response.status,
        data: response.data,
        isArray: Array.isArray(response.data),
        length: Array.isArray(response.data) ? response.data.length : 'not array',
      });
      return response.data;
    } catch (error: any) {
      console.error('adminApi.getAdminListings error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
};
