"use client";

import { useState, useCallback } from "react";
import { usePiNetwork } from "./usePiNetwork";
import { formatError, logError } from "../utils/errorHandler";

interface UseAuthenticatedActionOptions {
  onSuccess?: (result: unknown) => void;
  onError?: (error: unknown) => void;
  retryOnAuth?: boolean; // Whether to automatically retry after authentication
}

interface UseAuthenticatedActionReturn<T> {
  execute: (...args: unknown[]) => Promise<T>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  isAuthenticating: boolean;
}

/**
 * Hook that wraps API calls with automatic authentication handling
 * If an authentication error occurs, it will attempt to re-authenticate
 * and optionally retry the original action
 */
export function useAuthenticatedAction<T>(
  action: (...args: unknown[]) => Promise<T>,
  options: UseAuthenticatedActionOptions = {}
): UseAuthenticatedActionReturn<T> {
  const { authenticate } = usePiNetwork();
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { onSuccess, onError, retryOnAuth = true } = options;

  const isAuthenticationError = useCallback((error: unknown): boolean => {
    if (!error) return false;
    
    const errorStr = formatError(error).toLowerCase();
    
    // Check for common authentication error patterns
    const authErrorPatterns = [
      'unauthorized',
      'token',
      'authentication',
      'authenticate',
      'login',
      'access denied',
      'forbidden',
      'invalid token',
      'expired token',
      'missing token',
      'token missing',
      'not authenticated',
      'auth',
      'session expired',
      'please log in',
      'middleware',
      '401',
      '403'
    ];
    
    return authErrorPatterns.some(pattern => errorStr.includes(pattern));
  }, []);

  const execute = useCallback(async (...args: unknown[]): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      // First attempt
      const result = await action(...args);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (firstError) {
      // Check if it's an authentication error
      if (isAuthenticationError(firstError) && authenticate) {
        console.log("Authentication error detected, attempting to re-authenticate...");
        
        try {
          setIsAuthenticating(true);
          
          // Attempt to re-authenticate
          const authResult = await authenticate();
          
          if (authResult && retryOnAuth) {
            console.log("Re-authentication successful, retrying original action...");
            
            // Retry the original action
            const retryResult = await action(...args);
            
            if (onSuccess) {
              onSuccess(retryResult);
            }
            
            return retryResult;
          } else {
            // Authentication succeeded but we're not retrying automatically
            throw new Error("Please try your action again after authentication");
          }
        } catch (authError) {
          console.error("Re-authentication failed:", authError);
          const errorMessage = formatError(authError);
          logError("Authentication Retry", authError);
          setError(errorMessage);
          
          if (onError) {
            onError(authError);
          }
          
          throw authError;
        } finally {
          setIsAuthenticating(false);
        }
      } else {
        // Not an authentication error, or no authenticate function available
        const errorMessage = formatError(firstError);
        logError("Action Execution", firstError);
        setError(errorMessage);
        
        if (onError) {
          onError(firstError);
        }
        
        throw firstError;
      }
    } finally {
      setIsLoading(false);
    }
  }, [action, authenticate, isAuthenticationError, onSuccess, onError, retryOnAuth]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    execute,
    isLoading,
    error,
    clearError,
    isAuthenticating,
  };
}