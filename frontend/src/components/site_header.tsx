// src/components/SiteHeader.tsx
import React from "react";
import { Link } from "react-router-dom";
import styles from "../styles/site_header.module.css";

export default function SiteHeader() {
  return (
    <header className={styles.siteHeader} role="banner">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">●</span>
          <Link to="/" className={styles.brandText}>project iris</Link>
        </div>
        <nav className={styles.nav} aria-label="Primary">
          <Link className={styles.navLink} to="/learn-more">learn more</Link>
          <Link className={styles.navLink} to="/privacy">privacy</Link>
          <Link className={styles.navLink} to="/contact-us">contact us</Link>
        </nav>
      </div>
    </header>
  );
}
