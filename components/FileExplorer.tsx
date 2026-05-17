import React, { useState, useMemo, useEffect } from 'react';
import { RepoInfo, FileContent, FileAnalysisResult } from '../types';
import { Card, DiffViewer, MarkdownRenderer } from './SharedUI';
import { analyzeSingleFile } from '../services/watsonx';

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

// --- ICONS & HELPERS ---

const FileIcons = {
  Generic: (className: string) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Code: (className: string) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  Config: (className: string) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Image: (className: string) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Lock: (className: string) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  Document: (className: string) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
};

// IMPROVED: SmartFileIcon now includes a background glow and better colors
const SmartFileIcon = ({ filename, className = "w-4 h-4" }: { filename: string; className?: string }) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  let IconComp = FileIcons.Generic;
  let color = 'text-gray-500 dark:text-gray-400';
  let bgColor = 'bg-gray-200 dark:bg-gray-700';

  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'cjs':
    case 'mjs':
      IconComp = FileIcons.Code;
      if (['ts','tsx'].includes(ext!)) {
         color = 'text-blue-600 dark:text-blue-400';
         bgColor = 'bg-blue-100 dark:bg-blue-900';
      } else {
         color = 'text-yellow-600 dark:text-yellow-300';
         bgColor = 'bg-yellow-100 dark:bg-yellow-900';
      }
      break;

    case 'py':
      IconComp = FileIcons.Code;
      color = 'text-blue-500 dark:text-blue-300';
      bgColor = 'bg-blue-100 dark:bg-blue-900';
      break;
    
    case 'go':
      IconComp = FileIcons.Code;
      color = 'text-cyan-600 dark:text-cyan-400';
      bgColor = 'bg-cyan-100 dark:bg-cyan-900';
      break;
    
    case 'java':
      IconComp = FileIcons.Code;
      color = 'text-red-600 dark:text-red-400';
      bgColor = 'bg-red-100 dark:bg-red-900';
      break;

    case 'rs':
      IconComp = FileIcons.Code;
      color = 'text-orange-600 dark:text-orange-400';
      bgColor = 'bg-orange-100 dark:bg-orange-900';
      break;
      
    case 'json':
    case 'yml':
    case 'yaml':
    case 'toml':
    case 'env':
    case 'ini':
      IconComp = FileIcons.Config;
      color = 'text-emerald-600 dark:text-green-400';
      bgColor = 'bg-emerald-100 dark:bg-green-900';
      break;
      
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      IconComp = FileIcons.Document; 
      color = 'text-pink-600 dark:text-pink-400';
      bgColor = 'bg-pink-100 dark:bg-pink-900';
      break;
      
    case 'html':
    case 'htm':
    case 'xml':
      IconComp = FileIcons.Code;
      color = 'text-orange-600 dark:text-orange-500';
      bgColor = 'bg-orange-100 dark:bg-orange-900';
      break;

    case 'md':
    case 'txt':
    case 'gitignore':
      IconComp = FileIcons.Document;
      color = 'text-gray-600 dark:text-gray-300';
      bgColor = 'bg-gray-200 dark:bg-gray-700';
      break;
      
    case 'lock':
      IconComp = FileIcons.Lock;
      color = 'text-gray-500 dark:text-gray-400';
      bgColor = 'bg-gray-200 dark:bg-gray-800';
      break;
      
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'ico':
    case 'webp':
      IconComp = FileIcons.Image;
      color = 'text-purple-600 dark:text-purple-400';
      bgColor = 'bg-purple-100 dark:bg-purple-900';
      break;
  }

  // Render with background glow/circle for better contrast
  return (
    <div className={`flex items-center justify-center p-1 rounded-full ${bgColor} bg-opacity-40 dark:bg-opacity-20 transition-colors duration-300`}>
       {IconComp(`${className} ${color} transition-colors duration-300`)}
    </div>
  );
};

const FolderIconClosed = () => (
   <div className="flex items-center justify-center p-1 rounded-full bg-blue-50 dark:bg-blue-900/10 transition-colors duration-300">
      <svg className="w-4 h-4 text-blue-400 dark:text-blue-300 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      </svg>
   </div>
);

const FolderIconOpen = () => (
   <div className="flex items-center justify-center p-1 rounded-full bg-blue-100 dark:bg-blue-900/20 transition-colors duration-300">
      <svg className="w-4 h-4 text-blue-500 dark:text-blue-400 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
      </svg>
   </div>
);

