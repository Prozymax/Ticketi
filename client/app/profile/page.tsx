"use client";

import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {useProfile} from "../hooks/useProfile";
import {usePiNetwork} from "../hooks/usePiNetwork";
import {formatError} from "../utils/errorHandler";
import ErrorDisplay from "../components/ErrorDisplay";
import Image from "next/image";
import "@/styles/profile-new.css";

export default function ProfilePage() {
  const router = useRouter();
  const {profile, stats, isLoading, error, fetchStats} = useProfile();
  const {logout} = usePiNetwork();

  // Fetch stats when profile is loaded
  useEffect(() => {
    if (profile && !stats) {
      fetchStats();
    }
  }, [profile, stats, fetchStats]);



  // Get avatar URL
  const getAvatarUrl = () => {
    return profile?.profileImage || "/Avatar.png";
  };



  const handleNotification = () => {
    router.push("/profile/notifications");
  };

  const handleCurrency = () => {
    router.push("/profile/currency");
  };

  const handleDisplayLanguage = () => {
    router.push("/profile/language");
  };
  const handleChangeProfilePicture = () => {
    router.push("/profile/change-picture");
  };

  const handleTicketStyle = () => {
    router.push("/profile/ticket-style");
  };

  const handleInviteFriends = () => {
    router.push("/profile/invite-friends");
  };

  const handleFollowers = () => {
    router.push("/profile/followers");
  };

  const handleLeaveApp = async () => {
    // Show confirmation dialog or handle app exit
    if (confirm("Are you sure you want to leave the app?")) {
      try {
        await logout();
        router.push("/");
      } catch (error) {
        console.error("Logout error:", error);
        // Still redirect even if logout fails
        router.push("/");
      }
    }
  };



  // Loading state
  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <h1 className="profile-title">Your Account</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <h1 className="profile-title">Your Account</h1>
        </div>
        <div className="error-container">
          <ErrorDisplay
            error={error}
            title="Profile Loading Error"
            showDetails={true}
            onRetry={() => window.location.reload()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <h1 className="profile-title">Your Account</h1>
      </div>

      {/* User Profile Section */}
      <div className="user-profile-section">
        <div className="profile-avatar-container">
          <Image
            src={getAvatarUrl()}
            alt="Profile avatar"
            width={60}
            height={60}
            className="profile-page-avatar"
          />
        </div>
        
        <div className="user-info">
          <h2 className="username">
            {profile?.username || 'piooner_1234'}
          </h2>
          
          {profile?.isVerified && (
            <div className="verification-badge">
              <Image src='/icons/pi-logo.png' width={18} height={18} alt='pi-logo' />
              <span className="verification-text">Verified with Pi Domain</span>
            </div>
          )}
        </div>
        
        <div className="follows-section">
          <div className="follows-label">Follows</div>
          <div className="follows-count">
            {profile?.followersCount || 0}
          </div>
        </div>
      </div>

      {/* Preference Section */}
      <div className="profile-section">
        <h3 className="section-title">Preference</h3>

        <div onClick={handleNotification} className="menu-item">
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="menu-text">Notification</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* <div onClick={handleCurrency} className="menu-item">
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="menu-text">Currency</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div> */}

        <div onClick={handleDisplayLanguage} className="menu-item">
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 8l6 6" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 14l6-6 2-3" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 5h12" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 2h1l8 18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="menu-text">Display Language</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="profile-section">
        <h3 className="section-title">Settings</h3>

        <div onClick={handleChangeProfilePicture} className="menu-item">
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="menu-text">Change Profile Picture</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div onClick={handleTicketStyle} className="menu-item">
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 5v2" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 11v2" stroke="currentColor" strokeWidth="2"/>
              <path d="M15 17v2" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="menu-text">Ticket Style</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div onClick={handleInviteFriends} className="menu-item">
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <line x1="19" y1="8" x2="19" y2="14" stroke="currentColor" strokeWidth="2"/>
              <line x1="22" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="menu-text">Invite Friends</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div onClick={handleFollowers} className="menu-item">
          <div className="menu-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>
          <span className="menu-text">Followers</span>
          <div className="menu-arrow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Leave App Button */}
      <div onClick={handleLeaveApp} className="leave-app-item">
        <div className="leave-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2"/>
            <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2"/>
            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <span className="leave-text">Leave App</span>
      </div>
    </div>
  );
}
