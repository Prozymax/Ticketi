'use client';

import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import styles from '@/styles/empty-events.module.css';

const EmptyEvents = () => {
  const router = useRouter();

  const handleCreateEvent = () => {
    router.push('/create-event');
  };

  return (
    <div className={styles['empty-events-content']}>
      {/* Empty State */}
      <div className={styles['empty-state']}>
        <div className={styles['empty-icon']}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path
              d="M20 15C18.3431 15 17 16.3431 17 18V62C17 63.6569 18.3431 65 20 65H60C61.6569 65 63 63.6569 63 62V18C63 16.3431 61.6569 15 60 15H20Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d="M25 25H35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M25 35H55"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M25 45H45"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="50"
              cy="50"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M46 50L48 52L54 46"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className={styles['empty-content']}>
          <h2 className={styles['empty-title']}>Here is empty</h2>
          <p className={styles['empty-description']}>You have not created an event</p>
        </div>

        <button className={styles['create-myevent-button']} onClick={handleCreateEvent}>
          Create Event Ticket
        </button>
      </div>
    </div>
  );
};

export default EmptyEvents;

