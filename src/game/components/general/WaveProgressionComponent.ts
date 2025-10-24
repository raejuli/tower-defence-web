/**
 * Wave Progression Component
 * 
 * Defines how waves evolve and change throughout the game.
 * This is a pure configuration component that describes wave-by-wave
 * changes to spawners, enemy types, and game state.
 * 
 * Architecture:
 * - Each wave can have multiple spawner configurations
 * - Spawners can be added, modified, or removed per wave
 * - Enemy types and stats can change per wave
 * - Fully data-driven for editor configuration
 */

import { Component } from "@raejuli/core-engine-gdk/ecs";

/**
 * Enemy type configuration for a wave
 */
export interface EnemyTypeConfig {
  type: string;           // Enemy type identifier (e.g., 'basic', 'fast', 'tank', 'boss')
  health: number;
  speed: number;
  damage: number;
  reward: number;
  color?: number;         // Optional color override
  size?: number;          // Optional size override
}

/**
 * Spawner configuration for a specific wave
 */
export interface WaveSpawnerConfig {
  id: string;                      // Unique spawner ID
  pathId: string;                  // Which path this spawner uses
  enabled: boolean;                // Whether this spawner is active
  startDelay: number;              // Delay before spawner starts (seconds)
  spawnInterval: number;           // Time between spawns
  
  // What to spawn
  enemyType: string;               // Which enemy type to spawn
  enemyCount: number;              // How many enemies to spawn
  
  // Optional position override (if spawner doesn't exist yet)
  position?: { x: number; y: number };
}

/**
 * Configuration for a single wave
 */
export interface WaveConfig {
  waveNumber: number;              // Which wave this config applies to
  
  // Wave-level settings
  idleDuration: number;            // Time before wave starts
  
  // Spawners for this wave
  spawners: WaveSpawnerConfig[];
  
  // Optional: New enemy types introduced in this wave
  newEnemyTypes?: EnemyTypeConfig[];
  
  // Optional: Special events or modifiers
  modifiers?: {
    globalSpeedMultiplier?: number;
    globalHealthMultiplier?: number;
    globalRewardMultiplier?: number;
  };
}

/**
 * Wave Progression Component
 * 
 * Stores the complete wave progression configuration for a game.
 * This allows designers to define exactly how each wave plays out.
 */
export class WaveProgressionComponent extends Component {
  // All enemy types available in the game
  public enemyTypes: Map<string, EnemyTypeConfig>;
  
  // Wave-by-wave configurations
  public waves: WaveConfig[];
  
  // Default enemy type (fallback)
  public defaultEnemyType: string = 'basic';
  
  // Runtime tracking
  public currentWaveIndex: number = 0;

  constructor(config?: {
    enemyTypes?: EnemyTypeConfig[];
    waves?: WaveConfig[];
    defaultEnemyType?: string;
  }) {
    super();
    
    // Initialize enemy types map
    this.enemyTypes = new Map();
    if (config?.enemyTypes) {
      for (const enemyType of config.enemyTypes) {
        this.enemyTypes.set(enemyType.type, enemyType);
      }
    }
    
    // Set default enemy type if not provided, create it
    if (config?.defaultEnemyType) {
      this.defaultEnemyType = config.defaultEnemyType;
    }
    
    // Ensure default enemy type exists
    if (!this.enemyTypes.has(this.defaultEnemyType)) {
      this.enemyTypes.set(this.defaultEnemyType, {
        type: this.defaultEnemyType,
        health: 100,
        speed: 50,
        damage: 1,
        reward: 25
      });
    }
    
    this.waves = config?.waves || [];
  }

  getType(): string {
    return 'WaveProgression';
  }

  /**
   * Get configuration for a specific wave
   */
  getWaveConfig(waveNumber: number): WaveConfig | null {
    return this.waves.find(w => w.waveNumber === waveNumber) || null;
  }

  /**
   * Get enemy type configuration
   */
  getEnemyType(type: string): EnemyTypeConfig | null {
    return this.enemyTypes.get(type) || null;
  }

  /**
   * Get the current wave configuration
   */
  getCurrentWaveConfig(): WaveConfig | null {
    return this.getWaveConfig(this.currentWaveIndex + 1);
  }

  /**
   * Advance to next wave
   */
  nextWave(): void {
    this.currentWaveIndex++;
  }

  /**
   * Reset to first wave
   */
  reset(): void {
    this.currentWaveIndex = 0;
  }

  /**
   * Get total number of waves
   */
  getTotalWaves(): number {
    return this.waves.length;
  }

  /**
   * Check if all waves are complete
   */
  isComplete(): boolean {
    return this.currentWaveIndex >= this.waves.length;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): any {
    return {
      type: 'WaveProgression',
      data: {
        enemyTypes: Array.from(this.enemyTypes.values()),
        waves: this.waves,
        defaultEnemyType: this.defaultEnemyType
      }
    };
  }
}
