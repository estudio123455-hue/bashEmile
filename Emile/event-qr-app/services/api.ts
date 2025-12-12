import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api'  // Development
  : 'https://backend-estudio123455-hues-projects.vercel.app/api'; // Production

const TOKEN_KEY = '@event_app_token';

// Types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ msg: string }>;
}

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  token: string;
}

interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  price: number;
  currency: string;
  image: string;
  availableTickets: number;
  category: string;
}

interface OrderData {
  orderId: string;
  paypalOrderId: string;
  approvalUrl: string | null;
  amount: {
    subtotalCOP: number;
    subtotalUSD: number;
    paypalFee: number;
    totalUSD: number;
  };
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
  };
  quantity: number;
}

interface TicketData {
  id: string;
  ticketId: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  quantity: number;
  totalPrice: number;
  status: 'valid' | 'used' | 'expired' | 'cancelled';
  qrCode: string;
  purchaseDate: string;
}

// Helper to get auth token
const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

// Helper to save auth token
const saveToken = async (token: string): Promise<void> => {
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

// Helper to remove auth token
const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

// Base fetch with auth
const apiFetch = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const token = await getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.errors?.[0]?.msg || 'Request failed',
      };
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection.',
    };
  }
};

// ============ AUTH API ============

export const authApi = {
  register: async (name: string, email: string, password: string) => {
    const response = await apiFetch<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (response.success && response.data?.token) {
      await saveToken(response.data.token);
    }

    return response;
  },

  login: async (email: string, password: string) => {
    const response = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      await saveToken(response.data.token);
    }

    return response;
  },

  logout: async () => {
    await removeToken();
    return { success: true };
  },

  getProfile: async () => {
    return apiFetch<LoginResponse['user']>('/auth/me');
  },

  updateProfile: async (data: { name?: string; avatar?: string }) => {
    return apiFetch<LoginResponse['user']>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getToken,
  saveToken,
  removeToken,
};

// ============ EVENTS API ============

export const eventsApi = {
  getAll: async (params?: { category?: string; search?: string; limit?: number; offset?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const query = queryParams.toString();
    return apiFetch<{ events: EventData[]; pagination: any }>(`/events${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return apiFetch<EventData>(`/events/${id}`);
  },
};

// ============ PAYPAL API ============

export const paypalApi = {
  createOrder: async (eventId: string, quantity: number) => {
    return apiFetch<OrderData>('/paypal/create-order', {
      method: 'POST',
      body: JSON.stringify({ eventId, quantity }),
    });
  },

  captureOrder: async (orderId: string, paypalOrderId: string) => {
    return apiFetch<{ orderId: string; captureId: string; status: string }>('/paypal/capture-order', {
      method: 'POST',
      body: JSON.stringify({ orderId, paypalOrderId }),
    });
  },

  getOrderStatus: async (orderId: string) => {
    return apiFetch<{ orderId: string; status: string; amount: any }>(`/paypal/order/${orderId}`);
  },

  demoPayment: async (orderId: string) => {
    return apiFetch<{ orderId: string; transactionId: string; status: string }>('/paypal/demo-payment', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },
};

// ============ TICKETS API ============

export const ticketsApi = {
  generate: async (orderId: string) => {
    return apiFetch<TicketData>('/tickets/generate', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },

  getAll: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiFetch<TicketData[]>(`/tickets${query}`);
  },

  getById: async (id: string) => {
    return apiFetch<TicketData>(`/tickets/${id}`);
  },

  refreshQR: async (id: string) => {
    return apiFetch<{ qrCode: string; qrToken: string; expiresAt: string }>(`/tickets/${id}/refresh-qr`, {
      method: 'POST',
    });
  },

  validate: async (id: string, token: string) => {
    return apiFetch<{ valid: boolean; status: string; message: string }>(`/tickets/${id}/validate`, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },
};

// Export all APIs
export default {
  auth: authApi,
  events: eventsApi,
  paypal: paypalApi,
  tickets: ticketsApi,
  getToken,
};
