import { 
  DependencyGraph, 
  DependencyNode, 
  RiskLevel, 
  CouplingMetrics, 
  CriticalImpact,
  BlastRadiusResult 
} from '../types';
import { 
  findDirectDependencies, 
  findTransitiveDependencies, 
  findReverseDependencies,
  findPropagationChains,
  calculateCentrality 
} from './graphEngine';

/**
 * Risk Analyzer Service
 * Calculates impact scores and risk levels
 * Identifies critical impacts and suggests precautions
 */

/**
 * Calculate coupling metrics for a file
 */
export function calculateCouplingMetrics(
  targetFile: string,
  graph: DependencyGraph
): CouplingMetrics {
  const node = graph.nodes.get(targetFile);
  if (!node) {
    return {
      afferentCoupling: 0,
      efferentCoupling: 0,
      instability: 0,
    };
  }
  
  const afferentCoupling = node.importedBy.length; // Ca - incoming dependencies
  const efferentCoupling = node.imports.length;    // Ce - outgoing dependencies
  
  // Instability = Ce / (Ca + Ce)
  // 0 = maximally stable, 1 = maximally unstable
  const total = afferentCoupling + efferentCoupling;
  const instability = total > 0 ? efferentCoupling / total : 0;
  
  return {
    afferentCoupling,
    efferentCoupling,
    instability: Math.round(instability * 100) / 100,
  };
}

/**
 * Calculate impact score (0-100)
 */
export function calculateImpactScore(
  targetFile: string,
  graph: DependencyGraph
): number {
  const node = graph.nodes.get(targetFile);
  if (!node) return 0;
  
  // Find affected files
  const reverseDeps = findReverseDependencies(targetFile, graph);
  const directDependents = node.importedBy.length;
  const transitiveDependents = reverseDeps.files.length;
  
  // Calculate coupling
  const coupling = calculateCouplingMetrics(targetFile, graph);
  const totalCoupling = coupling.afferentCoupling + coupling.efferentCoupling;
  
  // Calculate centrality
  const centrality = calculateCentrality(targetFile, graph);
  
  // Scoring components
  const directScore = Math.min(directDependents * 20, 30);
  const transitiveScore = Math.min(transitiveDependents * 2, 20);
  const criticalityBonus = node.isCritical ? 30 : 0;
  const couplingPenalty = Math.min((totalCoupling / graph.nodes.size) * 100, 15);
  const centralityBonus = centrality * 100 * 0.05; // Max 5 points
  
  // Complexity penalty
  const complexityPenalty = Math.min(node.complexity / 10, 5);
  
  // Test coverage penalty (assume 0 if not available)
  const testCoveragePenalty = node.testCoverage 
    ? (100 - node.testCoverage) * 0.05 
    : 5;
  
  const totalScore = 
    directScore + 
    transitiveScore + 
    criticalityBonus + 
    couplingPenalty + 
    centralityBonus +
    complexityPenalty +
    testCoveragePenalty;
  
  return Math.min(Math.round(totalScore), 100);
}

/**
 * Determine risk level from impact score
 */
export function determineRiskLevel(
  impactScore: number,
  isCritical: boolean
): RiskLevel {
  // Critical files are always at least HIGH risk
  if (isCritical && impactScore >= 50) {
    return 'CRITICAL';
  }
  
  if (impactScore >= 80) return 'CRITICAL';
  if (impactScore >= 60) return 'HIGH';
  if (impactScore >= 30) return 'MEDIUM';
  return 'LOW';
}

/**
 * Identify critical impacts
 */
export function identifyCriticalImpacts(
  targetFile: string,
  graph: DependencyGraph
): CriticalImpact[] {
  const impacts: CriticalImpact[] = [];
  const node = graph.nodes.get(targetFile);
  if (!node) return impacts;
  
  // Check if target itself is critical
  if (node.isCritical) {
    impacts.push({
      file: targetFile,
      reason: 'This is a critical module (auth/payment/config)',
      severity: 'CRITICAL',
    });
  }
  
  // Find critical files in dependencies
  const allDeps = findTransitiveDependencies(targetFile, graph);
  allDeps.files.forEach(depFile => {
    const depNode = graph.nodes.get(depFile);
    if (depNode?.isCritical) {
      impacts.push({
        file: depFile,
        reason: `Critical dependency: ${depNode.name}`,
        severity: 'HIGH',
      });
    }
  });
  
  // Find critical files that depend on this
  const reverseDeps = findReverseDependencies(targetFile, graph);
  reverseDeps.files.forEach(depFile => {
    const depNode = graph.nodes.get(depFile);
    if (depNode?.isCritical) {
      impacts.push({
        file: depFile,
        reason: `Critical file depends on this: ${depNode.name}`,
        severity: 'CRITICAL',
      });
    }
  });
  
  // Check for high coupling
  const coupling = calculateCouplingMetrics(targetFile, graph);
  if (coupling.afferentCoupling > 10) {
    impacts.push({
      file: targetFile,
      reason: `High afferent coupling: ${coupling.afferentCoupling} files depend on this`,
      severity: 'HIGH',
    });
  }
  
  return impacts;
}

/**
 * Suggest tests to run
 */
