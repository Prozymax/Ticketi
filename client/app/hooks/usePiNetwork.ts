"use client";

import {useState, useEffect, useCallback} from "react";
import {PiNetworkService} from "../lib/PiNetwork";
import {apiService, AuthResponseData, BackendUser} from "../lib/api";
import CookieAuthService from "../utils/cookieAuth";

interface UsePiNetworkReturn {
  piService: PiNetworkService | null;
  isAuthenticated: boolean;
  user: BackendUser | null;
  isLoading: boolean;
  error: string | null;
  authenticate: () => Promise<BackendUser | void>;
  createPayment: (
    amount: number,
    memo: string,
    metadata?: Record<string, unknown>
  ) => Promise<string>;
  createPaymentWithBackend: (
    ticketId: string,
    quantity: number,
    eventId: string,
    amount: number,
    memo?: string,
    metadata?: Record<string, unknown>
  ) => Promise<{ paymentId: string; backendPaymentId: string }>;
  shareContent: (title: string, message: string) => void;
  isSDKReady: boolean;
  logout: () => void;
}

export const usePiNetwork = (): UsePiNetworkReturn => {
  const [piService, setPiService] = useState<PiNetworkService | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<BackendUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSDKReady, setIsSDKReady] = useState<boolean>(false);

  useEffect(() => {
    const sandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === "true";
    const service = new PiNetworkService(sandbox);
    setPiService(service);

    const checkSDKReady = () => {
      if (service.isSDKAvailable()) {
        console.log('Pi SDK is ready');
        setIsSDKReady(true);
      } else {
        console.log('Pi SDK not ready, retrying...');
        setTimeout(checkSDKReady, 500);
      }
    };

    // Start checking immediately and continue until ready
    checkSDKReady();
  }, []);

  const authenticate = useCallback(async (): Promise<BackendUser | void> => {
    if (!piService) {
      setError("Pi Network service not initialized");
      return;
    }

    if (!piService.isSDKAvailable()) {
      setError("Pi SDK is not available. Please wait for it to load.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Starting Pi Network authentication...");
      
      // Step 1: Authenticate with Pi Network SDK
      const piAuthResult = await piService.authenticateUser();
      console.log("Pi Network auth result:", piAuthResult);

      if (!piAuthResult.accessToken) {
        throw new Error("No access token received from Pi Network");
      }

      // Step 2: Send access token to backend for verification and user creation/update
      const backendAuthResult: AuthResponseData = await apiService.authenticateUser(
        piAuthResult.accessToken,
        piAuthResult.user.username,
      );
      console.log("Backend auth result:", backendAuthResult);

      // Step 3: Store user data and set authenticated state
      setIsAuthenticated(true);
      setUser(backendAuthResult.user);

      // Store minimal user data for UI purposes (sensitive data is in HTTP-only cookies)
      CookieAuthService.storeUserData({
        username: backendAuthResult.user.username,
        id: backendAuthResult.user.id,
        isVerified: backendAuthResult.user.isVerified,
      });

      console.log("Authentication successful");
      return backendAuthResult.user;

    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Authentication failed";
      console.error("Authentication error:", err);
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);

      // Clear any stored auth data on error
      CookieAuthService.clearAll();
    } finally {
      setIsLoading(false);
    }
  }, [piService]);

  const createPayment = useCallback(
    async (
      amount: number,
      memo: string,
      metadata: Record<string, unknown> = {}
    ): Promise<string> => {
      if (!piService) {
        throw new Error("Pi Network service not initialized");
      }

      if (!isAuthenticated) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      setError(null);

      try {
        const paymentId = await piService.createPayment(amount, memo, metadata);
        return paymentId;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Payment creation failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [piService, isAuthenticated]
  );

  const createPaymentWithBackend = useCallback(
    async (
      ticketId: string,
      quantity: number,
      eventId: string,
      amount: number,
      memo?: string,
      metadata?: Record<string, unknown>
    ): Promise<{ paymentId: string; backendPaymentId: string }> => {
      if (!piService) {
        throw new Error("Pi Network service not initialized");
      }

      if (!isAuthenticated) {
        throw new Error("User not authenticated");
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await piService.createPaymentWithBackend(
          ticketId,
          quantity,
          eventId,
          amount,
          memo,
          metadata
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Payment creation failed";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [piService, isAuthenticated]
  );

  const shareContent = useCallback(
    (title: string, message: string): void => {
      if (!piService) {
        setError("Pi Network service not initialized");
        return;
      }

      try {
        piService.openShareDialog(title, message);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Share dialog failed";
        setError(errorMessage);
      }
    },
    [piService]
  );

  const logout = useCallback(async () => {
    try {
      // Call server logout to clear HTTP-only cookies
      await apiService.logout();
    } catch (error) {
      console.error("Server logout failed:", error);
    } finally {
      // Clear client-side state regardless of server response
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      CookieAuthService.clearAll();
    }
  }, []);

  // Check for stored user data on mount and verify with server
  useEffect(() => {
    const checkAuthStatus = async () => {
      const userData = CookieAuthService.getUserData();
      if (userData) {
        try {
          // Verify authentication with server by making a test request
          // The server will check the HTTP-only cookie
          const response = await apiService.healthCheck();
          if (response) {
            // If we can make authenticated requests, restore user state
            setIsAuthenticated(true);
            setUser({
              id: userData.id,
              username: userData.username,
              isVerified: userData.isVerified,
              piWalletAddress: '', // Will be populated by server if needed
              piData: {} // Will be populated by server if needed
            } as BackendUser);
          }
        } catch (error) {
          console.error("Auth verification failed:", error);
          // Clear invalid auth data
          CookieAuthService.clearAll();
        }
      }
    };

    checkAuthStatus();
  }, []); 

  return {
    piService,
    isAuthenticated,
    user,
    isLoading,
    error,
    authenticate,
    createPayment,
    createPaymentWithBackend,
    shareContent,
    isSDKReady,
    logout,
  };
};
