import React, { useState } from 'react';
import { Database, Play, CheckCircle, Clock, Cpu, HardDrive } from 'lucide-react';
import { SystemStatus } from '../types';

interface IngestionPanelProps {
  status: SystemStatus | null;
  onIngestSuccess: () => void;
}

export const IngestionPanel: React.FC<IngestionPanelProps> = ({ status, onIngestSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleIngest = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ingest', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMsg(`Successfully ingested ${data.total_rows.toLocaleString()} records in ${data.duration_seconds}s!`);
        onIngestSuccess();
      } else {
        setMsg(`Error: ${data.detail || 'Ingestion failed'}`);
      }
    } catch (e: any) {
      setMsg(`Network Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenLoading(true);
    setMsg("Generating 2,000,000 synthetic records with 1,500 ground-truth mules...");
    try {
      const res = await fetch('http://127.0.0.1:8000/api/generate-data?records=2000000', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMsg("2M Records generated successfully! Click 'Ingest 2M Records into DuckDB'.");
      } else {
        setMsg(`Error: ${data.detail || 'Generation failed'}`);
      }
    } catch (e: any) {
      setMsg(`Network Error: ${e.message}`);
    } finally {
      setGenLoading(false);
    }
  };

  return (
    <div className="bg-police-900/80 backdrop-blur-md rounded-2xl border border-police-700/60 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Module A: Vectorized Ingestion Engine (DuckDB 1.1+)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2 py-0.5 rounded">
          SLA Target: ≤ 60s
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-police-950/60 p-3 rounded-xl border border-police-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-mono">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>Total Records</span>
          </div>
          <p className="text-lg font-bold text-white font-mono">
            {status?.is_loaded ? status.total_rows.toLocaleString() : '0'}
          </p>
        </div>

        <div className="bg-police-950/60 p-3 rounded-xl border border-police-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ingest Latency</span>
          </div>
          <p className="text-lg font-bold text-emerald-400 font-mono">
            {status?.is_loaded ? `${status.ingest_duration_seconds}s` : '—'}
          </p>
        </div>

        <div className="bg-police-950/60 p-3 rounded-xl border border-police-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-mono">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Peak RAM Footprint</span>
          </div>
          <p className="text-lg font-bold text-purple-300 font-mono">
            {status?.is_loaded ? `${status.peak_ram_mb} MB` : '—'}
          </p>
        </div>

        <div className="bg-police-950/60 p-3 rounded-xl border border-police-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-mono">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span>SHA-256 Integrity</span>
          </div>
          <p className="text-xs font-bold text-slate-300 font-mono truncate" title={status?.dataset_hash || ''}>
            {status?.dataset_hash ? `${status.dataset_hash.substring(0, 10)}...` : 'Pending'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleIngest}
          disabled={loading || genLoading}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          <span>{loading ? 'Ingesting 2,000,000 Records...' : 'Ingest 2M Records (DuckDB)'}</span>
        </button>

        <button
          onClick={handleGenerate}
          disabled={loading || genLoading}
          className="px-4 py-2 rounded-xl bg-police-800 hover:bg-police-700 border border-police-700 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50"
        >
          {genLoading ? 'Synthesizing...' : 'Regenerate 2M Synthetic Ledger'}
        </button>

        {msg && (
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
            {msg}
          </span>
        )}
      </div>
    </div>
  );
};
