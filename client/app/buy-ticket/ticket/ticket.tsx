"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import Image from "next/image";
import {useTicketPurchase} from "../../hooks/useTicketPurchase";
import {apiService} from "../../lib/api";
import ErrorDisplay from "../../components/ErrorDisplay";
import styles from "@/styles/ticket-modal.module.css";

interface Ticket {
  id: string;
  ticketType: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  soldQuantity: number;
  isActive: boolean;
}

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    title: string;
    image: string;
    ticketPrice?: number;
    availableTickets?: number;
  };
}

export default function TicketModal({
  isOpen,
  onClose,
  event,
}: TicketModalProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const {
    isLoading,
    error: purchaseError,
    purchaseTickets,
    clearError,
  } = useTicketPurchase();

  // Fees calculation
  const ticketPrice = selectedTicket?.price || event.ticketPrice || 12.6;
  const platformFee = 0.5;
  const blockchainFee = 0.1;
  const subtotal = ticketPrice * quantity;
  const total = subtotal + platformFee + blockchainFee;
  const maxQuantity =
    selectedTicket?.availableQuantity || event.availableTickets || 0;

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

  const loadEventTickets = async () => {
    try {
      setLoadingTickets(true);
      setTicketError(null);

      console.log("Loading tickets for event:", event.id);
      const response = await apiService.getEventTickets(event.id);
      console.log("Tickets API response:", response);

      if (
        response.success &&
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const ticketList = response.data;
        setTickets(ticketList);
        console.log("Loaded tickets from API:", ticketList);

        // Auto-select first available ticket
        const availableTicket = ticketList.find(
          (t: Ticket) => t.isActive && t.availableQuantity > 0
        );
        if (availableTicket) {
          setSelectedTicket(availableTicket);
          console.log("Auto-selected ticket:", availableTicket);
        }
      } else {
        // Fallback: Create a ticket from event data if no tickets exist
        console.log(
          "No tickets found in API, creating fallback ticket from event data"
        );
        const fallbackTicket: Ticket = {
          id: `fallback-${event.id}`,
          ticketType: "regular",
          price: event.ticketPrice || 0,
          totalQuantity: event.availableTickets || 0,
          availableQuantity: event.availableTickets || 0,
          soldQuantity: 0,
          isActive: true,
        };

        setTickets([fallbackTicket]);
        setSelectedTicket(fallbackTicket);
        console.log("Created fallback ticket:", fallbackTicket);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);

      // Fallback: Create a ticket from event data on error
      console.log("API error, creating fallback ticket from event data");
      const fallbackTicket: Ticket = {
        id: `fallback-${event.id}`,
        ticketType: "regular",
        price: event.ticketPrice || 0,
        totalQuantity: event.availableTickets || 0,
        availableQuantity: event.availableTickets || 0,
        soldQuantity: 0,
        isActive: true,
      };

      setTickets([fallbackTicket]);
      setSelectedTicket(fallbackTicket);
      setTicketError(null); // Clear error since we have fallback
    } finally {
      setLoadingTickets(false);
    }
  };

  // Load tickets when modal opens
  useEffect(() => {
    if (isOpen && event.id) {
      loadEventTickets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, event.id]);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    if (value >= 1 && value <= maxQuantity) {
      setQuantity(value);
    }
  };

  const handleTicketTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const ticketId = e.target.value;
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket) {
      setSelectedTicket(ticket);
      // Reset quantity if current quantity exceeds new ticket's availability
      if (quantity > ticket.availableQuantity) {
        setQuantity(Math.min(1, ticket.availableQuantity));
      }
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedTicket) {
      setTicketError("Please select a ticket type");
      return;
    }

    clearError();
    setTicketError(null);

    console.log("Confirming payment for ticket:", selectedTicket);

    // For fallback tickets, skip API availability check
    if (!selectedTicket.id.startsWith("fallback-")) {
      try {
        const availabilityResponse = await apiService.checkTicketAvailability(
          selectedTicket.id,
          quantity
        );

        if (!availabilityResponse.success) {
          setTicketError(
            availabilityResponse.message || "Ticket not available"
          );
          return;
        }
      } catch (error) {
        console.error("Availability check failed:", error);
        setTicketError("Failed to check ticket availability");
        return;
      }
    }

    // Close modal immediately before navigation
    onClose();
    
    // Navigate to payment page with ticket details including event data to avoid API call
    const paymentUrl = `/buy-ticket/payment?eventId=${event.id}&ticketId=${selectedTicket.id}&quantity=${quantity}&total=${total}&ticketType=${selectedTicket.ticketType}&eventTitle=${encodeURIComponent(event.title)}&eventImage=${encodeURIComponent(event.image)}&ticketPrice=${selectedTicket.price}${selectedTicket.id.startsWith("fallback-") ? '&fallback=true' : ''}`;
    
    console.log("Navigating to payment page:", paymentUrl);
    router.push(paymentUrl);
  };

  if (!isOpen) return null;

  return (
    <div className={styles["ticket-modal-overlay"]} onClick={onClose}>
      <div
        className={styles["ticket-modal"]}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles["ticket-modal-header"]}>
          <button
            title="Back"
            type="button"
            className={styles["back-button"]}
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
          <h1 className={styles["modal-title"]}>Event Details</h1>
          <div className={styles["header-spacer"]}></div>
        </div>

        {/* Progress Bar */}
        <div className={styles["progress-container"]}>
          <div className={styles["progress-bar"]}>
            <div className={styles["progress-fill"]}></div>
          </div>
          <div className={`${styles["progress-step"]} ${styles.active}`}>
            <span>Select Tickets</span>
          </div>
        </div>

        {/* Event Image */}
        <div className={styles["event-image-container"]}>
          <Image
            src={event.image || "/event-placeholder.jpg"}
            alt={event.title}
            width={400}
            height={200}
            className={styles["event-image"]}
          />
        </div>

        {/* Available Tickets */}
        <div className={styles["available-tickets"]}>
          <span className={styles["available-label"]}>Available Tickets</span>
          <div className={styles["ticket-count"]}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span>{loadingTickets ? "Loading..." : maxQuantity}</span>
          </div>
        </div>

        {/* Ticket Selection */}
        <div className={styles["ticket-selection"]}>
          <div className={styles["form-group"]}>
            <label className={styles["form-label"]}>Ticket Type</label>
            {loadingTickets ? (
              <div className={styles["loading-placeholder"]}>
                Loading tickets...
              </div>
            ) : tickets.length > 0 ? (
              <select
                title="ticket-type"
                value={selectedTicket?.id || ""}
                onChange={(e) => {
                  console.log("Ticket selection changed:", e.target.value);
                  handleTicketTypeChange(e);
                }}
                className={styles["ticket-type-select"]}
              >
                <option value="">Select ticket type</option>
                {tickets
                  .filter(
                    (ticket) => ticket.isActive && ticket.availableQuantity > 0
                  )
                  .map((ticket) => (
                    <option key={ticket.id} value={ticket.id}>
                      {ticket.ticketType} - {ticket.price}π (
                      {ticket.availableQuantity} available)
                    </option>
                  ))}
              </select>
            ) : (
              <div
                className={styles["no-tickets"]}
                style={{color: "#ef4444", padding: "10px", textAlign: "center"}}
              >
                No tickets available - Check event status
              </div>
            )}
          </div>

          {selectedTicket && (
            <div className={styles["form-group"]}>
              <label className={styles["form-label"]}>
                How many tickets you want to buy?
              </label>
              <input
                title="Available Tickets"
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={handleQuantityChange}
                className={styles["quantity-input"]}
                disabled={maxQuantity === 0}
              />
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        <div className={styles["price-breakdown"]}>
          <div className={styles["price-row"]}>
            <span className={styles["price-label"]}>
              {quantity} Ticket Price
            </span>
            <span className={styles["price-value"]}>
              {subtotal.toFixed(2)}π
            </span>
          </div>
          <div className={styles["price-row"]}>
            <span className={styles["price-label"]}>Platform fee</span>
            <span className={styles["price-value"]}>
              {platformFee.toFixed(1)}π
            </span>
          </div>
          <div className={styles["price-row"]}>
            <span className={styles["price-label"]}>Blockchain fee</span>
            <span className={styles["price-value"]}>
              {blockchainFee.toFixed(1)}π
            </span>
          </div>
          <div className={`${styles["price-row"]} ${styles["total-row"]}`}>
            <span className={styles["price-label"]}>Total</span>
            <span className={styles["price-value"]}>{total.toFixed(1)}π</span>
          </div>
        </div>

        {/* Error Message */}
        {(purchaseError || ticketError) && (
          <div style={{padding: "0 20px"}}>
            <ErrorDisplay
              error={purchaseError || ticketError}
              title="Purchase Error"
              showDetails={true}
              onRetry={() => {
                clearError();
                setTicketError(null);
              }}
            />
          </div>
        )}

        {/* Debug Info */}
        {/* <div style={{ padding: "0 20px", fontSize: "12px", color: "#666", background: "rgba(255,255,255,0.1)", margin: "10px", borderRadius: "5px" }}>
          <p>Debug Info:</p>
          <p>Event ID: {event.id}</p>
          <p>Loading: {loadingTickets.toString()}</p>
          <p>Tickets: {tickets.length}</p>
          <p>Selected: {selectedTicket?.id || 'none'}</p>
          <p>Max Quantity: {maxQuantity}</p>
          <p>Available Tickets: {event.availableTickets}</p>
          <p>Ticket Price: {event.ticketPrice}</p>
        </div> */}

        {/* Confirm Button */}
        <div className={styles["confirm-section"]}>
          <button
            className={`${styles["confirm-button"]} ${
              isLoading || loadingTickets || !selectedTicket ? styles.loading : ""
            }`}
            onClick={() => {
              console.log("Confirm button clicked!");
              console.log("Selected ticket:", selectedTicket);
              console.log("Quantity:", quantity);
              handleConfirmPayment();
            }}
            disabled={
              isLoading ||
              loadingTickets ||
              !selectedTicket ||
              maxQuantity === 0
            }
          >
            {isLoading ? (
              <>
                <div className={styles["loading-spinner"]}></div>
                Processing...
              </>
            ) : loadingTickets ? (
              <>
                <div className={styles["loading-spinner"]}></div>
                Loading...
              </>
            ) : !selectedTicket ? (
              "Select Ticket Type"
            ) : maxQuantity === 0 ? (
              "Sold Out"
            ) : (
              "Confirm to Pay"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
