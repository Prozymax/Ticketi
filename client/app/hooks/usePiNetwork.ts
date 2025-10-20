"use client";

import {useState, useEffect, useCallback} from "react";
import {PiNetworkService} from "../lib/PiNetwork";
import {apiService, AuthResponseData, BackendUser} from "../lib/api";
import {formatError, logError} from "../utils/errorHandler";

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

      // Store token in localStorage as pioneer-key
      localStorage.setItem('pioneer-key', backendAuthResult.user.token);
      
      // Store minimal user data for UI purposes
      const userInfo = {
        username: backendAuthResult.user.username,
        id: backendAuthResult.user.id,
        isVerified: backendAuthResult.user.isVerified,
        timestamp: Date.now(),
      };
      localStorage.setItem("pi_user_info", JSON.stringify(userInfo));

      console.log("Authentication successful");
      return backendAuthResult.user;

    } catch (err) {
      const errorMessage = formatError(err);
      logError("Authentication", err);
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);

      // Clear any stored auth data on error
      localStorage.removeItem('pioneer-key');
      localStorage.removeItem('pi_user_info');
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
        const errorMessage = formatError(err);
        logError("Payment Creation", err);
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
        const errorMessage = formatError(err);
        logError("Payment Creation with Backend", err);
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
        const errorMessage = formatError(err);
        logError("Share Dialog", err);
        setError(errorMessage);
      }
    },
    [piService]
  );

  const logout = useCallback(async () => {
    try {
      // Call server logout endpoint
      await apiService.logout();
    } catch (error) {
      console.error("Server logout failed:", error);
    } finally {
      // Clear client-side state regardless of server response
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
      localStorage.removeItem('pioneer-key');
      localStorage.removeItem('pi_user_info');
    }
  }, []);

  // Check for stored user data on mount and verify with server
  useEffect(() => {
    const checkAuthStatus = async () => {
      const pioneerKey = localStorage.getItem('pioneer-key');
      const userInfoStr = localStorage.getItem('pi_user_info');
      
      if (pioneerKey && userInfoStr) {
        try {
          const userData = JSON.parse(userInfoStr);
          
          // Check if data is not too old (24 hours)
          const isExpired = Date.now() - userData.timestamp > 24 * 60 * 60 * 1000;
          if (isExpired) {
            localStorage.removeItem('pioneer-key');
            localStorage.removeItem('pi_user_info');
            return;
          }

          // Verify authentication with server by making a test request
          const response = await apiService.healthCheck();
          if (response) {
            // If we can make authenticated requests, restore user state
            setIsAuthenticated(true);
            setUser({
              id: userData.id,
              username: userData.username,
              isVerified: userData.isVerified,
              token: pioneerKey,
              piWalletAddress: '', // Will be populated by server if needed
              piData: {} // Will be populated by server if needed
            } as BackendUser);
          }
        } catch (error) {
          logError("Auth Verification", error);
          // Clear invalid auth data
          localStorage.removeItem('pioneer-key');
          localStorage.removeItem('pi_user_info');
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
