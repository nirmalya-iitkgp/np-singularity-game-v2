import { GameState, LevelData, ProbeState, GameObject, Vector2D, Epoch } from '../types';

// Deterministic PRNG
export function createPRNG(seed: number) {
  let s = seed;
  return function() {
    s = (s * 48271) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const G = 8; // Further reduced for smoother, slower movement
export const PHYSICS_WIDTH = 1600;
export const PHYSICS_HEIGHT = 900;

export class GameEngine {
  gameState: GameState;
  probe: ProbeState;
  levelData: LevelData;
  timeScale: number = 1.0;
  lastDt: number = 1.0;
  lastTeleportTime: number = 0;

  constructor(level: number = 1) {
    this.gameState = {
      level,
      epoch: this.getEpochForLevel(level),
      integrity: 100,
      status: 'preview',
      score: 0,
      stardust: 0,
      requiredStardust: 15 + (level * 5),
      optimumScore: 0,
      timeScale: 1.0,
      heat: 0,
      switchCooldown: 0,
      goalCollected: false,
    };

    this.levelData = this.generateLevel(level);
    this.probe = {
      pos: { ...this.levelData.startPos },
      prevPos: { ...this.levelData.startPos },
      radius: 8,
      isWaveState: false,
      launched: false,
    };
  }

  getEpochForLevel(level: number): Epoch {
    if (level <= 10) return 'Classical';
    if (level <= 20) return 'Quantum';
    if (level <= 30) return 'Relativity';
    return 'Thermal';
  }

  generateLevel(level: number): LevelData {
    const rng = createPRNG(level * 4321 + 7);
    const epoch = this.getEpochForLevel(level);
    
    // Explicit Goal Target for "Target Bonus"
    const goalPos = {
      x: PHYSICS_WIDTH * 0.85,
      y: PHYSICS_HEIGHT * (0.2 + rng() * 0.6),
    };

    let objects: GameObject[] = [];
    let dustPlaced = 0;

    // Obstacle count: 3-5
    const obstacleCount = 4 + Math.min(2, Math.floor(level / 5));

    for (let i = 0; i < obstacleCount; i++) {
        const typeValue = rng();
        let type: GameObject['type'] = 'Planet';

        // Planet in all levels logic
        if (typeValue < 0.3) {
            type = 'Planet';
        } else {
            if (epoch === 'Classical') type = 'Planet';
            else if (epoch === 'Quantum') type = typeValue < 0.6 ? 'QuantumField' : 'Asteroid';
            else if (epoch === 'Relativity') type = typeValue < 0.7 ? 'Portal' : 'Planet';
            else type = typeValue < 0.6 ? 'Planet' : 'Nebula';
        }

        const x = PHYSICS_WIDTH * (0.2 + (i/obstacleCount) * 0.6) + rng() * 50;
        const y = PHYSICS_HEIGHT * (0.15 + rng() * 0.7);

        if (type === 'Planet') {
            const isSingularity = i === 0 && level % 10 === 0;
            const radius = isSingularity ? 80 : 45 + rng() * 25;
            const mass = isSingularity ? 6000 : 1200 + rng() * 1800;
            objects.push({ id: `obj-${i}`, pos: { x, y }, radius, type, mass });

            // Dust rings around planets
            const dustCount = 12 + Math.floor(rng() * 10);
            for (let j = 0; j < dustCount; j++) {
                const angle = (j / dustCount) * Math.PI * 2;
                const dist = radius + 35 + rng() * 45;
                objects.push({
                    id: `dust-${i}-${j}`,
                    pos: { x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist },
                    radius: 4, type: 'Stardust', collected: false
                });
                dustPlaced++;
            }
        } else if (type === 'QuantumField') {
            objects.push({
              id: `qfield-${i}`, pos: { x, y }, radius: 60, type
            });
        } else if (type === 'Asteroid') {
            objects.push({ id: `asteroid-${i}`, pos: { x, y }, radius: 30, type });
            for (let j = 0; j < 5; j++) {
                objects.push({
                    id: `dust-ast-${i}-${j}`,
                    pos: { x: x + (rng() - 0.5) * 100, y: y + (rng() - 0.5) * 100 },
                    radius: 3, type: 'Stardust', collected: false
                });
                dustPlaced++;
            }
        } else if (type === 'Portal') {
            const idA = `portal-${i}-a`; const idB = `portal-${i}-b`;
            objects.push({ id: idA, pos: { x, y }, radius: 28, type: 'Portal', targetId: idB });
            objects.push({ id: idB, pos: { x: x + 250, y: PHYSICS_HEIGHT - y }, radius: 28, type: 'Portal', targetId: idA });
            i++; 
        } else if (type === 'Nebula') {
            objects.push({ id: `nebula-${i}`, pos: { x, y }, radius: 130, type });
        }
    }

    this.gameState.optimumScore = (dustPlaced * 10) + 500;

    return {
      objects,
      startPos: { x: 80, y: PHYSICS_HEIGHT / 2 },
      goalPos,
    };
  }

  // Pure simulation for the generator
  simulateTrajectory(start: Vector2D, velocity: Vector2D, objects: GameObject[], goal: Vector2D): { success: boolean, points: Vector2D[] } {
    let p = { ...start };
    let prev = { x: p.x - velocity.x, y: p.y - velocity.y };
    const points: Vector2D[] = [];
    
    for (let i = 0; i < 400; i++) {
        let ax = 0; let ay = 0;
        for (const obj of objects) {
            if (obj.type === 'Planet' && obj.mass) {
                const dx = obj.pos.x - p.x;
                const dy = obj.pos.y - p.y;
                const dSq = dx*dx + dy*dy;
                const d = Math.sqrt(dSq);
                if (d < obj.radius) return { success: false, points }; // Crash
                const f = (G * obj.mass) / dSq;
                ax += (dx/d) * f; ay += (dy/d) * f;
            }
            if (obj.type === 'Asteroid') {
                const d = Math.sqrt(Math.pow(obj.pos.x - p.x, 2) + Math.pow(obj.pos.y - p.y, 2));
                if (d < obj.radius + 8) return { success: false, points }; // Crash (assuming particle state)
            }
        }

        const nextX = p.x + (p.x - prev.x) + ax;
        const nextY = p.y + (p.y - prev.y) + ay;
        prev = { ...p };
        p = { x: nextX, y: nextY };
        points.push({ ...p });

        if (p.x < 0 || p.x > PHYSICS_WIDTH || p.y < 0 || p.y > PHYSICS_HEIGHT) return { success: false, points };

        const dGoal = Math.sqrt(Math.pow(p.x - goal.x, 2) + Math.pow(p.y - goal.y, 2));
        if (dGoal < 30) return { success: true, points };
    }
    return { success: false, points };
  }

  update(dt: number) {
    if (this.gameState.status !== 'playing' || !this.probe.launched) return;

    // Heat and Cooldown Logic
    if (this.gameState.switchCooldown > 0) {
      this.gameState.switchCooldown -= dt / 60; 
    }

    // Natural Cooling (Faster in Wave State)
    const cooldownRate = this.probe.isWaveState ? 0.3 * dt : 0.08 * dt;
    this.gameState.heat = Math.max(0, this.gameState.heat - cooldownRate);

    if (this.gameState.heat >= 100) {
        this.gameState.status = 'lost';
        return;
    }

    // Fixed internal physics step for stability
    const effectiveDt = dt * 1.0; 
    const dtRatio = effectiveDt / this.lastDt;

    // Verlet Step
    const currentX = this.probe.pos.x;
    const currentY = this.probe.pos.y;
    
    let accX = 0;
    let accY = 0;

    // Gravity
    const objects = this.levelData.objects;
    const len = objects.length;
    for (let i = 0; i < len; i++) {
        const obj = objects[i];
        if (obj.type === 'Planet' && obj.mass) {
            const dx = obj.pos.x - currentX;
            const dy = obj.pos.y - currentY;
            const distSq = dx * dx + dy * dy;
            
            // Gravity with softening to prevent infinite acceleration near core
            const softening = 20;
            const dist = Math.sqrt(distSq + softening * softening);
            const force = (G * obj.mass) / (dist * dist * dist); 
            accX += dx * force;
            accY += dy * force;
        }
    }

    const dtSq = effectiveDt * effectiveDt;
    // Time-Corrected Verlet
    let nextX = currentX + (currentX - this.probe.prevPos.x) * dtRatio + accX * dtSq;
    let nextY = currentY + (currentY - this.probe.prevPos.y) * dtRatio + accY * dtSq;

    // Velocity Capping for stability
    const maxStep = 25;
    const dx = nextX - currentX;
    const dy = nextY - currentY;
    const stepDistSq = dx * dx + dy * dy;
    if (stepDistSq > maxStep * maxStep) {
        const stepDist = Math.sqrt(stepDistSq);
        nextX = currentX + (dx / stepDist) * maxStep;
        nextY = currentY + (dy / stepDist) * maxStep;
    }

    this.probe.prevPos = { x: currentX, y: currentY };
    this.probe.pos = { x: nextX, y: nextY };
    this.lastDt = effectiveDt;

    // Collisions
    this.checkCollisions(effectiveDt);
    
    // Boundaries
    const { pos } = this.probe;

    // ALL BORDERS REFLECT (Elastic, no speed change)
    if (pos.y < 0) {
        this.reflectProbe(0, -1, 1.0); 
        this.probe.pos.y = 1;
        this.gameState.heat += 2;
    } else if (pos.y > PHYSICS_HEIGHT) {
        this.reflectProbe(0, 1, 1.0); 
        this.probe.pos.y = PHYSICS_HEIGHT - 1;
        this.gameState.heat += 2;
    } else if (pos.x < 0) {
        this.reflectProbe(-1, 0, 1.0); 
        this.probe.pos.x = 1;
        this.gameState.heat += 2;
    } else if (pos.x > PHYSICS_WIDTH) {
        this.reflectProbe(1, 0, 1.0); 
        this.probe.pos.x = PHYSICS_WIDTH - 1;
        this.gameState.heat += 2;
    }
  }

  reflectProbe(nx: number, ny: number, multiplier: number = 1.0) {
    const vx = this.probe.pos.x - this.probe.prevPos.x;
    const vy = this.probe.pos.y - this.probe.prevPos.y;
    
    const dot = vx * nx + vy * ny;
    
    // Reflect velocity: v' = v - 2(v.n)n
    const rvx = (vx - 2 * dot * nx) * multiplier;
    const rvy = (vy - 2 * dot * ny) * multiplier;
    
    // In Verlet, velocity is pos - prevPos.
    // If we want new velocity to be rvx, rvy, we must set prevPos relative to current pos.
    this.probe.prevPos = {
        x: this.probe.pos.x - rvx,
        y: this.probe.pos.y - rvy
    };
  }

  checkCollisions(dt: number = 1) {
    const { pos, radius, isWaveState } = this.probe;

    const dxGoal = pos.x - this.levelData.goalPos.x;
    const dyGoal = pos.y - this.levelData.goalPos.y;
    const distToGoalSq = dxGoal * dxGoal + dyGoal * dyGoal;
    
    // Target gives +20 yield once per level
    if (distToGoalSq < (radius + 35) * (radius + 35)) {
      if (!this.gameState.goalCollected) {
        this.gameState.stardust += 20;
        this.gameState.score += 2000;
        this.gameState.goalCollected = true;
      }
    }

    // Win check (manual finish condition needed? User said goal is payout now)
    // I'll keep the Win condition as reaching enough stardust and hitting goal
    // OR just hitting enough stardust? User didn't specify win change, 
    // but goal is now payout. Let's make the goal also trigger win IF quota met.
    if (distToGoalSq < (radius + 35) * (radius + 35) && this.gameState.stardust >= this.gameState.requiredStardust) {
       this.gameState.status = 'won';
       return;
    }

    const objects = this.levelData.objects;
    const len = objects.length;
    for (let i = 0; i < len; i++) {
      const obj = objects[i];
      const dx = pos.x - obj.pos.x;
      const dy = pos.y - obj.pos.y;
      const distSq = dx * dx + dy * dy;
      const combinedRadius = radius + obj.radius;

      if (distSq < combinedRadius * combinedRadius) {
        // Thermal Nebula logic - increases stardust collection for WAVE
        if (obj.type === 'Nebula' && isWaveState) {
           const rate = 1.0 * dt / 60; // Better yield in nebula for wave
           this.gameState.stardust += rate;
           this.gameState.score += rate * 100;
        }

        // Quantum Field - multiplies PARTICLE
        if (obj.type === 'QuantumField' && !isWaveState) {
           // Burst of score/dust
           this.gameState.stardust += 5 * dt / 60;
           this.gameState.score += 1000 * dt / 200;
        }

        // Stardust Collection
        if (obj.type === 'Stardust' && !obj.collected) {
           let canCollect = !isWaveState;
           if (isWaveState && this.gameState.epoch === 'Quantum' && Math.random() < 0.1) {
             canCollect = true; 
           }

           if (canCollect) {
             obj.collected = true;
             let yield_val = 1;
             if (this.gameState.epoch === 'Relativity') {
               yield_val = Math.floor(1 + (1 - this.timeScale) * 6);
             }
             this.gameState.stardust += yield_val;
             this.gameState.score += yield_val * 10;
           }
        }

        // Planet/Asteroid Collision -> Bounce depends on Mass
        if (obj.type === 'Planet' || obj.type === 'Asteroid') {
          if (distSq < (combinedRadius * 0.95) * (combinedRadius * 0.95)) {
             const dist = Math.sqrt(distSq);
             // Bounce with no speed change (multiplier 1.0)
             this.reflectProbe(dx/dist, dy/dist, 1.0);
             this.triggerCollision();
             
             // Heat penalty on physical collision
             if (!this.probe.isWaveState) {
                this.gameState.heat += 8; 
             } else {
                this.gameState.heat += 2;
             }

             // Prevent multiple frames of collision by moving probe slightly out
             const overstep = combinedRadius - dist + 2;
             const invDist = 1 / dist;
             this.probe.pos.x += dx * invDist * overstep;
             this.probe.pos.y += dy * invDist * overstep;
             return;
          }
        }

        if (obj.type === 'Portal' && obj.targetId) {
            const now = Date.now();
            if (now - this.lastTeleportTime > 800) {
                const target = objects.find(o => o.id === obj.targetId);
                if (target) {
                    const vx = this.probe.pos.x - this.probe.prevPos.x;
                    const vy = this.probe.pos.y - this.probe.prevPos.y;
                    this.probe.pos = { x: target.pos.x, y: target.pos.y };
                    this.probe.prevPos = { x: target.pos.x - vx, y: target.pos.y - vy };
                    this.lastTeleportTime = now;
                }
            }
        }
      }
    }
  }

  // Effect Trigger for Visual Interface
  collided: boolean = false;
  triggerCollision() {
    this.collided = true;
    setTimeout(() => { this.collided = false; }, 200);
  }

  toggleState() {
    if (this.gameState.switchCooldown > 0) return;
    this.probe.isWaveState = !this.probe.isWaveState;
    this.gameState.switchCooldown = 3; // 3 second cooldown
  }

  launch(velocity: Vector2D) {
    this.probe.launched = true;
    this.gameState.status = 'playing';
    this.probe.prevPos = {
      x: this.probe.pos.x - velocity.x,
      y: this.probe.pos.y - velocity.y,
    };
  }

  getTrajectory(velocity: Vector2D, points: number = 200): Vector2D[] {
    const trajectory: Vector2D[] = [];
    let tempX = this.probe.pos.x;
    let tempY = this.probe.pos.y;
    let prevX = tempX - velocity.x;
    let prevY = tempY - velocity.y;

    const objects = this.levelData.objects;
    const len = objects.length;
    const goalX = this.levelData.goalPos.x;
    const goalY = this.levelData.goalPos.y;

    for (let i = 0; i < points; i++) {
        let accX = 0;
        let accY = 0;

        for (let j = 0; j < len; j++) {
            const obj = objects[j];
            if (obj.type === 'Planet' && obj.mass) {
                const dx = obj.pos.x - tempX;
                const dy = obj.pos.y - tempY;
                const distSq = dx * dx + dy * dy;
                if (distSq > obj.radius * obj.radius) {
                    const dist = Math.sqrt(distSq);
                    const force = (G * obj.mass) / (distSq * dist);
                    accX += dx * force;
                    accY += dy * force;
                }
            }
        }

        const nextX = tempX + (tempX - prevX) + accX;
        const nextY = tempY + (tempY - prevY) + accY;

        prevX = tempX;
        prevY = tempY;
        tempX = nextX;
        tempY = nextY;
        
        trajectory.push({ x: tempX, y: tempY });

        if (tempX < -200 || tempX > PHYSICS_WIDTH + 200 || tempY < -200 || tempY > PHYSICS_HEIGHT + 200) break;
        
        const dxGoal = tempX - goalX;
        const dyGoal = tempY - goalY;
        if (dxGoal * dxGoal + dyGoal * dyGoal < 900) break;
    }

    return trajectory;
  }

  reset() {
    this.gameState.status = 'preview';
    this.gameState.integrity = 100;
    this.gameState.heat = 0;
    this.gameState.stardust = 0;
    this.gameState.goalCollected = false;
    this.gameState.switchCooldown = 0;
    this.probe = {
      pos: { ...this.levelData.startPos },
      prevPos: { ...this.levelData.startPos },
      radius: 8,
      isWaveState: false,
      launched: false,
    };
  }
}
