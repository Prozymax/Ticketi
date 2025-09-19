"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import "@/styles/create-event.css";
import "@/styles/mobileview/create-event.css";

export default function SummaryPage() {
  const router = useRouter();

  // Mock data - in a real app, this would come from state management or props
  const [eventData] = useState({
    tickets: {
      regular: 28,
      price: "10π",
    },
    title: "Token2049 Singapore",
    description:
      'A music festival in Sydney, Australia, is set to feature local artists in a series of live performances. The festival, called "Music in the Park," will showcase the work of up-and-coming musicians in the area.',
    location: "Marina Bay Sands (10 Bayfront Avenue, Singapore, 018956, SG)",
    startDate: "Sept 12, 2025",
    startTime: "00:00GMT",
    endDate: "Sept 12, 2025",
    endTime: "00:00GMT",
  });

  const handleBack = () => {
    router.back();
  };

  const handleCreateEvent = () => {
    // Navigate to payment page
    router.push('/create-event/payment');
  };

  const handleEdit = (section: string) => {
    // Handle editing specific sections
    console.log("Edit section:", section);
    switch (section) {
      case "tickets":
        router.push("/create-event/tickets");
        break;
      case "basic":
        router.push("/create-event");
        break;
      case "schedule":
        router.push("/create-event/schedule");
        break;
      default:
        break;
    }
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
          <h2 className="section-title">Summary of your Event</h2>
          <div className="step-indicator">4 / 4</div>
        </div>
      </div>

      {/* Form Content */}
      <div className="form-content">
        {/* Tickets Summary */}
        <div className="form-section">
          <div className="summary-card">
            <div className="summary-header">
              <div className="summary-content">
                <h3 className="summary-label">Ticket</h3>
                <p className="summary-main-text">
                  {eventData.tickets.regular} Regular Tickets
                </p>
                <div className="summary-sub-info">
                  <span className="summary-sub-label">Price</span>
                  <span className="summary-sub-value">
                    {eventData.tickets.price}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="edit-button"
                onClick={() => handleEdit("tickets")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Event Title Summary */}
        <div className="form-section">
          <div className="summary-card">
            <div className="summary-header">
              <div className="summary-content">
                <h3 className="summary-label">Event Title</h3>
                <p className="summary-main-text">{eventData.title}</p>
              </div>
              <button
                type="button"
                className="edit-button"
                onClick={() => handleEdit("basic")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Description Summary */}
        <div className="form-section">
          <div className="summary-card">
            <div className="summary-header">
              <div className="summary-content">
                <h3 className="summary-label">Description of Event</h3>
                <p className="summary-description-text">
                  {eventData.description}
                </p>
              </div>
              <button
                type="button"
                className="edit-button"
                onClick={() => handleEdit("basic")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Schedule and Location Summary */}
        <div className="form-section">
          <div className="summary-card">
            <div className="summary-header">
              <div className="summary-content">
                <h3 className="summary-label">Schedule and Location</h3>
                <p className="summary-main-text">{eventData.location}</p>
              </div>
              <button
                type="button"
                className="edit-button"
                onClick={() => handleEdit("schedule")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Start Date and Time Summary */}
        <div className="form-section">
          <div className="summary-card">
            <div className="summary-header">
              <div className="summary-content">
                <div className="summary-datetime-header">
                  <h3 className="summary-label">Start Date and Time</h3>
                  <span className="duration-badge">3days</span>
                </div>

                <div className="datetime-summary">
                  <div className="datetime-row">
                    <svg
                      className="datetime-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <line
                        x1="16"
                        y1="2"
                        x2="16"
                        y2="6"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <line
                        x1="8"
                        y1="2"
                        x2="8"
                        y2="6"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <line
                        x1="3"
                        y1="10"
                        x2="21"
                        y2="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="datetime-value">
                      {eventData.startDate}
                    </span>
                    <svg
                      className="dropdown-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="datetime-row">
                    <svg
                      className="datetime-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <polyline
                        points="12,6 12,12 16,14"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="datetime-value">
                      {eventData.startTime}
                    </span>
                    <svg
                      className="dropdown-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>

                <h4 className="end-datetime-label">End Date and Time</h4>
                <div className="datetime-summary">
                  <div className="datetime-row">
                    <svg
                      className="datetime-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <line
                        x1="16"
                        y1="2"
                        x2="16"
                        y2="6"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <line
                        x1="8"
                        y1="2"
                        x2="8"
                        y2="6"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <line
                        x1="3"
                        y1="10"
                        x2="21"
                        y2="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="datetime-value">{eventData.endDate}</span>
                    <svg
                      className="dropdown-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <div className="datetime-row">
                    <svg
                      className="datetime-icon"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <polyline
                        points="12,6 12,12 16,14"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    <span className="datetime-value">{eventData.endTime}</span>
                    <svg
                      className="dropdown-icon"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="edit-button"
                onClick={() => handleEdit("schedule")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit
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
        <button
          type="button"
          className="create-event-button"
          onClick={handleCreateEvent}
        >
          Create Event
        </button>
      </div>
    </div>
  );
}
