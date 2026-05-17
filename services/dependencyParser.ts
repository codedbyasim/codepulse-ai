import { DependencyNode } from '../types';

/**
 * Dependency Parser Service
 * Extracts import/require statements from source files
 * Supports JavaScript, TypeScript, and Python
 */

interface ParseResult {
  imports: string[];
  exports: string[];
  language: string;
}

/**
 * Detect programming language from file extension
 */
export function detectLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'java': 'java',
    'go': 'go',
    'rb': 'ruby',
    'php': 'php',
    'cs': 'csharp',
    'cpp': 'cpp',
    'c': 'c',
    'rs': 'rust',
    'swift': 'swift',
  };
  
  return languageMap[ext || ''] || 'unknown';
}

/**
 * Parse JavaScript/TypeScript imports
 */
function parseJavaScriptImports(content: string): string[] {
  const imports: string[] = [];
  
  // ES6 imports: import ... from 'module'
  const es6ImportRegex = /import\s+(?:[\w*\s{},]*\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = es6ImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // CommonJS require: require('module')
  const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // Dynamic imports: import('module')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return [...new Set(imports)]; // Remove duplicates
}

/**
 * Parse JavaScript/TypeScript exports
 */
function parseJavaScriptExports(content: string): string[] {
  const exports: string[] = [];
  
  // Named exports: export { name }
  const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g;
  let match;
  while ((match = namedExportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // Default export
  if (/export\s+default/.test(content)) {
    exports.push('default');
  }
  
  // Export from: export { name } from 'module'
  const exportFromRegex = /export\s+\{([^}]+)\}\s+from/g;
  while ((match = exportFromRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(n => n.trim().split(/\s+as\s+/).pop()?.trim());
    exports.push(...names.filter(Boolean) as string[]);
  }
  
  return [...new Set(exports)];
}

/**
 * Parse Python imports
 */
function parsePythonImports(content: string): string[] {
  const imports: string[] = [];
  
  // import module
  const importRegex = /^import\s+([\w.]+)/gm;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  // from module import ...
  const fromImportRegex = /^from\s+([\w.]+)\s+import/gm;
  while ((match = fromImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return [...new Set(imports)];
}

/**
 * Parse Python exports (functions and classes)
 */
function parsePythonExports(content: string): string[] {
  const exports: string[] = [];
  
  // def function_name
  const functionRegex = /^def\s+(\w+)/gm;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  // class ClassName
  const classRegex = /^class\s+(\w+)/gm;
  while ((match = classRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  return [...new Set(exports)];
}

/**
 * Main parser function
 */
export function parseFileDependencies(filePath: string, content: string): ParseResult {
  const language = detectLanguage(filePath);
  let imports: string[] = [];
  let exports: string[] = [];
  
  switch (language) {
    case 'javascript':
    case 'typescript':
      imports = parseJavaScriptImports(content);
      exports = parseJavaScriptExports(content);
      break;
    
    case 'python':
      imports = parsePythonImports(content);
      exports = parsePythonExports(content);
      break;
    
    default:
      // For unsupported languages, return empty arrays
      break;
  }
  
  return { imports, exports, language };
}

/**
 * Resolve relative import paths to absolute paths
 */
export function resolveImportPath(
  currentFilePath: string,
  importPath: string,
  allFiles: string[]
): string | null {
  // Skip external packages (no ./ or ../)
  if (!importPath.startsWith('.')) {
    return null;
  }
  
  // Get directory of current file
  const currentDir = currentFilePath.split('/').slice(0, -1).join('/');
  
  // Resolve relative path
  let resolvedPath = importPath;
  if (importPath.startsWith('./')) {
    resolvedPath = `${currentDir}/${importPath.slice(2)}`;
  } else if (importPath.startsWith('../')) {
    const parts = currentDir.split('/');
    const upLevels = importPath.match(/\.\.\//g)?.length || 0;
    const newDir = parts.slice(0, -upLevels).join('/');
    const remainingPath = importPath.replace(/\.\.\//g, '');
    resolvedPath = `${newDir}/${remainingPath}`;
  }
  
  // Normalize path
  resolvedPath = resolvedPath.replace(/\/+/g, '/');
  
  // Try to find matching file with common extensions
  const extensions = ['', '.js', '.jsx', '.ts', '.tsx', '.py', '/index.js', '/index.ts', '/index.tsx'];
  
  for (const ext of extensions) {
    const testPath = resolvedPath + ext;
    if (allFiles.includes(testPath)) {
      return testPath;
    }
  }
  
  return null;
}

/**
 * Estimate cyclomatic complexity (simplified)
 */
export function estimateComplexity(content: string): number {
  let complexity = 1; // Base complexity
  
  // Count decision points
  const patterns = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bwhile\s*\(/g,
    /\bfor\s*\(/g,
    /\bcase\s+/g,
    /\bcatch\s*\(/g,
    /\&\&/g,
    /\|\|/g,
    /\?/g, // Ternary operator
  ];
  
  for (const pattern of patterns) {
    const matches = content.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  }
  
  return complexity;
}

/**
 * Check if file is critical (auth, payment, config, etc.)
 */
export function isCriticalFile(filePath: string, content: string): boolean {
  const criticalPatterns = [
    /auth/i,
    /login/i,
    /password/i,
    /token/i,
    /session/i,
    /payment/i,
    /billing/i,
    /checkout/i,
    /security/i,
    /config/i,
    /env/i,
    /database/i,
    /db/i,
    /middleware/i,
  ];
  
  // Check file path
  const pathLower = filePath.toLowerCase();
  if (criticalPatterns.some(pattern => pattern.test(pathLower))) {
    return true;
  }
  
  // Check content for critical keywords
  const contentLower = content.toLowerCase();
  const criticalKeywords = [
    'authenticate',
    'authorize',
    'jwt',
    'bcrypt',
    'crypto',
    'payment',
    'stripe',
    'paypal',
  ];
  
  return criticalKeywords.some(keyword => contentLower.includes(keyword));
}

/**
 * Create a dependency node from file content
 */
export function createDependencyNode(
  filePath: string,
  content: string,
  allFiles: string[]
): DependencyNode {
  const parseResult = parseFileDependencies(filePath, content);
  const fileName = filePath.split('/').pop() || filePath;
  
  // Resolve import paths
  const resolvedImports = parseResult.imports
    .map(imp => resolveImportPath(filePath, imp, allFiles))
    .filter(Boolean) as string[];
  
  return {
    id: filePath,
    name: fileName,
    type: 'file',
    language: parseResult.language,
    imports: resolvedImports,
    importedBy: [], // Will be populated later
    exports: parseResult.exports,
    size: content.split('\n').length,
    complexity: estimateComplexity(content),
    isCritical: isCriticalFile(filePath, content),
    path: filePath,
  };
}

/**
 * Build reverse dependencies (importedBy)
 */
export function buildReverseDependencies(nodes: Map<string, DependencyNode>): void {
  // Clear existing importedBy arrays
  nodes.forEach(node => {
    node.importedBy = [];
  });
  
  // Build reverse dependencies
  nodes.forEach(node => {
    node.imports.forEach(importPath => {
      const importedNode = nodes.get(importPath);
      if (importedNode && !importedNode.importedBy.includes(node.id)) {
        importedNode.importedBy.push(node.id);
      }
    });
  });
}

// Made with Bob
