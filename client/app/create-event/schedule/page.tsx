"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import { useEventCreation } from "@/app/contexts/EventCreationContext";
import "@/styles/create-event.css";
import "@/styles/mobileview/create-event.css";

export default function SchedulePage() {
  const { state, updateSchedule, setStep } = useEventCreation();
  const [location, setLocation] = useState(state.eventData.location);
  const [startDate, setStartDate] = useState(state.eventData.startDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(state.eventData.startTime || "09:00");
  const [endDate, setEndDate] = useState(state.eventData.endDate || new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState(state.eventData.endTime || "17:00");
  const router = useRouter();

  useEffect(() => {
    setStep(2);
  }, []); // Remove dependencies to prevent infinite loop

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    if (location.trim()) {
      updateSchedule(location, startDate, startTime, endDate, endTime);
      router.push("/create-event/tickets");
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
          <h2 className="section-title">Schedule and Location</h2>
          <div className="step-indicator">2 / 4</div>
        </div>
      </div>

      {/* Form Content */}
      <div className="form-content">
        {/* Location Section */}
        <div className="form-section">
          <div className="form-card">
            <div className="field-header">
              <h3 className="field-title">Location</h3>
              <p className="field-description">
                Country, Providence, City, Streets and Markland&apos;s
              </p>
            </div>
            <div className="input-container">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Give a detail address for events"
                className="text-input"
              />
            </div>
          </div>
        </div>

        {/* Date and Time Section */}
        <div className="form-section">
          <div className="form-card">
            <div className="field-header">
              <h3 className="field-title">Date and Time</h3>
              <p className="field-description">
                Select the date and time for your event or conference
              </p>
            </div>

            {/* Start Date and Time */}
            <div className="datetime-section">
              <h4 className="datetime-label">Start Date and Time</h4>
              <div className="datetime-inputs">
                <div className="date-input-group">
                  <div className="input-with-icon">
                    <svg
                      className="input-icon"
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
                    <input
                      type="date"
                      title="start_date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="date-select"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div className="time-input-group">
                  <div className="input-with-icon">
                    <svg
                      className="input-icon"
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
                    <input
                      type="time"
                      title="start_time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="time-select"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* End Date and Time */}
            <div className="datetime-section">
              <h4 className="datetime-label">End Date and Time</h4>
              <div className="datetime-inputs">
                <div className="date-input-group">
                  <div className="input-with-icon">
                    <svg
                      className="input-icon"
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
                    <input
                      type="date"
                      title="end_date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="date-select"
                      min={startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div className="time-input-group">
                  <div className="input-with-icon">
                    <svg
                      className="input-icon"
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
                    <input
                      type="time"
                      title="end_time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="time-select"
                    />
                  </div>
                </div>
              </div>
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
          className={`next-button ${!location.trim() ? "disabled" : ""}`}
          onClick={handleNext}
          disabled={!location.trim()}
        >
          Next
        </button>
      </div>
    </div>
  );
}
