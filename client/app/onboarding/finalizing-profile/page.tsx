"use client";

import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import "@/styles/finalizing-profile.css";
import "@/styles/mobileview/finalizing-profile.css";

export default function FinalizingProfilePage() {
  const [progress, setProgress] = useState(0);
  const [verifiedStatus] = useState(true)
  const router = useRouter();

  useEffect(() => {
    // Simulate profile setup progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Navigate to next page after completion
          if(verifiedStatus === true) 
            setTimeout(() => {
                router.push("/events")
            }, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [router, verifiedStatus]);

  return (
    <div className="finalizing-profile-container">
      <div className="content">
        {/* Loading spinner */}
        <div className="spinner-container">
          <div className="spinner">
            <div className="spinner-segment"></div>
            <div className="spinner-segment"></div>
            <div className="spinner-segment"></div>
            <div className="spinner-segment"></div>
            <div className="spinner-segment"></div>
            <div className="spinner-segment"></div>
            <div className="spinner-segment"></div>
            <div className="spinner-segment"></div>
          </div>
        </div>

        {/* Title and subtitle */}
        <div className="text-content">
          <h1 className="title">Finalizing your profile</h1>
          <p className="subtitle">Setting up your profile...</p>
        </div>

        {/* Progress indicator (optional, hidden by default) */}
        <div className="progress-indicator" style={{display: "none"}}>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{width: `${progress}%`}}
            ></div>
          </div>
          <span className="progress-text">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
