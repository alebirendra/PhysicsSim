import React, { useState, useEffect, useRef, useCallback } from "react";
import { PRESET_PROBLEMS } from "./physics/presetProblems";
import { PhysicsProblemDefinition, GraphDataPoint } from "./physics/types";
import {
  solvePhysicsProblem,
  recalculatePredictions,
} from "./physics/solver";
import {
  createInitialProjectileState,
  stepProjectile,
  ProjectileState,
} from "./physics/projectile";
import {
  createInitialPendulumState,
  stepPendulum,
  PendulumState,
} from "./physics/pendulum";
import {
  createInitialSpringState,
  stepSpring,
  SpringState,
} from "./physics/spring";
import {
  createInitialCollisionState,
  stepCollision,
  CollisionSimulationState,
} from "./physics/collision";
import {
  createInitialCircuitState,
  stepCircuit,
  CircuitState,
} from "./physics/circuit";
import {
  createInitialInclineState,
  stepIncline,
  InclineState,
} from "./physics/incline";

import { Navbar } from "./components/Navbar";
import { SimulationCanvas } from "./components/SimulationCanvas";
import { GraphPlotter } from "./components/GraphPlotter";
import { ParametersPanel } from "./components/ParametersPanel";
import { PredictedMeasurementsHUD } from "./components/PredictedMeasurementsHUD";
import { SolutionDerivation } from "./components/SolutionDerivation";
import { ClassroomLabReportModal } from "./components/ClassroomLabReportModal";
import { PlansModal } from "./components/PlansModal";

import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sparkles,
  Layers,
  Eye,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  Info,
} from "lucide-react";

