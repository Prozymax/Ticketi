"use client";

import { useState } from "react";
import ErrorDisplay from "../components/ErrorDisplay";
import { formatError } from "../utils/errorHandler";

export default function PiErrorTestPage() {
  const [currentError, setCurrentError] = useState<unknown>(null);

  // Simulate common Pi Network error types
  const piErrors = [
    {
      name: "Pi SDK Authentication Error",
      error: {
        code: "USER_CANCELLED",
        message: "User cancelled the authentication",
        type: "authentication_error"
      }
    },
    {
      name: "Pi SDK Network Error", 
      error: {
        code: "NETWORK_ERROR",
        message: "Failed to connect to Pi Network",
        type: "network_error"
      }
    },
    {
      name: "Pi Payment Error",
      error: {
        code: "PAYMENT_FAILED",
        message: "Payment processing failed",
        type: "payment_error",
        details: "Insufficient balance"
      }
    },
    {
      name: "Complex Pi Error Object",
      error: {
        name: "AuthenticationError",
        message: "Authentication failed",
        stack: "Error: Authentication failed\n    at authenticate...",
        code: "AUTH_FAILED",
        timestamp: new Date().toISOString(),
        metadata: {
          userId: "test123",
          attempt: 3
        }
      }
    },
    {
      name: "Nested Pi Error",
      error: {
        response: {
          data: {
            error: "Invalid access token",
            code: "INVALID_TOKEN",
            message: "The provided access token is invalid or expired"
          },
          status: 401
        }
      }
    },
    {
      name: "Raw Object Error (should be fixed)",
      error: {
        someProperty: "value",
        anotherProperty: 123,
        nestedObject: {
          deep: "value"
        }
      }
    }
  ];

  return (
    <div style={{
      backgroundColor: "#0a0a0a",
      color: "#ffffff", 
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <h1>Pi Network Error Testing</h1>
      <p>Test the improved error handling for Pi Network errors:</p>

      <div style={{ marginBottom: "30px" }}>
        <h2>Test Pi Network Error Types:</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
          {piErrors.map((test, index) => (
            <button
              key={index}
              onClick={() => setCurrentError(test.error)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#8b5cf6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              {test.name}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentError(null)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          Clear Error
        </button>
      </div>

      {currentError && (
        <div>
          <h3>Error Display Component:</h3>
          <ErrorDisplay
            error={currentError}
            title="Pi Network Error"
            showDetails={true}
            onRetry={() => setCurrentError(null)}
          />

          <h3>Formatted Error Output:</h3>
          <div style={{
            backgroundColor: "#1a1a1a",
            padding: "16px",
            borderRadius: "8px",
            marginTop: "16px"
          }}>
            <pre style={{
              backgroundColor: "#2a2a2a",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "12px",
              overflow: "auto",
              color: "#10b981"
            }}>
              {formatError(currentError)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}