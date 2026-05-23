import React from 'react';
import { motion } from 'framer-motion';
import { RateLimit } from '../types';
import { Shield, Sparkles, Moon, Sun, BookOpen } from 'lucide-react';

interface HeaderProps {
  rateLimit?: RateLimit | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  currentView: 'home' | 'about';
  onNavigate: (view: 'home' | 'about') => void;
}

export const Header: React.FC<HeaderProps> = ({ rateLimit, theme, toggleTheme, currentView, onNavigate }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-github-border/40 bg-white/70 dark:bg-github-dark/75 backdrop-blur-md transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.button 
            onClick={() => onNavigate('home')} 
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
              <Shield className="w-5 h-5" />
              <div className="absolute inset-0 rounded-lg bg-cyan-400 blur-sm opacity-30 -z-10 animate-pulse"></div>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors duration-300 flex items-center gap-1.5">
              CodePulse <span className="text-sm font-semibold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">AI</span>
            </h1>
          </motion.button>
          
          <div className="flex items-center gap-6">
             {/* Navigation Links */}
             <nav className="hidden md:flex gap-1.5 bg-gray-100/80 dark:bg-gray-800/60 p-1 rounded-xl backdrop-blur-sm">
                <button 
                  onClick={() => onNavigate('home')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 ${currentView === 'home' ? 'bg-white dark:bg-gray-700 text-gray-950 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span>Analyzer</span>
                </button>
                <button 
                  onClick={() => onNavigate('about')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-1.5 ${currentView === 'about' ? 'bg-white dark:bg-gray-700 text-gray-950 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  <BookOpen className="w-4 h-4 text-emerald-500" />
                  <span>About Project</span>
                </button>
             </nav>

            <div className="hidden sm:flex flex-col items-end border-l border-gray-200 dark:border-gray-700/80 pl-6">
              <div className="text-xs font-medium text-gray-400 dark:text-gray-400 tracking-wider uppercase transition-colors duration-300">
                Code Intelligence
              </div>
              {rateLimit && (
                <div className={`text-xs font-mono mt-0.5 transition-colors duration-300 ${rateLimit.remaining < 10 ? 'text-red-500 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`} title={`Resets at ${rateLimit.reset.toLocaleTimeString()}`}>
                  Limit: {rateLimit.remaining}/{rateLimit.limit}
                </div>
              )}
            </div>
            
            <motion.button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm border border-gray-200/20"
              title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="relative w-5 h-5">
                 {/* Moon (Dark Mode) */}
                 <Moon className={`w-5 h-5 absolute inset-0 transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
                 {/* Sun (Light Mode) */}
                 <Sun className={`w-5 h-5 absolute inset-0 transform transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}`} />
              </div>
            </motion.button>
          </div>
        </div>
      </div>
      
      {/* Mobile Nav Menu (Visible only on small screens) */}
      <div className="md:hidden border-t border-gray-200/50 dark:border-gray-800/40 flex backdrop-blur-md">
          <button 
            onClick={() => onNavigate('home')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 ${currentView === 'home' ? 'text-cyan-500 dark:text-cyan-400 bg-gray-50/50 dark:bg-gray-800/20' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Analyzer</span>
          </button>
          <div className="w-px bg-gray-200/50 dark:bg-gray-800/40"></div>
          <button 
            onClick={() => onNavigate('about')}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 ${currentView === 'about' ? 'text-emerald-500 dark:text-emerald-400 bg-gray-50/50 dark:bg-gray-800/20' : 'text-gray-500 dark:text-gray-400'}`}
          >
            <BookOpen className="w-4 h-4" />
            <span>About Project</span>
          </button>
      </div>
    </header>
  );
};
