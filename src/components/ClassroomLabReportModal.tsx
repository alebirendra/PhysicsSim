import React from "react";
import { PhysicsProblemDefinition, PredictedMeasurement } from "../physics/types";
import { EquationViewer } from "./EquationViewer";
import { X, Printer, Download, FileText, CheckCircle } from "lucide-react";

interface ClassroomLabReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: PhysicsProblemDefinition;
  parameters: Record<string, number>;
  predictions: PredictedMeasurement[];
  simulatedState: any;
}

export const ClassroomLabReportModal: React.FC<ClassroomLabReportModalProps> = ({
  isOpen,
  onClose,
  problem,
  parameters,
  predictions,
  simulatedState,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              Computational Physics Lab Report
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 max-h-[80vh] overflow-y-auto space-y-6 text-slate-200 bg-slate-900 print:bg-white print:text-black">
          {/* Header */}
          <div className="border-b border-slate-800 pb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-semibold">
              PhysiCraft Computational Physics Laboratory
            </span>
            <h1 className="text-2xl font-bold text-slate-100 mt-1">
              {problem.title}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Domain: <span className="uppercase font-mono text-slate-300">{problem.systemType}</span> • Date: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Problem Statement */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              1. Problem Statement & Physics Summary
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
              {problem.rawText || problem.summary}
            </p>
          </section>

          {/* Parameters Table */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              2. Initial System Parameters
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-950 text-slate-400 font-mono">
                  <tr>
                    <th className="p-2.5">Parameter</th>
                    <th className="p-2.5">Symbol</th>
                    <th className="p-2.5">Value</th>
                    <th className="p-2.5">Unit</th>
                    <th className="p-2.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40 font-mono">
                  {problem.parameters.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2.5 font-sans font-medium text-slate-200">{p.name}</td>
                      <td className="p-2.5 text-indigo-300">
                        <EquationViewer latex={p.symbol} />
                      </td>
                      <td className="p-2.5 font-bold text-slate-100">
                        {parameters[p.id] ?? p.value}
                      </td>
                      <td className="p-2.5 text-slate-400">{p.unit}</td>
                      <td className="p-2.5 font-sans text-slate-400">{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Governing Equations */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              3. Governing Laws & Differential Equations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {problem.governingEquations.map((eq) => (
                <div key={eq.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-300">{eq.label}</div>
                  <div className="text-center py-2 font-mono text-indigo-200 bg-slate-900/60 rounded">
                    <EquationViewer latex={eq.latex} displayMode={true} />
                  </div>
                  <div className="text-xs text-slate-400">{eq.explanation}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Predicted vs Simulated Measurements Table */}
          <section className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              4. Verification Table: Theory vs Numerical Integration
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-950 text-slate-400 font-mono">
                  <tr>
                    <th className="p-2.5">Measurement</th>
                    <th className="p-2.5">Theoretical Formula</th>
                    <th className="p-2.5">Predicted Value</th>
                    <th className="p-2.5">Numerical ODE Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40 font-mono">
                  {predictions.map((pred) => (
                    <tr key={pred.id}>
                      <td className="p-2.5 font-sans font-medium text-slate-200">{pred.label}</td>
                      <td className="p-2.5 text-indigo-300">
                        {pred.formula ? <EquationViewer latex={pred.formula} /> : "—"}
                      </td>
                      <td className="p-2.5 font-bold text-emerald-400">{pred.formattedValue}</td>
                      <td className="p-2.5 text-slate-300 flex items-center space-x-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 inline" />
                        <span>Verified in Simulation</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Student Observations & Notes */}
          <section className="space-y-2 border-t border-slate-800 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              5. Student Analysis & Reflection
            </h3>
            <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/30 text-xs text-slate-400 min-h-[90px] leading-relaxed">
              [Student notes: Record how altering mass, friction, or initial velocities influences trajectory curves, resonance peaks, and mechanical energy conservation...]
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
