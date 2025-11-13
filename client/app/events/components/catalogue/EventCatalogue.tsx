"use client";
import Image from "next/image";
import EventCard from "./EventCard";
import TrendingEventCard from "./TrendingEventCard";
import styles from "@/styles/event-card.module.css";
import {useRouter} from "next/navigation";

interface DatabaseEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  regularTickets: number;
  ticketPrice: string;
  eventImage?: string;
  isPublished: boolean;
  ticketsSold: number;
  status: "draft" | "published" | "cancelled" | "completed";
  createdAt: string;
  updatedAt: string;
  organizer: {
    id: number;
    username: string;
    profileImage: string;
  }
}

interface EventsData {
  nearYou: DatabaseEvent[];
  trending: DatabaseEvent[];
  aroundWorld: DatabaseEvent[];
}

interface EventCatalogueProps {
  eventsData?: EventsData;
  userLocation?: string;
}

export default function EventCatalogue({
  eventsData,
  userLocation,
}: EventCatalogueProps) {
  const router = useRouter();

  const handleCreateEvent = () => {
    router.push("/create-event");
  };

  // Convert database event to EventCard format
  const convertEventFormat = (dbEvent: DatabaseEvent) => {
    const startDate = new Date(dbEvent.startDate);
    console.log(dbEvent);
    return {
      id: dbEvent.id,
      image: dbEvent.eventImage || "/events/events_sample.jpg",
      title: dbEvent.title,
      ticket_price: dbEvent.ticketPrice,
      venue: dbEvent.location,
      data: startDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      time: startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      ticket_amount: dbEvent.regularTickets - dbEvent.ticketsSold,
    };
  };

  // Convert database event to TrendingEventCard format
  const convertTrendingFormat = (dbEvent: DatabaseEvent) => {
    return {
      id: dbEvent.id,
      image: dbEvent.eventImage || "/events/events_sample.jpg",
      title: dbEvent.title,
      organizer: {
        name: dbEvent.organizer.username, // You can add organizer data to the database event if available
        profileImage: dbEvent.organizer.profileImage,
      },
    };
  };

  // Safety check for events data
  if (
    !eventsData ||
    (eventsData.nearYou.length === 0 &&
      eventsData.trending.length === 0 &&
      eventsData.aroundWorld.length === 0)
  ) {
    return (
      <div className={styles["event-catalogue"]}>
        <div className={styles["no-events"]}>
          <p>No events available at the moment.</p>
        </div>
        <p className={styles["create-event"]} onClick={handleCreateEvent}>
          <i className={`${styles["fa-solid"]} ${styles["fa-plus"]}`}></i>
          &nbsp;&nbsp;Create Event
        </p>
      </div>
    );
  }

  return (
    <div className={styles["event-catalogue"]}>
      {/* Events Near You */}
      {eventsData.nearYou.length > 0 && (
        <div className={styles["events-grid"]}>
          <p className={`${styles.near_user} flex items-center py-8`}>
            <Image
              src="/icons/united-kingdom.png"
              width={25}
              height={25}
              alt="location_icon"
            />
            &nbsp;&nbsp; Events near you {userLocation && `(${userLocation})`}
          </p>
          {eventsData.nearYou.map((event) => (
            <EventCard key={event.id} event={convertEventFormat(event)} />
          ))}
        </div>
      )}

      {/* Trending Events - Horizontal Carousel */}
      {eventsData.trending.length > 0 && (
        <div className={styles["trending-section"]}>
          <p className={`${styles.near_user} flex items-center py-8`}>
            <Image
              src="/icons/fire.png"
              width={25}
              height={25}
              alt="trending_icon"
            />
            &nbsp;&nbsp; Trending Events
          </p>
          <div className={styles["trending-carousel"]}>
            <div className={styles["trending-carousel-track"]}>
              {eventsData.trending.map((event) => (
                <div key={event.id} className={styles["trending-card-wrapper"]}>
                  <TrendingEventCard event={convertTrendingFormat(event)} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Events Around the World */}
      {eventsData.aroundWorld.length > 0 && (
        <div className={styles["events-grid"]}>
          <p className={`${styles.near_user} flex items-center py-8`}>
            <Image
              src="/icons/globe.png"
              width={25}
              height={25}
              alt="world_icon"
            />
            &nbsp;&nbsp; Events around the world
          </p>
          {eventsData.aroundWorld.map((event) => (
            <EventCard key={event.id} event={convertEventFormat(event)} />
          ))}
        </div>
      )}

      <p className={styles["create-event"]} onClick={handleCreateEvent}>
        <i className={`${styles["fa-solid"]} ${styles["fa-plus"]}`}></i>
        &nbsp;&nbsp;Create Event
      </p>
    </div>
  );
}
