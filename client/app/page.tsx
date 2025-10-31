"use client";
import styles from "@/styles/splash.module.css";
import "@/styles/mobileview/splash.module.css";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

export default function LandingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  console.log(process.env.NEXT_PUBLIC_PI_SANDBOX, process.env.NODE_ENV);

  useEffect(() => {
    const checkUserStatus = () => {
      try {
        // Import the utility (dynamic import for client-side only)
        import("./utils/userStorage").then(({UserStorage}) => {
          // Check for authentication tokens (both UserStorage and pioneer-key)
          // const userToken = UserStorage.getUserToken();
          // const pioneerKey = localStorage.getItem("pioneer-key");
          // const isLoggedIn = UserStorage.isLoggedIn() || !!pioneerKey;

          // If user is already logged in and has a valid token, go to events
          // if (isLoggedIn && (userToken || pioneerKey)) {
          //   router.push("/events");
          //   return;
          // }

          // If user has visited before but not logged in, go to login
          if (UserStorage.hasVisited()) {
            router.push("/login");
            return;
          }

          // First time visitor, go to onboarding
          router.push("/splash/privacy");
        });
      } catch (error) {
        console.error("Error checking user status:", error);
        // Fallback to onboarding if there's an error
        router.push("/splash/privacy");
      }
    };

    // Show splash for 2 seconds then redirect
    const timer = setTimeout(() => {
      checkUserStatus();
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className={`${styles.main} ${styles["home-main"]}`}>
      <div className={styles["logo-container"]}>
        <p className={styles.logo_text}>
          Ticket<span className={styles["color-span"]}>i</span>
        </p>
      </div>
      {isLoading && (
        <div className={styles["loading-indicator"]}>
          <div className={styles["loading-spinner"]}></div>
        </div>
      )}
    </main>
  );
}
