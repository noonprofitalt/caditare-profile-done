import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ui/ErrorBoundary';
import './index.css';

// Root mounting logic
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('Fatal: Root element not found');
  document.body.innerHTML = '<div style="padding: 2.5rem; background: #0f172a; color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: sans-serif;"><div><h1 style="color: #60a5fa;">System Initialization Error</h1><p>The application root container was not found.</p></div></div>';
} else {
  const root = ReactDOM.createRoot(rootElement);
  
  try {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (err: any) {
    console.error('Boot failure:', err);
    root.render(
      <div style={{ padding: '2rem', background: '#fef2f2', color: '#991b1b', borderRadius: '8px', margin: '2rem', border: '1px solid #fecaca', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: '1.25rem' }}>Connection Failure</h1>
        <p>The system failed to connect to the backend services.</p>
        <pre style={{ background: 'white', padding: '1rem', overflow: 'auto' }}>{err?.message}</pre>
        <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', background: '#991b1b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }
}