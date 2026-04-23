import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine, PHYSICS_WIDTH, PHYSICS_HEIGHT } from '../game/GameEngine';
import { Vector2D } from '../types';

interface GameCanvasProps {
  level: number;
  onWin: () => void;
  onLoss: () => void;
  engineRef: React.MutableRefObject<GameEngine | null>;
  isDev?: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ level, onWin, onLoss, engineRef, isDev }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragActive, setDragActive] = useState(false); // Only for UI/pointer state
  const dragStartRef = useRef<Vector2D | null>(null);
  const currentDragRef = useRef<Vector2D | null>(null);
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const starsRef = useRef<{x: number, y: number}[]>([]);

  useEffect(() => {
    // Pre-generate stars once
    const stars = [];
    const rng = (seed: number) => {
        let s = seed * 12345.678;
        return (Math.sin(s) * 10000) % 1;
    };
    for (let i = 0; i < 60; i++) {
        stars.push({
            x: Math.abs(rng(i)) * PHYSICS_WIDTH,
            y: Math.abs(rng(i + 0.5)) * PHYSICS_HEIGHT
        });
    }
    starsRef.current = stars;
  }, []);

  const getCanvasCoords = (e: MouseEvent | TouchEvent): Vector2D => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Scale from actual pixels to game physics units
    const x = (clientX - rect.left) * (PHYSICS_WIDTH / rect.width);
    const y = (clientY - rect.top) * (PHYSICS_HEIGHT / rect.height);
    return { x, y };
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D, engine: GameEngine, time: number) => {
    ctx.save();
    
    // Screen Shake Implementation
    if (engine.collided) {
      const shakeAmt = 8;
      ctx.translate((Math.random() - 0.5) * shakeAmt, (Math.random() - 0.5) * shakeAmt);
    }

    ctx.clearRect(0, 0, PHYSICS_WIDTH, PHYSICS_HEIGHT);
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, PHYSICS_WIDTH, PHYSICS_HEIGHT);

    // Draw Particles/Stars in background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    const stars = starsRef.current;
    for (let i = 0; i < stars.length; i++) {
       const star = stars[i];
       ctx.beginPath();
       ctx.arc(star.x, star.y, 1, 0, Math.PI * 2);
       ctx.fill();
    }

    // Draw Objects
    const objects = engine.levelData.objects;
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      
      if (obj.type === 'Planet') {
        const mass = obj.mass || 0;
        let planetColor = '#1a1a1a'; 
        let glowColor = 'rgba(255, 255, 255, 0.05)';
        
        if (mass > 4000) {
            planetColor = '#3a0a0a'; 
            glowColor = 'rgba(255, 50, 50, 0.1)';
        } else if (mass > 2000) {
            planetColor = '#0a1a3a'; 
            glowColor = 'rgba(50, 100, 255, 0.1)';
        }

        // Gravitational Lensing effect
        ctx.save();
        ctx.beginPath();
        const lensRadius = obj.radius * 1.8;
        const lensGrad = ctx.createRadialGradient(obj.pos.x, obj.pos.y, obj.radius, obj.pos.x, obj.pos.y, lensRadius);
        lensGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        lensGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)');
        lensGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = lensGrad;
        ctx.arc(obj.pos.x, obj.pos.y, lensRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.shadowBlur = 40;
        ctx.shadowColor = glowColor;
        const gradient = ctx.createRadialGradient(obj.pos.x - obj.radius*0.3, obj.pos.y - obj.radius*0.3, 0, obj.pos.x, obj.pos.y, obj.radius);
        gradient.addColorStop(0, planetColor);
        gradient.addColorStop(1, '#000');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

      } else if (obj.type === 'Asteroid') {
        ctx.fillStyle = '#111';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (obj.type === 'Stardust' && !obj.collected) {
        ctx.fillStyle = '#FFD700';
        const pulse = 1 + Math.sin(time / 200 + obj.pos.x) * 0.5;
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.type === 'QuantumField') {
        const qTime = time / 500;
        ctx.save();
        ctx.translate(obj.pos.x, obj.pos.y);
        ctx.rotate(qTime);
        
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 10]);
        ctx.beginPath();
        for(let j=0; j<6; j++) {
            const angle = (j / 6) * Math.PI * 2;
            const x = Math.cos(angle) * (obj.radius * (0.8 + Math.sin(qTime * 5 + j) * 0.1));
            const y = Math.sin(angle) * (obj.radius * (0.8 + Math.sin(qTime * 5 + j) * 0.1));
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0, 240, 150, 0.05)';
        ctx.fill();
        ctx.restore();
        ctx.setLineDash([]);
      } else if (obj.type === 'Portal') {
        const portalTime = time / 1000;
        ctx.save();
        ctx.translate(obj.pos.x, obj.pos.y);
        ctx.rotate(portalTime * -1.5); // Rebranded as Wormhole (Vortex)
        
        for(let j=0; j<5; j++) {
          ctx.rotate(Math.PI * 2 / 5);
          const gradient = ctx.createLinearGradient(0, 0, obj.radius, 0);
          gradient.addColorStop(0, 'rgba(150, 0, 255, 0.8)'); // Purple wormhole
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, obj.radius * (1 - j*0.15), 0, Math.PI);
          ctx.stroke();
        }
        ctx.restore();
      } else if (obj.type === 'Nebula') {
        const nTime = time / 2000;
        const pulse = Math.sin(nTime * 2) * 0.05 + 0.1;
        
        const gradient = ctx.createRadialGradient(obj.pos.x, obj.pos.y, 0, obj.pos.x, obj.pos.y, obj.radius);
        gradient.addColorStop(0, `rgba(255, 150, 0, ${pulse + 0.1})`);
        gradient.addColorStop(0.6, `rgba(255, 50, 0, ${pulse * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(obj.pos.x, obj.pos.y, obj.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Gaseous particles
        ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
        for (let k = 0; k < 15; k++) {
            const angle = (nTime * 0.3 + k * (Math.PI / 7.5)) % (Math.PI * 2);
            const r = (obj.radius * 0.7) * (1 + 0.2 * Math.sin(nTime + k));
            ctx.beginPath();
            ctx.arc(obj.pos.x + Math.cos(angle) * r, obj.pos.y + Math.sin(angle) * r, 2, 0, Math.PI * 2);
            ctx.fill();
        }
      }
    }

    // Draw Goal (Enhanced Target)
    const goal = engine.levelData.goalPos;
    const goalCollected = engine.gameState.goalCollected;
    ctx.save();
    ctx.translate(goal.x, goal.y);
    const rotation = time / 800;
    
    // Outer rotating structure
    ctx.strokeStyle = goalCollected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let m=0; m<4; m++) {
        ctx.rotate(Math.PI / 2);
        ctx.moveTo(35, 0);
        ctx.lineTo(35, 15);
        ctx.lineTo(20, 35);
    }
    ctx.stroke();

    // Inner pulsing core
    ctx.rotate(rotation);
    ctx.fillStyle = goalCollected ? '#333' : '#fff';
    ctx.shadowBlur = goalCollected ? 0 : 15;
    ctx.shadowColor = '#FFD700';
    ctx.beginPath();
    ctx.rect(-10, -10, 20, 20);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();

    // Trajectory Visualization
    const dStart = dragStartRef.current;
    const cDrag = currentDragRef.current;

    if (dStart && cDrag && !engine.probe.launched) {
      const launchVelocity = {
        x: (dStart.x - cDrag.x) * 0.04,
        y: (dStart.y - cDrag.y) * 0.04
      };
      
      // Calculate pull vector for visual "rubber band"
      const pullX = (cDrag.x - dStart.x);
      const pullY = (cDrag.y - dStart.y);
      
      // Draw "Rubber Band"
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([2, 4]);
      ctx.moveTo(engine.probe.pos.x, engine.probe.pos.y);
      ctx.lineTo(engine.probe.pos.x + pullX, engine.probe.pos.y + pullY);
      ctx.stroke();
      
      // Draw Aim Circle at touch point
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.arc(engine.probe.pos.x + pullX, engine.probe.pos.y + pullY, 15, 0, Math.PI * 2);
      ctx.fill();

      // Get trajectory points
      const trajectory = engine.getTrajectory(launchVelocity, 200);
      
      // Animated Trajectory (Moving Dots)
      const dashOffset = (-time / 10) % 36;
      
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
      ctx.setLineDash([2, 10]);
      ctx.lineDashOffset = dashOffset;
      ctx.lineWidth = 3;
      for (let pIdx = 0; pIdx < trajectory.length; pIdx++) {
        const pt = trajectory[pIdx];
        if (pIdx % 2 === 0) {
            if (pIdx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
      }
      ctx.stroke();
      ctx.restore();
      
      // Target marker
      if (trajectory.length > 0) {
        const last = trajectory[trajectory.length - 1];
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Developer Solved Path
    if (isDev && engine.levelData.solvedTrajectory) {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.2)';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1;
        const solved = engine.levelData.solvedTrajectory;
        for (let sIdx = 0; sIdx < solved.length; sIdx++) {
            const pt = solved[sIdx];
            if (sIdx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
        ctx.restore();
    }

    // Draw Probe
    const probe = engine.probe;
    const heatFactor = engine.gameState.heat / 100;
    
    // Base color or heat color
    const baseColor = probe.isWaveState ? [255, 0, 255] : [0, 240, 255];
    const heatColor = [255, 50, 0];
    
    const rPart = Math.floor(baseColor[0] + (heatColor[0] - baseColor[0]) * heatFactor);
    const gPart = Math.floor(baseColor[1] + (heatColor[1] - baseColor[1]) * heatFactor);
    const bPart = Math.floor(baseColor[2] + (heatColor[2] - baseColor[2]) * heatFactor);
    const probeColorString = `rgb(${rPart},${gPart},${bPart})`;

    ctx.shadowBlur = 20 + heatFactor * 30;
    ctx.shadowColor = probeColorString;
    ctx.fillStyle = probeColorString;
    ctx.beginPath();
    ctx.arc(probe.pos.x, probe.pos.y, probe.radius, 0, Math.PI * 2);
    ctx.fill();
    
    if (probe.isWaveState) {
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = probeColorString;
        ctx.beginPath();
        ctx.arc(probe.pos.x, probe.pos.y, probe.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }, [level]); // Stable, only rebuild if level (bg stars/objects) changes substantially

  const animate = useCallback((time: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 16.67; // Normalized dt
    lastTimeRef.current = time;

    if (engineRef.current) {
        engineRef.current.update(dt);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) draw(ctx, engineRef.current, time);

        if (engineRef.current.gameState.status === 'won') {
            onWin();
        } else if (engineRef.current.gameState.status === 'lost') {
            onLoss();
        }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [engineRef, draw, onWin, onLoss]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (engineRef.current?.probe.launched) return;
    const pos = getCanvasCoords(e.nativeEvent);
    dragStartRef.current = pos;
    currentDragRef.current = pos;
    setDragActive(true);
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStartRef.current) return;
    const pos = getCanvasCoords(e.nativeEvent);
    currentDragRef.current = pos;
  };

  const handleMouseUp = () => {
    if (!dragStartRef.current || !currentDragRef.current) return;
    const dStart = dragStartRef.current;
    const cDrag = currentDragRef.current;
    const launchVelocity = {
      x: (dStart.x - cDrag.x) * 0.04,
      y: (dStart.y - cDrag.y) * 0.04
    };
    engineRef.current?.launch(launchVelocity);
    dragStartRef.current = null;
    currentDragRef.current = null;
    setDragActive(false);
  };

  return (
    <div 
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-black overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    >
      <canvas
        id="game-canvas"
        ref={canvasRef}
        width={PHYSICS_WIDTH}
        height={PHYSICS_HEIGHT}
        className="max-w-full max-h-full object-contain cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      />
    </div>
  );
};
