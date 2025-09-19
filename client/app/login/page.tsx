'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePiNetwork } from '../hooks/usePiNetwork';
import '@/styles/login.css';
import '@/styles/mobileview/login.css';

export default function LoginPage() {
  const router = useRouter();
  const { authenticate, isLoading, error, isSDKReady } = usePiNetwork();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleBack = () => {
    router.back();
  };

  const handlePiNetworkAuth = async () => {
    try {
      setAuthError(null);
      
      // Authenticate with Pi Network
      await authenticate();
      
      // Store user data and token (this is already handled in the usePiNetwork hook)
      const { UserStorage } = await import('../utils/userStorage');
      UserStorage.setHasVisited();
      
      // Redirect to events page
      router.push('/events');
      
    } catch (error) {
      console.error('Authentication failed:', error);
      setAuthError('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="login-container">
      {/* Header with back button */}
      <div className="header">
        <button
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
      </div>

      {/* Main content */}
      <div className="content">
        {/* Profile section */}
        <div className="profile-section">
          <div className="avatar-container">
            <img 
              src="/Avatar.png" 
              alt="Profile avatar" 
              className="avatar"
            />
            {/* <div className="verified-badge">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M9 12L11 14L15 10" 
                  stroke="white" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div> */}
          </div>
          
          <h1 className="welcome-title">Welcome Back!</h1>
          <div className="username-display">woodylightyearx</div>
        </div>

        {/* Authentication section */}
        <div className="auth-section">
          <div className="auth-card">
            <button 
              className={`pi-auth-button ${isLoading ? 'loading' : ''} ${!isSDKReady ? 'disabled' : ''}`}
              onClick={handlePiNetworkAuth}
              disabled={isLoading || !isSDKReady}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Authenticating...
                </>
              ) : !isSDKReady ? (
                'Loading Pi SDK...'
              ) : (
                'Authenticate with Pi Network'
              )}
            </button>
            
            {/* Error message */}
            {(error || authError) && (
              <div className="auth-error">
                {error || authError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}