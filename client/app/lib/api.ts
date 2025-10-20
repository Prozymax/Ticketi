// API service for backend communication
import { formatError, logError } from "../utils/errorHandler";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

// Get token from localStorage
const getAccessToken = (): string | null => {
  if (typeof window !== "undefined") {
    console.log(localStorage.getItem("pioneer-key"), 'local storage')
    return localStorage.getItem("pioneer-key");
  }
  return null;
};

interface ApiResponse<T = unknown> {
  success: boolean;
  status?: number;
  message: string;
  data: T;
  timestamp?: string;
}

interface BackendUser {
  id: string;
  username: string;
  piWalletAddress: string;
  isVerified: boolean;
  token: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  lastLogin?: string;
  createdAt?: string;
  piData?: {
    uid: string;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  piWalletAddress?: string;
  profileImage?: string;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface UserStats {
  eventsCreated: number;
  ticketsPurchased: number;
  totalSpent: number;
  joinDate: string;
}

interface ProfileUpdateData {
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}

interface AuthResponseData {
  user: BackendUser;
  success: boolean;
  message: string;
}

interface ConfirmVerificationData {
  user: {
    is_verified: boolean;
    username: string;
  };
  verified: boolean;
  error: boolean;
  message: string;
}

interface PaymentData {
  ticketId: string;
  quantity: number;
  eventId: string;
  amount: number;
  memo?: string;
  metadata?: Record<string, unknown>;
}

interface PaymentResponse {
  id: string;
  amount: number;
  status: "pending" | "approved" | "completed" | "cancelled" | "failed";
  transactionHash?: string;
  purchaseId: string;
  createdAt: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const accessToken = getAccessToken();
      console.log(accessToken, 'jishdushdu')

      const response = await fetch(url, {
        headers: {
          "x-access-token": accessToken || "",
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(data);
        throw new Error(data.message || data.error || "Request failed");
      }
      console.log(data);
      return data;
    } catch (error) {
      logError("API Request", error);
      // Re-throw with formatted error message
      throw new Error(formatError(error));
    }
  }

  // confirm user verification status before login
  async confirmUserVerification(
    username: string
  ): Promise<ConfirmVerificationData> {
    console.log(
      "API: Calling Backend for user confirmation with username:",
      username
    );

    const response = await this.makeRequest<ConfirmVerificationData>(
      `/api/auth/confirm-username?username=${encodeURIComponent(username)}`
    );

    console.log("API: Backend response:", response);
    // Return the data property which contains the actual response data
    return response.data;
  }

  // Authenticate user with Pi Network access token
  async authenticateUser(
    piAccessToken: string,
    username: string
  ): Promise<AuthResponseData> {
    console.log("API: Calling backend authentication with token:", username);

    const response = await this.makeRequest<AuthResponseData>(
      "/api/auth/authenticate",
      {
        method: "POST",
        body: JSON.stringify({accessToken: piAccessToken, username}),
      }
    );

    console.log("API: Backend response:", response);
    // Return the data property which contains the actual response data
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{
    message: string;
    timestamp: string;
    environment: string;
  }> {
    console.log("API: Checking backend health at:", `${this.baseUrl}/api/auth`);
    const response = await this.makeRequest<{
      message: string;
      timestamp: string;
      environment: string;
    }>("/api/auth");
    console.log("API: Health check response:", response);
    // For health check, the response structure is different (no data wrapper)
    return {
      message: response.message,
      timestamp: response.timestamp || "",
      environment: (response as {environment?: string}).environment || "",
    };
  }

  async onIncompletePayment(paymentId: string): Promise<ApiResponse> {
    console.log(
      "API: Calling backend onIncompletePayment with paymentId:",
      paymentId
    );
    const response = await this.makeRequest("/api/payment/on-incomplete", {
      method: "POST",
      body: JSON.stringify({paymentId}),
    });
    console.log("API: onIncompletePayment response:", response);
    return response;
  }

  async onServerApproval(paymentId: string): Promise<ApiResponse> {
    console.log(
      "API: Calling backend onServerApproval with paymentId:",
      paymentId
    );
    const response = await this.makeRequest("/api/payment/on-server-approval", {
      method: "POST",
      body: JSON.stringify({paymentId}),
    });
    console.log("API: onServerApproval response:", response);
    return response;
  }

  async onServerCancellation(paymentId: string): Promise<ApiResponse> {
    console.log(
      "API: Calling backend onServerCancellation with paymentId:",
      paymentId
    );
    const response = await this.makeRequest(
      "/api/payment/on-server-cancellation",
      {
        method: "POST",
        body: JSON.stringify({paymentId}),
      }
    );
    console.log("API: onServerCancellation response:", response);
    return response;
  }

  async onServerCompletion(
    paymentId: string,
    transactionHash?: string
  ): Promise<ApiResponse> {
    console.log(
      "API: Calling backend onServerCompletion with paymentId:",
      paymentId
    );
    const response = await this.makeRequest(
      "/api/payment/on-server-completion",
      {
        method: "POST",
        body: JSON.stringify({paymentId, transactionHash}),
      }
    );
    console.log("API: onServerCompletion response:", response);
    return response;
  }

  // Payment API methods
  async createPayment(
    paymentData: PaymentData
  ): Promise<ApiResponse<PaymentResponse>> {
    console.log("API: Creating payment:", paymentData);
    const response = await this.makeRequest<PaymentResponse>(
      "/api/payment/create",
      {
        method: "POST",
        body: JSON.stringify(paymentData),
      }
    );
    console.log("API: Payment creation response:", response);
    return response;
  }

  async approvePayment(
    paymentId: string
  ): Promise<ApiResponse<PaymentResponse>> {
    console.log("API: Approving payment:", paymentId);
    const response = await this.makeRequest<PaymentResponse>(
      `/api/payment/approve/${paymentId}`,
      {
        method: "POST",
      }
    );
    console.log("API: Payment approval response:", response);
    return response;
  }

  async completePayment(
    paymentId: string,
    transactionHash: string
  ): Promise<ApiResponse<PaymentResponse>> {
    console.log("API: Completing payment:", paymentId, transactionHash);
    const response = await this.makeRequest<PaymentResponse>(
      `/api/payment/complete/${paymentId}`,
      {
        method: "POST",
        body: JSON.stringify({transactionHash}),
      }
    );
    console.log("API: Payment completion response:", response);
    return response;
  }

  async cancelPayment(paymentId: string): Promise<ApiResponse> {
    console.log("API: Cancelling payment:", paymentId);
    const response = await this.makeRequest(
      `/api/payment/cancel/${paymentId}`,
      {
        method: "POST",
      }
    );
    console.log("API: Payment cancellation response:", response);
    return response;
  }

  async getPaymentStatus(
    paymentId: string
  ): Promise<ApiResponse<PaymentResponse>> {
    console.log("API: Getting payment status:", paymentId);
    const response = await this.makeRequest<PaymentResponse>(
      `/api/payment/status/${paymentId}`
    );
    console.log("API: Payment status response:", response);
    return response;
  }

  // Purchase API methods
  async createPurchase(purchaseData: {
    eventId: string;
    ticketId: string;
    quantity: number;
  }): Promise<ApiResponse> {
    console.log("API: Creating purchase:", purchaseData);
    const response = await this.makeRequest("/api/purchases", {
      method: "POST",
      body: JSON.stringify(purchaseData),
    });
    console.log("API: Purchase creation response:", response);
    return response;
  }

  async getUserPurchases(page = 1, limit = 10): Promise<ApiResponse> {
    console.log("API: Getting user purchases");
    const response = await this.makeRequest(
      `/api/purchases?page=${page}&limit=${limit}`
    );
    console.log("API: User purchases response:", response);
    return response;
  }

  async getPurchaseById(purchaseId: string): Promise<ApiResponse> {
    console.log("API: Getting purchase by ID:", purchaseId);
    const response = await this.makeRequest(`/api/purchases/${purchaseId}`);
    console.log("API: Purchase details response:", response);
    return response;
  }

  // Event API methods
  async getUserEvents(page = 1, limit = 10): Promise<ApiResponse> {
    console.log("API: Getting user events");
    const response = await this.makeRequest(
      `/api/events/user?page=${page}&limit=${limit}`
    );
    console.log("API: User events response:", response);
    return response;
  }

  async getEventById(eventId: string): Promise<ApiResponse> {
    console.log("API: Getting event by ID:", eventId);
    const response = await this.makeRequest(`/api/events/${eventId}`);
    console.log("API: Event details response:", response);
    return response;
  }

  async createEvent(eventData: unknown): Promise<ApiResponse> {
    console.log("API: Creating event:", eventData);
    const response = await this.makeRequest("/api/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
    console.log("API: Event creation response:", response);
    return response;
  }

  // Profile API methods
  async getUserProfile(): Promise<ApiResponse<UserProfile>> {
    console.log("API: Getting user profile");
    const response = await this.makeRequest<UserProfile>("/api/profile");
    console.log("API: Profile response:", response);
    return response;
  }

  async updateUserProfile(
    profileData: ProfileUpdateData
  ): Promise<ApiResponse<UserProfile>> {
    console.log("API: Updating user profile:", profileData);
    const response = await this.makeRequest<UserProfile>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    console.log("API: Profile update response:", response);
    return response;
  }

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    console.log("API: Getting user stats");
    const response = await this.makeRequest<UserStats>("/api/profile/stats");
    console.log("API: Stats response:", response);
    return response;
  }

  // Logout method to clear server-side cookies
  async logout(): Promise<ApiResponse> {
    console.log("API: Logging out user");
    const response = await this.makeRequest("/api/auth/logout", {
      method: "POST",
    });
    console.log("API: Logout response:", response);
    return response;
  }
}

export const apiService = new ApiService();
export type {
  ApiResponse,
  AuthResponseData,
  ConfirmVerificationData,
  BackendUser,
  PaymentData,
  PaymentResponse,
  UserProfile,
  UserStats,
  ProfileUpdateData,
};
