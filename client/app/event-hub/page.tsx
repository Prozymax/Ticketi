"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import {Plus} from "lucide-react";
import {events as myEventsData} from "@/my-events-data";

// Import components
import EmptyEvents from "./events/components/empyEvents";
import Events from "./events/components/events";
import EmptyTickets from "./tickets/components/emptyTickets";
import Tickets from "./tickets/components/tickets";

import "@/styles/event-hub.css";
import "@/styles/empty-events.css";

type TabType = "events" | "tickets";

export default function EventHubPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("events");
  const [events, setEvents] = useState<any[]>([]);
  const [tickets, setTickets] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch both events and tickets data
    const fetchData = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock events data from my-events-data.ts
        setEvents(myEventsData);

        // Mock tickets data
        const mockTickets = [
          // {
          //   id: "TKT-001-2024",
          //   eventTitle: "Token2049 Singapore",
          //   eventImage: "/events/event.png",
          //   venue:
          //     "Marina Bay Sands (10 Bayfront Avenue, Singapore, 018956, SG)",
          //   date: "October 1st & 2nd",
          //   time: "10am Daily UTC",
          //   ticketType: "General Admission",
          //   price: 12.998,
          //   currency: "π",
          //   purchaser: {
          //     id: "USR-001",
          //     name: "woodylightyearx",
          //     email: "woody@example.com",
          //     avatar: "/api/placeholder/50/50",
          //   },
          //   purchaseDate: "2024-09-15T10:30:00Z",
          //   status: "valid",
          // },
          // {
          //   id: "TKT-002-2024",
          //   eventTitle: "Woody's End of Year Pi House Party",
          //   eventImage: "/images/event.png",
          //   venue:
          //     "Marina Bay Sands (10 Bayfront Avenue, Singapore, 018956, SG)",
          //   date: "October 1st & 2nd",
          //   time: "10am Daily UTC",
          //   ticketType: "VIP Access",
          //   price: 25.5,
          //   currency: "π",
          //   purchaser: {
          //     id: "USR-001",
          //     name: "woodylightyearx",
          //     email: "woody@example.com",
          //     avatar: "/api/placeholder/50/50",
          //   },
          //   purchaseDate: "2024-09-20T14:15:00Z",
          //   status: "valid",
          // },
        ];

        setTickets(mockTickets);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
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
    <div className="event-hub-container">
      {/* Centralized Header */}
      <div className="event-hub-header">
        <h1 className="header-title">Event Hub</h1>
        <button
          title="create-event"
          className="add-button"
          onClick={handleCreateEvent}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Centralized Tab Navigation */}
      <div className="tab-navigation">
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
      <div className="tab-content">{renderContent()}</div>
    </div>
  );
}
