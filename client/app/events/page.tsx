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

  // Get user's location with caching
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        // Check if location is cached (valid for 24 hours)
        const cachedLocation = localStorage.getItem('userLocation');
        const cacheTimestamp = localStorage.getItem('userLocationTimestamp');
        const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (cachedLocation && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          if (age < cacheExpiry) {
            console.log('Using cached location:', cachedLocation);
            setUserLocation(cachedLocation);
            return;
          }
        }

        // If no cache or expired, fetch location
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
                
                // Cache the location
                localStorage.setItem('userLocation', location);
                localStorage.setItem('userLocationTimestamp', Date.now().toString());
                
                setUserLocation(location);
              } catch (geocodeError) {
                console.error("Geocoding error:", geocodeError);
                setUserLocation("Unknown");
              }
            },
            (error) => {
              console.error("Geolocation error:", error);
              setUserLocation("Unknown");
            },
            { timeout: 5000, maximumAge: 600000 } // 5s timeout, accept 10min old position
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

  // Fetch events data - don't wait for location
  useEffect(() => {
    const fetchEventsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch trending and world events immediately (don't wait for location)
        const [trendingResponse, worldResponse] = await Promise.all([
          eventAPI.getTrendingEvents(1, 6),
          eventAPI.getEventsAroundWorld(1, 6),
        ]);

        setEventsData(prev => ({
          ...prev,
          trending: trendingResponse.success ? trendingResponse.data || [] : [],
          aroundWorld: worldResponse.success ? worldResponse.data || [] : [],
        }));

        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch events"
        );
        setLoading(false);
      }
    };

    // Fetch events immediately on mount
    fetchEventsData();
  }, []);

  // Fetch location-based events separately when location is available
  useEffect(() => {
    const fetchNearbyEvents = async () => {
      if (userLocation && userLocation !== "Unknown") {
        try {
          const nearResponse = await eventAPI.getEventsNearLocation(userLocation, 1, 6);
          setEventsData(prev => ({
            ...prev,
            nearYou: nearResponse.success ? nearResponse.data || [] : [],
          }));
        } catch (error) {
          console.error("Error fetching nearby events:", error);
        }
      }
    };

    if (userLocation) {
      fetchNearbyEvents();
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
