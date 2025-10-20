import React from "react";
import { formatError, createUserFriendlyError } from "../utils/errorHandler";

interface ErrorDisplayProps {
  error: unknown;
  title?: string;
  showDetails?: boolean;
  className?: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({
  error,
  title = "Error",
  showDetails = false,
  className = "",
  onRetry,
}: ErrorDisplayProps) {
  if (!error) return null;

  const userFriendlyMessage = createUserFriendlyError(error);
  let detailedMessage = formatError(error);
  
  // Fallback if formatError still returns [object Object]
  if (detailedMessage === "[object Object]" || detailedMessage.includes("[object Object]")) {
    detailedMessage = `Error details: ${JSON.stringify(error, (key, value) => {
      if (typeof value === 'function') return '[Function]';
      if (typeof value === 'object' && value !== null) {
        // Prevent circular references
        try {
          JSON.stringify(value);
          return value;
        } catch {
          return '[Circular Reference]';
        }
      }
      return value;
    }, 2)}`;
  }

  return (
    <div className={`error-display ${className}`}>
      <style jsx>{`
        .error-display {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
        }

        .error-title {
          color: #ef4444;
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .error-message {
          color: #ef4444;
          font-size: 14px;
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .error-details {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          padding: 12px;
          margin: 12px 0;
          font-family: monospace;
          font-size: 12px;
          color: #fca5a5;
          white-space: pre-wrap;
          word-break: break-word;
          max-height: 200px;
          overflow-y: auto;
        }

        .error-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .retry-button {
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .retry-button:hover {
          background-color: #dc2626;
        }

        .details-toggle {
          background: none;
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #ef4444;
          border-radius: 6px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .details-toggle:hover {
          background-color: rgba(239, 68, 68, 0.1);
        }

        .error-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
      `}</style>

      <div className="error-title">
        <svg className="error-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
          <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
        </svg>
        {title}
      </div>

      <div className="error-message">{userFriendlyMessage}</div>

      {showDetails && detailedMessage !== userFriendlyMessage && (
        <details>
          <summary className="details-toggle" style={{ cursor: "pointer", marginBottom: "8px" }}>
            Show technical details
          </summary>
          <div className="error-details">{detailedMessage}</div>
        </details>
      )}

      {onRetry && (
        <div className="error-actions">
          <button className="retry-button" onClick={onRetry}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}