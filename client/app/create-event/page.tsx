"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {useEventCreation} from "@/app/contexts/EventCreationContext";
import "@/styles/create-event.css";
import "@/styles/mobileview/create-event.css";

export default function CreateEventPage() {
  const {state, updateBasicInfo, setStep} = useEventCreation();
  const [eventTitle, setEventTitle] = useState(state.eventData.title);
  const [eventDescription, setEventDescription] = useState(
    state.eventData.description
  );
  const [eventImage, setEventImage] = useState<File | null>(state.eventData.eventImage || null);
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
    <div className="create-event-container">
      {/* Header */}
      <div className="header">
        <button
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
          <h2 className="section-title">Basic Information</h2>
          <div className="step-indicator">1 / 4</div>
        </div>
      </div>

      {/* Form Content */}
      <div className="form-content">
        {/* Event Title Section */}
        <div className="form-section">
          <div className="form-card">
            <div className="field-header">
              <h3 className="field-title">Event Title</h3>
              <p className="field-description">
                Tell your audience what type of event you want to host
              </p>
            </div>
            <div className="input-container">
              <input
                type="text"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Conference title, Concert names, Events, etc..."
                className="text-input"
              />
            </div>
          </div>
        </div>

        {/* Event Description Section */}
        <div className="form-section">
          <div className="form-card">
            <div className="field-header">
              <h3 className="field-title">Description of Event</h3>
              <p className="field-description">
                Explain what you want to host and be detailed about it
              </p>
            </div>
            <div className="input-container">
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Detailed description of your event..."
                className="textarea-input"
                rows={6}
              />
            </div>
          </div>
        </div>

        {/* Event Image Section */}
        <div className="form-section">
          <div className="form-card">
            <div className="field-header">
              <h3 className="field-title">Event Image</h3>
              <p className="field-description">
                Upload an image that represents your event (optional)
              </p>
            </div>
            <div className="input-container">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
                title="Upload event image"
                aria-label="Upload event image"
              />
              {eventImage && (
                <div className="image-preview">
                  <p className="selected-file">Selected: {eventImage.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Next Button */}
        <div className="button-section">
          <button
            className={`next-button ${
              !eventTitle.trim() || !eventDescription.trim() ? "disabled" : ""
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
