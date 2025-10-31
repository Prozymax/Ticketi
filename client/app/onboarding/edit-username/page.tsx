"use client";

import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import Image from "next/image";
import styles from "@/styles/edit-username.module.css";
import "@/styles/mobileview/edit-username.module.css";

export default function EditUsernamePage() {
  const [username, setUsername] = useState("pioneer");
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
    console.log("Username updated:", username);
    router.push("/onboarding/finalizing-profile");
  };

  const handleBack = () => {
    router.back();
  };

  // Show loading state while checking localStorage
  if (isLoading) {
    return (
      <div className={styles["edit-username-container"]}>
        <div className={styles["loading-container"]}>
          <div className={styles["loading-spinner"]}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles["edit-username-container"]}>
      {/* Header with back button and progress indicator */}
      <div className={styles.header}>
        <button
          type="button"
          title="back-button"
          className={styles["back-button"]}
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
        <div className={styles["progress-indicator"]}>
          <div className={styles["progress-bar"]}></div>
          <div className={styles["progress-dot"]}></div>
        </div>

        {/* Main content */}
        <div className={styles.content}>
          {/* Profile section */}
          <div className={styles["profile-section"]}>
            <div className={styles["avatar-container"]}>
              <Image
                width={90}
                height={90}
                src="/Avatar.png"
                alt="user-male-circle--v2"
              />
              <div className={styles["verified-badge"]}>
                <Image
                  width={80}
                  height={80}
                  src="/icons/verified.png"
                  alt="instagram-verification-badge"
                />
              </div>
            </div>
            <div className={styles["username-display"]}>{username}</div>
          </div>

          {/* Title and description */}
          <div className={styles["title-section"]}>
            <h1 className={styles.title}>Personalize with Brand Name</h1>
            <p className={styles.description}>
              This is what your event ticket will be recognized with whenever
              you create a ticket a
            </p>
          </div>

          {/* Username input */}
          <div className={styles["input-section"]}>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles["username-input"]}
              placeholder="Enter username"
            />
          </div>

          {/* Continue button */}
          <button
            type="button"
            className={styles["continue-button"]}
            onClick={handleContinue}
          >
            Continue
          </button>

          {/* Footer links */}
          <div className={styles["footer-links"]}>
            <p>
              <span className={styles["footer-text"]}>
                Don&apos;t know a brandname? Create with{" "}
              </span>
              <span className={styles["pi-link"]}>Pi Domain</span>
              <span className={styles["footer-text"]}>
                {" "}
                and secure your brand.
              </span>
            </p>
            <div className={styles["mint-link"]}>Mint with Pi Domain</div>
          </div>
        </div>
      </main>
    </div>
  );
}
