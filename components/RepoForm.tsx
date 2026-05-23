import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Key, Sparkles, Check, HelpCircle, XCircle } from 'lucide-react';
import { RateLimit } from '../types';

interface RepoFormProps {
  onSubmit: (url: string, token?: string) => void;
  isLoading: boolean;
  defaultShowToken?: boolean;
  rateLimit?: RateLimit | null;
}

export const RepoForm: React.FC<RepoFormProps> = ({ onSubmit, isLoading, defaultShowToken = false, rateLimit }) => {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(defaultShowToken);

  useEffect(() => {
    const savedToken = localStorage.getItem('gh_token');
    if (savedToken) {
      setToken(savedToken);
    }
    if (defaultShowToken) {
      setShowTokenInput(true);
    }
  }, [defaultShowToken]);

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setToken(val);
    if (val.trim()) {
      localStorage.setItem('gh_token', val.trim());
    } else {
      localStorage.removeItem('gh_token');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim(), token.trim() || undefined);
    }
  };

  const isLowLimit = rateLimit && rateLimit.remaining < 5 && !token;

  return (
    <div className="w-full max-w-2xl mx-auto mb-12">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="relative group">
          {/* Neon Border Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-650 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-300"></div>
          
          <div className="relative flex items-center bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg pl-4.5 pr-2.5 py-1">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste GitHub Repository URL (e.g. https://github.com/owner/repo)..."
              className="w-full py-4 pl-3 pr-4 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none text-xs sm:text-sm font-normal"
              required
            />
            
            <motion.button
              type="submit"
              disabled={isLoading || !url}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 ${
                isLoading || !url
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-550 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-550 to-blue-650 text-white shadow-md shadow-cyan-500/10'
              }`}
              whileHover={url && !isLoading ? { scale: 1.02 } : {}}
              whileTap={url && !isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {isLowLimit && !showTokenInput && (
           <motion.div 
             className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-3.5 text-center shadow-sm"
             initial={{ opacity: 0, y: -10 }}
             animate={{ opacity: 1, y: 0 }}
           >
              <p className="text-red-500 text-xs font-semibold">
                 ⚠️ GitHub API limit is low ({rateLimit.remaining} remaining). 
                 <button type="button" onClick={() => setShowTokenInput(true)} className="underline ml-1.5 font-bold hover:text-red-400">Add GitHub token</button> to unlock more queries.
              </p>
           </motion.div>
        )}

        <div className="flex justify-end px-1">
          <button 
            type="button" 
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-bold flex items-center gap-1.5 transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
            {showTokenInput 
              ? 'Hide Token Config' 
              : (token ? <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-500" /> Active Token Saved (Manage)</span> : 'Provide GitHub Token (Optional)')
            }
          </button>
        </div>

        <AnimatePresence>
          {showTokenInput && (
             <motion.div 
                className="bg-white dark:bg-github-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
             >
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span>GitHub Personal Access Token</span>
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" title="Learn how to generate a token">
                      <HelpCircle className="w-4 h-4 text-slate-400 hover:text-slate-655" />
                    </a>
                  </label>
                </div>
                <div className="relative">
                   <input
                     type="password"
                     value={token}
                     onChange={handleTokenChange}
                     placeholder="Paste ghp_xxxxxxxxxxxxxxxxxxxxxxxx here..."
                     className="w-full px-3.5 py-3 bg-slate-50 dark:bg-[#0d1117] border border-slate-250 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-cyan-500 text-xs text-slate-800 dark:text-white pr-20 transition-all font-mono"
                   />
                   {token && (
                      <button 
                        type="button"
                        onClick={() => { setToken(''); localStorage.removeItem('gh_token'); }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-500 hover:text-rose-650 px-2.5 py-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-555/10 transition-colors uppercase tracking-wider"
                      >
                        Clear
                      </button>
                   )}
                </div>
                <p className="text-[10px] text-slate-450 mt-2 leading-relaxed font-light">
                  Tokens are stored securely inside your browser's local storage and are sent directly to GitHub to authorize code metadata scanning.
                </p>
             </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};
