import { 
  DependencyGraph, 
  DependencyNode, 
  BlastRadiusResult,
  GraphGenerationResult,
  FileContent 
} from '../types';
import { 
  createDependencyNode, 
  buildReverseDependencies 
} from './dependencyParser';
import { 
  buildDependencyGraph, 
  calculateGraphMetrics 
} from './graphEngine';
import { analyzeBlastRadius } from './riskAnalyzer';

/**
 * Blast Radius Service
 * Main orchestrator for blast radius analysis
 * Integrates parsing, graph building, risk analysis, and AI insights
 */

// In-memory cache for dependency graphs
const graphCache = new Map<string, { graph: DependencyGraph; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Generate dependency graph from repository files
 */
export async function generateDependencyGraph(
  files: FileContent[]
): Promise<DependencyGraph> {
  console.log(`📊 Building dependency graph from ${files.length} files...`);
  
  // Create nodes from all files
  const nodes = new Map<string, DependencyNode>();
  const allFilePaths = files.map(f => f.path);
  
  files.forEach(file => {
    try {
      const node = createDependencyNode(file.path, file.content, allFilePaths);
      nodes.set(file.path, node);
    } catch (error) {
      console.error(`Failed to parse ${file.path}:`, error);
    }
  });
  
  // Build reverse dependencies
  buildReverseDependencies(nodes);
  
  // Build the graph
  const graph = buildDependencyGraph(nodes);
  
  console.log(`✅ Graph built: ${nodes.size} nodes, ${graph.edges.length} edges`);
  
  return graph;
}

/**
 * Get or create cached dependency graph
 */
export async function getCachedGraph(
  repoKey: string,
  files: FileContent[]
): Promise<DependencyGraph> {
  const cached = graphCache.get(repoKey);
  
  // Check if cache is valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📦 Using cached dependency graph');
    return cached.graph;
  }
  
  // Generate new graph
  const graph = await generateDependencyGraph(files);
  
  // Cache it
  graphCache.set(repoKey, {
    graph,
    timestamp: Date.now(),
  });
  
  return graph;
}

/**
 * Clear cache for a specific repo
 */
export function clearGraphCache(repoKey: string): void {
  graphCache.delete(repoKey);
}

/**
 * Generate AI insights for blast radius analysis
 */
export async function generateAIInsights(
  result: BlastRadiusResult,
  targetNode: DependencyNode,
  graph: DependencyGraph
): Promise<string> {
  const { riskLevel, affectedFiles, criticalImpacts, couplingMetrics } = result;
  
  // Build context for AI
  const context = `
File: ${targetNode.name}
Language: ${targetNode.language}
Risk Level: ${riskLevel}
Impact Score: ${result.impactScore}/100
Lines of Code: ${targetNode.size}
Complexity: ${targetNode.complexity}
Is Critical: ${targetNode.isCritical ? 'Yes' : 'No'}

Affected Files:
- Direct dependents: ${affectedFiles.direct.length}
- Total affected: ${affectedFiles.total}
- Propagation depth: ${affectedFiles.depth}

Coupling Metrics:
- Afferent Coupling (Ca): ${couplingMetrics.afferentCoupling}
- Efferent Coupling (Ce): ${couplingMetrics.efferentCoupling}
- Instability: ${couplingMetrics.instability}

Critical Impacts: ${criticalImpacts.length}
${criticalImpacts.slice(0, 3).map(ci => `- ${ci.reason}`).join('\n')}
`.trim();
  
  // Generate natural language explanation
  let insights = '';
  
  if (riskLevel === 'CRITICAL') {
    insights = `⚠️ **CRITICAL RISK**: Modifying \`${targetNode.name}\` could have severe consequences. `;
    
    if (targetNode.isCritical) {
      insights += `This is a critical module handling ${targetNode.name.includes('auth') ? 'authentication' : targetNode.name.includes('payment') ? 'payments' : 'core functionality'}. `;
    }
    
    if (affectedFiles.total > 20) {
      insights += `Changes will propagate to ${affectedFiles.total} files across ${affectedFiles.depth} dependency levels. `;
    }
    
    if (criticalImpacts.length > 0) {
      insights += `This impacts ${criticalImpacts.length} critical system component(s). `;
    }
    
    insights += `\n\n**Recommendation**: Require senior engineer review, comprehensive testing, and staged rollout.`;
    
  } else if (riskLevel === 'HIGH') {
    insights = `⚡ **HIGH RISK**: Changes to \`${targetNode.name}\` require careful consideration. `;
    
    if (couplingMetrics.afferentCoupling > 10) {
      insights += `${couplingMetrics.afferentCoupling} files directly depend on this module. `;
    }
    
    if (affectedFiles.depth > 3) {
      insights += `Changes will cascade through ${affectedFiles.depth} levels of dependencies. `;
    }
    
    insights += `\n\n**Recommendation**: Thorough code review, integration testing, and monitoring after deployment.`;
    
  } else if (riskLevel === 'MEDIUM') {
    insights = `📋 **MEDIUM RISK**: \`${targetNode.name}\` has moderate impact on the codebase. `;
    
    if (affectedFiles.total > 5) {
      insights += `Approximately ${affectedFiles.total} files may be affected. `;
    }
    
    insights += `\n\n**Recommendation**: Standard review process with unit tests for affected modules.`;
    
  } else {
    insights = `✅ **LOW RISK**: Changes to \`${targetNode.name}\` have minimal impact. `;
    
    if (affectedFiles.total === 0) {
      insights += `This file has no dependents. `;
    } else {
      insights += `Only ${affectedFiles.total} file(s) affected. `;
    }
    
    insights += `\n\n**Recommendation**: Standard review and testing procedures apply.`;
  }
  
  // Add coupling insights
  if (couplingMetrics.instability > 0.7) {
    insights += `\n\n💡 **Coupling Note**: High instability (${couplingMetrics.instability}) suggests this module is highly dependent on others. Consider reducing dependencies.`;
  } else if (couplingMetrics.instability < 0.3 && couplingMetrics.afferentCoupling > 5) {
    insights += `\n\n💡 **Coupling Note**: Low instability (${couplingMetrics.instability}) with high afferent coupling indicates this is a stable, widely-used module. Changes require extra caution.`;
  }
  
  return insights;
}

