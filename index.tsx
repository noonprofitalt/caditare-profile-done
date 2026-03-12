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
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}