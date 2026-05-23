import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RepoInfo, AnalysisResult, FileContent } from '../types';
import { ContentCard, Badge, MermaidDiagram, AlertIcon, DownloadIcon, CodeBlock, FileIcon } from './SharedUI';
import { FileExplorer } from './FileExplorer';
import { Navigation, Database, ShieldAlert, Sparkles, FileCode, CheckCircle2, ChevronRight } from 'lucide-react';

interface ArchaeologistReportProps {
  repoInfo: RepoInfo;
  analysis: AnalysisResult;
  structure: string[];
  files: FileContent[];
}

export const ArchaeologistReport: React.FC<ArchaeologistReportProps> = ({ repoInfo, analysis, structure, files }) => {
  const [activeDiagram, setActiveDiagram] = useState<'class' | 'seq'>('class');
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const NavItem = ({ id, label, icon }: { id: string; label: string; icon?: React.ReactNode }) => (
    <motion.button 
      onClick={() => scrollToSection(id)}
      className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-slate-400 hover:text-orange-400 hover:bg-orange-500/5 rounded-xl border border-transparent hover:border-orange-500/10 transition-all flex items-center justify-between group"
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="flex items-center gap-2.5">
        {icon}
        <span>{label}</span>
      </span>
      <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );

  const handleDownload = () => {
      const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' }); 
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${repoInfo.name}-archaeology.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  return (
     <motion.div 
       className="font-sans text-slate-800 dark:text-slate-350"
       variants={containerVariants}
       initial="hidden"
       animate="visible"
     >
        {/* Top Header - Site Info Banner */}
        <motion.div 
          variants={sectionVariants}
          className="mb-8 pb-6 border-b border-orange-500/20 dark:border-orange-950/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
        >
           <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                 <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                   <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping"></span>
                   <span>Excavation Site #001</span>
                 </span>
                 <span className="text-slate-400 text-xs font-semibold flex items-center gap-1">
                   <FileIcon className="w-3.5 h-3.5 text-slate-400"/> {files.length} artifacts analyzed
                 </span>
              </div>
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-orange-100 tracking-tight">{repoInfo.owner} / {repoInfo.name}</h1>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm max-w-3xl">"{repoInfo.description || "No description provided."}"</p>
           </div>
           
           <div className="flex gap-3 w-full sm:w-auto">
             <motion.button 
                onClick={handleDownload}
                className="w-full sm:w-auto px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/25 text-orange-500 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
             >
                <DownloadIcon /> 
                <span>Export Report (JSON)</span>
             </motion.button>
           </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sticky Navigation Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2 z-10">
             <div className="bg-white/80 dark:bg-[#161b22]/50 backdrop-blur-md border border-slate-200 dark:border-orange-950/20 rounded-2xl p-4.5 space-y-6 shadow-sm">
                <div>
                  <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3.5 px-2 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Site Sections</span>
                  </h3>
                  <nav className="space-y-1">
                    <NavItem id="summary" label="Executive Summary" />
                    <NavItem id="diagram" label="Visual Architecture" />
                    <NavItem id="logic" label="Business Logic Rules" />
                    <NavItem id="refactoring" label="Refactoring Plan" />
                    <NavItem id="tests" label="Safety Nets (Tests)" />
                    <NavItem id="hazards" label="Hazard Log (Risk)" />
                    <NavItem id="explorer" label="Excavation Grid" />
                  </nav>
                </div>
                
                <div>
                   <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-3 px-2 flex items-center gap-1.5">
                     <Database className="w-3.5 h-3.5" />
                     <span>Tech Archetype</span>
                   </h3>
                   <div className="flex flex-wrap gap-1 px-2 pt-1">
                      {analysis.techStack.map(t => (
                        <span key={t} className="text-[10px] font-semibold bg-orange-500/5 text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/10">{t}</span>
                      ))}
                   </div>
                </div>
             </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 space-y-10 min-w-0">
            
            {/* Summary Section */}
            <motion.section id="summary" className="scroll-mt-20" variants={sectionVariants}>
               <ContentCard title="Executive Summary" className="border-orange-500/10" headerClassName="bg-orange-500/5 text-orange-400">
                  <div className="prose dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-350">
                     <p className="leading-relaxed text-base">{analysis.summary}</p>
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-slate-50 dark:bg-slate-900/10 p-4 rounded-xl border border-orange-500/10">
                        <h4 className="text-orange-500 text-xs font-bold uppercase tracking-wider mb-2">Restoration Assessment</h4>
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 italic">"{analysis.securityProfile}"</p>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-900/10 p-4 rounded-xl border border-orange-500/10">
                        <h4 className="text-orange-500 text-xs font-bold uppercase tracking-wider mb-2">Technical Restructuring</h4>
                        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 whitespace-pre-wrap">{analysis.notes.slice(0, 160)}...</p>
                     </div>
                  </div>
               </ContentCard>
            </motion.section>

            {/* Visual Maps (Diagrams) */}
            <motion.section id="diagram" className="scroll-mt-20" variants={sectionVariants}>
              <ContentCard title="Site Architecture Maps" className="border-orange-500/10" headerClassName="bg-orange-500/5 text-orange-400">
                 <div className="flex gap-2 mb-4 border-b border-orange-500/10 pb-0.5">
                     <button 
                        onClick={() => setActiveDiagram('class')}
                        className={`px-4 py-2 text-sm font-semibold rounded-t-xl border-t border-l border-r -mb-px transition-colors ${activeDiagram === 'class' ? 'bg-slate-50 dark:bg-slate-900/10 border-orange-500/15 text-orange-500 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                     >
                       Class Structure
                     </button>
                     <button 
                        onClick={() => setActiveDiagram('seq')}
                        className={`px-4 py-2 text-sm font-semibold rounded-t-xl border-t border-l border-r -mb-px transition-colors ${activeDiagram === 'seq' ? 'bg-slate-50 dark:bg-slate-900/10 border-orange-500/15 text-orange-500 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                     >
                       Transaction Flow
                     </button>
                 </div>

                 <div className="bg-slate-50/50 dark:bg-slate-900/5 p-2 rounded-xl border border-orange-500/10 overflow-hidden min-h-[300px]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeDiagram}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                      >
                        {activeDiagram === 'class' && (
                           analysis.classDiagram ? <MermaidDiagram chart={analysis.classDiagram} /> : <div className="text-center py-12 text-slate-500 italic text-sm">No class structure available.</div>
                        )}
                        {activeDiagram === 'seq' && (
                           analysis.sequenceDiagram ? <MermaidDiagram chart={analysis.sequenceDiagram} /> : <div className="text-center py-12 text-slate-500 italic text-sm">No transaction flow available.</div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                 </div>
              </ContentCard>
            </motion.section>

            {/* Business Logic */}
            <motion.section id="logic" className="scroll-mt-20" variants={sectionVariants}>
               <ContentCard title="Business Logic Translation" className="border-orange-500/10" headerClassName="bg-orange-500/5 text-orange-400">
                  <div className="space-y-4">
                     <p className="text-sm text-slate-550 dark:text-slate-400 leading-relaxed pl-1.5 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                        <span>Core system rules excavated from legacy codebase:</span>
                     </p>
                     <ul className="space-y-2">
                        {analysis.keyComponents.map((comp, i) => (
                           <motion.li 
                             key={i} 
                             className="flex gap-3 text-sm text-slate-700 dark:text-slate-350 bg-orange-500/5 p-3.5 rounded-xl border border-orange-500/10 hover:border-orange-500/25 transition-colors"
                             whileHover={{ scale: 1.005 }}
                           >
                              <span className="text-orange-500 font-extrabold">{(i + 1).toString().padStart(2, '0')}</span>
                              <span className="leading-normal">{comp}</span>
                           </motion.li>
                        ))}
                     </ul>
                  </div>
               </ContentCard>
            </motion.section>

            {/* Refactoring Strategy */}
            <motion.section id="refactoring" className="scroll-mt-20" variants={sectionVariants}>
               <div className="flex items-center justify-between mb-4.5">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-orange-100 flex items-center gap-2">
                    <FileCode className="w-6 h-6 text-orange-500" />
                    <span>Microservices Migration Plan</span>
                  </h2>
               </div>
               
               {analysis.refactoringSuggestions && analysis.refactoringSuggestions.length > 0 ? (
                  <div className="space-y-6">
                     {analysis.refactoringSuggestions.map((suggestion, idx) => (
                        <motion.div 
                          key={idx} 
                          className="bg-white dark:bg-github-card border border-slate-200 dark:border-orange-950/20 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
                          whileHover={{ y: -2 }}
                        >
                           <div className="p-4 bg-orange-500/5 border-b border-slate-250 dark:border-orange-950/15 flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="space-y-1">
                                 <h3 className="font-bold text-orange-500 text-base">{suggestion.title}</h3>
                                 <div className="text-xs font-semibold flex items-center gap-2 flex-wrap">
                                    <span className="text-slate-500">Source: <span className="font-bold text-slate-650 dark:text-slate-350">{suggestion.currentModule}</span></span>
                                    <span className="text-slate-400">→</span>
                                    <span className="text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded">{suggestion.proposedMicroservice}</span>
                                 </div>
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-full w-fit">Priority High</span>
                           </div>
                           <div className="p-6 space-y-4">
                              <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                                 "{suggestion.reasoning}"
                              </div>
                              <div className="space-y-3.5">
                                 <h4 className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-2">Migration Steps</h4>
                                 <div className="space-y-2.5">
                                    {suggestion.migrationSteps.map((step, sIdx) => (
                                       <div key={sIdx} className="text-sm text-slate-700 dark:text-slate-350 flex items-start gap-3">
                                          <span className="shrink-0 w-5 h-5 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center text-xs font-bold mt-0.5">{sIdx + 1}</span>
                                          <span className="leading-relaxed">{step}</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </motion.div>
                     ))}
                  </div>
               ) : (
                  <div className="p-8 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl text-slate-500">No refactoring roadmap generated.</div>
               )}
            </motion.section>

            {/* Unit Tests */}
            <motion.section id="tests" className="scroll-mt-20" variants={sectionVariants}>
               <h2 className="text-2xl font-bold text-slate-900 dark:text-orange-100 mb-4.5 flex items-center gap-2">
                 <CheckCircle2 className="w-6 h-6 text-orange-500" />
                 <span>Safety Net (Generated Unit Tests)</span>
               </h2>
               <div className="space-y-6">
                  {analysis.legacyUnitTests?.map((test, i) => (
                     <ContentCard 
                        key={i} 
                        title={`Generated Test Suite: ${test.targetFile}`} 
                        className="border-orange-500/10" 
                        headerClassName="bg-orange-500/5 text-orange-400"
                        collapsible
                     >
                        <p className="text-sm text-slate-500 dark:text-slate-450 mb-3.5 italic">"{test.description}"</p>
                        <CodeBlock code={test.code} />
                     </ContentCard>
                  ))}
               </div>
            </motion.section>

            {/* Hazards */}
            <motion.section id="hazards" className="scroll-mt-20" variants={sectionVariants}>
               <ContentCard title="Hazard Log (Technical Debt & Compliance Risks)" className="border-red-500/20 border-l-4 border-l-red-500" headerClassName="bg-red-500/5 text-red-400">
                  <div className="space-y-3.5">
                     {analysis.vulnerabilities && analysis.vulnerabilities.length > 0 ? (
                        analysis.vulnerabilities.map((vuln, i) => (
                           <div key={i} className="flex items-start gap-3 p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl">
                              <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                 <h4 className="text-sm font-bold text-rose-400">{vuln.title}</h4>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{vuln.description}</p>
                                 <span className="inline-block mt-2.5 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 border border-rose-500/20 text-rose-400 rounded-full bg-rose-500/10">{vuln.severity} Risk Profile</span>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="text-emerald-500 text-sm font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>No critical hazards or technical vulnerabilities detected.</span>
                        </div>
                     )}
                  </div>
               </ContentCard>
            </motion.section>

             {/* Explorer */}
             <motion.section id="explorer" className="scroll-mt-20" variants={sectionVariants}>
                 <FileExplorer 
                    repoInfo={repoInfo} 
                    structure={structure} 
                    files={files} 
                    title="Excavation File Grid" 
                    themeColor="bg-orange-500/10 border-orange-500/10 text-orange-500"
                 />
             </motion.section>

          </div>
        </div>
     </motion.div>
  );
};
