import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./pwa/registerServiceWorker";

createRoot(document.getElementById("root")!).render(<App />);

// Offline support (production only, never in dev/preview or iframes).
registerServiceWorker();
