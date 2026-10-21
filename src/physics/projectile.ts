export interface ProjectileParams {
  v0: number; // m/s
  angle: number; // degrees
  h0: number; // initial height, m
  g: number; // gravity, m/s^2 (default 9.81)
  mass: number; // kg
  dragCoeff: number; // air drag coefficient b where F_drag = -b*v^2
  wind: number; // horizontal wind velocity m/s
}

export interface ProjectileState {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  speed: number;
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
  isLanded: boolean;
}

export interface ProjectileTheoretical {
  timeOfFlightNoDrag: number;
  maxHeightNoDrag: number;
  rangeNoDrag: number;
  timeToApexNoDrag: number;
  impactSpeedNoDrag: number;
  impactAngleNoDrag: number;
}

export function calculateProjectileTheoretical(p: ProjectileParams): ProjectileTheoretical {
  const theta = (p.angle * Math.PI) / 180;
  const v0x = p.v0 * Math.cos(theta);
  const v0y = p.v0 * Math.sin(theta);
  const g = Math.max(0.001, p.g);

  const timeToApex = Math.max(0, v0y / g);
  const maxHeight = p.h0 + (v0y * v0y) / (2 * g);

  // Time of flight: y(t) = h0 + v0y*t - 0.5*g*t^2 = 0
  // 0.5*g*t^2 - v0y*t - h0 = 0
  const disc = v0y * v0y + 2 * g * p.h0;
  const timeOfFlight = (v0y + Math.sqrt(Math.max(0, disc))) / g;
  const range = v0x * timeOfFlight;
  const impactSpeed = Math.sqrt(p.v0 * p.v0 + 2 * g * p.h0);
  const vyImpact = -Math.sqrt(Math.max(0, disc));
  const impactAngle = (Math.atan2(vyImpact, v0x) * 180) / Math.PI;

  return {
    timeOfFlightNoDrag: timeOfFlight,
    maxHeightNoDrag: maxHeight,
    rangeNoDrag: range,
    timeToApexNoDrag: timeToApex,
    impactSpeedNoDrag: impactSpeed,
    impactAngleNoDrag: impactAngle,
  };
}

/**
 * Step simulation using 4th order Runge-Kutta for accurate aerodynamics
 */
export function stepProjectile(
  state: ProjectileState,
  params: ProjectileParams,
  dt: number
): ProjectileState {
  if (state.isLanded) {
    return state;
  }

  const { g, mass, dragCoeff, wind } = params;
  const m = Math.max(0.001, mass);

  // Acceleration function:
  const getAcc = (vx: number, vy: number): [number, number] => {
    const relVx = vx - wind;
    const relVy = vy;
    const relSpeed = Math.hypot(relVx, relVy);
    const dragForce = dragCoeff * relSpeed * relSpeed;

    const dragAx = relSpeed > 1e-6 ? -(dragForce * (relVx / relSpeed)) / m : 0;
    const dragAy = relSpeed > 1e-6 ? -(dragForce * (relVy / relSpeed)) / m : 0;

    const ax = dragAx;
    const ay = -g + dragAy;
    return [ax, ay];
  };

  // RK4
  // k1
  const [ax1, ay1] = getAcc(state.vx, state.vy);
  const k1_vx = ax1 * dt;
  const k1_vy = ay1 * dt;
  const k1_x = state.vx * dt;
  const k1_y = state.vy * dt;

  // k2
  const [ax2, ay2] = getAcc(state.vx + 0.5 * k1_vx, state.vy + 0.5 * k1_vy);
  const k2_vx = ax2 * dt;
  const k2_vy = ay2 * dt;
  const k2_x = (state.vx + 0.5 * k1_vx) * dt;
  const k2_y = (state.vy + 0.5 * k1_vy) * dt;

  // k3
  const [ax3, ay3] = getAcc(state.vx + 0.5 * k2_vx, state.vy + 0.5 * k2_vy);
  const k3_vx = ax3 * dt;
  const k3_vy = ay3 * dt;
  const k3_x = (state.vx + 0.5 * k2_vx) * dt;
  const k3_y = (state.vy + 0.5 * k2_vy) * dt;

  // k4
  const [ax4, ay4] = getAcc(state.vx + k3_vx, state.vy + k3_vy);
  const k4_vx = ax4 * dt;
  const k4_vy = ay4 * dt;
  const k4_x = (state.vx + k3_vx) * dt;
  const k4_y = (state.vy + k3_vy) * dt;

  let nextX = state.x + (k1_x + 2 * k2_x + 2 * k3_x + k4_x) / 6;
  let nextY = state.y + (k1_y + 2 * k2_y + 2 * k3_y + k4_y) / 6;
  let nextVx = state.vx + (k1_vx + 2 * k2_vx + 2 * k3_vx + k4_vx) / 6;
  let nextVy = state.vy + (k1_vy + 2 * k2_vy + 2 * k3_vy + k4_vy) / 6;
  const nextT = state.t + dt;

  let landed = false;
  if (nextY <= 0) {
    landed = true;
    // Linear interpolation to exact ground impact point
    if (state.vy !== 0) {
      const frac = -state.y / (nextY - state.y || 1);
      nextX = state.x + (nextX - state.x) * Math.min(1, Math.max(0, frac));
    }
    nextY = 0;
    nextVx = 0;
    nextVy = 0;
  }

  const [finalAx, finalAy] = landed ? [0, 0] : getAcc(nextVx, nextVy);
  const speed = Math.hypot(nextVx, nextVy);
  const ke = 0.5 * m * speed * speed;
  const pe = m * g * Math.max(0, nextY);

  return {
    t: nextT,
    x: nextX,
    y: nextY,
    vx: nextVx,
    vy: nextVy,
    ax: finalAx,
    ay: finalAy,
    speed,
    kineticEnergy: ke,
    potentialEnergy: pe,
    totalEnergy: ke + pe,
    isLanded: landed,
  };
}

export function createInitialProjectileState(params: ProjectileParams): ProjectileState {
  const theta = (params.angle * Math.PI) / 180;
  const vx = params.v0 * Math.cos(theta);
  const vy = params.v0 * Math.sin(theta);
  const m = Math.max(0.001, params.mass);
  const speed = params.v0;
  const ke = 0.5 * m * speed * speed;
  const pe = m * params.g * params.h0;

  return {
    t: 0,
    x: 0,
    y: params.h0,
    vx,
    vy,
    ax: 0,
    ay: -params.g,
    speed,
    kineticEnergy: ke,
    potentialEnergy: pe,
    totalEnergy: ke + pe,
    isLanded: false,
  };
}
