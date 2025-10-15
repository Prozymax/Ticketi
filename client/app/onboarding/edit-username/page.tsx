'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import '@/styles/edit-username.css';
import '@/styles/mobileview/edit-username.css';

export default function EditUsernamePage() {
  const [username, setUsername] = useState('pioneer');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load username from localStorage on client side only
  useEffect(() => {
    const storedUsername = localStorage.getItem("pi_username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
    setIsLoading(false);
  }, []);

  const handleContinue = () => {
    // Save username to localStorage
    localStorage.setItem("pi_username", username);
    console.log('Username updated:', username);
    router.push('/onboarding/finalizing-profile');
  };

  const handleBack = () => {
    router.back();
  };

  // Show loading state while checking localStorage
  if (isLoading) {
    return (
      <div className="edit-username-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-username-container">
      {/* Header with back button and progress indicator */}
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
      </div>

      <main>
        <div className="progress-indicator">
          <div className="progress-bar"></div>
          <div className="progress-dot"></div>
        </div>

        {/* Main content */}
        <div className="content">
          {/* Profile section */}
          <div className="profile-section">
            <div className="avatar-container">
              <Image
                width={90}
                height={90}
                src="/Avatar.png"
                alt="user-male-circle--v2"
              />
              <div className="verified-badge">
                <Image
                  width={80}
                  height={80}
                  src="https://img.icons8.com/fluency/48/instagram-verification-badge.png"
                  alt="instagram-verification-badge"
                />
              </div>
            </div>
            <div className="username-display">{username}</div>
          </div>

          {/* Title and description */}
          <div className="title-section">
            <h1 className="title">Personalize with Brand Name</h1>
            <p className="description">
              This is what your event ticket will be recognized with whenever
              you create a ticket a
            </p>
          </div>

          {/* Username input */}
          <div className="input-section">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="username-input"
              placeholder="Enter username"
            />
          </div>

          {/* Continue button */}
          <button type="button" className="continue-button" onClick={handleContinue}>
            Continue
          </button>

          {/* Footer links */}
          <div className="footer-links">
            <p>
              <span className="footer-text">
                Don&apos;t know a brandname? Create with{" "}
              </span>
              <span className="pi-link">Pi Domain</span>
              <span className="footer-text"> and secure your brand.</span>
            </p>
            <div className="mint-link">Mint with Pi Domain</div>
          </div>
        </div>
      </main>
    </div>
  );
}