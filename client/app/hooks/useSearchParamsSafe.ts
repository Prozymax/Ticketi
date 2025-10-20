"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

/**
 * A safe wrapper around useSearchParams that provides fallback values
 * and better error handling. This hook should still be used within a Suspense boundary.
 */
export function useSearchParamsSafe() {
  const searchParams = useSearchParams();

  const safeGet = useMemo(() => {
    return (key: string, fallback: string | null = null): string | null => {
      try {
        return searchParams.get(key) || fallback;
      } catch (error) {
        console.warn(`Failed to get search param "${key}":`, error);
        return fallback;
      }
    };
  }, [searchParams]);

  const safeGetAll = useMemo(() => {
    return (key: string): string[] => {
      try {
        return searchParams.getAll(key);
      } catch (error) {
        console.warn(`Failed to get all search params for "${key}":`, error);
        return [];
      }
    };
  }, [searchParams]);

  const safeHas = useMemo(() => {
    return (key: string): boolean => {
      try {
        return searchParams.has(key);
      } catch (error) {
        console.warn(`Failed to check search param "${key}":`, error);
        return false;
      }
    };
  }, [searchParams]);

  const safeEntries = useMemo(() => {
    return (): [string, string][] => {
      try {
        return Array.from(searchParams.entries());
      } catch (error) {
        console.warn("Failed to get search params entries:", error);
        return [];
      }
    };
  }, [searchParams]);

  const safeToString = useMemo(() => {
    return (): string => {
      try {
        return searchParams.toString();
      } catch (error) {
        console.warn("Failed to convert search params to string:", error);
        return "";
      }
    };
  }, [searchParams]);

  return {
    get: safeGet,
    getAll: safeGetAll,
    has: safeHas,
    entries: safeEntries,
    toString: safeToString,
    // Also expose the original searchParams for advanced use cases
    raw: searchParams,
  };
}

/**
 * Higher-order component that wraps a component with Suspense boundary
 * for safe useSearchParams usage
 */
export function withSearchParamsSuspense<T extends object>(
  Component: React.ComponentType<T>,
  LoadingComponent?: React.ComponentType
) {
  const DefaultLoading = () => (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "200px",
      color: "#888"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: "32px",
          height: "32px",
          border: "2px solid #333",
          borderTop: "2px solid #8b5cf6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 12px auto",
        }} />
        <p>Loading...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  return function WrappedComponent(props: T) {
    const { Suspense } = require("react");
    
    return (
      <Suspense fallback={<LoadingComponent || DefaultLoading />}>
        <Component {...props} />
      </Suspense>
    );
  };
}