import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'

// Intercept global fetch to automatically prepend VITE_API_URL if configured
const originalFetch = window.fetch;
window.fetch = function (uri, options) {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && typeof uri === 'string' && uri.startsWith('/api')) {
    uri = `${apiUrl}${uri}`;
  }
  return originalFetch(uri, options);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
