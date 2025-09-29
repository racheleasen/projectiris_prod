import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import { injectSpeedInsights } from "@vercel/speed-insights";
import { inject } from "@vercel/analytics";

// Initialize analytics
injectSpeedInsights();
inject();

createRoot(document.getElementById("root")!).render(<App />);
