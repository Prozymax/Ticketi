"use client";

import {useState, useEffect, Suspense} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import Image from "next/image";
import {usePiNetwork} from "../../hooks/usePiNetwork";
import {apiService} from "../../lib/api";
import {formatError, logError} from "../../utils/errorHandler";
import ErrorDisplay from "../../components/ErrorDisplay";

interface PaymentPageProps {
  eventData?: {
    id: string;
    title: string;
    image: string;
    ticketPrice: number;
  };
}

function PaymentContent({eventData}: PaymentPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {createPayment, isLoading: piLoading, error: piError} = usePiNetwork();

  // Get data from URL params or props
  const eventId = searchParams.get("eventId") || eventData?.id || "1";
  const ticketId = searchParams.get("ticketId") || "";
  const purchaseId = searchParams.get("purchaseId") || "";
  const quantity = parseInt(searchParams.get("quantity") || "1");
  const total = parseFloat(searchParams.get("total") || "13.2");
  const ticketType = searchParams.get("ticketType") || "regular";
  const isFallback = searchParams.get("fallback") === "true";

  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [event, setEvent] = useState(eventData || null);
  const [loadingEvent, setLoadingEvent] = useState(!eventData);

  // Load event data if not provided
  useEffect(() => {
    if (!eventData && eventId) {
      loadEventData();
    }
  }, [eventId, eventData]);

  const loadEventData = async () => {
    try {
      setLoadingEvent(true);
      const response = await apiService.getEventById(eventId);
      
      if (response.success && response.data) {
        setEvent(response.data);
      } else {
        setPaymentError("Failed to load event details");
      }
    } catch (error) {
      console.error("Error loading event:", error);
      setPaymentError("Failed to load event details");
    } finally {
      setLoadingEvent(false);
    }
  };

  // Fees calculation
  const ticketPrice = event?.ticketPrice || 0;
  const platformFee = 0.5;
  const blockchainFee = 0.1;
  const subtotal = ticketPrice * quantity;
  const calculatedTotal = total || (subtotal + platformFee + blockchainFee);

  const handleBack = () => {
    router.back();
  };

  const handlePayment = async () => {
    if (!event) {
      setPaymentError("Missing event information");
      return;
    }

    // For fallback tickets, we don't need ticketId or purchaseId
    if (!isFallback && (!ticketId || !purchaseId)) {
      setPaymentError("Missing payment information");
      return;
    }

    setIsLoading(true);
    setPaymentError(null);

    try {
      console.log("Creating payment with fallback:", isFallback);
      
      // Create Pi Network payment
      const paymentId = await createPayment(
        calculatedTotal,
        `Ticket purchase for ${event.title}`,
        {
          eventId: event.id,
          eventTitle: event.title,
          ticketId: ticketId || `fallback-${event.id}`,
          purchaseId: purchaseId || null,
          ticketType: ticketType,
          ticketCount: quantity,
          paymentType: "ticket_purchase",
          isFallback: isFallback,
        }
      );

      console.log("Payment created successfully:", paymentId);

      // Navigate to success page
      router.push(
        `/buy-ticket/success?paymentId=${paymentId}&eventId=${event.id}${purchaseId ? `&purchaseId=${purchaseId}` : ''}`
      );
    } catch (error: unknown) {
      const errorMessage = formatError(error);
      logError("Payment", error);
      setPaymentError(errorMessage);

      if (
        errorMessage.includes(
          'Cannot create a payment without "payments" scope'
        )
      ) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Pi to USDT (example rate)
  const piToUsdtRate = 0.267;
  const usdtAmount = (calculatedTotal * piToUsdtRate).toFixed(3);

  // Show loading state while event data is loading
  if (loadingEvent) {
    return (
      <div style={{
        backgroundColor: "#0a0a0a",
        color: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "40px",
            height: "40px",
            border: "3px solid #333",
            borderTop: "3px solid #8b5cf6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px auto",
          }} />
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{
        backgroundColor: "#0a0a0a",
        color: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <p>Event not found</p>
          <button onClick={() => router.back()}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .payment-page {
          background-color: #0a0a0a;
          color: #ffffff;
          min-height: 100vh;
          padding: 0;
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
        }

        .payment-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px;
          border-bottom: 1px solid #333;
          position: sticky;
          top: 0;
          background-color: #0a0a0a;
          z-index: 100;
        }

        .back-button {
          background: none;
          border: none;
          color: #888;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }

        .back-button:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }

        .page-title {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
          color: #ffffff;
        }

        .header-spacer {
          width: 40px;
        }

        .event-image-section {
          padding: 30px 20px;
          display: flex;
          justify-content: center;
        }

        .event-image {
          width: 100%;
          max-width: 400px;
          height: 200px;
          object-fit: cover;
          border-radius: 16px;
          background-color: #333;
        }

        .event-title-section {
          padding: 0 20px 30px 20px;
          text-align: center;
        }

        .event-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0;
          color: #888;
        }

        .amount-section {
          padding: 0 20px 40px 20px;
          text-align: center;
        }

        .main-amount {
          font-size: 48px;
          font-weight: 700;
          color: #d4af37;
          margin-bottom: 12px;
          line-height: 1;
        }

        .usdt-badge {
          display: inline-block;
          background-color: #333;
          color: #888;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .payment-details {
          padding: 0 20px 30px 20px;
          border-bottom: 1px solid #333;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          font-size: 16px;
          color: #888;
        }

        .detail-value {
          font-size: 16px;
          color: #ffffff;
          font-weight: 500;
        }

        .cost-breakdown {
          padding: 30px 20px;
          border-bottom: 1px solid #333;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .breakdown-row:last-child {
          margin-bottom: 0;
        }

        .breakdown-label {
          font-size: 16px;
          color: #888;
        }

        .breakdown-value {
          font-size: 16px;
          color: #ffffff;
          font-weight: 600;
        }

        .total-row .breakdown-label,
        .total-row .breakdown-value {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
        }

        .error-section {
          padding: 0 20px 20px 20px;
        }

        .error-message {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          text-align: center;
        }

        .pay-section {
          padding: 20px;
          margin-top: auto;
        }

        .pay-button {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .pay-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          transform: translateY(-1px);
        }

        .pay-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 480px) {
          .payment-header {
            padding: 16px;
          }

          .page-title {
            font-size: 17px;
          }

          .event-image-section {
            padding: 24px 16px;
          }

          .event-image {
            height: 180px;
          }

          .event-title-section {
            padding: 0 16px 24px 16px;
          }

          .event-title {
            font-size: 18px;
          }

          .amount-section {
            padding: 0 16px 32px 16px;
          }

          .main-amount {
            font-size: 42px;
          }

          .usdt-badge {
            padding: 6px 14px;
            font-size: 13px;
          }

          .payment-details {
            padding: 0 16px 24px 16px;
          }

          .detail-row {
            margin-bottom: 16px;
          }

          .detail-label,
          .detail-value {
            font-size: 15px;
          }

          .cost-breakdown {
            padding: 24px 16px;
          }

          .breakdown-row {
            margin-bottom: 16px;
          }

          .breakdown-label,
          .breakdown-value {
            font-size: 15px;
          }

          .total-row .breakdown-label,
          .total-row .breakdown-value {
            font-size: 17px;
          }

          .error-section {
            padding: 0 16px 16px 16px;
          }

          .error-message {
            font-size: 13px;
            padding: 10px 14px;
          }

          .pay-section {
            padding: 16px;
          }

          .pay-button {
            padding: 16px;
            font-size: 16px;
          }
        }

        @media (min-width: 768px) {
          .payment-page {
            max-width: 600px;
            margin: 0 auto;
            border-left: 1px solid #333;
            border-right: 1px solid #333;
          }

          .main-amount {
            font-size: 56px;
          }

          .event-image {
            height: 240px;
          }
        }

        @media (min-width: 1024px) {
          .payment-page {
            max-width: 480px;
          }

          .main-amount {
            font-size: 52px;
          }
        }
      `}</style>
      <div className="payment-page">
        {/* Header */}
        <div className="payment-header">
          <button title="Back" className="back-button" onClick={handleBack}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="page-title">Buy Ticket</h1>
          <div className="header-spacer"></div>
        </div>

        {/* Event Image */}
        <div className="event-image-section">
          <Image
            src={event.image}
            alt={event.title}
            width={400}
            height={200}
            className="event-image"
          />
        </div>

        {/* Event Title */}
        <div className="event-title-section">
          <h2 className="event-title">{event.title}</h2>
        </div>

        {/* Amount Display */}
        <div className="amount-section">
          <div className="main-amount">{calculatedTotal.toFixed(2)}π</div>
          <div className="usdt-badge">≈ {usdtAmount}USDT</div>
        </div>

        {/* Payment Details */}
        <div className="payment-details">
          <div className="detail-row">
            <span className="detail-label">Ticket . {ticketType.charAt(0).toUpperCase() + ticketType.slice(1)}</span>
            <span className="detail-value">{quantity}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Event Title</span>
            <span className="detail-value">{event.title}</span>
          </div>
          {isFallback && (
            <div className="detail-row">
              <span className="detail-label">Mode</span>
              <span className="detail-value">Direct Purchase</span>
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="cost-breakdown">
          <div className="breakdown-row">
            <span className="breakdown-label">Platform fee</span>
            <span className="breakdown-value">{platformFee.toFixed(1)}π</span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">Blockchain fee</span>
            <span className="breakdown-value">{blockchainFee.toFixed(1)}π</span>
          </div>
          <div className="breakdown-row total-row">
            <span className="breakdown-label">Total</span>
            <span className="breakdown-value">
              {calculatedTotal.toFixed(1)}π
            </span>
          </div>
        </div>

        {/* Error Message */}
        {(paymentError || piError) && (
          <div style={{padding: "0 20px 20px 20px"}}>
            <ErrorDisplay
              error={paymentError || piError}
              title="Payment Error"
              showDetails={true}
              onRetry={() => {
                setPaymentError(null);
                handlePayment();
              }}
            />
          </div>
        )}

        {/* Pay Button */}
        <div className="pay-section">
          <button
            className={`pay-button ${isLoading || piLoading ? "loading" : ""}`}
            onClick={handlePayment}
            disabled={isLoading || piLoading}
          >
            {isLoading || piLoading ? (
              <>
                <div className="loading-spinner"></div>
                Processing...
              </>
            ) : (
              "Pay"
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function PaymentLoadingFallback() {
  return (
    <div style={{
      backgroundColor: "#0a0a0a",
      color: "#ffffff",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid #333",
          borderTop: "3px solid #8b5cf6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 16px auto",
        }} />
        <p>Loading payment...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function PaymentPage({eventData}: PaymentPageProps) {
  return (
    <Suspense fallback={<PaymentLoadingFallback />}>
      <PaymentContent eventData={eventData} />
    </Suspense>
  );
}
