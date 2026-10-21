import React, { useRef, useEffect } from "react";
import { PhysicsSystemType } from "../physics/types";
import { ProjectileState, ProjectileParams } from "../physics/projectile";
import { PendulumState, PendulumParams } from "../physics/pendulum";
import { SpringState, SpringParams } from "../physics/spring";
import { CollisionSimulationState, CollisionParams } from "../physics/collision";
import { CircuitState, CircuitParams } from "../physics/circuit";
import { InclineState, InclineParams } from "../physics/incline";

export interface SimulationCanvasProps {
  systemType: PhysicsSystemType;
  simulationState: any;
  parameters: Record<string, number>;
  showVelocityVector: boolean;
  showAccelerationVector: boolean;
  showForceVector: boolean;
  showTrajectory: boolean;
  showGrid: boolean;
  trajectoryHistory: Array<{ x: number; y: number }>;
}

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  systemType,
  simulationState,
  parameters,
  showVelocityVector,
  showAccelerationVector,
  showForceVector,
  showTrajectory,
  showGrid,
  trajectoryHistory,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
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

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#0b0f19");
    bgGrad.addColorStop(1, "#070a12");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw coordinate grid
    if (showGrid) {
      drawGrid(ctx, width, height);
    }

    // System-specific renderer
    switch (systemType) {
      case "projectile":
        renderProjectile(
          ctx,
          width,
          height,
          simulationState as ProjectileState,
          parameters as unknown as ProjectileParams,
          showVelocityVector,
          showAccelerationVector,
          showTrajectory,
          trajectoryHistory
        );
        break;

      case "pendulum":
        renderPendulum(
          ctx,
          width,
          height,
          simulationState as PendulumState,
          parameters as unknown as PendulumParams,
          showVelocityVector,
          showForceVector
        );
        break;

      case "spring":
        renderSpring(
          ctx,
          width,
          height,
          simulationState as SpringState,
          parameters as unknown as SpringParams,
          showVelocityVector,
          showForceVector
        );
        break;

      case "collision":
        renderCollision(
          ctx,
          width,
          height,
          simulationState as CollisionSimulationState,
          parameters as unknown as CollisionParams,
          showVelocityVector
        );
        break;

      case "circuit":
        renderCircuit(
          ctx,
          width,
          height,
          simulationState as CircuitState,
          parameters as unknown as CircuitParams
        );
        break;

      case "incline":
        renderIncline(
          ctx,
          width,
          height,
          simulationState as InclineState,
          parameters as unknown as InclineParams,
          showVelocityVector,
          showForceVector
        );
        break;

      default:
        break;
    }

    ctx.restore();
  }, [
    systemType,
    simulationState,
    parameters,
    showVelocityVector,
    showAccelerationVector,
    showForceVector,
    showTrajectory,
    showGrid,
    trajectoryHistory,
  ]);

  return (
    <div className="relative w-full h-full min-h-[360px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
      <canvas
        ref={canvasRef}
        data-testid="physics-simulation-canvas"
        className="w-full h-full block"
      />
      {/* Live Canvas Watermark / Physics Domain Label */}
      <div className="absolute top-3 left-4 pointer-events-none flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-mono font-medium tracking-wide uppercase text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 backdrop-blur-sm">
          {systemType} • Real-Time ODE Solver
        </span>
      </div>
    </div>
  );
};

// Helper: Grid drawing
function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
  ctx.lineWidth = 1;

  const gridSize = 40;
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Accent origin axes
  ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
  ctx.beginPath();
  ctx.moveTo(60, 0);
  ctx.lineTo(60, height);
  ctx.stroke();

  ctx.restore();
}

// Helper: Vector Arrow
function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  label?: string
) {
  const headLen = 9;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const angle = Math.atan2(dy, dx);
  const length = Math.hypot(dx, dy);

  if (length < 3) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  // Arrowhead
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 7),
    toY - headLen * Math.sin(angle - Math.PI / 7)
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 7),
    toY - headLen * Math.sin(angle + Math.PI / 7)
  );
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.fillStyle = color;
    ctx.fillText(label, toX + 6 * Math.cos(angle), toY + 6 * Math.sin(angle));
  }
  ctx.restore();
}

