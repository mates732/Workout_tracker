const hostname =
  typeof window !== "undefined" ? window.location.hostname : "localhost";

export const API_BASE = `http://${hostname}:8000`;
