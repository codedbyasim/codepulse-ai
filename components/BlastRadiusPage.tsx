import React, { useState, useEffect } from 'react';
import { RepoInfo, FileContent, BlastRadiusResult, GraphGenerationResult } from '../types';
import { DependencyGraphVisualization } from './DependencyGraphVisualization';
import { ImpactReport } from './ImpactReport';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

interface BlastRadiusPageProps {
  repoInfo: RepoInfo;
  files: FileContent[];
  structure: string[];
  onBack: () => void;
}

type ViewMode = 'select' | 'analyzing' | 'results';

export const BlastRadiusPage: React.FC<BlastRadiusPageProps> = ({
  repoInfo,
  files,
  structure,
  onBack,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<BlastRadiusResult | null>(null);
  const [graphData, setGraphData] = useState<GraphGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showGraph, setShowGraph] = useState(false);

  const repoKey = `${repoInfo.owner}/${repoInfo.name}`;

  // Filter files for selection
  const sourceFiles = structure.filter(path => {
    const ext = path.split('.').pop()?.toLowerCase();
    return ['js', 'jsx', 'ts', 'tsx', 'py'].includes(ext || '');
  });

  const filteredFiles = searchQuery
    ? sourceFiles.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
    : sourceFiles;

  // Load graph data on mount
  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/blast-radius/graph`, {
        files,
        repoKey,
      });
      setGraphData(response.data);
    } catch (err: any) {
      console.error('Failed to load graph:', err);
    }
  };

  const handleFileSelect = async (filePath: string) => {
    setSelectedFile(filePath);
    setViewMode('analyzing');
    setError(null);
    
    const messages = [
      'Building dependency graph...',
      'Analyzing file dependencies...',
      'Calculating impact score...',
      'Identifying critical impacts...',
      'Generating AI insights...',
      'Finalizing blast radius analysis...',
    ];
    
    let i = 0;
    setLoadingMessage(messages[0]);
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingMessage(messages[i]);
    }, 2000);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/blast-radius/analyze`, {
        targetFile: filePath,
        files,
        repoKey,
      });

      clearInterval(interval);
      setAnalysisResult(response.data);
      setViewMode('results');
    } catch (err: any) {
      clearInterval(interval);
      setError(err.response?.data?.message || 'Analysis failed');
      setViewMode('select');
    }
  };

  const handleReset = () => {
    setViewMode('select');
    setSelectedFile(null);
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="group mb-4 flex items-center gap-2 px-4 py-2 bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-red-400 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 hover:shadow-md transition-all duration-300"
        >
          <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Analysis
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
              💥 Blast Radius Analysis
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Predict the impact of code changes across your repository
            </p>
          </div>
          
          {graphData && (
            <button
              onClick={() => setShowGraph(!showGraph)}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {showGraph ? '📊 Hide Graph' : '🕸️ Show Dependency Graph'}
            </button>
          )}
        </div>

        {/* Repository Info */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{repoInfo.owner}/{repoInfo.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {files.length} files analyzed • {sourceFiles.length} source files
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Visualization */}
      {showGraph && graphData && (
        <div className="mb-8">
          <DependencyGraphVisualization
            graphData={graphData}
            selectedFile={selectedFile}
            onNodeClick={handleFileSelect}
          />
        </div>
      )}

      {/* File Selection View */}
      {viewMode === 'select' && (
        <div className="bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Select a File to Analyze
          </h2>
          
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full px-4 py-3 pl-10 bg-gray-50 dark:bg-github-dark border border-gray-300 dark:border-github-border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-github-accent focus:border-transparent text-gray-900 dark:text-white"
              />
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {/* File List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredFiles.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No files found matching "{searchQuery}"
              </p>
            ) : (
              filteredFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => handleFileSelect(file)}
                  className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-github-dark hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-github-border hover:border-blue-400 dark:hover:border-blue-500 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {file}
                      </span>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Analyzing View */}
      {viewMode === 'analyzing' && (
        <div className="bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl p-8 shadow-lg text-center">
          <div className="flex flex-col items-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 border-4 border-red-200 dark:border-red-900 rounded-full"></div>
              <div className="absolute top-0 left-0 w-20 h-20 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Analyzing Blast Radius
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedFile}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              {loadingMessage}
            </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {viewMode === 'results' && analysisResult && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analysis Results
            </h2>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 dark:bg-github-dark hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              Analyze Another File
            </button>
          </div>
          
          <ImpactReport result={analysisResult} repoInfo={repoInfo} />
        </div>
      )}
    </div>
  );
};


