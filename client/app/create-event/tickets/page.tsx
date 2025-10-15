"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import { useEventCreation } from "@/app/contexts/EventCreationContext";
import "@/styles/create-event.css";
import "@/styles/mobileview/create-event.css";

export default function TicketsPage() {
  const { state, updateTickets, setStep } = useEventCreation();
  const router = useRouter();
  const [regularTickets, setRegularTickets] = useState(state.eventData.regularTickets);
  const [ticketPrice, setTicketPrice] = useState(state.eventData.ticketPrice);

  useEffect(() => {
    setStep(3);
  }, []); // Remove setStep from dependencies to prevent infinite loop

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    updateTickets(regularTickets, ticketPrice);
    router.push("/create-event/summary");
  };

  const handleAddMoreGuest = () => {
    // Handle adding more guest types
    console.log("Add more guest clicked");
  };

  return (
    <div className="create-event-container">
      {/* Header */}
      <div className="header">
        <button
          type="button"
          title="back-button"
          className="back-button"
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
        <h1 className="page-title">Create Event</h1>
        <div className="header-spacer"></div>
      </div>

      {/* Progress Section */}
      <div className="progress-section">
        <div className="section-info">
          <h2 className="section-title">Ticket</h2>
          <div className="step-indicator">3 / 4</div>
        </div>
      </div>

      {/* Form Content */}
      <div className="form-content">
        {/* Number of Tickets Section */}
        <div className="form-section">
          <div className="form-card">
            <div className="field-header">
              <h3 className="field-title">Number of Tickets</h3>
              <p className="field-description">
                Total number of audience or people you will be expecting
              </p>
            </div>

            <div className="ticket-input-group">
              <div className="ticket-type">
                <svg
                  className="ticket-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="9"
                    cy="7"
                    r="4"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M22 21v-2a4 4 0 0 0-3-3.87"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M16 3.13a4 4 0 0 1 0 7.75"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Regular tickets</span>
              </div>
              <input
                type="number"
                value={regularTickets}
                onChange={(e) => setRegularTickets(Number(e.target.value))}
                className="ticket-number-input"
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Price Section */}
        <div className="form-section">
          <div className="form-card">
            <div className="field-header">
              <h3 className="field-title">Price</h3>
              <p className="field-description">
                Set a fair price for ticket in Pi
              </p>
            </div>

            <div className="price-input-group">
              <div className="price-type">
                <svg
                  className="price-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1V6H9V4h6v2h2V3.6c0-.4-.2-.8-.5-1.1-.3-.3-.7-.5-1.1-.5z"
                    fill="currentColor"
                  />
                  <path
                    d="M19 8H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-7 7.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"
                    fill="currentColor"
                  />
                </svg>
                <span>Ticket Price</span>
              </div>
              <input
                type="text"
                value={ticketPrice}
                onChange={(e) => setTicketPrice(e.target.value)}
                className="price-input"
                placeholder="0.0π"
              />
            </div>

            {/* Add More Guest Button */}
            <div className="add-guest-section">
              <button
                type="button"
                className="add-guest-btn"
                onClick={handleAddMoreGuest}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <line
                    x1="12"
                    y1="5"
                    x2="12"
                    y2="19"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <line
                    x1="5"
                    y1="12"
                    x2="19"
                    y2="12"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                Add more guest
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="navigation-buttons">
        <button type="button" className="back-nav-button" onClick={handleBack}>
          Back
        </button>
        <button type="button" className="next-button" onClick={handleNext}>
          Next
        </button>
      </div>
    </div>
  );
}
