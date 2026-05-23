import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mermaid from 'mermaid';
import * as Diff from 'diff';
import { marked } from 'marked';
import { Folder, File, ChevronRight as ChevronRightIcon, ChevronDown as ChevronDownIcon, Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Vulnerability } from '../types';

// --- ICONS ---
export const FolderIcon = () => (
  <Folder className="w-4 h-4 text-blue-500 shrink-0" />
);
export const FileIcon = ({ className = "text-gray-500" }: { className?: string }) => (
  <File className={`w-4 h-4 shrink-0 ${className}`} />
);
export const ChevronRight = () => (
  <ChevronRightIcon className="w-4 h-4 text-gray-400 shrink-0" />
);
export const ChevronDown = () => (
  <ChevronDownIcon className="w-4 h-4 text-gray-400 shrink-0" />
);
export const DownloadIcon = () => (
  <Download className="w-4 h-4 shrink-0" />
);
export const ShieldCheckIcon = () => (
  <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
);
export const AlertIcon = () => (
    <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
);

// --- MERMAID DIAGRAM ---
export const MermaidDiagram: React.FC<{ chart: string; theme?: string }> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'dark' | 'neutral'>('dark');

  useEffect(() => {
    const checkTheme = () => {
      if (document.documentElement.classList.contains('dark')) {
        setActiveTheme('dark');
      } else {
        setActiveTheme('neutral');
      }
    };

    checkTheme();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (mermaidRef.current && chart) {
      mermaidRef.current.innerHTML = '<div class="animate-pulse w-full h-[300px] bg-slate-100 dark:bg-slate-800/40 rounded-xl"></div>';

      mermaid.initialize({ 
        startOnLoad: false, 
        theme: activeTheme,
        securityLevel: 'loose',
        fontFamily: 'inherit',
        themeVariables: activeTheme === 'dark' ? {
          primaryColor: '#161b22',
          primaryTextColor: '#c9d1d9',
          primaryBorderColor: '#30363d',
          lineColor: '#06b6d4',
          secondaryColor: '#0d1117',
          tertiaryColor: '#161b22',
        } : {
          primaryColor: '#ffffff',
          primaryTextColor: '#24292f',
          primaryBorderColor: '#d0d7de',
          lineColor: '#2563eb',
          secondaryColor: '#f8fafc',
          tertiaryColor: '#ffffff',
        }
      });
      
      const render = async () => {
        try {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const validId = id.replace(/[^a-zA-Z0-9]/g, '');
          const { svg } = await mermaid.render(`mer-${validId}`, chart);
          if (mermaidRef.current) {
             mermaidRef.current.innerHTML = svg;
             const svgElem = mermaidRef.current.querySelector('svg');
             if (svgElem) {
                svgElem.removeAttribute('width');
                svgElem.removeAttribute('height');
                svgElem.style.maxWidth = '100%';
                svgElem.style.width = '100%'; 
             }
          }
        } catch (e) {
          console.error("Mermaid render failed", e);
          if (mermaidRef.current) {
            const safeChart = chart.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            mermaidRef.current.innerHTML = `
              <div class="flex flex-col items-center justify-center p-6 w-full border border-red-200/50 dark:border-red-900/30 rounded-xl bg-red-50/50 dark:bg-red-950/10">
                <p class="text-xs text-red-500 font-semibold mb-2">Rendering syntax error. Raw diagram syntax:</p>
                <pre class="text-[10px] text-slate-400 font-mono bg-slate-950 p-3 rounded-lg w-full overflow-auto whitespace-pre">${safeChart}</pre>
              </div>
            `;
          }
        }
      };
      
      setTimeout(render, 50);
    }
  }, [chart, activeTheme]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
        document.exitFullscreen();
    }
  };

  const handleDownload = () => {
    const svg = mermaidRef.current?.querySelector('svg');
    if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `code-architecture-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div ref={containerRef} className={`relative group border border-gray-200 dark:border-github-border/70 rounded-xl bg-gray-50 dark:bg-[#0d1117]/80 overflow-hidden transition-colors duration-300 ${isFullscreen ? 'flex items-center justify-center bg-white dark:bg-black w-screen h-screen' : 'w-full'}`}>
        {/* Controls Toolbar */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/90 backdrop-blur border border-gray-200 dark:border-slate-800 rounded-xl p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-40 shadow-xl">
            <button onClick={() => setScale(s => Math.max(0.2, s - 0.15))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-400" title="Zoom Out">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-11 text-center select-none">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(4, s + 0.15))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-400" title="Zoom In">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            
            <div className="w-px h-4 bg-gray-200 dark:bg-slate-800 mx-1"></div>

            <button onClick={() => setScale(1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-400" title="Reset Zoom">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button onClick={toggleFullscreen} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-400" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
               {isFullscreen ? 
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> :
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
               }
            </button>
            <button onClick={handleDownload} className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-400" title="Download SVG">
                <DownloadIcon />
            </button>
        </div>

        {/* Viewport wrapper */}
        <div className={`overflow-auto flex items-center justify-center ${isFullscreen ? 'w-full h-full' : 'w-full min-h-[350px]'}`}>
            <div 
               ref={mermaidRef}
               className="origin-center transition-all duration-100 ease-out p-6 flex justify-center w-full"
               style={{ 
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center'
               }}
            ></div>
        </div>
    </div>
  );
};

// --- MARKDOWN RENDERER ---
export const MarkdownRenderer: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const preElements = ref.current.querySelectorAll('pre');
      preElements.forEach((pre) => {
        if (pre.parentNode && !pre.parentNode.querySelector('.copy-btn')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'relative group';
          pre.parentNode.insertBefore(wrapper, pre);
          wrapper.appendChild(pre);

          const button = document.createElement('button');
          button.className = 'copy-btn absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 rounded-md text-xs text-slate-200 border border-slate-700/50 backdrop-blur-sm z-15';
          button.textContent = 'Copy';
          button.onclick = () => {
            const code = pre.querySelector('code')?.innerText || pre.innerText;
            navigator.clipboard.writeText(code);
            button.textContent = 'Copied!';
            setTimeout(() => { button.textContent = 'Copy'; }, 2000);
          };
          wrapper.appendChild(button);
        }
      });
    }
  }, [content]);

  return (
    <div 
      ref={ref}
      className={`markdown-content prose dark:prose-invert prose-sm max-w-none prose-headings:text-slate-900 dark:prose-headings:text-slate-100 prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3 prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-a:text-cyan-600 dark:prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-code:text-cyan-600 dark:prose-code:text-cyan-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-950 dark:prose-pre:bg-[#090d16] prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-800 prose-pre:p-4.5 prose-pre:rounded-xl prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-1 prose-ol:list-decimal prose-ol:pl-5 prose-blockquote:border-l-4 prose-blockquote:border-slate-300 dark:prose-blockquote:border-slate-750 prose-blockquote:pl-4 prose-blockquote:italic prose-table:border-collapse prose-table:w-full prose-th:text-left prose-th:p-2.5 prose-td:p-2.5 prose-tr:border-b prose-tr:border-slate-150 dark:prose-tr:border-slate-850 transition-colors duration-300 ${className}`}
      dangerouslySetInnerHTML={{ __html: marked.parse(content || '') as string }}
    />
  );
};

