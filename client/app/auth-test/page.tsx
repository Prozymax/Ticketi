'use client';

import { usePiNetwork } from '../hooks/usePiNetwork';
import AuthStatus from '../components/AuthStatus';

export default function AuthTestPage() {
  const { authenticate, isLoading, error, isSDKReady, user, logout } = usePiNetwork();

  const handleAuth = async () => {
    try {
      await authenticate();
    } catch (err) {
      console.error('Auth failed:', err);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Authentication Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <AuthStatus showDetails={true} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Actions:</h3>
        <button 
          onClick={handleAuth}
          disabled={isLoading || !isSDKReady}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Authenticating...' : 'Authenticate with Pi Network'}
        </button>
        
        <button 
          onClick={logout}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>SDK Status:</h3>
        <p>SDK Ready: {isSDKReady ? '✅' : '❌'}</p>
        <p>Loading: {isLoading ? '✅' : '❌'}</p>
        <p>Error: {error || 'None'}</p>
      </div>

      {user && (
        <div style={{ marginBottom: '20px' }}>
          <h3>User Data:</h3>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '5px',
            overflow: 'auto'
          }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <h3>Local Storage:</h3>
        <button 
          onClick={() => {
            const auth = localStorage.getItem('pi_auth');
            console.log('Stored auth:', auth);
            alert(auth ? 'Check console for stored auth data' : 'No auth data stored');
          }}
          style={{ 
            padding: '5px 10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          Check Stored Auth
        </button>
      </div>
    </div>
  );
}