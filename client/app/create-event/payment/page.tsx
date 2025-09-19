'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePiNetwork } from '@/app/hooks/usePiNetwork';
import '@/styles/payment.css';
import '@/styles/create-event.css';

export default function PaymentPage() {
  const router = useRouter();
//   const { createPayment, isLoading, error } = usePiNetwork();
    const isLoading = false;
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Mock event data - in real app, this would come from state/props
  const eventData = {
    title: 'Token2049 Singapore',
    ticketType: 'Regular',
    ticketCount: 100,
    eventCreationFee: 0.5,
    blockchainFee: 0.1,
    total: 0.6
  };

  const handleBack = () => {
    router.back();
  };

  const handleConfirmPayment = async () => {
    try {
      setPaymentError(null);
      
      // Create Pi Network payment
    //   const paymentId = await createPayment(
    //     eventData.total,
    //     `Event creation payment for ${eventData.title}`,
    //     {
    //       eventTitle: eventData.title,
    //       ticketType: eventData.ticketType,
    //       ticketCount: eventData.ticketCount
    //     }
    //   );
      
      console.log('Payment created');
      
      // Navigate to success page or back to events
      router.push('/create-event/success');
      
    } catch (error) {
      console.error('Payment failed:', error);
      setPaymentError('Payment failed. Please try again.');
    }
  };

  return (
    <div className="create-event-container">
      {/* Header */}
      <div className="header">
        <button
          type="button"
          title="back-button"
          className="back-button"
          onClick={handleBack}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 18L9 12L15 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="page-title">Create Event</h1>
        <div className="header-spacer"></div>
      </div>

      {/* Payment Section */}
      <div className="payment-section">
        <h2 className="payment-title">Make payment</h2>
        
        {/* Payment Card */}
        <div className="payment-card">
          {/* Event Title */}
          <div className="event-title-section">
            <h3 className="event-title">{eventData.title}</h3>
          </div>

          {/* Amount Display */}
          <div className="amount-section">
            <div className="main-amount">0.60π</div>
            <div className="usd-equivalent">≈ 0.010USDT</div>
          </div>

          {/* Event Details */}
          <div className="event-details">
            <div className="detail-row">
              <span className="detail-label">Ticket . {eventData.ticketType}</span>
              <span className="detail-value">{eventData.ticketCount}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Event Title</span>
              <span className="detail-value">{eventData.title}</span>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="cost-breakdown">
            <div className="breakdown-row">
              <span className="breakdown-label">For event creation</span>
              <span className="breakdown-value">{eventData.eventCreationFee}π</span>
            </div>
            <div className="breakdown-row">
              <span className="breakdown-label">Blockchain fee</span>
              <span className="breakdown-value">{eventData.blockchainFee}π</span>
            </div>
            <div className="breakdown-row total-row">
              <span className="breakdown-label">Total</span>
              <span className="breakdown-value">{eventData.total}π</span>
            </div>
          </div>

          {/* Confirm Payment Button */}
          <div className="payment-button-section">
            <p 
              className={`confirm-payment-button ${isLoading ? 'loading' : ''}`}
              onClick={!isLoading ? handleConfirmPayment : undefined}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Processing...
                </>
              ) : (
                'Confirm to Pay'
              )}
            </p>
            
            {/* Error message */}
            {/* {(error || paymentError) && (
              <div className="payment-error">
                {error || paymentError}
              </div>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
}