"use client";

import {useState, useCallback} from "react";
import {apiService} from "../lib/api";
import {formatError, logError} from "../utils/errorHandler";
import {useAuthenticatedAction} from "./useAuthenticatedAction";

interface TicketPurchaseData {
  eventId: string;
  ticketId: string;
  ticketType: string;
  quantity: number;
  totalAmount: number;
}

interface UseTicketPurchaseReturn {
  isLoading: boolean;
  error: string | null;
  purchaseTickets: (
    data: TicketPurchaseData
  ) => Promise<{success: boolean; purchaseId?: string; paymentId?: string}>;
  clearError: () => void;
  isAuthenticating: boolean;
}

export const useTicketPurchase = (): UseTicketPurchaseReturn => {
  // Define the actual purchase action
  const purchaseAction = useCallback(async (data: TicketPurchaseData) => {
    // Step 1: Check ticket availability first
    const availabilityResponse = await apiService.checkTicketAvailability(
      data.ticketId,
      data.quantity
    );

    if (!availabilityResponse.success) {
      throw new Error(availabilityResponse.message || "Ticket not available");
    }

    // Step 2: Create purchase request
    const purchaseResponse = await apiService.createPurchase({
      eventId: data.eventId,
      ticketId: data.ticketId,
      quantity: data.quantity,
    });

    if (!purchaseResponse.success) {
      throw new Error(purchaseResponse.message || "Failed to create purchase");
    }

    const purchaseId = purchaseResponse.data?.id;
    if (!purchaseId) {
      throw new Error("Purchase created but no ID returned");
    }

    // Step 3: Create payment request
    const paymentResponse = await apiService.createPayment({
      ticketId: data.ticketId,
      quantity: data.quantity,
      eventId: data.eventId,
      amount: data.totalAmount,
      memo: `Ticket purchase for event ${data.eventId}`,
      metadata: {
        ticketType: data.ticketType,
        purchaseId: purchaseId,
        eventId: data.eventId,
        ticketId: data.ticketId,
        quantity: data.quantity,
        paymentType: "ticket_purchase",
      },
    });

    if (!paymentResponse.success) {
      throw new Error(paymentResponse.message || "Failed to create payment");
    }

    const paymentId = paymentResponse.data?.id;
    return {
      success: true,
      purchaseId,
      paymentId,
    };
  }, []);

  // Use the authenticated action hook
  const {execute, isLoading, error, clearError, isAuthenticating} =
    useAuthenticatedAction(purchaseAction, {
      retryOnAuth: true,
      onSuccess: (result) => {
        console.log("Ticket purchase successful:", result);
      },
      onError: (error) => {
        logError("Ticket Purchase", error);
      },
    });

  const purchaseTickets = useCallback(
    async (data: TicketPurchaseData) => {
      try {
        return await execute(data);
      } catch (error) {
        // Return failure result instead of throwing
        return {success: false};
      }
    },
    [execute]
  );

  return {
    isLoading,
    error,
    purchaseTickets,
    clearError,
    isAuthenticating,
  };
};
