// lib/PiNetwork.ts

// Pi SDK Type Definitions
interface PiSDK {
  init(config: {version: string; sandbox: boolean}): void;
  authenticate(
    scopes: string[],
    onIncompletePaymentFound: (payment: IncompletePayment) => void
  ): Promise<AuthResult>;
  createPayment(paymentData: PaymentData, callbacks: PaymentCallbacks): void;
  openShareDialog(title: string, message: string): void;
}

interface AuthResult {
  accessToken: string;
  user: {
    uid: string;
    username: string;
  };
}

interface IncompletePayment {
  identifier: string;
  user_uid: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
  from_address: string;
  to_address: string;
  direction: string;
  status: {
    developer_approved: boolean;
    transaction_verified: boolean;
    developer_completed: boolean;
    cancelled: boolean;
    user_cancelled: boolean;
  };
  transaction?: {
    txid: string;
    verified: boolean;
    _link: string;
  };
  created_at: string;
}

interface PaymentData {
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}

interface PaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: IncompletePayment) => void;
}

// Extend Window interface to include Pi SDK
declare global {
  interface Window {
    Pi?: PiSDK;
  }
}

// Import API service for backend calls
import {apiService} from "./api";

export class PiNetworkService {
  private scopes: string[] = ["username", "payments"];
  private isInitialized: boolean = false;

  constructor(private sandbox: boolean = false) {
    this.initializeSDK();
  }

  private initializeSDK(): void {
    if (typeof window !== "undefined" && window.Pi) {
      try {
        // Only initialize if not already initialized
        if (!this.isInitialized) {
          window.Pi.init({
            version: "2.0",
            sandbox: this.sandbox,
          });
          this.isInitialized = true;
          console.log("Pi SDK initialized successfully", {
            sandbox: this.sandbox,
          });
        }
      } catch (error) {
        console.error("Failed to initialize Pi SDK:", error);
      }
    } else {
      console.warn("Pi SDK not loaded yet. Waiting for SDK to load...");
      // Retry initialization after a short delay
      setTimeout(() => {
        if (!this.isInitialized) {
          this.initializeSDK();
        }
      }, 500);
    }
  }

