import React, { useState } from 'react';
import { BlastRadiusResult, RepoInfo } from '../types';
import { marked } from 'marked';

interface ImpactReportProps {
  result: BlastRadiusResult;
  repoInfo: RepoInfo;
}

export const ImpactReport: React.FC<ImpactReportProps> = ({ result, repoInfo }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'from-red-500 to-red-600';
      case 'HIGH':
        return 'from-orange-500 to-orange-600';
      case 'MEDIUM':
        return 'from-yellow-500 to-yellow-600';
      case 'LOW':
        return 'from-green-500 to-green-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-500/50';
      case 'HIGH':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-500/50';
      case 'MEDIUM':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-500/50';
      case 'LOW':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-500/50';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-500/50';
    }
  };

  const getRiskTextColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-red-700 dark:text-red-400';
      case 'HIGH':
        return 'text-orange-700 dark:text-orange-400';
      case 'MEDIUM':
        return 'text-yellow-700 dark:text-yellow-400';
      case 'LOW':
        return 'text-green-700 dark:text-green-400';
      default:
        return 'text-gray-700 dark:text-gray-400';
    }
  };

  const fileName = result.targetFile.split('/').pop() || result.targetFile;

  return (
    <div className="space-y-6">
      {/* Risk Score Card */}
      <div className={`border rounded-xl p-6 ${getRiskBgColor(result.riskLevel)}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {fileName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
              {result.targetFile}
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-block px-4 py-2 rounded-full font-bold text-lg ${getRiskTextColor(result.riskLevel)} bg-white dark:bg-gray-800 border-2 ${result.riskLevel === 'CRITICAL' ? 'border-red-500 animate-pulse' : ''}`}>
              {result.riskLevel}
            </div>
          </div>
        </div>

        {/* Impact Score Gauge */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Impact Score</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{result.impactScore}/100</span>
          </div>
          <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getRiskColor(result.riskLevel)} transition-all duration-1000 ease-out`}
              style={{ width: `${result.impactScore}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.affectedFiles.total}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Affected Files</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.affectedFiles.depth}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Propagation Depth</div>
          </div>
          <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.criticalImpacts.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Critical Impacts</div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('insights')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">AI Insights</h3>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === 'insights' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSection === 'insights' && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-github-border">
            <div 
              className="prose dark:prose-invert max-w-none mt-4"
              dangerouslySetInnerHTML={{ __html: marked(result.aiInsights) }}
            />
          </div>
        )}
      </div>

      {/* Coupling Metrics */}
      <div className="bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('coupling')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Coupling Metrics</h3>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === 'coupling' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSection === 'coupling' && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-github-border">
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Afferent Coupling (Ca)</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{result.couplingMetrics.afferentCoupling}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Files that depend on this</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Efferent Coupling (Ce)</div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{result.couplingMetrics.efferentCoupling}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Files this depends on</div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Instability</div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{result.couplingMetrics.instability}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ce / (Ca + Ce)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Affected Files */}
      <div className="bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('affected')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📁</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Affected Files ({result.affectedFiles.total})
            </h3>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === 'affected' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSection === 'affected' && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-github-border">
            <div className="mt-4 space-y-4">
              {result.affectedFiles.direct.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Direct Dependents ({result.affectedFiles.direct.length})
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {result.affectedFiles.direct.map((file, idx) => (
                      <div key={idx} className="px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.affectedFiles.transitive.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Transitive Dependencies ({result.affectedFiles.transitive.length})
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {result.affectedFiles.transitive.slice(0, 20).map((file, idx) => (
                      <div key={idx} className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded text-sm font-mono text-gray-700 dark:text-gray-300">
                        {file}
                      </div>
                    ))}
                    {result.affectedFiles.transitive.length > 20 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                        ... and {result.affectedFiles.transitive.length - 20} more files
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Critical Impacts */}
      {result.criticalImpacts.length > 0 && (
        <div className="bg-white dark:bg-github-card border border-red-200 dark:border-red-500/50 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('critical')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                Critical Impacts ({result.criticalImpacts.length})
              </h3>
            </div>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === 'critical' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expandedSection === 'critical' && (
            <div className="px-6 pb-6 border-t border-gray-200 dark:border-github-border">
              <div className="mt-4 space-y-3">
                {result.criticalImpacts.map((impact, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${getRiskBgColor(impact.severity)}`}>
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${getRiskTextColor(impact.severity)}`}>
                        {impact.severity}
                      </span>
                      <div className="flex-1">
                        <div className="font-mono text-sm text-gray-900 dark:text-white mb-1">{impact.file}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{impact.reason}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggested Tests */}
      <div className="bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('tests')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧪</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Suggested Tests ({result.suggestedTests.length})
            </h3>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === 'tests' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSection === 'tests' && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-github-border">
            <div className="mt-4 space-y-2">
              {result.suggestedTests.map((test, idx) => (
                <div key={idx} className="px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded text-sm font-mono text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {test}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Precautions */}
      <div className="bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl overflow-hidden">
        <button
          onClick={() => toggleSection('precautions')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Recommended Precautions
            </h3>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${expandedSection === 'precautions' ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSection === 'precautions' && (
          <div className="px-6 pb-6 border-t border-gray-200 dark:border-github-border">
            <div className="mt-4 space-y-2">
              {result.precautions.map((precaution, idx) => (
                <div key={idx} className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{precaution}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

