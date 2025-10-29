"use client";

import {useState, useEffect} from "react";
import {useRouter, useParams} from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Eye,
  DollarSign,
} from "lucide-react";
import {eventAPI, followAPI} from "@/app/utils/api";
import TicketModal from "@/app/buy-ticket/ticket/ticket";
import "@/styles/event-details.css";
import "@/styles/mobileview/event-details.css";
import Link from "next/link";

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
  organizer?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
  };
}

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState<DatabaseEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Add class to body to hide bottom navigation
  useEffect(() => {
    document.body.classList.add('hide-bottom-nav');
    return () => {
      document.body.classList.remove('hide-bottom-nav');
    };
  }, []);

  // Fetch real event data from API
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const eventId = params.detail as string;
        console.log("Fetching event details for ID:", eventId);

        const response = await eventAPI.getEventById(eventId);

        if (response.success && response.data) {
          console.log("Event data received:", response.data);
          setEvent(response.data);
        } else {
          console.error("Failed to fetch event:", response.error);
          setError(response.error || "Event not found");
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load event"
        );
      } finally {
        setLoading(false);
      }
    };

    if (params.detail) {
      fetchEventDetails();
    }
  }, [params.detail]);

  // Check follow status when event is loaded
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (event?.organizer?.id) {
        try {
          const response = await followAPI.checkFollowStatus(event.organizer.id);
          if (response.success && response.data) {
            setIsFollowing(response.data.isFollowing);
          }
        } catch (error) {
          console.error("Error checking follow status:", error);
        }
      }
    };

    checkFollowStatus();
  }, [event?.organizer?.id]);

  const handleBack = () => {
    router.back();
  };

  const handleFollow = async () => {
    if (!event?.organizer?.id) return;

    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        // Unfollow
        const response = await followAPI.unfollowUser(event.organizer.id);
        if (response.success) {
          setIsFollowing(false);
          console.log("Successfully unfollowed user");
        } else {
          console.error("Failed to unfollow:", response.error);
        }
      } else {
        // Follow
        const response = await followAPI.followUser(event.organizer.id);
        if (response.success) {
          setIsFollowing(true);
          console.log("Successfully followed user");
        } else {
          console.error("Failed to follow:", response.error);
        }
      }
    } catch (error) {
      console.error("Error in follow/unfollow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBuyTicket = () => {
    // Open ticket modal
    console.log("Opening ticket modal for event:", event);
    console.log("Available tickets:", availableTickets);
    setIsTicketModalOpen(true);
  };

  const closeTicketModal = () => {
    setIsTicketModalOpen(false);
  };

  // Check if tickets are available
  const availableTickets = event ? event.regularTickets - event.ticketsSold : 0;
  const isTicketAvailable = availableTickets > 0 && event?.status === 'published';

  // Helper functions to format data
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateDaysUntil = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  if (loading) {
    return (
      <div className="event-details-container loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="event-details-container error">
        <div className="error-message">
          <h3>Error Loading Event</h3>
          <p>{error || "Event not found"}</p>
          <button type="button" onClick={() => router.back()}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-details-container">
      {/* Header */}
      <header className="event-header">
        <button title="back" className="back-button" onClick={handleBack}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="header-title">Event Details</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Event Image */}
      <div className="event-image-container">
        <div className="event-image">
          <img
            src={event.eventImage || "/events/events_sample.jpg"}
            alt={event.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/events/events_sample.jpg";
            }}
          />
          <div className="event-badge">
            <span className="badge-icon">📅</span>
            <span className="badge-text">
              in {calculateDaysUntil(event.startDate)} days
            </span>
          </div>
        </div>
      </div>

      {/* Event Content */}
      <div className="event-content">
        {/* Host Section */}
        {event.organizer && (
          <div className="host-section">
            <div className="host-info">
              <a href={`https://profiles.pinet.com/profiles/${event.organizer.username}`}>
              <div className="host-avatar">
                <img
                  src={event.organizer.profileImage || "/Avatar.png"}
                  alt={event.organizer.username}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/Avatar.png";
                  }}
                />
                <div className="verified-badge">✓</div>
              </div></a>
              <div className="host-details">
                <span className="host-label">Event Organizer</span>
                <span className="host-name">
                  {event.organizer.firstName && event.organizer.lastName
                    ? `${event.organizer.firstName} ${event.organizer.lastName}`
                    : event.organizer.username}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={`follow-button ${isFollowing ? "following" : ""} ${followLoading ? "loading" : ""}`}
              onClick={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? "..." : isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        )}

        {/* Event Title */}
        <h2 className="event-detail-title">{event.title}</h2>

        {/* Event Info */}
        <div className="event-info">
          <div className="info-item">
            <MapPin size={20} className="info-icon" />
            <span className="info-text">{event.location}</span>
          </div>
          <div className="info-item">
            <Calendar size={20} className="info-icon" />
            <span className="info-text">
              {formatDate(event.startDate)}
              {new Date(event.startDate).toDateString() !==
                new Date(event.endDate).toDateString() &&
                ` - ${formatDate(event.endDate)}`}
            </span>
          </div>
          <div className="info-item">
            <Clock size={20} className="info-icon" />
            <span className="info-text">
              {formatTime(event.startDate)} - {formatTime(event.endDate)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="event-stats">
          <div className="stat-item">
            <Users className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Tickets Sold</span>
              <span className="stat-value">
                {event.ticketsSold}
              </span>
            </div>
          </div>
          <div className="stat-item">
            <DollarSign className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Price</span>
              <span className="stat-value">{event.ticketPrice}π</span>
            </div>
          </div>
          <div className="stat-item">
            <Eye className="stat-icon" />
            <div className="stat-content">
              <span className="stat-label">Available</span>
              <span className="stat-value">
                {event.regularTickets - event.ticketsSold}
              </span>
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
        <button 
          disabled={!isTicketAvailable} 
          className={`buy-ticket-button ${!isTicketAvailable ? 'disabled' : ''}`} 
          onClick={handleBuyTicket}
        >
          {availableTickets === 0 ? 'Sold Out' : 
           event?.status !== 'published' ? 'Not Available' : 
           'Buy Ticket'}
        </button>
      </div>

      {/* Ticket Modal */}
      {event && (
        <TicketModal
          isOpen={isTicketModalOpen}
          onClose={closeTicketModal}
          event={{
            id: event.id,
            title: event.title,
            image: event.eventImage || "/events/events_sample.jpg",
            ticketPrice: parseFloat(event.ticketPrice.toString().replace(/[^\d.]/g, '')),
            availableTickets: availableTickets,
          }}
        />
      )}
    </div>
  );
}
