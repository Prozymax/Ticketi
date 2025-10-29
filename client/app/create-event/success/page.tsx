'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useEventCreation } from '@/app/contexts/EventCreationContext';
import { UserStorage } from '@/app/utils/userStorage';
import '@/styles/create-event.css'
import '@/styles/mobileview/create-event.css'

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
      <div className="create-event-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-event-container">
      {/* Header */}
      <div className="success-header">
        <div className="logo">
          <span className="logo-text">Ticket</span>
          <span className="logo-accent">i</span>
        </div>
      </div>

      {/* Success Content */}
      <div className="success-content">
        {/* Congratulations Section */}
        <div className="congratulations-section">
          <div className="party-emojis">
            <span className="party-emoji left">🎉</span>
            <span className="party-emoji right">🎉</span>
          </div>
          <h1 className="congratulations-title">Congratulations!!!</h1>
          <p className="congratulations-subtitle">
            Your event ticket has been created
            <span className="sparkles">✨</span>
          </p>
        </div>

        {/* Event Details Card */}
        <div className="event-details-card">
          <div className="detail-row">
            <span className="detail-label">Event Host</span>
            <span className="detail-value">{eventData.eventHost}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Price</span>
            <span className="detail-value">{eventData.price}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Event Title</span>
            <span className="detail-value">{eventData.eventTitle}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Ticket</span>
            <span className="detail-value">{eventData.tickets}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Schedule and Location</span>
            <span className="detail-value location-text">{eventData.location}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Creator Fee</span>
            <span className="detail-value">{eventData.creatorFee}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-actions">
          <button className="complete-button" onClick={handleComplete}>
            Complete
          </button>
          <button className="share-button" onClick={handleShare}>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}