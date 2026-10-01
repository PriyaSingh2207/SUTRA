import React from 'react';
import { Shield, Database, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SystemStatus } from '../types';

interface HeaderProps {
  status: SystemStatus | null;
  onOpenChecklist: () => void;
  onOpenBenchmark: () => void;
}

export const Header: React.FC<HeaderProps> = ({ status, onOpenChecklist, onOpenBenchmark }) => {
  return (
    <header className="bg-police-900 border-b border-police-700/60 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              OPERATION ABHEDYA-CHAKRA
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
              Indore Police Cyber Cell
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            High-Throughput Multi-Tier Money Mule Detection & Forensic Triage Engine (Void Hacks 8.0)
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Air-gap Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
          <Lock className="w-3.5 h-3.5" />
          <span>Air-Gapped (127.0.0.1)</span>
        </div>

        {/* Dataset Status */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-police-800 border border-police-700 text-slate-300 text-xs font-mono">
          <Database className="w-3.5 h-3.5 text-indigo-400" />
          <span>
            {status?.is_loaded ? (
              <span className="text-emerald-400 font-bold">{status.total_rows.toLocaleString()} Records Indexed</span>
            ) : (
              <span className="text-amber-400">Dataset Not Ingested</span>
            )}
          </span>
        </div>

        {/* Action Buttons */}
        <button
          onClick={onOpenBenchmark}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
        >
          <span>🏆 Jury Benchmarks</span>
        </button>

        <button
          onClick={onOpenChecklist}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>PS Compliance Checklist</span>
        </button>
      </div>
    </header>
  );
};
