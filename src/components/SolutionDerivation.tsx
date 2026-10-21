import React, { useState } from "react";
import { GoverningEquation, StepSolution, ConceptualQuestion } from "../physics/types";
import { EquationViewer } from "./EquationViewer";
import { BookOpen, HelpCircle, Check, Sparkles } from "lucide-react";

interface SolutionDerivationProps {
  equations: GoverningEquation[];
  steps: StepSolution[];
  questions?: ConceptualQuestion[];
  onHoverEquationParam?: (paramId: string | null) => void;
}

export const SolutionDerivation: React.FC<SolutionDerivationProps> = ({
  equations,
  steps,
  questions = [],
  onHoverEquationParam,
}) => {
  const [activeTab, setActiveTab] = useState<"equations" | "steps" | "quiz">("equations");
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});

  const toggleReveal = (idx: number) => {
    setRevealedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col h-full">
      {/* Header Tabs */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab("equations")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "equations"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Governing Equations</span>
          </button>

          <button
            onClick={() => setActiveTab("steps")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === "steps"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Step-by-Step Derivation ({steps.length})</span>
          </button>

          {questions.length > 0 && (
            <button
              onClick={() => setActiveTab("quiz")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === "quiz"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Conceptual Questions ({questions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="overflow-y-auto flex-1 pr-1 space-y-3">
        {activeTab === "equations" && (
          <div className="space-y-3">
            {equations.map((eq) => (
              <div
                key={eq.id}
                onMouseEnter={() => onHoverEquationParam?.(eq.id)}
                onMouseLeave={() => onHoverEquationParam?.(null)}
                className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 hover:border-indigo-500/50 hover:bg-slate-950 transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-indigo-300 transition-colors">
                    {eq.label}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    Governing Law
                  </span>
                </div>

                <div className="py-2 px-3 bg-slate-900/80 rounded border border-slate-800/60 text-center my-1.5 overflow-x-auto text-indigo-200 font-mono text-sm">
                  <EquationViewer latex={eq.latex} displayMode={true} />
                </div>

                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {eq.explanation}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "steps" && (
          <div className="space-y-3">
            {steps.map((st) => (
              <div
                key={st.stepNumber}
                className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 font-mono text-xs flex items-center justify-center border border-indigo-500/40">
                    {st.stepNumber}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-200">
                    {st.title}
                  </h4>
                </div>

                <div className="bg-slate-900/90 rounded p-2.5 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="text-indigo-300">
                    <EquationViewer latex={st.formula} />
                  </div>
                  <div className="text-emerald-300 pt-1 border-t border-slate-800/80">
                    <EquationViewer latex={st.calculation} />
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {st.explanation}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "quiz" && (
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const isRevealed = !!revealedQuestions[idx];

              return (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-amber-400 font-bold text-xs mt-0.5">Q{idx + 1}:</span>
                    <p className="text-xs font-medium text-slate-200">{q.question}</p>
                  </div>

                  {q.hint && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-900/60 px-2 py-1 rounded border border-slate-800/50">
                      💡 Hint: {q.hint}
                    </p>
                  )}

                  <div className="pt-1">
                    <button
                      onClick={() => toggleReveal(idx)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isRevealed ? "Hide Explanation" : "Reveal Physical Explanation"}</span>
                    </button>

                    {isRevealed && (
                      <div className="mt-2 p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded text-xs text-emerald-200 leading-relaxed">
                        {q.answerExplanation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
