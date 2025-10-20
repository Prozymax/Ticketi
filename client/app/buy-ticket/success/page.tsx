"use client";

import {useRouter, useSearchParams} from "next/navigation";
import {useEffect, useState, Suspense} from "react";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentId] = useState(searchParams.get("paymentId"));
  // const [eventId] = useState(searchParams.get("eventId")); // Not used currently

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push("/events");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]); 

  return (
    <div
      style={{
        backgroundColor: "#0a0a0a",
        color: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "#1a1a1a",
          padding: "40px",
          borderRadius: "16px",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        {/* Success Icon */}
        <div style={{marginBottom: "24px"}}>
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            style={{margin: "0 auto"}}
          >
            <circle cx="12" cy="12" r="10" fill="#10b981" />
            <path
              d="M9 12l2 2 4-4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          style={{
            fontSize: "24px",
            fontWeight: "600",
            marginBottom: "16px",
            color: "#10b981",
          }}
        >
          Payment Successful!
        </h1>

        <p style={{fontSize: "16px", color: "#888", marginBottom: "24px"}}>
          Your ticket purchase has been completed successfully.
        </p>

        {paymentId && (
          <div style={{marginBottom: "24px"}}>
            <p style={{fontSize: "14px", color: "#666", marginBottom: "8px"}}>
              Payment ID:
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#ffffff",
                fontFamily: "monospace",
              }}
            >
              {paymentId}
            </p>
          </div>
        )}

        <div style={{display: "flex", gap: "12px", flexDirection: "column"}}>
          <button
            onClick={() => router.push("/events")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#8b5cf6",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
            }}
          >
            Back to Events
          </button>

          <button
            onClick={() => router.push("/profile")}
            style={{
              padding: "12px 24px",
              backgroundColor: "transparent",
              color: "#888",
              border: "1px solid #333",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            View My Tickets
          </button>
        </div>

        <p style={{fontSize: "12px", color: "#666", marginTop: "24px"}}>
          Redirecting to events in 5 seconds...
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div
      style={{
        backgroundColor: "#0a0a0a",
        color: "#ffffff",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{textAlign: "center"}}>
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #333",
            borderTop: "3px solid #8b5cf6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px auto",
          }}
        />
        <p>Loading...</p>
      </div>
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
