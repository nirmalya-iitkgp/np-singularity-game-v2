import React from 'react';
import { motion } from 'motion/react';
import { Zap, Target, Box, Activity, Layout, Layers, Eye, RefreshCw, Thermometer } from 'lucide-react';

interface MenuOverlayProps {
  onStart: () => void;
}

export const MenuOverlay: React.FC<MenuOverlayProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/40 backdrop-blur-xl overflow-y-auto">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[30vw] h-[30vw] bg-fuchsia-500/5 rounded-full blur-[100px] animate-pulse" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full flex flex-col items-center gap-12 relative z-10 py-12"
      >
        {/* Title Block */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ letterSpacing: '0.1em', opacity: 0 }}
            animate={{ letterSpacing: '0.5em', opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="text-[10px] font-black text-cyan-400 uppercase mb-4"
          >
            Temporal Synchronization Active
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-thin tracking-tighter text-white/90">
            SINGULARITY<span className="font-black text-cyan-400">LOOP</span>
          </h1>
          <p className="text-[#888] text-[10px] font-medium tracking-[0.4em] uppercase max-w-md mx-auto leading-relaxed">
            Theoretical Correction of the 4 Universal State Epochs
          </p>
        </div>

        {/* Start Button - The Core Action */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="relative group p-[2px] rounded-full overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-cyan-500 animate-[spin_3s_linear_infinite] opacity-40 group-hover:opacity-100 transition-opacity" />
          <div className="relative bg-[#050505] rounded-full px-12 py-6 flex items-center gap-4 border border-white/10">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-white text-sm font-black tracking-[0.3em] uppercase">Initialize Injection</span>
            <Target className="w-5 h-5 text-fuchsia-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </motion.button>

        {/* Grid Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* Mission: Harvest */}
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] backdrop-blur-md space-y-6">
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Mission: Stardust Harvest</h2>
            </div>
            <p className="text-[11px] text-[#777] font-medium italic leading-relaxed">
              "Extract high-density cosmic signatures from gravity wells. Exiting the sector via border impact will finalize the transfer—if the quota is met."
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-[9px] font-bold text-[#FFD700] uppercase">Planetary 2x Bounce</div>
                <div className="text-[8px] text-[#555] uppercase leading-tight">Collide with planets to reflect at double speed.</div>
              </div>
              <div className="space-y-1">
                <div className="text-[9px] font-bold text-fuchsia-400 uppercase">20s Margin Switch</div>
                <div className="text-[8px] text-[#555] uppercase leading-tight">Match Mirror-Wave or Spring-Particle to exit.</div>
              </div>
            </div>
          </div>

          {/* Spacetime Catalog */}
          <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[32px] backdrop-blur-md space-y-6">
            <div className="flex items-center gap-3">
              <Box className="w-4 h-4 text-orange-400" />
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Temporal Perks</h2>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { name: 'Quantum', desc: 'Yield-chance in Wave-Phase', icon: <Zap className="w-3 h-3 text-cyan-500" /> },
                { name: 'Relativity', desc: 'High-speed bonus yield', icon: <Activity className="w-3 h-3 text-fuchsia-600" /> },
                { name: 'Thermal', desc: 'Solar Flare harvesting', icon: <Activity className="w-3 h-3 text-orange-400" /> },
                { name: 'Classical', desc: 'Newtonian radius boost', icon: <Layout className="w-3 h-3 text-green-400" /> },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-[2px]">{item.icon}</div>
                  <div>
                    <div className="text-[9px] font-bold text-[#999] uppercase">{item.name}</div>
                    <div className="text-[8px] text-[#555] leading-none uppercase">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Epoch Timeline - Horizontal Rail */}
        <div className="w-full max-w-3xl overflow-x-hidden border-y border-white/5 py-6">
          <div className="flex justify-between items-center px-4">
              {[
                { name: 'Classical', range: '01..10' },
                { name: 'Quantum', range: '11..20' },
                { name: 'Relativity', range: '21..30' },
                { name: 'Thermal', range: '31..40' },
              ].map((epoch, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="text-[8px] font-mono text-[#333] mb-1">{epoch.range}</div>
                  <div className="text-[10px] font-black text-[#666] uppercase tracking-[0.2em]">{epoch.name}</div>
                </div>
              ))}
          </div>
        </div>

        {/* Control Signal Footer */}
        <div className="flex gap-12 text-[8px] font-bold text-[#444] uppercase tracking-[0.3em]">
          <span>LMB: Trajectory Logic</span>
          <span>SPACE: Phase Synchronize</span>
        </div>
      </motion.div>
    </div>
  );
};
