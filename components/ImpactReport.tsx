import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlastRadiusResult, RepoInfo } from '../types';
import { MarkdownRenderer } from './SharedUI';
import { ChevronDown, Cpu, Activity, Link, Layers, AlertCircle, TestTube, ShieldCheck } from 'lucide-react';

interface ImpactReportProps {
  result: BlastRadiusResult;
  repoInfo: RepoInfo;
}

export const ImpactReport: React.FC<ImpactReportProps> = ({ result, repoInfo }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('insights');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'from-red-500 to-red-600';
      case 'HIGH': return 'from-orange-500 to-orange-600';
      case 'MEDIUM': return 'from-amber-500 to-amber-600';
      case 'LOW': return 'from-emerald-500 to-emerald-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500/5 border-red-500/20';
      case 'HIGH': return 'bg-orange-500/5 border-orange-500/20';
      case 'MEDIUM': return 'bg-amber-500/5 border-amber-500/20';
      case 'LOW': return 'bg-emerald-500/5 border-emerald-500/20';
      default: return 'bg-slate-500/5 border-slate-500/20';
    }
  };

  const getRiskTextColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-amber-500';
      case 'LOW': return 'text-emerald-500';
      default: return 'text-slate-500';
    }
  };

  const fileName = result.targetFile.split('/').pop() || result.targetFile;

  return (
    <div className="space-y-6">
      {/* Risk Score Banner */}
      <div className={`border rounded-2xl p-6 ${getRiskBgColor(result.riskLevel)} shadow-sm relative overflow-hidden`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate max-w-md">
              {fileName}
            </h3>
            <p className="text-[11px] text-slate-450 font-mono select-all">
              {result.targetFile}
            </p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold border shrink-0 tracking-wider ${getRiskTextColor(result.riskLevel)} bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-800 w-fit`}>
            {result.riskLevel} IMPACT RISK
          </span>
        </div>

        {/* Impact Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-500">Propagation Impact Rating</span>
            <span className="text-slate-800 dark:text-white font-mono">{result.impactScore}/100</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200/10">
            <motion.div
              className={`h-full bg-gradient-to-r ${getRiskColor(result.riskLevel)} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${result.impactScore}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Core metrics grid */}
        <div className="grid grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-slate-200/40 dark:border-slate-800/40">
          <div className="text-center p-3 bg-white dark:bg-[#0d1117] rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white">{result.affectedFiles.total}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Affected Files</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-[#0d1117] rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white">{result.affectedFiles.depth}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Graph Depth</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-[#0d1117] rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white">{result.criticalImpacts.length}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Critical Faults</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white dark:bg-github-card border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('insights')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
             <Cpu className="w-5 h-5 text-purple-500" />
             <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Component Analysis</h3>
          </div>
          <motion.div animate={{ rotate: expandedSection === 'insights' ? 180 : 0 }}>
             <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </button>
        
        <AnimatePresence initial={false}>
          {expandedSection === 'insights' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="px-6 pb-6 border-t border-slate-200 dark:border-slate-850 pt-3">
                <MarkdownRenderer content={result.aiInsights} className="!prose-sm" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Coupling Metrics */}
      <div className="bg-white dark:bg-github-card border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('coupling')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
             <Link className="w-5 h-5 text-cyan-500" />
             <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Afferent & Efferent Coupling</h3>
          </div>
          <motion.div animate={{ rotate: expandedSection === 'coupling' ? 180 : 0 }}>
             <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </button>
        
        <AnimatePresence initial={false}>
          {expandedSection === 'coupling' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="px-6 pb-6 border-t border-slate-200 dark:border-slate-800 pt-5">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Afferent (Ca)</div>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{result.couplingMetrics.afferentCoupling}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-normal">Modules consuming this module.</div>
                  </div>
                  <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Efferent (Ce)</div>
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{result.couplingMetrics.efferentCoupling}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-normal">Imports utilized by this module.</div>
                  </div>
                  <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Instability Metric</div>
                    <div className="text-2xl font-black text-orange-600 dark:text-orange-400">{result.couplingMetrics.instability}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-normal">Ce / (Ca + Ce) indicator.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Affected Files */}
      <div className="bg-white dark:bg-github-card border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('affected')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
             <Layers className="w-5 h-5 text-indigo-500" />
             <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
               Direct & Indirect Impact Scope ({result.affectedFiles.total})
             </h3>
          </div>
          <motion.div animate={{ rotate: expandedSection === 'affected' ? 180 : 0 }}>
             <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </button>
        
        <AnimatePresence initial={false}>
          {expandedSection === 'affected' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="px-6 pb-6 border-t border-slate-200 dark:border-slate-850 pt-4 space-y-4">
                {result.affectedFiles.direct.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Direct Cascade Chain ({result.affectedFiles.direct.length})
                    </h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {result.affectedFiles.direct.map((file, idx) => (
                        <div key={idx} className="px-3.5 py-2 bg-red-500/5 border border-red-500/10 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300">
                          {file}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {result.affectedFiles.transitive.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Transitive Cascade Chain ({result.affectedFiles.transitive.length})
                    </h4>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                      {result.affectedFiles.transitive.slice(0, 15).map((file, idx) => (
                        <div key={idx} className="px-3.5 py-2 bg-orange-500/5 border border-orange-500/10 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300">
                          {file}
                        </div>
                      ))}
                      {result.affectedFiles.transitive.length > 15 && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 italic text-center py-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                          ... plus {result.affectedFiles.transitive.length - 15} additional downstream modules.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Critical Impacts */}
      {result.criticalImpacts.length > 0 && (
        <div className="bg-white dark:bg-github-card border border-red-500/20 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => toggleSection('critical')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors"
          >
            <div className="flex items-center gap-3">
               <AlertCircle className="w-5 h-5 text-red-500" />
               <h3 className="text-sm font-bold text-red-500">
                 Critical System Alerts ({result.criticalImpacts.length})
               </h3>
            </div>
            <motion.div animate={{ rotate: expandedSection === 'critical' ? 180 : 0 }}>
               <ChevronDown className="w-4 h-4 text-red-550" />
            </motion.div>
          </button>
          
          <AnimatePresence initial={false}>
            {expandedSection === 'critical' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="px-6 pb-6 border-t border-red-550/20 pt-4 space-y-3">
                  {result.criticalImpacts.map((impact, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border ${getRiskBgColor(impact.severity)}`}>
                      <div className="flex items-start gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border shrink-0 mt-0.5 ${getRiskTextColor(impact.severity)} bg-white dark:bg-[#0d1117] border-slate-200 dark:border-slate-800`}>
                          {impact.severity}
                        </span>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="font-mono text-xs font-bold text-slate-800 dark:text-white truncate">{impact.file}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{impact.reason}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Suggested Tests */}
      <div className="bg-white dark:bg-github-card border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('tests')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
             <TestTube className="w-5 h-5 text-emerald-500" />
             <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
               Recommended Safety Tests ({result.suggestedTests.length})
             </h3>
          </div>
          <motion.div animate={{ rotate: expandedSection === 'tests' ? 180 : 0 }}>
             <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </button>
        
        <AnimatePresence initial={false}>
          {expandedSection === 'tests' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="px-6 pb-6 border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="space-y-2">
                  {result.suggestedTests.map((test, idx) => (
                    <div key={idx} className="px-3.5 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{test}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Precautions */}
      <div className="bg-white dark:bg-github-card border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => toggleSection('precautions')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/10 transition-colors"
        >
          <div className="flex items-center gap-3">
             <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
             <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
               Recommended Deployment Precautions
             </h3>
          </div>
          <motion.div animate={{ rotate: expandedSection === 'precautions' ? 180 : 0 }}>
             <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </button>
        
        <AnimatePresence initial={false}>
          {expandedSection === 'precautions' && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="px-6 pb-6 border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="space-y-2.5">
                  {result.precautions.map((precaution, idx) => (
                    <div key={idx} className="px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 flex items-start gap-3 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shrink-0 mt-2"></span>
                      <span>{precaution}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
