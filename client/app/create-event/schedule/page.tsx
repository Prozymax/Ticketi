"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {useEventCreation} from "@/app/contexts/EventCreationContext";
import styles from "@/styles/create-event.module.css";
import "@/styles/mobileview/create-event.module.css";

export default function SchedulePage() {
  const {state, updateSchedule, setStep} = useEventCreation();
  const [location, setLocation] = useState(state.eventData.location);
  const [startDate, setStartDate] = useState(
    state.eventData.startDate || new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState(
    state.eventData.startTime || "09:00"
  );
  const [endDate, setEndDate] = useState(
    state.eventData.endDate || new Date().toISOString().split("T")[0]
  );
  const [endTime, setEndTime] = useState(state.eventData.endTime || "17:00");
  const router = useRouter();

  useEffect(() => {
    setStep(2);
  }, [setStep]); // Remove dependencies to prevent infinite loop

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
    <div className={styles['create-event-container']}>
      {/* Header */}
      <div className={styles.header}>
        <button
          type="button"
          title="back-button"
          className={styles['back-button']}
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
        <h1 className={styles['page-title']}>Create Event</h1>
        <div className={styles['header-spacer']}></div>
      </div>

      {/* Progress Section */}
      <div className={styles['progress-section']}>
        <div className={styles['section-info']}>
          <h2 className={styles['section-title']}>Schedule and Location</h2>
          <div className={styles['step-indicator']}>2 / 4</div>
        </div>
      </div>

      {/* Form Content */}
      <div className={styles['form-content']}>
        {/* Location Section */}
        <div className={styles['form-section']}>
          <div className={styles['form-card']}>
            <div className={styles['field-header']}>
              <h3 className={styles['field-title']}>Location</h3>
              <p className={styles['field-description']}>
                Country, Providence, City, Streets and Markland&apos;s
              </p>
            </div>
            <div className={styles['input-container']}>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Give a detail address for events"
                className={styles['text-input']}
              />
            </div>
          </div>
        </div>

        {/* Date and Time Section */}
        <div className={styles['form-section']}>
          <div className={styles['form-card']}>
            <div className={styles['field-header']}>
              <h3 className={styles['field-title']}>Date and Time</h3>
              <p className={styles['field-description']}>
                Select the date and time for your event or conference
              </p>
            </div>

            {/* Start Date and Time */}
            <div className={styles['datetime-section']}>
              <h4 className={styles['datetime-label']}>Start Date and Time</h4>
              <div className={styles['datetime-inputs']}>
                <div className={styles['date-input-group']}>
                  <div className={styles['input-with-icon']}>
                    <svg
                      className={styles['input-icon']}
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
                      className={styles['date-select']}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
                <div className={styles['time-input-group']}>
                  <div className={styles['input-with-icon']}>
                    <svg
                      className={styles['input-icon']}
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
                      className={styles['time-select']}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* End Date and Time */}
            <div className={styles['datetime-section']}>
              <h4 className={styles['datetime-label']}>End Date and Time</h4>
              <div className={styles['datetime-inputs']}>
                <div className={styles['date-input-group']}>
                  <div className={styles['input-with-icon']}>
                    <svg
                      className={styles['input-icon']}
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
                      className={styles['date-select']}
                      min={startDate || new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>
                <div className={styles['time-input-group']}>
                  <div className={styles['input-with-icon']}>
                    <svg
                      className={styles['input-icon']}
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
                      className={styles['time-select']}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className={styles['navigation-buttons']}>
        <button type="button" className={styles['back-nav-button']} onClick={handleBack}>
          Back
        </button>
        <button
          type="button"
          className={`${styles['next-button']} ${!location.trim() ? styles.disabled : ""}`}
          onClick={handleNext}
          disabled={!location.trim()}
        >
          Next
        </button>
      </div>
    </div>
  );
}
