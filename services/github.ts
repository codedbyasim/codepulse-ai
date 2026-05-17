import { RepoInfo, FileContent, AnalysisMode, RateLimit } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

// Helper to handle rate limits and errors
async function fetchGitHub(url: string, token?: string) {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    if (response.status === 404) throw new Error('Repository not found');
    if (response.status === 403) {
      const resetHeader = response.headers.get('x-ratelimit-reset');
      const resetTime = resetHeader 
        ? new Date(parseInt(resetHeader) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : 'soon';
      throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime}. Please provide a token.`);
    }
    throw new Error(`GitHub API error: ${response.statusText}`);
  }
  return response.json();
}

export const getGitHubRateLimit = async (token?: string): Promise<RateLimit | null> => {
  try {
    const headers: HeadersInit = { 'Accept': 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = `token ${token}`;
    
    const response = await fetch('https://api.github.com/rate_limit', { headers });
    if (!response.ok) return null;
    
    const data = await response.json();
    const core = data.resources.core;
    return {
      limit: core.limit,
      remaining: core.remaining,
      reset: new Date(core.reset * 1000),
      used: core.used
    };
  } catch (e) {
    return null;
  }
};

export const extractRepoDetails = (url: string): { owner: string; repo: string } | null => {
  try {
    const cleanUrl = url.replace(/\/$/, '');
    const parts = new URL(cleanUrl).pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
  } catch (e) {
    return null;
  }
  return null;
};

export const getRepoMetadata = async (owner: string, repo: string, token?: string): Promise<RepoInfo> => {
  const data = await fetchGitHub(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, token);
  return {
    owner: data.owner.login,
    name: data.name,
    description: data.description,
    stars: data.stargazers_count,
    language: data.language,
    url: data.html_url,
    defaultBranch: data.default_branch,
  };
};

export const getRepoFileContent = async (owner: string, repo: string, path: string, token?: string): Promise<string | null> => {
  try {
    const data = await fetchGitHub(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, token);
    if (Array.isArray(data) || !data.content) return null; // It's a directory or empty
    
    // Proper Base64 decoding with UTF-8 support
    const binaryString = atob(data.content.replace(/\n/g, ''));
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (error: any) {
    // CRITICAL: Re-throw rate limit errors so the UI knows about them
    if (error.message && (error.message.includes('rate limit') || error.message.includes('403'))) {
      throw error;
    }
    // If file doesn't exist or other error, just return null to continue partial analysis
    return null;
  }
};

export const getRepoStructure = async (owner: string, repo: string, branch: string, token?: string): Promise<string[]> => {
  try {
    const data = await fetchGitHub(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, token);
    if (data.truncated) {
      console.warn('Repo tree truncated by GitHub API');
    }
    // Return paths
    return data.tree.map((item: any) => item.path);
  } catch (e: any) {
    if (e.message && e.message.includes('rate limit')) throw e;
    console.warn('Failed to fetch tree, fallback to root only');
    return [];
  }
};

// Orchestrator to gather context for AI
export const gatherRepoContext = async (
  owner: string, 
  repo: string, 
  defaultBranch: string, 
  mode: AnalysisMode,
  token?: string
): Promise<{ structure: string[]; files: FileContent[] }> => {
  
  // Check rate limit first to determine budget
  const rateLimit = await getGitHubRateLimit(token);
  
  // Default conservative limit (unauthenticated)
  let maxSourceFiles = 15; 
  
  if (rateLimit) {
    if (rateLimit.limit > 60) {
      // Authenticated users (Token provided): Increase limit to 200 as requested
      maxSourceFiles = 200;
    } else {
      // Unauthenticated: Use remaining budget minus buffer for metadata/structure calls
      // Buffer of 5 for safety
      const safeBudget = Math.max(0, rateLimit.remaining - 5);
      maxSourceFiles = Math.min(15, safeBudget);
    }
  }

  // 1. Get file structure (increase structure context if we have high file limit)
  let structure = await getRepoStructure(owner, repo, defaultBranch, token);
  
  // Filter out lock files, images, huge assets
  const ignoreExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.lock', '-lock.json', '.ico', '.woff', '.ttf', '.mp4', '.pdf', '.DS_Store'];
  
  // If we are in high-capacity mode, we can analyze more structure context too
  const structureLimit = maxSourceFiles > 50 ? 1000 : 300;
  structure = structure.filter(path => !ignoreExtensions.some(ext => path.endsWith(ext))).slice(0, structureLimit);

  // 2. Identify key files to fetch content for
  const baseConfig = [
    'README.md', 'readme.md', 'README',
    'package.json', 'requirements.txt', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'composer.json',
    'Dockerfile', 'docker-compose.yml', 'Makefile'
  ];

  let filesToFetch = [...baseConfig];

  // For Archaeologist mode OR Basic mode with high limits, fetch source code
  const sourceExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rb', '.php', '.cs', '.c', '.cpp', '.h', '.rs', '.swift'];
  const sourceFiles = structure.filter(path => sourceExtensions.some(ext => path.endsWith(ext)));
    
  // Heuristic: Prioritize files in 'src/', 'lib/', or root
  const prioritizedSource = sourceFiles.sort((a, b) => {
    const aScore = (a.includes('src/') ? 2 : 0) + (a.split('/').length < 3 ? 1 : 0);
    const bScore = (b.includes('src/') ? 2 : 0) + (b.split('/').length < 3 ? 1 : 0);
    return bScore - aScore;
  }).slice(0, maxSourceFiles);

  filesToFetch = [...filesToFetch, ...prioritizedSource];

  // Deduplicate
  filesToFetch = [...new Set(filesToFetch)];

  // Find which of these exist in the structure
  const structureSet = new Set(structure.map(s => s.toLowerCase()));
  const validFilesToFetch = filesToFetch.filter(f => {
    // Exact match or lowercase match check
    return structure.includes(f) || structureSet.has(f.toLowerCase());
  });

  // 3. Fetch contents with concurrency limit (Batching)
  const fileContents: FileContent[] = [];
  const CONCURRENCY_LIMIT = 5; // Slightly increased concurrency for authenticated users

  const fetchTask = async (path: string) => {
    // Ideally we use the exact path from 'structure'.
    const exactPath = structure.find(s => s.toLowerCase() === path.toLowerCase()) || path;
    
    const content = await getRepoFileContent(owner, repo, exactPath, token);
    if (content) {
      // Truncate large files
      const limit = mode === 'archaeologist' ? 30000 : 20000; 
      const truncated = content.length > limit ? content.substring(0, limit) + '\n...(truncated)...' : content;
      return { path: exactPath, content: truncated };
    }
    return null;
  };

  // Execute in batches
  for (let i = 0; i < validFilesToFetch.length; i += CONCURRENCY_LIMIT) {
    const batch = validFilesToFetch.slice(i, i + CONCURRENCY_LIMIT);
    const results = await Promise.all(batch.map(path => fetchTask(path)));
    
    results.forEach(res => {
      if (res) fileContents.push(res);
    });
  }

  return { structure, files: fileContents };
};

// Made with Bob
