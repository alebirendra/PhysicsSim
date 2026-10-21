import {
  PhysicsProblemDefinition,
  PhysicsSystemType,
  ParameterDefinition,
  PredictedMeasurement,
  StepSolution,
} from "./types";
import { PRESET_PROBLEMS } from "./presetProblems";
import { calculateProjectileTheoretical } from "./projectile";
import { calculatePendulumTheoretical } from "./pendulum";
import { calculateSpringTheoretical } from "./spring";
import { calculateCollisionTheoretical } from "./collision";
import { calculateCircuitTheoretical } from "./circuit";
import { calculateInclineTheoretical } from "./incline";

/**
 * Recalculate theoretical measurements whenever parameters change
 */
export function recalculatePredictions(
  systemType: PhysicsSystemType,
  parameters: ParameterDefinition[]
): PredictedMeasurement[] {
  const paramMap = new Map<string, number>();
  parameters.forEach((p) => paramMap.set(p.id, p.value));

  switch (systemType) {
    case "projectile": {
      const v0 = paramMap.get("v0") ?? 20;
      const angle = paramMap.get("angle") ?? 45;
      const h0 = paramMap.get("h0") ?? 0;
      const g = paramMap.get("g") ?? 9.81;
      const mass = paramMap.get("mass") ?? 1.0;
      const dragCoeff = paramMap.get("dragCoeff") ?? 0;
      const wind = paramMap.get("wind") ?? 0;

      const theo = calculateProjectileTheoretical({ v0, angle, h0, g, mass, dragCoeff, wind });
      return [
        {
          id: "range",
          label: "Theoretical Range (Vacuum)",
          symbol: "R_{\\text{ideal}}",
          value: Number(theo.rangeNoDrag.toFixed(2)),
          formattedValue: `${theo.rangeNoDrag.toFixed(2)} m`,
          unit: "m",
          formula: "R = v_0 \\cos\\theta \\cdot t_{\\text{flight}}",
        },
        {
          id: "maxHeight",
          label: "Maximum Height",
          symbol: "H_{\\max}",
          value: Number(theo.maxHeightNoDrag.toFixed(2)),
          formattedValue: `${theo.maxHeightNoDrag.toFixed(2)} m`,
          unit: "m",
          formula: "h_0 + \\frac{(v_0 \\sin\\theta)^2}{2g}",
        },
        {
          id: "timeOfFlight",
          label: "Time of Flight",
          symbol: "t_{\\text{flight}}",
          value: Number(theo.timeOfFlightNoDrag.toFixed(2)),
          formattedValue: `${theo.timeOfFlightNoDrag.toFixed(2)} s`,
          unit: "s",
          formula: "\\frac{v_{0y} + \\sqrt{v_{0y}^2 + 2gh_0}}{g}",
        },
        {
          id: "impactSpeed",
          label: "Impact Velocity",
          symbol: "v_{\\text{impact}}",
          value: Number(theo.impactSpeedNoDrag.toFixed(2)),
          formattedValue: `${theo.impactSpeedNoDrag.toFixed(2)} m/s`,
          unit: "m/s",
          formula: "\\sqrt{v_0^2 + 2gh_0}",
        },
      ];
    }

    case "pendulum": {
      const length = paramMap.get("length") ?? 1.5;
      const mass = paramMap.get("mass") ?? 1.0;
      const initialAngle = paramMap.get("initialAngle") ?? 30;
      const g = paramMap.get("g") ?? 9.81;
      const damping = paramMap.get("damping") ?? 0.1;

      const theo = calculatePendulumTheoretical({ length, mass, initialAngle, g, damping });
      return [
        {
          id: "period-nonlinear",
          label: "Corrected Nonlinear Period",
          symbol: "T_{\\text{nonlinear}}",
          value: Number(theo.largeAnglePeriod.toFixed(3)),
          formattedValue: `${theo.largeAnglePeriod.toFixed(3)} s`,
          unit: "s",
          formula: "T_0(1 + \\theta_0^2/16)",
        },
        {
          id: "small-angle-period",
          label: "Small-Angle Period (T₀)",
          symbol: "T_0",
          value: Number(theo.smallAnglePeriod.toFixed(3)),
          formattedValue: `${theo.smallAnglePeriod.toFixed(3)} s`,
          unit: "s",
          formula: "2\\pi\\sqrt{L/g}",
        },
        {
          id: "vmax",
          label: "Max Theoretical Speed",
          symbol: "v_{\\max}",
          value: Number(theo.maxSpeedTheoretical.toFixed(2)),
          formattedValue: `${theo.maxSpeedTheoretical.toFixed(2)} m/s`,
          unit: "m/s",
          formula: "\\sqrt{2gL(1-\\cos\\theta_0)}",
        },
        {
          id: "f0",
          label: "Oscillation Frequency",
          symbol: "f_0",
          value: Number(theo.naturalFrequencyHz.toFixed(3)),
          formattedValue: `${theo.naturalFrequencyHz.toFixed(3)} Hz`,
          unit: "Hz",
          formula: "1/T_0",
        },
      ];
    }

    case "spring": {
      const mass = paramMap.get("mass") ?? 1.0;
      const springConstant = paramMap.get("springConstant") ?? 50;
      const damping = paramMap.get("damping") ?? 1.0;
      const initialDisplacement = paramMap.get("initialDisplacement") ?? 0.2;
      const initialVelocity = paramMap.get("initialVelocity") ?? 0;
      const driveAmplitude = paramMap.get("driveAmplitude") ?? 0;
      const driveFrequency = paramMap.get("driveFrequency") ?? 0;

      const theo = calculateSpringTheoretical({
        mass,
        springConstant,
        damping,
        initialDisplacement,
        initialVelocity,
        driveAmplitude,
        driveFrequency,
      });

      return [
        {
          id: "f0",
          label: "Natural Frequency",
          symbol: "f_0",
          value: Number(theo.naturalFrequencyHz.toFixed(3)),
          formattedValue: `${theo.naturalFrequencyHz.toFixed(3)} Hz`,
          unit: "Hz",
          formula: "\\frac{1}{2\\pi}\\sqrt{k/m}",
        },
        {
          id: "zeta",
          label: "Damping Regime",
          symbol: "\\zeta",
          value: Number(theo.dampingRatio.toFixed(3)),
          formattedValue: `${theo.dampingRatio.toFixed(3)} (${theo.dampingRegime})`,
          unit: "",
          formula: "c / (2\\sqrt{km})",
        },
        {
          id: "period",
          label: "Damped Period",
          symbol: "T_d",
          value: Number(theo.periodSec.toFixed(3)),
          formattedValue: `${theo.periodSec.toFixed(3)} s`,
          unit: "s",
          formula: "2\\pi/\\omega_d",
        },
        {
          id: "Q",
          label: "Quality Factor",
          symbol: "Q",
          value: Number(theo.qualityFactorQ.toFixed(2)),
          formattedValue: `${theo.qualityFactorQ.toFixed(2)}`,
          unit: "",
          formula: "1/(2\\zeta)",
        },
      ];
    }

    case "collision": {
      const m1 = paramMap.get("m1") ?? 1.0;
      const m2 = paramMap.get("m2") ?? 2.0;
      const v1i = paramMap.get("v1i") ?? 3.0;
      const v2i = paramMap.get("v2i") ?? -1.0;
      const restitution = paramMap.get("restitution") ?? 0.8;
      const trackLength = paramMap.get("trackLength") ?? 10;

      const theo = calculateCollisionTheoretical({ m1, m2, v1i, v2i, restitution, trackLength });

      return [
        {
          id: "v1f",
          label: "Cart 1 Final Velocity",
          symbol: "v_{1f}",
          value: Number(theo.v1Final.toFixed(2)),
          formattedValue: `${theo.v1Final.toFixed(2)} m/s`,
          unit: "m/s",
          formula: "\\text{Restitution Formula}",
        },
        {
          id: "v2f",
          label: "Cart 2 Final Velocity",
          symbol: "v_{2f}",
          value: Number(theo.v2Final.toFixed(2)),
          formattedValue: `${theo.v2Final.toFixed(2)} m/s`,
          unit: "m/s",
          formula: "v_{1f} + e(v_{1i}-v_{2i})",
        },
        {
          id: "momentum",
          label: "Total System Momentum",
          symbol: "P_{\\text{total}}",
          value: Number(theo.initialMomentum.toFixed(2)),
          formattedValue: `${theo.initialMomentum.toFixed(2)} kg·m/s`,
          unit: "kg·m/s",
          formula: "m_1 v_1 + m_2 v_2",
        },
        {
          id: "energyLoss",
          label: "Kinetic Energy Dissipated",
          symbol: "\\Delta K",
          value: Number(theo.energyLost.toFixed(2)),
          formattedValue: `${theo.energyLost.toFixed(2)} J (${theo.energyLostPercentage.toFixed(1)}%)`,
          unit: "J",
          formula: "K_i - K_f",
        },
      ];
    }

    case "circuit": {
      const voltage = paramMap.get("voltage") ?? 12;
      const frequency = paramMap.get("frequency") ?? 0;
      const resistance = paramMap.get("resistance") ?? 20;
      const inductance = paramMap.get("inductance") ?? 0.1;
      const capacitance = paramMap.get("capacitance") ?? 50;

      const theo = calculateCircuitTheoretical({ voltage, frequency, resistance, inductance, capacitance });

      return [
        {
          id: "f0",
          label: "Resonant Frequency",
          symbol: "f_0",
          value: Number(theo.resonantFrequencyHz.toFixed(2)),
          formattedValue: `${theo.resonantFrequencyHz.toFixed(2)} Hz`,
          unit: "Hz",
          formula: "1/(2\\pi\\sqrt{LC})",
        },
        {
          id: "Q",
          label: "Quality Factor",
          symbol: "Q",
          value: Number(theo.qualityFactorQ.toFixed(2)),
          formattedValue: `${theo.qualityFactorQ.toFixed(2)}`,
          unit: "",
          formula: "(1/R)\\sqrt{L/C}",
        },
        {
          id: "tau",
          label: "Damping Regime",
          symbol: "\\zeta",
          value: Number(theo.dampingRatioZeta.toFixed(3)),
          formattedValue: `${theo.dampingRatioZeta.toFixed(3)} (${theo.dampingRegime})`,
          unit: "",
          formula: "R/(2\\sqrt{L/C})",
        },
        {
          id: "z",
          label: "Impedance",
          symbol: "Z",
          value: Number(theo.impedanceZ.toFixed(2)),
          formattedValue: `${theo.impedanceZ.toFixed(2)} Ω`,
          unit: "Ω",
          formula: "\\sqrt{R^2 + (X_L - X_C)^2}",
        },
      ];
    }

    case "incline": {
      const angle = paramMap.get("angle") ?? 30;
      const mass = paramMap.get("mass") ?? 5.0;
      const staticFriction = paramMap.get("staticFriction") ?? 0.4;
      const kineticFriction = paramMap.get("kineticFriction") ?? 0.25;
      const rampLength = paramMap.get("rampLength") ?? 5.0;
      const g = paramMap.get("g") ?? 9.81;

      const theo = calculateInclineTheoretical({ angle, mass, staticFriction, kineticFriction, rampLength, g });

      return [
        {
          id: "critAngle",
          label: "Critical Slip Angle",
          symbol: "\\alpha_{\\text{crit}}",
          value: Number(theo.criticalAngleDeg.toFixed(2)),
          formattedValue: `${theo.criticalAngleDeg.toFixed(2)}° (${theo.willSlide ? "Sliding" : "Static"})`,
          unit: "°",
          formula: "\\arctan(\\mu_s)",
        },
        {
          id: "accel",
          label: "Downhill Acceleration",
          symbol: "a",
          value: Number(theo.theoreticalAcceleration.toFixed(2)),
          formattedValue: `${theo.theoreticalAcceleration.toFixed(2)} m/s²`,
          unit: "m/s²",
          formula: "g(\\sin\\alpha - \\mu_k\\cos\\alpha)",
        },
        {
          id: "time",
          label: "Time to Reach Bottom",
          symbol: "t_{\\text{bottom}}",
          value: Number(isFinite(theo.timeToBottom) ? theo.timeToBottom.toFixed(2) : 0),
          formattedValue: isFinite(theo.timeToBottom) ? `${theo.timeToBottom.toFixed(2)} s` : "Will Not Slide",
          unit: "s",
          formula: "\\sqrt{2L/a}",
        },
        {
          id: "vBottom",
          label: "Speed at Bottom",
          symbol: "v_{\\text{bottom}}",
          value: Number(theo.velocityAtBottom.toFixed(2)),
          formattedValue: `${theo.velocityAtBottom.toFixed(2)} m/s`,
          unit: "m/s",
          formula: "\\sqrt{2aL}",
        },
      ];
    }

    default:
      return [];
  }
}

