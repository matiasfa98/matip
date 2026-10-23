import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import SharePage from './pages/SharePage.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import { getInitialTheme, applyTheme } from './theme.js';

applyTheme(getInitialTheme());

const path = window.location.pathname;
const shareMatch = path.match(/^\/share\/(.+)$/);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      {shareMatch ? <SharePage token={shareMatch[1]} /> : <App />}
    </ErrorBoundary>
  </StrictMode>
);