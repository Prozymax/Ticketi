'use client';

import { useState, useEffect, useCallback } from 'react';
import { PiNetworkService } from '../lib/PiNetwork';

interface AuthResult {
  accessToken: string;
  user: {
    uid: string;
    username: string;
  };
}

interface UsePiNetworkReturn {
  piService: PiNetworkService | null;
  isAuthenticated: boolean;
  user: AuthResult['user'] | null;
  isLoading: boolean;
  error: string | null;
  authenticate: () => Promise<void>;
  createPayment: (amount: number, memo: string, metadata?: Record<string, unknown>) => Promise<string>;
  shareContent: (title: string, message: string) => void;
  isSDKReady: boolean;
}

export const usePiNetwork = (): UsePiNetworkReturn => {
  const [piService, setPiService] = useState<PiNetworkService | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AuthResult['user'] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSDKReady, setIsSDKReady] = useState<boolean>(false);

  useEffect(() => {
    const sandbox = process.env.NEXT_PUBLIC_PI_SANDBOX === 'true';
    const service = new PiNetworkService(sandbox);
    setPiService(service);

    const checkSDKReady = () => {
      if (service.isSDKAvailable()) {
        setIsSDKReady(true);
      } else {
        setTimeout(checkSDKReady, 1000);
      }
    };

    checkSDKReady();
  }, []);

  const authenticate = useCallback(async (): Promise<void> => {
    if (!piService) {
      setError('Pi Network service not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const authResult = await piService.authenticateUser();
      console.log(authResult)
      setIsAuthenticated(true);
      setUser(authResult.user);
      
      localStorage.setItem('pi_auth', JSON.stringify({
        accessToken: authResult.accessToken,
        user: authResult.user,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [piService]);

  const createPayment = useCallback(async (
    amount: number, 
    memo: string, 
    metadata: Record<string, unknown> = {}
  ): Promise<string> => {
    if (!piService) {
      throw new Error('Pi Network service not initialized');
    }

    if (!isAuthenticated) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const paymentId = await piService.createPayment(amount, memo, metadata);
      return paymentId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment creation failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [piService, isAuthenticated]);

  const shareContent = useCallback((title: string, message: string): void => {
    if (!piService) {
      setError('Pi Network service not initialized');
      return;
    }

    try {
      piService.openShareDialog(title, message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Share dialog failed';
      setError(errorMessage);
    }
  }, [piService]);

  useEffect(() => {
    const storedAuth = localStorage.getItem('pi_auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        setIsAuthenticated(true);
        setUser(authData.user);
      } catch (err) {
        console.error('Failed to parse stored auth data:', err);
        localStorage.removeItem('pi_auth');
      }
    }
  }, []);

  return {
    piService,
    isAuthenticated,
    user,
    isLoading,
    error,
    authenticate,
    createPayment,
    shareContent,
    isSDKReady,
  };
};