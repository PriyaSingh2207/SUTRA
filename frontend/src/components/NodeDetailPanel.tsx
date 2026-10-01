import React, { useState, useEffect } from 'react';
import { X, FileText, Share2, AlertCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { NodeEntity, AccountProfile } from '../types';

interface NodeDetailPanelProps {
  node: NodeEntity | null;
  onClose: () => void;
  onIsolateRing: (accountId: string) => void;
  onGenerateDoc: (accountId: string) => void;
}

export const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({
  node,
  onClose,
  onIsolateRing,
  onGenerateDoc
}) => {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (node) {
      setLoading(true);
      fetch(`http://127.0.0.1:8000/api/account/${node.id}`)
        .then((res) => res.json())
        .then((data) => setProfile(data))
        .catch(() => setProfile(null))
        .finally(() => setLoading(false));
    }
  }, [node]);

  if (!node) return null;

  return (
    <div className="absolute top-4 right-4 z-20 w-80 bg-police-900/95 backdrop-blur-xl border border-police-700 rounded-2xl shadow-2xl p-4 flex flex-col max-h-[85vh] overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-police-800 mb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 bg-blue-950/60 border border-blue-500/30 px-2 py-0.5 rounded">
            {node.layer}
          </span>
          <h3 className="text-sm font-bold text-white font-mono mt-1">{node.id}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-police-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs font-mono">
        <div className="bg-police-950/70 p-3 rounded-xl border border-police-800/80">
          <span className="text-slate-400 text-[11px] block">Custodian Bank:</span>
          <span className="text-white font-semibold">{node.bank}</span>
        </div>

        {loading ? (
          <div className="text-center py-6 text-slate-400">Loading ledger profile...</div>
        ) : profile ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-police-950/70 p-2.5 rounded-xl border border-police-800/80">
                <span className="text-slate-400 text-[10px] flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-400" />
                  Credits
                </span>
                <span className="text-emerald-400 font-bold block mt-0.5">
                  ₹{profile.total_credits.toLocaleString()}
                </span>
              </div>
              <div className="bg-police-950/70 p-2.5 rounded-xl border border-police-800/80">
                <span className="text-slate-400 text-[10px] flex items-center gap-1">
                  <ArrowUpRight className="w-3 h-3 text-red-400" />
                  Debits
                </span>
                <span className="text-red-400 font-bold block mt-0.5">
                  ₹{profile.total_debits.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-police-950/70 p-2.5 rounded-xl border border-police-800/80">
              <span className="text-slate-400 text-[10px] block">Net Retention:</span>
              <span className="text-slate-200 font-bold">
                ₹{profile.net_retention.toLocaleString()}
              </span>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-400 text-[11px] block font-bold">Recent Counterparties:</span>
              {profile.outgoing.slice(0, 3).map((out, idx) => (
                <div key={idx} className="bg-police-950/40 p-2 rounded-lg border border-police-800/50 text-[10px]">
                  <div className="flex justify-between text-slate-300">
                    <span>To: {out.receiver}</span>
                    <span className="text-red-400 font-bold">₹{out.amount.toLocaleString()}</span>
                  </div>
                  <span className="text-slate-500 block truncate">{out.narration}</span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      <div className="pt-3 border-t border-police-800 mt-3 space-y-2">
        <button
          onClick={() => onIsolateRing(node.id)}
          className="w-full py-2 rounded-xl bg-police-800 hover:bg-police-700 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-police-700 transition-all"
        >
          <Share2 className="w-3.5 h-3.5 text-blue-400" />
          <span>One-Click Ring Isolation</span>
        </button>

        <button
          onClick={() => onGenerateDoc(node.id)}
          className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Generate Legal Notice & Case Diary</span>
        </button>
      </div>
    </div>
  );
};
