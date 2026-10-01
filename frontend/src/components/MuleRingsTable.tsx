import React from 'react';
import { AlertTriangle, Share2 } from 'lucide-react';
import { MuleCandidate } from '../types';

interface MuleRingsTableProps {
  mules: MuleCandidate[];
  onSelectMule: (accId: string) => void;
  onIsolateRing: (accId: string) => void;
}

export const MuleRingsTable: React.FC<MuleRingsTableProps> = ({
  mules,
  onSelectMule,
  onIsolateRing
}) => {
  return (
    <div className="bg-police-900/80 backdrop-blur-md rounded-2xl border border-police-700/60 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Flagged Money Mule Accounts (Mule Risk Index 0–100)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Ranked by Velocity (35%), Topology (25%), Proxies (15%), Narration (15%)
        </span>
      </div>

      <div className="overflow-x-auto max-h-60 overflow-y-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-police-950/80 text-slate-400 sticky top-0 border-b border-police-800">
            <tr>
              <th className="py-2 px-3">Account ID</th>
              <th className="py-2 px-3">Bank</th>
              <th className="py-2 px-3">MRI Score</th>
              <th className="py-2 px-3">Fan-In / Out</th>
              <th className="py-2 px-3">Pass-Through</th>
              <th className="py-2 px-3">Forensic Reason Codes</th>
              <th className="py-2 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-police-800/60 text-slate-300">
            {mules.map((m) => (
              <tr key={m.account_id} className="hover:bg-police-800/40 transition-colors">
                <td className="py-2 px-3 font-bold text-blue-400 cursor-pointer" onClick={() => onSelectMule(m.account_id)}>
                  {m.account_id}
                </td>
                <td className="py-2 px-3">{m.bank_name}</td>
                <td className="py-2 px-3">
                  <span className="px-2 py-0.5 rounded-full font-bold text-[11px] bg-red-950/80 text-red-400 border border-red-500/30">
                    {m.mule_risk_index}
                  </span>
                </td>
                <td className="py-2 px-3">{m.in_degree} in / {m.out_degree} out</td>
                <td className="py-2 px-3 text-amber-400 font-bold">{(m.pass_through_ratio * 100).toFixed(1)}%</td>
                <td className="py-2 px-3 text-[11px] text-slate-400 max-w-xs truncate" title={m.reason_codes.join(' | ')}>
                  {m.reason_codes.join(' | ')}
                </td>
                <td className="py-2 px-3 text-right">
                  <button
                    onClick={() => onIsolateRing(m.account_id)}
                    className="p-1 rounded bg-police-800 hover:bg-police-700 text-blue-400 transition-all inline-flex items-center gap-1 text-[11px] px-2"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Isolate</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