// --- DIFF VIEWER ---
export const DiffViewer: React.FC<{ original: string; modified: string }> = ({ original, modified }) => {
  const [diffParts, setDiffParts] = useState<Diff.Change[]>([]);

  useEffect(() => {
    const diff = Diff.diffLines(original, modified, { newlineIsToken: true });
    setDiffParts(diff);
  }, [original, modified]);

  if (original === modified) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <p className="text-sm italic">No code updates recommended for this file.</p>
      </div>
    );
  }

  return (
    <div className="font-mono text-xs sm:text-sm overflow-auto custom-scrollbar border border-slate-200 dark:border-slate-800/80 rounded-xl p-3 bg-slate-950/20">
      {diffParts.map((part, index) => {
        let bgClass = '';
        let textClass = 'text-slate-700 dark:text-slate-300';
        let prefix = '  ';
        
        if (part.added) {
          bgClass = 'bg-green-500/10 w-full block border-l-2 border-green-500';
          textClass = 'text-green-600 dark:text-green-400';
          prefix = '+ ';
        } else if (part.removed) {
          bgClass = 'bg-rose-500/10 w-full block border-l-2 border-rose-500';
          textClass = 'text-rose-600 dark:text-rose-450';
          prefix = '- ';
        }

        const lines = part.value.replace(/\n$/, '').split('\n');
        return (
          <React.Fragment key={index}>
             {lines.map((line, lineIdx) => (
                <div key={`${index}-${lineIdx}`} className={`${bgClass} px-3.5 py-0.5 whitespace-pre`}>
                  <span className={`select-none opacity-40 w-5 inline-block text-right mr-3 font-semibold ${textClass}`}>{prefix}</span>
                  <span className={textClass}>{line}</span>
                </div>
             ))}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// --- CODE BLOCK ---
export const CodeBlock: React.FC<{ code: string }> = ({ code }) => (
  <div className="relative group my-2">
     <div className="absolute right-2.5 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => navigator.clipboard.writeText(code)}
          className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white hover:bg-slate-750"
        >
          Copy Code
        </button>
     </div>
     <pre className="text-xs sm:text-sm bg-slate-950 p-4.5 rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-x-auto text-slate-350 font-mono whitespace-pre leading-relaxed shadow-inner">
       <code>{code}</code>
     </pre>
  </div>
);

// --- PROGRESS BAR ---
export const ProgressBar: React.FC<{ progress: number; color?: string }> = ({ progress, color = "bg-gradient-to-r from-cyan-500 to-blue-500" }) => (
  <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-3 overflow-hidden shadow-inner border border-slate-200/20">
    <motion.div 
      className={`h-full rounded-full ${color} relative overflow-hidden`} 
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
       {/* Shimmer effect */}
       <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] w-full h-full animate-[shimmer_1.8s_infinite]"></div>
    </motion.div>
  </div>
);

// --- LOADING STEP INDICATOR ---
export const LoadingStep: React.FC<{ label: string; status: 'pending' | 'current' | 'completed'; index: number }> = ({ label, status, index }) => {
  return (
    <motion.div 
      className={`flex items-center gap-3.5 py-2.5 border-b border-slate-100/50 dark:border-slate-900/30 last:border-b-0`}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
       <div className="shrink-0 w-6 h-6 flex items-center justify-center">
          {status === 'completed' && (
             <motion.div 
               className="w-5 h-5 bg-gradient-to-tr from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20"
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               type="spring"
             >
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" /></svg>
             </motion.div>
          )}
          {status === 'current' && (
             <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          {status === 'pending' && (
             <div className="w-2.5 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          )}
       </div>
       <span className={`text-sm font-semibold transition-colors duration-300 ${status === 'current' ? 'text-cyan-500 dark:text-cyan-400 scale-[1.02] origin-left' : 'text-slate-600 dark:text-slate-400'}`}>
         {label}
       </span>
    </motion.div>
  )
};

// --- CARDS & UI ---
export const Card: React.FC<{ title: string; children: React.ReactNode; className?: string; headerClassName?: string; id?: string }> = ({ title, children, className = '', headerClassName = 'bg-slate-50/50 dark:bg-slate-950/20', id }) => (
  <div id={id} className={`bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}>
    <div className={`px-6 py-4 border-b border-gray-200 dark:border-github-border/70 ${headerClassName}`}>
      <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-0 text-slate-700 dark:text-slate-300">
      {children}
    </div>
  </div>
);

export const ContentCard: React.FC<{ 
  title: string; 
  children: React.ReactNode; 
  className?: string; 
  collapsible?: boolean; 
  defaultExpanded?: boolean;
  headerClassName?: string;
  id?: string;
}> = ({ 
  title, 
  children, 
  className = '', 
  collapsible = false,
  defaultExpanded = true,
  headerClassName = 'bg-slate-50/50 dark:bg-slate-950/20',
  id
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div id={id} className={`bg-white dark:bg-github-card border border-gray-200 dark:border-github-border/70 rounded-2xl overflow-hidden transition-all duration-350 hover:shadow-lg dark:hover:shadow-cyan-500/[0.01] ${className}`}>
      <div 
        className={`px-6 py-4 border-b border-gray-200 dark:border-github-border/70 flex justify-between items-center ${headerClassName} ${collapsible ? 'cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-900/10 select-none' : ''}`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        {collapsible && (
          <motion.span 
            className="text-slate-400"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
          >
             <ChevronDownIcon className="w-4 h-4" />
          </motion.span>
        )}
      </div>
      
      <AnimatePresence initial={false}>
        {(!collapsible || isExpanded) && (
          <motion.div
            initial={collapsible ? { height: 0, opacity: 0 } : false}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-6 text-slate-700 dark:text-slate-350">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Badge: React.FC<{ text: string; color?: string }> = ({ text, color = "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40" }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border mr-2 mb-2 transition-all hover:scale-105 duration-200 ${color}`}>
    {text}
  </span>
);

export const SecurityItem: React.FC<{ vuln: Vulnerability }> = ({ vuln }) => {
  const colorMap = {
    'High': 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10',
    'Medium': 'text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/10',
    'Low': 'text-yellow-750 dark:text-yellow-450 border-yellow-200 dark:border-yellow-900/40 bg-yellow-50/50 dark:bg-yellow-950/10',
  };
  
  const badgeClass = colorMap[vuln.severity] || colorMap['Low'];

  return (
    <motion.div 
      className={`mb-3.5 last:mb-0 border border-gray-200 dark:border-github-border rounded-xl p-3.5 bg-gray-50/50 dark:bg-github-dark/25 hover:scale-[1.01] transition-transform`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-1.5">
         <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{vuln.title}</span>
         <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${badgeClass}`}>
            {vuln.severity.toUpperCase()}
         </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{vuln.description}</p>
    </motion.div>
  );
};
