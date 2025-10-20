"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import Image from "next/image";
import {useTicketPurchase} from "../../hooks/useTicketPurchase";
import ErrorDisplay from "../../components/ErrorDisplay";
import "@/styles/ticket-modal.css";

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    image: string;
    ticketPrice: number;
    availableTickets: number;
  };
}

export default function TicketModal({
  isOpen,
  onClose,
  event,
}: TicketModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [ticketType, setTicketType] = useState("Regular");
  const {
    isLoading,
    error: purchaseError,
    purchaseTickets,
    clearError,
  } = useTicketPurchase();

  // Fees calculation
  const ticketPrice = event.ticketPrice || 12.6;
  const platformFee = 0.5;
  const blockchainFee = 0.1;
  const subtotal = ticketPrice * quantity;
  const total = subtotal + platformFee + blockchainFee;

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    if (value >= 1 && value <= event.availableTickets) {
      setQuantity(value);
    }
  };

  const handleConfirmPayment = async () => {
    clearError();

    const success = await purchaseTickets({
      eventId: event.id,
      ticketType,
      quantity,
      totalAmount: total,
    });

    if (success) {
      // Navigate to payment confirmation or success page
      router.push(
        `/buy-ticket/payment?eventId=${event.id}&quantity=${quantity}&total=${total}`
      );
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ticket-modal-overlay" onClick={onClose}>
      <div className="ticket-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ticket-modal-header">
          <button
            title="Back"
            type="button"
            className="back-button"
            onClick={onClose}
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
          <h1 className="modal-title">Event Details</h1>
          <div className="header-spacer"></div>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
          <div className="progress-step active">
            <span>Select Tickets</span>
          </div>
        </div>

        {/* Event Image */}
        <div className="event-image-container">
          <Image
            src={event.image || "/event-placeholder.jpg"}
            alt={event.title}
            width={400}
            height={200}
            className="event-image"
          />
        </div>

        {/* Available Tickets */}
        <div className="available-tickets">
          <span className="available-label">Available Tickets</span>
          <div className="ticket-count">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span>{event.availableTickets}</span>
          </div>
        </div>

        {/* Ticket Selection */}
        <div className="ticket-selection">
          <div className="form-group">
            <label className="form-label">
              How many tickets you want to buy?
            </label>
            <input
              title="Available Tickets"
              type="number"
              min="1"
              max={event.availableTickets}
              value={quantity}
              onChange={handleQuantityChange}
              className="quantity-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ticket Type</label>
            <select
              title="ticket-type"
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value)}
              className="ticket-type-select"
            >
              <option value="Regular">Regular</option>
              <option value="VIP">VIP</option>
              <option value="Premium">Premium</option>
            </select>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="price-breakdown">
          <div className="price-row">
            <span className="price-label">{quantity} Ticket Price</span>
            <span className="price-value">{subtotal.toFixed(2)}π</span>
          </div>
          <div className="price-row">
            <span className="price-label">Platform fee</span>
            <span className="price-value">{platformFee.toFixed(1)}π</span>
          </div>
          <div className="price-row">
            <span className="price-label">Blockchain fee</span>
            <span className="price-value">{blockchainFee.toFixed(1)}π</span>
          </div>
          <div className="price-row total-row">
            <span className="price-label">Total</span>
            <span className="price-value">{total.toFixed(1)}π</span>
          </div>
        </div>

        {/* Error Message */}
        {purchaseError && (
          <div style={{ padding: "0 20px" }}>
            <ErrorDisplay
              error={purchaseError}
              title="Purchase Error"
              showDetails={true}
              onRetry={clearError}
            />
          </div>
        )}

        {/* Confirm Button */}
        <div className="confirm-section">
          <button
            className={`confirm-button ${isLoading ? "loading" : ""}`}
            onClick={handleConfirmPayment}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner"></div>
                Processing...
              </>
            ) : (
              "Confirm to Pay"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
