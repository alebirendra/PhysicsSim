import React from "react";
import { ParameterDefinition } from "../physics/types";
import { EquationViewer } from "./EquationViewer";
import { Sliders, RotateCcw } from "lucide-react";

interface ParametersPanelProps {
  parameters: ParameterDefinition[];
  values: Record<string, number>;
  onChange: (paramId: string, newValue: number) => void;
  onResetDefaults: () => void;
  hoveredEquationParamId?: string | null;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  parameters,
  values,
  onChange,
  onResetDefaults,
  hoveredEquationParamId,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Interactive Parameter Sliders
          </h3>
        </div>
        <button
          onClick={onResetDefaults}
          title="Reset to problem initial values"
          className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-800"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-4 overflow-y-auto pr-1 flex-1">
        {parameters.map((param) => {
          const currentVal = values[param.id] ?? param.value;
          const isHighlighted = hoveredEquationParamId === param.id;

          return (
            <div
              key={param.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isHighlighted
                  ? "bg-indigo-950/40 border-indigo-500/60 shadow-sm"
                  : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-slate-300">
                    {param.name}
                  </span>
                  <span className="text-xs text-indigo-300 font-mono bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/40">
                    <EquationViewer latex={param.symbol} />
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <input
                    type="number"
                    value={currentVal}
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) onChange(param.id, num);
                    }}
                    className="w-16 px-1.5 py-0.5 text-xs font-mono text-right bg-slate-900 border border-slate-700 rounded text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-xs text-slate-400 font-mono min-w-[24px]">
                    {param.unit}
                  </span>
                </div>
              </div>

              {/* Slider */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {param.min}
                </span>
                <input
                  type="range"
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  value={currentVal}
                  onChange={(e) => onChange(param.id, parseFloat(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  {param.max}
                </span>
              </div>

              {param.description && (
                <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1">
                  {param.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
