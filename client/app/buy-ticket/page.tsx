"use client";

import { useState } from "react";
import TicketModal from "./ticket/ticket";

export default function BuyTicketPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Example event data
  const eventData = {
    id: "1",
    title: "TOKEN2049 SINGAPORE",
    image: "/event-placeholder.jpg",
    ticketPrice: 12.60,
    availableTickets: 390,
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <div style={{ 
      padding: "40px", 
      backgroundColor: "#0a0a0a", 
      minHeight: "100vh",
      color: "#ffffff"
    }}>
      <h1>Buy Ticket Demo</h1>
      <p>Click the button below to open the ticket purchase modal:</p>
      
      <button
        onClick={openModal}
        style={{
          padding: "12px 24px",
          backgroundColor: "#8b5cf6",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "600"
        }}
      >
        Buy Tickets
      </button>

      <TicketModal
        isOpen={isModalOpen}
        onClose={closeModal}
        event={eventData}
      />
    </div>
  );
}