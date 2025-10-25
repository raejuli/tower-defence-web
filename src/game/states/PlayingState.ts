/**
 * Game States - Playing State
 * BEHAVIOUR TREE: Contains readable game rules and flow control
 * This state defines HOW the game plays - the actual game rules
 */

import { State } from '@raejuli/core-engine-gdk/state';
import { TowerDefenceGame } from '../TowerDefenceGame';
import { ServiceLocator } from '@raejuli/core-engine-gdk/services';
import { ITowerService, IPlacementService, IGameStateService } from '../services/IGameServices';
import { StateMachineSystem } from '@raejuli/core-engine-gdk/systems';
import { TowerSystem } from '../systems/TowerSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { PathFollowingSystem } from '../systems/PathFollowingSystem';
import { FlamethrowerSystem } from '../systems/FlamethrowerSystem';
import { TowerSelectionSystem } from '../systems/TowerSelectionSystem';
import { StateMachineComponent } from '@raejuli/core-engine-gdk/components';
import { EnemyComponent } from '../components/enemy/EnemyComponent';
import { WaveSpawnerComponent } from '../components/enemy/WaveSpawnerComponent';
import { PlacementState } from './PlacementState';
import { UIService } from '../services/UIService';
import { ClickHandlerSystem } from '../../engine';

/**
 * PLAYING STATE BEHAVIOUR TREE
 * 
 * This is the high-level game loop that defines the rules of tower defense gameplay.
 * Each step is readable and represents a game rule that could be edited visually.
 * 
 * Flow:
 * 1. Update all entity AI (enemy states)
 * 2. Towers find and shoot at enemies
 * 3. Projectiles move and damage enemies
 * 4. RULE: When enemy dies → Award money and score
 * 5. Enemies walk the path
 * 6. RULE: When enemy reaches end → Lose lives
 * 7. Clean up dead entities
 * 8. Update visuals
 */
export class PlayingState extends State<TowerDefenceGame> {
  private _towerSelectedHandler: ((data: any) => void) | null = null;
  private _towerDeselectedHandler: (() => void) | null = null;
  private _waveAllCompleteHandler: ((data: any) => void) | null = null;

  public onEnter(previousState?: State<TowerDefenceGame>): void {
    const ui = ServiceLocator.get<UIService>('UI').ui;
    console.log('🎮 Game is playing - Combat rules active');
    
    // Register UI event listeners for tower selection
    this._towerSelectedHandler = (data: any) => {
      const state = this._context.gameStateMachine.getState('placement') as PlacementState;
      state.setSelectedTowerType(data.towerType, data.range);
      this._context.gameStateMachine.setState('placement');
    };
    
    this._towerDeselectedHandler = () => {
      const towerService = ServiceLocator.get<ITowerService>('TowerService');
      towerService.deselectAllTowers();
      ui.hideTowerDetails();
      
      // Update tower graphics immediately to hide range circles
      const towerSelectionSystem = this.context.world.getSystem(TowerSelectionSystem);
      if (towerSelectionSystem) {
        towerSelectionSystem.updateTowerGraphics();
      }
    };
    
    // Listen for wave completion events from spawner entities
    this._waveAllCompleteHandler = (data: any) => {
      console.log(`🎉 Spawner ${data.spawnerName} completed all waves!`);
      // Check if all spawners are complete and no enemies remain
      this._checkWaveBasedVictory();
    };
    
    ui.on('towerSelected', this._towerSelectedHandler);
    ui.on('towerDeselected', this._towerDeselectedHandler);
    this.context.engine.events.on('wave:allComplete', this._waveAllCompleteHandler);
  }

