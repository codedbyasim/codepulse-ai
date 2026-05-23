import React, { useState, useRef, useEffect } from 'react';
import { RepoInfo, AnalysisResult, FileContent, ChatMessage } from '../types';
import { createRepoChat } from '../services/gemini';
import { MarkdownRenderer } from './SharedUI';

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
  
  // Use a ref to hold the Chat object so it persists across renders without causing re-renders
  const chatSessionRef = useRef<GeminiChat | null>(null);

  // Initialize chat when component mounts (or when repo changes)
  useEffect(() => {
    const initChat = async () => {
      chatSessionRef.current = await createRepoChat(repoInfo.name, analysis, files, structure);
      // Add initial greeting
      setMessages([{
        role: 'model',
        text: `Hello! I've analyzed **${repoInfo.name}** using Google Gemini Flash 2.0. Ask me anything about the codebase, architecture, or specific files.`
      }]);
    };
    initChat();
  }, [repoInfo.name, analysis, files, structure]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading || !chatSessionRef.current) return;

    const userMsg = inputValue.trim();
    setInputValue('');
    
    // Optimistic UI update
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
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-green-600 dark:bg-github-button hover:bg-green-700 dark:hover:bg-github-buttonHover text-white rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center border border-white/10"
        title="Chat with Codebase"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[90vw] md:w-[450px] h-[600px] max-h-[80vh] bg-white dark:bg-[#0d1117] border border-gray-200 dark:border-github-border rounded-xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
          
          {/* Header */}
          <div className="bg-gray-50 dark:bg-github-card p-4 border-b border-gray-200 dark:border-github-border flex justify-between items-center">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                AI Assistant
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Context: {repoInfo.name}</p>
            </div>
            <button onClick={() => setMessages([])} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white underline">Clear</button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white dark:bg-[#0d1117]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-lg p-3 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 dark:bg-github-accent text-white rounded-br-none' 
                      : 'bg-gray-100 dark:bg-github-card border border-gray-200 dark:border-github-border text-gray-800 dark:text-gray-200 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'model' ? (
                     <MarkdownRenderer content={msg.text} className="!prose-p:text-gray-800 dark:!prose-p:text-gray-200 !prose-pre:bg-gray-800 dark:!prose-pre:bg-black/30 !prose-sm" />
                  ) : (
                     <p>{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                 <div className="bg-gray-100 dark:bg-github-card border border-gray-200 dark:border-github-border rounded-lg p-3 rounded-bl-none flex gap-1 items-center">
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-gray-50 dark:bg-github-card border-t border-gray-200 dark:border-github-border">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about the code..."
                className="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-github-border rounded-lg pl-4 pr-12 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-github-accent transition-colors shadow-sm dark:shadow-none"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-2 p-1.5 bg-green-600 dark:bg-github-button hover:bg-green-700 dark:hover:bg-github-buttonHover text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

