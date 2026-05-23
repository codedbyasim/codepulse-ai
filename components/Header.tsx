import React from 'react';
import { RateLimit } from '../types';

interface HeaderProps {
  rateLimit?: RateLimit | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currentView: 'home' | 'about';
  onNavigate: (view: 'home' | 'about') => void;
}

export const Header: React.FC<HeaderProps> = ({ rateLimit, theme, toggleTheme, currentView, onNavigate }) => {
  return (
    <header className="border-b border-gray-200 dark:border-github-border bg-white dark:bg-github-card sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button onClick={() => onNavigate('home')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <svg className="w-8 h-8 text-gray-900 dark:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
               <path fillRule="evenodd" d="M12 2C6.477 2 2 6.48 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors duration-300">CodePulse AI</h1>
          </button>
          
          <div className="flex items-center gap-6">
             {/* Navigation Links */}
             <nav className="hidden md:flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <button 
                  onClick={() => onNavigate('home')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${currentView === 'home' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  Analyzer
                </button>
                <button 
                  onClick={() => onNavigate('about')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${currentView === 'about' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  About Project
                </button>
             </nav>

            <div className="hidden sm:flex flex-col items-end border-l border-gray-200 dark:border-gray-700 pl-6">
              <div className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">
                Powered by Google Gemini Flash 2.0
              </div>
              {rateLimit && (
                <div className={`text-xs font-mono mt-1 transition-colors duration-300 ${rateLimit.remaining < 10 ? 'text-red-500 dark:text-red-400 font-bold' : 'text-gray-600'}`} title={`Resets at ${rateLimit.reset.toLocaleTimeString()}`}>
                  API Limit: {rateLimit.remaining}/{rateLimit.limit}
                </div>
              )}
            </div>
            
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-github-accent shadow-sm"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <div className="relative w-5 h-5">
                 {/* Moon (Dark Mode) */}
                 <svg className={`w-5 h-5 absolute inset-0 transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                 </svg>
                 {/* Sun (Light Mode) */}
                 <svg className={`w-5 h-5 absolute inset-0 transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                 </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Nav Menu (Visible only on small screens) */}
      <div className="md:hidden border-t border-gray-200 dark:border-gray-800 flex">
          <button 
            onClick={() => onNavigate('home')}
            className={`flex-1 py-2 text-sm font-medium ${currentView === 'home' ? 'text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800/50' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Analyzer
          </button>
          <div className="w-px bg-gray-200 dark:bg-gray-800"></div>
          <button 
            onClick={() => onNavigate('about')}
            className={`flex-1 py-2 text-sm font-medium ${currentView === 'about' ? 'text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800/50' : 'text-gray-500 dark:text-gray-400'}`}
          >
            About Project
          </button>
      </div>
    </header>
  );
};

