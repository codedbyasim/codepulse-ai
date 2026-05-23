
export type AnalysisMode = 'basic' | 'archaeologist';

export interface RepoInfo {
  owner: string;
  name: string;
  description: string | null;
  stars: number;
  language: string | null;
  url: string;
  defaultBranch: string;
}

export interface Vulnerability {
  severity: 'High' | 'Medium' | 'Low';
  title: string;
  description: string;
}

export interface RefactoringSuggestion {
  title: string;
  currentModule: string;
  proposedMicroservice: string;
  reasoning: string;
  migrationSteps: string[];
}

export interface UnitTest {
  targetFile: string;
  description: string;
  code: string;
}

export interface AnalysisResult {
  summary: string;
  techStack: string[];
  keyComponents: string[];
  installation: string;
  notes: string;
  classDiagram?: string;     // Class Structure
  sequenceDiagram?: string;  // Key Flow
  securityProfile: string;
  vulnerabilities: Vulnerability[];
  // Archaeologist Mode Extras
  refactoringSuggestions?: RefactoringSuggestion[];
  legacyUnitTests?: UnitTest[];
}

export interface FileAnalysisResult {
  summary: string;
  complexity: 'Low' | 'Medium' | 'High';
  dependencies: string[];
  keyExports: string[];
  potentialUsage: string;
}

export interface FileContent {
  path: string;
  content: string;
}

export enum AnalysisStatus {
  IDLE,
  FETCHING_REPO,
  ANALYZING_AI,
  COMPLETE,
  ERROR
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// ============================================
// BLAST RADIUS ANALYSIS TYPES
// ============================================

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DependencyNode {
  id: string;              // Unique file path
  name: string;            // File name
  type: 'file' | 'module' | 'function';
  language: string;        // js, ts, py, etc.
  imports: string[];       // Direct dependencies (files this imports)
  importedBy: string[];    // Reverse dependencies (files that import this)
  exports: string[];       // What this file exports
  size: number;            // Lines of code
  complexity: number;      // Cyclomatic complexity estimate
  isCritical: boolean;     // Auth/payment/core module
  testCoverage?: number;   // If available
  path: string;            // Full path
}

export interface DependencyEdge {
  from: string;
  to: string;
  type: 'import' | 'require' | 'include';
  weight?: number;
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
  entryPoints: string[];   // Main files
  criticalPaths: string[][]; // Paths to critical modules
}

export interface CouplingMetrics {
  afferentCoupling: number;  // Files that depend on this (Ca)
  efferentCoupling: number;  // Files this depends on (Ce)
  instability: number;       // Ce / (Ca + Ce)
}

export interface CriticalImpact {
  file: string;
  reason: string;
  severity: RiskLevel;
}

export interface BlastRadiusResult {
  targetFile: string;
  impactScore: number;     // 0-100
  riskLevel: RiskLevel;
  affectedFiles: {
    direct: string[];      // Direct dependencies
    transitive: string[];  // Indirect dependencies
    depth: number;         // Max propagation depth
    total: number;         // Total affected files
  };
  criticalImpacts: CriticalImpact[];
  suggestedTests: string[];
  couplingMetrics: CouplingMetrics;
  aiInsights: string;
  precautions: string[];
  propagationChain: string[][]; // Paths showing how changes propagate
}

export interface GraphMetrics {
  totalFiles: number;
  totalDependencies: number;
  avgDependencies: number;
  maxDepth: number;
  criticalNodes: string[];
  circularDependencies: string[][];
  mostCoupled: Array<{ file: string; coupling: number }>;
}

export interface BlastRadiusAnalysisRequest {
  owner: string;
  repo: string;
  targetFile: string;
  branch: string;
  token?: string;
}

export interface GraphGenerationRequest {
  owner: string;
  repo: string;
  branch: string;
  token?: string;
}

export interface GraphGenerationResult {
  graph: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      language: string;
      isCritical: boolean;
      size: number;
      complexity: number;
    }>;
    edges: DependencyEdge[];
  };
  metrics: GraphMetrics;
}

