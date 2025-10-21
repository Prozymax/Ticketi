"use client";

import {useRouter} from "next/navigation";
import {useState, useEffect} from "react";
import {usePiNetwork} from "../hooks/usePiNetwork";
import {apiService} from "../lib/api";
import {formatError, logError} from "../utils/errorHandler";
import ErrorDisplay from "../components/ErrorDisplay";
import Image from "next/image";
import "@/styles/login.css";
import "@/styles/mobileview/login.css";

export default function LoginPage() {
  const router = useRouter();
  const {authenticate, isLoading, error, isSDKReady, user} = usePiNetwork();
  const [authError, setAuthError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [isCheckingUser, setIsCheckingUser] = useState<boolean>(false);
  const [showUsernameInput, setShowUsernameInput] = useState<boolean>(true);
  const [userVerificationStatus, setUserVerificationStatus] = useState<{
    isVerified: boolean;
    username: string;
  } | null>(null);

  // Load stored username and check verification status on mount
  useEffect(() => {
    const loadStoredUsername = async () => {
      // First check if user is already authenticated
      if (user) {
        setUserVerificationStatus({
          isVerified: user.isVerified,
          username: user.username,
        });
        setUsername(user.username);
        setShowUsernameInput(false);
        return;
      }

      // If not authenticated, check for stored username (client-side only)
      if (typeof window !== 'undefined') {
        const storedUsername = localStorage.getItem("pi_username");
      if (storedUsername) {
        console.log("Found stored username:", storedUsername);
        setUsername(storedUsername);

        // Automatically verify the stored username
        try {
          setIsCheckingUser(true);
          const response = await apiService.confirmUserVerification(
            storedUsername
          );

          if (!response.error && response.verified) {
            // User exists and is verified
            setUserVerificationStatus({
              isVerified: response.user.is_verified,
              username: response.user.username,
            });
            setShowUsernameInput(false);
            console.log("Stored username verified successfully");
          } else {
            // User doesn't exist or is not verified - show input for manual entry
            console.log("Stored username not verified, showing input");
            router.push('/onboarding/authenticate')
            setShowUsernameInput(true);
            setUserVerificationStatus(null);
          }
        } catch (error) {
          logError("Username Verification", error);
          // On error, show input for manual entry
          setShowUsernameInput(true);
          setUserVerificationStatus(null);
        } finally {
          setIsCheckingUser(false);
        }
      } else {
        // No stored username, show input
        setShowUsernameInput(true);
      }
      } else {
        // Server-side rendering, show input
        setShowUsernameInput(true);
      }
    };

    loadStoredUsername();
  }, [user]);

  // Store username when user data becomes available after authentication
  useEffect(() => {
    if (typeof window !== 'undefined' && user?.username && !localStorage.getItem("pi_username")) {
      localStorage.setItem("pi_username", user.username);
      console.log(
        "Username stored in localStorage after login:",
        user.username
      );
    }
  }, [user]);

  const handleBack = () => {
    router.back();
  };

  const handlePiNetworkAuth = async () => {
    try {
      setAuthError(null);

      // Authenticate with Pi Network
      const authResult = await authenticate();

      // Store user data and token (this is already handled in the usePiNetwork hook)
      const {UserStorage} = await import("../utils/userStorage");
      UserStorage.setHasVisited();

      // Ensure username is stored after successful authentication
      // The usePiNetwork hook already stores it, but let's be explicit
      if (authResult && authResult?.username) {
        localStorage.setItem("pi_username", authResult.username);
        console.log(
          "Username stored in localStorage after login auth:",
          authResult?.username
        );
        router.push("/events");
      }

      // Redirect to events page
    } catch (error) {
      const errorMessage = formatError(error);
      logError("Pi Network Authentication", error);
      setAuthError(errorMessage);

      // If authentication fails, redirect to onboarding
      router.push("/onboarding/authenticate");
    }
  };

  return (
    <div className="login-container">
      {/* Header with back button */}

      {/* Main content */}
      <div className="content">
        {/* Profile section */}
        <div className="profile-section">
          <div className="avatar-container">
            <img src="/Avatar.png" alt="Profile avatar" className="avatar" />
            {user?.isVerified && (
              <div className="verified-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 12L11 14L15 10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>

          <h1 className="welcome-title">
            {user ? `Welcome Back, ${user.username}!` : "Welcome Back!"}
          </h1>
          {user && <div className="username-display">{user.username}</div>}
        </div>

        {/* Authentication section */}
        <div className="auth-section">
          <div className="auth-card">
            <button
              className={`pi-auth-button ${isLoading ? "loading" : ""} ${
                !isSDKReady ? "disabled" : ""
              }`}
              onClick={handlePiNetworkAuth}
              disabled={isLoading || !isSDKReady}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  Authenticating...
                </>
              ) : !isSDKReady ? (
                "Loading Pi SDK..."
              ) : (
                "Authenticate with Pi Network"
              )}
            </button>

            {/* Error message */}
            {(error || authError) && (
              <ErrorDisplay
                error={error || authError}
                title="Authentication Error"
                showDetails={true}
                onRetry={() => {
                  setAuthError(null);
                  handlePiNetworkAuth();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
