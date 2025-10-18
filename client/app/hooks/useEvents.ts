"use client";

import { useState, useEffect, useCallback } from "react";
import { apiService } from "../lib/api";

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  regularTickets: number;
  ticketPrice: number;
  eventImage?: string;
  isPublished: boolean;
  organizerId: string;
  ticketsSold: number;
  status: string;
  organizer?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    isVerified?: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface UseEventsReturn {
  events: Event[];
  isLoading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
}

export const useEvents = (page = 1, limit = 10): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getEvents(page, limit);
      
      if (response.data) {
        setEvents(response.data.events || []);
        setPagination(response.data.pagination || null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch events";
      setError(errorMessage);
      console.error("Events fetch error:", err);
      // Set empty array on error to show empty state
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  const refreshEvents = useCallback(async () => {
    await fetchEvents();
  }, [fetchEvents]);

  // Auto-fetch events on mount and when page/limit changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    isLoading,
    error,
    fetchEvents,
    refreshEvents,
    pagination,
  };
};