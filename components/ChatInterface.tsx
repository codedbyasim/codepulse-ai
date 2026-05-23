import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RepoInfo, AnalysisResult, FileContent, ChatMessage } from '../types';
import { createRepoChat } from '../services/gemini';
import { MarkdownRenderer } from './SharedUI';
import { MessageSquare, X, Send, Trash2, ShieldAlert } from 'lucide-react';

interface ChatInterfaceProps {
  repoInfo: RepoInfo;
  analysis: AnalysisResult;
  files: FileContent[];
  structure: string[];
}

interface GeminiChat {
  sendMessage: (message: string) => Promise<string>;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ repoInfo, analysis, files, structure }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const chatSessionRef = useRef<GeminiChat | null>(null);

  useEffect(() => {
    const initChat = async () => {
      chatSessionRef.current = await createRepoChat(repoInfo.name, analysis, files, structure);
      setMessages([{
        role: 'model',
        text: `Hello! I've indexed **${repoInfo.name}** and understand its logic. Ask me anything about the architecture, module hooks, or potential refactoring plans.`
      }]);
    };
    initChat();
  }, [repoInfo.name, analysis, files, structure]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
       scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading || !chatSessionRef.current) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    
    const newMessages = [...messages, { role: 'user', text: userMsg } as ChatMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const responseText = await chatSessionRef.current.sendMessage(userMsg);
      if (responseText) {
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I encountered an issue executing code reasoning. Please retry." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-tr from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full shadow-lg flex items-center justify-center border border-white/10"
        title="Chat with Codebase"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        layout
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageSquare className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Slide-in Chat Frame Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed bottom-24 right-6 z-50 w-[90vw] md:w-[440px] h-[580px] max-h-[75vh] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-black/5"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 280, damping: 25 }}
          >
            {/* Header */}
            <div className="bg-slate-50 dark:bg-github-card px-4.5 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>AI Repo Assistant</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Repo: {repoInfo.owner}/{repoInfo.name}</p>
              </div>
              <button 
                onClick={() => setMessages([])} 
                className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-wider flex items-center gap-1 transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Scrolling Messaging Window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-[#0d1117]/80">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-github-card border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.role === 'model' ? (
                       <MarkdownRenderer content={msg.text} className="!prose-p:text-slate-800 dark:!prose-p:text-slate-200 !prose-pre:bg-slate-900 !prose-sm !prose-p:my-1" />
                    ) : (
                       <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-white dark:bg-github-card border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 rounded-tl-none flex gap-1.5 items-center shadow-sm">
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input Bar */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-github-card border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask code logic, dependencies..."
                className="flex-1 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <motion.button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="p-3 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                whileHover={inputValue.trim() && !isLoading ? { scale: 1.05 } : {}}
                whileTap={inputValue.trim() && !isLoading ? { scale: 0.95 } : {}}
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
