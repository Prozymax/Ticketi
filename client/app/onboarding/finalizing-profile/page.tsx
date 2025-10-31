"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import styles from "@/styles/finalizing-profile.module.css";
import "@/styles/mobileview/finalizing-profile.module.css";

export default function FinalizingProfilePage() {
  const [progress, setProgress] = useState(0);
  const [verifiedStatus] = useState(true);
  const router = useRouter();

  // TODO: set the profile that is to set te ticket brand name and other useful user settings
  useEffect(() => {
    // Simulate profile setup progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Navigate to next page after completion
          if (verifiedStatus === true)
            setTimeout(() => {
              router.push("/events");
            }, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [router, verifiedStatus]);

  return (
    <div className={styles["finalizing-profile-container"]}>
      <div className={styles.content}>
        {/* Loading spinner */}
        <div className={styles["spinner-container"]}>
          <div className={styles.spinner}>
            <div className={styles["spinner-segment"]}></div>
            <div className={styles["spinner-segment"]}></div>
            <div className={styles["spinner-segment"]}></div>
            <div className={styles["spinner-segment"]}></div>
            <div className={styles["spinner-segment"]}></div>
            <div className={styles["spinner-segment"]}></div>
            <div className={styles["spinner-segment"]}></div>
            <div className={styles["spinner-segment"]}></div>
          </div>
        </div>

        {/* Title and subtitle */}
        <div className={styles["text-content"]}>
          <h1 className={styles.title}>Finalizing your profile</h1>
          <p className={styles.subtitle}>Setting up your profile...</p>
        </div>

        {/* Progress indicator (optional, hidden by default) */}
        <div className={styles["progress-indicator"]} style={{display: "none"}}>
          <div className={styles["progress-bar"]}>
            <div
              className={styles["progress-fill"]}
              style={{width: `${progress}%`}}
            ></div>
          </div>
          <span className={styles["progress-text"]}>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
