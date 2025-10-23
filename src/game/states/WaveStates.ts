/**
 * Game States - Wave States
 * BEHAVIOUR TREE: Defines wave progression rules
 */

import { State } from '../../engine/state/StateMachine';
import { TowerDefenceGame } from '../TowerDefenceGame';
import { ServiceLocator } from '../../engine/services/ServiceLocator';
import { EnemyService } from '../services/EnemyService';

/**
 * WAVE IDLE STATE BEHAVIOUR TREE
 * 
 * This state defines the break period between waves.
 * 
 * Flow:
 * 1. RULE: Display wave complete message
 * 2. RULE: Wait for configured duration (default 10 seconds)
 * 3. RULE: Automatically start next wave when timer expires
 */
export class WaveIdleState extends State<TowerDefenceGame> {
  public onEnter(previousState?: State<TowerDefenceGame>): void {
    console.log(`🎉 Wave ${this.context.waveState.currentWave} complete! Next wave in ${this.context.waveState.config.idleDuration} seconds...`);
    
    // Update wave state data
    this.context.waveState.waveState = 'idle';
    this.context.waveState.idleTimer = this.context.waveState.config.idleDuration;
    this.context.gameState.wave++;
  }

  /**
   * IDLE STATE LOOP
   * Count down timer until next wave starts
   */
  public onUpdate(deltaTime: number): void {
    // ============================================================
    // RULE 1: Count down idle timer
    // ============================================================
    this.context.waveState.idleTimer -= deltaTime;
    
    // ============================================================
    // RULE 2: When timer expires → Start next wave
    // ============================================================
    if (this.context.waveState.idleTimer <= 0) {
      this.context.waveStateMachine.setState('spawning');
    }
  }

  public onExit(nextState?: State<TowerDefenceGame>): void {
    console.log('⚔️ Starting next wave...');
  }
}

/**
 * WAVE SPAWNING STATE BEHAVIOUR TREE
 * 
 * This state defines how enemies spawn during a wave.
 * 
 * Flow:
 * 1. RULE: Calculate enemy count = base + (wave * 2)
 * 2. RULE: Spawn enemies at regular intervals
 * 3. RULE: When all enemies spawned → Transition to active state
 */
export class WaveSpawningState extends State<TowerDefenceGame> {
  public onEnter(previousState?: State<TowerDefenceGame>): void {
    // ============================================================
    // RULE 1: Initialize wave - calculate enemy count
    // GAME RULE: More enemies each wave (base + wave * 2)
    // ============================================================
    this.context.waveState.currentWave++;
    this.context.waveState.enemiesSpawned = 0;
    
    const enemiesForWave = Math.floor(
      this.context.waveState.config.enemiesPerWave + 
      (this.context.waveState.currentWave - 1) * 2
    );
    this.context.waveState.enemiesRemaining = enemiesForWave;
    this.context.waveState.waveState = 'spawning';
    this.context.waveState.spawnTimer = 0;
    
    console.log(`🌊 Wave ${this.context.waveState.currentWave} starting! ${enemiesForWave} enemies incoming!`);
  }

  /**
   * SPAWNING STATE LOOP
   * Spawn enemies at regular intervals until all are spawned
   */
  public onUpdate(deltaTime: number): void {
    const enemiesForWave = Math.floor(
      this.context.waveState.config.enemiesPerWave + 
      (this.context.waveState.currentWave - 1) * 2
    );
    
    // ============================================================
    // RULE 1: Check if all enemies have been spawned
    // ============================================================
    if (this.context.waveState.enemiesSpawned >= enemiesForWave) {
      // All enemies spawned, transition to active state
      this.context.waveStateMachine.setState('active');
      return;
    }

    // ============================================================
    // RULE 2: Spawn enemies at regular intervals
    // GAME RULE: New enemy every X seconds (configured spawn interval)
    // ============================================================
    this.context.waveState.spawnTimer += deltaTime;
    if (this.context.waveState.spawnTimer >= this.context.waveState.config.spawnInterval) {
      this.context.waveState.spawnTimer = 0;
      
      // Spawn enemy via service
      const enemyService = ServiceLocator.get<EnemyService>('EnemyService');
      enemyService.spawnEnemy();
      this.context.waveState.enemiesSpawned++;
    }
  }
}

/**
 * WAVE ACTIVE STATE BEHAVIOUR TREE
 * 
 * This state monitors the wave until all enemies are defeated.
 * 
 * Flow:
 * 1. RULE: Count remaining enemies
 * 2. RULE: When all enemies spawned AND all defeated → Wave complete
 * 3. RULE: Transition back to idle state for next wave
 */
export class WaveActiveState extends State<TowerDefenceGame> {
  public onEnter(previousState?: State<TowerDefenceGame>): void {
    this.context.waveState.waveState = 'active';
    console.log('⚔️ Wave active - defeat all enemies!');
  }

  /**
   * ACTIVE STATE LOOP
   * Monitor enemy count and check for wave completion
   */
  public onUpdate(deltaTime: number): void {
    // ============================================================
    // RULE 1: Track remaining enemy count
    // ============================================================
    const enemies = this.context.world.getEntitiesWithComponents(['Enemy']);
    this.context.waveState.enemiesRemaining = enemies.length;
    
    // ============================================================
    // RULE 2: Check wave completion conditions
    // GAME RULE: Wave complete when all enemies spawned AND all defeated
    // ============================================================
    const enemiesForWave = Math.floor(
      this.context.waveState.config.enemiesPerWave + 
      (this.context.waveState.currentWave - 1) * 2
    );
    
    if (this.context.waveState.enemiesSpawned >= enemiesForWave && 
        this.context.waveState.enemiesRemaining === 0) {
      // All enemies defeated - wave complete!
      this.context.waveStateMachine.setState('idle');
    }
  }

  public onExit(nextState?: State<TowerDefenceGame>): void {
    console.log('✅ Wave complete!');
  }
}
