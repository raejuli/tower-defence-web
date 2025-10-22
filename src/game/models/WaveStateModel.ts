/**
 * Game Models - Wave State
 */

export interface WaveConfiguration {
  enemiesPerWave: number;
  enemyHealth: number;
  enemySpeed: number;
  enemyDamage: number;
  enemyReward: number;
  spawnInterval: number;
  idleDuration: number;
}

export class WaveStateModel {
  public currentWave: number = 0;
  public enemiesSpawned: number = 0;
  public enemiesRemaining: number = 0;
  public waveState: 'idle' | 'spawning' | 'active' = 'idle';
  public idleTimer: number = 0;
  public spawnTimer: number = 0;
  public readonly config: WaveConfiguration;

  constructor(config: WaveConfiguration) {
    this.config = config;
  }
}
