import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { GraphGenerationResult } from '../types';
import { Filter, Eye, EyeOff, LayoutGrid, Info, HelpCircle, RefreshCw } from 'lucide-react';

interface DependencyGraphVisualizationProps {
  graphData: GraphGenerationResult;
  selectedFile: string | null;
  onNodeClick: (filePath: string) => void;
  theme: 'dark' | 'light';
}

export const DependencyGraphVisualization: React.FC<DependencyGraphVisualizationProps> = ({
  graphData,
  selectedFile,
  onNodeClick,
  theme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'js' | 'ts' | 'py'>('all');
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    const nodes = new DataSet(
      graphData.graph.nodes
        .filter(node => {
          if (filter === 'all') return true;
          if (filter === 'critical') return node.isCritical;
          return node.language === filter;
        })
        .map(node => {
          const isSelected = node.id === selectedFile;
          const isCritical = node.isCritical;
          
          let color = '#06b6d4';
          if (isCritical) {
            color = '#ef4444';
          } else if (node.language === 'typescript') {
            color = '#3b82f6';
          } else if (node.language === 'python') {
            color = '#10b981';
          } else if (node.language === 'javascript') {
            color = '#eab308';
          }

          const baseSize = 22;
          const sizeMultiplier = Math.min(node.complexity / 10, 3);
          const size = baseSize + (sizeMultiplier * 5);

          return {
            id: node.id,
            label: showLabels ? node.label : '',
            title: `${node.label}\nLanguage: ${node.language}\nSize: ${node.size} lines\nComplexity: ${node.complexity}${isCritical ? '\n⚠️ CRITICAL' : ''}`,
            color: {
              background: color,
              border: isSelected ? (theme === 'dark' ? '#ffffff' : '#0f172a') : color,
              highlight: {
                background: color,
                border: theme === 'dark' ? '#ffffff' : '#0f172a',
              },
            },
            size,
            borderWidth: isSelected ? 4 : 2,
            font: {
              color: theme === 'dark' ? '#ffffff' : '#0f172a',
              size: 12,
              face: 'monospace',
            },
            shape: isCritical ? 'diamond' : 'dot',
          };
        })
    );

    const nodeIds = new Set(nodes.getIds());
    const edges = new DataSet(
      graphData.graph.edges
        .filter(edge => nodeIds.has(edge.from) && nodeIds.has(edge.to))
        .map(edge => ({
          from: edge.from,
          to: edge.to,
          arrows: 'to',
          color: {
            color: theme === 'dark' ? 'rgba(148, 163, 184, 0.3)' : 'rgba(71, 85, 105, 0.35)',
            highlight: '#3b82f6',
          },
          width: 1,
          smooth: {
            type: 'cubicBezier',
            forceDirection: 'horizontal',
            roundness: 0.45,
          },
        }))
    );

    const options = {
      nodes: {
        shadow: true,
      },
      edges: {
        shadow: true,
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -7500,
          centralGravity: 0.28,
          springLength: 140,
          springConstant: 0.04,
          damping: 0.1,
          avoidOverlap: 0.15,
        },
        stabilization: {
          iterations: 180,
          updateInterval: 25,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        navigationButtons: true,
        keyboard: true,
      },
      layout: {
        improvedLayout: true,
        hierarchical: false,
      },
    };

    const network = new Network(containerRef.current, { nodes, edges }, options);
    networkRef.current = network;

    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0] as string;
        onNodeClick(nodeId);
      }
    });

    if (selectedFile && nodeIds.has(selectedFile)) {
      network.selectNodes([selectedFile]);
      network.focus(selectedFile, {
        scale: 1.4,
        animation: {
          duration: 500,
          easingFunction: 'easeInOutQuad',
        },
      });
    }

    return () => {
      network.destroy();
    };
  }, [graphData, selectedFile, filter, showLabels, onNodeClick]);

  return (
    <div className="bg-white dark:bg-github-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg">
      
      {/* Control panel */}
      <div className="px-6 py-4.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-github-card flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <LayoutGrid className="w-5 h-5 text-cyan-555" />
              <span>Interactive Dependency Graph</span>
            </h3>
            <p className="text-xs text-slate-450 font-mono mt-0.5">
              {graphData.graph.nodes.length} registered modules • {graphData.graph.edges.length} connections
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter Selector */}
            <div className="relative flex items-center bg-white dark:bg-[#0d1117] border border-slate-250 dark:border-slate-800 rounded-xl px-2.5 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-transparent text-xs text-slate-700 dark:text-slate-350 focus:outline-none pr-4 font-semibold"
              >
                <option value="all">All Modules</option>
                <option value="critical">Critical Path</option>
                <option value="javascript">JavaScript (.js)</option>
                <option value="typescript">TypeScript (.ts)</option>
                <option value="python">Python (.py)</option>
              </select>
            </div>

            {/* Labels toggle */}
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                showLabels
                  ? 'bg-cyan-550 border-cyan-555 text-white shadow-md shadow-cyan-500/10'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400'
              }`}
            >
              {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showLabels ? 'Labels Active' : 'Labels Hidden'}</span>
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-500/25"></div>
            <span>Critical Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/25"></div>
            <span>TypeScript</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-500/25"></div>
            <span>JavaScript</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/25"></div>
            <span>Python</span>
          </div>
        </div>
      </div>

      {/* Graph Area */}
      <div
        ref={containerRef}
        className="w-full bg-[#f8fafc] dark:bg-[#090d16] transition-colors duration-300"
        style={{ height: '580px' }}
      />

      {/* Metrics Row */}
      <div className="px-6 py-4.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-github-card">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-white dark:bg-[#0d1117] rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Assets</div>
            <div className="text-base font-extrabold text-slate-800 dark:text-white">
              {graphData.metrics.totalFiles}
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-[#0d1117] rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Avg Indegree</div>
            <div className="text-base font-extrabold text-slate-800 dark:text-white">
              {graphData.metrics.avgDependencies}
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-[#0d1117] rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Max depth</div>
            <div className="text-base font-extrabold text-slate-800 dark:text-white">
              {graphData.metrics.maxDepth}
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-[#0d1117] rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Critical Modules</div>
            <div className="text-base font-extrabold text-red-500">
              {graphData.metrics.criticalNodes.length}
            </div>
          </div>
        </div>

        {graphData.metrics.circularDependencies.length > 0 && (
          <div className="mt-4 p-3.5 bg-yellow-500/5 border border-yellow-500/15 rounded-xl flex items-center gap-2 text-yellow-600 dark:text-yellow-450 text-xs font-semibold">
            <HelpCircle className="w-4 h-4 text-yellow-500" />
            <span>{graphData.metrics.circularDependencies.length} circular reference paths detected in compilation tree.</span>
          </div>
        )}
      </div>
    </div>
  );
};
