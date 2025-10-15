'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import '@/styles/empty-events.css';

const EmptyTickets = () => {
  const router = useRouter();

  const handleBrowseEvents = () => {
    router.push('/events');
  };

  const handleCreateEvent = () => {
    router.push('/create-event');
  };

  return (
    <div className="empty-tickets-content">
      {/* Empty State */}
      <div className="empty-state">
        <div className="empty-icon">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path
              d="M15 25C15 21.6863 17.6863 19 21 19H59C62.3137 19 65 21.6863 65 25V55C65 58.3137 62.3137 61 59 61H21C17.6863 61 15 58.3137 15 55V25Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M15 35H65"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M25 45H35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M45 45H55"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="30"
              cy="30"
              r="3"
              fill="currentColor"
            />
            <circle
              cx="50"
              cy="30"
              r="3"
              fill="currentColor"
            />
            <path
              d="M55 19V15C55 13.8954 54.1046 13 53 13H27C25.8954 13 25 13.8954 25 15V19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="empty-content">
          <h2 className="empty-title">Here is empty</h2>
          <p className="empty-description">You have not bought any tickets</p>
        </div>

        <button className="create-myevent-button" onClick={handleBrowseEvents}>
          Buy Tickets
        </button>
      </div>
    </div>
  );
};

export default EmptyTickets;