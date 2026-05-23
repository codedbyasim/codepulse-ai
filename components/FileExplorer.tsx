import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RepoInfo, FileContent, FileAnalysisResult } from '../types';
import { Card, DiffViewer, MarkdownRenderer } from './SharedUI';
import { analyzeSingleFile } from '../services/gemini';
import { Search, File, Folder, ChevronRight, ChevronDown, CheckCircle, Edit3, Eye, FileText, AlertCircle, ArrowUpRight, Cpu } from 'lucide-react';

interface FileExplorerProps {
  repoInfo: RepoInfo;
  structure: string[];
  files: FileContent[];
  title?: string;
  themeColor?: string;
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: TreeNode[];
}

// Smart File Icon mapping using lucide icons and standard types
const SmartFileIcon = ({ filename, className = "w-4 h-4" }: { filename: string; className?: string }) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  let color = 'text-gray-500 dark:text-gray-400';
  let bgColor = 'bg-gray-100 dark:bg-gray-800/40';

  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'cjs':
    case 'mjs':
      if (['ts','tsx'].includes(ext!)) {
         color = 'text-blue-500 dark:text-blue-400';
         bgColor = 'bg-blue-500/10';
      } else {
         color = 'text-amber-500 dark:text-amber-400';
         bgColor = 'bg-amber-500/10';
      }
      break;

    case 'py':
      color = 'text-indigo-500 dark:text-indigo-400';
      bgColor = 'bg-indigo-500/10';
      break;
    
    case 'go':
      color = 'text-cyan-500 dark:text-cyan-400';
      bgColor = 'bg-cyan-500/10';
      break;
    
    case 'java':
      color = 'text-red-500 dark:text-red-400';
      bgColor = 'bg-red-500/10';
      break;

    case 'rs':
      color = 'text-orange-550 dark:text-orange-450';
      bgColor = 'bg-orange-500/10';
      break;
      
    case 'json':
    case 'yml':
    case 'yaml':
    case 'toml':
    case 'env':
    case 'ini':
      color = 'text-emerald-500 dark:text-emerald-400';
      bgColor = 'bg-emerald-500/10';
      break;
      
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      color = 'text-pink-500 dark:text-pink-400';
      bgColor = 'bg-pink-500/10';
      break;
      
    case 'html':
    case 'htm':
    case 'xml':
      color = 'text-orange-500';
      bgColor = 'bg-orange-500/10';
      break;

    case 'md':
    case 'txt':
    case 'gitignore':
      color = 'text-slate-500 dark:text-slate-400';
      bgColor = 'bg-slate-500/10';
      break;
      
    case 'lock':
      color = 'text-slate-600 dark:text-slate-500';
      bgColor = 'bg-slate-600/10';
      break;
  }

  return (
    <div className={`flex items-center justify-center p-1.5 rounded-lg ${bgColor} shrink-0`}>
       <File className={`${className} ${color}`} />
    </div>
  );
};

const FolderIconClosed = () => (
   <div className="flex items-center justify-center p-1.5 rounded-lg bg-blue-500/10 shrink-0">
      <Folder className="w-4 h-4 text-blue-500" />
   </div>
);

const FolderIconOpen = () => (
   <div className="flex items-center justify-center p-1.5 rounded-lg bg-blue-500/15 shrink-0">
      <Folder className="w-4 h-4 text-blue-400" />
   </div>
);

const buildTree = (paths: string[]): TreeNode[] => {
  const root: TreeNode[] = [];
  for (const path of paths) {
    const parts = path.split('/');
    let currentLevel = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      let node = currentLevel.find(n => n.name === part);
      if (!node) {
        node = {
          name: part,
          path: isFile ? path : parts.slice(0, i + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: []
        };
        currentLevel.push(node);
      } else {
        if (!isFile) {
          node.type = 'folder';
        }
      }
      if (!isFile) {
        currentLevel = node.children;
      }
    }
  }
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(root);
  return root;
};

const findNodeByPath = (nodes: TreeNode[], path: string): TreeNode | null => {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.type === 'folder' && path.startsWith(node.path + '/')) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

