// localStorage utilities for token management

export class LocalStorageService {
  private static readonly PIONEER_KEY = 'pioneer-key';
  private static readonly USER_INFO_KEY = 'pi_user_info';

  /**
   * Store the pioneer token
   */
  static setPioneerKey(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.PIONEER_KEY, token);
    }
  }

  /**
   * Get the pioneer token
   */
  static getPioneerKey(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.PIONEER_KEY);
    }
    return null;
  }

  /**
   * Store user info
   */
  static setUserInfo(userInfo: {
    username: string;
    id: string;
    isVerified: boolean;
    timestamp: number;
  }): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_INFO_KEY, JSON.stringify(userInfo));
    }
  }

  /**
   * Get user info
   */
  static getUserInfo(): {
    username: string;
    id: string;
    isVerified: boolean;
    timestamp: number;
  } | null {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.USER_INFO_KEY);
        if (!stored) return null;

        const userData = JSON.parse(stored);
        
        // Check if data is not too old (24 hours)
        const isExpired = Date.now() - userData.timestamp > 24 * 60 * 60 * 1000;
        if (isExpired) {
          this.clearAll();
          return null;
        }

        return userData;
      } catch (error) {
        console.error("Error reading user info:", error);
        this.clearAll();
        return null;
      }
    }
    return null;
  }

  /**
   * Clear all stored data
   */
  static clearAll(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.PIONEER_KEY);
      localStorage.removeItem(this.USER_INFO_KEY);
    }
  }

  /**
   * Check if user has valid authentication data
   */
  static hasValidAuth(): boolean {
    return this.getPioneerKey() !== null && this.getUserInfo() !== null;
  }
}

export default LocalStorageService;