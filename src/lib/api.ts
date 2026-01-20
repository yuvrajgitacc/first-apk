// Automatically use local backend when on localhost, otherwise use Render
export const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000"
    : "https://flow-state-focus.onrender.com";
