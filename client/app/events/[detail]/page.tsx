'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Clock, Users, Eye, DollarSign } from 'lucide-react';
import '@/styles/event-details.css';
import '@/styles/mobileview/event-details.css';

interface EventDetails {
  id: string;
  title: string;
  description: string;
  location: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  imageUrl: string;
  host: {
    id: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  stats: {
    ticketsSold: number;
    price: number;
    views: number;
  };
  daysUntilEvent: number;
  tickets: Array<{
    id: string;
    type: string;
    price: number;
    available: number;
    total: number;
  }>;
}

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockEvent: EventDetails = {
      id: params.detail as string,
      title: "Token2049 Singapore",
      description: "A music festival in Sydney, Australia, is set to feature local artists in a series of live performances. The festival, called 'Music in the Park,' will showcase the work of up-and-coming musicians in the area.",
      location: "Marina Bay Sands, 10 Bayfront Avenue, Singapore 018956, SG",
      eventDate: "October 11th & 2nd",
      startTime: "10am",
      endTime: "6pm",
      imageUrl: "/events/event.png",
      host: {
        id: "1",
        username: "woodylightyearx",
        avatar: "/Avatar.png",
        isVerified: true
      },
      stats: {
        ticketsSold: 390,
        price: 12.998,
        views: 13803
      },
      daysUntilEvent: 3,
      tickets: [
        { id: "1", type: "General Admission", price: 12.998, available: 150, total: 500 },
        { id: "2", type: "VIP", price: 25.5, available: 25, total: 100 }
      ]
    };

    setTimeout(() => {
      setEvent(mockEvent);
      setLoading(false);
    }, 500);
  }, [params.detail]);

  const handleBack = () => {
    router.back();
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleBuyTicket = () => {
    // Navigate to ticket purchase
    router.push(`/events/${params.detail}/purchase`);
  };

  if (loading) {
    return (
      <div className="event-details-container loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-details-container error">
        <div className="error-message">Event not found</div>
      </div>
    );
  }

  return (
    <div className="event-details-container">
      {/* Header */}
      <header className="event-header">
        <button title='back' className="back-button" onClick={handleBack}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="header-title">Event Details</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Event Image */}
      <div className="event-image-container">
        <div className="event-image">
          <img src={event.imageUrl} alt={event.title} />
          <div className="event-badge">
            <span className="badge-icon">📅</span>
            <span className="badge-text">in {event.daysUntilEvent} days</span>
          </div>
        </div>
      </div>

      {/* Event Content */}
      <div className="event-content">
        {/* Host Section */}
        <div className="host-section">
          <div className="host-info">
            <div className="host-avatar">
              <img src={event.host.avatar} alt={event.host.username} />
              {event.host.isVerified && (
                <div className="verified-badge">✓</div>
              )}
            </div>
            <div className="host-details">
              <span className="host-label">Event Host</span>
              <span className="host-name">{event.host.username}</span>
            </div>
          </div>
          <button 
            className={`follow-button ${isFollowing ? 'following' : ''}`}
            onClick={handleFollow}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Event Title */}
        <h2 className="event-title">{event.title}</h2>

        {/* Event Info */}
        <div className="event-info">
          <div className="info-item">
            <MapPin size={20} className="info-icon" />
            <span className="info-text">{event.location}</span>
          </div>
          <div className="info-item">
            <Calendar size={20} className="info-icon" />
            <span className="info-text">Date: {event.eventDate}</span>
          </div>
          <div className="info-item">
            <Clock size={20} className="info-icon" />
            <span className="info-text">{event.startTime} - {event.endTime} Daily UTC</span>
          </div>
        </div>

        {/* Stats */}
        <div className="event-stats">
          <div className="stat-item">
            <Users className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Tickets Sold</span>
              <span className="stat-value">{event.stats.ticketsSold}</span>
            </div>
          </div>
          <div className="stat-item">
            <DollarSign className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Price</span>
              <span className="stat-value">{event.stats.price}π</span>
            </div>
          </div>
          <div className="stat-item">
            <Eye className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Views</span>
              <span className="stat-value">{event.stats.views.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* About Event */}
        <div className="about-section">
          <h3 className="about-title">About Event</h3>
          <p className="about-text">{event.description}</p>
        </div>
      </div>

      {/* Buy Ticket Button */}
      <div className="buy-ticket-container">
        <button className="buy-ticket-button" onClick={handleBuyTicket}>
          Buy Ticket
        </button>
      </div>
    </div>
  );
}