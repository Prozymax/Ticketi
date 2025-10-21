"use client";
import {useState, useEffect} from "react";
import {slides} from "@/onboarding_data";
import "@/styles/onboarding.css";
import OnboardingSlide from "./components/page";
import {usePiNetwork} from "@/app/hooks/usePiNetwork";
import {useRouter} from "next/navigation";
import {formatError, logError} from "@/app/utils/errorHandler";
import ErrorDisplay from "@/app/components/ErrorDisplay";

export default function OnboardingCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const {authenticate, isLoading, error, isSDKReady, user} = usePiNetwork();
  const router = useRouter();

  // Store username when user data becomes available after authentication
  useEffect(() => {
    if (user?.username) {
      localStorage.setItem("pi_username", user.username);
      console.log(
        "Username stored in localStorage after onboarding auth:",
        user.username
      );
    }
  }, [user]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;

    const distance = touchStartX - touchEndX;

    if (distance > 50) {
      // swipe left → next
      nextSlide();
    } else if (distance < -50) {
      // swipe right → prev
      prevSlide();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handlePiAuthentication = async () => {
    try {
      setAuthError(null);
      console.log("Button clicked - Starting Pi Network authentication...");
      console.log("SDK Ready:", isSDKReady);
      console.log("Is Loading:", isLoading);
      console.log("Current Error:", error);

      // Authenticate with Pi Network and backend
      const authResult = await authenticate();
      console.log("Authentication response:", authResult);

      // Set first visit cache and user data
      const {UserStorage} = await import("../../utils/userStorage");
      UserStorage.setHasVisited();
      UserStorage.setOnboardingCompleted();
      console.log("User storage updated");

      // Navigate to edit-username page or events if user already exists
      if (authResult && authResult.username) {
        console.log("User has username, redirecting to events");
        router.push(
          "/onboarding/edit-username?username=" + authResult.username
        );
      } else {
        console.log("No username found, staying on current page");
        // Could redirect to a username setup page or handle accordingly
      }
    } catch (error) {
      // Enhanced debugging for Pi browser
      console.log("=== AUTHENTICATION ERROR DEBUG ===");
      console.log("Error type:", typeof error);
      console.log("Error constructor:", error?.constructor?.name);
      console.log("Error object:", error);
      console.log(
        "Error keys:",
        error && typeof error === "object" ? Object.keys(error) : "N/A"
      );
      console.log("Error JSON:", JSON.stringify(error, null, 2));
      console.log("=== END DEBUG ===");

      const errorMessage = formatError(error);
      logError("Pi Network Authentication (Onboarding)", error);
      setAuthError(errorMessage);
    }
  };

  return (
    <div className="onboarding-container">
      <div
        className="slides-wrapper"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides */}
        <div className="slides-content">
          {slides.map((data, idx) => (
            <div
              key={idx}
              className={`slide ${idx === currentIndex ? "active" : ""}`}
            >
              <OnboardingSlide data={data} />
            </div>
          ))}
        </div>

        {/* Navigation Dots */}
        <div className="nav-dots">
          {slides.map((_, idx) => (
            <button
              type="button"
              title="slide_nav"
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`nav-dot ${idx === currentIndex ? "active" : ""}`}
            />
          ))}
        </div>
      </div>

      {/* Static Authentication Button */}
      <div className="auth-section">
        <button
          type="button"
          title="Authenticate with Pi Network"
          onClick={handlePiAuthentication}
          disabled={isLoading}
          className={`auth-button ${isLoading ? "loading" : ""} ${
            !isSDKReady ? "not-ready" : ""
          }`}
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
              handlePiAuthentication();
            }}
          />
        )}
      </div>
    </div>
  );
}
