"use client";

import {useRouter} from "next/navigation";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Eye,
  Settings,
} from "lucide-react";
import styles from "@/styles/event-hub.module.css";

interface DatabaseEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  regularTickets: number;
  ticketPrice: string;
  eventImage?: string;
  isPublished: boolean;
  ticketsSold: number;
  status: "draft" | "published" | "cancelled" | "completed";
  createdAt: string;
  updatedAt: string;
}

interface EventsProps {
  events?: DatabaseEvent[];
}

const Events = ({events: propEvents}: EventsProps) => {
  const router = useRouter();
  const eventsData = propEvents || [];

  const handleEventClick = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <div className={styles["events-content"]}>
      {/* Events List */}
      <div className={styles["events-list"]}>
        {eventsData.map((event) => {
          // Format dates
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);
          const formatDate = (date: Date) => {
            return date.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            });
          };
          const formatTime = (date: Date) => {
            return date.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          };

          // Calculate revenue
          const revenue = (
            parseFloat(event.ticketPrice) * event.ticketsSold
          ).toFixed(2);

          return (
            <div
              key={event.id}
              className={styles["event-card"]}
              onClick={() => handleEventClick(event.id)}
            >
              {/* Event Image */}
              <div className={styles["event-image"]}>
                <img
                  src={event.eventImage || "/events/events_sample.jpg"}
                  alt={event.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/events/events_sample.jpg";
                  }}
                />
              </div>

              {/* Event Content */}
              <div className={styles["event-content"]}>
                {/* Event Title and Manage Button */}
                <div className={styles["event-header"]}>
                  <h3 className={styles["event-title"]}>{event.title}</h3>
                  <button
                    type="button"
                    disabled
                    className={styles["manage-button"]}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/event-hub/events/${event.id}/manage`);
                    }}
                  >
                    <Settings size={18} />
                    Manage
                  </button>
                </div>

                {/* Event Details */}
                <div className={styles["event-details"]}>
                  <div className={styles["details-item"]}>
                    <MapPin size={16} className={styles["detail-icon"]} />
                    <span className={styles["detail-text"]}>
                      {event.location}
                    </span>
                  </div>
                  <div className={styles["detail-row"]}>
                    <div className={styles["detail-item"]}>
                      <Calendar size={16} className={styles["detail-icon"]} />
                      <span className={styles["detail-text"]}>
                        {formatDate(startDate)}
                        {startDate.toDateString() !== endDate.toDateString() &&
                          ` - ${formatDate(endDate)}`}
                      </span>
                    </div>
                    <div className={styles["detail-item"]}>
                      <Clock size={16} className={styles["detail-icon"]} />
                      <span className={styles["detail-text"]}>
                        {formatTime(startDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Stats */}
                <div className={styles["event-stats"]}>
                  <div className={styles["stat-item"]}>
                    <Users size={18} className={styles["stat-icon"]} />
                    <div className={styles["stat-content"]}>
                      <span className={styles["stat-label"]}>Tickets Sold</span>
                      <span className={styles["stat-value"]}>
                        {event.ticketsSold}
                      </span>
                    </div>
                  </div>
                  <div className={styles["stat-item"]}>
                    <DollarSign size={18} className={styles["stat-icon"]} />
                    <div className={styles["stat-content"]}>
                      <span className={styles["stat-label"]}>Revenue</span>
                      <span className={styles["stat-value"]}>{revenue}π</span>
                    </div>
                  </div>
                  <div className={styles["stat-item"]}>
                    <Eye size={18} className={styles["stat-icon"]} />
                    <div className={styles["stat-content"]}>
                      <span className={styles["stat-label"]}>Views</span>
                      <span className={styles["stat-value"]}>
                        {Math.floor(Math.random() * 10000)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Events;
