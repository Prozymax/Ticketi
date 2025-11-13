'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { apiService } from '@/app/lib/api';
import { UserStorage } from '@/app/utils/userStorage';
import styles from '@/styles/success.module.css';

interface TicketData {
  eventTitle: string;
  price: string;
  eventType: string;
  tickets: string;
  ticketSerialNumber: string;
  location: string;
  totalPayment: string;
}

function TicketSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);

  const paymentId = searchParams.get("paymentId");
  const eventId = searchParams.get("eventId");
  const purchaseId = searchParams.get("purchaseId");
  const quantity = searchParams.get("quantity") || "1";
  const ticketType = searchParams.get("ticketType") || "Regular";

  useEffect(() => {
    const loadTicketData = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
        const eventResponse = await apiService.getEventById(eventId || '');
        
        if (eventResponse.success && eventResponse.data) {
          const event = eventResponse.data;
          const userData = UserStorage.getUserData();
          
          setTicketData({
            eventTitle: event.title,
            price: `${event.ticketPrice}π`,
            eventType: event.title,
            tickets: `${quantity} ${ticketType} Ticket${parseInt(quantity) > 1 ? 's' : ''}`,
            ticketSerialNumber: purchaseId || paymentId || 'N/A',
            location: event.location,
            totalPayment: `${(parseFloat(event.ticketPrice) * parseInt(quantity) + 0.6).toFixed(2)}π`
          });
        }
      } catch (error) {
        console.error('Error loading ticket data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      loadTicketData();
    }
  }, [eventId, paymentId, purchaseId, quantity, ticketType]);

  const handleComplete = () => {
    router.push('/event-hub');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: ticketData?.eventTitle || 'My Ticket',
        text: `I just bought a ticket for ${ticketData?.eventTitle}!`,
        url: window.location.origin
      });
    } else {
      navigator.clipboard.writeText(window.location.origin);
      alert('Event link copied to clipboard!');
    }
  };

  if (loading || !ticketData) {
    return (
      <div className={styles['success-container']}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['success-container']}>
      {/* Header */}
      <div className={styles['success-logo']}>
        <h1 className={styles['logo-text']}>
          Ticket<span className={styles['logo-accent']}>i</span>
        </h1>
      </div>

      {/* Success Content */}
      <div className={styles['success-content']}>
        {/* Congratulations Section */}
        <div className={styles['congratulations-section']}>
          <div className={styles['celebration-icons']}>
            {/* Celebration icons */}
          </div>
          <h1 className={styles['congratulations-title']}>Ticket Bought!!!</h1>
          <p className={styles['congratulations-text']}>
            Congratulations, you just booked a seat for this event!
          </p>
        </div>

        {/* Ticket Details Card */}
        <div className={styles['details-card']}>
          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Event Host</span>
            <span className={styles['detail-value']}>{ticketData.eventTitle}</span>
          </div>

          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Price</span>
            <span className={styles['detail-value']}>{ticketData.price}</span>
          </div>

          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Event Title</span>
            <span className={styles['detail-value']}>{ticketData.eventType}</span>
          </div>

          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Ticket</span>
            <span className={styles['detail-value']}>{ticketData.tickets}</span>
          </div>

          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Ticket Serial Number</span>
            <span className={styles['detail-value']}>{ticketData.ticketSerialNumber}</span>
          </div>

          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Schedule and Location</span>
            <span className={styles['detail-value']}>{ticketData.location}</span>
          </div>

          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>Total Payment</span>
            <span className={styles['detail-value']}>{ticketData.totalPayment}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles['action-buttons']}>
          <button type="button" className={styles['complete-button']} onClick={handleComplete}>
            Complete
          </button>
          <button type="button" className={styles['share-button']} onClick={handleShare}>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className={styles['success-container']}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    </div>
  );
}

export default function TicketSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TicketSuccessContent />
    </Suspense>
  );
}
