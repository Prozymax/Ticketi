"use client";

import { useState } from "react";
import ErrorDisplay from "../components/ErrorDisplay";
import { formatError, createUserFriendlyError } from "../utils/errorHandler";

export default function ErrorTestPage() {
  const [currentError, setCurrentError] = useState<unknown>(null);

  const testErrors = [
    {
      name: "Simple String Error",
      error: "This is a simple string error message",
    },
    {
      name: "Error Object",
      error: new Error("This is an Error object with a message"),
    },
    {
      name: "Complex Object Error",
      error: {
        message: "Database connection failed",
        code: "DB_CONNECTION_ERROR",
        details: "Unable to connect to PostgreSQL database",
        timestamp: new Date().toISOString(),
      },
    },
    {
      name: "API Response Error",
      error: {
        response: {
          data: {
            message: "Unauthorized access",
            error: "INVALID_TOKEN",
            statusCode: 401,
          },
        },
      },
    },
    {
      name: "Network Error",
      error: {
        name: "NetworkError",
        message: "Failed to fetch",
        stack: "NetworkError: Failed to fetch\n    at fetch...",
      },
    },
    {
      name: "Object without message",
      error: {
        code: 500,
        status: "internal_server_error",
        data: { userId: 123, action: "payment" },
      },
    },
    {
      name: "Null/Undefined Error",
      error: null,
    },
  ];

  return (
    <div style={{
      backgroundColor: "#0a0a0a",
      color: "#ffffff",
      minHeight: "100vh",
      padding: "20px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <h1>Error Handling Test Page</h1>
      <p>This page demonstrates the improved error handling and display.</p>

      <div style={{ marginBottom: "30px" }}>
        <h2>Test Different Error Types:</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
          {testErrors.map((test, index) => (
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
            title="Test Error"
            showDetails={true}
            onRetry={() => setCurrentError(null)}
          />

          <h3>Raw Error Processing:</h3>
          <div style={{
            backgroundColor: "#1a1a1a",
            padding: "16px",
            borderRadius: "8px",
            marginTop: "16px"
          }}>
            <p><strong>Formatted Error:</strong></p>
            <pre style={{
              backgroundColor: "#2a2a2a",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "12px",
              overflow: "auto"
            }}>
              {formatError(currentError)}
            </pre>

            <p><strong>User-Friendly Error:</strong></p>
            <pre style={{
              backgroundColor: "#2a2a2a",
              padding: "12px",
              borderRadius: "4px",
              fontSize: "12px",
              overflow: "auto"
            }}>
              {createUserFriendlyError(currentError)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}