import { DependencyNode, DependencyGraph, DependencyEdge, GraphMetrics } from '../types';

/**
 * Graph Engine Service
 * Builds and analyzes dependency graphs
 * Calculates metrics and finds paths
 */

/**
 * Build a dependency graph from nodes
 */
export function buildDependencyGraph(nodes: Map<string, DependencyNode>): DependencyGraph {
  const edges: DependencyEdge[] = [];
  const entryPoints: string[] = [];
  
  // Build edges from imports
  nodes.forEach(node => {
    node.imports.forEach(importPath => {
      edges.push({
        from: node.id,
        to: importPath,
        type: 'import',
        weight: 1,
      });
    });
    
    // Entry points are files with no imports or very few imports
    if (node.imports.length === 0 || (node.name.includes('index') || node.name.includes('main'))) {
      entryPoints.push(node.id);
    }
  });
  
  // Find critical paths (paths to critical nodes)
  const criticalPaths = findCriticalPaths(nodes, edges);
  
  return {
    nodes,
    edges,
    entryPoints,
    criticalPaths,
  };
}

/**
 * Find all paths to critical nodes
 */
function findCriticalPaths(
  nodes: Map<string, DependencyNode>,
  edges: DependencyEdge[]
): string[][] {
  const criticalNodes = Array.from(nodes.values())
    .filter(node => node.isCritical)
    .map(node => node.id);
  
  const paths: string[][] = [];
  
  // For each critical node, find paths from entry points
  criticalNodes.forEach(criticalId => {
    const nodePaths = findPathsToNode(criticalId, edges, nodes);
    paths.push(...nodePaths);
  });
  
  return paths;
}

/**
 * Find all paths to a specific node (BFS)
 */
function findPathsToNode(
  targetId: string,
  edges: DependencyEdge[],
  nodes: Map<string, DependencyNode>,
  maxDepth: number = 10
): string[][] {
  const paths: string[][] = [];
  const visited = new Set<string>();
  
  // Build adjacency list (reverse direction - who imports this)
  const reverseEdges = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!reverseEdges.has(edge.to)) {
      reverseEdges.set(edge.to, []);
    }
    reverseEdges.get(edge.to)!.push(edge.from);
  });
  
  // BFS to find paths
  const queue: { nodeId: string; path: string[]; depth: number }[] = [
    { nodeId: targetId, path: [targetId], depth: 0 }
  ];
  
  while (queue.length > 0 && paths.length < 20) { // Limit to 20 paths
    const { nodeId, path, depth } = queue.shift()!;
    
    if (depth >= maxDepth) continue;
    
    const importers = reverseEdges.get(nodeId) || [];
    
    if (importers.length === 0) {
      // Reached a root node
      paths.push([...path].reverse());
    } else {
      importers.forEach(importerId => {
        if (!path.includes(importerId)) {
          queue.push({
            nodeId: importerId,
            path: [...path, importerId],
            depth: depth + 1,
          });
        }
      });
    }
  }
  
  return paths;
}

/**
 * Find direct dependencies of a file
 */
export function findDirectDependencies(
  targetFile: string,
  graph: DependencyGraph
): string[] {
  const node = graph.nodes.get(targetFile);
  if (!node) return [];
  
  return node.imports;
}

/**
 * Find transitive dependencies (all downstream dependencies)
 */
export function findTransitiveDependencies(
  targetFile: string,
  graph: DependencyGraph,
  maxDepth: number = 10
): { files: string[]; depth: number } {
  const visited = new Set<string>();
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: targetFile, depth: 0 }];
  let maxReachedDepth = 0;
  
  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;
    
    if (visited.has(nodeId) || depth > maxDepth) continue;
    
    visited.add(nodeId);
    maxReachedDepth = Math.max(maxReachedDepth, depth);
    
    const node = graph.nodes.get(nodeId);
    if (node) {
      node.imports.forEach(importPath => {
        if (!visited.has(importPath)) {
          queue.push({ nodeId: importPath, depth: depth + 1 });
        }
      });
    }
  }
  
  // Remove the target file itself
  visited.delete(targetFile);
  
  return {
    files: Array.from(visited),
    depth: maxReachedDepth,
  };
}

/**
 * Find reverse dependencies (files that depend on this file)
 */
export function findReverseDependencies(
  targetFile: string,
  graph: DependencyGraph,
  maxDepth: number = 10
): { files: string[]; depth: number } {
  const visited = new Set<string>();
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: targetFile, depth: 0 }];
  let maxReachedDepth = 0;
  
  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;
    
    if (visited.has(nodeId) || depth > maxDepth) continue;
    
    visited.add(nodeId);
    maxReachedDepth = Math.max(maxReachedDepth, depth);
    
    const node = graph.nodes.get(nodeId);
    if (node) {
      node.importedBy.forEach(importerId => {
        if (!visited.has(importerId)) {
          queue.push({ nodeId: importerId, depth: depth + 1 });
        }
      });
    }
  }
  
  // Remove the target file itself
  visited.delete(targetFile);
  
  return {
    files: Array.from(visited),
    depth: maxReachedDepth,
  };
}

