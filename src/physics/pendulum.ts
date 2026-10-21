export interface PendulumParams {
  length: number; // m
  mass: number; // kg
  initialAngle: number; // degrees
  g: number; // m/s^2 (default 9.81)
  damping: number; // b (damping coefficient N*s/m)
}

export interface PendulumState {
  t: number;
  theta: number; // radians
  thetaDeg: number; // degrees
  omega: number; // angular velocity rad/s
  alpha: number; // angular acceleration rad/s^2
  x: number; // bob Cartesian x (pivot at 0,0)
  y: number; // bob Cartesian y (downward is negative)
  vx: number; // linear velocity x
  vy: number; // linear velocity y
  linearSpeed: number;
  tension: number; // Tension force in string (N)
  kineticEnergy: number;
  potentialEnergy: number;
  totalEnergy: number;
}

export interface PendulumTheoretical {
  smallAnglePeriod: number; // T0 = 2*pi*sqrt(L/g)
  largeAnglePeriod: number; // Legendre/Carvalhaes approximation
  naturalFrequencyHz: number;
  maxSpeedTheoretical: number;
}

export function calculatePendulumTheoretical(p: PendulumParams): PendulumTheoretical {
  const g = Math.max(0.001, p.g);
  const L = Math.max(0.01, p.length);
  const theta0Rad = (p.initialAngle * Math.PI) / 180;

  const t0 = 2 * Math.PI * Math.sqrt(L / g);
  // Large angle correction up to 4th order: T = T0 * (1 + 1/16 * theta0^2 + 11/3072 * theta0^4)
  const correction = 1 + (1 / 16) * Math.pow(theta0Rad, 2) + (11 / 3072) * Math.pow(theta0Rad, 4);
  const tLarge = t0 * correction;
  const f0 = 1 / t0;
  // Max speed at lowest point from energy conservation: m*g*L*(1 - cos(theta0)) = 0.5*m*v_max^2
  const maxSpeed = Math.sqrt(2 * g * L * Math.max(0, 1 - Math.cos(theta0Rad)));

  return {
    smallAnglePeriod: t0,
    largeAnglePeriod: tLarge,
    naturalFrequencyHz: f0,
    maxSpeedTheoretical: maxSpeed,
  };
}

export function createInitialPendulumState(params: PendulumParams): PendulumState {
  const thetaRad = (params.initialAngle * Math.PI) / 180;
  const L = params.length;
  const m = params.mass;
  const g = params.g;

  const x = L * Math.sin(thetaRad);
  const y = -L * Math.cos(thetaRad);
  const pe = m * g * (L - L * Math.cos(thetaRad)); // Reference U=0 at bottom

  return {
    t: 0,
    theta: thetaRad,
    thetaDeg: params.initialAngle,
    omega: 0,
    alpha: -(g / L) * Math.sin(thetaRad),
    x,
    y,
    vx: 0,
    vy: 0,
    linearSpeed: 0,
    tension: m * g * Math.cos(thetaRad),
    kineticEnergy: 0,
    potentialEnergy: pe,
    totalEnergy: pe,
  };
}

/**
 * RK4 step for nonlinear damped pendulum equation:
 * d^2(theta)/dt^2 = - (g/L)*sin(theta) - (damping / (m*L))*omega
 */
export function stepPendulum(
  state: PendulumState,
  params: PendulumParams,
  dt: number
): PendulumState {
  const { length, mass, g, damping } = params;
  const L = Math.max(0.01, length);
  const m = Math.max(0.001, mass);
  const gamma = damping / (m * L);

  const getAlpha = (theta: number, omega: number): number => {
    return -(g / L) * Math.sin(theta) - gamma * omega;
  };

  // k1
  const k1_theta = state.omega * dt;
  const k1_omega = getAlpha(state.theta, state.omega) * dt;

  // k2
  const k2_theta = (state.omega + 0.5 * k1_omega) * dt;
  const k2_omega = getAlpha(state.theta + 0.5 * k1_theta, state.omega + 0.5 * k1_omega) * dt;

  // k3
  const k3_theta = (state.omega + 0.5 * k2_omega) * dt;
  const k3_omega = getAlpha(state.theta + 0.5 * k2_theta, state.omega + 0.5 * k2_omega) * dt;

  // k4
  const k4_theta = (state.omega + k3_omega) * dt;
  const k4_omega = getAlpha(state.theta + k3_theta, state.omega + k3_omega) * dt;

  const nextTheta = state.theta + (k1_theta + 2 * k2_theta + 2 * k3_theta + k4_theta) / 6;
  const nextOmega = state.omega + (k1_omega + 2 * k2_omega + 2 * k3_omega + k4_omega) / 6;
  const nextAlpha = getAlpha(nextTheta, nextOmega);
  const nextT = state.t + dt;

  const x = L * Math.sin(nextTheta);
  const y = -L * Math.cos(nextTheta);
  // Linear velocity: v = L * omega in direction perpendicular to rod
  const vx = L * nextOmega * Math.cos(nextTheta);
  const vy = L * nextOmega * Math.sin(nextTheta);
  const speed = Math.abs(L * nextOmega);

  const ke = 0.5 * m * speed * speed;
  const pe = m * g * (L - L * Math.cos(nextTheta));
  // Tension = m*(g*cos(theta) + L*omega^2)
  const tension = m * (g * Math.cos(nextTheta) + L * nextOmega * nextOmega);

  return {
    t: nextT,
    theta: nextTheta,
    thetaDeg: (nextTheta * 180) / Math.PI,
    omega: nextOmega,
    alpha: nextAlpha,
    x,
    y,
    vx,
    vy,
    linearSpeed: speed,
    tension: Math.max(0, tension),
    kineticEnergy: ke,
    potentialEnergy: pe,
    totalEnergy: ke + pe,
  };
}
