import React from "react";
import { PredictedMeasurement } from "../physics/types";
import { EquationViewer } from "./EquationViewer";
import { Target, CheckCircle2, Zap } from "lucide-react";

interface PredictedMeasurementsHUDProps {
  predictions: PredictedMeasurement[];
  simulatedState: any;
  systemType: string;
}

export const PredictedMeasurementsHUD: React.FC<PredictedMeasurementsHUDProps> = ({
  predictions,
  simulatedState,
  systemType,
}) => {
  // Extract live simulated counterparts based on system
  const getSimulatedValue = (predId: string): { label: string; valStr: string } | null => {
    if (!simulatedState) return null;

    if (systemType === "projectile") {
      if (predId === "range") {
        return {
          label: simulatedState.isLanded ? "Simulated Landing x" : "Current x",
          valStr: `${simulatedState.x.toFixed(2)} m`,
        };
      }
      if (predId === "maxHeight") {
        return {
          label: "Current y",
          valStr: `${simulatedState.y.toFixed(2)} m`,
        };
      }
      if (predId === "timeOfFlight") {
        return {
          label: "Simulated Time",
          valStr: `${simulatedState.t.toFixed(2)} s`,
        };
      }
      if (predId === "impactSpeed") {
        return {
          label: "Current Speed",
          valStr: `${simulatedState.speed.toFixed(2)} m/s`,
        };
      }
    }

    if (systemType === "pendulum") {
      if (predId === "period-nonlinear" || predId === "small-angle-period") {
        return { label: "Oscillation Time", valStr: `${simulatedState.t.toFixed(2)} s` };
      }
      if (predId === "vmax") {
        return { label: "Current Speed", valStr: `${simulatedState.linearSpeed.toFixed(2)} m/s` };
      }
      if (predId === "maxTension") {
        return { label: "Current Tension", valStr: `${simulatedState.tension.toFixed(2)} N` };
      }
    }

    if (systemType === "spring") {
      if (predId === "period") {
        return { label: "Elapsed Time", valStr: `${simulatedState.t.toFixed(2)} s` };
      }
      return { label: "Current Position", valStr: `${simulatedState.x.toFixed(3)} m` };
    }

    if (systemType === "collision") {
      if (predId === "v1f") {
        return { label: "Cart 1 Speed", valStr: `${simulatedState.cart1.v.toFixed(2)} m/s` };
      }
      if (predId === "v2f") {
        return { label: "Cart 2 Speed", valStr: `${simulatedState.cart2.v.toFixed(2)} m/s` };
      }
      if (predId === "momentum") {
        return { label: "Current P_total", valStr: `${simulatedState.totalMomentum.toFixed(2)} kg·m/s` };
      }
    }

    if (systemType === "circuit") {
      if (predId === "vcMax") {
        return { label: "Current V_C", valStr: `${simulatedState.vCapacitor.toFixed(2)} V` };
      }
      return { label: "Current i(t)", valStr: `${(simulatedState.current * 1000).toFixed(1)} mA` };
    }

    if (systemType === "incline") {
      if (predId === "time") {
        return { label: "Elapsed Time", valStr: `${simulatedState.t.toFixed(2)} s` };
      }
      if (predId === "vBottom") {
        return { label: "Current Velocity", valStr: `${simulatedState.v.toFixed(2)} m/s` };
      }
    }

    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Predicted Measurements vs Live Simulation
          </h3>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center space-x-1">
          <CheckCircle2 className="w-3 h-3" />
          <span>Synchronized with ODE Solver</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {predictions.map((pred) => {
          const live = getSimulatedValue(pred.id);

          return (
            <div
              key={pred.id}
              className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-medium truncate">{pred.label}</span>
                  {pred.symbol && (
                    <span className="font-mono text-indigo-300 text-[11px] bg-slate-900 px-1 py-0.5 rounded border border-slate-800">
                      <EquationViewer latex={pred.symbol} />
                    </span>
                  )}
                </div>

                <div className="text-base font-bold font-mono text-slate-100 mt-1">
                  {pred.formattedValue}
                </div>

                {pred.formula && (
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                    <EquationViewer latex={pred.formula} />
                  </div>
                )}
              </div>

              {live && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{live.label}:</span>
                  </span>
                  <span className="font-mono font-semibold text-amber-300">
                    {live.valStr}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
