// Use Render Backend for Production (APK/Deployment), Localhost for Development
export const API_URL = import.meta.env.DEV
    ? "http://localhost:5000"
    : "https://flow-state-focus.onrender.com";
