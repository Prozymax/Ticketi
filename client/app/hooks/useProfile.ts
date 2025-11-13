"use client";

import {useState, useEffect, useCallback} from "react";
import {
  apiService,
  UserProfile,
  UserStats,
  ProfileUpdateData,
} from "../lib/api";

interface UseProfileReturn {
  profile: UserProfile | null;
  stats: UserStats | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<boolean>;
  uploadProfileImage: (imageFile: File) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiService.getUserProfile();
      setProfile(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch profile";
      setError(errorMessage);
      console.error("Profile fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (data: ProfileUpdateData): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.updateUserProfile(data);
        setProfile(response.data);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update profile";
        setError(errorMessage);
        console.error("Profile update error:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const uploadProfileImage = useCallback(
    async (imageFile: File): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiService.uploadProfileImage(imageFile);
        setProfile(response.data);
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to upload profile image";
        setError(errorMessage);
        console.error("Profile image upload error:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const fetchStats = useCallback(async () => {
    setError(null);

    try {
      const response = await apiService.getUserStats();
      setStats(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch stats";
      setError(errorMessage);
      console.error("Stats fetch error:", err);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchStats()]);
  }, [fetchProfile, fetchStats]);

  // Auto-fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    stats,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    uploadProfileImage,
    fetchStats,
    refreshProfile,
  };
};
