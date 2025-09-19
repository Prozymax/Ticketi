// lib/PiNetwork.ts

// Pi SDK Type Definitions
interface PiSDK {
  init(config: { version: string; sandbox: boolean }): void;
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

export class PiNetworkService {
  private scopes: string[] = ['username'];
  private isInitialized: boolean = false;

  constructor(private sandbox: boolean = false) {
    this.initializeSDK();
  }

  private initializeSDK(): void {
    if (typeof window !== 'undefined' && window.Pi) {
      try {
        window.Pi.init({
          version: '2.0',
          sandbox: this.sandbox,
        });
        this.isInitialized = true;
        console.log('Pi SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Pi SDK:', error);
      }
    } else {
      console.warn('Pi SDK not loaded yet. Make sure to include the Pi SDK script.');
    }
  }

  public async authenticateUser(): Promise<AuthResult> {
    console.log('Authenticating....................', this.scopes)
    return new Promise((resolve, reject) => {
      if (!this.isInitialized || !window.Pi) {
        return reject(new Error('Pi SDK not available or not initialized'));
      }

      window.Pi.authenticate(
        this.scopes,
        (incompletePayment: IncompletePayment) => {
          console.log('Found incomplete payment:', incompletePayment);
          // Handle incomplete payment if needed
        }
      )
      .then((auth: AuthResult) => {
        console.log('Authentication successful:', auth);
        console.log(auth)
        resolve(auth);
      })
      .catch((error: Error) => {
        console.error('Authentication failed:', error);
        reject(error);
      });
    });
  }

  public async createPayment(
    amount: number, 
    memo: string, 
    metadata: Record<string, unknown> = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized || !window.Pi) {
        return reject(new Error('Pi SDK not available or not initialized'));
      }

      const paymentData: PaymentData = {
        amount,
        memo,
        metadata,
      };

      const callbacks: PaymentCallbacks = {
        onReadyForServerApproval: (paymentId: string) => {
          console.log('Payment ready for server approval:', paymentId);
          // Here you would typically call your backend to approve the payment
          resolve(paymentId);
        },
        onReadyForServerCompletion: (paymentId: string, txid: string) => {
          console.log('Payment ready for server completion:', paymentId, txid);
          // Here you would typically call your backend to complete the payment
        },
        onCancel: (paymentId: string) => {
          console.log('Payment cancelled:', paymentId);
          reject(new Error('Payment was cancelled by user'));
        },
        onError: (error: Error, payment?: IncompletePayment) => {
          console.error('Payment error:', error, payment);
          reject(error);
        },
      };

      window.Pi.createPayment(paymentData, callbacks);
    });
  }

  public openShareDialog(title: string, message: string): void {
    if (!this.isInitialized || !window.Pi) {
      console.error('Pi SDK not available or not initialized');
      return;
    }

    try {
      window.Pi.openShareDialog(title, message);
    } catch (error) {
      console.error('Failed to open share dialog:', error);
    }
  }

  public isSDKAvailable(): boolean {
    return this.isInitialized && !!window.Pi;
  }

  public getScopes(): string[] {
    return [...this.scopes];
  }

  public setSandbox(sandbox: boolean): void {
    this.sandbox = sandbox;
    this.initializeSDK();
  }
}