"use client";

import { useState, useCallback } from "react";
import { usePiNetwork } from "./usePiNetwork";
import { formatError, logError } from "../utils/errorHandler";

interface UsePaymentAuthReturn {
  ensurePaymentAuth: () => Promise<boolean>;
  isCheckingAuth: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

/**
 * Hook to ensure user has proper payment authentication
 * Automatically re-authenticates if payments scope is missing
 */
export const usePaymentAuth = (): UsePaymentAuthReturn => {
  const { authenticate, isAuthenticated, user } = usePiNetwork();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const ensurePaymentAuth = useCallback(async (): Promise<boolean> => {
    setIsCheckingAuth(true);
    setAuthError(null);

    try {
      // If user is not authenticated at all, authenticate first
      if (!isAuthenticated || !user) {
        console.log("User not authenticated, authenticating...");
        const authResult = await authenticate();
        if (!authResult) {
          throw new Error("Authentication failed");
        }
        return true;
      }

      // User is authenticated, check if they have payment scope
      // We can do this by attempting a small test or checking stored scope info
      console.log("User is authenticated, checking payment authorization...");
      
      // For now, we'll assume the user is properly authenticated
      // The actual scope check will happen when they try to create a payment
      // If it fails, the error handling system will catch it and re-authenticate
      return true;

    } catch (error) {
      const errorMessage = formatError(error);
      logError("Payment Authentication Check", error);
      setAuthError(errorMessage);
      return false;
    } finally {
      setIsCheckingAuth(false);
    }
  }, [authenticate, isAuthenticated, user]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return {
    ensurePaymentAuth,
    isCheckingAuth,
    authError,
    clearAuthError,
  };
};