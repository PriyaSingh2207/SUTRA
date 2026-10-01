import React, { useState } from 'react';
import { Search, Zap, ArrowRight, ShieldAlert, Award } from 'lucide-react';

interface BlindQueryTraceProps {
  testVictims: string[];
  onTrace: (victimId: string) => Promise<void>;
  tracing: boolean;
  lastLatencyMs: number | null;
}

export const BlindQueryTrace: React.FC<BlindQueryTraceProps> = ({
  testVictims,
  onTrace,
  tracing,
  lastLatencyMs
}) => {
  const [inputAcc, setInputAcc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAcc.trim()) {
      onTrace(inputAcc.trim());
    }
  };

  return (
    <div className="bg-police-900/80 backdrop-blur-md rounded-2xl border border-police-700/60 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Blind Victim Query Test (40% Jury Evaluation)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-blue-400 bg-blue-950/50 border border-blue-500/30 px-2 py-0.5 rounded">
          SLA Target: ≤ 2.0s (4-Hop Depth)
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Enter 12-Digit Victim Account Number (e.g. 100000001000)..."
            value={inputAcc}
            onChange={(e) => setInputAcc(e.target.value)}
            className="w-full bg-police-950/80 border border-police-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={tracing || !inputAcc.trim()}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
        >
          {tracing ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Zap className="w-3.5 h-3.5" />
          )}
          <span>{tracing ? 'Tracing...' : 'Trace Money Trail'}</span>
        </button>
      </form>

      {/* 5 Blind Test Victims shortcuts */}
      <div>
        <span className="text-xs text-slate-400 font-mono block mb-1.5">
          Or test unannounced victim IDs from evaluation seed:
        </span>
        <div className="flex flex-wrap gap-2">
          {testVictims.map((vic, idx) => (
            <button
              key={vic}
              type="button"
              onClick={() => {
                setInputAcc(vic);
                onTrace(vic);
              }}
              className="px-2.5 py-1 rounded-lg bg-police-950 hover:bg-police-800 border border-police-700/70 text-slate-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1"
            >
              <span className="text-amber-400 font-bold">#{idx + 1}</span>
              <span>{vic}</span>
            </button>
          ))}

          {lastLatencyMs !== null && (
            <div className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <span>Executed in {lastLatencyMs} ms</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
