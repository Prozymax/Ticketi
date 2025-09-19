'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import '@/styles/profile.css';
import '@/styles/mobileview/profile.css';

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState({
    username: 'Woodylightyearx',
    followers: '41,056',
    isVerified: true,
    avatar: '/Avatar.png'
  });

  useEffect(() => {
    // Load user data from storage
    const loadUserData = async () => {
      try {
        const { UserStorage } = await import('../utils/userStorage');
        const storedUserData = UserStorage.getUserData();
        if (storedUserData) {
          setUserData(prev => ({
            ...prev,
            username: storedUserData.username || prev.username
          }));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleNotification = () => {
    router.push('/profile/notifications');
  };

  const handleCurrency = () => {
    router.push('/profile/currency');
  };

  const handleDisplayLanguage = () => {
    router.push('/profile/language');
  };

  const handleChangeProfilePicture = () => {
    router.push('/profile/change-picture');
  };

  const handleTicketStyle = () => {
    router.push('/profile/ticket-style');
  };

  const handleInviteFriends = () => {
    router.push('/profile/invite-friends');
  };

  const handleFollowers = () => {
    router.push('/profile/followers');
  };

  const handleLeaveApp = () => {
    // Show confirmation dialog or handle app exit
    if (confirm('Are you sure you want to leave the app?')) {
      // Clear user data and redirect to splash
      import('../utils/userStorage').then(({ UserStorage }) => {
        UserStorage.clearUserData();
        router.push('/');
      });
    }
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <h1 className="profile-title">Your Account</h1>
      </div>

      {/* User Info Section */}
      <div className="user-info-section">
        <div className="user-profile">
          <div className="avatar-container">
            <img 
              src={userData.avatar} 
              alt="Profile avatar" 
              className="profile-avatar"
            />
          </div>
          <div className="user-details">
            <h2 className="username">{userData.username}</h2>
            {userData.isVerified && (
              <div className="verification-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M9 12L11 14L15 10" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Verified with Pi Domain</span>
              </div>
            )}
          </div>
          <div className="followers-info">
            <div className="followers-label">Follows</div>
            <div className="followers-count">{userData.followers}</div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="profile-section">
        <h3 className="section-title">Preference</h3>
        
        <div className="menu-item" onClick={handleNotification}>
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="menu-text">Notification</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="menu-item" onClick={handleCurrency}>
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="menu-text">Currency</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="menu-item" onClick={handleDisplayLanguage}>
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 8l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 14l6-6 2-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 5h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 2h1l8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="menu-text">Display Language</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="profile-section">
        <h3 className="section-title">Settings</h3>
        
        <div className="menu-item" onClick={handleChangeProfilePicture}>
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="menu-text">Change Profile Picture</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="menu-item" onClick={handleTicketStyle}>
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 5v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 11v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M15 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="menu-text">Ticket Style</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="menu-item" onClick={handleInviteFriends}>
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="menu-text">Invite Friends</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="menu-item" onClick={handleFollowers}>
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="menu-text">Followers</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Leave App Button */}
      <div className="leave-app-section">
        <div className="leave-app-button" onClick={handleLeaveApp}>
          <div className="leave-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="leave-text">Leave App</span>
        </div>
      </div>
    </div>
  );
}