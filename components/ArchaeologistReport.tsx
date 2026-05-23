import React, { useState } from 'react';
import { RepoInfo, AnalysisResult, FileContent } from '../types';
import { ContentCard, Badge, MermaidDiagram, AlertIcon, DownloadIcon, CodeBlock, FileIcon } from './SharedUI';
import { FileExplorer } from './FileExplorer';

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
    <button 
      onClick={() => scrollToSection(id)}
      className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 rounded transition-colors flex items-center gap-2"
    >
      {icon}
      {label}
    </button>
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

  return (
     <div className="animate-fade-in-up font-mono text-gray-800 dark:text-gray-300">
        
        {/* Top Header - Site Info */}
        <div className="mb-8 pb-6 border-b border-orange-200 dark:border-orange-900/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-500 border border-orange-200 dark:border-orange-800 text-[10px] px-2 py-0.5 rounded uppercase tracking-widest font-bold">Archaeology Site #001</span>
                 <span className="text-gray-500 text-xs flex items-center gap-1">
                   <FileIcon className="w-3 h-3"/> {files.length} artifacts analyzed
                 </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-orange-100 tracking-tight">{repoInfo.owner} / {repoInfo.name}</h1>
              <p className="text-gray-500 dark:text-orange-400/60 mt-1 italic text-sm max-w-2xl">"{repoInfo.description || "No description provided."}"</p>
           </div>
           <div className="flex gap-3">
             <button 
                onClick={handleDownload}
                className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-2"
             >
                <DownloadIcon /> Export JSON
             </button>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sticky Navigation Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-2">
             <div className="bg-white dark:bg-github-card border border-gray-200 dark:border-orange-900/20 rounded-lg p-4 space-y-6 shadow-sm dark:shadow-none">
                <div>
                  <h3 className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-3 px-2">Site Navigation</h3>
                  <nav className="space-y-1">
                    <NavItem id="summary" label="Executive Summary" />
                    <NavItem id="diagram" label="Visual Maps" />
                    <NavItem id="logic" label="Business Logic" />
                    <NavItem id="refactoring" label="Refactoring Plan" />
                    <NavItem id="tests" label="Safety Nets (Tests)" />
                    <NavItem id="hazards" label="Hazard Log" />
                    <NavItem id="explorer" label="Excavation Grid" />
                  </nav>
                </div>
                
                <div>
                   <h3 className="text-xs font-bold text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-3 px-2">Artifacts (Stack)</h3>
                   <div className="flex flex-wrap gap-1 px-2">
                      {analysis.techStack.map(t => (
                        <span key={t} className="text-[10px] bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2 py-1 rounded border border-orange-200 dark:border-orange-900/30">{t}</span>
                      ))}
                   </div>
                </div>
             </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 space-y-12 min-w-0">
            
            {/* Summary Section */}
            <section id="summary" className="scroll-mt-20">
               <ContentCard title="Executive Summary" className="border-orange-200 dark:border-orange-900/30" headerClassName="bg-orange-50 dark:bg-orange-900/10 text-orange-900 dark:text-orange-200">
                  <div className="prose dark:prose-invert prose-sm max-w-none text-gray-800 dark:text-gray-300">
                     <p className="leading-relaxed text-lg">{analysis.summary}</p>
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="bg-gray-50 dark:bg-[#050505] p-4 rounded border border-orange-100 dark:border-orange-900/20">
                        <h4 className="text-orange-600 dark:text-orange-500 text-xs uppercase tracking-wider mb-2">System Health</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">{analysis.securityProfile}</p>
                     </div>
                     <div className="bg-gray-50 dark:bg-[#050505] p-4 rounded border border-orange-100 dark:border-orange-900/20">
                        <h4 className="text-orange-600 dark:text-orange-500 text-xs uppercase tracking-wider mb-2">Restoration Notes</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{analysis.notes.slice(0, 150)}...</p>
                     </div>
                  </div>
               </ContentCard>
            </section>

            {/* Visual Maps (Diagrams) */}
            <section id="diagram" className="scroll-mt-20">
              <ContentCard title="Site Visual Maps" className="border-orange-200 dark:border-orange-900/30" headerClassName="bg-orange-50 dark:bg-orange-900/10 text-orange-900 dark:text-orange-200">
                 <div className="flex gap-2 mb-4 border-b border-orange-200 dark:border-orange-900/20 pb-1">
                     <button 
                        onClick={() => setActiveDiagram('class')}
                        className={`px-3 py-1 text-sm rounded-t-md border-t border-l border-r transition-colors ${activeDiagram === 'class' ? 'bg-gray-50 dark:bg-[#050505] border-orange-200 dark:border-orange-900/30 text-orange-700 dark:text-orange-400 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                     >
                       Class Structure
                     </button>
                     <button 
                        onClick={() => setActiveDiagram('seq')}
                        className={`px-3 py-1 text-sm rounded-t-md border-t border-l border-r transition-colors ${activeDiagram === 'seq' ? 'bg-gray-50 dark:bg-[#050505] border-orange-200 dark:border-orange-900/30 text-orange-700 dark:text-orange-400 font-medium' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                     >
                       Transaction Flow
                     </button>
                 </div>

                 <div className="bg-gray-50 dark:bg-[#050505] p-4 rounded border border-orange-100 dark:border-orange-900/20 overflow-hidden min-h-[300px]">
                    {activeDiagram === 'class' && (
                       analysis.classDiagram ? <MermaidDiagram chart={analysis.classDiagram} /> : <div className="text-center py-10 text-gray-500 italic">No class structure available.</div>
                    )}
                    {activeDiagram === 'seq' && (
                       analysis.sequenceDiagram ? <MermaidDiagram chart={analysis.sequenceDiagram} /> : <div className="text-center py-10 text-gray-500 italic">No transaction flow available.</div>
                    )}
                 </div>
              </ContentCard>
            </section>

            {/* Business Logic */}
            <section id="logic" className="scroll-mt-20">
               <ContentCard title="Business Logic Explanation" className="border-orange-200 dark:border-orange-900/30" headerClassName="bg-orange-50 dark:bg-orange-900/10 text-orange-900 dark:text-orange-200">
                  <div className="space-y-4">
                     <p className="text-gray-700 dark:text-gray-300 leading-relaxed border-l-2 border-orange-500 pl-4">
                        The core business rules identified in the monolith include:
                     </p>
                     <ul className="space-y-2">
                        {analysis.keyComponents.map((comp, i) => (
                           <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 bg-orange-50 dark:bg-orange-900/5 p-3 rounded border border-orange-100 dark:border-orange-900/10">
                              <span className="text-orange-600 dark:text-orange-500 font-bold">{(i + 1).toString().padStart(2, '0')}</span>
                              {comp}
                           </li>
                        ))}
                     </ul>
                  </div>
               </ContentCard>
            </section>

            {/* Refactoring Strategy */}
            <section id="refactoring" className="scroll-mt-20">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-orange-100">Refactoring Strategy</h2>
                  <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-1 rounded border border-orange-200 dark:border-orange-900/30">Microservices Roadmap</span>
               </div>
               
               {analysis.refactoringSuggestions && analysis.refactoringSuggestions.length > 0 ? (
                  <div className="space-y-6">
                     {analysis.refactoringSuggestions.map((suggestion, idx) => (
                        <div key={idx} className="bg-white dark:bg-github-card border border-orange-200 dark:border-orange-900/30 rounded-lg overflow-hidden shadow-sm dark:shadow-none">
                           <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border-b border-orange-200 dark:border-orange-900/20 flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <div>
                                 <h3 className="font-bold text-orange-800 dark:text-orange-300">{suggestion.title}</h3>
                                 <div className="text-xs flex gap-2 mt-1">
                                    <span className="text-gray-500">Extracting: <span className="text-gray-700 dark:text-gray-300">{suggestion.currentModule}</span></span>
                                    <span className="text-gray-400 dark:text-gray-600">→</span>
                                    <span className="text-orange-600 dark:text-orange-400 font-semibold">{suggestion.proposedMicroservice}</span>
                                 </div>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-500 px-2 py-1 rounded">Priority High</span>
                           </div>
                           <div className="p-6 space-y-4">
                              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                 "{suggestion.reasoning}"
                              </div>
                              <div>
                                 <h4 className="text-xs uppercase tracking-widest text-orange-600 dark:text-orange-500 mb-2">Migration Steps</h4>
                                 <div className="space-y-3">
                                    {suggestion.migrationSteps.map((step, sIdx) => (
                                       <div key={sIdx} className="text-sm text-gray-700 dark:text-gray-300 flex gap-3">
                                          <span className="shrink-0 w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 flex items-center justify-center text-xs font-bold">{sIdx + 1}</span>
                                          <span>{step}</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="p-8 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-500">No refactoring suggestions available.</div>
               )}
            </section>

            {/* Unit Tests */}
            <section id="tests" className="scroll-mt-20">
               <h2 className="text-2xl font-bold text-gray-900 dark:text-orange-100 mb-4">Safety Net Generation</h2>
               <div className="grid gap-6">
                  {analysis.legacyUnitTests?.map((test, i) => (
                     <ContentCard 
                        key={i} 
                        title={`Generated Test: ${test.targetFile}`} 
                        className="border-orange-200 dark:border-orange-900/30" 
                        headerClassName="bg-orange-50 dark:bg-orange-900/10 text-orange-900 dark:text-orange-200"
                        collapsible
                     >
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 italic">{test.description}</p>
                        <CodeBlock code={test.code} />
                     </ContentCard>
                  ))}
               </div>
            </section>

            {/* Hazards */}
            <section id="hazards" className="scroll-mt-20">
               <ContentCard title="Hazard Log (Technical Debt)" className="border-red-200 dark:border-red-900/30 border-l-4 border-l-red-600" headerClassName="bg-red-50 dark:bg-red-900/10 text-red-900 dark:text-red-200">
                  <div className="space-y-3">
                     {analysis.vulnerabilities && analysis.vulnerabilities.length > 0 ? (
                        analysis.vulnerabilities.map((vuln, i) => (
                           <div key={i} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/5 border border-red-100 dark:border-red-900/20 rounded hover:bg-red-100 dark:hover:bg-red-900/10 transition-colors">
                              <AlertIcon />
                              <div>
                                 <h4 className="text-sm font-bold text-red-700 dark:text-red-300">{vuln.title}</h4>
                                 <p className="text-xs text-red-600 dark:text-red-200/70 mt-1">{vuln.description}</p>
                                 <span className="inline-block mt-2 text-[10px] px-2 py-0.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded bg-red-100 dark:bg-red-900/40">{vuln.severity} RISK</span>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="text-green-600 dark:text-green-400 text-sm">No critical hazards detected.</div>
                     )}
                  </div>
               </ContentCard>
            </section>

             {/* Explorer */}
             <section id="explorer" className="scroll-mt-20">
                <FileExplorer 
                   repoInfo={repoInfo} 
                   structure={structure} 
                   files={files} 
                   title="Excavation Grid" 
                   themeColor="bg-orange-100 dark:bg-orange-700/40"
                />
             </section>

          </div>
        </div>
     </div>
  );
};


