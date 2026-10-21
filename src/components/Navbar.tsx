import React from "react";
import { Atom, FileSpreadsheet, Presentation, CreditCard, Sparkles } from "lucide-react";

interface NavbarProps {
  onOpenReport: () => void;
  onOpenPlans: () => void;
  isPresentationMode: boolean;
  onTogglePresentationMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenReport,
  onOpenPlans,
  isPresentationMode,
  onTogglePresentationMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Atom className="w-5 h-5 text-indigo-400 animate-spin-slow" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-tight text-white">
                PhysiCraft
              </span>
              <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800/60">
                Live Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Turn any physics problem into an interactive simulation
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onTogglePresentationMode}
            title="Classroom Projector Presentation Mode"
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              isPresentationMode
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                : "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
            }`}
          >
            <Presentation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isPresentationMode ? "Exit Presentation" : "Classroom Mode"}
            </span>
          </button>

          <button
            onClick={onOpenReport}
            title="Generate Printable Lab Report"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export Lab Report</span>
          </button>

          <button
            onClick={onOpenPlans}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Classroom Plans</span>
          </button>
        </div>
      </div>
    </header>
  );
};
