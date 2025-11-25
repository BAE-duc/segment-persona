import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
console.log('Root container:', container);

if (container) {
  const root = createRoot(container);
  try {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('Root render called');
  } catch (e) {
    console.error('Error during root render:', e);
  }
} else {
  console.error('Failed to find root element');
}