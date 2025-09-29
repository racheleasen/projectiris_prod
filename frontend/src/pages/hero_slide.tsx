// src/pages/hero_slide.tsx
import React from "react";
import { Link } from "react-router-dom";
import styles from "../styles/hero.module.css";

export default function HeroSlide() {
  return (
    <>
      {/* === HERO SECTION === */}
      <section className={styles.hero}>
        <div className={styles.bubbleWrapper}>
          <div className={`${styles.bubble} ${styles.bubbleGreen}`} />
          <div className={`${styles.bubble} ${styles.bubbleWhite}`} />
        </div>

        <div className={styles.content}>
          <div className={styles.textBox}>
            <h1 className={styles.title}>Gaze Assistant</h1>
            <p className={styles.subtitle}>Free access to gaze-assisted communication.</p>
            <div className={styles.ctaGroup}>
              <Link to="/get-started" className={styles.ctaPrimary}>Get Started</Link>
              <Link to="/learn-more" className={styles.ctaSecondary}>Learn More</Link>
            </div>

            {/* Scroll Cue */}
            <div className={styles.scrollCue} />
          </div>
        </div>
      </section>
    </>
  );
}
