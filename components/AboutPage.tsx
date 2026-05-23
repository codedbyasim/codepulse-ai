import React from 'react';



export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in space-y-20">
      
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-8">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Bringing Clarity to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-500 dark:from-blue-400 dark:to-green-400">Code</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
          CodePulse AI acts as an intelligent lens for GitHub repositories, transforming complex codebases into clear, actionable insights instantly.
        </p>
      </div>

      {/* Problem & Solution */}
      <div className="grid md:grid-cols-2 gap-10">
        <div className="bg-white dark:bg-github-card p-8 rounded-2xl border border-gray-200 dark:border-github-border shadow-sm relative overflow-hidden group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>
           <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400 mb-6 relative z-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           </div>
           <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 relative z-10">The Problem</h3>
           <p className="text-gray-600 dark:text-gray-400 leading-relaxed relative z-10">
             Developers spend up to <strong>60% of their time</strong> simply reading and trying to understand code. Documentation is frequently outdated, missing, or scattered. Entering a new codebase or dealing with legacy monoliths is often a daunting, risky, and slow process involving manual tracing of dependencies and logic.
           </p>
        </div>

        <div className="bg-white dark:bg-github-card p-8 rounded-2xl border border-gray-200 dark:border-github-border shadow-sm relative overflow-hidden group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-colors"></div>
           <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400 mb-6 relative z-10">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </div>
           <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 relative z-10">Our Solution</h3>
           <p className="text-gray-600 dark:text-gray-400 leading-relaxed relative z-10">
             CodePulse AI bridges the gap by using advanced LLMs (Google Gemini Flash 2.0) to read source code directly. It generates instant <strong>architecture diagrams</strong>, identifies <strong>security vulnerabilities</strong>, plans <strong>refactoring strategies</strong>, and explains complex logic in plain English—saving hours of manual investigation.
           </p>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#161b22] dark:to-[#0d1117] p-8 md:p-12 rounded-3xl border border-gray-200 dark:border-github-border text-center md:text-left flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
             <h3 className="text-3xl font-bold text-gray-900 dark:text-white">How It Works</h3>
             <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                We combine the GitHub API with Google Gemini Flash 2.0 models. When you submit a link, we fetch the file tree and intelligently select key source files based on the language. The AI then "reads" the project holistically to generate the report.
             </p>
          </div>
          <div className="flex-1 w-full">
             <div className="space-y-4">
                 <div className="flex items-center gap-4 bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">1</div>
                    <div className="text-left">
                       <h4 className="font-bold text-gray-900 dark:text-white text-sm">Fetch & Parse</h4>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Map file structure & retrieve source code.</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5 ml-0 md:ml-8">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">2</div>
                    <div className="text-left">
                       <h4 className="font-bold text-gray-900 dark:text-white text-sm">Contextual Analysis</h4>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Gemini processes code patterns & dependencies.</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-200 dark:border-white/5 ml-0 md:ml-16">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">3</div>
                    <div className="text-left">
                       <h4 className="font-bold text-gray-900 dark:text-white text-sm">Visual Synthesis</h4>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Generate diagrams, reports & safety tests.</p>
                    </div>
                 </div>
             </div>
          </div>
      </div>
    </div>
  );
};


