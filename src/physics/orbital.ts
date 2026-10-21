export interface OrbitalParams {
  altitudeKm: number; // orbital altitude above surface (e.g. 400 km for ISS)
  orbitalSpeedKmS: number; // speed in km/s (e.g. 7.67 km/s)
  centralMassKg: number; // e.g. 5.972e24 (Earth)
  planetRadiusKm: number; // e.g. 6371 km
}

export interface OrbitalState {
  t: number;
  x: number; // km
  y: number; // km
  vx: number; // km/s
  vy: number; // km/s
  r: number; // distance from center (km)
  speed: number; // km/s
  eccentricity: number;
  orbitalPeriodSec: number;
  crashed: boolean;
}

export interface OrbitalTheoretical {
  circularVelocityKmS: number;
  escapeVelocityKmS: number;
  semiMajorAxisKm: number;
  periodMinutes: number;
  perigeeAltitudeKm: number;
  apogeeAltitudeKm: number;
  orbitType: "Circular" | "Elliptical" | "Parabolic / Escape" | "Suborbital Crash";
}

const G_KM = 6.6743e-20; // G in km^3 / (kg * s^2)

export function calculateOrbitalTheoretical(p: OrbitalParams): OrbitalTheoretical {
  const r0 = p.planetRadiusKm + p.altitudeKm;
  const mu = G_KM * p.centralMassKg; // km^3 / s^2
  const vCirc = Math.sqrt(mu / r0);
  const vEsc = Math.sqrt((2 * mu) / r0);
  const v0 = p.orbitalSpeedKmS;

  // Specific orbital energy: epsilon = v^2/2 - mu/r
  const epsilon = (v0 * v0) / 2 - mu / r0;
  // Specific angular momentum: h = r0 * v0 (assuming perpendicular launch)
  const h = r0 * v0;
  // Eccentricity: e = sqrt(1 + 2*epsilon*h^2 / mu^2)
  const eTerm = 1 + (2 * epsilon * h * h) / (mu * mu);
  const e = Math.sqrt(Math.max(0, eTerm));

  // Semi-major axis: a = -mu / (2*epsilon)
  const a = epsilon < 0 ? -mu / (2 * epsilon) : Infinity;
  const periodSec = a < Infinity ? 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / mu) : Infinity;

  const rp = a < Infinity ? a * (1 - e) : r0;
  const ra = a < Infinity ? a * (1 + e) : Infinity;

  let type: OrbitalTheoretical["orbitType"] = "Elliptical";
  if (rp < p.planetRadiusKm) {
    type = "Suborbital Crash";
  } else if (Math.abs(e) < 0.01) {
    type = "Circular";
  } else if (e >= 1) {
    type = "Parabolic / Escape";
  }

  return {
    circularVelocityKmS: vCirc,
    escapeVelocityKmS: vEsc,
    semiMajorAxisKm: a,
    periodMinutes: periodSec / 60,
    perigeeAltitudeKm: rp - p.planetRadiusKm,
    apogeeAltitudeKm: ra < Infinity ? ra - p.planetRadiusKm : Infinity,
    orbitType: type,
  };
}

export function createInitialOrbitalState(params: OrbitalParams): OrbitalState {
  const r0 = params.planetRadiusKm + params.altitudeKm;
  const theo = calculateOrbitalTheoretical(params);
  return {
    t: 0,
    x: 0,
    y: r0,
    vx: params.orbitalSpeedKmS,
    vy: 0,
    r: r0,
    speed: params.orbitalSpeedKmS,
    eccentricity: Math.abs(params.orbitalSpeedKmS / theo.circularVelocityKmS - 1),
    orbitalPeriodSec: theo.periodMinutes * 60,
    crashed: false,
  };
}

export function stepOrbital(
  state: OrbitalState,
  params: OrbitalParams,
  dt: number
): OrbitalState {
  if (state.crashed) return state;

  const mu = G_KM * params.centralMassKg;

  const getAcc = (x: number, y: number): [number, number] => {
    const r = Math.hypot(x, y);
    if (r < 1) return [0, 0];
    const aMag = -mu / (r * r);
    return [(aMag * x) / r, (aMag * y) / r];
  };

  // RK4
  const [ax1, ay1] = getAcc(state.x, state.y);
  const k1_vx = ax1 * dt;
  const k1_vy = ay1 * dt;
  const k1_x = state.vx * dt;
  const k1_y = state.vy * dt;

  const [ax2, ay2] = getAcc(state.x + 0.5 * k1_x, state.y + 0.5 * k1_y);
  const k2_vx = ax2 * dt;
  const k2_vy = ay2 * dt;
  const k2_x = (state.vx + 0.5 * k1_vx) * dt;
  const k2_y = (state.vy + 0.5 * k1_vy) * dt;

  const [ax3, ay3] = getAcc(state.x + 0.5 * k2_x, state.y + 0.5 * k2_y);
  const k3_vx = ax3 * dt;
  const k3_vy = ay3 * dt;
  const k3_x = (state.vx + 0.5 * k2_vx) * dt;
  const k3_y = (state.vy + 0.5 * k2_vy) * dt;

  const [ax4, ay4] = getAcc(state.x + k3_x, state.y + k3_y);
  const k4_vx = ax4 * dt;
  const k4_vy = ay4 * dt;
  const k4_x = (state.vx + k3_vx) * dt;
  const k4_y = (state.vy + k3_vy) * dt;

  const nextX = state.x + (k1_x + 2 * k2_x + 2 * k3_x + k4_x) / 6;
  const nextY = state.y + (k1_y + 2 * k2_y + 2 * k3_y + k4_y) / 6;
  const nextVx = state.vx + (k1_vx + 2 * k2_vx + 2 * k3_vx + k4_vx) / 6;
  const nextVy = state.vy + (k1_vy + 2 * k2_vy + 2 * k3_vy + k4_vy) / 6;

  const nextR = Math.hypot(nextX, nextY);
  const crashed = nextR <= params.planetRadiusKm;

  return {
    t: state.t + dt,
    x: nextX,
    y: nextY,
    vx: crashed ? 0 : nextVx,
    vy: crashed ? 0 : nextVy,
    r: nextR,
    speed: crashed ? 0 : Math.hypot(nextVx, nextVy),
    eccentricity: state.eccentricity,
    orbitalPeriodSec: state.orbitalPeriodSec,
    crashed,
  };
}
