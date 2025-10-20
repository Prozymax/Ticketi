"use client";

import { useState, useCallback } from "react";
import { apiService } from "../lib/api";
import { formatError, logError } from "../utils/errorHandler";

interface TicketPurchaseData {
  eventId: string;
  ticketType: string;
  quantity: number;
  totalAmount: number;
}

interface UseTicketPurchaseReturn {
  isLoading: boolean;
  error: string | null;
  purchaseTickets: (data: TicketPurchaseData) => Promise<boolean>;
  clearError: () => void;
}

export const useTicketPurchase = (): UseTicketPurchaseReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const purchaseTickets = useCallback(async (data: TicketPurchaseData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Create purchase request
      const purchaseResponse = await apiService.createPurchase({
        eventId: data.eventId,
        ticketId: "regular", // This should come from the ticket type
        quantity: data.quantity,
      });

      if (!purchaseResponse.success) {
        throw new Error(purchaseResponse.message || "Failed to create purchase");
      }

      // Create payment request
      const paymentResponse = await apiService.createPayment({
        ticketId: "regular",
        quantity: data.quantity,
        eventId: data.eventId,
        amount: data.totalAmount,
        memo: `Ticket purchase for event ${data.eventId}`,
        metadata: {
          ticketType: data.ticketType,
          purchaseId: purchaseResponse.data?.id,
        },
      });

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.message || "Failed to create payment");
      }

      return true;
    } catch (err) {
      const errorMessage = formatError(err);
      logError("Ticket Purchase", err);
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    purchaseTickets,
    clearError,
  };
};