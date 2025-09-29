// src/pages/LearnMore.tsx
import React from "react";
import styles from "../styles/standard_pages.module.css";
import { FaEye, FaFlask, FaComments } from "react-icons/fa";

export default function LearnMore() {
  return (
    <main className={styles.standardPage}>
      <div className={styles.standardCard}>
        <h1>Our Vision</h1>
        <p>
        Project iris aims to make gaze-based communication accessible to anyone with a standard webcam.</p>
        <p>
        We believe that everyone deserves a right to express themselves freely, and that technology should be accessible to all seeking it. By lowering barriers, project iris aims to expand access to gaze-assisted communication.
        </p>
        {/* Features */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <FaEye className={styles.featureIcon} />
            <h3>First-time explorers</h3>
            <p>Try gaze interaction with no install or account.</p>
          </div>
          <div className={styles.feature}>
            <FaComments className={styles.featureIcon} />
            <h3>Communication</h3>
            <p>Use Iris for short-term communication as needed.</p>
          </div>
          <div className={styles.feature}>
            <FaFlask className={styles.featureIcon} />
            <h3>Researchers</h3>
            <p>Prototype with full transparency.</p>
          </div>
        </div>
        <div className={styles.dedication}>
          The work for this project is dedicated to the Kirksey family.
        </div>
      </div>
    </main>
  );
}
