import React, { useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { NodeEntity, LinkEntity } from '../types';

interface ForceGraphViewProps {
  nodes: NodeEntity[];
  edges: LinkEntity[];
  onSelectNode: (node: NodeEntity) => void;
  selectedNodeId: string | null;
}

export const ForceGraphView: React.FC<ForceGraphViewProps> = ({
  nodes,
  edges,
  onSelectNode,
  selectedNodeId
}) => {
  const fgRef = useRef<any>(null);

  const resolveColor = useCallback((node: NodeEntity) => {
    if (node.id === selectedNodeId) return '#38BDF8'; // Bright cyan selection
    if (node.layer === 'L0_VICTIM') return '#3B82F6';   // Blue
    if (node.layer === 'L1_COLLECTOR') return '#EF4444'; // Red
    if (node.layer === 'L2_DISTRIBUTOR') return '#F59E0B'; // Amber
    if (node.layer === 'L3_TERMINAL') return '#A855F7'; // Purple
    if (node.layer === 'SUSPECT_MULE') return '#EC4899'; // Pink
    return '#94A3B8'; // Slate
  }, [selectedNodeId]);

  return (
    <div className="relative w-full h-full bg-police-950 overflow-hidden">
      {/* Legend overlay */}
      <div className="absolute top-4 left-4 z-10 bg-police-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-police-700/60 text-xs text-slate-300 font-mono shadow-xl flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/20" />
          <span>L0 Victim</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-red-500/20" />
          <span>L1 Collector</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-500/20" />
          <span>L2 Distributor</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-purple-500/20" />
          <span>L3 Cash-Out</span>
        </div>
      </div>

      <ForceGraph2D
        ref={fgRef}
        graphData={{ nodes, links: edges }}
        nodeLabel={(n: any) => `Account: ${n.id}\nBank: ${n.bank}\nLayer: ${n.layer}`}
        nodeColor={(n: any) => resolveColor(n)}
        nodeVal={(n: any) => (n.layer === 'L0_VICTIM' ? 9 : 6)}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkColor={(l: any) => (l.is_scam ? '#EF4444' : '#334155')}
        linkWidth={(l: any) => Math.min(5, Math.max(1.2, Math.log10(l.amount || 100) - 2))}
        onNodeClick={(n: any) => {
          onSelectNode(n);
          fgRef.current?.centerAt(n.x, n.y, 600);
          fgRef.current?.zoom(3.5, 600);
        }}
        cooldownTicks={80}
      />
    </div>
  );
};
