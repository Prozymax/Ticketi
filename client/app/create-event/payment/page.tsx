"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {useEventCreation} from "@/app/contexts/EventCreationContext";
import {eventAPI, CreateEventRequest} from "@/app/utils/api";
import {usePiNetwork} from "@/app/hooks/usePiNetwork";

import ErrorDisplay from "@/app/components/ErrorDisplay";
import styles from "@/styles/payment.module.css";
import "@/styles/create-event.module.css";

export default function PaymentPage() {
  const router = useRouter();
  const {state} = useEventCreation();
  const {eventData} = state;
  const {createPayment, isLoading: piLoading, error: piError} = usePiNetwork();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Calculate fees
  const eventCreationFee = process.env.NEXT_PUBLIC_EVENT_CREATION_FEE || 0.5;
  const blockchainFee = process.env.NEXT_PUBLIC_BLOCKCHAIN_FEE || 0.1;
  const total = Number(eventCreationFee) + Number(blockchainFee);

  const handleBack = () => {
    router.back();
  };

  const handleConfirmPayment = async () => {
    try {
      setIsLoading(true);
      setPaymentError(null);

      // First create the event in draft status
      const createEventData: CreateEventRequest = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        startDate: eventData.startDate,
        endDate: eventData.endDate,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        eventImage: eventData.eventImage,
        ticketTypes: [
          {
            ticketType: "Regular",
            price: parseFloat(eventData.ticketPrice.replace("π", "")),
            totalQuantity: eventData.regularTickets,
            availableQuantity: eventData.regularTickets,
          },
        ],
      };

      const eventResult = await eventAPI.createEvent(createEventData);

      if (!eventResult.success) {
        throw new Error(eventResult.error || "Failed to create event");
      }

      const eventId = eventResult.data.event?.id || eventResult.data.id;

      // Create Pi Network payment with event ID
      const paymentId = await createPayment(
        total,
        `Event creation payment for ${eventData.title}`,
        {
          eventId: eventId,
          eventTitle: eventData.title,
          ticketType: "Regular",
          ticketCount: eventData.regularTickets,
          paymentType: "event_creation",
        }
      );

      console.log("Payment created successfully:", paymentId);
      console.log("Event created successfully:", eventResult.data);

      // Note: Event will be published automatically after payment completion
      // The backend onServerCompletion callback will publish the event when payment is verified

      // Navigate to success page
      router.push("/create-event/success");
    } catch (error: unknown) {
      console.error("Payment/Event creation failed:", error);
      if (error instanceof Error) {
        setPaymentError(error.message || "Payment failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles["create-event-container"]}>
      {/* Header */}
      <div className={styles.header}>
        <button
          type="button"
          title="back-button"
          className={styles["back-button"]}
          onClick={handleBack}
        >
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
        <h1 className={styles["page-title"]}>Create Event</h1>
        <div className={styles["header-spacer"]}></div>
      </div>

      {/* Payment Section */}
      <div className={styles["payment-section"]}>
        <h2 className={styles["payment-title"]}>Make payment</h2>

        {/* Payment Card */}
        <div className={styles["payment-card"]}>
          {/* Event Title */}
          <div className={styles["event-title-section"]}>
            <h3 className={styles["event-title"]}>{eventData.title}</h3>
          </div>

          {/* Amount Display */}
          <div className={styles["amount-section"]}>
            <div className={styles["main-amount"]}>{total.toFixed(2)}π</div>
            <div className={styles["usd-equivalent"]}>
              ≈ {(total * 0.267).toFixed(3)}USDT
            </div>
          </div>

          {/* Event Details */}
          <div className={styles["event-details"]}>
            <div className={styles["detail-row"]}>
              <span className={styles["detail-label"]}>Ticket . Regular</span>
              <span className={styles["detail-value"]}>
                {eventData.regularTickets}
              </span>
            </div>
            <div className={styles["detail-row"]}>
              <span className={styles["detail-label"]}>Event Title</span>
              <span className={styles["detail-value"]}>{eventData.title}</span>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className={styles["cost-breakdown"]}>
            <div className={styles["breakdown-row"]}>
              <span className={styles["breakdown-label"]}>
                For event creation
              </span>
              <span className={styles["breakdown-value"]}>
                {eventCreationFee}π
              </span>
            </div>
            <div className={styles["breakdown-row"]}>
              <span className={styles["breakdown-label"]}>Blockchain fee</span>
              <span className={styles["breakdown-value"]}>
                {blockchainFee}π
              </span>
            </div>
            <div
              className={`${styles["breakdown-row"]} ${styles["total-row"]}`}
            >
              <span className={styles["breakdown-label"]}>Total</span>
              <span className={styles["breakdown-value"]}>{total}π</span>
            </div>
          </div>

          {/* Confirm Payment Button */}
          <div className={styles["payment-button-section"]}>
            <p
              className={`${styles["confirm-payment-button"]} ${
                isLoading || piLoading ? styles.loading : ""
              }`}
              onClick={
                !(isLoading || piLoading) ? handleConfirmPayment : undefined
              }
            >
              {isLoading || piLoading ? (
                <>
                  <div className={styles["loading-spinner"]}></div>
                  Processing...
                </>
              ) : (
                "Confirm to Pay"
              )}
            </p>

            {/* Error message */}
            {(paymentError || piError) && (
              <ErrorDisplay
                error={paymentError || piError}
                title="Payment Error"
                showDetails={true}
                onRetry={() => {
                  setPaymentError(null);
                  handleConfirmPayment();
                }}
                onAuthRetry={() => {
                  setPaymentError(null);
                  handleConfirmPayment();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
