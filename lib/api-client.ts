import axios, { AxiosInstance } from 'axios';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: typeof window !== 'undefined' ? window.location.origin : '',
    timeout: 30000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
      }
      return Promise.reject(error);
    },
  );

  return client;
};

export const apiClient = createApiClient();

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface Listing {
  id: string;
  [key: string]: unknown;
}

export interface ListingsResponse {
  listings: Listing[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export const listingsApi = {
  getListings: async (
    params?: Record<string, string | number | boolean>,
  ): Promise<ListingsResponse> => {
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

  getListing: async (id: string): Promise<Listing> => {
    const { data } = await apiClient.get<Listing>(`/api/listings/${id}`);
    return data;
  },

  createListing: async (listing: Record<string, unknown>): Promise<Listing> => {
    const { data } = await apiClient.post<Listing>('/api/listings', listing);
    return data;
  },

  updateListing: async (id: string, listing: Record<string, unknown>): Promise<Listing> => {
    const { data } = await apiClient.put<Listing>(`/api/listings/${id}`, listing);
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
  getStats: async (): Promise<Record<string, unknown>> => {
    try {
      const { data } = await apiClient.get<Record<string, unknown>>('/api/admin/stats');
      // Якщо є помилка в даних, але дані все ж таки повернулися (fallback)
      if (data.error && data.totalListings === 0) {
        console.warn('Stats API returned error, using fallback data:', data.error);
        return {
          totalListings: 0,
          totalUsers: 0,
          pendingListings: 0,
          listingsThisWeek: 0,
          usersThisWeek: 0,
          listingsByDay: [],
          usersByDay: [],
        };
      }
      return data;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      return {
        totalListings: 0,
        totalUsers: 0,
        pendingListings: 0,
        listingsThisWeek: 0,
        usersThisWeek: 0,
        listingsByDay: [],
        usersByDay: [],
      };
    }
  },

  getAdminListings: async (status?: string): Promise<Listing[]> => {
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
    } catch (error) {
      const errorObj = error as {
        message?: string;
        response?: { data?: unknown; status?: number };
      };
      console.error('adminApi.getAdminListings error:', {
        message: errorObj.message,
        response: errorObj.response?.data,
        status: errorObj.response?.status,
      });
      throw error;
    }
  },
};
