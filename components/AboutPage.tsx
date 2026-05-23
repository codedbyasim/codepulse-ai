import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Network, Cpu, Compass, HelpCircle } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      className="max-w-6xl mx-auto px-4 py-12 space-y-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center space-y-6 pt-8">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Bringing Absolute Clarity to <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500 text-transparent bg-clip-text">Complex Codebase</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed font-light">
          CodePulse AI acts as a next-generation neural lens for GitHub repositories, mapping file architectures, generating live diagrams, and auditing technical debt instantly.
        </p>
      </motion.div>

      {/* Problem & Solution Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        <motion.div 
          variants={itemVariants} 
          className="bg-white dark:bg-github-card p-8 rounded-2xl border border-slate-200 dark:border-github-border/70 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
        >
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors"></div>
           <div className="w-12 h-12 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-500 mb-6 relative z-10">
              <AlertCircle className="w-6 h-6" />
           </div>
           <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 relative z-10">The Core Problem</h3>
           <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base relative z-10 font-normal">
             Software engineering teams spend over <strong>60% of their operational time</strong> reading code and parsing legacy flows. Documentation is frequently outdated or completely non-existent. Onboarding engineers to massive repositories or refactoring monolith dependencies is a high-risk manual guessing game.
           </p>
        </motion.div>

        <motion.div 
          variants={itemVariants} 
          className="bg-white dark:bg-github-card p-8 rounded-2xl border border-slate-200 dark:border-github-border/70 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow"
        >
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
           <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 mb-6 relative z-10">
              <CheckCircle className="w-6 h-6" />
           </div>
           <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 relative z-10">The CodePulse Solution</h3>
           <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base relative z-10 font-normal">
             CodePulse AI solves the cognitive overload by performing automatic semantic codebase scans. It maps code components, produces <strong>interactive class/sequence charts</strong>, logs <strong>dependency hazards</strong>, drafts unit test suites, and plans microservice separation—reducing onboarding to minutes.
           </p>
        </motion.div>
      </div>

      {/* How it Works Banner */}
      <motion.div 
        variants={itemVariants} 
        className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#161b22]/40 dark:to-[#0d1117]/30 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-github-border/70 text-center md:text-left flex flex-col lg:flex-row items-center gap-12"
      >
          <div className="flex-1 space-y-5">
             <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white">How CodePulse Operates</h3>
             <p className="text-slate-500 dark:text-slate-350 text-base sm:text-lg leading-relaxed font-light">
                We combine official GitHub REST services with advanced Google Gemini LLM reasoning capabilities. When analyzing, we construct a virtual map of file boundaries, isolate core logic files, and feed dependency segments to analyze and draw architecture flows dynamically.
             </p>
          </div>
          
          <div className="flex-1 w-full">
             <div className="space-y-4">
                 <motion.div 
                   className="flex items-center gap-4 bg-white dark:bg-[#0d1117] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:scale-[1.01] transition-all"
                   whileHover={{ x: 6 }}
                 >
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-bold text-sm shrink-0">1</div>
                    <div className="text-left">
                       <h4 className="font-bold text-slate-900 dark:text-white text-sm">Target Ingestion</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Parse repository boundaries and index files.</p>
                    </div>
                 </motion.div>
                 
                 <motion.div 
                   className="flex items-center gap-4 bg-white dark:bg-[#0d1117] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:scale-[1.01] transition-all"
                   whileHover={{ x: 6 }}
                 >
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-sm shrink-0">2</div>
                    <div className="text-left">
                       <h4 className="font-bold text-slate-900 dark:text-white text-sm">Dependency Extraction</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Isolate file hooks, exports, and imports.</p>
                    </div>
                 </motion.div>
                 
                 <motion.div 
                   className="flex items-center gap-4 bg-white dark:bg-[#0d1117] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 hover:scale-[1.01] transition-all"
                   whileHover={{ x: 6 }}
                 >
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-sm shrink-0">3</div>
                    <div className="text-left">
                       <h4 className="font-bold text-slate-900 dark:text-white text-sm">Visual Synthesis</h4>
                       <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Draw Mermaid structural flows, security items, and test plans.</p>
                    </div>
                 </motion.div>
             </div>
          </div>
      </motion.div>
    </motion.div>
  );
};
