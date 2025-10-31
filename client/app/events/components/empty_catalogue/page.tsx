"use client";

import {useRouter} from "next/navigation";
import styles from "@/styles/home.module.css";
import Image from "next/image";
import "@/styles/mobileview/home.module.css";

export default function EmptyEventsComponent() {
  const router = useRouter();

  const handleCreateEvent = () => {
    router.push("/create-event");
  };

  const handleExploreEvents = () => {
    router.push("/explore-events");
  };

  return (
    <div className={styles["home-container"]}>
      {/* Main Content */}
      <div className={styles["main-content"]}>
        {/* Welcome Section */}
        <div className={styles["welcome-section"]}>
          <h1 className={styles["welcome-title"]}>Welcome, Creator!</h1>
        </div>

        {/* Create Event Card */}
        <div className={styles["create-event-card"]}>
          <div className={styles["card-icon"]}>
            <div className={styles["plus-icon"]}>
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
          <h2 className={styles["card-title"]}>Create Event</h2>
          <p className={styles["card-description"]}>
            There seems to be no event near you or in your region. Start
            creating your next successful events in a few steps
          </p>
          <button
            className={styles["create-event-button"]}
            onClick={handleCreateEvent}
          >
            Create Event Ticket
          </button>
        </div>

        {/* Explore Events Section */}
        <div className={styles["explore-section"]}>
          <div
            className={`${styles["explore-icon"]} ${styles.flex} ${styles["justify-center"]}`}
          >
            <Image
              src="/icons/search.png"
              alt="search_icon"
              width={74}
              height={74}
            />
          </div>
          <h2 className={styles["explore-title"]}>Explore Events</h2>
          <p className={styles["explore-description"]}>
            Find out the next event around you before tickets are sold out
          </p>
          <button
            className={styles["explore-button"]}
            onClick={handleExploreEvents}
          >
            Find out what&apos;s happening
          </button>
        </div>
      </div>
    </div>
  );
}
