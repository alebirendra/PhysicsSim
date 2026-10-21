import test from "node:test";
import assert from "node:assert/strict";
import { calculateProjectileTheoretical, stepProjectile, createInitialProjectileState } from "./projectile.ts";
import { calculatePendulumTheoretical, stepPendulum, createInitialPendulumState } from "./pendulum.ts";
import { calculateSpringTheoretical, stepSpring, createInitialSpringState } from "./spring.ts";
import { calculateCollisionTheoretical, stepCollision, createInitialCollisionState } from "./collision.ts";
import { calculateCircuitTheoretical, stepCircuit, createInitialCircuitState } from "./circuit.ts";
import { calculateInclineTheoretical, stepIncline, createInitialInclineState } from "./incline.ts";
import { recalculatePredictions } from "./solver.ts";

test("Projectile: theoretical calculations match kinematics formulas", () => {
  const p = {
    v0: 20,
    angle: 45,
    h0: 0,
    g: 9.8,
    mass: 1.0,
    dragCoeff: 0,
    wind: 0,
  };
  const theo = calculateProjectileTheoretical(p);

  // v0y = 20 * sin(45) = 14.142
  // t_apex = 14.142 / 9.8 = 1.443 s
  // t_flight = 2 * 1.443 = 2.886 s
  // Range = 20 * cos(45) * 2.886 = 40.816 m (or v0^2/g = 400 / 9.8 = 40.816 m)
  // Hmax = v0y^2 / (2g) = 200 / 19.6 = 10.204 m
  assert.ok(Math.abs(theo.rangeNoDrag - 40.816) < 0.1, `Expected range ~40.82m, got ${theo.rangeNoDrag}`);
  assert.ok(Math.abs(theo.maxHeightNoDrag - 10.204) < 0.1, `Expected Hmax ~10.20m, got ${theo.maxHeightNoDrag}`);
  assert.ok(Math.abs(theo.timeOfFlightNoDrag - 2.886) < 0.1, `Expected T_flight ~2.89s, got ${theo.timeOfFlightNoDrag}`);
});

test("Projectile: numerical RK4 simulation lands within 1% of analytical range in vacuum", () => {
  const p = {
    v0: 20,
    angle: 45,
    h0: 0,
    g: 9.8,
    mass: 1.0,
    dragCoeff: 0,
    wind: 0,
  };
  let state = createInitialProjectileState(p);
  const dt = 0.01;
  while (!state.isLanded && state.t < 5) {
    state = stepProjectile(state, p, dt);
  }

  assert.ok(state.isLanded, "Projectile must land");
  assert.ok(Math.abs(state.x - 40.82) < 0.5, `Numerical landing x (${state.x}) should be close to 40.82m`);
});

test("Pendulum: small-angle formula matches theoretical period", () => {
  const p = {
    length: 1.0,
    mass: 1.0,
    initialAngle: 10,
    g: 9.81,
    damping: 0,
  };
  const theo = calculatePendulumTheoretical(p);
  // T0 = 2*pi*sqrt(1 / 9.81) = 2.006 s
  assert.ok(Math.abs(theo.smallAnglePeriod - 2.006) < 0.05, `Expected T0 ~2.006s, got ${theo.smallAnglePeriod}`);
  // 10 deg is small, so largeAnglePeriod is within 0.2% of T0
  assert.ok(Math.abs(theo.largeAnglePeriod - theo.smallAnglePeriod) < 0.02);
});

test("Spring: natural frequency and energy conservation in undamped oscillator", () => {
  const p = {
    mass: 1.0,
    springConstant: 100,
    damping: 0,
    initialDisplacement: 0.1,
    initialVelocity: 0,
    driveAmplitude: 0,
    driveFrequency: 0,
  };
  const theo = calculateSpringTheoretical(p);
  // omega0 = sqrt(100/1) = 10 rad/s -> f0 = 10 / (2*pi) = 1.5915 Hz
  assert.ok(Math.abs(theo.naturalFrequencyRad - 10) < 0.01);
  assert.ok(Math.abs(theo.naturalFrequencyHz - 1.5915) < 0.01);

  // Step 1 full second and verify total mechanical energy remains E = 0.5 * k * x0^2 = 0.5 * 100 * 0.01 = 0.5 J
  let state = createInitialSpringState(p);
  const initialEnergy = state.totalEnergy;
  const dt = 0.005;
  for (let i = 0; i < 200; i++) {
    state = stepSpring(state, p, dt);
  }
  assert.ok(
    Math.abs(state.totalEnergy - initialEnergy) < 0.02,
    `Energy should be conserved: started with ${initialEnergy}, now ${state.totalEnergy}`
  );
});

test("Collision: conservation of momentum in 1D collision", () => {
  const p = {
    m1: 2.0,
    m2: 3.0,
    v1i: 4.0,
    v2i: -2.0,
    restitution: 0.8,
    trackLength: 10,
  };
  const theo = calculateCollisionTheoretical(p);
  // Initial P = 2*4 + 3*(-2) = 8 - 6 = 2 kg*m/s
  // Final P = 2*v1f + 3*v2f must equal 2 kg*m/s
  assert.equal(theo.initialMomentum, 2.0);
  assert.ok(Math.abs(theo.finalMomentum - 2.0) < 1e-6);
  assert.ok(theo.energyLost >= 0, "Kinetic energy loss must be >= 0");
});

test("Circuit: series RLC resonant frequency calculation", () => {
  const p = {
    voltage: 10,
    frequency: 0,
    resistance: 10,
    inductance: 0.1, // 100 mH
    capacitance: 100, // 100 uF
  };
  const theo = calculateCircuitTheoretical(p);
  // L*C = 0.1 * 100e-6 = 1e-5 s^2
  // sqrt(LC) = 0.003162
  // f0 = 1 / (2*pi*0.003162) = 50.33 Hz
  assert.ok(Math.abs(theo.resonantFrequencyHz - 50.33) < 0.2);
});

test("Incline: critical angle slipping condition", () => {
  const p = {
    angle: 30,
    mass: 5,
    staticFriction: 0.5, // atan(0.5) = 26.56 deg
    kineticFriction: 0.3,
    rampLength: 4,
    g: 9.81,
  };
  const theo = calculateInclineTheoretical(p);
  assert.ok(theo.willSlide, "Angle 30 deg > critical angle 26.56 deg, so it must slide");
  assert.ok(theo.theoreticalAcceleration > 0, "Acceleration down ramp must be positive");
});
