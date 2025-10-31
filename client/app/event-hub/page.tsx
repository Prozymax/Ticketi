"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {Plus} from "lucide-react";
import {eventAPI} from "@/app/utils/api";

// Import components
import EmptyEvents from "./events/components/empyEvents";
import Events from "./events/components/events";
import EmptyTickets from "./tickets/components/emptyTickets";
import Tickets from "./tickets/components/tickets";

import styles from "@/styles/event-hub.module.css";
import "@/styles/empty-events.module.css";

type TabType = "events" | "tickets";

export default function EventHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("events");
  const [events, setEvents] = useState<any[]>([]);
  const [tickets, setTickets] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch both events and tickets data
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch real events data from API
        const eventsResponse = await eventAPI.getMyEvents();
        if (eventsResponse.success && eventsResponse.data) {
          setEvents(eventsResponse.data);
        } else {
          console.error("Failed to fetch events:", eventsResponse.error);
          setError(eventsResponse.error || "Failed to fetch events");
          setEvents([]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
        setEvents([]);
        setTickets([]);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreateEvent = () => {
    router.push("/create-event");
  };

  const handleTabSwitch = (tab: TabType) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className={styles["loading-container"]}>
        <div className={styles["loading-spinner"]}></div>
        <p>Loading your events...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles["error-container"]}>
        <div className={styles["error-message"]}>
          <h3>Error Loading Events</h3>
          <p>{error}</p>
          <button
            className={styles["retry-button"]}
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeTab === "events") {
      // Show empty state if no events
      if (events.length === 0) {
        return <EmptyEvents />;
      }
      // Show events list if events exist
      return <Events events={events} />;
    } else {
      // Show empty state if no tickets
      if (tickets.length === 0) {
        return <EmptyTickets />;
      }
      // Show tickets list if tickets exist
      return <Tickets tickets={tickets} />;
    }
  };

  return (
    <div className={styles["event-hub-container"]}>
      {/* Centralized Header */}
      <div className={styles["event-hub-header"]}>
        <h1 className={styles["header-title"]}>Event Hub</h1>
        <button
          title="create-event"
          className={styles["add-button"]}
          onClick={handleCreateEvent}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Centralized Tab Navigation */}
      <div className={styles["tab-navigation"]}>
        <button
          className={`tab-button ${activeTab === "events" ? "active" : ""}`}
          onClick={() => handleTabSwitch("events")}
        >
          My Events
        </button>
        <button
          className={`tab-button ${activeTab === "tickets" ? "active" : ""}`}
          onClick={() => handleTabSwitch("tickets")}
        >
          Tickets Bought
        </button>
      </div>

      {/* Dynamic Content */}
      <div className={styles["tab-content"]}>{renderContent()}</div>
    </div>
  );
}