const ChevronRight = () => (
  <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
);

const ChevronDown = () => (
  <svg className="w-3 h-3 text-gray-400 dark:text-gray-500 transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
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

// --- COMPONENTS ---

const FileTreeItem: React.FC<{
  node: TreeNode;
  level: number;
  selectedFile: string | null;
  onSelect: (path: string) => void;
  filesWithContent: Set<string>;
  modifiedFiles: Set<string>;
  highlightColor?: string;
}> = ({ node, level, selectedFile, onSelect, filesWithContent, modifiedFiles, highlightColor = "bg-blue-50 dark:bg-github-accent/20" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isSelected = selectedFile === node.path;
  const hasContent = node.type === 'file' && filesWithContent.has(node.path);
  const isModified = node.type === 'file' && modifiedFiles.has(node.path);

  // Auto-expand if the selected file is inside this folder
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
          flex items-center gap-2 py-1.5 pr-2 cursor-pointer select-none transition-all duration-150 text-sm 
          border-l-2
          ${isSelected 
            ? `${highlightColor} text-blue-700 dark:text-white border-blue-500 dark:border-github-accent` 
            : 'text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-github-card hover:text-gray-900 dark:hover:text-gray-200'
          }
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {/* Indentation Chevron */}
        <span className="shrink-0 flex items-center justify-center w-4 h-4 opacity-70 transition-colors duration-300">
          {node.type === 'folder' ? (
            isOpen ? <ChevronDown /> : <ChevronRight />
          ) : (
            <span className="w-3" /> // Spacer
          )}
        </span>

        {/* Icon */}
        <span className="shrink-0">
          {node.type === 'folder' ? (
            isOpen ? <FolderIconOpen /> : <FolderIconClosed />
          ) : (
            <SmartFileIcon filename={node.name} />
          )}
        </span>

        {/* Name */}
        <span className={`truncate transition-colors duration-300 ${isSelected ? 'font-medium' : ''} ${node.type === 'folder' ? 'text-gray-700 dark:text-gray-300' : ''}`}>
          {node.name}
        </span>

        {/* Status Indicators */}
        <div className="ml-auto flex items-center gap-2">
            {isModified && (
                <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_5px_rgba(250,204,21,0.5)]" title="Modified"></span>
            )}
            {hasContent && (
               <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                 <title>Analyzed</title>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
               </svg>
            )}
        </div>
      </div>

      {node.type === 'folder' && isOpen && (
        <div className="border-l border-gray-200 dark:border-gray-800 ml-[19px] transition-colors duration-300">
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
        </div>
      )}
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

  const highlightClass = themeColor ? themeColor : "bg-blue-50 dark:bg-github-accent/20";
  const buttonActive = themeColor ? `bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white` : "bg-blue-100 dark:bg-github-accent text-blue-700 dark:text-white";

  return (
    <Card title={title}>
      <div className="flex flex-col md:flex-row h-[600px] transition-colors duration-300">
        {/* File List Panel */}
        <div className="w-full md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-github-border bg-gray-50 dark:bg-[#0d1117] transition-colors duration-300">
            {/* Search Bar */}
            <div className="p-3 border-b border-gray-200 dark:border-github-border sticky top-0 bg-gray-50 dark:bg-[#0d1117] z-10 transition-colors duration-300">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search files..." 
                  className="w-full bg-white dark:bg-github-card border border-gray-300 dark:border-github-border rounded-md pl-8 pr-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-400 dark:focus:border-gray-500 placeholder-gray-500 dark:placeholder-gray-600 transition-colors duration-300 shadow-sm dark:shadow-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-2.5 top-2 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>

            {/* Tree Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
              {searchTerm ? (
                // Flat List for Search
                filteredStructure.length > 0 ? (
                  <div className="py-2">
                    {filteredStructure.map(path => {
                      const hasContent = filesWithContent.has(path);
                      const isMod = modifiedFiles.has(path);
                      const filename = path.split('/').pop() || path;
                      return (
                        <div 
                          key={path} 
                          onClick={() => setSelectedFile(path)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors duration-300 border-l-2 ${selectedFile === path ? `${highlightClass} text-blue-700 dark:text-white border-blue-500 dark:border-github-accent` : 'text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-github-card'}`}
                        >
                            <SmartFileIcon filename={filename} />
                            <div className="flex flex-col min-w-0">
                              <span className="truncate text-gray-700 dark:text-gray-200 transition-colors duration-300">{filename}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-600 truncate transition-colors duration-300">{path}</span>
                            </div>
                            <div className="ml-auto flex gap-2">
                                {isMod && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>}
                                {hasContent && <svg className="w-3 h-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">No files found matching "{searchTerm}"</div>
                )
              ) : (
                // Hierarchical Tree
                treeRoot.length > 0 ? (
                    <div className="py-2">
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
                    <div className="p-4 text-center text-gray-500 text-sm">No structure available</div>
                )
              )}
            </div>
            
            {/* Status Footer */}
            <div className="p-2 border-t border-gray-200 dark:border-github-border bg-white dark:bg-github-card text-[10px] text-gray-500 flex justify-between px-4 transition-colors duration-300">
               <span>{structure.length} items</span>
               <span>{files.length} analyzed</span>
            </div>
        </div>

        {/* File Viewer Panel */}
        <div className="w-full md:w-2/3 flex flex-col bg-white dark:bg-[#0d1117] transition-colors duration-300">
            <div className="px-4 py-2 border-b border-gray-200 dark:border-github-border bg-gray-50 dark:bg-github-card flex justify-between items-center h-[53px] transition-colors duration-300">
              <div className="flex items-center gap-3 overflow-hidden">
                {selectedNode?.type === 'folder' ? (
                   <FolderIconOpen /> 
                ) : (
                   <SmartFileIcon filename={selectedFile || ''} className="w-5 h-5" />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate font-mono transition-colors duration-300">
                  {selectedFile || 'Select a file'}
                </span>
                
                {/* Badges */}
                <div className="flex gap-2">
                  {isSelectedFileAvailable && (
                      <span className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400 font-medium px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-900/40 transition-colors duration-300">
                         <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                         ANALYZED
                      </span>
                  )}
                  {isModified && (
                    <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-medium px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/40 animate-pulse transition-colors duration-300">
                      MODIFIED
                    </span>
                  )}
                </div>
              </div>

              {isSelectedFileAvailable && selectedNode?.type !== 'folder' && (
                <div className="flex bg-gray-200 dark:bg-github-dark rounded-md p-0.5 border border-gray-300 dark:border-github-border items-center transition-colors duration-300">
                  <button onClick={() => setViewMode('view')} className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === 'view' ? buttonActive : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Code</button>
                  <button onClick={() => setViewMode('edit')} className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === 'edit' ? buttonActive : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>Edit</button>
                  <button onClick={() => setViewMode('diff')} disabled={!isModified} className={`px-3 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === 'diff' ? buttonActive : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'}`}>Diff</button>
                  <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                  <button 
                    onClick={handleAnalyzeFile} 
                    className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-sm transition-colors ${viewMode === 'analysis' ? 'bg-purple-600 text-white' : 'text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30'}`}
                    title="Analyze this file with AI"
                  >
                     <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z" /></svg>
                     AI Analyze
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-auto p-0 custom-scrollbar relative bg-white dark:bg-[#0d1117] transition-colors duration-300">
              {selectedFile ? (
                selectedNode?.type === 'folder' ? (
                    // Folder View
                    <div className="p-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-gray-200 dark:border-gray-800 pb-2 transition-colors duration-300">
                           Folder Contents
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                           {selectedNode.children.map(child => (
                              <div 
                                 key={child.path}
                                 onClick={() => setSelectedFile(child.path)}
                                 className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-all duration-300 group"
                              >
                                 <div className="shrink-0 group-hover:scale-110 transition-transform duration-300">
                                    {child.type === 'folder' ? <FolderIconClosed /> : <SmartFileIcon filename={child.name} />}
                                 </div>
                                 <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white truncate transition-colors duration-300">{child.name}</span>
                              </div>
                           ))}
                        </div>
                        {selectedNode.children.length === 0 && (
                            <div className="text-gray-500 text-sm italic py-8 text-center transition-colors duration-300">Empty folder</div>
                        )}
                    </div>
                ) : (
                  // File View
                  isSelectedFileAvailable ? (
                    <>
                      {viewMode === 'view' && (
                          <pre className="p-4 text-xs sm:text-sm font-mono text-gray-800 dark:text-gray-300 whitespace-pre leading-relaxed transition-colors duration-300">
                            <code>{currentContent}</code>
                          </pre>
                      )}
                      {viewMode === 'edit' && (
                        <textarea
                          className="w-full h-full bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-300 p-4 font-mono text-xs sm:text-sm resize-none focus:outline-none leading-relaxed transition-colors duration-300"
                          value={currentContent}
                          onChange={(e) => handleContentChange(e.target.value)}
                          spellCheck={false}
                        />
                      )}
                      {viewMode === 'diff' && originalContent && (
                        <div className="h-full bg-white dark:bg-[#0d1117] transition-colors duration-300">
                            <DiffViewer original={originalContent} modified={currentContent || ''} />
                        </div>
                      )}
                      {viewMode === 'analysis' && (
                        <div className="h-full bg-white dark:bg-[#0d1117] p-6 transition-colors duration-300">
                           {isAnalyzingFile ? (
                              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                 <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                 <p className="animate-pulse">Analyzing {selectedFile}...</p>
                              </div>
                           ) : analysisCache[selectedFile!] ? (
                              <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
                                 <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-800 pb-4 transition-colors duration-300">
                                    <div>
                                       <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">AI Analysis</h2>
                                       <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{selectedFile}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors duration-300 ${
                                       analysisCache[selectedFile!].complexity === 'High' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50' :
                                       analysisCache[selectedFile!].complexity === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50' :
                                       'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900/50'
                                    }`}>
                                       {analysisCache[selectedFile!].complexity} Complexity
                                    </span>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white dark:bg-github-card p-4 rounded border border-gray-200 dark:border-github-border transition-colors duration-300">
                                       <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-3 transition-colors duration-300">Summary</h3>
                                       <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">{analysisCache[selectedFile!].summary}</p>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-github-card p-4 rounded border border-gray-200 dark:border-github-border transition-colors duration-300">
                                       <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 transition-colors duration-300">Potential Usage</h3>
                                       <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed transition-colors duration-300">{analysisCache[selectedFile!].potentialUsage}</p>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 transition-colors duration-300">Dependencies (Imports)</h3>
                                       {analysisCache[selectedFile!].dependencies.length > 0 ? (
                                          <ul className="space-y-1">
                                             {analysisCache[selectedFile!].dependencies.map((dep, i) => (
                                                <li key={i} className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 rounded border border-gray-200 dark:border-gray-800 font-mono transition-colors duration-300">
                                                   {dep}
                                                </li>
                                             ))}
                                          </ul>
                                       ) : (
                                          <p className="text-sm text-gray-500 italic transition-colors duration-300">No external dependencies detected.</p>
                                       )}
                                    </div>

                                    <div>
                                       <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 transition-colors duration-300">Key Exports (API)</h3>
                                       {analysisCache[selectedFile!].keyExports.length > 0 ? (
                                          <ul className="space-y-1">
                                             {analysisCache[selectedFile!].keyExports.map((exp, i) => (
                                                <li key={i} className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50 px-3 py-2 rounded border border-gray-200 dark:border-gray-800 font-mono transition-colors duration-300">
                                                   {exp}
                                                </li>
                                             ))}
                                          </ul>
                                       ) : (
                                          <p className="text-sm text-gray-500 italic transition-colors duration-300">No significant exports detected.</p>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                 <p>Analysis failed or no data returned.</p>
                              </div>
                           )}
                        </div>
                      )}
                    </>
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-500 p-8 text-center bg-white dark:bg-[#0d1117] transition-colors duration-300">
                        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800/50 flex items-center justify-center mb-4 transition-colors duration-300">
                           <SmartFileIcon filename={selectedFile} className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="font-medium mb-1 text-gray-800 dark:text-gray-300 transition-colors duration-300">File content not loaded</p>
                        <p className="text-sm max-w-sm mb-6 text-gray-500 transition-colors duration-300">
                          To save bandwidth and API tokens, CodePulse only fetches key files and source code for analysis. 
                        </p>
                        <a href={`${repoInfo.url}/blob/${repoInfo.defaultBranch}/${selectedFile}`} target="_blank" rel="noreferrer" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center gap-2 shadow-md">
                          View on GitHub <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                      </div>
                  )
                )
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-600 bg-white dark:bg-[#0d1117] transition-colors duration-300">
                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800/30 flex items-center justify-center mb-4 transition-colors duration-300">
                       <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    </div>
                    <span className="text-sm transition-colors duration-300">Select a file to view code</span>
                  </div>
              )}
            </div>
        </div>
      </div>
    </Card>
  );
};

// Made with Bob
