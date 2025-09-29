// src/App.tsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import GazeDemo from "./pages/gaze_demo";
import HeroSlide from "./pages/hero_slide";
import LearnMore from "./pages/learn_more";
import GetStarted from "./pages/get_started";
import SiteHeader from "./components/site_header";
import Privacy from "./pages/privacy";
import "./styles/global.css";

const ANALYTICS_KEY = "iris_analytics_consent";

export default function App() {
  const [consent, setConsent] = useState(false);
  const [cameraConsent, setCameraConsent] = useState(false);

  // Restore consent on mount
  useEffect(() => {
    const saved = localStorage.getItem(ANALYTICS_KEY);
    if (saved === "true") setConsent(true);
  }, []);

  // Persist consent when changed
  useEffect(() => {
    localStorage.setItem(ANALYTICS_KEY, String(consent));
  }, [consent]);

  // Handle enabling camera + analytics consent
  const handleEnableCamera = () => {
    setCameraConsent(true);
    setConsent(true);
  };

  return (
    <Router>
      <div className="app-root">
        <SiteHeader /> {/* ✅ Reusable header on all pages */}

        <main className="page" role="main">
          <Routes>
            {/* Home route with camera logic */}
            <Route
              path="/"
              element={
                cameraConsent ? (
                  <div className="background">
                    <section className="main-content" aria-label="Gaze Demo">
                      <div className="page-head">
                        <h1 className="title">Gaze Calibration</h1>
                        <p className="subtitle">
                          Placeholder. Camera and test pointer are live, but no calibration targets are programmed at this time.
                        </p>
                      </div>

                      <hr className="header-divider" />
                      <GazeDemo consent={consent} />

                      <div className="info-text">
                        <h4>*No gaze analytics are being stored at this time.</h4>
                      </div>

                      <hr className="header-divider" />
                      <footer className="spacer-footer" aria-hidden="true" />

                      {/* Privacy details */}
                      <details className="privacy-details" id="privacy">
                        <summary>Privacy & data handling</summary>
                        <ul>
                          <li>Video stays on-device for inference; no raw frames are sent by default.</li>
                          <li>Web analytics help performance and device monitoring (e.g., load time, device type, browser).</li>
                          <li>“Derived data” includes normalized vectors and timing metrics only; it excludes images and identifiable A/V.</li>
                          <li>You can revoke gaze analytics consent anytime via the checkbox below.</li>
                        </ul>
                      </details>

                      {/* Consent toggle */}
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={consent}
                          onChange={(e) => setConsent(e.target.checked)}
                          aria-label="Consent to anonymized analytics"
                        />
                        <span>
                          I consent to sending anonymized gaze analytics to the backend for analysis.
                        </span>
                      </label>
                    </section>
                  </div>
                ) : (
                  <HeroSlide />
                )
              }
            />

            {/* Other pages */}
            <Route path="/learn-more" element={<LearnMore />} />
            <Route
              path="/get-started"
              element={<GetStarted onEnableCamera={handleEnableCamera} />}
            />
            <Route path="/demo" element={<GazeDemo consent={consent} />} />
            <Route path="/learn-more" element={<LearnMore />} />
            <Route
              path="/get-started"
              element={<GetStarted onEnableCamera={handleEnableCamera} />}
            />
            <Route path="/demo" element={<GazeDemo consent={consent} />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route
              path="/contact-us"
              element={
                <div className="standardPage">
                  <div className="standardCard">
                    <h1>Contact Us</h1>
                    <p>Coming soon…</p>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
