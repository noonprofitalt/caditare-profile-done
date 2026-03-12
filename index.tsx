import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ui/ErrorBoundary';
import './index.css';

// EMERGENCY ERROR DISPLAY FOR BLANK SCREEN
const ErrorDisplay = ({ error }: { error: any }) => (
  <div style={{ padding: '20px', background: '#fee2e2', color: '#991b1b', fontFamily: 'sans-serif', minHeight: '100vh' }}>
    <h1 style={{ margin: '0 0 10px 0' }}>🚨 App Boot Failure</h1>
    <p>The application failed to initialize. Here are the details:</p>
    <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto', border: '1px solid #fecaca' }}>
      {error?.stack || error?.message || String(error)}
    </pre>
    <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '8px 16px', borderRadius: '4px', background: '#991b1b', color: '#white', border: 'none', cursor: 'pointer' }}>
      Reload App
    </button>
  </div>
);

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="padding: 20px; background: red; color: white;"><h1>FATAL ERROR: #root not found in index.html</h1></div>';
} else {
  const root = ReactDOM.createRoot(rootElement);
  
  // Global error listener for early-boot errors
  window.addEventListener('error', (event) => {
    console.error('Captured global error:', event.error);
    try {
      root.render(<ErrorDisplay error={event.error || event.message} />);
    } catch (e) {
      document.body.innerHTML = `<h1>Critical Runtime Error</h1><pre>${event.message}</pre>`;
    }
  });

  try {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (err) {
    console.error('Catch block error:', err);
    root.render(<ErrorDisplay error={err} />);
  }
}