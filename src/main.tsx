import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global patch for fetch to ensure credentials/cookies are sent with all API requests in iframe contexts
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  try {
    Object.defineProperty(window, 'fetch', {
      value: function (input: RequestInfo | URL, init?: RequestInit) {
        let isApi = false;
        if (typeof input === 'string') {
          isApi = input.startsWith('/api') || input.includes('/api/');
        } else if (input && typeof input === 'object' && 'url' in input) {
          isApi = (input as Request).url.startsWith('/api') || (input as Request).url.includes('/api/');
        }

        if (isApi) {
          init = init || {};
          if (!init.credentials) {
            init.credentials = 'include';
          }
        }
        return originalFetch.call(window, input, init);
      },
      configurable: true,
      writable: true,
      enumerable: true
    });
  } catch (e) {
    console.warn('Failed to patch fetch via Object.defineProperty:', e);
    try {
      (window as any).fetch = function (input: any, init: any) {
        let isApi = false;
        if (typeof input === 'string') {
          isApi = input.startsWith('/api') || input.includes('/api/');
        } else if (input && typeof input === 'object' && 'url' in input) {
          isApi = input.url.startsWith('/api') || input.url.includes('/api/');
        }

        if (isApi) {
          init = init || {};
          if (!init.credentials) {
            init.credentials = 'include';
          }
        }
        return originalFetch.call(window, input, init);
      };
    } catch (err) {
      console.error('Failed to patch fetch via direct assignment:', err);
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
