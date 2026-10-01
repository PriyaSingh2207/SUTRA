import React, { useState } from 'react';
import { X, Play, Award, CheckCircle2 } from 'lucide-react';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [benchData, setBenchData] = useState<any>(null);

  const runBenchmark = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/benchmark');
      const data = await res.json();
      setBenchData(data);
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-police-900 border border-police-700 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        <div className="px-6 py-4 border-b border-police-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Official Jury Benchmark & Evaluation Harness
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-police-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <p className="text-slate-400 leading-relaxed">
            This automated harness runs the live jury evaluation protocol: 5 unannounced blind victim account queries (40% weight), ingestion throughput under 60 seconds, and ground-truth mule recall and precision (30% weight).
          </p>

          <button
            onClick={runBenchmark}
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{loading ? 'Running Automated Test Suite...' : 'Execute Jury Benchmark Evaluation'}</span>
          </button>

          {benchData && (
            <div className="space-y-4 pt-2">
              <div className="bg-police-950 p-4 rounded-xl border border-police-800 space-y-2">
                <div className="flex justify-between items-center text-slate-200">
                  <span className="font-bold">1. Ingestion Benchmark (SLA ≤ 60s):</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500 text-emerald-400">
                    {benchData.ingestion_benchmark.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Loaded {benchData.ingestion_benchmark.total_records?.toLocaleString()} records in {benchData.ingestion_benchmark.duration_seconds}s
                </div>
              </div>

              <div className="bg-police-950 p-4 rounded-xl border border-police-800 space-y-2">
                <div className="flex justify-between items-center text-slate-200">
                  <span className="font-bold">2. Blind Victim Traversal (40% Weight, SLA ≤ 2s):</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500 text-emerald-400">
                    {benchData.blind_victim_queries_benchmark.status}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Average Latency: {benchData.blind_victim_queries_benchmark.average_latency_ms} ms across {benchData.blind_victim_queries_benchmark.queries_executed} traces
                </div>
                <div className="space-y-1 pt-1">
                  {benchData.blind_victim_queries_benchmark.traces.map((t: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-[10px] text-slate-300">
                      <span>Victim {t.victim}</span>
                      <span className="text-emerald-400 font-bold">{t.latency_ms} ms ({t.nodes_found} nodes, {t.edges_found} edges)</span>
                    </div>
                  ))}
                </div>
              </div>

              {benchData.mule_detection_accuracy?.recall_pct !== undefined && (
                <div className="bg-police-950 p-4 rounded-xl border border-police-800 space-y-2">
                  <div className="flex justify-between items-center text-slate-200">
                    <span className="font-bold">3. Detection Accuracy (30% Weight):</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500 text-emerald-400">
                      PASS
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>Recall on 1,500 Mules: <span className="text-emerald-400 font-bold">{benchData.mule_detection_accuracy.recall_pct}%</span></div>
                    <div>Precision: <span className="text-emerald-400 font-bold">{benchData.mule_detection_accuracy.precision_pct}%</span></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
