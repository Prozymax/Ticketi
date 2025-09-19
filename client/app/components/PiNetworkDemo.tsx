"use client";

import React from "react";
import {usePiNetwork} from "../hooks/usePiNetwork";

export const PiNetworkDemo: React.FC = () => {
  const {
    isAuthenticated,
    user,
    isLoading,
    error,
    authenticate,
    createPayment,
    shareContent,
    isSDKReady,
  } = usePiNetwork();

  const handleAuthenticate = async () => {
    try {
      await authenticate();
    } catch (err) {
      console.error("Authentication error:", err);
    }
  };

  const handleCreatePayment = async () => {
    try {
      const paymentId = await createPayment(
        1.0,
        "Test payment for event ticket",
        {eventId: "event_123", ticketType: "regular"}
      );
      console.log("Payment created:", paymentId);
      alert(`Payment created successfully! ID: ${paymentId}`);
    } catch (err) {
      console.error("Payment error:", err);
      alert(
        "Payment failed: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  const handleShare = () => {
    shareContent(
      "Check out this amazing event!",
      "Join me at this incredible event. Get your tickets now!"
    );
  };

  if (!isSDKReady) {
    return (
      <div style={{padding: "20px", textAlign: "center"}}>
        <p>Loading Pi Network SDK...</p>
        <p style={{fontSize: "14px", opacity: 0.7}}>
          Make sure you're using the Pi Browser or have the Pi SDK loaded.
        </p>
      </div>
    );
  }

  return (
    <div style={{maxWidth: "600px", margin: "0 auto", padding: "20px"}}>
      <h2>Pi Network Integration Demo</h2>

      {error && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef2f2",
            border: "1px solid #ef4444",
            borderRadius: "8px",
            color: "#991b1b",
            marginBottom: "20px",
          }}
        >
          <p>Error: {error}</p>
        </div>
      )}

      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
        }}
      >
        <h3>Authentication</h3>
        {!isAuthenticated ? (
          <button
            onClick={handleAuthenticate}
            disabled={isLoading}
            style={{
              padding: "12px 24px",
              backgroundColor: "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Authenticating..." : "Login with Pi"}
          </button>
        ) : (
          <div
            style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #22c55e",
              borderRadius: "6px",
              padding: "12px",
              color: "#15803d",
            }}
          >
            <p>
              ✅ Authenticated as: <strong>{user?.username}</strong>
            </p>
            <p>User ID: {user?.uid}</p>
          </div>
        )}
      </div>

      {isAuthenticated && (
        <>
          <div
            style={{
              marginBottom: "30px",
              padding: "20px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            <h3>Payment</h3>
            <p>Create a test payment for 1π</p>
            <button
              onClick={handleCreatePayment}
              disabled={isLoading}
              style={{
                padding: "12px 24px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
              }}
            >
              {isLoading ? "Creating Payment..." : "Pay 1π for Ticket"}
            </button>
          </div>

          <div
            style={{
              marginBottom: "30px",
              padding: "20px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >
            <h3>Share</h3>
            <p>Share content using Pi Network&apos;s share dialog</p>
            <button
              onClick={handleShare}
              style={{
                padding: "12px 24px",
                backgroundColor: "#f59e0b",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Share Event
            </button>
          </div>
        </>
      )}
    </div>
  );
};
