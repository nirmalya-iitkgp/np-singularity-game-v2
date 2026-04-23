export type Epoch = 'Classical' | 'Quantum' | 'Relativity' | 'Thermal';

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  pos: Vector2D;
  radius: number;
  type: 'Planet' | 'Asteroid' | 'Goal' | 'Sensor' | 'Nebula' | 'QuantumField' | 'Portal' | 'Stardust';
  mass?: number; // For gravity
  angle?: number; // For sensors
  beamWidth?: number; // For sensors
  targetId?: string; // For Portals
  collected?: boolean;
}

export interface ProbeState {
  pos: Vector2D;
  prevPos: Vector2D;
  radius: number;
  isWaveState: boolean;
  launched: boolean;
}

export interface GameState {
  level: number;
  epoch: Epoch;
  integrity: number;
  status: 'playing' | 'preview' | 'won' | 'lost';
  score: number;
  stardust: number;
  requiredStardust: number;
  optimumScore: number;
  timeScale: number;
  heat: number;
  switchCooldown: number;
  goalCollected: boolean;
}

export interface LevelData {
  objects: GameObject[];
  startPos: Vector2D;
  goalPos: Vector2D;
  solvedTrajectory?: Vector2D[];
}
