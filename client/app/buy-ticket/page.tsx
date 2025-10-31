"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiService } from "../lib/api";
import TicketModal from "./ticket/ticket";

function BuyTicketContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId");

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getEventById(eventId);
      
      if (response.success && response.data) {
        setEventData({
          id: response.data.id,
          title: response.data.title,
          image: response.data.eventImage || "/event-placeholder.jpg",
          ticketPrice: response.data.ticketPrice,
          availableTickets: response.data.regularTickets - response.data.ticketsSold,
        });
        setIsModalOpen(true); // Auto-open modal when event loads
      } else {
        setError(response.message || "Failed to load event");
      }
    } catch (error) {
      console.error("Error loading event:", error);
      setError("Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Default demo event if no eventId provided
  const demoEventData = {
    id: "demo",
    title: "TOKEN2049 SINGAPORE",
    image: "/event-placeholder.jpg",
    ticketPrice: 12.60,
    availableTickets: 390,
  };

  const currentEvent = eventData || demoEventData;

  return (
    <div style={{ 
      padding: "40px", 
      backgroundColor: "#0a0a0a", 
      minHeight: "100vh",
      color: "#ffffff"
    }}>
      <h1>Buy Ticket</h1>
      
      {eventId ? (
        <>
          {loading && <p>Loading event details...</p>}
          {error && <p style={{ color: "#ef4444" }}>Error: {error}</p>}
          {eventData && (
            <div>
              <h2>{eventData.title}</h2>
              <p>Price: {eventData.ticketPrice}π per ticket</p>
              <p>Available: {eventData.availableTickets} tickets</p>
            </div>
          )}
        </>
      ) : (
        <>
          <p>Demo mode - Click the button below to open the ticket purchase modal:</p>
          <p>To buy tickets for a specific event, use: /buy-ticket?eventId=EVENT_ID</p>
          
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
              fontWeight: "600",
              marginTop: "20px"
            }}
          >
            Buy Demo Tickets
          </button>
        </>
      )}

      <TicketModal
        isOpen={isModalOpen}
        onClose={closeModal}
        event={currentEvent}
      />
    </div>
  );
}

export default function BuyTicketPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        padding: "40px", 
        backgroundColor: "#0a0a0a", 
        minHeight: "100vh",
        color: "#ffffff",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <p>Loading...</p>
      </div>
    }>
      <BuyTicketContent />
    </Suspense>
  );
}