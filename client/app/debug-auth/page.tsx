'use client';

import { useState, useEffect } from 'react';
import { usePiNetwork } from '../hooks/usePiNetwork';
import { apiService } from '../lib/api';

export default function DebugAuthPage() {
  const { authenticate, isLoading, error, isSDKReady, user, logout } = usePiNetwork();
  const [backendStatus, setBackendStatus] = useState<string>('checking');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test backend connectivity
  const testBackend = async () => {
    try {
      addResult('Testing backend connectivity...');
      const response = await apiService.healthCheck();
      addResult(`✅ Backend connected: ${JSON.stringify(response)}`);
      setBackendStatus('connected');
    } catch (error) {
      addResult(`❌ Backend error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setBackendStatus('error');
    }
  };

  // Test Pi SDK
  const testPiSDK = () => {
    addResult(`Pi SDK Ready: ${isSDKReady ? '✅' : '❌'}`);
    addResult(`Window.Pi available: ${typeof window !== 'undefined' && window.Pi ? '✅' : '❌'}`);
  };

  // Test full authentication
  const testAuth = async () => {
    try {
      addResult('Starting full authentication test...');
      await authenticate();
      addResult('✅ Authentication completed successfully');
    } catch (error) {
      addResult(`❌ Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Clear results
  const clearResults = () => {
    setTestResults([]);
  };

  useEffect(() => {
    testBackend();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
      <h1>🔍 Authentication Debug Page</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <h3>Current Status</h3>
        <p><strong>Backend:</strong> <span style={{ color: backendStatus === 'connected' ? 'green' : 'red' }}>{backendStatus}</span></p>
        <p><strong>Pi SDK Ready:</strong> <span style={{ color: isSDKReady ? 'green' : 'red' }}>{isSDKReady ? 'Yes' : 'No'}</span></p>
        <p><strong>Authenticated:</strong> <span style={{ color: user ? 'green' : 'red' }}>{user ? 'Yes' : 'No'}</span></p>
        <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Error:</strong> {error || 'None'}</p>
      </div>

      {user && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '5px' }}>
          <h3>User Data</h3>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Actions</h3>
        <button onClick={testBackend} style={{ margin: '5px', padding: '10px' }}>
          Test Backend
        </button>
        <button onClick={testPiSDK} style={{ margin: '5px', padding: '10px' }}>
          Test Pi SDK
        </button>
        <button onClick={testAuth} disabled={isLoading || !isSDKReady} style={{ margin: '5px', padding: '10px' }}>
          Test Full Auth
        </button>
        <button onClick={logout} style={{ margin: '5px', padding: '10px' }}>
          Logout
        </button>
        <button onClick={clearResults} style={{ margin: '5px', padding: '10px' }}>
          Clear Results
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Test Results</h3>
        <div style={{ 
          backgroundColor: '#000', 
          color: '#00ff00', 
          padding: '15px', 
          borderRadius: '5px', 
          height: '300px', 
          overflowY: 'auto',
          fontSize: '12px'
        }}>
          {testResults.length === 0 ? (
            <div style={{ color: '#666' }}>No test results yet...</div>
          ) : (
            testResults.map((result, index) => (
              <div key={index}>{result}</div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Environment Info</h3>
        <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
        <p><strong>Pi Sandbox:</strong> {process.env.NEXT_PUBLIC_PI_SANDBOX}</p>
        <p><strong>Node Env:</strong> {process.env.NEXT_PUBLIC_NODE_ENV}</p>
      </div>

      <div>
        <h3>Local Storage</h3>
        <button 
          onClick={() => {
            const auth = localStorage.getItem('pi_auth');
            addResult(`Local Storage pi_auth: ${auth ? 'Found' : 'Not found'}`);
            if (auth) {
              try {
                const parsed = JSON.parse(auth);
                addResult(`Stored data: ${JSON.stringify(parsed, null, 2)}`);
              } catch (e) {
                addResult(`Error parsing stored data: ${e}`);
              }
            }
          }}
          style={{ padding: '10px' }}
        >
          Check Local Storage
        </button>
      </div>
    </div>
  );
}