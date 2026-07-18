import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css?v=1.0.1';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Required root element #root not found in DOM.');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
