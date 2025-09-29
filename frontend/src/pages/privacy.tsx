// src/pages/LearnMore.tsx
import React from "react";
import styles from "../styles/standard_pages.module.css";
import { FaEye, FaFlask, FaComments, FaVideo, FaUserSecret, FaLock } from "react-icons/fa";

export default function Privacy() {
  return (
    <main className={styles.standardPage}>
      <div className={styles.standardCard}>
        <h1>Privacy Policy</h1>
        <p>
        No video or audio is ever uploaded. Gaze vectors are processed locally and optionally
        anonymized for research and improvement.
        </p>
        {/* Features */}
        <div className={styles.features}>
          <div className={styles.feature}>
            <FaVideo className={styles.featureIcon} />
            <h3>No Recordings</h3>
            <p>Video stays on-device for inference; no raw frames are audio are sent by default.</p>
            <p></p>
          </div>
          <div className={styles.feature}>
            <FaUserSecret className={styles.featureIcon} />
            <h3>Anonymous</h3>
            <p>Collected data includes ormalized vectors and timing metrics.</p>
          </div>
          <div className={styles.feature}>
            <FaLock className={styles.featureIcon} />
            <h3>Control</h3>
            <p>Revoke gaze analytics consent at anytime during your session.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
