"use client";

import {useRouter} from "next/navigation";
import {
  Plus,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Eye,
} from "lucide-react";
import "@/styles/event-hub.css";

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

  const handleCreateEvent = () => {
    router.push("/create-event");
  };

  //   const handleManageEvent = (eventId: string) => {
  //     // Navigate to event management page
  //     router.push(`/event-hub/events/${eventId}/manage`);
  //   };

  const handleEventClick = (eventId: string) => {
    router.push(`/events/${eventId}`);
  };

  return (
    <div className="events-content">
      {/* Events List */}
      <div className="events-list">
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
              className="event-card"
              onClick={() => handleEventClick(event.id)}
            >
              {/* Event Image */}
              <div className="event-image">
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
              <div className="event-content">
                {/* Event Title and Status */}
                <div className="event-header">
                  <h3 className="event-title">{event.title}</h3>
                  <span className={`status-badge ${event.status}`}>
                    {event.status.charAt(0).toUpperCase() +
                      event.status.slice(1)}
                  </span>
                </div>

                {/* Event Details */}
                <div className="event-details">
                  <div className="detail-item">
                    <MapPin size={16} className="detail-icon" />
                    <span className="detail-text">{event.location}</span>
                  </div>
                  <div className="detail-row">
                    <div className="detail-item">
                      <Calendar size={16} className="detail-icon" />
                      <span className="detail-text">
                        {formatDate(startDate)}
                        {startDate.toDateString() !== endDate.toDateString() &&
                          ` - ${formatDate(endDate)}`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <Clock size={16} className="detail-icon" />
                      <span className="detail-text">
                        {formatTime(startDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Stats */}
                <div className="event-stats">
                  <div className="stat-item">
                    <Users className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-label">Tickets Sold</span>
                      <span className="stat-value">
                        {event.ticketsSold} / {event.regularTickets}
                      </span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <DollarSign className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-label">Revenue</span>
                      <span className="stat-value">{revenue}π</span>
                    </div>
                  </div>
                  <div className="stat-item">
                    <Eye className="stat-icon" />
                    <div className="stat-content">
                      <span className="stat-label">Price</span>
                      <span className="stat-value">{event.ticketPrice}π</span>
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
