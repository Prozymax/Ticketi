// Utility functions for managing user state in localStorage

export const UserStorage = {
  // Check if user has visited before
  hasVisited(): boolean {
    try {
      return localStorage.getItem('hasVisited') === 'true';
    } catch {
      return false;
    }
  },

  // Mark user as having visited
  setHasVisited(): void {
    try {
      localStorage.setItem('hasVisited', 'true');
    } catch (error) {
      console.error('Failed to set hasVisited:', error);
    }
  },

  // Check if user is logged in
  isLoggedIn(): boolean {
    try {
      return localStorage.getItem('isLoggedIn') === 'true';
    } catch {
      return false;
    }
  },

  // Set user login status
  setLoggedIn(status: boolean): void {
    try {
      localStorage.setItem('isLoggedIn', status.toString());
    } catch (error) {
      console.error('Failed to set login status:', error);
    }
  },

  // Get user token
  getUserToken(): string | null {
    try {
      return localStorage.getItem('userToken');
    } catch {
      return null;
    }
  },

  // Set user token
  setUserToken(token: string): void {
    try {
      localStorage.setItem('userToken', token);
      this.setLoggedIn(true);
    } catch (error) {
      console.error('Failed to set user token:', error);
    }
  },

  // Get user data
  getUserData(): any {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  // Set user data
  setUserData(userData: any): void {
    try {
      localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to set user data:', error);
    }
  },

  // Clear all user data (logout)
  clearUserData(): void {
    try {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      // Keep hasVisited so they don't see onboarding again
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  },

  // Complete logout (including hasVisited - use carefully)
  completeLogout(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to complete logout:', error);
    }
  },

  // Check if user has completed onboarding
  hasCompletedOnboarding(): boolean {
    try {
      return localStorage.getItem('onboardingCompleted') === 'true';
    } catch {
      return false;
    }
  },

  // Mark onboarding as completed
  setOnboardingCompleted(): void {
    try {
      localStorage.setItem('onboardingCompleted', 'true');
      this.setHasVisited(); // Also mark as visited
    } catch (error) {
      console.error('Failed to set onboarding completed:', error);
    }
  }
};