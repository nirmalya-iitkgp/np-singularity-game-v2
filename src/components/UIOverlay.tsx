import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../types';
import { Zap, Thermometer, RefreshCw, PlayCircle, Trophy, XCircle } from 'lucide-react';

interface UIOverlayProps {
  gameState: GameState;
  isWaveState: boolean;
  onToggleState: () => void;
  onReset: () => void;
  onNextLevel: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  gameState,
  isWaveState,
  onToggleState,
  onReset,
  onNextLevel,
}) => {
  const { level, epoch, status, timeScale, stardust, requiredStardust, heat, switchCooldown } = gameState;
  
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-12 md:p-16 font-mono text-[#f0f0f0] select-none">
      {/* Top Left: Level */}
      <div className="flex flex-col gap-1 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#555] uppercase tracking-widest font-bold">Sector</span>
          <span className="text-[#00F0FF] text-xl font-black italic">{String(level).padStart(2, '0')}</span>
          <button 
            onClick={onReset}
            className="ml-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors group"
          >
            <RefreshCw className="w-3 h-3 opacity-40 group-hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Top Right: Goal Requirement (Minimal) */}
      <div className="absolute top-16 right-16 text-right pointer-events-auto">
        <div className="flex flex-col items-end gap-1">
          <div className="text-[9px] text-[#555] uppercase tracking-widest">Extraction Quota</div>
          <div className="text-lg font-black tracking-tighter text-[#FFD700]">
            {stardust} / {requiredStardust}
          </div>
        </div>
      </div>

      {/* Center Messages */}
      <div className="absolute inset-x-0 top-1/3 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {status === 'won' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0a0a0a]/95 backdrop-blur-3xl border border-[#FFD700]/30 p-10 rounded-[40px] text-center shadow-[0_30px_100px_rgba(255,215,0,0.15)] pointer-events-auto"
            >
              <Trophy className="w-16 h-16 text-[#FFD700] mx-auto mb-6 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]" />
              <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase text-[#FFD700] italic">Success</h2>
              <div className="space-y-1 mb-8">
                <p className="text-[10px] text-[#777] uppercase tracking-[0.3em]">Harvested: {stardust} units</p>
                <p className="text-[10px] text-cyan-400 uppercase tracking-[0.3em]">Final Entropy: Nominal</p>
              </div>
              <button 
                onClick={onNextLevel}
                className="w-full bg-[#FFD700] hover:scale-105 active:scale-95 text-black font-black py-4 rounded-full transition-all text-xs tracking-[0.3em] uppercase"
              >
                Proceed to Phase {level + 1}
              </button>
            </motion.div>
          )}

          {status === 'lost' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-red-500/30 p-8 rounded-3xl text-center shadow-[0_0_50px_rgba(255,0,0,0.1)] pointer-events-auto"
            >
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-1 tracking-tighter uppercase">Sync Failure</h2>
              <p className="text-[10px] text-[#555] mb-6 uppercase tracking-[0.2em]">State/Phase Mismatch or Insufficient Yield</p>
              <button 
                onClick={onReset}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 text-xs tracking-widest"
              >
                RESTART SECTOR
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Left: Yield & Heat Bars */}
      <div className="flex items-end gap-12 pointer-events-auto">
        <div className="flex flex-col gap-2">
          <div className="text-[9px] tracking-widest text-[#555] font-black uppercase">Harvest Yield</div>
          <div className="w-56 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-200"
              animate={{ width: `${Math.min(100, (stardust / requiredStardust) * 100)}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
          </div>
        </div>

        {/* Heat Meter */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
             <Thermometer className={`w-3 h-3 ${heat > 70 ? 'text-red-500 animate-pulse' : 'text-[#777]'}`} />
             <div className="text-[9px] tracking-widest text-[#555] font-black uppercase">Core Heat</div>
          </div>
          <div className="w-24 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${heat > 80 ? 'bg-red-500' : heat > 50 ? 'bg-orange-500' : 'bg-cyan-500'}`}
              animate={{ width: `${Math.min(100, heat)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Right: State Module */}
      <div className="absolute bottom-16 right-12 md:right-16 pointer-events-auto">
        <div className="relative group">
          {switchCooldown > 0 && (
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] text-cyan-400 font-bold tracking-widest text-center w-32">
              RESETTING: {switchCooldown.toFixed(1)}s
            </div>
          )}
          <button 
            disabled={switchCooldown > 0}
            onClick={onToggleState}
            className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center relative active:scale-95 transition-all ${switchCooldown > 0 ? 'opacity-40 grayscale cursor-not-allowed' : 'opacity-100 group-hover:scale-105'}`}
          >
            <div className="absolute inset-0 rounded-full bg-[#111] shadow-[10px_10px_20px_#000,-5px_-5px_15px_#1a1a1a]" />
            <div className={`absolute inset-2 rounded-full border transition-all duration-500 ${isWaveState ? 'border-[#FF00FF] shadow-[0_0_20px_#FF00FF44]' : 'border-[#00F0FF22] shadow-[0_0_15px_#00F0FF22]'}`} />
            <div className={`z-10 font-bold text-[10px] tracking-tighter transition-colors duration-500 ${isWaveState ? 'text-[#FF00FF]' : 'text-[#00F0FF] opacity-60'}`}>
              {isWaveState ? 'WAVE' : 'PARTICLE'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
