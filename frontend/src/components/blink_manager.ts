// src/components/blink_manager.ts
import { GazeResult } from "./compute_gaze";

/**
 * BlinkManager detects blinks by monitoring vertical eye openness
 * (distance between upper and lower eyelid landmarks).
 */
export default class BlinkManager {
  private threshold: number;
  private cooldown: number;
  private lastBlink: number;

  constructor(threshold = 0.21, cooldownMs = 300) {
    this.threshold = threshold; // lower EAR = closed eyes
    this.cooldown = cooldownMs;
    this.lastBlink = 0;
  }

  detectBlink(ear: number): boolean {
    const now = Date.now();
    if (ear < this.threshold && now - this.lastBlink > this.cooldown) {
      this.lastBlink = now;
      return true;
    }
    return false;
  }

  /** Reset blink timer to clear cooldown on camera restart */
  reset(): void {
    this.lastBlink = 0;
  }
}
