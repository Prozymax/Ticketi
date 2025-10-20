'use client';

import { usePiNetwork } from '../hooks/usePiNetwork';
import { formatError } from '../utils/errorHandler';
import ErrorDisplay from './ErrorDisplay';

interface AuthStatusProps {
  showDetails?: boolean;
  className?: string;
}

export default function AuthStatus({ showDetails = false, className = '' }: AuthStatusProps) {
  const { isAuthenticated, user, isLoading, error, logout } = usePiNetwork();

  if (isLoading) {
    return (
      <div className={`auth-status loading ${className}`}>
        <div className="loading-spinner"></div>
        <span>Checking authentication...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`auth-status error ${className}`}>
        <ErrorDisplay
          error={error}
          title="Authentication Status Error"
          showDetails={showDetails}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`auth-status unauthenticated ${className}`}>
        <span>🔒 Not authenticated</span>
      </div>
    );
  }

  return (
    <div className={`auth-status authenticated ${className}`}>
      <div className="user-info">
        <span className="status-icon">
          {user?.isVerified ? '✅' : '⏳'}
        </span>
        <span className="username">{user?.username}</span>
        {user?.isVerified && <span className="verified-badge">Verified</span>}
      </div>
      
      {showDetails && user && (
        <div className="user-details">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Pi Wallet:</strong> {user.piWalletAddress}</p>
          <p><strong>Status:</strong> {user.isVerified ? 'Verified' : 'Pending'}</p>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}