import React, { useState, useEffect } from 'react';
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

  // Load token on mount
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
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 transition-colors duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repository"
            className="w-full pl-10 pr-4 py-4 bg-white dark:bg-github-dark border border-gray-300 dark:border-github-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-github-accent text-gray-900 dark:text-white placeholder-gray-500 transition-all duration-300 shadow-lg"
            required
          />
          <button
            type="submit"
            disabled={isLoading || !url}
            className={`absolute right-2 top-2 bottom-2 px-6 rounded-md font-medium transition-all duration-300 ${
              isLoading || !url
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 dark:bg-github-button hover:bg-green-700 dark:hover:bg-github-buttonHover text-white shadow-md'
            }`}
          >
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>

        {isLowLimit && !showTokenInput && (
           <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded p-2 text-center animate-pulse transition-colors duration-300">
              <p className="text-red-600 dark:text-red-400 text-sm">
                 ⚠️ GitHub API limit low ({rateLimit.remaining} remaining). 
                 <button type="button" onClick={() => setShowTokenInput(true)} className="underline ml-1 font-bold">Add a token</button> to continue.
              </p>
           </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-end">
          <button 
            type="button" 
            onClick={() => setShowTokenInput(!showTokenInput)}
            className="text-xs text-blue-600 dark:text-github-accent hover:underline text-right self-end flex items-center gap-1 transition-colors duration-300"
          >
            {showTokenInput 
              ? 'Hide Token Input' 
              : (token ? <><span className="text-green-500 dark:text-green-400">✓</span> Saved Token Active (Manage)</> : 'Add GitHub Token (Optional)')
            }
          </button>
        </div>

        {showTokenInput && (
           <div className="bg-white dark:bg-github-card p-4 rounded-lg border border-gray-200 dark:border-github-border animate-fade-in shadow-sm dark:shadow-none transition-colors duration-300">
             <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2 transition-colors duration-300">GitHub Personal Access Token</label>
             <div className="relative">
                <input
                  type="password"
                  value={token}
                  onChange={handleTokenChange}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-github-dark border border-gray-300 dark:border-github-border rounded focus:outline-none focus:border-blue-500 dark:focus:border-github-accent text-sm text-gray-900 dark:text-white pr-20 transition-all duration-300"
                />
                {token && (
                   <button 
                     type="button"
                     onClick={() => { setToken(''); localStorage.removeItem('gh_token'); }}
                     className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-300"
                   >
                     Clear
                   </button>
                )}
             </div>
             <p className="text-xs text-gray-500 mt-2 transition-colors duration-300">
               Your token is saved locally in your browser for future visits. It is never sent to any server other than GitHub's API.
             </p>
           </div>
        )}
      </form>
    </div>
  );
};

