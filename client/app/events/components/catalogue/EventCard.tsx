"use client";

import {useRouter} from "next/navigation";
import Image from "next/image";
import styles from "@/styles/event-card.module.css";

interface EventCardProps {
  event: {
    id?: string;
    image: string;
    title: string;
    ticket_price: string;
    venue: string;
    data: string;
    time: string;
    ticket_amount: number;
  };
}

export default function EventCard({event}: EventCardProps) {
  const router = useRouter();

  const handleDetailsClick = () => {
    // Navigate to event details page using ID if available, otherwise use title
    const eventPath = event.id
      ? `/events/${event.id}`
      : `/events/${event.title.toLowerCase().replace(/\s+/g, "-")}`;
    router.push(eventPath);
  };

  // Safety check for event object
  if (!event) {
    return null;
  }

  console.log('Events:  ', event)

  return (
    <div className={styles['event-card']}>
      {/* Event Image */}
      <div className={styles['event-image-container']}>
        <img
          src={event.image}
          alt={event.title || "Event"}
          className={styles['event-image']}
          width={400}
          height={240}
        />
        <div className={styles['image-overlay']}></div>
      </div>

      {/* Event Content */}
      <div className={styles['event-content']}>
        {/* Header with title and price */}
        <div className={styles['event-header']}>
          <h3 className={styles['event-title']}>{event.title || "Untitled Event"}</h3>
          <div className={styles['event-price']}>
            <span className={styles['price-amount']}>{event.ticket_price || "0"}</span>
            <span className={styles['pi-symbol']}>π</span>
          </div>
        </div>

        {/* Event Details */}
        <div className={styles['event-details']}>
          {/* Location */}
          <div className={styles['detail-item']}>
            <div className={`${styles['detail-icon']} ${styles['location-icon']}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="10"
                  r="3"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </div>
            <span className={styles['detail-text']}>{event.venue || "TBD"}</span>
          </div>

          {/* Date and Time */}
          <div className={styles['detail-item']}>
            <div className={`${styles['detail-icon']} ${styles['date-icon']}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
            </div>
            <span className={styles['detail-text']}>Date: {event.data || "TBD"}</span>
            <div className={`${styles['detail-icon']} ${styles['time-icon']}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
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
            </div>
            <span className={styles['detail-text']}>{event.time || "TBD"}</span>
          </div>

          {/* Tickets Available */}
          <div className={`${styles['detail-item']} ${styles['tickets-info']}`}>
            <div className={`${styles['detail-icon']} ${styles['ticket-icon']}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1V6H9V4h6v2h2V3.6c0-.4-.2-.8-.5-1.1-.3-.3-.7-.5-1.1-.5z"
                  fill="currentColor"
                />
                <path
                  d="M19 8H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-7 7.5c-1.4 0-2.5-1.1-2.5-2.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className={styles['tickets-left']}>
              <span className={styles['tickets-count']}>
                {event.ticket_amount || 0} Tickets left
              </span>
              <span className={styles['ticket-type']}>Standard, Per Person</span>
            </div>
          </div>
        </div>

        {/* Details Button */}
        <div className={styles['event-actions']}>
          <p className={styles['details-button']} onClick={handleDetailsClick}>
            Details
          </p>
        </div>
      </div>
    </div>
  );
}