// -------------------------------------------------------------
// 1. PROJECTILE RENDERER
// -------------------------------------------------------------
function renderProjectile(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: ProjectileState,
  params: ProjectileParams,
  showVelocity: boolean,
  showAcceleration: boolean,
  showTrajectory: boolean,
  trajectoryHistory: Array<{ x: number; y: number }>
) {
  if (!state) return;

  const groundY = height - 50;
  const originX = 70;

  // Compute adaptive world-to-pixel scale based on expected range
  const v0 = params?.v0 ?? 25;
  const expectedRange = Math.max(30, (v0 * v0) / 9.81 + (params?.h0 ?? 0) * 2);
  const scale = (width - 140) / expectedRange;

  const toPx = (x: number, y: number) => [
    originX + x * scale,
    groundY - y * scale,
  ];

  // Draw Ground
  ctx.save();
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(0, groundY, width, height - groundY);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();

  // Metric ticks on ground
  ctx.fillStyle = "#64748b";
  ctx.font = "10px monospace";
  for (let m = 0; m <= expectedRange; m += 10) {
    const [tx, ty] = toPx(m, 0);
    if (tx < width - 10) {
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx, ty + 6);
      ctx.strokeStyle = "#475569";
      ctx.stroke();
      ctx.fillText(`${m}m`, tx - 8, ty + 18);
    }
  }

  // Draw Launch Platform if h0 > 0
  const h0 = params?.h0 ?? 0;
  if (h0 > 0) {
    const [px, py] = toPx(0, h0);
    ctx.fillStyle = "#334155";
    ctx.fillRect(originX - 30, py, 30, groundY - py);
    ctx.strokeStyle = "#64748b";
    ctx.strokeRect(originX - 30, py, 30, groundY - py);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`h₀=${h0}m`, originX - 45, py + (groundY - py) / 2);
  }

  // Draw Cannon / Launcher Base at launch position
  const [launchX, launchY] = toPx(0, h0);
  const thetaRad = ((params?.angle ?? 45) * Math.PI) / 180;
  ctx.save();
  ctx.translate(launchX, launchY);
  ctx.rotate(-thetaRad);
  ctx.fillStyle = "#6366f1";
  ctx.fillRect(0, -5, 26, 10);
  ctx.strokeStyle = "#818cf8";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, -5, 26, 10);
  ctx.restore();

  // Launcher pivot wheel
  ctx.beginPath();
  ctx.arc(launchX, launchY, 7, 0, Math.PI * 2);
  ctx.fillStyle = "#4338ca";
  ctx.fill();
  ctx.strokeStyle = "#a5b4fc";
  ctx.stroke();

  // Trajectory Path
  if (showTrajectory && trajectoryHistory.length > 1) {
    ctx.save();
    ctx.strokeStyle = "rgba(129, 140, 248, 0.45)";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    trajectoryHistory.forEach((pt, idx) => {
      const [tx, ty] = toPx(pt.x, pt.y);
      if (idx === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    });
    ctx.stroke();
    ctx.restore();
  }

  // Projectile Ball
  const [curX, curY] = toPx(state.x, state.y);

  // Ball glow
  const glow = ctx.createRadialGradient(curX, curY, 2, curX, curY, 16);
  glow.addColorStop(0, "rgba(244, 63, 94, 0.8)");
  glow.addColorStop(1, "rgba(244, 63, 94, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(curX, curY, 16, 0, Math.PI * 2);
  ctx.fill();

  // Ball sphere
  ctx.beginPath();
  ctx.arc(curX, curY, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#f43f5e";
  ctx.fill();
  ctx.strokeStyle = "#ffe4e6";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Live Velocity Vector
  if (showVelocity && !state.isLanded) {
    const vScale = 1.8;
    drawArrow(
      ctx,
      curX,
      curY,
      curX + state.vx * vScale,
      curY - state.vy * vScale,
      "#10b981",
      `v = ${state.speed.toFixed(1)} m/s`
    );
  }

  // Live Acceleration Vector (Gravity + Drag)
  if (showAcceleration && !state.isLanded) {
    const aScale = 2.5;
    drawArrow(
      ctx,
      curX,
      curY,
      curX + state.ax * aScale,
      curY - state.ay * aScale,
      "#f59e0b",
      `a = ${Math.hypot(state.ax, state.ay).toFixed(1)} m/s²`
    );
  }

  // Live Readout HUD
  ctx.fillStyle = "#f8fafc";
  ctx.font = "12px monospace";
  ctx.fillText(
    `x: ${state.x.toFixed(2)} m  |  y: ${state.y.toFixed(2)} m  |  t: ${state.t.toFixed(2)} s`,
    originX,
    groundY + 36
  );
  ctx.restore();
}

// -------------------------------------------------------------
// 2. PENDULUM RENDERER
// -------------------------------------------------------------
function renderPendulum(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: PendulumState,
  params: PendulumParams,
  showVelocity: boolean,
  showForce: boolean
) {
  if (!state) return;

  const pivotX = width / 2;
  const pivotY = 70;
  const L = params?.length ?? 1.5;
  const scale = Math.min((height - 130) / Math.max(1, L), 200);

  const bobX = pivotX + L * Math.sin(state.theta) * scale;
  const bobY = pivotY + L * Math.cos(state.theta) * scale;

  ctx.save();

  // Top mount ceiling
  ctx.fillStyle = "#334155";
  ctx.fillRect(pivotX - 60, pivotY - 14, 120, 14);
  ctx.strokeStyle = "#64748b";
  ctx.strokeRect(pivotX - 60, pivotY - 14, 120, 14);

  // Equilibrium vertical dotted guide
  ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(pivotX, pivotY + L * scale + 20);
  ctx.stroke();
  ctx.setLineDash([]);

  // Angle arc
  const arcRadius = 45;
  ctx.beginPath();
  ctx.arc(
    pivotX,
    pivotY,
    arcRadius,
    Math.PI / 2,
    Math.PI / 2 + state.theta,
    state.theta < 0
  );
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#38bdf8";
  ctx.font = "11px monospace";
  ctx.fillText(`θ = ${state.thetaDeg.toFixed(1)}°`, pivotX + 15, pivotY + arcRadius + 15);

  // Pendulum Rod
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(bobX, bobY);
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Pivot Bearing
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#6366f1";
  ctx.fill();
  ctx.strokeStyle = "#e0e7ff";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bob
  const bobRadius = 14 + Math.min(10, (params?.mass ?? 1) * 2);
  const glow = ctx.createRadialGradient(bobX, bobY, 3, bobX, bobY, bobRadius + 8);
  glow.addColorStop(0, "rgba(56, 189, 248, 0.8)");
  glow.addColorStop(1, "rgba(56, 189, 248, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(bobX, bobY, bobRadius + 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0284c7";
  ctx.fill();
  ctx.strokeStyle = "#e0f2fe";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Live Velocity Vector (Tangent)
  if (showVelocity && state.linearSpeed > 0.05) {
    const vScale = 25;
    drawArrow(
      ctx,
      bobX,
      bobY,
      bobX + state.vx * vScale,
      bobY + state.vy * vScale,
      "#10b981",
      `v = ${state.linearSpeed.toFixed(2)} m/s`
    );
  }

  // Tension Force Vector (towards pivot)
  if (showForce) {
    const tScale = 3;
    const dx = pivotX - bobX;
    const dy = pivotY - bobY;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const ux = dx / dist;
      const uy = dy / dist;
      drawArrow(
        ctx,
        bobX,
        bobY,
        bobX + ux * state.tension * tScale,
        bobY + uy * state.tension * tScale,
        "#a855f7",
        `T = ${state.tension.toFixed(1)} N`
      );
    }
  }

  ctx.restore();
}

// -------------------------------------------------------------
// 3. MASS-SPRING-DAMPER RENDERER
// -------------------------------------------------------------
function renderSpring(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: SpringState,
  params: SpringParams,
  showVelocity: boolean,
  showForce: boolean
) {
  if (!state) return;

  const groundY = height * 0.65;
  const wallX = 80;
  const eqX = width / 2;
  const scale = 250; // pixels per meter

  const blockWidth = 60;
  const blockHeight = 44;
  const blockX = eqX + state.x * scale;
  const blockY = groundY - blockHeight;

  ctx.save();

  // Ground Surface
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(wallX, groundY, width - wallX, 20);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wallX, groundY);
  ctx.lineTo(width, groundY);
  ctx.stroke();

  // Left Solid Wall
  ctx.fillStyle = "#334155";
  ctx.fillRect(wallX - 25, groundY - 140, 25, 160);
  ctx.strokeStyle = "#64748b";
  ctx.strokeRect(wallX - 25, groundY - 140, 25, 160);

  // Equilibrium Marker
  ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(eqX + blockWidth / 2, groundY - 120);
  ctx.lineTo(eqX + blockWidth / 2, groundY + 10);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#818cf8";
  ctx.font = "11px monospace";
  ctx.fillText("x = 0 (Equilibrium)", eqX + blockWidth / 2 - 45, groundY - 125);

  // Coiled Spring (Helical zig-zag)
  const springStartX = wallX;
  const springStartY = groundY - blockHeight / 2;
  const springEndX = blockX;
  const springLen = springEndX - springStartX;
  const coils = 12;
  const coilWidth = springLen / coils;
  const coilHeight = 16;

  ctx.strokeStyle = "#a5b4fc";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(springStartX, springStartY);
  for (let i = 0; i <= coils; i++) {
    const cx = springStartX + i * coilWidth;
    const cy = i === 0 || i === coils ? springStartY : springStartY + (i % 2 === 0 ? -coilHeight : coilHeight);
    ctx.lineTo(cx, cy);
  }
  ctx.stroke();

  // Mass Cart / Block
  ctx.fillStyle = "#4f46e5";
  ctx.fillRect(blockX, blockY, blockWidth, blockHeight);
  ctx.strokeStyle = "#c7d2fe";
  ctx.lineWidth = 2;
  ctx.strokeRect(blockX, blockY, blockWidth, blockHeight);

  // Cart Wheels
  ctx.fillStyle = "#94a3b8";
  ctx.beginPath();
  ctx.arc(blockX + 14, groundY - 3, 6, 0, Math.PI * 2);
  ctx.arc(blockX + blockWidth - 14, groundY - 3, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#cbd5e1";
  ctx.stroke();

  // Mass label on cart
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${params?.mass ?? 1} kg`, blockX + blockWidth / 2, blockY + 26);
  ctx.textAlign = "left";

  // Restoring Force Vector
  if (showForce && Math.abs(state.springForce) > 0.1) {
    const fScale = 2.0;
    drawArrow(
      ctx,
      blockX + blockWidth / 2,
      blockY - 15,
      blockX + blockWidth / 2 + state.springForce * fScale,
      blockY - 15,
      "#ec4899",
      `F_s = ${state.springForce.toFixed(1)} N`
    );
  }

  // Velocity Vector
  if (showVelocity && Math.abs(state.v) > 0.02) {
    const vScale = 25;
    drawArrow(
      ctx,
      blockX + blockWidth / 2,
      blockY + blockHeight / 2,
      blockX + blockWidth / 2 + state.v * vScale,
      blockY + blockHeight / 2,
      "#10b981",
      `v = ${state.v.toFixed(2)} m/s`
    );
  }

  ctx.restore();
}

// -------------------------------------------------------------
// 4. COLLISION RENDERER
// -------------------------------------------------------------
function renderCollision(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: CollisionSimulationState,
  params: CollisionParams,
  showVelocity: boolean
) {
  if (!state) return;

  const trackY = height * 0.6;
  const trackLeft = 50;
  const trackRight = width - 50;
  const trackLength = params?.trackLength ?? 10;
  const pxPerMeter = (trackRight - trackLeft) / trackLength;

  const toPxX = (xMeters: number) => trackLeft + xMeters * pxPerMeter;

  ctx.save();

  // Air Track Bed
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(trackLeft - 15, trackY, trackRight - trackLeft + 30, 24);
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2;
  ctx.strokeRect(trackLeft - 15, trackY, trackRight - trackLeft + 30, 24);

  // Track ruler tick marks
  ctx.fillStyle = "#64748b";
  ctx.font = "10px monospace";
  for (let m = 0; m <= trackLength; m += 1) {
    const tx = toPxX(m);
    ctx.beginPath();
    ctx.moveTo(tx, trackY);
    ctx.lineTo(tx, trackY + 8);
    ctx.strokeStyle = "#64748b";
    ctx.stroke();
    if (m % 2 === 0) {
      ctx.fillText(`${m}m`, tx - 6, trackY + 20);
    }
  }

  // Cart dimensions
  const cWidth = 48;
  const cHeight = 36;

  // Cart 1 (Cyan)
  const c1Px = toPxX(state.cart1.x);
  ctx.fillStyle = "#06b6d4";
  ctx.fillRect(c1Px - cWidth / 2, trackY - cHeight, cWidth, cHeight);
  ctx.strokeStyle = "#a5f3fc";
  ctx.lineWidth = 2;
  ctx.strokeRect(c1Px - cWidth / 2, trackY - cHeight, cWidth, cHeight);
  ctx.fillStyle = "#082f49";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${params?.m1 ?? 1}kg`, c1Px, trackY - cHeight + 22);

  // Cart 2 (Amber)
  const c2Px = toPxX(state.cart2.x);
  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(c2Px - cWidth / 2, trackY - cHeight, cWidth, cHeight);
  ctx.strokeStyle = "#fde68a";
  ctx.strokeRect(c2Px - cWidth / 2, trackY - cHeight, cWidth, cHeight);
  ctx.fillStyle = "#451a03";
  ctx.fillText(`${params?.m2 ?? 2}kg`, c2Px, trackY - cHeight + 22);
  ctx.textAlign = "left";

  // Velocity Vectors
  if (showVelocity) {
    const vScale = 20;
    if (Math.abs(state.cart1.v) > 0.05) {
      drawArrow(
        ctx,
        c1Px,
        trackY - cHeight - 14,
        c1Px + state.cart1.v * vScale,
        trackY - cHeight - 14,
        "#06b6d4",
        `${state.cart1.v.toFixed(2)} m/s`
      );
    }
    if (Math.abs(state.cart2.v) > 0.05) {
      drawArrow(
        ctx,
        c2Px,
        trackY - cHeight - 14,
        c2Px + state.cart2.v * vScale,
        trackY - cHeight - 14,
        "#f59e0b",
        `${state.cart2.v.toFixed(2)} m/s`
      );
    }
  }

  // Collision Impact Flash
  if (state.hasCollided && state.timeOfCollision && state.t - state.timeOfCollision < 0.25) {
    const midX = (c1Px + c2Px) / 2;
    const impactGlow = ctx.createRadialGradient(midX, trackY - cHeight / 2, 2, midX, trackY - cHeight / 2, 45);
    impactGlow.addColorStop(0, "rgba(251, 191, 36, 0.95)");
    impactGlow.addColorStop(1, "rgba(251, 191, 36, 0)");
    ctx.fillStyle = impactGlow;
    ctx.beginPath();
    ctx.arc(midX, trackY - cHeight / 2, 45, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// -------------------------------------------------------------
// 5. ELECTRIC CIRCUIT RENDERER (RLC)
// -------------------------------------------------------------
function renderCircuit(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: CircuitState,
  params: CircuitParams
) {
  if (!state) return;

  const left = 90;
  const right = width - 90;
  const top = 70;
  const bottom = height - 70;

  ctx.save();

  // Schematic Wires (Rectangle loop)
  ctx.strokeStyle = "#38bdf8";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.lineTo(left, bottom);
  ctx.closePath();
  ctx.stroke();

  // Animated Electron Charge Dots flowing along circuit loop
  const totalPerimeter = 2 * (right - left) + 2 * (bottom - top);
  const numElectrons = 28;
  ctx.fillStyle = "#38bdf8";

  for (let i = 0; i < numElectrons; i++) {
    const fraction = (i / numElectrons + state.electronPhase / (2 * Math.PI)) % 1;
    let dist = (fraction < 0 ? fraction + 1 : fraction) * totalPerimeter;

    let ex = left;
    let ey = top;
    const w = right - left;
    const h = bottom - top;

    if (dist < w) {
      ex = left + dist;
      ey = top;
    } else if (dist < w + h) {
      ex = right;
      ey = top + (dist - w);
    } else if (dist < 2 * w + h) {
      ex = right - (dist - (w + h));
      ey = bottom;
    } else {
      ex = left;
      ey = bottom - (dist - (2 * w + h));
    }

    ctx.beginPath();
    ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 1. Voltage Source (Left branch)
  const sourceY = (top + bottom) / 2;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(left - 24, sourceY - 24, 48, 48);
  ctx.beginPath();
  ctx.arc(left, sourceY, 22, 0, Math.PI * 2);
  ctx.fillStyle = "#1e293b";
  ctx.fill();
  ctx.strokeStyle = "#f43f5e";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = "#f43f5e";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(params?.frequency > 0 ? "AC ~" : "DC +", left, sourceY + 4);
  ctx.fillText(`${params?.voltage ?? 12}V`, left - 38, sourceY + 4);

  // 2. Resistor R (Top branch)
  const resX = (left + right) / 2 - 40;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(resX - 25, top - 18, 50, 36);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(resX - 22, top);
  ctx.lineTo(resX - 15, top - 10);
  ctx.lineTo(resX - 5, top + 10);
  ctx.lineTo(resX + 5, top - 10);
  ctx.lineTo(resX + 15, top + 10);
  ctx.lineTo(resX + 22, top);
  ctx.stroke();
  ctx.fillStyle = "#fbbf24";
  ctx.font = "11px monospace";
  ctx.fillText(`R: ${params?.resistance ?? 20} Ω`, resX, top - 20);

  // 3. Inductor L (Right branch)
  const indY = (top + bottom) / 2;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(right - 18, indY - 30, 36, 60);
  ctx.strokeStyle = "#a855f7";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(right, indY - 16, 9, -Math.PI / 2, Math.PI / 2);
  ctx.arc(right, indY, 9, -Math.PI / 2, Math.PI / 2);
  ctx.arc(right, indY + 16, 9, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = "#a855f7";
  ctx.fillText(`L: ${params?.inductance ?? 0.1} H`, right + 36, indY + 4);

  // 4. Capacitor C (Bottom branch)
  const capX = (left + right) / 2;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(capX - 20, bottom - 18, 40, 36);
  ctx.strokeStyle = "#10b981";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(capX - 8, bottom - 14);
  ctx.lineTo(capX - 8, bottom + 14);
  ctx.moveTo(capX + 8, bottom - 14);
  ctx.lineTo(capX + 8, bottom + 14);
  ctx.stroke();
  ctx.fillStyle = "#10b981";
  ctx.fillText(`C: ${params?.capacitance ?? 50} μF`, capX, bottom + 24);

  // Live Multi-meter Center Readout
  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  const boxW = 220;
  const boxH = 90;
  const boxX = (width - boxW) / 2;
  const boxY = (height - boxH) / 2;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = "#334155";
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 12px monospace";
  ctx.fillText(`Current: ${(state.current * 1000).toFixed(1)} mA`, boxX + 16, boxY + 24);
  ctx.fillStyle = "#fde047";
  ctx.fillText(`V_Capacitor: ${state.vCapacitor.toFixed(2)} V`, boxX + 16, boxY + 44);
  ctx.fillStyle = "#a7f3d0";
  ctx.fillText(`V_Resistor: ${state.vResistor.toFixed(2)} V`, boxX + 16, boxY + 64);
  ctx.fillStyle = "#c084fc";
  ctx.fillText(`V_Inductor: ${state.vInductor.toFixed(2)} V`, boxX + 16, boxY + 82);

  ctx.restore();
}

// -------------------------------------------------------------
// 6. INCLINED PLANE RENDERER
// -------------------------------------------------------------
function renderIncline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: InclineState,
  params: InclineParams,
  showVelocity: boolean,
  showForce: boolean
) {
  if (!state) return;

  const groundY = height - 60;
  const originX = 80;
  const rampBaseWidth = width - 180;
  const angleRad = ((params?.angle ?? 30) * Math.PI) / 180;
  const rampHeight = Math.min(height - 120, rampBaseWidth * Math.tan(angleRad));

  const apexX = originX;
  const apexY = groundY - rampHeight;
  const footX = originX + rampBaseWidth;
  const footY = groundY;

  ctx.save();

  // Wedge polygon
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.moveTo(apexX, apexY);
  ctx.lineTo(footX, footY);
  ctx.lineTo(apexX, footY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Angle arc at the base
  ctx.beginPath();
  ctx.arc(footX, footY, 40, Math.PI, Math.PI - angleRad, true);
  ctx.strokeStyle = "#38bdf8";
  ctx.stroke();
  ctx.fillStyle = "#38bdf8";
  ctx.font = "11px monospace";
  ctx.fillText(`α = ${(params?.angle ?? 30).toFixed(1)}°`, footX - 70, footY - 14);

  // Position of block along the hypotenuse
  const rampLength = params?.rampLength ?? 5;
  const fraction = Math.min(1, Math.max(0, state.s / rampLength));
  const blockX = apexX + (footX - apexX) * fraction;
  const blockY = apexY + (footY - apexY) * fraction;

  // Block dimensions
  const bW = 44;
  const bH = 32;

  ctx.save();
  ctx.translate(blockX, blockY);
  ctx.rotate(angleRad);

  // Block body
  ctx.fillStyle = "#e11d48";
  ctx.fillRect(-bW / 2, -bH, bW, bH);
  ctx.strokeStyle = "#fda4af";
  ctx.lineWidth = 2;
  ctx.strokeRect(-bW / 2, -bH, bW, bH);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${params?.mass ?? 5}kg`, 0, -bH / 2 + 4);

  // Force Vectors in Block local/global coordinates
  if (showForce) {
    const fScale = 1.0;
    // Normal force (perpendicular up)
    drawArrow(ctx, 0, -bH / 2, 0, -bH / 2 - state.normalForce * fScale, "#38bdf8", "N");
    // Friction force (parallel backwards)
    drawArrow(ctx, 0, 0, -state.frictionForce * fScale, 0, "#f59e0b", "f_k");
    // Driving gravity parallel (parallel forward)
    drawArrow(ctx, 0, 0, state.gravityParallel * fScale, 0, "#10b981", "mg sin α");
  }

  // Velocity Vector
  if (showVelocity && state.v > 0.05) {
    const vScale = 15;
    drawArrow(ctx, 0, -bH / 2, state.v * vScale, -bH / 2, "#10b981", `v=${state.v.toFixed(1)} m/s`);
  }

  ctx.restore();
  ctx.restore();
}