/**
 * Find propagation chains (how changes propagate)
 */
export function findPropagationChains(
  targetFile: string,
  graph: DependencyGraph,
  maxChains: number = 10
): string[][] {
  const chains: string[][] = [];
  const visited = new Set<string>();
  
  function dfs(nodeId: string, path: string[], depth: number) {
    if (depth > 5 || chains.length >= maxChains) return;
    if (visited.has(nodeId)) return;
    
    const node = graph.nodes.get(nodeId);
    if (!node) return;
    
    const newPath = [...path, nodeId];
    
    if (node.importedBy.length === 0) {
      // Reached a leaf node
      chains.push(newPath);
      return;
    }
    
    visited.add(nodeId);
    
    node.importedBy.forEach(importerId => {
      dfs(importerId, newPath, depth + 1);
    });
    
    visited.delete(nodeId);
  }
  
  dfs(targetFile, [], 0);
  
  return chains;
}

/**
 * Detect circular dependencies
 */
export function detectCircularDependencies(graph: DependencyGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  function dfs(nodeId: string, path: string[]): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const node = graph.nodes.get(nodeId);
    if (!node) return false;
    
    for (const importPath of node.imports) {
      if (!visited.has(importPath)) {
        if (dfs(importPath, [...path, nodeId])) {
          return true;
        }
      } else if (recursionStack.has(importPath)) {
        // Found a cycle
        const cycleStart = path.indexOf(importPath);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), nodeId, importPath]);
        }
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  }
  
  graph.nodes.forEach((_, nodeId) => {
    if (!visited.has(nodeId)) {
      dfs(nodeId, []);
    }
  });
  
  return cycles;
}

/**
 * Calculate graph metrics
 */
export function calculateGraphMetrics(graph: DependencyGraph): GraphMetrics {
  const totalFiles = graph.nodes.size;
  const totalDependencies = graph.edges.length;
  const avgDependencies = totalFiles > 0 ? totalDependencies / totalFiles : 0;
  
  // Find critical nodes
  const criticalNodes = Array.from(graph.nodes.values())
    .filter(node => node.isCritical)
    .map(node => node.id);
  
  // Find most coupled files
  const couplingScores = Array.from(graph.nodes.values()).map(node => ({
    file: node.id,
    coupling: node.imports.length + node.importedBy.length,
  }));
  
  const mostCoupled = couplingScores
    .sort((a, b) => b.coupling - a.coupling)
    .slice(0, 10);
  
  // Calculate max depth
  let maxDepth = 0;
  graph.nodes.forEach((_, nodeId) => {
    const { depth } = findTransitiveDependencies(nodeId, graph, 20);
    maxDepth = Math.max(maxDepth, depth);
  });
  
  // Detect circular dependencies
  const circularDependencies = detectCircularDependencies(graph);
  
  return {
    totalFiles,
    totalDependencies,
    avgDependencies: Math.round(avgDependencies * 10) / 10,
    maxDepth,
    criticalNodes,
    circularDependencies,
    mostCoupled,
  };
}

/**
 * Calculate centrality score (how central/important a node is)
 */
export function calculateCentrality(nodeId: string, graph: DependencyGraph): number {
  const node = graph.nodes.get(nodeId);
  if (!node) return 0;
  
  // Simple centrality: combination of in-degree and out-degree
  const inDegree = node.importedBy.length;
  const outDegree = node.imports.length;
  
  // Weight in-degree more heavily (files that depend on this are more important)
  return (inDegree * 2 + outDegree) / (graph.nodes.size || 1);
}

/**
 * Find strongly connected components (groups of mutually dependent files)
 */
export function findStronglyConnectedComponents(graph: DependencyGraph): string[][] {
  const components: string[][] = [];
  const visited = new Set<string>();
  const stack: string[] = [];
  
  // First DFS to fill stack
  function dfs1(nodeId: string) {
    visited.add(nodeId);
    const node = graph.nodes.get(nodeId);
    if (node) {
      node.imports.forEach(importPath => {
        if (!visited.has(importPath)) {
          dfs1(importPath);
        }
      });
    }
    stack.push(nodeId);
  }
  
  // Second DFS on transposed graph
  function dfs2(nodeId: string, component: string[]) {
    visited.add(nodeId);
    component.push(nodeId);
    const node = graph.nodes.get(nodeId);
    if (node) {
      node.importedBy.forEach(importerId => {
        if (!visited.has(importerId)) {
          dfs2(importerId, component);
        }
      });
    }
  }
  
  // Fill stack
  graph.nodes.forEach((_, nodeId) => {
    if (!visited.has(nodeId)) {
      dfs1(nodeId);
    }
  });
  
  // Find components
  visited.clear();
  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    if (!visited.has(nodeId)) {
      const component: string[] = [];
      dfs2(nodeId, component);
      if (component.length > 1) {
        components.push(component);
      }
    }
  }
  
  return components;
}

// Made with Bob
