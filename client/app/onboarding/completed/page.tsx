"use client";

import {useRouter} from "next/navigation";
import styles from "@/styles/completed.module.css";
import "@/styles/mobileview/completed.module.css";

export default function CompletedPage() {
  const router = useRouter();

  const handleExploreTicketi = () => {
    // Mark onboarding as completed and user as having visited
    import("../../utils/userStorage").then(({UserStorage}) => {
      UserStorage.setOnboardingCompleted();
      UserStorage.setHasVisited();
    });

    // Navigate to login page for authentication
    router.push("/login");
  };

  return (
    <div className={styles["completed-container"]}>
      <div className={styles.content}>
        {/* Success icon */}
        <div className={styles["success-icon-container"]}>
          <div className={styles["success-icon"]}>
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
        <div className={styles["text-content"]}>
          <h1 className={styles.title}>Account Created Successfully</h1>
          <p className={styles.subtitle}>
            Start creating, exploring, visiting, and engaging
          </p>
        </div>

        {/* Explore button */}
        <button
          className={styles["explore-button"]}
          onClick={handleExploreTicketi}
        >
          Explore Ticketi
        </button>
      </div>
    </div>
  );
}
