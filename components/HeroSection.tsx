import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, Network, ShieldCheck, Zap } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

interface GraphNode {
  id: number;
  label: string;
  x: number;
  y: number;
  isChanged?: boolean;
  connections: number[];
}

export const HeroSection: React.FC<{
  onBasicClick: () => void;
  onArchaeologistClick: () => void;
  theme: 'dark' | 'light';
}> = ({ onBasicClick, onArchaeologistClick, theme }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [rippleActive, setRippleActive] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);

  useEffect(() => {
    // Generate floating particles
    const generatedParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 8,
      delay: Math.random() * 2,
    }));
    setParticles(generatedParticles);

    // Trigger ripple animation
    const rippleTimer = setInterval(() => {
      setRippleActive(prev => !prev);
    }, 3000);

    return () => clearInterval(rippleTimer);
  }, []);

  // Dependency graph data
  const graphNodes: GraphNode[] = [
    { id: 1, label: 'main.tsx', x: 200, y: 80, isChanged: true, connections: [2, 3] },
    { id: 2, label: 'api/handler.ts', x: 100, y: 180, connections: [4, 5] },
    { id: 3, label: 'utils/parser.ts', x: 300, y: 180, connections: [4, 6] },
    { id: 4, label: 'services/db.ts', x: 200, y: 280, connections: [5, 6] },
    { id: 5, label: 'middleware.ts', x: 70, y: 320, connections: [] },
    { id: 6, label: 'config.ts', x: 330, y: 320, connections: [] },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden flex items-center">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-50/40 via-white to-blue-50/40 dark:from-cyan-950/20 dark:via-slate-950 dark:to-blue-950/20 transition-all duration-300"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `radial-gradient(circle, rgba(6, 182, 212, 0.8), rgba(16, 185, 129, 0.2))`,
              boxShadow: `0 0 ${particle.size * 4}px rgba(6, 182, 212, 0.5)`,
            }}
            animate={{
              y: [0, -80, 0],
              x: [0, 40, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Soft Gradient Glow Blobs */}
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse -z-10" />
      <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse -z-10" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Title & Intro */}
          <motion.div 
            className="lg:col-span-7 space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-cyan-500/25 backdrop-blur-md shadow-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">AI-Powered Code Intelligence</span>
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] transition-colors duration-300">
              Understand Any 
              <span className="block mt-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500 text-transparent bg-clip-text">
                Codebase.
              </span>
              Before It Breaks
              <span className="block mt-1 bg-gradient-to-r from-red-400 to-orange-500 text-transparent bg-clip-text">
                Production.
              </span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl font-light transition-colors duration-300">
              Map system dependencies, predict blast radius, and audit security flows instantly with next-gen semantic codebase scanning.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 pt-2">
              <motion.button
                onClick={onBasicClick}
                className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/45 hover:scale-[1.03] transition-all duration-300 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Terminal className="w-5 h-5" />
                <span>Analyze Repository</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </motion.button>

              <motion.button
                onClick={onArchaeologistClick}
                className="group px-8 py-4 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-slate-900 font-bold rounded-xl shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 flex items-center justify-center gap-2 transition-all duration-300"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Network className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                <span>Legacy Archaeologist</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </motion.button>
            </motion.div>

            {/* Trust Indicators / Stats */}
            <motion.div 
              variants={itemVariants} 
              className="flex flex-wrap gap-8 sm:gap-12 pt-8 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300"
            >
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cyan-500 dark:text-cyan-400 flex items-center gap-1.5">
                  <Zap className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
                  <span>Instant</span>
                </div>
                <div className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider transition-colors duration-300">AI Parsing Speed</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-emerald-500 dark:text-emerald-400 flex items-center gap-1.5">
                  <Network className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                  <span>Deep Map</span>
                </div>
                <div className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider transition-colors duration-300">Dependency Scanning</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-rose-500 dark:text-rose-450 flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-rose-500 dark:text-rose-450" />
                  <span>Secure</span>
                </div>
                <div className="text-xs font-semibold text-slate-450 dark:text-slate-500 uppercase tracking-wider transition-colors duration-300">Vulnerability Profile</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Visual Graph Preview */}
          <motion.div 
            className="lg:col-span-5 relative w-full h-[400px] sm:h-[480px] bg-white/85 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 rounded-2xl p-4 backdrop-blur-sm flex items-center justify-center shadow-lg dark:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent rounded-2xl pointer-events-none"></div>
            
            <svg
              className="w-full h-full"
              viewBox="0 0 400 400"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="heroGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="cyanNode" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.3" />
                </radialGradient>
                <radialGradient id="redNode" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#be123c" stopOpacity="0.3" />
                </radialGradient>
              </defs>

              {/* Graph Connections */}
              {graphNodes.map((node) =>
                node.connections.map((connId) => {
                  const target = graphNodes.find((n) => n.id === connId);
                  if (!target) return null;
                  const isHovered = hoveredNode === node.id || hoveredNode === target.id;
                  return (
                    <line
                      key={`conn-${node.id}-${connId}`}
                      x1={node.x}
                      y1={node.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={isHovered ? '#10b981' : (theme === 'dark' ? '#1e293b' : '#e2e8f0')}
                      strokeWidth={isHovered ? '2.5' : '1.5'}
                      className="transition-colors duration-300"
                      strokeDasharray={node.isChanged ? '4' : 'none'}
                    />
                  );
                })
              )}

              {/* Graph Nodes */}
              {graphNodes.map((node) => {
                const isHovered = hoveredNode === node.id;
                return (
                  <g 
                    key={`node-${node.id}`} 
                    className="cursor-pointer group"
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    {/* Ring Pulsing */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isHovered ? '24' : '20'}
                      fill="none"
                      stroke={node.isChanged ? 'rgba(244, 63, 94, 0.4)' : 'rgba(6, 182, 212, 0.3)'}
                      strokeWidth="1.5"
                      className="transition-all duration-300"
                    />

                    {/* Node Core */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="14"
                      fill={node.isChanged ? 'url(#redNode)' : 'url(#cyanNode)'}
                      filter="url(#heroGlow)"
                      className="transition-all duration-300 hover:scale-110"
                    />

                    {/* Label Text */}
                    <text
                      x={node.x}
                      y={node.y + 32}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill={node.isChanged ? (theme === 'dark' ? '#fda4af' : '#b91c1c') : (theme === 'dark' ? '#a5f3fc' : '#0369a1')}
                      className="select-none font-mono tracking-tight"
                    >
                      {node.label}
                    </text>

                    {/* changed marker flag */}
                    {node.isChanged && (
                      <g>
                        <rect
                          x={node.x - 18}
                          y={node.y - 28}
                          width="36"
                          height="14"
                          rx="4"
                          fill="rgba(244, 63, 94, 0.2)"
                          stroke="#f43f5e"
                          strokeWidth="1"
                        />
                        <text
                          x={node.x}
                          y={node.y - 18}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="700"
                          fill="#f43f5e"
                          className="select-none"
                        >
                          ALERT
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            <div className="absolute bottom-6 left-6 right-6 bg-white/95 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-900 p-4 rounded-xl backdrop-blur-md flex items-center gap-3 shadow-md dark:shadow-none transition-all duration-300">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>
              <div className="text-xs">
                <span className="text-slate-800 dark:text-slate-200 font-bold block">Source Modified: main.tsx</span>
                <span className="text-slate-500 dark:text-slate-400">Blast Radius: 4 affected files in dependency chain</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