  /**
   * MAIN GAME LOOP - This defines the rules of tower defense
   * Each section represents a game rule that would be a node in a visual behaviour tree
   */
  public onUpdate(deltaTime: number): void {
    const world = this.context.world;
    const gameState = ServiceLocator.get<IGameStateService>('GameStateService');

    // ============================================================
    // RULE 2: Towers Attack - Towers target and shoot enemies
    // ============================================================
    const towerSystem = world.getSystem(TowerSystem);
    if (towerSystem) {
      const enemies = world.getEntitiesWithComponents(['Enemy', 'Transform']);
      
      // Update tower cooldowns
      towerSystem.updateCooldowns(deltaTime);
      
      // Towers automatically target and shoot nearest enemy in range
      towerSystem.processTowers(enemies);
    }

    // ============================================================
    // RULE 2B: Flamethrower Towers - Apply cone-based damage
    // ============================================================
    const flamethrowerSystem = world.getSystem(FlamethrowerSystem);
    if (flamethrowerSystem) {
      const enemies = world.getEntitiesWithComponents(['Enemy', 'Transform']);
      flamethrowerSystem.processFlamethrowers(deltaTime, enemies);
    }

    // ============================================================
    // RULE 3: Projectiles Damage Enemies
    // GAME RULE: When projectile hits enemy → Damage enemy
    // GAME RULE: When enemy dies → Award money and score
    // GAME RULE: When projectile hits → Remove projectile (unless chaining)
    // ============================================================
    const projectileSystem = world.getSystem(ProjectileSystem);
    if (projectileSystem) {
      const hits = projectileSystem.processProjectiles(deltaTime);
      
      for (const hit of hits) {
        if (hit.hit && hit.target) {
          // GAME RULE: Enemy killed → Award reward
          if (hit.killed) {
            world.removeEntity(hit.target);
            gameState.addMoney(hit.reward);
            gameState.addScore(hit.reward);
          }

          // GAME RULE: Projectile consumed unless it can chain to another target
          if (!hit.canChain) {
            world.removeEntity(hit.projectile);
          }
        } else if (hit.targetDead) {
          // GAME RULE: Orphaned projectiles are removed
          world.removeEntity(hit.projectile);
        }
      }
    }

    // ============================================================
    // RULE 4: Enemies Walk Path
    // GAME RULE: When enemy reaches end → Player loses lives
    // ============================================================
    const pathFollowingSystem = world.getSystem(PathFollowingSystem);
    if (pathFollowingSystem) {
      const pathResults = pathFollowingSystem.processEnemies(deltaTime);
      
      for (const result of pathResults) {
        if (result.reachedEnd) {
          // GAME RULE: Enemy reached end → Lose lives based on enemy damage
          gameState.loseLife(result.damage);
          world.removeEntity(result.enemy);
        }
      }
    }

    // ============================================================
    // RULE 5: Clean Up Dead Enemies
    // GAME RULE: Enemies in "dead" state award rewards and are removed
    // (Handles enemies killed by status effects, state transitions, etc.)
    // ============================================================
    const deadEnemies = world.getEntitiesWithComponents(['Enemy', 'StateMachine']);
    for (const enemy of deadEnemies) {
      const stateMachine = enemy.getComponent('StateMachine') as StateMachineComponent;
      if (stateMachine?.stateMachine.getCurrentStateName() === 'dead') {
        const enemyComp = enemy.getComponent('Enemy') as EnemyComponent;
        if (enemyComp) {
          gameState.addMoney(enemyComp.stats.reward);
          gameState.addScore(enemyComp.stats.reward);
        }
        world.removeEntity(enemy);
      }
    }

    // ============================================================
    // RULE 6: Update Visual Feedback
    // ============================================================
    const towerSelectionSystem = world.getSystem(TowerSelectionSystem);
    if (towerSelectionSystem) {
      towerSelectionSystem.updateTowerGraphics();
    }

    // ============================================================
    // RULE 7: Check Win/Lose Conditions
    // ============================================================
    this._checkGameConditions();
  }

  /**
   * RULE: Check if the player has won or lost
   */
  private _checkGameConditions(): void {
    // RULE: If lives reach 0 → Game Over
    if (this.context.gameState.lives <= 0) {
      console.log('💀 Lives depleted! Transitioning to Game Over');
      this.context.gameStateMachine.setState('gameOver');
      return;
    }

    // Check for victory condition
    this._checkVictoryCondition();
  }

  /**
   * RULE: Check victory condition for both wave systems
   */
  private _checkVictoryCondition(): void {
    // Check if scene uses WaveProgressionComponent
    const progressionEntities = this.context.world.getEntitiesWithComponents(['WaveProgression']);
    
    if (progressionEntities.length > 0) {
      // Use WaveProgressionComponent victory check
      const progression = progressionEntities[0].getComponent('WaveProgression') as any;
      const activeEnemies = this.context.world.getEntitiesWithComponents(['Enemy']).length;
      
      if (progression && progression.isComplete() && activeEnemies === 0) {
        console.log(`🎉 All waves in progression completed and no enemies remain! Victory!`);
        this.context.gameStateMachine.setState('gameWin');
      }
    } else {
      // Use original WaveSpawner victory check
      this._checkWaveBasedVictory();
    }
  }

  /**
   * RULE: Check wave-based victory for entity spawners
   * Called when spawners emit wave:allComplete event
   */
  private _checkWaveBasedVictory(): void {
    // Get all spawner entities
    const spawners = this.context.world.getEntitiesWithComponents(['WaveSpawner']);
    
    // Check if all spawners are complete
    const allComplete = spawners.every(spawner => {
      const spawnerComp = spawner.getComponent('WaveSpawner') as WaveSpawnerComponent;
      return spawnerComp && spawnerComp.isComplete();
    });
    
    // Check if no enemies remain
    const activeEnemies = this.context.world.getEntitiesWithComponents(['Enemy']).length;
    
    if (allComplete && activeEnemies === 0) {
      console.log(`🎉 All spawners completed and no enemies remain! Victory!`);
      this.context.gameStateMachine.setState('gameWin');
    }
  }

  public onExit(nextState?: State<TowerDefenceGame>): void {
    console.log('⏸️ Exited playing state');
    const ui = ServiceLocator.get<UIService>('UI').ui;
    
    // Unregister UI event listeners
    if (this._towerSelectedHandler) {
      ui.off('towerSelected', this._towerSelectedHandler);
      this._towerSelectedHandler = null;
    }
    
    if (this._towerDeselectedHandler) {
      ui.off('towerDeselected', this._towerDeselectedHandler);
      this._towerDeselectedHandler = null;
    }
    
    // Unregister wave event listener
    if (this._waveAllCompleteHandler) {
      this.context.engine.events.off('wave:allComplete', this._waveAllCompleteHandler);
      this._waveAllCompleteHandler = null;
    }
  }
}
