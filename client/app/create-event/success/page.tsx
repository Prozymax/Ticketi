'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [eventData, setEventData] = useState<EventData | null>(null);

  useEffect(() => {
    // Get event data from localStorage or state management
    const storedEventData = localStorage.getItem('eventData');
    if (storedEventData) {
      setEventData(JSON.parse(storedEventData));
    } else {
      // Fallback data for demo purposes
      setEventData({
        eventHost: 'Woodylightyearx',
        price: '10π',
        eventTitle: 'Token2049 Singapore',
        tickets: '100 Regular Tickets',
        location: 'Marina Bay Sands (10 Bayfront Avenue, Singapore, 018956, SG',
        creatorFee: '0.5π'
      });
    }
  }, []);

  const handleComplete = () => {
    // Clear event data and navigate to home
    localStorage.removeItem('eventData');
    router.push('/');
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