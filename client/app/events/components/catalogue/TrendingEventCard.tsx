"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "@/styles/trending-event-card.module.css";

interface TrendingEvent {
  id: string;
  image: string;
  title: string;
  organizer?: {
    name: string;
    profileImage?: string;
    username: string;
  };
}

interface TrendingEventCardProps {
  event: TrendingEvent;
}

export default function TrendingEventCard({ event }: TrendingEventCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/events/${event.id}`);
  };

  return (
    <div className={styles["trending-card"]} onClick={handleClick}>
      <div className={styles["trending-image-container"]}>
        <Image
          src={event.image}
          alt={event.title}
          fill
          className={styles["trending-image"]}
          unoptimized
        />
      </div>
      <div className={styles["trending-info"]}>
          <h3 className={styles["trending-title"]}>{event.title}</h3>
        <div className={styles["organizer-avatar"]}>
          {event.organizer?.profileImage ? (
            <Image
              src={event.organizer?.profileImage}
              alt={event.organizer.username || "Organizer"}
              width={40}
              height={40}
              className={styles["avatar-image"]}
            />
          ) : (
            <Image
              src='/Avatar.png'
              alt={"Organizer"}
              width={40}
              height={40}
              className={styles["avatar-image"]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
