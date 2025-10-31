"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {useEventCreation} from "@/app/contexts/EventCreationContext";
import styles from "@/styles/create-event.module.css";
import "@/styles/mobileview/create-event.module.css";

export default function CreateEventPage() {
  const {state, updateBasicInfo, setStep} = useEventCreation();
  const [eventTitle, setEventTitle] = useState(state.eventData.title);
  const [eventDescription, setEventDescription] = useState(
    state.eventData.description
  );
  const [eventImage, setEventImage] = useState<File | null>(
    state.eventData.eventImage || null
  );
  const router = useRouter();

  useEffect(() => {
    setStep(1);
  }, [setStep]); // Remove setStep from dependencies to prevent infinite loop

  const handleBack = () => {
    router.back();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setEventImage(file);
  };

  const handleNext = () => {
    if (eventTitle.trim() && eventDescription.trim()) {
      updateBasicInfo(eventTitle, eventDescription, eventImage);
      router.push("/create-event/schedule");
    }
  };

  return (
    <div className={styles["create-event-container"]}>
      {/* Header */}
      <div className={styles.header}>
        <button
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
          <h2 className={styles["section-title"]}>Basic Information</h2>
          <div className={styles["step-indicator"]}>1 / 4</div>
        </div>
      </div>

      {/* Form Content */}
      <div className={styles["form-content"]}>
        {/* Event Title Section */}
        <div className={styles["form-section"]}>
          <div className={styles["form-card"]}>
            <div className={styles["field-header"]}>
              <h3 className={styles["field-title"]}>Event Title</h3>
              <p className={styles["field-description"]}>
                Tell your audience what type of event you want to host
              </p>
            </div>
            <div className={styles["input-container"]}>
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Conference title, Concert names, Events, etc..."
                className={styles["text-input"]}
              />
            </div>
          </div>
        </div>

        {/* Event Description Section */}
        <div className={styles["form-section"]}>
          <div className={styles["form-card"]}>
            <div className={styles["field-header"]}>
              <h3 className={styles["field-title"]}>Description of Event</h3>
              <p className={styles["field-description"]}>
                Explain what you want to host and be detailed about it
              </p>
            </div>
            <div className={styles["input-container"]}>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Detailed description of your event..."
                className={styles["textarea-input"]}
                rows={6}
              />
            </div>
          </div>
        </div>

        {/* Event Image Section */}
        <div className={styles["form-section"]}>
          <div className={styles["form-card"]}>
            <div className={styles["field-header"]}>
              <h3 className={styles["field-title"]}>Event Image</h3>
              <p className={styles["field-description"]}>
                Upload an image that represents your event (optional)
              </p>
            </div>
            <div className={styles["input-container"]}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles["file-input"]}
                title="Upload event image"
                aria-label="Upload event image"
              />
              {eventImage && (
                <div className={styles["image-preview"]}>
                  <p className={styles["selected-file"]}>
                    Selected: {eventImage.name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Button */}
        <div className={styles["button-section"]}>
          <button
            className={`${styles["next-button"]} ${
              !eventTitle.trim() || !eventDescription.trim()
                ? styles.disabled
                : ""
            }`}
            onClick={handleNext}
            disabled={!eventTitle.trim() || !eventDescription.trim()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
