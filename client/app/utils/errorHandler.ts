// Error handling utilities

/**
 * Handles Pi Network specific error formats
 */
function formatPiNetworkError(error: Record<string, unknown>): string | null {
  // Pi SDK specific error patterns
  if (error.code && typeof error.code === 'string') {
    const piErrorCodes: Record<string, string> = {
      'USER_CANCELLED': 'Authentication was cancelled by user',
      'NETWORK_ERROR': 'Network connection error. Please check your internet connection',
      'SDK_NOT_READY': 'Pi SDK is not ready. Please wait and try again',
      'INVALID_SCOPE': 'Invalid permissions requested',
      'AUTHENTICATION_FAILED': 'Pi Network authentication failed',
      'PAYMENT_CANCELLED': 'Payment was cancelled',
      'PAYMENT_FAILED': 'Payment processing failed',
      'INSUFFICIENT_BALANCE': 'Insufficient Pi balance for this transaction'
    };
    
    const friendlyMessage = piErrorCodes[error.code] || `Pi Network Error: ${error.code}`;
    return error.message ? `${friendlyMessage}: ${error.message}` : friendlyMessage;
  }
  
  // Pi authentication error patterns
  if (error.type === 'authentication_error' || error.name === 'AuthenticationError') {
    return error.message as string || 'Pi Network authentication failed';
  }
  
  // Pi payment error patterns
  if (error.type === 'payment_error' || error.name === 'PaymentError') {
    return error.message as string || 'Pi Network payment failed';
  }
  
  return null;
}

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
    
    // First try Pi Network specific error handling
    const piError = formatPiNetworkError(errorObj);
    if (piError) {
      return piError;
    }
    
    // Check for common error message properties in order of preference
    const messageProps = [
      'message', 'error', 'details', 'description', 'reason', 'statusText'
    ];
    
    for (const prop of messageProps) {
      if (typeof errorObj[prop] === "string" && errorObj[prop]) {
        return errorObj[prop] as string;
      }
    }

    // Check for nested error objects
    if (errorObj.response && typeof errorObj.response === "object") {
      const response = errorObj.response as Record<string, unknown>;
      
      // Check response directly
      for (const prop of messageProps) {
        if (typeof response[prop] === "string" && response[prop]) {
          return response[prop] as string;
        }
      }
      
      // Check response.data
      if (response.data && typeof response.data === "object") {
        const data = response.data as Record<string, unknown>;
        for (const prop of messageProps) {
          if (typeof data[prop] === "string" && data[prop]) {
            return data[prop] as string;
          }
        }
      }
    }

    // Check for Pi Network specific error structures
    if (errorObj.code && typeof errorObj.code === "string") {
      return `Error ${errorObj.code}: ${errorObj.message || 'Unknown error'}`;
    }

    // Check for HTTP status codes
    if (typeof errorObj.status === "number") {
      const statusMessages: Record<number, string> = {
        400: "Bad Request",
        401: "Unauthorized",
        403: "Forbidden", 
        404: "Not Found",
        500: "Internal Server Error",
        502: "Bad Gateway",
        503: "Service Unavailable"
      };
      const statusText = statusMessages[errorObj.status] || "HTTP Error";
      return `${statusText} (${errorObj.status})`;
    }

    // Try to extract meaningful information from the object
    const keys = Object.keys(errorObj);
    if (keys.length === 0) {
      return "Empty error object";
    }

    // If object has only a few properties, try to create a readable message
    if (keys.length <= 3) {
      const parts: string[] = [];
      for (const key of keys) {
        const value = errorObj[key];
        if (typeof value === "string" || typeof value === "number") {
          parts.push(`${key}: ${value}`);
        }
      }
      if (parts.length > 0) {
        return parts.join(", ");
      }
    }

    // Try to stringify the object, but limit the length and make it readable
    try {
      // First try to create a simple representation
      const simpleObj: Record<string, unknown> = {};
      for (const key of keys.slice(0, 5)) { // Limit to first 5 keys
        const value = errorObj[key];
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          simpleObj[key] = value;
        } else if (value === null) {
          simpleObj[key] = null;
        } else {
          simpleObj[key] = "[object]";
        }
      }
      
      const stringified = JSON.stringify(simpleObj, null, 2);
      if (stringified.length > 300) {
        return stringified.substring(0, 300) + "...";
      }
      return stringified;
    } catch {
      // If JSON.stringify fails, return a generic message with type info
      return `Error object of type: ${Object.prototype.toString.call(error)}`;
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