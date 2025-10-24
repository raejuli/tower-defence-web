/**
 * Wave Spawner Component - Data for wave-based enemy spawning
 * 
 * This is a pure data component. The state machine (via WaveSpawnerStates)
 * handles the actual spawning logic and state transitions.
 * 
 * Usage:
 * 1. Add WaveSpawnerComponent to an entity
 * 2. Add StateMachineComponent with WaveSpawnerStates
 * 3. The StateMachineSystem will update the spawner automatically
 */

import { Component } from '@raejuli/core-engine-gdk/ecs';

export interface WaveConfiguration {
  maxWaves: number;              // Total number of waves
  enemiesPerWave: number;        // Enemies to spawn per wave
  spawnInterval: number;         // Time between enemy spawns (seconds)
  idleDuration: number;          // Time to wait before starting next wave (seconds)
  waveStartDelay?: number;       // Delay before this spawner starts in a wave (seconds, default: 0)
  
  // Enemy stats for this spawner
  enemyHealth: number;
  enemySpeed: number;
  enemyDamage: number;
  enemyReward: number;
  
  // Optional: Path entity ID for enemies to follow (string from JSON, number at runtime)
  pathEntityId?: string | number;
}

/**
 * WaveSpawnerComponent - Pure data component for wave spawning
 * State transitions are handled by StateMachineComponent with WaveSpawnerStates:
 * - idle: Waiting before starting next wave
 * - spawning: Actively spawning enemies
 * - waiting: Wave complete, cooldown before next wave
 * - complete: All waves finished
 */
export class WaveSpawnerComponent extends Component {
  // Configuration
  public readonly config: WaveConfiguration;
  
  // Wave tracking
  public currentWave: number = 0;
  public enemiesSpawnedThisWave: number = 0;
  public totalEnemiesSpawned: number = 0;
  
  // Timers (managed by state machine states)
  public spawnTimer: number = 0;     // Time since last spawn
  public idleTimer: number = 0;      // Time spent in idle state
  public waveDelayTimer: number = 0; // Time waiting for wave start delay

  constructor(config: WaveConfiguration) {
    super();
    this.config = config;
  }

  public getType(): string {
    return 'WaveSpawner';
  }

  /**
   * Check if all waves are complete
   */
  public isComplete(): boolean {
    return this.currentWave >= this.config.maxWaves;
  }

  /**
   * Get progress through current wave (0-1)
   */
  public getProgress(): number {
    if (this.config.enemiesPerWave === 0) return 1;
    return this.enemiesSpawnedThisWave / this.config.enemiesPerWave;
  }

  /**
   * Reset spawner to initial state
   */
  public reset(): void {
    this.currentWave = 0;
    this.enemiesSpawnedThisWave = 0;
    this.totalEnemiesSpawned = 0;
    this.spawnTimer = 0;
    this.idleTimer = 0;
    this.waveDelayTimer = 0;
  }

  public toString(): string {
    return `Wave Spawner
Wave: ${this.currentWave}/${this.config.maxWaves}
Enemies: ${this.enemiesSpawnedThisWave}/${this.config.enemiesPerWave}
Total Spawned: ${this.totalEnemiesSpawned}
Progress: ${(this.getProgress() * 100).toFixed(1)}%`;
  }
}
