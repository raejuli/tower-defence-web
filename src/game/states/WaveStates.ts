/**
 * Game States - Wave States for automatic wave management
 */

import { State } from '../../engine/state/StateMachine';
import { TowerDefenceGame } from '../TowerDefenceGame';

export class WaveIdleState extends State<TowerDefenceGame> {
  onEnter(previousState?: State<TowerDefenceGame>): void {
    console.log(`Wave ${this.context.waveState.currentWave} complete! Next wave in ${this.context.waveState.config.idleDuration} seconds...`);
    this.context.waveState.waveState = 'idle';
    this.context.waveState.idleTimer = this.context.waveState.config.idleDuration;
    this.context.gameState.wave++;
  }

  onUpdate(deltaTime: number): void {
    this.context.waveState.idleTimer -= deltaTime;
    
    if (this.context.waveState.idleTimer <= 0) {
      // Start next wave
      this.context.waveStateMachine.setState('spawning');
    }
  }

  onExit(nextState?: State<TowerDefenceGame>): void {
    console.log('Starting next wave...');
  }
}

export class WaveSpawningState extends State<TowerDefenceGame> {
  onEnter(previousState?: State<TowerDefenceGame>): void {
    // Start wave - update model data
    this.context.waveState.currentWave++;
    this.context.waveState.enemiesSpawned = 0;
    
    // Calculate enemies for this wave
    const enemiesForWave = Math.floor(
      this.context.waveState.config.enemiesPerWave + 
      (this.context.waveState.currentWave - 1) * 2
    );
    this.context.waveState.enemiesRemaining = enemiesForWave;
    this.context.waveState.waveState = 'spawning';
    this.context.waveState.spawnTimer = 0;
    
    console.log(`Wave ${this.context.waveState.currentWave} starting! ${enemiesForWave} enemies incoming!`);
  }

  onUpdate(deltaTime: number): void {
    const enemiesForWave = Math.floor(
      this.context.waveState.config.enemiesPerWave + 
      (this.context.waveState.currentWave - 1) * 2
    );
    
    if (this.context.waveState.enemiesSpawned >= enemiesForWave) {
      // All enemies spawned, move to active state
      this.context.waveStateMachine.setState('active');
      return;
    }

    this.context.waveState.spawnTimer += deltaTime;
    if (this.context.waveState.spawnTimer >= this.context.waveState.config.spawnInterval) {
      this.context.waveState.spawnTimer = 0;
      this.context.spawnEnemy();
      this.context.waveState.enemiesSpawned++;
    }
  }
}

export class WaveActiveState extends State<TowerDefenceGame> {
  onEnter(previousState?: State<TowerDefenceGame>): void {
    this.context.waveState.waveState = 'active';
  }

  onUpdate(deltaTime: number): void {
    // Check if all enemies are dead
    const enemies = this.context.world.getEntitiesWithComponents(['Enemy']);
    this.context.waveState.enemiesRemaining = enemies.length;
    
    // Check if wave is complete
    const enemiesForWave = Math.floor(
      this.context.waveState.config.enemiesPerWave + 
      (this.context.waveState.currentWave - 1) * 2
    );
    
    if (this.context.waveState.enemiesSpawned >= enemiesForWave && 
        this.context.waveState.enemiesRemaining === 0) {
      // All enemies defeated, go to idle state
      this.context.waveStateMachine.setState('idle');
    }
  }
}
