import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { MenuOverlay } from './components/MenuOverlay';
import { GameState } from './types';

export default function App() {
  const [level, setLevel] = useState(1);
  const [showMenu, setShowMenu] = useState(true);
  const engineRef = useRef<GameEngine | null>(null);
  
  // React mirror of internal engine state for UI
  const [gameState, setGameState] = useState<GameState>({
    level: 1,
    epoch: 'Classical',
    heat: 0,
    integrity: 100,
    status: 'preview',
    score: 0,
    timeScale: 1.0,
    stardust: 0,
    requiredStardust: 20,
    optimumScore: 0,
    switchCooldown: 0,
    goalCollected: false,
  });
  const [isWaveState, setIsWaveState] = useState(false);

  // Initialize engine
  useEffect(() => {
    engineRef.current = new GameEngine(level);
    setGameState(engineRef.current.gameState);
    setIsWaveState(engineRef.current.probe.isWaveState);
  }, [level]);

  // Poll engine state for UI updates
  useEffect(() => {
    const pollId = setInterval(() => {
      if (engineRef.current) {
        setGameState({ ...engineRef.current.gameState });
        setIsWaveState(engineRef.current.probe.isWaveState);
      }
    }, 50);
    return () => clearInterval(pollId);
  }, []);

  const handleToggleState = useCallback(() => {
    engineRef.current?.toggleState();
  }, []);

  const handleReset = useCallback(() => {
    engineRef.current?.reset();
    if (engineRef.current) {
      setGameState({ ...engineRef.current.gameState });
    }
  }, []); // No dependency on gameState

  const handleNextLevel = useCallback(() => {
    if (level < 40) {
      setLevel(l => l + 1);
    } else {
       // Loop back or end screen
       setLevel(1);
    }
  }, [level]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        handleToggleState();
      }
      if (e.code === 'KeyR') {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleState, handleReset]);

  const isDev = true; // Enabled for the user nirmalya.iitkharagpur@gmail.com

  return (
    <div className="relative w-full h-screen bg-[#050505] overflow-hidden font-mono antialiased text-[#f0f0f0]">
      {/* Background Pattern */}
      <div className="absolute inset-0 game-bg-pattern opacity-10 pointer-events-none" />
      
      {/* Animated Particles */}
      {[...Array(20)].map((_, i) => (
        <div 
          key={i}
          className="particle"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 15}s`,
            opacity: Math.random() * 0.3
          }}
        />
      ))}

      <div className="scanline" />

      {/* Game Canvas Container */}
      <GameCanvas 
        level={level}
        engineRef={engineRef}
        onWin={handleNextLevel} 
        onLoss={() => {}} 
      />

      {/* Interface Overlay */}
      <UIOverlay 
        gameState={gameState}
        isWaveState={isWaveState}
        onToggleState={handleToggleState}
        onReset={handleReset}
        onNextLevel={handleNextLevel}
      />

      {/* Home Screen */}
      {showMenu && <MenuOverlay onStart={() => setShowMenu(false)} />}

      {/* Developer Console */}
      {isDev && (
        <div className="absolute top-4 left-4 z-[100] border border-cyan-500/20 bg-black/60 p-2 rounded flex items-center gap-2 pointer-events-auto">
          <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Dev: Level Jump</span>
          <input 
            type="number" 
            min="1" 
            max="40" 
            value={level} 
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-10 bg-black border border-white/10 text-white text-[10px] px-1"
          />
        </div>
      )}

      {/* Decorative Vignette & Frame */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />
      <div className="absolute inset-0 border-[20px] border-[#000] pointer-events-none" />
      <div className="absolute inset-0 border border-white/5 pointer-events-none" />
    </div>
  );
}
