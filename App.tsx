import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RepoForm } from './components/RepoForm';
import { AnalysisReport } from './components/AnalysisReport';
import { ArchaeologistReport } from './components/ArchaeologistReport';
import { ChatInterface } from './components/ChatInterface';
import { ProgressBar, LoadingStep } from './components/SharedUI';
import { AboutPage } from './components/AboutPage';
import { BlastRadiusPage } from './components/BlastRadiusPage';
import { RepoInfo, AnalysisResult, AnalysisStatus, FileContent, AnalysisMode, RateLimit } from './types';
import { extractRepoDetails, getRepoMetadata, gatherRepoContext, getGitHubRateLimit } from './services/github';
import { analyzeRepoWithWatsonx } from './services/watsonx';

const ANALYSIS_STEPS = [
  { label: "Validating Repository" },
  { label: "Fetching Metadata" },
  { label: "Scanning Codebase" },
  { label: "Generating Analysis" }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'home' | 'about' | 'blast-radius'>('home');
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode | null>(null);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [repoStructure, setRepoStructure] = useState<string[]>([]);
  const [repoFiles, setRepoFiles] = useState<FileContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [failedStep, setFailedStep] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showTokenHint, setShowTokenHint] = useState(false);
  const [rateLimit, setRateLimit] = useState<RateLimit | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Initialize rate limit check
  useEffect(() => {
    const savedToken = localStorage.getItem('gh_token');
    refreshRateLimit(savedToken || undefined);
  }, []);

  const refreshRateLimit = async (token?: string) => {
    const limit = await getGitHubRateLimit(token);
    setRateLimit(limit);
  };

  // Cycle loading messages during the heavy AI step
  useEffect(() => {
    let interval: any;
    if (status === AnalysisStatus.ANALYZING_AI) {
      let messages = [];
      if (analysisMode === 'archaeologist') {
        messages = [
          "IBM Watsonx is reading the monolith...",
          "Identifying spaghetti code...",
          "Mapping dependency graph...",
          "Generating microservices roadmap...",
          "Writing unit tests for legacy modules...",
          "Finalizing excavation report..."
        ];
      } else {
        messages = [
          "Analyzing codebase architecture...",
          "Detecting languages and frameworks...",
          "Preparing executive summary...",
          "Generating system diagrams...",
          "Finalizing technical report..."
        ];
      }
      
      let i = 0;
      setLoadingMessage(messages[0]);
      
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [status, analysisMode]);

  const handleAnalyze = async (url: string, token?: string) => {
    if (!analysisMode) return;

    setStatus(AnalysisStatus.FETCHING_REPO);
    setError(null);
    setFailedStep(null);
    setRepoInfo(null);
    setAnalysis(null);
    setRepoStructure([]);
    setRepoFiles([]);
    setLoadingProgress(0);
    setCurrentStepIndex(0);
    setShowTokenHint(false);
    
    await refreshRateLimit(token);

    let currentStepLabel = "Validating Repository";

    try {
      // STEP 1: Validation
      setCurrentStepIndex(0);
      setLoadingProgress(10);
      const details = extractRepoDetails(url);
      if (!details) {
        throw new Error("Invalid GitHub URL. Please use format: https://github.com/owner/repo");
      }
      await new Promise(r => setTimeout(r, 600)); // smooth animation

      // STEP 2: Metadata
      currentStepLabel = "Fetching Metadata";
      setCurrentStepIndex(1);
      setLoadingMessage(`Fetching metadata for ${details.owner}/${details.repo}...`);
      setLoadingProgress(30);
      
      const info = await getRepoMetadata(details.owner, details.repo, token);
      setRepoInfo(info);
      
      // STEP 3: Files
      currentStepLabel = "Scanning Codebase";
      setCurrentStepIndex(2);
      setLoadingMessage(
        analysisMode === 'archaeologist'
        ? "Deep Scan: Fetching source code..."
        : "Scanning file structure and key files..."
      );
      setLoadingProgress(50);
      
      const { structure, files } = await gatherRepoContext(details.owner, details.repo, info.defaultBranch, analysisMode, token);
      setRepoStructure(structure);
      setRepoFiles(files);

      if (files.length === 0 && structure.length === 0) {
        throw new Error("Could not retrieve file structure. The repo might be empty.");
      }
      await refreshRateLimit(token);

      // STEP 4: AI Analysis
      currentStepLabel = "Generating Analysis";
      setCurrentStepIndex(3);
      setStatus(AnalysisStatus.ANALYZING_AI);
      setLoadingProgress(75);
      
      // The loading message useEffect will take over the text here
      const aiResult = await analyzeRepoWithWatsonx(info.name, structure, files, analysisMode);
      
      setLoadingProgress(100);
      setAnalysis(aiResult);
      setStatus(AnalysisStatus.COMPLETE);

    } catch (err: any) {
      console.error(err);
      const msg = err.message || "An unexpected error occurred.";
      setError(msg);
      setFailedStep(currentStepLabel);
      setStatus(AnalysisStatus.ERROR);
      await refreshRateLimit(token);
      if (msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("403")) {
          setShowTokenHint(true);
      }
    }
  };

  const resetAnalysis = () => {
    setStatus(AnalysisStatus.IDLE);
    setRepoInfo(null);
    setAnalysis(null);
    setRepoStructure([]);
    setRepoFiles([]);
    setLoadingProgress(0);
    setError(null);
    setFailedStep(null);
    refreshRateLimit();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-github-dark font-sans text-gray-900 dark:text-github-text transition-colors duration-300">
      <Header 
         rateLimit={rateLimit} 
         theme={theme} 
         toggleTheme={toggleTheme} 
         currentView={currentView}
         onNavigate={setCurrentView}
      />
      
      <main className="container mx-auto px-4 py-12">
        {currentView === 'about' ? (
           <AboutPage />
        ) : currentView === 'blast-radius' && repoInfo && repoFiles.length > 0 ? (
           <BlastRadiusPage
             repoInfo={repoInfo}
             files={repoFiles}
             structure={repoStructure}
             onBack={() => setCurrentView('home')}
           />
        ) : (
           <>
              {/* Landing Page: Mode Selection */}
              {status === AnalysisStatus.IDLE && !analysisMode && (
                <div className="max-w-4xl mx-auto animate-fade-in-up">
                   <div className="text-center mb-16">
                      <h2 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">
                        Understand any codebase. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500 dark:from-blue-400 dark:to-green-400">Instantly.</span>
                      </h2>
                      <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        CodePulse uses IBM Watsonx AI to read documentation, map architecture, and find bugs.
                        Choose your analysis engine below.
                      </p>
                   </div>

                   <div className="grid md:grid-cols-2 gap-8 px-4">
                      {/* Basic Mode Card */}
                      <button 
                        onClick={() => setAnalysisMode('basic')}
                        className="group relative bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl p-8 hover:border-blue-400 dark:hover:border-github-accent transition-all duration-300 text-left hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                          <svg className="w-24 h-24 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        </div>
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-colors">
                          <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Analyze Repository</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                          The standard architectural overview. Perfect for understanding new libraries, checking tech stacks, and getting up to speed quickly.
                        </p>
                        <div className="flex gap-2">
                          <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-github-dark border border-gray-200 dark:border-github-border text-gray-600 dark:text-gray-300">Architecture</span>
                          <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-github-dark border border-gray-200 dark:border-github-border text-gray-600 dark:text-gray-300">Tech Stack</span>
                        </div>
                      </button>

                      {/* Archaeologist Mode Card */}
                      <button 
                        onClick={() => setAnalysisMode('archaeologist')}
                        className="group relative bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl p-8 hover:border-orange-500/50 transition-all duration-300 text-left hover:shadow-2xl hover:shadow-orange-900/10 hover:-translate-y-1"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <svg className="w-24 h-24 text-orange-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13.79 16.21l-2.42-2.42 1.42-1.42 2.42 2.42c.86-.86 1.28-2.02 1.14-3.15-.31-2.58-2.56-4.46-5.15-4.46-1.57 0-3.03.71-4.02 1.94l2.25 2.25-1.42 1.42-2.25-2.25C4.54 11.5 5.25 12.96 6.5 13.96c2.58 2.06 6.35 1.77 8.57-.45l3.29 3.29c.39.39 1.02.39 1.41 0 .4-.39.4-1.02.01-1.41l-6-6zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/></svg>
                        </div>
                         <div className="w-14 h-14 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mb-6 group-hover:bg-orange-200 dark:group-hover:bg-orange-500/20 transition-colors">
                          <svg className="w-7 h-7 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Legacy Code Archaeologist</h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                          Deep dive into monoliths. Identifies "spaghetti code", technical debt, deprecated patterns, and modernization paths.
                        </p>
                        <div className="flex gap-2">
                          <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-github-dark border border-gray-200 dark:border-github-border text-gray-600 dark:text-gray-300">Tech Debt</span>
                          <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-github-dark border border-gray-200 dark:border-github-border text-gray-600 dark:text-gray-300">Refactoring</span>
                        </div>
                      </button>
                   </div>
                </div>
              )}

              {/* Input Section */}
              {status === AnalysisStatus.IDLE && analysisMode && (
                 <div className="animate-fade-in-up max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                       <button 
                         onClick={() => setAnalysisMode(null)} 
                         className="group mb-8 flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-blue-400 dark:hover:border-github-accent hover:text-blue-600 dark:hover:text-github-accent hover:shadow-md transition-all duration-300 mx-auto"
                       >
                         <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                         Choose a different mode
                       </button>

                       {/* Robot Icon */}
                       <div className="flex justify-center mb-6">
                          <div className={`relative group p-4 rounded-full bg-gradient-to-br ${
                              analysisMode === 'basic' 
                              ? 'from-blue-500/10 to-green-500/10 dark:from-blue-500/20 dark:to-green-500/20' 
                              : 'from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20'
                          } ring-1 ${
                              analysisMode === 'basic' ? 'ring-blue-200 dark:ring-blue-800' : 'ring-orange-200 dark:ring-orange-800'
                          }`}>
                              <div className={`absolute inset-0 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-500 ${
                                  analysisMode === 'basic' ? 'bg-blue-400' : 'bg-orange-400'
                              }`}></div>
                              
                              {/* Robot SVG */}
                              <svg 
                                  className={`w-16 h-16 relative z-10 transition-transform duration-500 group-hover:scale-110 ${
                                      analysisMode === 'basic' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                                  }`} 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="1.5"
                              >
                                   <rect x="5" y="8" width="14" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                                   <path d="M12 8V4" strokeLinecap="round" strokeLinejoin="round" />
                                   <circle cx="12" cy="3" r="1" strokeLinecap="round" strokeLinejoin="round" />
                                   {/* Eyes */}
                                   <circle cx="9" cy="13" r="1.5" fill="currentColor" stroke="none" />
                                   <circle cx="15" cy="13" r="1.5" fill="currentColor" stroke="none" />
                                   {/* Mouth */}
                                   <path d="M10 16h4" strokeLinecap="round" strokeLinejoin="round" />
                                   {/* Ears/Bolts */}
                                   <path d="M3 14h2M19 14h2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                          </div>
                       </div>

                       <h2 className={`text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r ${
                          analysisMode === 'basic'
                          ? 'from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-400'
                          : 'from-orange-600 to-red-500 dark:from-orange-400 dark:to-red-400'
                       }`}>
                         {analysisMode === 'basic' ? 'Analyze Repository' : 'Legacy Code Excavation'}
                       </h2>
                       
                       <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed">
                         {analysisMode === 'basic' 
                            ? 'unlock instant architecture diagrams, security scans, and a complete project summary.' 
                            : 'Paste the link to an old project to find hidden problems, risks, and a clear plan for cleaning it up.'}
                       </p>
                    </div>
                    <RepoForm 
                      onSubmit={handleAnalyze} 
                      isLoading={false} 
                      defaultShowToken={showTokenHint}
                      rateLimit={rateLimit}
                    />
                 </div>
              )}

              {/* Loading State with Progress Steps */}
              {(status === AnalysisStatus.FETCHING_REPO || status === AnalysisStatus.ANALYZING_AI) && (
                <div className="max-w-md mx-auto animate-fade-in">
                   <div className="bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl p-8 shadow-xl">
                      <div className="flex flex-col items-center mb-8">
                         <div className="relative">
                            <div className={`w-16 h-16 border-4 ${analysisMode === 'archaeologist' ? 'border-orange-200 dark:border-orange-900' : 'border-blue-200 dark:border-blue-900'} rounded-full mb-4`}></div>
                            <div className={`absolute top-0 left-0 w-16 h-16 border-4 ${analysisMode === 'archaeologist' ? 'border-orange-500' : 'border-blue-600 dark:border-github-accent'} border-t-transparent rounded-full animate-spin`}></div>
                         </div>
                         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {status === AnalysisStatus.ANALYZING_AI ? 'Analyzing Repository' : 'Scanning Repository'}
                         </h3>
                         <p className="text-sm text-gray-500 dark:text-gray-400 text-center min-h-[20px] animate-pulse">
                            {loadingMessage}
                         </p>
                      </div>

                      <div className="space-y-1 mb-6">
                         {ANALYSIS_STEPS.map((step, index) => (
                            <LoadingStep 
                              key={index} 
                              label={step.label} 
                              status={index < currentStepIndex ? 'completed' : index === currentStepIndex ? 'current' : 'pending'} 
                              index={index}
                            />
                         ))}
                      </div>

                      <div className="w-full">
                         <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(loadingProgress)}%</span>
                         </div>
                         <ProgressBar progress={loadingProgress} color={analysisMode === 'archaeologist' ? 'bg-orange-500' : 'bg-blue-600 dark:bg-github-accent'} />
                      </div>
                   </div>
                </div>
              )}

              {/* Error State */}
              {status === AnalysisStatus.ERROR && error && (
                <div className="max-w-2xl mx-auto bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/50 rounded-lg p-6 text-center animate-fade-in">
                   <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Analysis Failed</h3>
                   
                   {failedStep && (
                     <div className="inline-block mb-4 border-b border-red-500/30 pb-1">
                       <span className="text-xs font-semibold text-red-500 dark:text-red-300/70 uppercase tracking-widest">
                         Failed Step: {failedStep}
                       </span>
                     </div>
                   )}

                   <p className="text-gray-700 dark:text-gray-300">{error}</p>
                   {showTokenHint && (
                      <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-2 max-w-lg mx-auto bg-yellow-50 dark:bg-yellow-900/10 p-2 rounded border border-yellow-200 dark:border-yellow-900/30">
                          <strong>Tip:</strong> Create a <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="underline hover:text-yellow-600 dark:hover:text-yellow-300">Personal Access Token</a> and paste it below.
                      </p>
                   )}
                   <button 
                     onClick={() => setStatus(AnalysisStatus.IDLE)}
                     className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                   >
                     Try Again
                   </button>
                </div>
              )}

              {/* Results */}
              {status === AnalysisStatus.COMPLETE && repoInfo && analysis && (
                <div>
                  <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
                    <button
                      onClick={resetAnalysis}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                      Analyze another repository
                    </button>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setCurrentView('blast-radius')}
                        className="group px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
                      >
                        <span className="text-lg">💥</span>
                        <span>Blast Radius Analysis</span>
                        <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
                        analysisMode === 'archaeologist'
                          ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50'
                          : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50'
                      }`}>
                        {analysisMode === 'archaeologist' ? 'ARCHAEOLOGIST MODE' : 'BASIC MODE'}
                      </span>
                    </div>
                  </div>
                  
                  {analysisMode === 'archaeologist' ? (
                    <ArchaeologistReport 
                      repoInfo={repoInfo} 
                      analysis={analysis} 
                      structure={repoStructure} 
                      files={repoFiles} 
                    />
                  ) : (
                    <AnalysisReport 
                      repoInfo={repoInfo} 
                      analysis={analysis} 
                      structure={repoStructure}
                      files={repoFiles}
                    />
                  )}

                  <ChatInterface 
                     repoInfo={repoInfo} 
                     analysis={analysis} 
                     files={repoFiles} 
                     structure={repoStructure} 
                  />
                  
                </div>
              )}
           </>
        )}
      </main>

      <footer className="border-t border-gray-200 dark:border-github-border mt-20 py-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} CodePulse AI. Not affiliated with GitHub.</p>
        {rateLimit && (
           <p className="text-xs text-gray-600 mt-2 font-mono">
             API Quota: {rateLimit.remaining}/{rateLimit.limit} • Resets {rateLimit.reset.toLocaleTimeString()}
           </p>
        )}
      </footer>
    </div>
  );
};

export default App;

// Made with Bob
