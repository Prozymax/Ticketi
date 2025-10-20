"use client";

import {useState} from "react";
import TicketModal from "../ticket/ticket";
import PaymentPage from "../payment/payment";

export default function TicketDemo() {
  const [showModal, setShowModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const eventData = {
    id: "1",
    title: "Token2049 Singapore",
    image: "/event-placeholder.jpg",
    ticketPrice: 12.6,
    availableTickets: 390,
  };

  return (
    <div
      style={{
        padding: "40px",
        backgroundColor: "#0a0a0a",
        minHeight: "100vh",
        color: "#ffffff",
      }}
    >
      <h1>Ticket Purchase Demo</h1>

      <div style={{marginBottom: "20px"}}>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "12px 24px",
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
            marginRight: "16px",
          }}
        >
          Open Ticket Modal
        </button>

        <button
          onClick={() => setShowPayment(true)}
          style={{
            padding: "12px 24px",
            backgroundColor: "#059669",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "600",
          }}
        >
          Show Payment Page
        </button>
      </div>

      {showPayment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            backgroundColor: "#0a0a0a",
          }}
        >
          <button
            onClick={() => setShowPayment(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              padding: "8px 16px",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              zIndex: 1001,
            }}
          >
            Close Payment
          </button>
          <PaymentPage eventData={eventData} />
        </div>
      )}

      <TicketModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        event={eventData}
      />
    </div>
  );
}
