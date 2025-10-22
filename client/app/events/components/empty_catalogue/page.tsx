"use client";

import {useRouter} from "next/navigation";
import "@/styles/home.css";
import Image from "next/image";
import "@/styles/mobileview/home.css";

export default function EmptyEventsComponent() {
  const router = useRouter();

  const handleCreateEvent = () => {
    router.push("/create-event");
  };

  const handleExploreEvents = () => {
    router.push("/explore-events");
  };

  return (
    <div className="home-container">
      {/* Main Content */}
      <div className="main-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="welcome-title">Welcome, Creator!</h1>
        </div>

        {/* Create Event Card */}
        <div className="create-event-card">
          <div className="card-icon">
            <div className="plus-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5V19M5 12H19"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <h2 className="card-title">Create Event</h2>
          <p className="card-description">
            There seems to be no event near you or in your region. Start
            creating your next successful events in a few steps
          </p>
          <button className="create-event-button" onClick={handleCreateEvent}>
            Create Event Ticket
          </button>
        </div>

        {/* Explore Events Section */}
        <div className="explore-section">
          <div className="explore-icon flex justify-center">
            <Image
              src="/icons/search.png"
              alt="search_icon"
              width={74}
              height={74}
            />
          </div>
          <h2 className="explore-title">Explore Events</h2>
          <p className="explore-description">
            Find out the next event around you before tickets are sold out
          </p>
          <button className="explore-button" onClick={handleExploreEvents}>
            Find out what&apos;s Happening
          </button>
        </div>
      </div>
    </div>
  );
}
