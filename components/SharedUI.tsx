import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import * as Diff from 'diff';
import { marked } from 'marked';
import { Vulnerability } from '../types';

// --- ICONS ---
export const FolderIcon = () => (
  <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
);
export const FileIcon = ({ className = "text-gray-500" }: { className?: string }) => (
  <svg className={`w-4 h-4 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
);
export const ChevronRight = () => (
  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
);
export const ChevronDown = () => (
  <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
);
export const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
);
export const ShieldCheckIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
);
export const AlertIcon = () => (
    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
);

// --- MERMAID DIAGRAM ---
export const MermaidDiagram: React.FC<{ chart: string; theme?: string }> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<'dark' | 'neutral'>('dark');

  // Detect system theme and listen for changes
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

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Mermaid Render
  useEffect(() => {
    if (mermaidRef.current && chart) {
      // Clear previous content immediately to prevent flickering of old graph
      mermaidRef.current.innerHTML = '<div class="animate-pulse w-full h-full bg-gray-100 dark:bg-gray-800/30 rounded"></div>';

      mermaid.initialize({ 
        startOnLoad: false, 
        theme: activeTheme,
        securityLevel: 'loose',
        fontFamily: 'inherit',
        themeVariables: activeTheme === 'dark' ? {
          primaryColor: '#161b22',
          primaryTextColor: '#c9d1d9',
          primaryBorderColor: '#30363d',
          lineColor: '#58a6ff',
          secondaryColor: '#0d1117',
          tertiaryColor: '#161b22',
        } : {
          primaryColor: '#ffffff',
          primaryTextColor: '#24292f',
          primaryBorderColor: '#d0d7de',
          lineColor: '#0969da',
          secondaryColor: '#f6f8fa',
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
              <div class="flex flex-col items-center justify-center p-4 w-full border border-gray-200 dark:border-gray-800 rounded bg-gray-50 dark:bg-[#0d1117] transition-colors duration-300">
                <p class="text-xs text-gray-500 mb-2 italic">Visual diagram unavailable (syntax error). Raw source:</p>
                <pre class="text-[10px] text-gray-400 font-mono bg-black/5 dark:bg-black/20 p-2 rounded w-full overflow-auto whitespace-pre">${safeChart}</pre>
              </div>
            `;
          }
        }
      };
      
      // Small delay to let the DOM settle if switching themes rapidly
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
        link.download = `diagram-${Date.now()}.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <div ref={containerRef} className={`relative group border border-gray-200 dark:border-github-border rounded-lg bg-gray-50 dark:bg-[#0d1117] overflow-hidden transition-colors duration-300 ${isFullscreen ? 'flex items-center justify-center bg-white dark:bg-black' : ''}`}>
        {/* Controls Toolbar */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 shadow-xl">
            <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" title="Zoom Out">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
            </button>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-12 text-center select-none">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(5, s + 0.1))} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" title="Zoom In">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1"></div>

            <button onClick={() => setScale(1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" title="Reset Zoom">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
            <button onClick={toggleFullscreen} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" title={isFullscreen ? "Exit Full Screen" : "Full Screen"}>
               {isFullscreen ? 
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> :
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
               }
            </button>
            <button onClick={handleDownload} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors" title="Download SVG">
                <DownloadIcon />
            </button>
        </div>

        {/* Viewport */}
        <div className={`overflow-auto custom-scrollbar flex items-center justify-center ${isFullscreen ? 'w-full h-full' : 'w-full min-h-[300px]'}`}>
            <div 
               ref={mermaidRef}
               className="origin-center transition-all duration-200 ease-out p-8 flex justify-center"
               style={{ 
                  width: `${scale * 100}%`,
                  minWidth: '100%' 
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
      // Add copy buttons to code blocks
      const preElements = ref.current.querySelectorAll('pre');
      preElements.forEach((pre) => {
        if (pre.parentNode && !pre.parentNode.querySelector('.copy-btn')) {
          const wrapper = document.createElement('div');
          wrapper.className = 'relative group';
          pre.parentNode.insertBefore(wrapper, pre);
          wrapper.appendChild(pre);

          const button = document.createElement('button');
          button.className = 'copy-btn absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-gray-700/80 rounded text-xs text-white hover:bg-gray-600 backdrop-blur-sm z-10';
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
      className={`prose dark:prose-invert prose-sm max-w-none 
        prose-headings:text-gray-900 dark:prose-headings:text-gray-200 prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
        prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
        prose-a:text-blue-600 dark:prose-a:text-github-accent prose-a:no-underline hover:prose-a:underline
        prose-code:text-gray-800 dark:prose-code:text-gray-200 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-gray-900 dark:prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-gray-700 dark:prose-pre:border-github-border prose-pre:p-4 prose-pre:rounded-md
        prose-ul:list-disc prose-ul:pl-5 prose-ul:space-y-1
        prose-ol:list-decimal prose-ol:pl-5
        prose-blockquote:border-l-4 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic
        prose-table:border-collapse prose-table:w-full prose-th:text-left prose-th:p-2 prose-td:p-2 prose-tr:border-b prose-tr:border-gray-200 dark:prose-tr:border-gray-800
        transition-colors duration-300
        ${className}`}
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
      <div className="flex flex-col items-center justify-center h-full text-gray-500 py-10 transition-colors duration-300">
        <p className="text-sm">No changes detected from original.</p>
      </div>
    );
  }

  return (
    <div className="font-mono text-xs sm:text-sm overflow-auto custom-scrollbar transition-colors duration-300">
      {diffParts.map((part, index) => {
        let bgClass = '';
        let textClass = 'text-gray-700 dark:text-gray-300';
        let prefix = '  ';
        
        if (part.added) {
          bgClass = 'bg-green-100 dark:bg-green-900/30 w-full block';
          textClass = 'text-green-800 dark:text-green-200';
          prefix = '+ ';
        } else if (part.removed) {
          bgClass = 'bg-red-100 dark:bg-red-900/30 w-full block';
          textClass = 'text-red-800 dark:text-red-200';
          prefix = '- ';
        }

        const lines = part.value.replace(/\n$/, '').split('\n');
        return (
          <React.Fragment key={index}>
             {lines.map((line, lineIdx) => (
                <div key={`${index}-${lineIdx}`} className={`${bgClass} px-2 whitespace-pre-wrap transition-colors duration-300`}>
                  <span className={`select-none opacity-50 w-6 inline-block text-right mr-2 ${textClass}`}>{prefix}</span>
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
     <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => navigator.clipboard.writeText(code)}
          className="px-2 py-1 bg-gray-700/80 rounded text-xs text-white hover:bg-gray-600 backdrop-blur-sm"
        >
          Copy
        </button>
     </div>
     <pre className="text-xs sm:text-sm bg-gray-900 dark:bg-[#050505] p-4 rounded-md border border-gray-700 dark:border-gray-800/50 overflow-x-auto text-gray-300 font-mono whitespace-pre leading-relaxed shadow-inner transition-colors duration-300">
       <code>{code}</code>
     </pre>
  </div>
);

// --- PROGRESS BAR ---
export const ProgressBar: React.FC<{ progress: number; color?: string }> = ({ progress, color = "bg-blue-500 dark:bg-github-accent" }) => (
  <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden transition-colors duration-300 shadow-inner">
    <div 
      className={`h-2.5 rounded-full ${color} transition-all duration-500 ease-out relative overflow-hidden`} 
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    >
       {/* Shimmer effect */}
       <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite] -translate-x-full"></div>
    </div>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes shimmer {
        100% { transform: translateX(100%); }
      }
    `}} />
  </div>
);

// --- LOADING STEP INDICATOR ---
export const LoadingStep: React.FC<{ label: string; status: 'pending' | 'current' | 'completed'; index: number }> = ({ label, status, index }) => {
  return (
    <div className={`flex items-center gap-3 py-2 transition-all duration-500 ${status === 'pending' ? 'opacity-40 translate-x-2' : 'opacity-100 translate-x-0'}`} style={{ transitionDelay: `${index * 50}ms` }}>
       <div className="shrink-0 w-6 h-6 flex items-center justify-center transition-all duration-300">
          {status === 'completed' && (
             <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-fade-in shadow-md shadow-green-500/20">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
             </div>
          )}
          {status === 'current' && (
             <div className="w-5 h-5 border-2 border-blue-500 dark:border-github-accent border-t-transparent rounded-full animate-spin"></div>
          )}
          {status === 'pending' && (
             <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          )}
       </div>
       <span className={`text-sm font-medium transition-colors duration-300 ${status === 'current' ? 'text-gray-900 dark:text-white scale-105 origin-left' : 'text-gray-600 dark:text-gray-400'}`}>
         {label}
       </span>
    </div>
  )
};


// --- CARDS & UI ---
export const Card: React.FC<{ title: string; children: React.ReactNode; className?: string; headerClassName?: string; id?: string }> = ({ title, children, className = '', headerClassName = 'bg-gray-5 dark:bg-gray-900/50', id }) => (
  <div id={id} className={`bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-lg overflow-hidden transition-colors duration-300 ${className}`}>
    <div className={`px-6 py-4 border-b border-gray-200 dark:border-github-border transition-colors duration-300 ${headerClassName}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">{title}</h3>
    </div>
    <div className="p-0 text-gray-700 dark:text-gray-300 transition-colors duration-300">
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
  headerClassName = 'bg-gray-5 dark:bg-gray-900/50',
  id
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div id={id} className={`bg-white dark:bg-github-card border border-gray-200 dark:border-github-border rounded-lg overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300 ${className}`}>
      <div 
        className={`px-6 py-4 border-b border-gray-200 dark:border-github-border transition-colors duration-300 ${headerClassName} flex justify-between items-center ${collapsible ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 select-none' : ''}`}
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300">{title}</h3>
        {collapsible && (
          <span className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
             <ChevronDown />
          </span>
        )}
      </div>
      {(!collapsible || isExpanded) && (
        <div className="p-6 text-gray-700 dark:text-gray-300 animate-fade-in transition-colors duration-300">
          {children}
        </div>
      )}
    </div>
  );
};

export const Badge: React.FC<{ text: string; color?: string }> = ({ text, color = "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800" }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border mr-2 mb-2 transition-colors duration-300 ${color}`}>
    {text}
  </span>
);

export const SecurityItem: React.FC<{ vuln: Vulnerability }> = ({ vuln }) => {
  const colorMap = {
    'High': 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20',
    'Medium': 'text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20',
    'Low': 'text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20',
  };
  
  const badgeClass = colorMap[vuln.severity] || colorMap['Low'];

  return (
    <div className="mb-3 last:mb-0 border border-gray-200 dark:border-github-border rounded p-3 bg-gray-50 dark:bg-github-dark/50 transition-colors duration-300">
      <div className="flex items-center justify-between mb-1">
         <span className="font-medium text-gray-800 dark:text-gray-200 text-sm transition-colors duration-300">{vuln.title}</span>
         <span className={`text-xs px-2 py-0.5 rounded border transition-colors duration-300 ${badgeClass}`}>
            {vuln.severity.toUpperCase()}
         </span>
      </div>
      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">{vuln.description}</p>
    </div>
  );
};

// Made with Bob
