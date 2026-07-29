import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Aggressively unregister any existing service workers and clear caches
// to prevent stale builds / forced reloads from old SW activate handlers.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {});
}

if (typeof window !== "undefined" && "caches" in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  }).catch(() => {});
}

const root = document.getElementById("root")!;

createRoot(root).render(
  <App />
);
