import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RepoInfo, FileContent, BlastRadiusResult, GraphGenerationResult } from '../types';
import { DependencyGraphVisualization } from './DependencyGraphVisualization';
import { ImpactReport } from './ImpactReport';
import axios from 'axios';
import { ArrowLeft, Network, Eye, EyeOff, Search, FileText, Activity, Terminal } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

interface BlastRadiusPageProps {
  repoInfo: RepoInfo;
  files: FileContent[];
  structure: string[];
  onBack: () => void;
  theme: 'dark' | 'light';
}

type ViewMode = 'select' | 'analyzing' | 'results';

export const BlastRadiusPage: React.FC<BlastRadiusPageProps> = ({
  repoInfo,
  files,
  structure,
  onBack,
  theme,
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

  const sourceFiles = structure.filter(path => {
    const ext = path.split('.').pop()?.toLowerCase();
    return ['js', 'jsx', 'ts', 'tsx', 'py'].includes(ext || '');
  });

  const filteredFiles = searchQuery
    ? sourceFiles.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
    : sourceFiles;

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
      'Indexing file dependencies...',
      'Mapping deep import links...',
      'Constructing dependency tree...',
      'Running impact calculation...',
      'Evaluating system risk profile...',
      'Finalizing blast radius report...',
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
    <div className="space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
        <motion.button
          onClick={onBack}
          className="w-fit flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#161b22]/50 hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all shadow-sm"
          whileHover={{ x: -3 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Back to Analyzer</span>
        </motion.button>
        
        {graphData && (
          <motion.button
            onClick={() => setShowGraph(!showGraph)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {showGraph ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showGraph ? 'Hide Dependency Graph' : 'Visualize Dependency Graph'}</span>
          </motion.button>
        )}
      </div>

      {/* Hero Intro */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Activity className="w-8 h-8 text-cyan-500 animate-pulse" />
          <span>Blast Radius Analysis</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl font-light">
          Trace code paths, calculate cascade risks, and forecast compilation and side-effect failures prior to deployment commits.
        </p>
      </div>

      {/* Graph Visualizer Panel */}
      <AnimatePresence>
        {showGraph && graphData && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <DependencyGraphVisualization theme={theme}
              graphData={graphData}
              selectedFile={selectedFile}
              onNodeClick={handleFileSelect}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select File Panel */}
      {viewMode === 'select' && (
        <motion.div 
          className="bg-white dark:bg-github-card border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
             <Terminal className="w-5 h-5 text-cyan-500" />
             <span>Select a File to Analyze</span>
          </h2>
          
          {/* Search Input */}
          <div className="relative mb-5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter code modules (e.g. ts, tsx, py, js)..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          {error && (
            <div className="mb-4 p-4.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Source Modules Scroll List */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredFiles.length === 0 ? (
              <p className="text-center text-slate-450 text-xs py-8 italic">
                No matching code files.
              </p>
            ) : (
              filteredFiles.map((file) => (
                <motion.button
                  key={file}
                  onClick={() => handleFileSelect(file)}
                  className="w-full text-left px-4 py-3 bg-slate-50 dark:bg-slate-900/40 hover:bg-cyan-500/5 border border-slate-200 dark:border-slate-800/80 hover:border-cyan-500/30 rounded-xl transition-all duration-200 flex items-center justify-between group"
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 shrink-0" />
                    <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate">
                      {file}
                    </span>
                  </div>
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all rotate-180 shrink-0" />
                </motion.button>
              ))
            )}
          </div>
        </motion.div>
      )}

      {/* Analyzing Spinner Screen */}
      {viewMode === 'analyzing' && (
        <div className="bg-white dark:bg-github-card border border-slate-200 dark:border-slate-800 rounded-2xl p-10 shadow-sm text-center">
          <div className="flex flex-col items-center py-6">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Analyzing Cascade Impact
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-4 px-4 py-1.5 bg-slate-50 dark:bg-slate-900/60 rounded-full">
              {selectedFile}
            </p>
            <p className="text-xs text-cyan-500 dark:text-cyan-400 font-semibold animate-pulse">
              {loadingMessage}
            </p>
          </div>
        </div>
      )}

      {/* Results Screen */}
      {viewMode === 'results' && analysisResult && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Impact Cascade Results
            </h2>
            <motion.button
              onClick={handleReset}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Analyze Another Module
            </motion.button>
          </div>
          
          <ImpactReport result={analysisResult} repoInfo={repoInfo} />
        </div>
      )}
    </div>
  );
};
