import axios from "axios";
import {apiService} from "@/app/lib/api";

// Get token from localStorage
const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('pioneer-key');
  }
  return null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers["x-access-token"] = token;
  }
  return config;
});

export interface CreateEventRequest {
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  ticketTypes: {
    ticketType: string;
    price: number;
    totalQuantity: number;
    availableQuantity: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaymentRequest {
  ticketId: string;
  quantity: number;
  eventId: string;
  amount: number;
  memo?: string;
  metadata?: Record<string, any>;
}

export interface PurchaseRequest {
  eventId: string;
  ticketId: string;
  quantity: number;
}

// Event API
export const eventAPI = {
  async createEvent(eventData: CreateEventRequest): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.createEvent(eventData);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create event",
      };
    }
  },

  async getUserEvents(page = 1, limit = 10): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.getUserEvents(page, limit);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to fetch events",
      };
    }
  },

  async getEventById(eventId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.getEventById(eventId);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to fetch event",
      };
    }
  },
};

// Payment API
export const paymentAPI = {
  async createPayment(paymentData: PaymentRequest): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.createPayment(paymentData);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create payment",
      };
    }
  },

  async approvePayment(paymentId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.approvePayment(paymentId);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to approve payment",
      };
    }
  },

  async completePayment(
    paymentId: string,
    transactionHash: string
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.completePayment(
        paymentId,
        transactionHash
      );
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to complete payment",
      };
    }
  },

  async cancelPayment(paymentId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.cancelPayment(paymentId);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to cancel payment",
      };
    }
  },

  async getPaymentStatus(paymentId: string): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.getPaymentStatus(paymentId);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to get payment status",
      };
    }
  },
};

// Purchase API
export const purchaseAPI = {
  async createPurchase(
    purchaseData: PurchaseRequest
  ): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.createPurchase(purchaseData);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create purchase",
      };
    }
  },

  async getUserPurchases(page = 1, limit = 10): Promise<ApiResponse<any>> {
    try {
      const response = await apiService.getUserPurchases(page, limit);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message || "Failed to fetch purchases",
      };
    }
  },

  async getPurchaseById(purchaseId: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await apiService.getPurchaseById(purchaseId);
      return {
        success: response.success,
        data: response.data,
        message: response.message,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error.message || "Failed to fetch purchase",
      };
    }
  },
};

export default api;
