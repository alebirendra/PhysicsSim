export interface InclineParams {
  angle: number; // degrees
  mass: number; // kg
  staticFriction: number; // mu_s
  kineticFriction: number; // mu_k
  rampLength: number; // m
  g: number; // m/s^2
}

export interface InclineState {
  t: number;
  s: number; // distance traveled down ramp (m, from 0 to rampLength)
  v: number; // velocity down ramp (m/s)
  a: number; // acceleration down ramp (m/s^2)
  isSliding: boolean;
  reachedBottom: boolean;
  gravityParallel: number; // m*g*sin(theta) (N)
  normalForce: number; // m*g*cos(theta) (N)
  frictionForce: number; // static or kinetic friction (N)
  netForce: number; // F_parallel - friction (N)
  kineticEnergy: number;
  potentialEnergy: number; // m*g*(rampLength - s)*sin(theta)
  totalEnergy: number;
}

export interface InclineTheoretical {
  criticalAngleDeg: number; // theta_crit = atan(mu_s)
  willSlide: boolean;
  theoreticalAcceleration: number; // a = g*(sin(theta) - mu_k*cos(theta))
  timeToBottom: number; // t = sqrt(2*L / a)
  velocityAtBottom: number; // v = sqrt(2*a*L)
}

export function calculateInclineTheoretical(p: InclineParams): InclineTheoretical {
  const thetaRad = (p.angle * Math.PI) / 180;
  const g = p.g;
  const sin = Math.sin(thetaRad);
  const cos = Math.cos(thetaRad);

  const critAngleDeg = (Math.atan(p.staticFriction) * 180) / Math.PI;
  const willSlide = p.angle > critAngleDeg;

  let a = 0;
  if (willSlide) {
    a = Math.max(0, g * (sin - p.kineticFriction * cos));
  }

  const timeToBottom = a > 0 ? Math.sqrt((2 * p.rampLength) / a) : Infinity;
  const vBottom = a > 0 ? Math.sqrt(2 * a * p.rampLength) : 0;

  return {
    criticalAngleDeg: critAngleDeg,
    willSlide,
    theoreticalAcceleration: a,
    timeToBottom,
    velocityAtBottom: vBottom,
  };
}

export function createInitialInclineState(params: InclineParams): InclineState {
  const thetaRad = (params.angle * Math.PI) / 180;
  const sin = Math.sin(thetaRad);
  const cos = Math.cos(thetaRad);
  const m = params.mass;
  const g = params.g;

  const F_par = m * g * sin;
  const N = m * g * cos;
  const maxFs = params.staticFriction * N;

  const isSliding = F_par > maxFs;
  const friction = isSliding ? params.kineticFriction * N : F_par;
  const netForce = isSliding ? Math.max(0, F_par - friction) : 0;
  const a0 = netForce / m;

  const pe = m * g * params.rampLength * sin;

  return {
    t: 0,
    s: 0,
    v: 0,
    a: a0,
    isSliding,
    reachedBottom: false,
    gravityParallel: F_par,
    normalForce: N,
    frictionForce: friction,
    netForce,
    kineticEnergy: 0,
    potentialEnergy: pe,
    totalEnergy: pe,
  };
}

export function stepIncline(
  state: InclineState,
  params: InclineParams,
  dt: number
): InclineState {
  if (state.reachedBottom) {
    return state;
  }

  const thetaRad = (params.angle * Math.PI) / 180;
  const sin = Math.sin(thetaRad);
  const cos = Math.cos(thetaRad);
  const m = params.mass;
  const g = params.g;

  const F_par = m * g * sin;
  const N = m * g * cos;
  const maxFs = params.staticFriction * N;

  const willMove = state.v > 0 || F_par > maxFs;
  let a = 0;
  let friction = F_par;
  let netForce = 0;

  if (willMove) {
    friction = params.kineticFriction * N;
    netForce = Math.max(0, F_par - friction);
    a = netForce / m;
  }

  let nextV = state.v + a * dt;
  let nextS = state.s + nextV * dt;
  let reached = false;

  if (nextS >= params.rampLength) {
    nextS = params.rampLength;
    reached = true;
  }

  const nextT = state.t + dt;
  const ke = 0.5 * m * nextV * nextV;
  const pe = m * g * Math.max(0, params.rampLength - nextS) * sin;

  return {
    t: nextT,
    s: nextS,
    v: reached ? nextV : nextV,
    a: reached ? 0 : a,
    isSliding: willMove,
    reachedBottom: reached,
    gravityParallel: F_par,
    normalForce: N,
    frictionForce: friction,
    netForce: reached ? 0 : netForce,
    kineticEnergy: ke,
    potentialEnergy: pe,
    totalEnergy: ke + pe,
  };
}