  public async authenticateUser(): Promise<AuthResult> {
    console.log("Authenticating....................", this.scopes);
    return new Promise((resolve, reject) => {
      if (!this.isInitialized || !window.Pi) {
        return reject(new Error("Pi SDK not available or not initialized"));
      }

      window.Pi.authenticate(
        this.scopes,
        async (incompletePayment: IncompletePayment) => {
          console.log("Found incomplete payment:", incompletePayment);

          try {
            // Notify backend about incomplete payment
            await apiService.onIncompletePayment(incompletePayment.identifier);
            console.log("Backend notified about incomplete payment");
            
          } catch (error) {
            console.error(
              "Failed to notify backend about incomplete payment:",
              error
            );
          }
        }
      )
        .then((auth: AuthResult) => {
          console.log("Authentication successful:", auth);
          console.log(auth);
          resolve(auth);
        })
        .catch((error: unknown) => {
          console.error("Authentication failed:", error);
          
          // Enhanced error handling for Pi SDK errors
          let errorMessage = "Authentication failed";
          
          if (error && typeof error === 'object') {
            const errorObj = error as Record<string, unknown>;
            if (typeof errorObj.message === 'string') {
              errorMessage = errorObj.message;
            } else if (typeof errorObj.error === 'string') {
              errorMessage = errorObj.error;
            } else if (typeof errorObj.code === 'string') {
              errorMessage = `Pi SDK Error: ${errorObj.code}`;
            }
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          reject(new Error(errorMessage));
        });
    });
  }

  public async createPayment(
    amount: number,
    memo: string,
    metadata: Record<string, unknown> = {},
    onApproval?: (paymentId: string) => Promise<void>,
    onCompletion?: (paymentId: string, txid: string) => Promise<void>
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized || !window.Pi) {
        return reject(new Error("Pi SDK not available or not initialized"));
      }

      const paymentData: PaymentData = {
        amount,
        memo,
        metadata,
      };

      const callbacks: PaymentCallbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("Payment ready for server approval:", paymentId);
          try {
            // Call backend approval endpoint
            await this.callBackendApproval(paymentId);

            // Call custom approval callback if provided
            if (onApproval) {
              await onApproval(paymentId);
            }
            resolve(paymentId);
          } catch (error) {
            console.error("Error in server approval callback:", error);
            reject(error);
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("Payment ready for server completion:", paymentId, txid);
          try {
            // Call backend completion endpoint
            await this.callBackendCompletion(paymentId, txid);

            // Call custom completion callback if provided
            if (onCompletion) {
              await onCompletion(paymentId, txid);
            }
          } catch (error) {
            console.error("Error in server completion callback:", error);
          }
        },
        onCancel: async (paymentId: string) => {
          console.log("Payment cancelled:", paymentId);
          try {
            // Call backend cancellation endpoint
            await this.callBackendCancellation(paymentId);
          } catch (error) {
            console.error("Error in cancellation callback:", error);
          }
          reject(new Error("Payment was cancelled by user"));
        },
        onError: (error: unknown, payment?: IncompletePayment) => {
          console.error("Payment error:", error, payment);
          
          // Enhanced error handling for Pi SDK payment errors
          let errorMessage = "Payment failed";
          
          if (error && typeof error === 'object') {
            const errorObj = error as Record<string, unknown>;
            if (typeof errorObj.message === 'string') {
              errorMessage = errorObj.message;
            } else if (typeof errorObj.error === 'string') {
              errorMessage = errorObj.error;
            } else if (typeof errorObj.code === 'string') {
              errorMessage = `Pi Payment Error: ${errorObj.code}`;
            }
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          reject(new Error(errorMessage));
        },
      };

      window.Pi.createPayment(paymentData, callbacks);
    });
  }

  public openShareDialog(title: string, message: string): void {
    if (!this.isInitialized || !window.Pi) {
      console.error("Pi SDK not available or not initialized");
      return;
    }

    try {
      window.Pi.openShareDialog(title, message);
    } catch (error) {
      console.error("Failed to open share dialog:", error);
    }
  }

  public isSDKAvailable(): boolean {
    if (typeof window === "undefined") return false;

    const available = !!window.Pi;
    if (available && !this.isInitialized) {
      this.initializeSDK();
    }

    return available && this.isInitialized;
  }

  public getScopes(): string[] {
    return [...this.scopes];
  }

  public setSandbox(sandbox: boolean): void {
    this.sandbox = sandbox;
    this.initializeSDK();
  }

  // Backend API integration methods
  private async callBackendApproval(paymentId: string): Promise<void> {
    try {
      console.log("Calling backend approval for payment:", paymentId);
      const response = await apiService.approvePayment(paymentId);

      if (!response.success) {
        throw new Error(
          response.message || "Failed to approve payment on backend"
        );
      }

      console.log("Backend approval successful:", response);
    } catch (error) {
      console.error("Backend approval failed:", error);
      throw error;
    }
  }

  private async callBackendCompletion(
    paymentId: string,
    txid: string
  ): Promise<void> {
    try {
      console.log(
        "Calling backend completion for payment:",
        paymentId,
        "with txid:",
        txid
      );
      const response = await apiService.completePayment(paymentId, txid);

      if (!response.success) {
        throw new Error(
          response.message || "Failed to complete payment on backend"
        );
      }

      console.log("Backend completion successful:", response);
    } catch (error) {
      console.error("Backend completion failed:", error);
      throw error;
    }
  }

  private async callBackendCancellation(paymentId: string): Promise<void> {
    try {
      console.log("Calling backend cancellation for payment:", paymentId);
      const response = await apiService.cancelPayment(paymentId);

      if (!response.success) {
        throw new Error(
          response.message || "Failed to cancel payment on backend"
        );
      }

      console.log("Backend cancellation successful:", response);
    } catch (error) {
      console.error("Backend cancellation failed:", error);
      throw error;
    }
  }

  // Helper method to create payment with backend integration
  public async createPaymentWithBackend(
    ticketId: string,
    quantity: number,
    eventId: string,
    amount: number,
    memo?: string,
    metadata?: Record<string, unknown>
  ): Promise<{paymentId: string; backendPaymentId: string}> {
    try {
      // First create the payment record on the backend
      console.log("Creating payment record on backend...");
      const backendResponse = await apiService.createPayment({
        ticketId,
        quantity,
        eventId,
        amount,
        memo,
        metadata,
      });

      if (!backendResponse.success) {
        throw new Error(
          backendResponse.message || "Failed to create payment on backend"
        );
      }

      const backendPaymentId = backendResponse.data.id;
      console.log("Backend payment created with ID:", backendPaymentId);

      // Then initiate the Pi Network payment
      const piPaymentId = await this.createPayment(
        amount,
        memo || `Ticket purchase for ${quantity} ticket(s)`,
        {
          ...metadata,
          backendPaymentId,
          ticketId,
          quantity,
          eventId,
        }
      );

      return {
        paymentId: piPaymentId,
        backendPaymentId,
      };
    } catch (error) {
      console.error("Error creating payment with backend integration:", error);
      throw error;
    }
  }
}