/**
 * Perform complete blast radius analysis with AI insights
 */
export async function performBlastRadiusAnalysis(
  targetFile: string,
  files: FileContent[],
  repoKey: string
): Promise<BlastRadiusResult> {
  console.log(`🎯 Analyzing blast radius for: ${targetFile}`);
  
  // Get or build dependency graph
  const graph = await getCachedGraph(repoKey, files);
  
  // Perform risk analysis
  const result = analyzeBlastRadius(targetFile, graph);
  
  // Get target node for AI context
  const targetNode = graph.nodes.get(targetFile);
  if (!targetNode) {
    throw new Error(`Target file not found: ${targetFile}`);
  }
  
  // Generate AI insights
  result.aiInsights = await generateAIInsights(result, targetNode, graph);
  
  console.log(`✅ Analysis complete: ${result.riskLevel} risk, ${result.affectedFiles.total} files affected`);
  
  return result;
}

/**
 * Generate graph visualization data
 */
export async function generateGraphVisualization(
  files: FileContent[],
  repoKey: string
): Promise<GraphGenerationResult> {
  console.log('🎨 Generating graph visualization data...');
  
  // Get or build dependency graph
  const graph = await getCachedGraph(repoKey, files);
  
  // Calculate metrics
  const metrics = calculateGraphMetrics(graph);
  
  // Convert graph to visualization format
  const nodes = Array.from(graph.nodes.values()).map(node => ({
    id: node.id,
    label: node.name,
    type: node.type,
    language: node.language,
    isCritical: node.isCritical,
    size: node.size,
    complexity: node.complexity,
  }));
  
  console.log(`✅ Visualization data ready: ${nodes.length} nodes, ${graph.edges.length} edges`);
  
  return {
    graph: {
      nodes,
      edges: graph.edges,
    },
    metrics,
  };
}

/**
 * Find most impactful files in the repository
 */
export async function findMostImpactfulFiles(
  files: FileContent[],
  repoKey: string,
  limit: number = 10
): Promise<Array<{ file: string; impactScore: number; riskLevel: string }>> {
  console.log('🔍 Finding most impactful files...');
  
  const graph = await getCachedGraph(repoKey, files);
  
  const results: Array<{ file: string; impactScore: number; riskLevel: string }> = [];
  
  // Analyze all files
  graph.nodes.forEach((node, filePath) => {
    try {
      const analysis = analyzeBlastRadius(filePath, graph);
      results.push({
        file: filePath,
        impactScore: analysis.impactScore,
        riskLevel: analysis.riskLevel,
      });
    } catch (error) {
      // Skip files that fail analysis
    }
  });
  
  // Sort by impact score
  results.sort((a, b) => b.impactScore - a.impactScore);
  
  return results.slice(0, limit);
}

/**
 * Compare blast radius between two files
 */
export async function compareBlastRadius(
  file1: string,
  file2: string,
  files: FileContent[],
  repoKey: string
): Promise<{
  file1: BlastRadiusResult;
  file2: BlastRadiusResult;
  comparison: string;
}> {
  const graph = await getCachedGraph(repoKey, files);
  
  const result1 = analyzeBlastRadius(file1, graph);
  const result2 = analyzeBlastRadius(file2, graph);
  
  const node1 = graph.nodes.get(file1);
  const node2 = graph.nodes.get(file2);
  
  if (node1) result1.aiInsights = await generateAIInsights(result1, node1, graph);
  if (node2) result2.aiInsights = await generateAIInsights(result2, node2, graph);
  
  // Generate comparison
  let comparison = `## Blast Radius Comparison\n\n`;
  comparison += `### ${file1}\n`;
  comparison += `- Risk: ${result1.riskLevel} (${result1.impactScore}/100)\n`;
  comparison += `- Affected Files: ${result1.affectedFiles.total}\n\n`;
  comparison += `### ${file2}\n`;
  comparison += `- Risk: ${result2.riskLevel} (${result2.impactScore}/100)\n`;
  comparison += `- Affected Files: ${result2.affectedFiles.total}\n\n`;
  
  if (result1.impactScore > result2.impactScore) {
    comparison += `**Conclusion**: ${file1} has higher impact and should be modified with more caution.`;
  } else if (result2.impactScore > result1.impactScore) {
    comparison += `**Conclusion**: ${file2} has higher impact and should be modified with more caution.`;
  } else {
    comparison += `**Conclusion**: Both files have similar impact levels.`;
  }
  
  return {
    file1: result1,
    file2: result2,
    comparison,
  };
}

