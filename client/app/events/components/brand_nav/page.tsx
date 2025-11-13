"use client";
import styles from "@/styles/home.module.css";
import "@/styles/mobileview/home.module.css";
import {useRouter} from "next/navigation";
import {useState, useEffect} from "react";
import {apiService} from "@/app/lib/api";

export default function BrandNav({eventsExist}: {eventsExist: boolean}) {
  const router = useRouter();
  const [profileImage, setProfileImage] = useState<string>("/Avatar.png");

  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const response = await apiService.getUserProfileImage();
        if (response.success && response.data?.profileImage) {
          setProfileImage(response.data.profileImage);
        }
      } catch (error) {
        console.error("Error fetching profile image:", error);
        // Keep default avatar on error
      }
    };

    fetchProfileImage();
  }, []);

  const visitProfile = () => {
    router.push("/profile");
  };
  
  return (
    <div className={styles.nav}>
      <div className={styles.header}>
        <div className={styles.logo}>
          Ticket<span className={styles["color-span"]}>i</span>
        </div>
        {eventsExist && (
          <div className={styles["explore-search-icon"]}>
            <svg width="40" height="40" viewBox="0 0 20 20" fill="none">
              <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2" />
              <path
                d="M21 21L16.65 16.65"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        <div className={styles["profile-avatar"]} onClick={visitProfile}>
          <img
            src={profileImage}
            alt="Profile"
            className={styles["avatar-small"]}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/Avatar.png";
            }}
          />
        </div>
      </div>
    </div>
  );
}
