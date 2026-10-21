import React from "react";
import { X, Check, Zap, GraduationCap, School, ShieldCheck } from "lucide-react";

interface PlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlansModal: React.FC<PlansModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-slate-100">
              PhysiCraft Education & Classroom Subscription Plans
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-bold text-slate-100">
              Transform STEM Learning with Interactive Physics
            </h3>
            <p className="text-sm text-slate-400">
              Choose the plan designed for individual physics learners, STEM educators, or school-wide district deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Student Free */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-200">Student Explorer</h4>
                  <p className="text-xs text-slate-400 mt-1">For independent study and homework practice</p>
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  $0 <span className="text-xs font-normal text-slate-400">/ forever</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>All 6 core physics engines</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Real-time graph oscilloscope</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Pre-engineered AP physics problem bank</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Vector overlays and step scrubber</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={onClose}
                className="w-full mt-6 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Current Active Plan
              </button>
            </div>

            {/* Educator Pro */}
            <div className="bg-gradient-to-b from-indigo-950/40 to-slate-950 border-2 border-indigo-500 rounded-xl p-5 flex flex-col justify-between relative shadow-lg shadow-indigo-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-indigo-600 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
                Most Popular for Teachers
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-indigo-300">Educator Pro</h4>
                  <p className="text-xs text-slate-400 mt-1">For physics teachers and AP instructors</p>
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  $12 <span className="text-xs font-normal text-slate-400">/ month</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlimited AI problem-to-simulation generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Classroom Presentation Mode for Smartboards</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Custom student assignment creation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>One-click printable PDF Lab Report generation</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Step-by-step LaTeX derivation exports</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  alert("Educator Pro tier activated in demo mode!");
                  onClose();
                }}
                className="w-full mt-6 py-2 px-3 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-md shadow-indigo-600/30"
              >
                Start 14-Day Free Educator Trial
              </button>
            </div>

            {/* School / District Plan */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-200">Campus & District</h4>
                  <p className="text-xs text-slate-400 mt-1">For schools, universities, and STEM platforms</p>
                </div>
                <div className="text-2xl font-bold text-slate-100">
                  $49 <span className="text-xs font-normal text-slate-400">/ month</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Unlimited faculty & student seats</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Canvas & Google Classroom LMS integration</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Embeddable interactive iframe widget API</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Priority high-concurrency cloud simulation queue</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => {
                  alert("Campus & District inquiry received! Our academic coordinator will reach out.");
                  onClose();
                }}
                className="w-full mt-6 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Contact School Sales
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>FERPA & COPPA educational compliance certified</span>
            </span>
            <span>All plans include continuous ODE solver updates and physics accuracy guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
};
