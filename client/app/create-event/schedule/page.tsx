"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import "@/styles/create-event.css";
import "@/styles/mobileview/create-event.css";

export default function SchedulePage() {
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("Sept 12, 2025");
  const [startTime, setStartTime] = useState("00:00GMT");
  const [endDate, setEndDate] = useState("Sept 12, 2025");
  const [endTime, setEndTime] = useState("00:00GMT");
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    if (location.trim()) {
      // Navigate to tickets step of event creation
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
                    <select
                      title="start_date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="date-select"
                    >
                      <option value="Sept 12, 2025">Sept 12, 2025</option>
                      <option value="Sept 13, 2025">Sept 13, 2025</option>
                      <option value="Sept 14, 2025">Sept 14, 2025</option>
                    </select>
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
                    <select
                      title="start_time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="time-select"
                    >
                      <option value="00:00GMT">00:00GMT</option>
                      <option value="01:00GMT">01:00GMT</option>
                      <option value="02:00GMT">02:00GMT</option>
                      <option value="09:00GMT">09:00GMT</option>
                      <option value="12:00GMT">12:00GMT</option>
                      <option value="18:00GMT">18:00GMT</option>
                    </select>
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
                    <select
                      title="end_date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="date-select"
                    >
                      <option value="Sept 12, 2025">Sept 12, 2025</option>
                      <option value="Sept 13, 2025">Sept 13, 2025</option>
                      <option value="Sept 14, 2025">Sept 14, 2025</option>
                    </select>
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
                    <select
                      title="end_time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="time-select"
                    >
                      <option value="00:00GMT">00:00GMT</option>
                      <option value="01:00GMT">01:00GMT</option>
                      <option value="02:00GMT">02:00GMT</option>
                      <option value="09:00GMT">09:00GMT</option>
                      <option value="12:00GMT">12:00GMT</option>
                      <option value="18:00GMT">18:00GMT</option>
                    </select>
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
