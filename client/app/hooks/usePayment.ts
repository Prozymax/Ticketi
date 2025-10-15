'use client';

import { useState, useCallback } from 'react';
import { PiNetworkService } from '@/app/lib/PiNetwork';
import { paymentAPI, purchaseAPI } from '@/app/utils/api';

interface PaymentState {
  loading: boolean;
  error: string | null;
  paymentId: string | null;
  status: 'idle' | 'creating' | 'pending' | 'approved' | 'completed' | 'cancelled' | 'failed';
}

interface PaymentData {
  ticketId: string;
  eventId: string;
  quantity: number;
  amount: number;
  memo?: string;
}

export const usePayment = () => {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    loading: false,
    error: null,
    paymentId: null,
    status: 'idle',
  });

  const piNetwork = new PiNetworkService(process.env.NODE_ENV !== 'production');

  const createPayment = useCallback(async (paymentData: PaymentData) => {
    try {
      setPaymentState({
        loading: true,
        error: null,
        paymentId: null,
        status: 'creating',
      });

      // First create the purchase record
      const purchaseResponse = await purchaseAPI.createPurchase({
        eventId: paymentData.eventId,
        ticketId: paymentData.ticketId,
        quantity: paymentData.quantity,
      });

      if (!purchaseResponse.success) {
        throw new Error(purchaseResponse.error || 'Failed to create purchase');
      }

      const purchaseId = purchaseResponse.data.purchase.id;

      // Create payment record on backend
      const paymentResponse = await paymentAPI.createPayment({
        ...paymentData,
        metadata: {
          purchaseId,
          eventId: paymentData.eventId,
          ticketId: paymentData.ticketId,
          quantity: paymentData.quantity,
        },
      });

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || 'Failed to create payment');
      }

      const backendPaymentId = paymentResponse.data.id;

      // Create Pi Network payment
      const piPaymentId = await piNetwork.createPayment(
        paymentData.amount,
        paymentData.memo || `Ticket purchase for ${paymentData.quantity} ticket(s)`,
        {
          purchaseId,
          backendPaymentId,
          eventId: paymentData.eventId,
          ticketId: paymentData.ticketId,
          quantity: paymentData.quantity,
        },
        // onApproval callback
        async (paymentId: string) => {
          console.log('Payment approved, calling backend approval:', paymentId);
          await paymentAPI.approvePayment(paymentId);
          setPaymentState(prev => ({ ...prev, status: 'approved' }));
        },
        // onCompletion callback
        async (paymentId: string, txid: string) => {
          console.log('Payment completed, calling backend completion:', paymentId, txid);
          await paymentAPI.completePayment(paymentId, txid);
          setPaymentState(prev => ({ ...prev, status: 'completed', loading: false }));
        }
      );

      setPaymentState({
        loading: false,
        error: null,
        paymentId: piPaymentId,
        status: 'pending',
      });

      return {
        success: true,
        paymentId: piPaymentId,
        purchaseId,
      };

    } catch (error: any) {
      console.error('Payment creation failed:', error);
      setPaymentState({
        loading: false,
        error: error.message || 'Payment failed',
        paymentId: null,
        status: 'failed',
      });

      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }
  }, [piNetwork]);

  const cancelPayment = useCallback(async (paymentId: string) => {
    try {
      setPaymentState(prev => ({ ...prev, loading: true, error: null }));

      await paymentAPI.cancelPayment(paymentId);

      setPaymentState(prev => ({
        ...prev,
        loading: false,
        status: 'cancelled',
      }));

      return { success: true };
    } catch (error: any) {
      console.error('Payment cancellation failed:', error);
      setPaymentState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to cancel payment',
      }));

      return {
        success: false,
        error: error.message || 'Failed to cancel payment',
      };
    }
  }, []);

  const getPaymentStatus = useCallback(async (paymentId: string) => {
    try {
      const response = await paymentAPI.getPaymentStatus(paymentId);
      
      if (response.success) {
        setPaymentState(prev => ({
          ...prev,
          status: response.data.status,
        }));
      }

      return response;
    } catch (error: any) {
      console.error('Failed to get payment status:', error);
      return {
        success: false,
        error: error.message || 'Failed to get payment status',
      };
    }
  }, []);

  const resetPayment = useCallback(() => {
    setPaymentState({
      loading: false,
      error: null,
      paymentId: null,
      status: 'idle',
    });
  }, []);

  return {
    paymentState,
    createPayment,
    cancelPayment,
    getPaymentStatus,
    resetPayment,
    isSDKAvailable: piNetwork.isSDKAvailable(),
  };
};