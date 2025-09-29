import React, { useEffect, useRef, useState } from "react";
import { Results } from "@mediapipe/face_mesh";
import { GazeProjectionTS } from "../components/compute";

interface Props { consent: boolean }

function drawVector(
  ctx: CanvasRenderingContext2D,
  wCSS: number,
  hCSS: number,
  origin: [number, number],
  x: number,
  y: number
) {
  const cx = origin[0] * wCSS;
  const cy = origin[1] * hCSS;
  const tipX = cx + x * wCSS;
  const tipY = cy + y * hCSS;

  ctx.clearRect(0, 0, wCSS, hCSS);
  ctx.strokeStyle = "#00FFFF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  ctx.fillStyle = "#FFFF00";
  ctx.beginPath();
  ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FF00FF";
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fill();
}

export default function GazeDemo({ consent }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraConsent, setCameraConsent] = useState(false);
  const [active, setActive] = useState(false);
  const [debug, setDebug] = useState("idle");
  const [gaze, setGaze] = useState<any>(null);
  const [heapUsage, setHeapUsage] = useState("");

  const lastSetRef = useRef(0);
  const lastDrawRef = useRef(0);
  const lastSendRef = useRef(0);
  const heapIntervalRef = useRef<number | null>(null);
  const animationIdRef = useRef<number>(0);
  const lastOutRef = useRef<{ ox: number; oy: number; x: number; y: number } | null>(null);

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
      if (lastOutRef.current) {
        const { ox, oy, x, y } = lastOutRef.current;
        drawVector(ctx, wCSS, hCSS, [ox, oy], x, y);
      } else {
        ctx.clearRect(0, 0, wCSS, hCSS);
      }
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
          audio: false
        });

        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        resizeCanvasToDisplaySize();

        const FaceMeshCtor = (window as any).FaceMesh;
        faceMesh = new FaceMeshCtor({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          selfieMode: true
        });

        faceMesh.onResults((res: Results) => {
          if (cancelled || !gp) return;

          const now = Date.now();
          const lm = res.multiFaceLandmarks?.[0];
          const wCSS = canvas.clientWidth;
          const hCSS = canvas.clientHeight;

          if (!lm) {
            setDebug("no face detected");
            setGaze(null);
            ctx.clearRect(0, 0, wCSS, hCSS);
            lastOutRef.current = null;
            return;
          }

          const out = gp.compute(lm);
          if (!out) {
            setGaze(null);
            ctx.clearRect(0, 0, wCSS, hCSS);
            lastOutRef.current = null;
            return;
          }

          lastOutRef.current = { ox: out.ox, oy: out.oy, x: out.x, y: out.y };

          if (now - lastSetRef.current > 100) {
            lastSetRef.current = now;
            setGaze(out);
          }

          if (now - lastDrawRef.current > 33) {
            lastDrawRef.current = now;
            drawVector(ctx, wCSS, hCSS, [out.ox, out.oy], out.x, out.y);
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

    if ((performance as any).memory) {
      heapIntervalRef.current = window.setInterval(() => {
        const { usedJSHeapSize, totalJSHeapSize } = (performance as any).memory;
        const used = (usedJSHeapSize / 1048576).toFixed(1);
        const total = (totalJSHeapSize / 1048576).toFixed(1);
        setHeapUsage(`${used} MB / ${total} MB`);
      }, 3000);
    }

    return () => {
      cancelled = true;

      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;

      cancelAnimationFrame(animationIdRef.current);

      faceMesh?.close?.().catch((err: any) => {
        console.warn("FaceMesh cleanup error:", err);
      });

      gp?.reset();
      gp = null;

      if (heapIntervalRef.current) {
        clearInterval(heapIntervalRef.current);
        heapIntervalRef.current = null;
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      lastOutRef.current = null;
    };
  }, [cameraConsent, active]);

  const handleToggleCamera = () => {
    setActive(prev => {
      const next = !prev;
      if (next) setCameraConsent(true);
      return next;
    });
  };

  return (
    <div style={{ width: "100%", height: "100%", margin: 0, padding: 0, overflow: "hidden", position: "relative" }}>
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        <video
          ref={videoRef}
          muted
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", background: "#000" }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        />
      </div>

      {consent && (
        <button onClick={handleToggleCamera} style={{
          position: "absolute",
          top: "10%",
          left: "10%",
          padding: "8px 16px",
          background: "#000",
          color: "#0afe0a",
          border: "1px solid #0afe0a",
          borderRadius: 4,
          fontSize: 16
        }}>
          {active ? "Disable Camera" : "Start Camera"}
        </button>
      )}

      <div style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        padding: 12,
        background: "rgba(0,0,0,0.7)",
        color: "#0afe0a",
        fontFamily: "monospace",
        fontSize: 12,
        maxWidth: "100vw"
      }}>
        <b>Debug:</b> {debug}<br />
        <b>Heap:</b> {heapUsage}
        <pre style={{
          marginTop: 4,
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          maxHeight: 200,
          overflowY: "auto"
        }}>
          {gaze ? JSON.stringify(gaze, null, 2) : "(waiting for gaze…)"}
        </pre>
      </div>
    </div>
  );
}
