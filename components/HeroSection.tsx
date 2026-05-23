import React, { useState, useEffect } from 'react';

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
}> = ({ onBasicClick, onArchaeologistClick }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [rippleActive, setRippleActive] = useState(false);

  useEffect(() => {
    // Generate floating particles
    const generatedParticles: Particle[] = Array.from({ length: 15 }, (_, i) => ({
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
    }, 4000);

    return () => clearInterval(rippleTimer);
  }, []);

  // Dependency graph data
  const graphNodes: GraphNode[] = [
    { id: 1, label: 'main.tsx', x: 50, y: 20, isChanged: true, connections: [2, 3] },
    { id: 2, label: 'api/handler', x: 25, y: 45, connections: [4, 5] },
    { id: 3, label: 'utils/parser', x: 75, y: 45, connections: [4, 6] },
    { id: 4, label: 'services/db', x: 50, y: 70, connections: [5, 6] },
    { id: 5, label: 'middleware', x: 15, y: 80, connections: [] },
    { id: 6, label: 'config', x: 85, y: 80, connections: [] },
  ];

  return (
    <div className="relative w-full min-h-screen bg-gray-950 dark:bg-[#0a0e27] overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-5 dark:opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="url(#gridGradient)" strokeWidth="1" />
            </pattern>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Animated Grid Movement */}
        <div className="absolute inset-0 animate-grid-shift opacity-5 dark:opacity-10">
          <svg className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <pattern id="grid-animated" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="url(#gridGradient2)" strokeWidth="1" />
              </pattern>
              <linearGradient id="gridGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-animated)" />
          </svg>
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `radial-gradient(circle, rgba(6, 182, 212, 0.8), rgba(16, 185, 129, 0.3))`,
              animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
              boxShadow: `0 0 ${particle.size * 4}px rgba(6, 182, 212, 0.6)`,
            }}
          />
        ))}
      </div>

      {/* Gradient Orbs */}
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" style={{ animationDelay: '2s' }}></div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column: Text */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 dark:border-cyan-400/30 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-300 dark:text-cyan-300">AI-Powered Code Intelligence</span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight">
                  <span className="text-white dark:text-white">Understand Any </span>
                  <br />
                  <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-400 dark:from-cyan-300 dark:via-emerald-300 dark:to-blue-300 text-transparent bg-clip-text">
                    Codebase.
                  </span>
                  <br />
                  <span className="text-white dark:text-white">Before It Breaks </span>
                  <span className="bg-gradient-to-r from-red-400 to-orange-400 dark:from-red-300 dark:to-orange-300 text-transparent bg-clip-text">
                    Production.
                  </span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 dark:text-gray-300 leading-relaxed max-w-2xl font-light">
                  AI-powered repository intelligence, dependency mapping, and blast radius prediction for modern engineering teams.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={onBasicClick}
                  className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 dark:from-cyan-400 dark:to-emerald-400 text-gray-950 dark:text-gray-900 font-semibold rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>Analyze Repository</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                <button
                  onClick={onArchaeologistClick}
                  className="group px-8 py-4 bg-gray-800/50 dark:bg-gray-800 border border-gray-700 dark:border-gray-600 text-white hover:border-emerald-500/50 dark:hover:border-emerald-400/50 hover:bg-gray-800/80 dark:hover:bg-gray-700/50 font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <span>Legacy Archaeologist</span>
                  <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 pt-8 border-t border-gray-700 dark:border-gray-600">
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-cyan-400 dark:text-cyan-300">6–8 Nodes</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Dependency Mapping</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-emerald-400 dark:text-emerald-300">2–3 Hops</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Blast Radius Tracking</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-400 dark:text-blue-300">Instant</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">AI Analysis</div>
                </div>
              </div>
            </div>

            {/* Right Column: Graph Preview */}
            <div className="relative h-full min-h-96 md:min-h-screen flex items-center justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Graph Container */}
                <svg
                  className="w-full h-full absolute inset-0"
                  viewBox="0 0 400 400"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ filter: 'drop-shadow(0 0 20px rgba(6, 182, 212, 0.3))' }}
                >
                  <defs>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <radialGradient id="nodeGradient" cx="30%" cy="30%">
                      <stop offset="0%" stopColor="rgba(6, 182, 212, 0.8)" />
                      <stop offset="100%" stopColor="rgba(6, 182, 212, 0.2)" />
                    </radialGradient>
                    <radialGradient id="changedNodeGradient" cx="30%" cy="30%">
                      <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
                      <stop offset="100%" stopColor="rgba(239, 68, 68, 0.2)" />
                    </radialGradient>
                  </defs>

                  {/* Connection Lines */}
                  {graphNodes.map((node) =>
                    node.connections.map((connId) => {
                      const target = graphNodes.find((n) => n.id === connId);
                      if (!target) return null;
                      return (
                        <line
                          key={`conn-${node.id}-${connId}`}
                          x1={node.x}
                          y1={node.y}
                          x2={target.x}
                          y2={target.y}
                          stroke="url(#lineGradient)"
                          strokeWidth="2"
                          opacity="0.4"
                          className="animate-pulse-line"
                        />
                      );
                    })
                  )}

                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(6, 182, 212, 0.6)" />
                      <stop offset="100%" stopColor="rgba(16, 185, 129, 0.6)" />
                    </linearGradient>
                  </defs>

                  {/* Nodes */}
                  {graphNodes.map((node) => (
                    <g key={`node-${node.id}`}>
                      {/* Outer glow ring */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="22"
                        fill="none"
                        stroke={node.isChanged ? 'rgba(239, 68, 68, 0.4)' : 'rgba(6, 182, 212, 0.4)'}
                        strokeWidth="1"
                        className={node.isChanged ? 'animate-ripple-pulse' : 'animate-node-pulse'}
                        opacity="0.8"
                      />

                      {/* Node circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="16"
                        fill={node.isChanged ? 'url(#changedNodeGradient)' : 'url(#nodeGradient)'}
                        className={node.isChanged ? 'animate-node-pulse-fast' : 'animate-node-pulse'}
                        filter="url(#glow)"
                      />

                      {/* Inner dot */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="4"
                        fill={node.isChanged ? '#ef4444' : '#06b6d4'}
                      />

                      {/* Label */}
                      <text
                        x={node.x}
                        y={node.y + 35}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="500"
                        fill={node.isChanged ? 'rgba(239, 68, 68, 0.8)' : 'rgba(6, 182, 212, 0.8)'}
                        className="select-none"
                        fontFamily="monospace"
                      >
                        {node.label}
                      </text>

                      {/* Changed badge */}
                      {node.isChanged && (
                        <rect
                          x={node.x - 15}
                          y={node.y - 28}
                          width="30"
                          height="16"
                          rx="8"
                          fill="rgba(239, 68, 68, 0.2)"
                          stroke="rgba(239, 68, 68, 0.6)"
                          strokeWidth="1"
                        />
                      )}
                      {node.isChanged && (
                        <text
                          x={node.x}
                          y={node.y - 17}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="600"
                          fill="rgba(239, 68, 68, 0.8)"
                          className="select-none"
                        >
                          CHANGED
                        </text>
                      )}

                      {/* Propagation ripple from changed node */}
                      {node.isChanged && rippleActive && (
                        <>
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r="16"
                            fill="none"
                            stroke="rgba(239, 68, 68, 0.8)"
                            strokeWidth="2"
                            className="animate-propagate-ripple"
                            opacity="0.8"
                          />
                        </>
                      )}
                    </g>
                  ))}
                </svg>

                {/* Graph Info Overlay */}
                <div className="absolute bottom-8 left-8 right-8 bg-gray-900/80 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-800 dark:border-gray-700 rounded-lg p-4 z-20">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-sm text-gray-300 dark:text-gray-400">main.tsx changed</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      <span className="text-cyan-400 dark:text-cyan-300 font-semibold">5 files affected</span> across {' '}
                      <span className="text-emerald-400 dark:text-emerald-300 font-semibold">2 services</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
