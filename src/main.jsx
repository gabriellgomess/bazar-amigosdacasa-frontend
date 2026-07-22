import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

const getBasename = () => {
  if (import.meta.env.DEV) return '/';
  if (import.meta.env.VITE_REACT_APP_PATH) return import.meta.env.VITE_REACT_APP_PATH;
  const path = window.location.pathname;
  if (path.startsWith('/bazar2')) return '/bazar2';
  if (path.startsWith('/bazar')) return '/bazar';
  return '/';
};

const basename = getBasename();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