export function suggestTests(
  targetFile: string,
  graph: DependencyGraph
): string[] {
  const suggestions: string[] = [];
  const node = graph.nodes.get(targetFile);
  if (!node) return suggestions;
  
  // Suggest test for the file itself
  const testFileName = targetFile
    .replace(/\.(js|ts|jsx|tsx|py)$/, '')
    .replace(/^src\//, '')
    .replace(/^lib\//, '');
  
  suggestions.push(`${testFileName}.test.${node.language === 'python' ? 'py' : 'ts'}`);
  suggestions.push(`${testFileName}.spec.${node.language === 'python' ? 'py' : 'ts'}`);
  
  // Suggest integration tests if critical
  if (node.isCritical) {
    suggestions.push('integration/auth.test.ts');
    suggestions.push('e2e/critical-flows.test.ts');
  }
  
  // Suggest tests for files that depend on this
  const reverseDeps = findReverseDependencies(targetFile, graph, 2);
  reverseDeps.files.slice(0, 5).forEach(depFile => {
    const depNode = graph.nodes.get(depFile);
    if (depNode) {
      const depTestName = depFile
        .replace(/\.(js|ts|jsx|tsx|py)$/, '')
        .replace(/^src\//, '')
        .replace(/^lib\//, '');
      suggestions.push(`${depTestName}.test.${depNode.language === 'python' ? 'py' : 'ts'}`);
    }
  });
  
  return [...new Set(suggestions)].slice(0, 10); // Deduplicate and limit
}

/**
 * Generate precautions
 */
export function generatePrecautions(
  targetFile: string,
  graph: DependencyGraph,
  riskLevel: RiskLevel,
  criticalImpacts: CriticalImpact[]
): string[] {
  const precautions: string[] = [];
  const node = graph.nodes.get(targetFile);
  if (!node) return precautions;
  
  // Risk-level specific precautions
  if (riskLevel === 'CRITICAL') {
    precautions.push('⚠️ CRITICAL: Require code review from senior engineer');
    precautions.push('⚠️ Run full test suite before merging');
    precautions.push('⚠️ Deploy to staging environment first');
    precautions.push('⚠️ Prepare rollback plan');
  } else if (riskLevel === 'HIGH') {
    precautions.push('⚡ HIGH: Require thorough code review');
    precautions.push('⚡ Run integration tests');
    precautions.push('⚡ Monitor error rates after deployment');
  } else if (riskLevel === 'MEDIUM') {
    precautions.push('📋 MEDIUM: Standard code review required');
    precautions.push('📋 Run unit tests for affected modules');
  } else {
    precautions.push('✅ LOW: Standard review process');
  }
  
  // Critical file precautions
  if (node.isCritical) {
    precautions.push('🔐 Security review required for critical module');
    precautions.push('🔐 Verify authentication/authorization logic');
  }
  
  // High coupling precautions
  const coupling = calculateCouplingMetrics(targetFile, graph);
  if (coupling.afferentCoupling > 10) {
    precautions.push(`🔗 ${coupling.afferentCoupling} files depend on this - verify backward compatibility`);
  }
  
  // Complexity precautions
  if (node.complexity > 20) {
    precautions.push('🧩 High complexity - consider refactoring');
    precautions.push('🧩 Add comprehensive unit tests');
  }
  
  // Critical impact precautions
  if (criticalImpacts.length > 0) {
    precautions.push(`⚡ Impacts ${criticalImpacts.length} critical module(s)`);
  }
  
  // Reverse dependency precautions
  const reverseDeps = findReverseDependencies(targetFile, graph);
  if (reverseDeps.files.length > 20) {
    precautions.push(`📊 ${reverseDeps.files.length} files may be affected - verify API compatibility`);
  }
  
  return precautions;
}

/**
 * Perform complete blast radius analysis
 */
export function analyzeBlastRadius(
  targetFile: string,
  graph: DependencyGraph
): BlastRadiusResult {
  const node = graph.nodes.get(targetFile);
  if (!node) {
    throw new Error(`File not found in graph: ${targetFile}`);
  }
  
  // Calculate metrics
  const impactScore = calculateImpactScore(targetFile, graph);
  const riskLevel = determineRiskLevel(impactScore, node.isCritical);
  const couplingMetrics = calculateCouplingMetrics(targetFile, graph);
  
  // Find affected files
  const directDeps = findDirectDependencies(targetFile, graph);
  const transitiveDeps = findTransitiveDependencies(targetFile, graph);
  const reverseDeps = findReverseDependencies(targetFile, graph);
  
  // Combine all affected files
  const allAffected = new Set([
    ...directDeps,
    ...transitiveDeps.files,
    ...reverseDeps.files,
  ]);
  
  // Identify critical impacts
  const criticalImpacts = identifyCriticalImpacts(targetFile, graph);
  
  // Suggest tests
  const suggestedTests = suggestTests(targetFile, graph);
  
  // Generate precautions
  const precautions = generatePrecautions(targetFile, graph, riskLevel, criticalImpacts);
  
  // Find propagation chains
  const propagationChain = findPropagationChains(targetFile, graph, 5);
  
  return {
    targetFile,
    impactScore,
    riskLevel,
    affectedFiles: {
      direct: reverseDeps.files.slice(0, 20), // Files that import this
      transitive: Array.from(allAffected).slice(0, 50),
      depth: Math.max(transitiveDeps.depth, reverseDeps.depth),
      total: allAffected.size,
    },
    criticalImpacts,
    suggestedTests,
    couplingMetrics,
    aiInsights: '', // Will be filled by AI service
    precautions,
    propagationChain,
  };
}

/**
 * Batch analyze multiple files
 */
export function batchAnalyzeBlastRadius(
  targetFiles: string[],
  graph: DependencyGraph
): Map<string, BlastRadiusResult> {
  const results = new Map<string, BlastRadiusResult>();
  
  targetFiles.forEach(file => {
    try {
      const result = analyzeBlastRadius(file, graph);
      results.set(file, result);
    } catch (error) {
      console.error(`Failed to analyze ${file}:`, error);
    }
  });
  
  return results;
}

// Made with Bob
