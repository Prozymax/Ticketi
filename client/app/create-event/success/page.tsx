'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useEventCreation } from '@/app/contexts/EventCreationContext';
import { UserStorage } from '@/app/utils/userStorage';
import styles from '@/styles/success.module.css'

interface EventData {
  eventHost: string;
  price: string;
  eventTitle: string;
  tickets: string;
  location: string;
  creatorFee: string;
}

export default function SuccessPage() {
  const router = useRouter();
  const { state, reset } = useEventCreation();
  const [eventData, setEventData] = useState<EventData | null>(null);

  useEffect(() => {
    // Get user data
    const userData = UserStorage.getUserData();
    const username = userData?.username || 'Event Creator';
    
    // Use actual event data from context
    if (state.eventData.title) {
      setEventData({
        eventHost: username,
        price: state.eventData.ticketPrice,
        eventTitle: state.eventData.title,
        tickets: `${state.eventData.regularTickets} Regular Tickets`,
        location: state.eventData.location,
        creatorFee: '0.5π'
      });
    } else {
      // Fallback if no event data
      router.push('/');
    }
  }, [state.eventData, router]);

  const handleComplete = () => {
    // Clear event data and navigate to events page
    localStorage.removeItem('eventData');
    reset(); // Reset the event creation context now that we're done
    router.push('/events');
  };

  const handleShare = () => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: eventData?.eventTitle || 'My Event',
        text: `Check out my event: ${eventData?.eventTitle}`,
        url: window.location.origin
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.origin);
      alert('Event link copied to clipboard!');
    }
  };

  if (!eventData) {
    return (
      <div className={styles['create-event-container']}>
        <div className={styles['loading-container']}>
          <div className={styles['loading-spinner']}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['create-event-container']}>
      {/* Header */}
      <div className={styles['success-header']}>
        <div className={styles.logo}>
          <span className={styles['logo-text']}>Ticket</span>
          <span className={styles['logo-accent']}>i</span>
        </div>
      </div>

      {/* Success Content */}
      <div className={styles['success-content']}>
        {/* Congratulations Section */}
        <div className={styles['congratulations-section']}>
          <div className={styles['party-emojis']}>
            <span className={`${styles['party-emoji']} ${styles.left}`}>🎉</span>
            <span className={`${styles['party-emoji']} ${styles.right}`}>🎉</span>
          </div>
          <h1 className={styles['congratulations-title']}>Congratulations!!!</h1>
          <p className={styles['congratulations-subtitle']}>
            Your event ticket has been created
            <span className={styles.sparkles}>✨</span>
          </p>
        </div>

        {/* Event Details Card */}
        <div className={styles['event-details-card']}>
          <div className={styles['detail-row']}>
            <span className={styles['detail-label']}>Event Host</span>
            <span className={styles['detail-value']}>{eventData.eventHost}</span>
          </div>

          <div className={styles['detail-row']}>
            <span className={styles['detail-label']}>Price</span>
            <span className={styles['detail-value']}>{eventData.price}</span>
          </div>

          <div className={styles['detail-row']}>
            <span className={styles['detail-label']}>Event Title</span>
            <span className={styles['detail-value']}>{eventData.eventTitle}</span>
          </div>

          <div className={styles['detail-row']}>
            <span className={styles['detail-label']}>Ticket</span>
            <span className={styles['detail-value']}>{eventData.tickets}</span>
          </div>

          <div className={styles['detail-row']}>
            <span className={styles['detail-label']}>Schedule and Location</span>
            <span className={`${styles['detail-value']} ${styles['location-text']}`}>{eventData.location}</span>
          </div>

          <div className={styles['detail-row']}>
            <span className={styles['detail-label']}>Creator Fee</span>
            <span className={styles['detail-value']}>{eventData.creatorFee}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles['success-actions']}>
          <button className={styles['complete-button']} onClick={handleComplete}>
            Complete
          </button>
          <button className={styles['share-button']} onClick={handleShare}>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
