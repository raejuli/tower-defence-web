/**
 * Game States - Playing State
 * BEHAVIOUR TREE: Contains readable game rules and flow control
 * This state defines HOW the game plays - the actual game rules
 */

import { State } from '../../engine/state/StateMachine';
import { TowerDefenceGame } from '../TowerDefenceGame';
import { ServiceLocator } from '../../engine/services/ServiceLocator';
import { ITowerService, IPlacementService, IGameStateService } from '../services/IGameServices';
import { StateMachineSystem } from '../../engine/systems/StateMachineSystem';
import { TowerSystem } from '../systems/TowerSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { PathFollowingSystem } from '../systems/PathFollowingSystem';
import { TowerSelectionSystem } from '../systems/TowerSelectionSystem';
import { StateMachineComponent } from '../../engine/components/StateMachineComponent';
import { EnemyComponent } from '../components/EnemyComponent';

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

  public onEnter(previousState?: State<TowerDefenceGame>): void {
    console.log('🎮 Game is playing - Combat rules active');
    
    // Register UI event listeners for tower selection
    this._towerSelectedHandler = (data: any) => {
      const placementService = ServiceLocator.get<IPlacementService>('PlacementService');
      placementService.enterPlacementMode(data.towerType, data.range);
    };
    
    this._towerDeselectedHandler = () => {
      const towerService = ServiceLocator.get<ITowerService>('TowerService');
      towerService.deselectAllTowers();
      this.context.ui.hideTowerDetails();
    };
    
    this.context.ui.on('towerSelected', this._towerSelectedHandler);
    this.context.ui.on('towerDeselected', this._towerDeselectedHandler);
  }

  /**
   * MAIN GAME LOOP - This defines the rules of tower defense
   * Each section represents a game rule that would be a node in a visual behaviour tree
   */
  public onUpdate(deltaTime: number): void {
    const world = this.context.world;
    const gameState = ServiceLocator.get<IGameStateService>('GameStateService');

    // ============================================================
    // RULE 1: Update AI - All entities update their state machines
    // ============================================================
    const stateMachineSystem = world.getSystem(StateMachineSystem);
    if (stateMachineSystem) {
      stateMachineSystem.update(deltaTime);
    }

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
  }

  public onExit(nextState?: State<TowerDefenceGame>): void {
    console.log('⏸️ Exited playing state');
    
    // Unregister UI event listeners
    if (this._towerSelectedHandler) {
      this.context.ui.off('towerSelected', this._towerSelectedHandler);
      this._towerSelectedHandler = null;
    }
    
    if (this._towerDeselectedHandler) {
      this.context.ui.off('towerDeselected', this._towerDeselectedHandler);
      this._towerDeselectedHandler = null;
    }
  }
}
