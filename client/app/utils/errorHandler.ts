// Error handling utilities

/**
 * Converts any error type to a readable string
 */
export function formatError(error: unknown): string {
  if (error === null || error === undefined) {
    return "An unknown error occurred";
  }

  // If it's already a string, return it
  if (typeof error === "string") {
    return error;
  }

  // If it's an Error object, return the message
  if (error instanceof Error) {
    return error.message || "An error occurred";
  }

  // If it's an object with a message property
  if (typeof error === "object" && error !== null) {
    const errorObj = error as Record<string, unknown>;
    
    // Check for common error message properties
    if (typeof errorObj.message === "string" && errorObj.message) {
      return errorObj.message;
    }
    
    if (typeof errorObj.error === "string" && errorObj.error) {
      return errorObj.error;
    }
    
    if (typeof errorObj.details === "string" && errorObj.details) {
      return errorObj.details;
    }

    // If it's a response object from an API
    if (errorObj.response && typeof errorObj.response === "object") {
      const response = errorObj.response as Record<string, unknown>;
      if (response.data && typeof response.data === "object") {
        const data = response.data as Record<string, unknown>;
        if (typeof data.message === "string" && data.message) {
          return data.message;
        }
        if (typeof data.error === "string" && data.error) {
          return data.error;
        }
      }
    }

    // Try to stringify the object, but limit the length
    try {
      const stringified = JSON.stringify(error, null, 2);
      if (stringified.length > 200) {
        return stringified.substring(0, 200) + "...";
      }
      return stringified;
    } catch {
      // If JSON.stringify fails, return a generic message
      return `Error object: ${Object.prototype.toString.call(error)}`;
    }
  }

  // For primitive types (number, boolean, etc.)
  return String(error);
}

/**
 * Logs error with proper formatting for debugging
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}] Error:`, error);
  
  // Additional logging for debugging
  if (typeof error === "object" && error !== null) {
    console.error(`[${context}] Error type:`, typeof error);
    console.error(`[${context}] Error constructor:`, error.constructor?.name);
    console.error(`[${context}] Error keys:`, Object.keys(error));
  }
}

/**
 * Creates a user-friendly error message from various error types
 */
export function createUserFriendlyError(error: unknown, fallbackMessage = "Something went wrong"): string {
  const formattedError = formatError(error);
  
  // Map common technical errors to user-friendly messages
  const errorMappings: Record<string, string> = {
    "Network Error": "Please check your internet connection and try again",
    "Failed to fetch": "Unable to connect to the server. Please try again",
    "Unauthorized": "Please log in again to continue",
    "Forbidden": "You don't have permission to perform this action",
    "Not Found": "The requested resource was not found",
    "Internal Server Error": "Server error. Please try again later",
    "Bad Request": "Invalid request. Please check your input",
    "Timeout": "Request timed out. Please try again",
  };

  // Check if the error matches any known patterns
  for (const [pattern, friendlyMessage] of Object.entries(errorMappings)) {
    if (formattedError.toLowerCase().includes(pattern.toLowerCase())) {
      return friendlyMessage;
    }
  }

  // If it's a short, readable error message, return it as is
  if (formattedError.length < 100 && !formattedError.includes("{") && !formattedError.includes("[")) {
    return formattedError;
  }

  // Otherwise, return the fallback message
  return fallbackMessage;
}