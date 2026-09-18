const browserHost = typeof window !== 'undefined' ? (window.location.hostname || 'localhost') : 'localhost';
const localBackend = `http://${browserHost}:3000`;

// Use the Render backend in production. A VITE_BACKEND_URL environment
// variable can override this when deploying a fork or a different backend.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (
  typeof window !== 'undefined' && window.location.hostname.endsWith('onrender.com')
    ? 'https://air-gamepad-backend.onrender.com'
    : (typeof window !== 'undefined' && window.location.port === '5173' ? localBackend : window.location.origin)
);
