export interface CircuitParams {
  voltage: number; // Volts (peak or DC step)
  frequency: number; // Hz (0 = DC step)
  resistance: number; // Ohms (R)
  inductance: number; // Henries (L)
  capacitance: number; // Microfarads (uF)
}

export interface CircuitState {
  t: number;
  sourceVoltage: number; // V_source(t)
  charge: number; // q (Coulombs)
  current: number; // i = dq/dt (Amperes)
  dCurrentDt: number; // di/dt
  vResistor: number; // i * R
  vCapacitor: number; // q / C
  vInductor: number; // L * di/dt
  energyCapacitor: number; // 0.5 * q^2 / C
  energyInductor: number; // 0.5 * L * i^2
  totalEnergy: number;
  electronPhase: number; // for current visual animation [0, 2*pi]
}

export interface CircuitTheoretical {
  resonantFrequencyHz: number; // f0 = 1 / (2*pi*sqrt(L*C))
  qualityFactorQ: number; // Q = (1/R)*sqrt(L/C)
  dampingRatioZeta: number; // zeta = (R/2)*sqrt(C/L)
  dampingRegime: "underdamped (ringing)" | "critically damped" | "overdamped";
  timeConstantTauMs: number;
  reactanceCapacitive: number; // X_C
  reactanceInductive: number; // X_L
  impedanceZ: number; // Z = sqrt(R^2 + (X_L - X_C)^2)
  phaseAngleDeg: number;
}

export function calculateCircuitTheoretical(p: CircuitParams): CircuitTheoretical {
  const R = Math.max(0.01, p.resistance);
  const L = Math.max(1e-6, p.inductance);
  const C = Math.max(1e-9, p.capacitance * 1e-6); // convert uF to F
  const f = p.frequency;

  const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
  const Q = (1 / R) * Math.sqrt(L / C);
  const zeta = (R / 2) * Math.sqrt(C / L);

  let regime: "underdamped (ringing)" | "critically damped" | "overdamped" = "underdamped (ringing)";
  if (Math.abs(zeta - 1) < 0.02) {
    regime = "critically damped";
  } else if (zeta > 1) {
    regime = "overdamped";
  }

  const tauMs = (2 * L) / R * 1000;

  // AC values at driving frequency f
  const omega = 2 * Math.PI * (f > 0 ? f : f0);
  const XL = omega * L;
  const XC = 1 / (omega * C);
  const Z = Math.sqrt(R * R + Math.pow(XL - XC, 2));
  const phaseAngleDeg = (Math.atan2(XL - XC, R) * 180) / Math.PI;

  return {
    resonantFrequencyHz: f0,
    qualityFactorQ: Q,
    dampingRatioZeta: zeta,
    dampingRegime: regime,
    timeConstantTauMs: tauMs,
    reactanceCapacitive: XC,
    reactanceInductive: XL,
    impedanceZ: Z,
    phaseAngleDeg,
  };
}

export function createInitialCircuitState(params: CircuitParams): CircuitState {
  const Vin = params.frequency > 0 ? 0 : params.voltage;
  return {
    t: 0,
    sourceVoltage: Vin,
    charge: 0,
    current: 0,
    dCurrentDt: 0,
    vResistor: 0,
    vCapacitor: 0,
    vInductor: Vin,
    energyCapacitor: 0,
    energyInductor: 0,
    totalEnergy: 0,
    electronPhase: 0,
  };
}

/**
 * Solve RLC circuit:
 * L * d^2(q)/dt^2 + R * dq/dt + (1/C)*q = V_in(t)
 * dq/dt = i
 * di/dt = (V_in(t) - R*i - q/C) / L
 */
export function stepCircuit(
  state: CircuitState,
  params: CircuitParams,
  dt: number
): CircuitState {
  const R = Math.max(0.01, params.resistance);
  const L = Math.max(1e-6, params.inductance);
  const C = Math.max(1e-9, params.capacitance * 1e-6);

  const getVin = (t: number): number => {
    if (params.frequency <= 0) {
      return params.voltage; // DC Step
    }
    return params.voltage * Math.sin(2 * Math.PI * params.frequency * t);
  };

  const getDiDt = (q: number, i: number, t: number): number => {
    const vin = getVin(t);
    return (vin - R * i - q / C) / L;
  };

  // RK4 on [q, i]
  const k1_q = state.current * dt;
  const k1_i = getDiDt(state.charge, state.current, state.t) * dt;

  const k2_q = (state.current + 0.5 * k1_i) * dt;
  const k2_i = getDiDt(state.charge + 0.5 * k1_q, state.current + 0.5 * k1_i, state.t + 0.5 * dt) * dt;

  const k3_q = (state.current + 0.5 * k2_i) * dt;
  const k3_i = getDiDt(state.charge + 0.5 * k2_q, state.current + 0.5 * k2_i, state.t + 0.5 * dt) * dt;

  const k4_q = (state.current + k3_i) * dt;
  const k4_i = getDiDt(state.charge + k3_q, state.current + k3_i, state.t + dt) * dt;

  const nextQ = state.charge + (k1_q + 2 * k2_q + 2 * k3_q + k4_q) / 6;
  const nextI = state.current + (k1_i + 2 * k2_i + 2 * k3_i + k4_i) / 6;
  const nextT = state.t + dt;
  const nextDiDt = getDiDt(nextQ, nextI, nextT);
  const nextVin = getVin(nextT);

  const Vr = nextI * R;
  const Vc = nextQ / C;
  const Vl = L * nextDiDt;

  const Ec = 0.5 * (nextQ * nextQ) / C;
  const El = 0.5 * L * nextI * nextI;

  const speedScale = 50;
  const nextElectronPhase = (state.electronPhase + nextI * speedScale * dt) % (2 * Math.PI);

  return {
    t: nextT,
    sourceVoltage: nextVin,
    charge: nextQ,
    current: nextI,
    dCurrentDt: nextDiDt,
    vResistor: Vr,
    vCapacitor: Vc,
    vInductor: Vl,
    energyCapacitor: Ec,
    energyInductor: El,
    totalEnergy: Ec + El,
    electronPhase: nextElectronPhase,
  };
}