/**
 * Local heuristic physics parser: decomposes any arbitrary problem into structured parameters & equations
 */
export function parsePhysicsProblemHeuristically(problemText: string): PhysicsProblemDefinition {
  const text = problemText.toLowerCase();

  // Detect domain
  let systemType: PhysicsSystemType = "projectile";
  if (text.includes("pendulum") || text.includes("bob") || text.includes("string") || text.includes("pivot")) {
    systemType = "pendulum";
  } else if (text.includes("spring") || text.includes("harmonic") || text.includes("k=") || text.includes("hooke") || text.includes("dashpot")) {
    systemType = "spring";
  } else if (text.includes("collision") || text.includes("cart") || text.includes("glider") || text.includes("restitution") || text.includes("momentum") || text.includes("collide")) {
    systemType = "collision";
  } else if (text.includes("circuit") || text.includes("resistor") || text.includes("inductor") || text.includes("capacitor") || text.includes("rlc") || text.includes("ohm")) {
    systemType = "circuit";
  } else if (text.includes("incline") || text.includes("ramp") || text.includes("friction") || text.includes("crate") || text.includes("slope")) {
    systemType = "incline";
  } else if (text.includes("orbit") || text.includes("satellite") || text.includes("planet") || text.includes("kepler") || text.includes("gravity")) {
    systemType = "projectile"; // or orbital
  }

  // Find numbers with units using regex
  const findNumberWithUnit = (pattern: RegExp): number | null => {
    const match = problemText.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return null;
  };

  // Base clone from preset templates for that domain
  const template = PRESET_PROBLEMS.find((p) => p.systemType === systemType) || PRESET_PROBLEMS[0];
  const parameters = template.parameters.map((p) => ({ ...p }));

  // Extract all numbers with units
  const allMasses = [...problemText.matchAll(/(\d+(?:\.\d+)?)\s*(?:kg|kilogram|kilograms)\b/gi)].map((m) =>
    parseFloat(m[1])
  );
  const allSpeeds = [...problemText.matchAll(/(-?\d+(?:\.\d+)?)\s*(?:m\/s|mps)\b/gi)].map((m) =>
    parseFloat(m[1])
  );
  const allAngles = [...problemText.matchAll(/(\d+(?:\.\d+)?)\s*(?:°|deg|degrees)\b/gi)].map((m) =>
    parseFloat(m[1])
  );
  const restitutionMatch = problemText.match(/(?:e\s*=\s*|restitution(?:\s*is|\s*of)?\s*)(\d+(?:\.\d+)?)/i);
  const springKMatch = problemText.match(/(\d+(?:\.\d+)?)\s*(?:n\/m|n\/meter)/i);
  const resistanceMatch = problemText.match(/(\d+(?:\.\d+)?)\s*(?:ohm|ohms|Ω)/i);
  const inductanceMatch = problemText.match(/(\d+(?:\.\d+)?)\s*(?:h|mh|henry|henries)\b/i);
  const capacitanceMatch = problemText.match(/(\d+(?:\.\d+)?)\s*(?:uf|μf|microfarad|farad)\b/i);
  const voltageMatch = problemText.match(/(\d+(?:\.\d+)?)\s*(?:v\b|volts)\b/i);
  const heightMatch = problemText.match(/(\d+(?:\.\d+)?)\s*(?:m\b|meters)\s*(?:high|cliff|platform|elevation)/i);

  parameters.forEach((param) => {
    // Collision-specific assignment
    if (systemType === "collision") {
      if (param.id === "m1" && allMasses.length > 0) param.value = allMasses[0];
      if (param.id === "m2" && allMasses.length > 1) param.value = allMasses[1];
      if (param.id === "v1i" && allSpeeds.length > 0) param.value = allSpeeds[0];
      if (param.id === "v2i" && allSpeeds.length > 1) param.value = allSpeeds[1];
      if (param.id === "restitution" && restitutionMatch) param.value = parseFloat(restitutionMatch[1]);
      return;
    }

    // Projectile assignment
    if (systemType === "projectile") {
      if (param.id === "v0" && allSpeeds.length > 0) param.value = allSpeeds[0];
      if (param.id === "angle" && allAngles.length > 0) param.value = allAngles[0];
      if (param.id === "mass" && allMasses.length > 0) param.value = allMasses[0];
      if (param.id === "h0" && heightMatch) param.value = parseFloat(heightMatch[1]);
      return;
    }

    // Pendulum assignment
    if (systemType === "pendulum") {
      if (param.id === "initialAngle" && allAngles.length > 0) param.value = allAngles[0];
      if (param.id === "mass" && allMasses.length > 0) param.value = allMasses[0];
      const lengthMatch = problemText.match(/(\d+(?:\.\d+)?)\s*(?:m\b|meters)\s*(?:long|rod|string|length)/i);
      if (param.id === "length" && lengthMatch) param.value = parseFloat(lengthMatch[1]);
      return;
    }

    // Spring assignment
    if (systemType === "spring") {
      if (param.id === "mass" && allMasses.length > 0) param.value = allMasses[0];
      if (param.id === "springConstant" && springKMatch) param.value = parseFloat(springKMatch[1]);
      return;
    }

    // Circuit assignment
    if (systemType === "circuit") {
      if (param.id === "resistance" && resistanceMatch) param.value = parseFloat(resistanceMatch[1]);
      if (param.id === "inductance" && inductanceMatch) param.value = parseFloat(inductanceMatch[1]);
      if (param.id === "capacitance" && capacitanceMatch) param.value = parseFloat(capacitanceMatch[1]);
      if (param.id === "voltage" && voltageMatch) param.value = parseFloat(voltageMatch[1]);
      return;
    }

    // Incline assignment
    if (systemType === "incline") {
      if (param.id === "angle" && allAngles.length > 0) param.value = allAngles[0];
      if (param.id === "mass" && allMasses.length > 0) param.value = allMasses[0];
      const muSMatch = problemText.match(/(?:μs|mus|static\s+friction)[^\d]*(\d+(?:\.\d+)?)/i);
      const muKMatch = problemText.match(/(?:μk|muk|kinetic\s+friction)[^\d]*(\d+(?:\.\d+)?)/i);
      if (param.id === "staticFriction" && muSMatch) param.value = parseFloat(muSMatch[1]);
      if (param.id === "kineticFriction" && muKMatch) param.value = parseFloat(muKMatch[1]);
      return;
    }
  });

  const updatedPredictions = recalculatePredictions(systemType, parameters);

  return {
    id: `custom-${Date.now()}`,
    title: `Custom Simulation: ${problemText.slice(0, 48)}...`,
    systemType,
    summary: `Simulation generated from prompt: "${problemText.trim()}"`,
    targetGoal: "Interactive parameter exploration and real-time numerical validation.",
    rawText: problemText,
    parameters,
    governingEquations: template.governingEquations,
    stepByStepSolution: template.stepByStepSolution,
    predictedMeasurements: updatedPredictions,
    conceptualQuestions: template.conceptualQuestions,
  };
}

/**
 * Solve physics problem: tries backend Gemini AI endpoint first, with local heuristic engine fallback
 */
export async function solvePhysicsProblem(problemText: string): Promise<PhysicsProblemDefinition> {
  try {
    const res = await fetch("/api/solve-physics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemText }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.systemType && Array.isArray(data.parameters)) {
        return {
          id: `ai-${Date.now()}`,
          title: data.title || "AI Solved Physics Simulation",
          systemType: data.systemType as PhysicsSystemType,
          summary: data.summary || "AI-generated physics scenario.",
          targetGoal: data.targetGoal || "Predict and explore physical dynamics.",
          rawText: problemText,
          parameters: data.parameters,
          governingEquations: data.governingEquations || [],
          stepByStepSolution: data.stepByStepSolution || [],
          predictedMeasurements: data.predictedMeasurements || [],
          conceptualQuestions: data.conceptualQuestions || [],
        };
      }
    }
  } catch (err) {
    console.warn("AI solve physics network failure, falling back to heuristic engine:", err);
  }

  // Graceful robust fallback
  return parsePhysicsProblemHeuristically(problemText);
}