const FileTreeItem: React.FC<{
  node: TreeNode;
  level: number;
  selectedFile: string | null;
  onSelect: (path: string) => void;
  filesWithContent: Set<string>;
  modifiedFiles: Set<string>;
  highlightColor?: string;
}> = ({ node, level, selectedFile, onSelect, filesWithContent, modifiedFiles, highlightColor = "bg-cyan-500/5 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedFile === node.path;
  const hasContent = node.type === 'file' && filesWithContent.has(node.path);
  const isModified = node.type === 'file' && modifiedFiles.has(node.path);

  useEffect(() => {
    if (selectedFile?.startsWith(node.path + '/')) {
      setIsOpen(true);
    }
  }, [selectedFile, node.path]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
      onSelect(node.path);
    } else {
      onSelect(node.path);
    }
  };

  return (
    <div>
      <div 
        onClick={handleClick}
        className={`
          flex items-center gap-2 py-2 pr-2.5 cursor-pointer select-none transition-all duration-200 text-sm border-l-2
          ${isSelected 
            ? `${highlightColor} font-bold` 
            : 'text-slate-650 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-900 dark:hover:text-slate-200'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 10}px` }}
      >
        <span className="shrink-0 flex items-center justify-center w-4 h-4 opacity-60">
          {node.type === 'folder' ? (
            isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <span className="w-3.5" />
          )}
        </span>

        <span className="shrink-0">
          {node.type === 'folder' ? (
            isOpen ? <FolderIconOpen /> : <FolderIconClosed />
          ) : (
            <SmartFileIcon filename={node.name} />
          )}
        </span>

        <span className="truncate flex-1">
          {node.name}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {isModified && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Modified"></span>
            )}
            {hasContent && (
               <CheckCircle className="w-3.5 h-3.5 text-emerald-500" title="AI Scanning Complete" />
            )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {node.type === 'folder' && isOpen && (
          <motion.div 
            className="border-l border-slate-200 dark:border-slate-800 ml-5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children.map(child => (
              <FileTreeItem 
                key={child.path} 
                node={child} 
                level={level + 1} 
                selectedFile={selectedFile} 
                onSelect={onSelect}
                filesWithContent={filesWithContent}
                modifiedFiles={modifiedFiles}
                highlightColor={highlightColor}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ repoInfo, structure, files, title = "Repository Explorer", themeColor }) => {
  const [selectedFile, setSelectedFile] = useState<string | null>(structure.length > 0 ? structure[0] : null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'view' | 'edit' | 'diff' | 'analysis'>('view');
  const [fileEdits, setFileEdits] = useState<Record<string, string>>({});
  
  const [analysisCache, setAnalysisCache] = useState<Record<string, FileAnalysisResult>>({});
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);

  const filesWithContent = useMemo(() => new Set(files.map(f => f.path)), [files]);
  const treeRoot = useMemo(() => buildTree(structure), [structure]);
  
  const modifiedFiles = useMemo(() => {
    return new Set(Object.keys(fileEdits).filter(path => {
      const original = files.find(f => f.path === path)?.content;
      return original !== undefined && fileEdits[path] !== original;
    }));
  }, [fileEdits, files]);

  const selectedNode = useMemo(() => 
    selectedFile ? findNodeByPath(treeRoot, selectedFile) : null
  , [selectedFile, treeRoot]);
  
  const filteredStructure = structure.filter(path => 
    path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const originalContent = files.find(f => f.path === selectedFile)?.content;
  const currentContent = selectedFile ? (fileEdits[selectedFile] ?? originalContent) : undefined;
  const isModified = selectedFile && modifiedFiles.has(selectedFile);
  const isSelectedFileAvailable = selectedFile ? filesWithContent.has(selectedFile) : false;

  useEffect(() => {
    setViewMode('view');
  }, [selectedFile]);

  const handleContentChange = (newContent: string) => {
    if (selectedFile) {
      setFileEdits(prev => ({
        ...prev,
        [selectedFile]: newContent
      }));
    }
  };

  const handleAnalyzeFile = async () => {
    if (!selectedFile || !currentContent) return;
    
    if (analysisCache[selectedFile]) {
      setViewMode('analysis');
      return;
    }

    setIsAnalyzingFile(true);
    setViewMode('analysis');
    
    try {
      const result = await analyzeSingleFile(selectedFile, currentContent);
      setAnalysisCache(prev => ({
        ...prev,
        [selectedFile]: result
      }));
    } catch (e) {
      console.error("File analysis failed", e);
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const highlightClass = themeColor ? themeColor : "bg-cyan-500/5 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500";
  const buttonActive = "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-sm font-semibold border-b border-slate-350 dark:border-slate-500";

  return (
    <Card title={title} className="shadow-lg border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex flex-col lg:flex-row h-[650px] transition-colors duration-300">
        
        {/* Left Explorer Sidebar */}
        <div className="w-full lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-850 bg-slate-50/50 dark:bg-[#0d1117]/60">
            
            {/* Search inputs */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-850 sticky top-0 z-10">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search repository files..." 
                  className="w-full bg-white dark:bg-github-card border border-slate-250 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Tree Scrolling Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {searchTerm ? (
                // Flat Search Grid
                filteredStructure.length > 0 ? (
                  <div className="py-1">
                    {filteredStructure.map(path => {
                      const hasContent = filesWithContent.has(path);
                      const isMod = modifiedFiles.has(path);
                      const filename = path.split('/').pop() || path;
                      return (
                        <div 
                          key={path} 
                          onClick={() => setSelectedFile(path)}
                          className={`flex items-center gap-2.5 px-4.5 py-2 text-xs cursor-pointer border-l-2 ${selectedFile === path ? `${highlightClass} font-bold` : 'text-slate-650 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                        >
                            <SmartFileIcon filename={filename} />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="truncate text-slate-800 dark:text-slate-250 font-semibold">{filename}</span>
                              <span className="text-[10px] text-slate-400 truncate mt-0.5">{path}</span>
                            </div>
                            <div className="shrink-0 flex items-center gap-1.5">
                                {isMod && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                                {hasContent && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                            </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs italic">No matching files found.</div>
                )
              ) : (
                // Tree Explorer
                treeRoot.length > 0 ? (
                    <div className="py-1.5">
                      {treeRoot.map(node => (
                        <FileTreeItem 
                          key={node.path}
                          node={node}
                          level={0}
                          selectedFile={selectedFile}
                          onSelect={setSelectedFile}
                          filesWithContent={filesWithContent}
                          modifiedFiles={modifiedFiles}
                          highlightColor={highlightClass}
                        />
                      ))}
                    </div>
                ) : (
                    <div className="p-8 text-center text-slate-400 text-xs italic">Empty tree.</div>
                )
              )}
            </div>
            
            {/* Sidebar Stats footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-850 bg-white dark:bg-github-card text-[10px] text-slate-400 font-mono flex justify-between px-4">
               <span>{structure.length} items</span>
               <span>{files.length} loaded & analyzed</span>
            </div>
        </div>

        {/* Right Code Display Pane */}
        <div className="w-full lg:w-2/3 flex flex-col bg-white dark:bg-[#0d1117]">
            
            {/* Header toolbar */}
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-github-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 min-h-[54px]">
              <div className="flex items-center gap-2.5 overflow-hidden w-full sm:w-auto">
                {selectedNode?.type === 'folder' ? (
                   <FolderIconOpen /> 
                ) : (
                   <SmartFileIcon filename={selectedFile || ''} className="w-4 h-4" />
                )}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">
                  {selectedFile || 'Select a file'}
                </span>
                
                {/* Badges */}
                <div className="flex gap-1.5 shrink-0 ml-1">
                  {isSelectedFileAvailable && (
                      <span className="flex items-center gap-1 text-[9px] font-extrabold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                         ANALYZED
                      </span>
                  )}
                  {isModified && (
                    <span className="text-[9px] font-extrabold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                      MODIFIED
                    </span>
                  )}
                </div>
              </div>

              {isSelectedFileAvailable && selectedNode?.type !== 'folder' && (
                <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800 items-center shrink-0">
                  <button onClick={() => setViewMode('view')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${viewMode === 'view' ? buttonActive : 'text-slate-400 hover:text-slate-200'}`}>
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button onClick={() => setViewMode('edit')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${viewMode === 'edit' ? buttonActive : 'text-slate-400 hover:text-slate-200'}`}>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button onClick={() => setViewMode('diff')} disabled={!isModified} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${viewMode === 'diff' ? buttonActive : 'text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed'}`}>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Diff</span>
                  </button>
                  
                  <div className="w-px h-4 bg-slate-350 dark:bg-slate-700 mx-1.5"></div>
                  
                  <motion.button 
                    onClick={handleAnalyzeFile} 
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'analysis' ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md' : 'text-purple-500 hover:bg-purple-500/5'}`}
                    title="Analyze this file with AI"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                     <Cpu className="w-3.5 h-3.5" />
                     <span>AI Audit</span>
                  </motion.button>
                </div>
              )}
            </div>
            
            {/* Main Content Area */}
            <div className="flex-1 overflow-auto p-0 custom-scrollbar relative bg-white dark:bg-[#0d1117]">
              {selectedFile ? (
                selectedNode?.type === 'folder' ? (
                    // Folder Contents Grid View
                    <div className="p-6">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-1.5">
                           <Folder className="w-4 h-4 text-blue-500" />
                           <span>Subdirectory Assets</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                           {selectedNode.children.map(child => (
                              <motion.div 
                                 key={child.path}
                                 onClick={() => setSelectedFile(child.path)}
                                 className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-650 cursor-pointer transition-all duration-200 group"
                                 whileHover={{ y: -1 }}
                              >
                                 <div className="shrink-0">
                                    {child.type === 'folder' ? <FolderIconClosed /> : <SmartFileIcon filename={child.name} />}
                                 </div>
                                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-slate-900 dark:group-hover:text-white">{child.name}</span>
                              </motion.div>
                           ))}
                        </div>
                        {selectedNode.children.length === 0 && (
                            <div className="text-slate-400 text-xs italic py-8 text-center">Empty directory.</div>
                        )}
                    </div>
                ) : (
                  // File Contents View
                  isSelectedFileAvailable ? (
                    <>
                      {viewMode === 'view' && (
                          <pre className="p-5 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-300 whitespace-pre leading-relaxed">
                            <code>{currentContent}</code>
                          </pre>
                      )}
                      {viewMode === 'edit' && (
                        <textarea
                          className="w-full h-full bg-white dark:bg-[#0d1117] text-slate-800 dark:text-slate-300 p-5 font-mono text-xs sm:text-sm resize-none focus:outline-none leading-relaxed"
                          value={currentContent}
                          onChange={(e) => handleContentChange(e.target.value)}
                          spellCheck={false}
                        />
                      )}
                      {viewMode === 'diff' && originalContent && (
                        <div className="h-full bg-white dark:bg-[#0d1117]">
                            <DiffViewer original={originalContent} modified={currentContent || ''} />
                        </div>
                      )}
                      {viewMode === 'analysis' && (
                        <div className="h-full bg-white dark:bg-[#0d1117] p-6">
                           {isAnalyzingFile ? (
                              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                 <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                 <p className="animate-pulse font-semibold">Running Code Analysis Audit...</p>
                              </div>
                           ) : analysisCache[selectedFile!] ? (
                              <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
                                 <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
                                    <div>
                                       <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">AI Audit Result</h2>
                                       <p className="text-xs text-slate-450 font-mono">{selectedFile}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                       analysisCache[selectedFile!].complexity === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                       analysisCache[selectedFile!].complexity === 'Medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                       'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    }`}>
                                       {analysisCache[selectedFile!].complexity} Complexity
                                    </span>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50/50 dark:bg-[#161b22]/40 p-4.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                       <h3 className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3">Module Summary</h3>
                                       <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-350 leading-relaxed font-normal">{analysisCache[selectedFile!].summary}</p>
                                    </div>
                                    
                                    <div className="bg-slate-50/50 dark:bg-[#161b22]/40 p-4.5 rounded-xl border border-slate-200 dark:border-slate-800">
                                       <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-3">Intended Integration & Role</h3>
                                       <p className="text-xs sm:text-sm text-slate-650 dark:text-slate-350 leading-relaxed font-normal">{analysisCache[selectedFile!].potentialUsage}</p>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                       <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Module Dependencies</h3>
                                       {analysisCache[selectedFile!].dependencies.length > 0 ? (
                                          <ul className="space-y-1.5">
                                             {analysisCache[selectedFile!].dependencies.map((dep, i) => (
                                                <li key={i} className="text-xs text-slate-600 dark:text-slate-450 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 font-mono truncate">
                                                   {dep}
                                                 </li>
                                             ))}
                                          </ul>
                                       ) : (
                                          <p className="text-xs text-slate-450 italic">No dependencies found.</p>
                                       )}
                                    </div>

                                    <div>
                                       <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Exposed API Functions</h3>
                                       {analysisCache[selectedFile!].keyExports.length > 0 ? (
                                          <ul className="space-y-1.5">
                                             {analysisCache[selectedFile!].keyExports.map((exp, i) => (
                                                <li key={i} className="text-xs text-slate-600 dark:text-slate-450 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 font-mono truncate">
                                                   {exp}
                                                 </li>
                                             ))}
                                          </ul>
                                       ) : (
                                          <p className="text-xs text-slate-455 italic">No exports found.</p>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-4">
                                 <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                                 <p className="text-sm font-semibold">Code analysis audit failed.</p>
                              </div>
                           )}
                        </div>
                      )}
                    </>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 text-center">
                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-900/60 flex items-center justify-center mb-4 border border-slate-200 dark:border-slate-800">
                           <SmartFileIcon filename={selectedFile} className="w-6 h-6 opacity-60" />
                        </div>
                        <p className="font-semibold text-sm mb-1 text-slate-800 dark:text-slate-300">File content is not loaded</p>
                        <p className="text-xs text-slate-450 max-w-sm mb-6 leading-relaxed">
                          To minimize API context window usage, CodePulse only fetches relevant target source files.
                        </p>
                        <a href={`${repoInfo.url}/blob/${repoInfo.defaultBranch}/${selectedFile}`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5">
                          <span>View on GitHub</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </div>
                  )
                )
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                     <FileText className="w-10 h-10 opacity-30 mb-2" />
                     <span className="text-xs font-semibold">Select a file to begin viewing source code</span>
                  </div>
              )}
            </div>
        </div>
      </div>
    </Card>
  );
};
