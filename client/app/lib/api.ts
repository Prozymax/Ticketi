// API service for backend communication
import {formatError, logError} from "../utils/errorHandler";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

// Get token from localStorage
export const getAccessToken = (): string | null => {
  if (typeof window !== "undefined") {
    console.log(localStorage.getItem("pioneer-key"), "local storage");
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
  followersCount: number;
  followingCount: number;
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

  async getMyEvents(): Promise<ApiResponse> {
    console.log("API: Getting my events");
    const response = await this.makeRequest("/api/events/my");
    console.log("API: My events response:", response);
    return response;
  }

  async getEventsNearLocation(location: string, page = 1, limit = 10): Promise<ApiResponse> {
    console.log("API: Getting events near location:", location);
    console.log("API: Encoded location:", encodeURIComponent(location));
    const response = await this.makeRequest(
      `/api/events/near?location=${encodeURIComponent(location)}&page=${page}&limit=${limit}`
    );
    console.log("API: Events near location response:", response);
    return response;
  }

  async getTrendingEvents(page = 1, limit = 10): Promise<ApiResponse> {
    console.log("API: Getting trending events");
    const response = await this.makeRequest(
      `/api/events/trending?page=${page}&limit=${limit}`
    );
    console.log("API: Trending events response:", response);
    return response;
  }

  async getEventsAroundWorld(page = 1, limit = 10): Promise<ApiResponse> {
    console.log("API: Getting events around world");
    const response = await this.makeRequest(
      `/api/events/world?page=${page}&limit=${limit}`
    );
    console.log("API: Events around world response:", response);
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

    // Check if eventData contains a file
    const hasFile =
      eventData &&
      typeof eventData === "object" &&
      "eventImage" in eventData &&
      eventData.eventImage instanceof File;

    if (hasFile) {
      // Use FormData for file upload
      const formData = new FormData();

      console.log(
        "API: Creating event with file upload, eventData:",
        eventData
      );

      // Add all event data fields to FormData
      Object.entries(eventData as Record<string, any>).forEach(
        ([key, value]) => {
          if (key === "eventImage" && value instanceof File) {
            console.log(
              "API: Adding file to FormData:",
              value.name,
              value.size
            );
            formData.append("eventImage", value);
          } else if (key === "ticketTypes" && Array.isArray(value)) {
            formData.append("ticketTypes", JSON.stringify(value));
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        }
      );

      // Log FormData contents
      console.log("API: FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      // Make request with FormData (don't set Content-Type, let browser set it)
      const url = `${this.baseUrl}/api/events`;
      const accessToken = getAccessToken();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "x-access-token": accessToken || "",
          // Don't set Content-Type for FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Request failed");
      }

      console.log("API: Event creation response:", data);
      return data;
    } else {
      // Use regular JSON request
      const response = await this.makeRequest("/api/events", {
        method: "POST",
        body: JSON.stringify(eventData),
      });
      console.log("API: Event creation response:", response);
      return response;
    }
  }

  async updateEvent(
    eventId: string,
    updateData: unknown
  ): Promise<ApiResponse> {
    console.log("API: Updating event:", eventId, updateData);

    // Check if updateData contains a file
    const hasFile =
      updateData &&
      typeof updateData === "object" &&
      "eventImage" in updateData &&
      updateData.eventImage instanceof File;

    if (hasFile) {
      // Use FormData for file upload
      const formData = new FormData();

      // Add all update data fields to FormData
      Object.entries(updateData as Record<string, any>).forEach(
        ([key, value]) => {
          if (key === "eventImage" && value instanceof File) {
            formData.append("eventImage", value);
          } else if (key === "ticketTypes" && Array.isArray(value)) {
            formData.append("ticketTypes", JSON.stringify(value));
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        }
      );

      // Make request with FormData
      const url = `${this.baseUrl}/api/events/${eventId}`;
      const accessToken = getAccessToken();

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "x-access-token": accessToken || "",
          // Don't set Content-Type for FormData
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Request failed");
      }

      console.log("API: Event update response:", data);
      return data;
    } else {
      // Use regular JSON request
      const response = await this.makeRequest(`/api/events/${eventId}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });
      console.log("API: Event update response:", response);
      return response;
    }
  }

  async publishEvent(eventId: string): Promise<ApiResponse> {
    console.log("API: Publishing event:", eventId);
    const response = await this.makeRequest(`/api/events/${eventId}/publish`, {
      method: "POST",
    });
    console.log("API: Event publish response:", response);
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

  // Follow API methods
  async followUser(followingId: string): Promise<ApiResponse> {
    console.log("API: Following user:", followingId);
    const response = await this.makeRequest("/api/follow/follow", {
      method: "POST",
      body: JSON.stringify({ followingId }),
    });
    console.log("API: Follow user response:", response);
    return response;
  }

  async unfollowUser(followingId: string): Promise<ApiResponse> {
    console.log("API: Unfollowing user:", followingId);
    const response = await this.makeRequest(`/api/follow/unfollow/${followingId}`, {
      method: "DELETE",
    });
    console.log("API: Unfollow user response:", response);
    return response;
  }

  async checkFollowStatus(userId: string): Promise<ApiResponse> {
    console.log("API: Checking follow status for user:", userId);
    const response = await this.makeRequest(`/api/follow/status/${userId}`);
    console.log("API: Follow status response:", response);
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
