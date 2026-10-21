import React, { useRef, useEffect, useState } from "react";
import { GraphDataPoint } from "../physics/types";

export type GraphMode = "position" | "velocity" | "acceleration" | "energy" | "phaseSpace";

interface GraphPlotterProps {
  dataHistory: GraphDataPoint[];
  currentTime: number;
  onTimeSeek?: (t: number) => void;
  systemType: string;
}

export const GraphPlotter: React.FC<GraphPlotterProps> = ({
  dataHistory,
  currentTime,
  onTimeSeek,
  systemType,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<GraphMode>("position");

  // Determine series names and labels depending on mode and systemType
  const getSeriesConfig = () => {
    switch (mode) {
      case "position":
        if (systemType === "pendulum") {
          return [{ key: "thetaDeg", label: "Angle θ (°)", color: "#38bdf8" }];
        }
        if (systemType === "circuit") {
          return [{ key: "vCapacitor", label: "Capacitor Voltage (V)", color: "#38bdf8" }];
        }
        return [
          { key: "x", label: "Position x (m)", color: "#38bdf8" },
          ...(dataHistory[0]?.y !== undefined ? [{ key: "y", label: "Height y (m)", color: "#818cf8" }] : []),
        ];

      case "velocity":
        if (systemType === "circuit") {
          return [{ key: "current", label: "Current (A)", color: "#10b981" }];
        }
        if (systemType === "pendulum") {
          return [{ key: "omega", label: "Angular Vel (rad/s)", color: "#10b981" }];
        }
        return [{ key: "v", label: "Velocity (m/s)", color: "#10b981" }];

      case "acceleration":
        return [{ key: "a", label: "Acceleration (m/s²)", color: "#f59e0b" }];

      case "energy":
        return [
          { key: "kineticEnergy", label: "Kinetic Energy K (J)", color: "#10b981" },
          { key: "potentialEnergy", label: "Potential Energy U (J)", color: "#38bdf8" },
          { key: "totalEnergy", label: "Total Energy E (J)", color: "#c084fc" },
        ];

      case "phaseSpace":
        return [{ key: "phase", label: "v vs x Phase Trajectory", color: "#ec4899" }];
    }
  };

  const series = getSeriesConfig();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Padding for axes
    const padLeft = 52;
    const padRight = 20;
    const padTop = 24;
    const padBottom = 32;

    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    // Background
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);

    if (dataHistory.length < 2) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Simulate or scrub time to plot real-time curves...", width / 2, height / 2);
      ctx.restore();
      return;
    }

    // PHASE SPACE MODE
    if (mode === "phaseSpace") {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      dataHistory.forEach((d) => {
        const xVal = d.x ?? d.thetaDeg ?? 0;
        const yVal = d.v ?? d.omega ?? d.current ?? 0;
        minX = Math.min(minX, xVal);
        maxX = Math.max(maxX, xVal);
        minY = Math.min(minY, yVal);
        maxY = Math.max(maxY, yVal);
      });
      if (minX === maxX) { minX -= 1; maxX += 1; }
      if (minY === maxY) { minY -= 1; maxY += 1; }

      // Grid
      drawPlotGrid(ctx, padLeft, padTop, plotW, plotH, minX, maxX, minY, maxY, "Position / Angle", "Velocity");

      // Draw trajectory curve
      ctx.beginPath();
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 2;
      dataHistory.forEach((d, idx) => {
        const xVal = d.x ?? d.thetaDeg ?? 0;
        const yVal = d.v ?? d.omega ?? d.current ?? 0;
        const px = padLeft + ((xVal - minX) / (maxX - minX)) * plotW;
        const py = padTop + plotH - ((yVal - minY) / (maxY - minY)) * plotH;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();

      // Current point dot
      const latest = dataHistory[dataHistory.length - 1];
      const curXVal = latest?.x ?? latest?.thetaDeg ?? 0;
      const curYVal = latest?.v ?? latest?.omega ?? latest?.current ?? 0;
      const curPx = padLeft + ((curXVal - minX) / (maxX - minX)) * plotW;
      const curPy = padTop + plotH - ((curYVal - minY) / (maxY - minY)) * plotH;
      ctx.beginPath();
      ctx.arc(curPx, curPy, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#f43f5e";
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      ctx.restore();
      return;
    }

    // TIME-SERIES MODES
    const minT = dataHistory[0].t;
    const maxT = Math.max(dataHistory[dataHistory.length - 1].t, minT + 0.5);

    // Find min and max Y across all active series
    let minY = Infinity;
    let maxY = -Infinity;
    series.forEach((s) => {
      dataHistory.forEach((d) => {
        const val = d[s.key];
        if (val !== undefined && isFinite(val)) {
          minY = Math.min(minY, val);
          maxY = Math.max(maxY, val);
        }
      });
    });

    if (!isFinite(minY) || !isFinite(maxY)) {
      minY = 0;
      maxY = 10;
    }
    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }

    // Add 10% breathing margin
    const yMargin = (maxY - minY) * 0.1;
    minY -= yMargin;
    maxY += yMargin;

    // Draw grid and axis ticks
    drawPlotGrid(ctx, padLeft, padTop, plotW, plotH, minT, maxT, minY, maxY, "Time t (s)", series[0].label);

    // Plot each series line
    series.forEach((s) => {
      ctx.beginPath();
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      let started = false;

      dataHistory.forEach((d) => {
        const val = d[s.key];
        if (val !== undefined && isFinite(val)) {
          const px = padLeft + ((d.t - minT) / (maxT - minT)) * plotW;
          const py = padTop + plotH - ((val - minY) / (maxY - minY)) * plotH;
          if (!started) {
            ctx.moveTo(px, py);
            started = true;
          } else {
            ctx.lineTo(px, py);
          }
        }
      });
      ctx.stroke();
    });

    // Synchronized Time Cursor Line
    if (currentTime >= minT && currentTime <= maxT) {
      const curX = padLeft + ((currentTime - minT) / (maxT - minT)) * plotW;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(curX, padTop);
      ctx.lineTo(curX, padTop + plotH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Top badge for current time
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${currentTime.toFixed(2)}s`, curX, padTop - 6);
    }

    ctx.restore();
  }, [dataHistory, currentTime, mode, series, systemType]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onTimeSeek || dataHistory.length < 2 || mode === "phaseSpace") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;

    const padLeft = 52;
    const padRight = 20;
    const plotW = rect.width - padLeft - padRight;
    if (clickX >= padLeft && clickX <= rect.width - padRight) {
      const minT = dataHistory[0].t;
      const maxT = dataHistory[dataHistory.length - 1].t;
      const fraction = (clickX - padLeft) / plotW;
      const targetT = minT + fraction * (maxT - minT);
      onTimeSeek(targetT);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Top Header & Mode Toggle Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Oscilloscope & Plotter
          </span>
          <div className="flex items-center space-x-1.5 ml-3">
            {series.map((s) => (
              <span key={s.key} className="flex items-center space-x-1 text-[11px] text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                <span>{s.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
          {(
            [
              { id: "position", label: "x(t)" },
              { id: "velocity", label: "v(t)" },
              { id: "acceleration", label: "a(t)" },
              { id: "energy", label: "Energy" },
              { id: "phaseSpace", label: "Phase v-x" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                mode === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Plot Canvas */}
      <div className="relative flex-1 min-h-[200px]">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="w-full h-full block cursor-crosshair"
        />
      </div>
    </div>
  );
};

function drawPlotGrid(
  ctx: CanvasRenderingContext2D,
  padLeft: number,
  padTop: number,
  plotW: number,
  plotH: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  xLabel: string,
  yLabel: string
) {
  // Border box
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  ctx.strokeRect(padLeft, padTop, plotW, plotH);

  // Horizontal Grid Lines & Y ticks
  const numYDivs = 4;
  ctx.fillStyle = "#64748b";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";

  for (let i = 0; i <= numYDivs; i++) {
    const yVal = minY + (i / numYDivs) * (maxY - minY);
    const py = padTop + plotH - (i / numYDivs) * plotH;

    ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
    ctx.beginPath();
    ctx.moveTo(padLeft, py);
    ctx.lineTo(padLeft + plotW, py);
    ctx.stroke();

    ctx.fillText(yVal.toFixed(1), padLeft - 6, py + 3);
  }

  // Zero-line accent if within range
  if (minY <= 0 && maxY >= 0) {
    const zeroY = padTop + plotH - ((0 - minY) / (maxY - minY)) * plotH;
    ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(padLeft + plotW, zeroY);
    ctx.stroke();
  }

  // Vertical Grid Lines & X ticks
  const numXDivs = 5;
  ctx.textAlign = "center";
  for (let j = 0; j <= numXDivs; j++) {
    const xVal = minX + (j / numXDivs) * (maxX - minX);
    const px = padLeft + (j / numXDivs) * plotW;

    ctx.strokeStyle = "rgba(148, 163, 184, 0.1)";
    ctx.beginPath();
    ctx.moveTo(px, padTop);
    ctx.lineTo(px, padTop + plotH);
    ctx.stroke();

    ctx.fillText(xVal.toFixed(1), px, padTop + plotH + 16);
  }

  // Axis Labels
  ctx.fillStyle = "#94a3b8";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(xLabel, padLeft + plotW / 2, padTop + plotH + 28);
}
