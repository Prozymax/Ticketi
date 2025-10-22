# Authentication Error Handling System 🔐

## Overview

This system automatically detects authentication errors (token missing, expired, unauthorized, etc.) and provides users with options to re-authenticate and retry their actions seamlessly.

## 🎯 **Key Features**

### **1. Automatic Error Detection**
- Detects authentication-related errors automatically
- Recognizes patterns like "unauthorized", "token missing", "middleware", "401", "403"
- Works with any API call or user action

### **2. Smart Error Display**
- Shows "Authenticate & Retry" button for auth errors
- Provides "Go to Login" option as fallback
- Maintains original "Try Again" for non-auth errors

### **3. Seamless Re-authentication**
- Automatically triggers Pi Network authentication
- Retries the original action after successful auth
- No need to navigate away from current page

## 🛠️ **Implementation Methods**

### **Method 1: Enhanced ErrorDisplay Component**

The `ErrorDisplay` component now automatically handles authentication errors:

```tsx
import ErrorDisplay from "@/app/components/ErrorDisplay";

function MyComponent() {
  const [error, setError] = useState(null);
  
  const handleAction = async () => {
    try {
      await apiService.someAction();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div>
      <button onClick={handleAction}>Do Something</button>
      
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={handleAction}           // Called for regular retries
          onAuthRetry={handleAction}       // Called after successful auth
        />
      )}
    </div>
  );
}
```

### **Method 2: useAuthenticatedAction Hook**

For automatic authentication handling in your hooks:

```tsx
import { useAuthenticatedAction } from "@/app/hooks/useAuthenticatedAction";

function useMyApiCall() {
  const myApiCall = async (data) => {
    return await apiService.someAction(data);
  };

  const {
    execute,
    isLoading,
    error,
    clearError,
    isAuthenticating
  } = useAuthenticatedAction(myApiCall, {
    retryOnAuth: true,  // Automatically retry after auth
    onSuccess: (result) => console.log("Success:", result),
    onError: (error) => console.error("Error:", error)
  });

  return {
    callApi: execute,
    isLoading,
    error,
    clearError,
    isAuthenticating
  };
}
```

### **Method 3: Error Boundary Wrapper**

For component-level error handling:

```tsx
import { AuthErrorBoundary } from "@/app/components/AuthErrorBoundary";

function App() {
  return (
    <AuthErrorBoundary>
      <MyComponent />
    </AuthErrorBoundary>
  );
}

// Or use the HOC
import { withAuthErrorHandling } from "@/app/components/AuthErrorBoundary";

const MyComponentWithAuth = withAuthErrorHandling(MyComponent);
```

## 🎨 **User Experience Flow**

### **Normal Error (Non-Auth)**
```
❌ Error occurs
📱 Shows: "Try Again" button
🔄 User clicks → Retries action
```

### **Authentication Error**
```
❌ Auth error occurs (token missing/expired)
📱 Shows: "Authenticate & Retry" + "Go to Login" buttons
🔐 User clicks "Authenticate & Retry"
✅ Pi Network authentication dialog opens
🔄 After successful auth → Automatically retries original action
```

### **Authentication Error (Fallback)**
```
❌ Auth error occurs
📱 User clicks "Go to Login"
🚀 Redirects to /login page
🔐 User authenticates there
🔄 Returns to continue their workflow
```

## 🔧 **Error Detection Patterns**

The system automatically detects these error patterns:

```javascript
const authErrorPatterns = [
  'unauthorized',
  'token',
  'authentication', 
  'authenticate',
  'login',
  'access denied',
  'forbidden',
  'invalid token',
  'expired token',
  'missing token',
  'token missing',
  'not authenticated',
  'auth',
  'session expired',
  'please log in',
  'middleware',
  '401',
  '403'
];
```

## 📝 **Usage Examples**

### **Example 1: Ticket Purchase with Auto-Auth**

```tsx
function TicketPurchaseModal() {
  const { purchaseTickets, isLoading, error, isAuthenticating } = useTicketPurchase();
  
  const handlePurchase = async () => {
    const result = await purchaseTickets({
      eventId: "123",
      ticketType: "regular",
      quantity: 2,
      totalAmount: 20.0
    });
    
    if (result.success) {
      // Purchase successful
      onSuccess(result);
    }
  };

  return (
    <div>
      <button 
        onClick={handlePurchase} 
        disabled={isLoading || isAuthenticating}
      >
        {isLoading ? "Processing..." : 
         isAuthenticating ? "Authenticating..." : 
         "Purchase Tickets"}
      </button>
      
      {error && (
        <ErrorDisplay
          error={error}
          onAuthRetry={handlePurchase}  // Will retry purchase after auth
        />
      )}
    </div>
  );
}
```

### **Example 2: Profile Update with Auth Handling**

```tsx
function ProfileForm() {
  const updateProfile = async (data) => {
    return await apiService.updateUserProfile(data);
  };

  const {
    execute: updateProfileWithAuth,
    isLoading,
    error,
    isAuthenticating
  } = useAuthenticatedAction(updateProfile);

  const handleSubmit = async (formData) => {
    try {
      await updateProfileWithAuth(formData);
      // Success handling
    } catch (err) {
      // Error is already handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      <button type="submit" disabled={isLoading || isAuthenticating}>
        {isAuthenticating ? "Authenticating..." : 
         isLoading ? "Updating..." : 
         "Update Profile"}
      </button>
      
      {error && (
        <ErrorDisplay
          error={error}
          onAuthRetry={() => handleSubmit(formData)}
        />
      )}
    </form>
  );
}
```

## 🚀 **Benefits**

1. **Seamless UX** - Users don't lose their context when auth expires
2. **Automatic Recovery** - No manual navigation to login pages
3. **Consistent Handling** - Same behavior across all components
4. **Developer Friendly** - Easy to implement with existing code
5. **Flexible** - Multiple implementation options for different use cases

## 🔄 **Migration Guide**

### **Existing Error Handling**
```tsx
// Before
{error && (
  <div className="error">
    {error}
    <button onClick={retry}>Try Again</button>
  </div>
)}
```

### **Enhanced Error Handling**
```tsx
// After
{error && (
  <ErrorDisplay
    error={error}
    onRetry={retry}
    onAuthRetry={retry}  // Add this for auth retry
  />
)}
```

The system is backward compatible - existing error displays will work as before, but now with enhanced authentication handling! 🎉