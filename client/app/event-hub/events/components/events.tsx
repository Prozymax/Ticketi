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
import {events} from "@/my-events-data";
import "@/styles/event-hub.css";

interface EventsProps {
  events?: unknown[];
}

const Events = ({events: propEvents}: EventsProps) => {
  const router = useRouter();
  const eventsData = propEvents || events;

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
        {eventsData.map((event, index) => (
          <div
            key={index}
            className="event-card"
            onClick={() => handleEventClick(index.toString())}
          >
            {/* Event Image */}
            <div className="event-image">
              <img
                src={`/events/${event.image}`}
                alt={event.title}
              />
            </div>

            {/* Event Content */}
            <div className="event-content">
              {/* Event Title and Manage Button */}
              <div className="event-header">
                <h3 className="event-title">{event.title}</h3>
                {/* <button
                  className="manage-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleManageEvent(index.toString());
                  }}
                >
                  Manage
                </button> */}
              </div>

              {/* Event Details */}
              <div className="event-details">
                <div className="detail-item">
                  <MapPin size={16} className="detail-icon" />
                  <span className="detail-text">{event.venue}</span>
                </div>
                <div className="detail-row">
                  <div className="detail-item">
                    <Calendar size={16} className="detail-icon" />
                    <span className="detail-text">Date: {event.data}</span>
                  </div>
                  <div className="detail-item">
                    <Clock size={16} className="detail-icon" />
                    <span className="detail-text">{event.time}</span>
                  </div>
                </div>
              </div>

              {/* Event Stats */}
              <div className="event-stats">
                <div className="stat-item">
                  <Users className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Tickets Sold</span>
                    <span className="stat-value">390</span>
                  </div>
                </div>
                <div className="stat-item">
                  <DollarSign className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Revenue</span>
                    <span className="stat-value">{event.ticket_price}π</span>
                  </div>
                </div>
                <div className="stat-item">
                  <Eye className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-label">Views</span>
                    <span className="stat-value">13,803</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;
