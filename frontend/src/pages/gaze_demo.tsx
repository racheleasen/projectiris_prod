// src/pages/GazeDemo.tsx
import React, { useEffect, useRef, useState } from "react";
import { Results } from "@mediapipe/face_mesh";
import { GazeProjectionTS, GazeResult } from "../components/compute_gaze";
import BlinkManager from "../components/blink_manager";

interface Props {
  consent: boolean;
  active: boolean;
  onToggleCamera: () => void;
}

type Target = {
  id: string;
  label: string;
  x: string;
  y: string;
};

const TARGETS: Target[] = [
  { id: "tl", label: "Target 1", x: "20%", y: "20%" },
  { id: "tr", label: "Target 2", x: "80%", y: "20%" },
  { id: "bl", label: "Target 3", x: "20%", y: "80%" },
  { id: "br", label: "Target 4", x: "80%", y: "80%" },
];

const DWELL_TIME = 1200;

function euclidean(a: any, b: any) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function GazeDemo({ consent, active }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraConsent, setCameraConsent] = useState(false);
  const [debug, setDebug] = useState("idle");
  const [gaze, setGaze] = useState<GazeResult | null>(null);
  const [heapUsage, setHeapUsage] = useState("");
  const [blinkText, setBlinkText] = useState("");

  const [selected, setSelected] = useState<string[]>([]);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  const dwellStartRef = useRef<number | null>(null);

  const lastSetRef = useRef(0);
  const lastSendRef = useRef(0);
  const heapIntervalRef = useRef<number | null>(null);
  const animationIdRef = useRef<number>(0);

  const blinkManager = useRef(new BlinkManager()).current;

  const resizeCanvasToDisplaySize = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const wCSS = canvas.clientWidth;
    const hCSS = canvas.clientHeight;
    const w = Math.max(1, Math.floor(wCSS * dpr));
    const h = Math.max(1, Math.floor(hCSS * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, wCSS, hCSS);
    }
  };

  useEffect(() => {
    resizeCanvasToDisplaySize();
    const onResize = () => resizeCanvasToDisplaySize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (consent) setCameraConsent(true);
  }, [consent]);

  useEffect(() => {
    if (!cameraConsent || !active) return;

    let cancelled = false;
    let gp: GazeProjectionTS | null = new GazeProjectionTS(true);
    let faceMesh: any;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        resizeCanvasToDisplaySize();

        const FaceMeshCtor = (window as any).FaceMesh;
        faceMesh = new FaceMeshCtor({
          locateFile: (file: string) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });
        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          selfieMode: true,
        });

        faceMesh.onResults((res: Results) => {
          if (cancelled || !gp) return;
          const now = Date.now();
          const lm = res.multiFaceLandmarks?.[0];

          if (!lm) {
            setDebug("no face detected");
            setGaze(null);
            ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
            return;
          }

          const out = gp.compute(lm);
          if (!out) {
            setGaze(null);
            ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
            return;
          }

          if (now - lastSetRef.current > 100) {
            lastSetRef.current = now;
            setGaze(out);
          }

          const leftEAR =
            (euclidean(lm[159], lm[145]) + euclidean(lm[158], lm[153])) /
            (2.0 * euclidean(lm[33], lm[133]));
          const rightEAR =
            (euclidean(lm[386], lm[374]) + euclidean(lm[385], lm[380])) /
            (2.0 * euclidean(lm[362], lm[263]));
          const ear = (leftEAR + rightEAR) / 2.0;
          if (blinkManager.detectBlink(ear)) {
            setBlinkText("BLINK!");
            setTimeout(() => setBlinkText(""), 400);
          }

          let target: string | null = null;
          if (out.theta_deg < -105 && out.theta_deg > -135) target = "tl";
          else if (out.theta_deg > -70 && out.theta_deg <= -45) target = "tr";
          else if (out.theta_deg <= -135 && out.theta_deg >= -180) target = "bl";
          else if (out.theta_deg <= 0 && out.theta_deg >= -45) target = "br";
          else target = null;

          if (target === null) {
            dwellStartRef.current = null;
            setHoverTarget(null);
          } else if (target !== hoverTarget) {
            dwellStartRef.current = performance.now();
            setHoverTarget(target);
          } else if (target && dwellStartRef.current) {
            const elapsed = performance.now() - dwellStartRef.current;
            if (elapsed > DWELL_TIME) {
              setSelected((prev) => [...prev, target]);
              dwellStartRef.current = null;
            }
          }
        });

        const tick = async () => {
          if (cancelled || !gp) return;
          const now = Date.now();
          if (now - lastSendRef.current > 33) {
            lastSendRef.current = now;
            await faceMesh.send({ image: video });
          }
          animationIdRef.current = requestAnimationFrame(tick);
        };

        setDebug("camera ready; starting detection…");
        tick();
      } catch (err) {
        console.error("getUserMedia failed:", err);
        setDebug("camera error (check permissions/settings)");
      }
    })();

    return () => {
      cancelled = true;
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      cancelAnimationFrame(animationIdRef.current);
      faceMesh?.close?.().catch((err: any) => console.warn("FaceMesh cleanup error:", err));
      gp?.reset();
      gp = null;
    };
  }, [cameraConsent, active, blinkManager]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Wrapper stays normal */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "960px",
          aspectRatio: "16/9",
          margin: "0 auto",
          background: "#000",
        }}
      >
        {/* Flip only the video and canvas */}
        <video
          ref={videoRef}
          muted
          playsInline
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            background: "#000",
            transform: "scaleX(-1)", // 👈 flip video only
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transform: "scaleX(-1)", // 👈 flip canvas only
          }}
        />

        {/* Targets stay normal (not flipped) */}
        {TARGETS.map((t) => {
          const isHover = hoverTarget === t.id;
          return (
            <div
              key={t.id}
              style={{
                position: "absolute",
                top: t.y,
                left: t.x,
                transform: "translate(-50%, -50%)",
                width: "25%",
                height: "25%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isHover ? "#0afe0a" : "rgba(0,0,0,0.6)",
                color: isHover ? "#000" : "#fff",
                border: "2px solid #fff",
                borderRadius: 6,
                fontWeight: "bold",
                transition: "all 0.2s ease",
                fontSize: "clamp(12px, 2vw, 18px)",
              }}
            >
              {t.label}
            </div>
          );
        })}
      </div>

      {blinkText && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(0,0,0,0.8)",
            color: "#0afe0a",
            padding: "8px 16px",
            borderRadius: 4,
            fontFamily: "monospace",
            zIndex: 2000,
          }}
        >
          {blinkText}
        </div>
      )}
    </div>
  );
}
