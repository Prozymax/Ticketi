"use client";

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {useEventCreation} from "@/app/contexts/EventCreationContext";
import styles from "@/styles/create-event.module.css";
import "@/styles/mobileview/create-event.module.css";

export default function SummaryPage() {
  const {state, setStep} = useEventCreation();
  const router = useRouter();
  const {eventData} = state;

  useEffect(() => {
    setStep(4);
  }, []); // Remove setStep from dependencies to prevent infinite loop

  // Calculate duration in days
  const calculateDuration = () => {
    if (!eventData.startDate || !eventData.endDate) return "1 day";
    
    const start = new Date(eventData.startDate);
    const end = new Date(eventData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "1 day";
    if (diffDays === 1) return "1 day";
    return `${diffDays} days`;
  };

  const handleBack = () => {
    router.back();
  };

  const handleCreateEvent = () => {
    // Navigate to payment page
    router.push("/create-event/payment");
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

      {/* Progress Section */}
      <div className={styles["progress-section"]}>
        <div className={styles["section-info"]}>
          <h2 className={styles["section-title"]}>Summary of your Event</h2>
          <div className={styles["step-indicator"]}>4 / 4</div>
        </div>
      </div>

      {/* Form Content */}
      <div className={styles["form-content"]}>
        {/* Tickets Summary */}
        <div className={styles["form-section"]}>
          <div className={styles["summary-card"]}>
            <div className={styles["summary-header"]}>
              <div className={styles["summary-content"]}>
                <h3 className={styles["summary-label"]}>Ticket</h3>
                <p className={styles["summary-main-text"]}>
                  {eventData.regularTickets} Regular Tickets
                </p>
                <div className={styles["summary-sub-info"]}>
                  <span className={styles["summary-sub-label"]}>Price</span>
                  <span className={styles["summary-sub-value"]}>
                    {eventData.ticketPrice}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles["edit-button"]}
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
        <div className={styles["form-section"]}>
          <div className={styles["summary-card"]}>
            <div className={styles["summary-header"]}>
              <div className={styles["summary-content"]}>
                <h3 className={styles["summary-label"]}>Event Title</h3>
                <p className={styles["summary-main-text"]}>{eventData.title}</p>
              </div>
              <button
                type="button"
                className={styles["edit-button"]}
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
        <div className={styles["form-section"]}>
          <div className={styles["summary-card"]}>
            <div className={styles["summary-header"]}>
              <div className={styles["summary-content"]}>
                <h3 className={styles["summary-label"]}>
                  Description of Event
                </h3>
                <p className={styles["summary-description-text"]}>
                  {eventData.description}
                </p>
              </div>
              <button
                type="button"
                className={styles["edit-button"]}
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
        <div className={styles["form-section"]}>
          <div className={styles["summary-card"]}>
            <div className={styles["summary-header"]}>
              <div className={styles["summary-content"]}>
                <h3 className={styles["summary-label"]}>
                  Schedule and Location
                </h3>
                <p className={styles["summary-main-text"]}>
                  {eventData.location}
                </p>
              </div>
              <button
                type="button"
                className={styles["edit-button"]}
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
        <div className={styles["form-section"]}>
          <div className={styles["summary-card"]}>
            <div className={styles["summary-header"]}>
              <div className={styles["summary-content"]}>
                <div className={styles["summary-datetime-header"]}>
                  <h3 className={styles["summary-label"]}>
                    Start Date and Time
                  </h3>
                  <span className={styles["duration-badge"]}>{calculateDuration()}</span>
                </div>

                <div className={styles["datetime-summary"]}>
                  <div className={styles["datetime-row"]}>
                    <svg
                      className={styles["datetime-icon"]}
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
                    <span className={styles["datetime-value"]}>
                      {eventData.startDate}
                    </span>
                    <svg
                      className={styles["dropdown-icon"]}
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

                  <div className={styles["datetime-row"]}>
                    <svg
                      className={styles["datetime-icon"]}
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
                    <span className={styles["datetime-value"]}>
                      {eventData.startTime}
                    </span>
                    <svg
                      className={styles["dropdown-icon"]}
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

                <h4 className={styles["end-datetime-label"]}>
                  End Date and Time
                </h4>
                <div className={styles["datetime-summary"]}>
                  <div className={styles["datetime-row"]}>
                    <svg
                      className={styles["datetime-icon"]}
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
                    <span className={styles["datetime-value"]}>
                      {eventData.endDate}
                    </span>
                    <svg
                      className={styles["dropdown-icon"]}
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

                  <div className={styles["datetime-row"]}>
                    <svg
                      className={styles["datetime-icon"]}
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
                    <span className={styles["datetime-value"]}>
                      {eventData.endTime}
                    </span>
                    <svg
                      className={styles["dropdown-icon"]}
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
                className={styles["edit-button"]}
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
      <div className={styles["navigation-buttons"]}>
        <button
          type="button"
          className={styles["back-nav-button"]}
          onClick={handleBack}
        >
          Back
        </button>
        <button
          type="button"
          className={styles["create-event-button"]}
          onClick={handleCreateEvent}
        >
          Create Event
        </button>
      </div>
    </div>
  );
}
