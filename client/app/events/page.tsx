"use client";

import {useState, useEffect} from "react";
import EmptyEventsComponent from "./components/empty_catalogue/page";
import EventCatalogue from "./components/catalogue/EventCatalogue";
import BrandNav from "./components/brand_nav/page";
import {eventAPI} from "@/app/utils/api";

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
}

interface EventsData {
  nearYou: DatabaseEvent[];
  trending: DatabaseEvent[];
  aroundWorld: DatabaseEvent[];
}

export default function EventsPage() {
  const [eventsData, setEventsData] = useState<EventsData>({
    nearYou: [],
    trending: [],
    aroundWorld: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string>("");

  // Get user's location
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const {latitude, longitude} = position.coords;

              // Use reverse geocoding to get location name
              try {
                const response = await fetch(
                  `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                );
                const data = await response.json();
                const location =
                  data.city || data.locality || data.countryName || "Unknown";
                console.log("Detected location:", location);
                console.log("Geocoding data:", data);
                setUserLocation(location);
              } catch (geocodeError) {
                console.error("Geocoding error:", geocodeError);
                setUserLocation("Unknown");
              }
            },
            (error) => {
              console.error("Geolocation error:", error);
              setUserLocation("Unknown");
            }
          );
        } else {
          setUserLocation("Unknown");
        }
      } catch (error) {
        console.error("Location error:", error);
        setUserLocation("Unknown");
      }
    };

    getUserLocation();
  }, []);

  // Fetch events data
  useEffect(() => {
    const fetchEventsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all three types of events in parallel
        const [nearResponse, trendingResponse, worldResponse] =
          await Promise.all([
            userLocation && userLocation !== "Unknown"
              ? eventAPI.getEventsNearLocation(userLocation, 1, 6)
              : Promise.resolve({success: true, data: []}),
            eventAPI.getTrendingEvents(1, 6),
            eventAPI.getEventsAroundWorld(1, 6),
          ]);

        setEventsData({
          nearYou: nearResponse.success ? nearResponse.data || [] : [],
          trending: trendingResponse.success ? trendingResponse.data || [] : [],
          aroundWorld: worldResponse.success ? worldResponse.data || [] : [],
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch events"
        );
        setLoading(false);
      }
    };

    // Only fetch events after we have user location (or determined it's unknown)
    if (userLocation) {
      fetchEventsData();
    }
  }, [userLocation]);

  // Check if we have any events
  const hasEvents =
    eventsData.nearYou.length > 0 ||
    eventsData.trending.length > 0 ||
    eventsData.aroundWorld.length > 0;

  if (loading) {
    return (
      <div className="bg-black-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-white"></p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-red-500 text-xl mb-4">Error Loading Events</h3>
          <p className="text-white mb-4">{error}</p>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return hasEvents ? (
    <div className="bg-black-900">
      <BrandNav eventsExist={true} />
      <EventCatalogue eventsData={eventsData} userLocation={userLocation} />
    </div>
  ) : (
    <div className="bg-black-900">
      <BrandNav eventsExist={false} />
      <EmptyEventsComponent />
    </div>
  );
}
