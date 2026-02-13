
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Remove the initial loader once React starts rendering
const loader = document.getElementById('initial-loader');
if (loader) {
  loader.style.opacity = '0';
  loader.style.transition = 'opacity 0.5s ease-out';
  setTimeout(() => loader.remove(), 500);
}
