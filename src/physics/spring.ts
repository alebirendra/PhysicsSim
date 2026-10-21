export interface SpringParams {
  mass: number; // kg
  springConstant: number; // k (N/m)
  damping: number; // c (N*s/m)
  initialDisplacement: number; // x0 (m)
  initialVelocity: number; // v0 (m/s)
  driveAmplitude: number; // F0 (N)
  driveFrequency: number; // omega_d (rad/s)
}

export interface SpringState {
  t: number;
  x: number; // position from equilibrium (m)
  v: number; // velocity (m/s)
  a: number; // acceleration (m/s^2)
  springForce: number; // -k*x (N)
  dampingForce: number; // -c*v (N)
  externalForce: number; // F0*cos(omega*t) (N)
  kineticEnergy: number; // 0.5*m*v^2
  potentialEnergy: number; // 0.5*k*x^2
  totalEnergy: number;
}

export interface SpringTheoretical {
  naturalFrequencyRad: number; // omega0 = sqrt(k/m)
  naturalFrequencyHz: number; // f0 = omega0 / (2*pi)
  dampingRatio: number; // zeta = c / (2*sqrt(k*m))
  dampingRegime: "underdamped" | "critically damped" | "overdamped";
  dampedFrequencyRad: number; // omega_d = omega0 * sqrt(1 - zeta^2)
  periodSec: number;
  qualityFactorQ: number;
}

export function calculateSpringTheoretical(p: SpringParams): SpringTheoretical {
  const m = Math.max(0.001, p.mass);
  const k = Math.max(0.01, p.springConstant);
  const c = Math.max(0, p.damping);

  const omega0 = Math.sqrt(k / m);
  const zeta = c / (2 * Math.sqrt(k * m));
  const f0 = omega0 / (2 * Math.PI);
  const Q = 1 / (2 * Math.max(0.001, zeta));

  let regime: "underdamped" | "critically damped" | "overdamped" = "underdamped";
  let omegaD = omega0;
  if (Math.abs(zeta - 1) < 0.01) {
    regime = "critically damped";
    omegaD = 0;
  } else if (zeta > 1) {
    regime = "overdamped";
    omegaD = 0;
  } else {
    regime = "underdamped";
    omegaD = omega0 * Math.sqrt(1 - zeta * zeta);
  }

  const period = omegaD > 0 ? (2 * Math.PI) / omegaD : (2 * Math.PI) / omega0;

  return {
    naturalFrequencyRad: omega0,
    naturalFrequencyHz: f0,
    dampingRatio: zeta,
    dampingRegime: regime,
    dampedFrequencyRad: omegaD,
    periodSec: period,
    qualityFactorQ: Q,
  };
}

export function createInitialSpringState(params: SpringParams): SpringState {
  const m = Math.max(0.001, params.mass);
  const x0 = params.initialDisplacement;
  const v0 = params.initialVelocity;
  const Fs = -params.springConstant * x0;
  const Fd = -params.damping * v0;
  const Fext = params.driveAmplitude;
  const a0 = (Fs + Fd + Fext) / m;

  const ke = 0.5 * m * v0 * v0;
  const pe = 0.5 * params.springConstant * x0 * x0;

  return {
    t: 0,
    x: x0,
    v: v0,
    a: a0,
    springForce: Fs,
    dampingForce: Fd,
    externalForce: Fext,
    kineticEnergy: ke,
    potentialEnergy: pe,
    totalEnergy: ke + pe,
  };
}

export function stepSpring(
  state: SpringState,
  params: SpringParams,
  dt: number
): SpringState {
  const m = Math.max(0.001, params.mass);
  const k = params.springConstant;
  const c = params.damping;
  const F0 = params.driveAmplitude;
  const omegaD = params.driveFrequency;

  const getAcc = (x: number, v: number, t: number): number => {
    const Fext = F0 * Math.cos(omegaD * t);
    return (-k * x - c * v + Fext) / m;
  };

  // RK4
  const k1_x = state.v * dt;
  const k1_v = getAcc(state.x, state.v, state.t) * dt;

  const k2_x = (state.v + 0.5 * k1_v) * dt;
  const k2_v = getAcc(state.x + 0.5 * k1_x, state.v + 0.5 * k1_v, state.t + 0.5 * dt) * dt;

  const k3_x = (state.v + 0.5 * k2_v) * dt;
  const k3_v = getAcc(state.x + 0.5 * k2_x, state.v + 0.5 * k2_v, state.t + 0.5 * dt) * dt;

  const k4_x = (state.v + k3_v) * dt;
  const k4_v = getAcc(state.x + k3_x, state.v + k3_v, state.t + dt) * dt;

  const nextX = state.x + (k1_x + 2 * k2_x + 2 * k3_x + k4_x) / 6;
  const nextV = state.v + (k1_v + 2 * k2_v + 2 * k3_v + k4_v) / 6;
  const nextT = state.t + dt;
  const nextA = getAcc(nextX, nextV, nextT);

  const Fs = -k * nextX;
  const Fd = -c * nextV;
  const Fext = F0 * Math.cos(omegaD * nextT);

  const ke = 0.5 * m * nextV * nextV;
  const pe = 0.5 * k * nextX * nextX;

  return {
    t: nextT,
    x: nextX,
    v: nextV,
    a: nextA,
    springForce: Fs,
    dampingForce: Fd,
    externalForce: Fext,
    kineticEnergy: ke,
    potentialEnergy: pe,
    totalEnergy: ke + pe,
  };
}
