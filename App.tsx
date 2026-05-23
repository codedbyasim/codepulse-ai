import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { RepoForm } from './components/RepoForm';
import { AnalysisReport } from './components/AnalysisReport';
import { ArchaeologistReport } from './components/ArchaeologistReport';
import { ChatInterface } from './components/ChatInterface';
import { ProgressBar, LoadingStep } from './components/SharedUI';
import { AboutPage } from './components/AboutPage';
import { BlastRadiusPage } from './components/BlastRadiusPage';
import { RepoInfo, AnalysisResult, AnalysisStatus, FileContent, AnalysisMode, RateLimit } from './types';
import { extractRepoDetails, getRepoMetadata, gatherRepoContext, getGitHubRateLimit } from './services/github';
import { analyzeRepoWithGemini } from './services/gemini';

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
          "AI is reading the monolith...",
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
      const aiResult = await analyzeRepoWithGemini(info.name, structure, files, analysisMode);
      
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
      
      {/* Landing Page: Hero Section - Full Width */}
      {currentView === 'home' && status === AnalysisStatus.IDLE && !analysisMode && (
        <HeroSection theme={theme} 
          onBasicClick={() => setAnalysisMode('basic')}
          onArchaeologistClick={() => setAnalysisMode('archaeologist')}
        />
      )}
      
      {/* Other Content - Containerized */}
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {currentView === 'about' ? (
           <AboutPage />
        ) : currentView === 'blast-radius' && repoInfo && repoFiles.length > 0 ? (
           <BlastRadiusPage theme={theme}
             repoInfo={repoInfo}
             files={repoFiles}
             structure={repoStructure}
             onBack={() => setCurrentView('home')}
           />
        ) : (
           <>
              {/* Input Section */}
              {status === AnalysisStatus.IDLE && analysisMode && (
                 <div className="animate-fade-in-up max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                       <button 
                         onClick={() => setAnalysisMode(null)} 
                         className="group mb-8 flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-[#161b22]/50 hover:bg-slate-50 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-bold text-slate-700 dark:text-slate-350 hover:shadow-sm transition-all duration-300 mx-auto"
                       >
                         <svg className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                         <span>Choose a different mode</span>
                       </button>

                       {/* Robot Icon */}
                       <div className="flex justify-center mb-6">
                          <div className={`relative group p-4.5 rounded-3xl bg-slate-100 dark:bg-slate-900 border ${
                              analysisMode === 'basic' 
                              ? 'border-blue-500/20' 
                              : 'border-orange-500/20'
                          }`}>
                              <div className={`absolute inset-0 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500 ${
                                  analysisMode === 'basic' ? 'bg-blue-400' : 'bg-orange-400'
                              }`}></div>
                              
                              {/* Robot SVG */}
                              <svg 
                                  className={`w-14 h-14 relative z-10 transition-transform duration-500 group-hover:scale-105 ${
                                      analysisMode === 'basic' ? 'text-blue-500' : 'text-orange-500'
                                  }`} 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="1.5"
                              >
                                   <rect x="5" y="8" width="14" height="12" rx="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                   <path d="M12 8V4" strokeLinecap="round" strokeLinejoin="round" />
                                   <circle cx="12" cy="3" r="1.2" fill="currentColor" stroke="none" />
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

                       <h2 className={`text-3xl sm:text-4xl font-extrabold mb-3 bg-clip-text text-transparent bg-gradient-to-r ${
                          analysisMode === 'basic'
                          ? 'from-blue-600 via-cyan-500 to-blue-600 dark:from-blue-400 dark:via-cyan-400 dark:to-blue-400'
                          : 'from-orange-600 via-rose-500 to-orange-600 dark:from-orange-400 dark:via-rose-450 dark:to-orange-400'
                       }`}>
                          {analysisMode === 'basic' ? 'Analyze Repository' : 'Legacy Code Excavation'}
                       </h2>
                       
                       <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed font-light">
                          {analysisMode === 'basic' 
                             ? 'Paste the repo URL to produce modular code summaries, Mermaid architecture flowcharts, and technical audits.' 
                             : 'Investigate complex, legacy, or monolithic repositories to target technical debt and blueprint modernization roadmaps.'}
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
                   <div className="bg-white dark:bg-github-card border border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 shadow-lg">
                      <div className="flex flex-col items-center mb-8">
                         <div className="relative mb-5">
                            <div className={`w-14 h-14 border-4 ${analysisMode === 'archaeologist' ? 'border-orange-200 dark:border-orange-950' : 'border-blue-200 dark:border-blue-950'} rounded-full`}></div>
                            <div className={`absolute top-0 left-0 w-14 h-14 border-4 ${analysisMode === 'archaeologist' ? 'border-orange-500' : 'border-blue-500 dark:border-cyan-500'} border-t-transparent rounded-full animate-spin`}></div>
                         </div>
                         <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
                            {status === AnalysisStatus.ANALYZING_AI ? 'AI Analysis Active' : 'Scanning Repository'}
                         </h3>
                         <p className="text-xs text-slate-500 dark:text-slate-400 text-center min-h-[16px] animate-pulse">
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
                         <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                            <span>Analysis Flow</span>
                            <span>{Math.round(loadingProgress)}%</span>
                         </div>
                         <ProgressBar progress={loadingProgress} color={analysisMode === 'archaeologist' ? 'bg-orange-500' : 'bg-cyan-500'} />
                      </div>
                   </div>
                </div>
              )}

              {/* Error State */}
              {status === AnalysisStatus.ERROR && error && (
                <div className="max-w-2xl mx-auto bg-red-500/5 border border-red-500/20 rounded-2xl p-8 text-center animate-fade-in">
                   <h3 className="text-xl font-bold text-red-500 mb-2">Analysis Failed</h3>
                   
                   {failedStep && (
                     <div className="inline-block mb-4 border-b border-red-500/20 pb-1">
                       <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-widest">
                         Failed Step: {failedStep}
                       </span>
                     </div>
                   )}

                   <p className="text-sm text-slate-655 dark:text-slate-350 leading-relaxed font-mono">{error}</p>
                   {showTokenHint && (
                      <p className="text-amber-500 text-xs mt-3 max-w-lg mx-auto bg-amber-500/5 p-3 rounded-xl border border-amber-550/20 leading-relaxed">
                          <strong>GitHub Rate Limit Tip:</strong> Create a <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="underline hover:text-amber-400 font-bold">Personal Access Token</a> and paste it above to unlock higher analysis limits.
                      </p>
                   )}
                   <button 
                     onClick={() => setStatus(AnalysisStatus.IDLE)}
                     className="mt-6 px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 text-xs font-bold rounded-xl transition-all"
                   >
                     Try Again
                   </button>
                </div>
              )}

              {/* Results */}
              {status === AnalysisStatus.COMPLETE && repoInfo && analysis && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
                    <button
                      onClick={resetAnalysis}
                      className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                      <span>Analyze another repository</span>
                    </button>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
                      <button
                        onClick={() => setCurrentView('blast-radius')}
                        className="group px-4 py-2.5 bg-gradient-to-r from-red-550 to-orange-550 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/10 hover:shadow-lg transition-all duration-300 flex items-center gap-1.5"
                      >
                        <span className="text-sm">💥</span>
                        <span>Blast Radius Analysis</span>
                        <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                        analysisMode === 'archaeologist'
                          ? 'bg-orange-500/10 text-orange-550 border-orange-500/20'
                          : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
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

      <footer className="border-t border-slate-200 dark:border-slate-800 mt-20 py-8 text-center text-slate-500 text-xs font-light space-y-1">
        <p>&copy; {new Date().getFullYear()} CodePulse AI. Not affiliated with GitHub.</p>
        {rateLimit && (
           <p className="text-[10px] text-slate-450 mt-1 font-mono">
             API Quota: {rateLimit.remaining}/{rateLimit.limit} • Resets {rateLimit.reset.toLocaleTimeString()}
           </p>
        )}
      </footer>
    </div>
  );
};

export default App;
