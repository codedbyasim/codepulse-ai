import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { DataSet } from 'vis-data';
import { GraphGenerationResult } from '../types';

interface DependencyGraphVisualizationProps {
  graphData: GraphGenerationResult;
  selectedFile: string | null;
  onNodeClick: (filePath: string) => void;
}

export const DependencyGraphVisualization: React.FC<DependencyGraphVisualizationProps> = ({
  graphData,
  selectedFile,
  onNodeClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'js' | 'ts' | 'py'>('all');
  const [showLabels, setShowLabels] = useState(true);

  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Prepare nodes
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
          
          // Color based on criticality and language
          let color = '#3b82f6'; // blue
          if (isCritical) {
            color = '#ef4444'; // red
          } else if (node.language === 'typescript') {
            color = '#3178c6'; // TS blue
          } else if (node.language === 'python') {
            color = '#3776ab'; // Python blue
          } else if (node.language === 'javascript') {
            color = '#f7df1e'; // JS yellow
          }

          // Size based on complexity and connections
          const baseSize = 20;
          const sizeMultiplier = Math.min(node.complexity / 10, 3);
          const size = baseSize + (sizeMultiplier * 5);

          return {
            id: node.id,
            label: showLabels ? node.label : '',
            title: `${node.label}\nLanguage: ${node.language}\nSize: ${node.size} lines\nComplexity: ${node.complexity}${isCritical ? '\n⚠️ CRITICAL' : ''}`,
            color: {
              background: color,
              border: isSelected ? '#ffffff' : color,
              highlight: {
                background: color,
                border: '#ffffff',
              },
            },
            size,
            borderWidth: isSelected ? 4 : 2,
            font: {
              color: '#ffffff',
              size: 12,
              face: 'monospace',
            },
            shape: isCritical ? 'diamond' : 'dot',
          };
        })
    );

    // Prepare edges
    const nodeIds = new Set(nodes.getIds());
    const edges = new DataSet(
      graphData.graph.edges
        .filter(edge => nodeIds.has(edge.from) && nodeIds.has(edge.to))
        .map(edge => ({
          from: edge.from,
          to: edge.to,
          arrows: 'to',
          color: {
            color: '#94a3b8',
            highlight: '#3b82f6',
          },
          width: 1,
          smooth: {
            type: 'cubicBezier',
            forceDirection: 'horizontal',
            roundness: 0.4,
          },
        }))
    );

    // Network options
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
          gravitationalConstant: -8000,
          centralGravity: 0.3,
          springLength: 150,
          springConstant: 0.04,
          damping: 0.09,
          avoidOverlap: 0.1,
        },
        stabilization: {
          iterations: 200,
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

    // Create network
    const network = new Network(containerRef.current, { nodes, edges }, options);
    networkRef.current = network;

    // Handle node click
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0] as string;
        onNodeClick(nodeId);
      }
    });

    // Highlight selected node
    if (selectedFile && nodeIds.has(selectedFile)) {
      network.selectNodes([selectedFile]);
      network.focus(selectedFile, {
        scale: 1.5,
        animation: {
          duration: 500,
          easingFunction: 'easeInOutQuad',
        },
      });
    }

    // Cleanup
    return () => {
      network.destroy();
    };
  }, [graphData, selectedFile, filter, showLabels, onNodeClick]);

  return (
    <div className="bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl overflow-hidden shadow-lg">
      {/* Controls */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-github-border bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Dependency Graph
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {graphData.graph.nodes.length} nodes • {graphData.graph.edges.length} edges
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 bg-white dark:bg-github-dark border border-gray-300 dark:border-github-border rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 dark:focus:ring-github-accent"
            >
              <option value="all">All Files</option>
              <option value="critical">Critical Only</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
            </select>

            {/* Toggle Labels */}
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                showLabels
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {showLabels ? '🏷️ Labels On' : '🏷️ Labels Off'}
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Critical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: '#3178c6' }}></div>
            <span className="text-gray-600 dark:text-gray-400">TypeScript</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: '#f7df1e' }}></div>
            <span className="text-gray-600 dark:text-gray-400">JavaScript</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ background: '#3776ab' }}></div>
            <span className="text-gray-600 dark:text-gray-400">Python</span>
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div
        ref={containerRef}
        className="w-full bg-gray-900"
        style={{ height: '600px' }}
      />

      {/* Metrics */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-github-border bg-gray-50 dark:bg-gray-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Files</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {graphData.metrics.totalFiles}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Dependencies</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {graphData.metrics.avgDependencies}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Max Depth</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {graphData.metrics.maxDepth}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Critical Nodes</div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">
              {graphData.metrics.criticalNodes.length}
            </div>
          </div>
        </div>

        {graphData.metrics.circularDependencies.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-500/50 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-medium">
                {graphData.metrics.circularDependencies.length} circular dependencies detected
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