export default function App() {
  // Active problem definition
  const [problem, setProblem] = useState<PhysicsProblemDefinition>(PRESET_PROBLEMS[0]);
  const [problemInputText, setProblemInputText] = useState<string>("");
  const [isSolving, setIsSolving] = useState<boolean>(false);

  // Parameter values state map
  const [paramValues, setParamValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    PRESET_PROBLEMS[0].parameters.forEach((p) => {
      initial[p.id] = p.value;
    });
    return initial;
  });

  // Simulation playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [simState, setSimState] = useState<any>(() =>
    createInitialProjectileState(PRESET_PROBLEMS[0].parameters.reduce((acc, p) => ({ ...acc, [p.id]: p.value }), {} as any))
  );

  // Time & History
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [history, setHistory] = useState<GraphDataPoint[]>([]);
  const [trajectoryHistory, setTrajectoryHistory] = useState<Array<{ x: number; y: number }>>([]);

  // Visualization toggles
  const [showVelocity, setShowVelocity] = useState<boolean>(true);
  const [showAcceleration, setShowAcceleration] = useState<boolean>(true);
  const [showForce, setShowForce] = useState<boolean>(true);
  const [showTrajectory, setShowTrajectory] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // UI Modals & Modes
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isPlansOpen, setIsPlansOpen] = useState<boolean>(false);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [hoveredParamId, setHoveredParamId] = useState<string | null>(null);

  // Animation frame ref
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Factory to create initial state for the current system
  const createInitialStateForSystem = useCallback(
    (systemType: string, params: Record<string, number>) => {
      switch (systemType) {
        case "projectile":
          return createInitialProjectileState(params as any);
        case "pendulum":
          return createInitialPendulumState(params as any);
        case "spring":
          return createInitialSpringState(params as any);
        case "collision":
          return createInitialCollisionState(params as any);
        case "circuit":
          return createInitialCircuitState(params as any);
        case "incline":
          return createInitialInclineState(params as any);
        default:
          return createInitialProjectileState(params as any);
      }
    },
    []
  );

  // Factory to step simulation
  const stepSystem = useCallback(
    (systemType: string, state: any, params: Record<string, number>, dt: number) => {
      switch (systemType) {
        case "projectile":
          return stepProjectile(state, params as any, dt);
        case "pendulum":
          return stepPendulum(state, params as any, dt);
        case "spring":
          return stepSpring(state, params as any, dt);
        case "collision":
          return stepCollision(state, params as any, dt);
        case "circuit":
          return stepCircuit(state, params as any, dt);
        case "incline":
          return stepIncline(state, params as any, dt);
        default:
          return stepProjectile(state, params as any, dt);
      }
    },
    []
  );

  // Convert current simulation state to graph snapshot data point
  const extractGraphDataPoint = useCallback((systemType: string, s: any): GraphDataPoint => {
    if (!s) return { t: 0 };
    switch (systemType) {
      case "projectile":
        return {
          t: s.t,
          x: s.x,
          y: s.y,
          v: s.speed,
          a: Math.hypot(s.ax, s.ay),
          kineticEnergy: s.kineticEnergy,
          potentialEnergy: s.potentialEnergy,
          totalEnergy: s.totalEnergy,
        };
      case "pendulum":
        return {
          t: s.t,
          thetaDeg: s.thetaDeg,
          omega: s.omega,
          v: s.linearSpeed,
          a: Math.abs(s.alpha),
          kineticEnergy: s.kineticEnergy,
          potentialEnergy: s.potentialEnergy,
          totalEnergy: s.totalEnergy,
        };
      case "spring":
        return {
          t: s.t,
          x: s.x,
          v: s.v,
          a: s.a,
          kineticEnergy: s.kineticEnergy,
          potentialEnergy: s.potentialEnergy,
          totalEnergy: s.totalEnergy,
        };
      case "collision":
        return {
          t: s.t,
          x: s.cart1.x,
          v: s.cart1.v,
          kineticEnergy: s.cart1.ke + s.cart2.ke,
          totalEnergy: s.totalMomentum,
        };
      case "circuit":
        return {
          t: s.t,
          vCapacitor: s.vCapacitor,
          current: s.current,
          kineticEnergy: s.energyCapacitor,
          potentialEnergy: s.energyInductor,
          totalEnergy: s.totalEnergy,
        };
      case "incline":
        return {
          t: s.t,
          x: s.s,
          v: s.v,
          a: s.a,
          kineticEnergy: s.kineticEnergy,
          potentialEnergy: s.potentialEnergy,
          totalEnergy: s.totalEnergy,
        };
      default:
        return { t: s.t || 0 };
    }
  }, []);

  // Reset simulation to t=0
  const handleReset = useCallback(() => {
    const fresh = createInitialStateForSystem(problem.systemType, paramValues);
    setSimState(fresh);
    setCurrentTime(0);
    const initialPt = extractGraphDataPoint(problem.systemType, fresh);
    setHistory([initialPt]);

    if (problem.systemType === "projectile") {
      const proj = fresh as ProjectileState;
      setTrajectoryHistory([{ x: proj.x, y: proj.y }]);
    } else {
      setTrajectoryHistory([]);
    }
    lastTimeRef.current = null;
  }, [problem.systemType, paramValues, createInitialStateForSystem, extractGraphDataPoint]);

  // Load a new problem definition
  const loadProblem = useCallback(
    (newProblem: PhysicsProblemDefinition) => {
      setProblem(newProblem);
      const newVals: Record<string, number> = {};
      newProblem.parameters.forEach((p) => {
        newVals[p.id] = p.value;
      });
      setParamValues(newVals);

      const fresh = createInitialStateForSystem(newProblem.systemType, newVals);
      setSimState(fresh);
      setCurrentTime(0);
      setHistory([extractGraphDataPoint(newProblem.systemType, fresh)]);
      if (newProblem.systemType === "projectile") {
        const proj = fresh as ProjectileState;
        setTrajectoryHistory([{ x: proj.x, y: proj.y }]);
      } else {
        setTrajectoryHistory([]);
      }
      lastTimeRef.current = null;
    },
    [createInitialStateForSystem, extractGraphDataPoint]
  );

  // Handle parameter slider change
  const handleParamChange = useCallback(
    (paramId: string, newValue: number) => {
      const updatedParams = { ...paramValues, [paramId]: newValue };
      setParamValues(updatedParams);

      // Recalculate predictions
      const updatedParamDefs = problem.parameters.map((p) =>
        p.id === paramId ? { ...p, value: newValue } : { ...p, value: updatedParams[p.id] ?? p.value }
      );
      const newPreds = recalculatePredictions(problem.systemType, updatedParamDefs);
      setProblem((prev) => ({
        ...prev,
        parameters: updatedParamDefs,
        predictedMeasurements: newPreds,
      }));

      // If at start or reset, update state immediately
      const fresh = createInitialStateForSystem(problem.systemType, updatedParams);
      setSimState(fresh);
      setCurrentTime(0);
      setHistory([extractGraphDataPoint(problem.systemType, fresh)]);
      if (problem.systemType === "projectile") {
        const proj = fresh as ProjectileState;
        setTrajectoryHistory([{ x: proj.x, y: proj.y }]);
      }
      lastTimeRef.current = null;
    },
    [paramValues, problem, createInitialStateForSystem, extractGraphDataPoint]
  );

  // Reset parameters to original defaults
  const handleResetDefaults = useCallback(() => {
    const originalVals: Record<string, number> = {};
    problem.parameters.forEach((p) => {
      originalVals[p.id] = p.value;
    });
    setParamValues(originalVals);
    handleReset();
  }, [problem.parameters, handleReset]);

  // Step simulation forward once
  const handleStepForward = useCallback(() => {
    const dt = 0.02 * playbackSpeed;
    const next = stepSystem(problem.systemType, simState, paramValues, dt);
    setSimState(next);
    setCurrentTime(next.t);
    const pt = extractGraphDataPoint(problem.systemType, next);
    setHistory((prev) => [...prev.slice(-300), pt]);

    if (problem.systemType === "projectile") {
      const proj = next as ProjectileState;
      setTrajectoryHistory((prev) => [...prev, { x: proj.x, y: proj.y }]);
    }
  }, [playbackSpeed, problem.systemType, simState, paramValues, stepSystem, extractGraphDataPoint]);

  // Main 60 FPS animation loop with headless throttling
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      lastTimeRef.current = null;
      return;
    }

    const isHeadless =
      typeof navigator !== "undefined" &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    let lastFrameTimestamp = performance.now();
    const frameInterval = isHeadless ? 66 : 16; // ~15fps headless vs ~60fps normal

    const loop = (timestamp: number) => {
      const elapsed = timestamp - lastFrameTimestamp;
      if (elapsed >= frameInterval) {
        lastFrameTimestamp = timestamp;

        // Substep numerical integration for accuracy
        const baseDt = 0.016 * playbackSpeed;
        setSimState((prevState: any) => {
          if (!prevState) return prevState;
          const next = stepSystem(problem.systemType, prevState, paramValues, baseDt);
          setCurrentTime(next.t);

          // Update trajectory points if projectile
          if (problem.systemType === "projectile" && !(prevState as ProjectileState).isLanded) {
            const proj = next as ProjectileState;
            setTrajectoryHistory((prev) => {
              if (prev.length > 500) return prev;
              return [...prev, { x: proj.x, y: proj.y }];
            });
          }

          // Sample graph history
          const pt = extractGraphDataPoint(problem.systemType, next);
          setHistory((prev) => {
            const last = prev[prev.length - 1];
            if (!last || Math.abs(pt.t - last.t) > 0.03) {
              return [...prev.slice(-400), pt];
            }
            return prev;
          });

          return next;
        });
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, playbackSpeed, problem.systemType, paramValues, stepSystem, extractGraphDataPoint]);

  // Solve custom user prompt
  const handleSolveCustomProblem = async () => {
    if (!problemInputText.trim()) return;
    setIsSolving(true);
    try {
      const solved = await solvePhysicsProblem(problemInputText);
      loadProblem(solved);
    } catch (err) {
      console.error("Problem solver failed:", err);
    } finally {
      setIsSolving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Navbar
        onOpenReport={() => setIsReportOpen(true)}
        onOpenPlans={() => setIsPlansOpen(true)}
        isPresentationMode={isPresentationMode}
        onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Natural Language Physics Problem Generator Bar */}
        <section className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-200">
                  Physics Problem-to-Simulation Engine
                </h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                  AI + Exact Numerical ODEs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enter any projectile, pendulum, spring, collision, circuit, or inclined plane problem to automatically generate an interactive simulation.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Try Classic Topics:</span>
            </div>
          </div>

          {/* Quick Problem Preset Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {PRESET_PROBLEMS.map((preset) => {
              const isActive = problem.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => loadProblem(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    isActive
                      ? "bg-indigo-600/30 text-indigo-200 border-indigo-500 shadow-sm"
                      : "bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {preset.systemType === "projectile" && "⚽ "}
                  {preset.systemType === "pendulum" && "⏳ "}
                  {preset.systemType === "spring" && "〰️ "}
                  {preset.systemType === "collision" && "💥 "}
                  {preset.systemType === "circuit" && "⚡ "}
                  {preset.systemType === "incline" && "📐 "}
                  <span>{preset.title.split(":")[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Input Textarea & Generate Button */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch">
            <div className="relative flex-1">
              <textarea
                value={problemInputText}
                onChange={(e) => setProblemInputText(e.target.value)}
                placeholder="Type or paste any textbook or exam physics problem (e.g. 'A 0.5kg glider at 4 m/s hits a 1.2kg glider at -2 m/s on an air track with e=0.7...')"
                rows={2}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-950/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
              />
            </div>
            <button
              onClick={handleSolveCustomProblem}
              disabled={isSolving || !problemInputText.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
            >
              {isSolving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Deriving & Simulating...</span>
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>Turn into Simulation</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Current Active Problem Title & Overview */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                {problem.systemType}
              </span>
              <h2 className="text-base font-bold text-slate-100">
                {problem.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {problem.rawText || problem.summary}
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-xs text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/40 font-medium">
              Goal: {problem.targetGoal || "Predict & Simulate"}
            </span>
          </div>
        </section>

        {/* Simulation Canvas + Controls Section */}
        <section className="space-y-3">
          {/* Canvas Container */}
          <div className="h-[400px] w-full">
            <SimulationCanvas
              systemType={problem.systemType}
              simulationState={simState}
              parameters={paramValues}
              showVelocityVector={showVelocity}
              showAccelerationVector={showAcceleration}
              showForceVector={showForce}
              showTrajectory={showTrajectory}
              showGrid={showGrid}
              trajectoryHistory={trajectoryHistory}
            />
          </div>

          {/* Interactive Control Deck */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            {/* Play, Step, Reset Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white transition-all shadow-md ${
                  isPlaying
                    ? "bg-amber-600 hover:bg-amber-500 shadow-amber-600/20"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button
                onClick={handleStepForward}
                disabled={isPlaying}
                title="Step forward 0.02s"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={handleReset}
                title="Reset simulation to initial conditions"
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {/* Speed Multipliers */}
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 ml-2">
                {[0.25, 0.5, 1.0, 2.0].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setPlaybackSpeed(spd)}
                    className={`px-2 py-0.5 text-[11px] font-mono rounded ${
                      playbackSpeed === spd
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Time Readout */}
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="text-slate-400">Simulation Time:</span>
              <span className="text-emerald-400 font-bold bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                t = {currentTime.toFixed(2)} s
              </span>
            </div>

            {/* Visualization Layer Toggles */}
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={() => setShowVelocity(!showVelocity)}
                className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                  showVelocity
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/60"
                    : "bg-slate-950 text-slate-500 border-slate-800"
                }`}
              >
                Velocity v
              </button>

              <button
                onClick={() => setShowAcceleration(!showAcceleration)}
                className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                  showAcceleration
                    ? "bg-amber-950/60 text-amber-300 border-amber-700/60"
                    : "bg-slate-950 text-slate-500 border-slate-800"
                }`}
              >
                Accel a
              </button>

              <button
                onClick={() => setShowForce(!showForce)}
                className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                  showForce
                    ? "bg-rose-950/60 text-rose-300 border-rose-700/60"
                    : "bg-slate-950 text-slate-500 border-slate-800"
                }`}
              >
                Forces F
              </button>

              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
                  showGrid
                    ? "bg-indigo-950/60 text-indigo-300 border-indigo-700/60"
                    : "bg-slate-950 text-slate-500 border-slate-800"
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </section>

        {/* Real-Time Predictions HUD (Differentiation: Connected measurements) */}
        <PredictedMeasurementsHUD
          predictions={problem.predictedMeasurements}
          simulatedState={simState}
          systemType={problem.systemType}
        />

        {/* Lower Two-Column Grid: Sliders & Oscilloscope Plotter */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Parameter Sliders (5 cols) */}
          <div className="lg:col-span-5 h-[340px]">
            <ParametersPanel
              parameters={problem.parameters}
              values={paramValues}
              onChange={handleParamChange}
              onResetDefaults={handleResetDefaults}
              hoveredEquationParamId={hoveredParamId}
            />
          </div>

          {/* Dynamic Real-Time Graph Plotter (7 cols) */}
          <div className="lg:col-span-7 h-[340px]">
            <GraphPlotter
              dataHistory={history}
              currentTime={currentTime}
              systemType={problem.systemType}
              onTimeSeek={(t) => {
                // Seek to closest state in history
                const closest = history.reduce((prev, curr) =>
                  Math.abs(curr.t - t) < Math.abs(prev.t - t) ? curr : prev
                );
                if (closest) {
                  setCurrentTime(closest.t);
                }
              }}
            />
          </div>
        </section>

        {/* Synchronized Governing Equations & Pedagogical Derivation */}
        <section className="h-[420px]">
          <SolutionDerivation
            equations={problem.governingEquations}
            steps={problem.stepByStepSolution}
            questions={problem.conceptualQuestions}
            onHoverEquationParam={(id) => setHoveredParamId(id)}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>PhysiCraft Simulation Engine • Computational Physics for Students, Teachers & STEM Platforms</span>
          <div className="flex items-center space-x-3 text-slate-400">
            <button onClick={() => setIsPlansOpen(true)} className="hover:text-indigo-400 transition-colors">
              School Plans
            </button>
            <span>•</span>
            <button onClick={() => setIsReportOpen(true)} className="hover:text-indigo-400 transition-colors">
              Lab Reports
            </button>
            <span>•</span>
            <span>4th-Order Runge-Kutta & Symplectic Solvers</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ClassroomLabReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        problem={problem}
        parameters={paramValues}
        predictions={problem.predictedMeasurements}
        simulatedState={simState}
      />

      <PlansModal
        isOpen={isPlansOpen}
        onClose={() => setIsPlansOpen(false)}
      />
    </div>
  );
}
