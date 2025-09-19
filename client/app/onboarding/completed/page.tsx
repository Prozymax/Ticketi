'use client';

import { useRouter } from 'next/navigation';
import '@/styles/completed.css';
import '@/styles/mobileview/completed.css';

export default function CompletedPage() {
  const router = useRouter();

  const handleExploreTicketi = () => {
    // Mark onboarding as completed and user as having visited
    import('../../utils/userStorage').then(({ UserStorage }) => {
      UserStorage.setOnboardingCompleted();
      UserStorage.setHasVisited();
    });
    
    // Navigate to login page for authentication
    router.push('/login');
  };

  return (
    <div className="completed-container">
      <div className="content">
        {/* Success icon */}
        <div className="success-icon-container">
          <div className="success-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path 
                d="M9 12L11 14L15 10" 
                stroke="white" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* Title and subtitle */}
        <div className="text-content">
          <h1 className="title">Account Created Successfully</h1>
          <p className="subtitle">Start creating, exploring, visiting, and engaging</p>
        </div>

        {/* Explore button */}
        <button className="explore-button" onClick={handleExploreTicketi}>
          Explore Ticketi
        </button>
      </div>
    </div>
  );
}