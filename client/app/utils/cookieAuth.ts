// Client-side cookie authentication utilities

export class CookieAuthService {
  private static readonly AUTH_COOKIE_NAME = 'pi_auth_token';

  /**
   * Check if authentication cookie exists
   * Note: We can't read HTTP-only cookies from JavaScript, 
   * so we'll rely on server responses to determine auth status
   */
  static hasAuthCookie(): boolean {
    // Since the cookie is HTTP-only, we can't read it directly
    // We'll need to make a request to the server to check auth status
    return document.cookie.includes(this.AUTH_COOKIE_NAME);
  }

  /**
   * Clear any client-side auth data
   * The actual HTTP-only cookie will be cleared by the server
   */
  static clearClientAuthData(): void {
    // Clear any localStorage data
    localStorage.removeItem("pi_auth");
    localStorage.removeItem("pi_username");
    
    // Clear any sessionStorage data
    sessionStorage.removeItem("pi_auth");
    sessionStorage.removeItem("pi_username");
  }

  /**
   * Store minimal user data in localStorage for UI purposes
   * (Not sensitive data - that stays in HTTP-only cookies)
   */
  static storeUserData(userData: {
    username: string;
    id: string;
    isVerified: boolean;
    token: string;
  }): void {
    const userInfo = {
      username: userData.username,
      id: userData.id,
      isVerified: userData.isVerified,
      timestamp: Date.now(),
    };
    
    localStorage.setItem("pi_user_info", JSON.stringify(userInfo));
    localStorage.setItem('pioneer-key', userData?.token)
  }



  /**
   * Get stored user data for UI purposes
   */
  static getUserData(): {
    username: string;
    id: string;
    isVerified: boolean;
    timestamp: number;
  } | null {
    try {
      const stored = localStorage.getItem("pi_user_info");
      if (!stored) return null;

      const userData = JSON.parse(stored);
      
      // Check if data is not too old (24 hours)
      const isExpired = Date.now() - userData.timestamp > 24 * 60 * 60 * 1000;
      if (isExpired) {
        localStorage.removeItem("pi_user_info");
        return null;
      }

      return userData;
    } catch (error) {
      console.error("Error reading user data:", error);
      localStorage.removeItem("pi_user_info");
      return null;
    }
  }

  /**
   * Check if user data exists and is not expired
   */
  static hasValidUserData(): boolean {
    return this.getUserData() !== null;
  }

  /**
   * Clear all authentication data
   */
  static clearAll(): void {
    this.clearClientAuthData();
    localStorage.removeItem("pi_user_info");
    localStorage.removeItem("pioneer-key");
  }
}

export default CookieAuthService;