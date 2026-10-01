import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { IngestionPanel } from './components/IngestionPanel';
import { BlindQueryTrace } from './components/BlindQueryTrace';
import { ForceGraphView } from './components/ForceGraphView';
import { TemporalSlider } from './components/TemporalSlider';
import { NodeDetailPanel } from './components/NodeDetailPanel';
import { MuleRingsTable } from './components/MuleRingsTable';
import { LegalDocumentsModal } from './components/LegalDocumentsModal';
import { PSChecklistModal } from './components/PSChecklistModal';
import { BenchmarkModal } from './components/BenchmarkModal';
import { NodeEntity, LinkEntity, SystemStatus, MuleCandidate } from './types';

export function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [testVictims, setTestVictims] = useState<string[]>([]);
  const [nodes, setNodes] = useState<NodeEntity[]>([]);
  const [edges, setEdges] = useState<LinkEntity[]>([]);
  const [filteredEdges, setFilteredEdges] = useState<LinkEntity[]>([]);
  const [temporalThreshold, setTemporalThreshold] = useState<number>(Infinity);
  const [selectedNode, setSelectedNode] = useState<NodeEntity | null>(null);
  const [mules, setMules] = useState<MuleCandidate[]>([]);
  const [tracing, setTracing] = useState(false);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);

  // Modals state
  const [checklistOpen, setChecklistOpen] = useState(false);
  const [benchmarkOpen, setBenchmarkOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docData, setDocData] = useState<any>(null);

  // Fetch initial status and victims
  const refreshStatus = () => {
    fetch('http://127.0.0.1:8000/api/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => {});
  };

  useEffect(() => {
    refreshStatus();
    fetch('http://127.0.0.1:8000/api/test-victims')
      .then((res) => res.json())
      .then((data) => setTestVictims(data.victims || []))
      .catch(() => {});
  }, []);

  // Refresh mules when dataset loaded
  const refreshMules = () => {
    fetch('http://127.0.0.1:8000/api/mules?limit=30')
      .then((res) => res.json())
      .then((data) => setMules(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (status?.is_loaded) {
      refreshMules();
    }
  }, [status?.is_loaded]);

  // Handle temporal slider filter
  useEffect(() => {
    if (temporalThreshold === Infinity || !temporalThreshold) {
      setFilteredEdges(edges);
    } else {
      setFilteredEdges(edges.filter((e) => e.timestamp_epoch <= temporalThreshold));
    }
  }, [edges, temporalThreshold]);

  // Trace victim trail
  const handleTraceVictim = async (victimId: string) => {
    setTracing(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/trace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victim_account_id: victimId, max_hops: 4 })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setLastLatencyMs(data.latency_ms);
        setTemporalThreshold(Infinity);
      } else {
        alert(data.message || 'Trace failed');
      }
    } catch (e: any) {
      alert('Error tracing: ' + e.message);
    } finally {
      setTracing(false);
    }
  };

  // Isolate syndicate ring
  const handleIsolateRing = async (accountId: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspect_account_id: accountId, radius_hops: 2 })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setTemporalThreshold(Infinity);
      }
    } catch (e: any) {
      alert('Error isolating ring: ' + e.message);
    }
  };

  // Generate legal documents
  const handleGenerateDocuments = async (accountId: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victim_account_id: accountId })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setDocData(data);
        setDocModalOpen(true);
      } else {
        alert(data.detail || 'Could not generate documents');
      }
    } catch (e: any) {
      alert('Error generating documents: ' + e.message);
    }
  };

  return (
    <div className="min-h-screen bg-police-950 text-slate-100 flex flex-col font-sans">
      <Header
        status={status}
        onOpenChecklist={() => setChecklistOpen(true)}
        onOpenBenchmark={() => setBenchmarkOpen(true)}
      />

      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1800px] w-full mx-auto">
        {/* Left Column: Ingestion, Blind Search & Mules */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <IngestionPanel
            status={status}
            onIngestSuccess={() => {
              refreshStatus();
              refreshMules();
            }}
          />
          <BlindQueryTrace
            testVictims={testVictims}
            onTrace={handleTraceVictim}
            tracing={tracing}
            lastLatencyMs={lastLatencyMs}
          />
          <MuleRingsTable
            mules={mules}
            onSelectMule={(accId) => {
              const found = nodes.find((n) => n.id === accId);
              if (found) setSelectedNode(found);
            }}
            onIsolateRing={handleIsolateRing}
          />
        </div>

        {/* Right Column: WebGL Force Graph & Playback */}
        <div className="lg:col-span-8 flex flex-col gap-3 h-[85vh] relative">
          <div className="flex-1 rounded-2xl overflow-hidden border border-police-700/60 shadow-2xl relative">
            <ForceGraphView
              nodes={nodes}
              edges={filteredEdges}
              onSelectNode={(n) => setSelectedNode(n)}
              selectedNodeId={selectedNode?.id || null}
            />

            <NodeDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onIsolateRing={handleIsolateRing}
              onGenerateDoc={handleGenerateDocuments}
            />
          </div>

          <TemporalSlider
            edges={edges}
            activeThreshold={temporalThreshold}
            onChangeThreshold={(val) => setTemporalThreshold(val)}
          />
        </div>
      </main>

      {/* Modals */}
      <LegalDocumentsModal
        isOpen={docModalOpen}
        onClose={() => setDocModalOpen(false)}
        data={docData}
      />

      <PSChecklistModal
        isOpen={checklistOpen}
        onClose={() => setChecklistOpen(false)}
        status={status}
      />

      <BenchmarkModal
        isOpen={benchmarkOpen}
        onClose={() => setBenchmarkOpen(false)}
      />
    </div>
  );
}

export default App;
