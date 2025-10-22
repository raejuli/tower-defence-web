/**
 * Game States - Playing State
 * Business logic layer - orchestrates systems to implement game rules
 */

import { State } from '../../engine/state/StateMachine';
import { TowerDefenceGame } from '../TowerDefenceGame';
import { StateMachineSystem } from '../../engine/systems/StateMachineSystem';
import { TowerSystem } from '../systems/TowerSystem';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { PathFollowingSystem } from '../systems/PathFollowingSystem';
import { TowerSelectionSystem } from '../systems/TowerSelectionSystem';
import { ChainLightningComponent } from '../components/ChainLightningComponent';
import { StateMachineComponent } from '../../engine/components/StateMachineComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { ServiceLocator } from '../../engine/services/ServiceLocator';
import { IEnemyService, IGameStateService } from '../services/IGameServices';

export class PlayingState extends State<TowerDefenceGame> {
  public onEnter(previousState?: State<TowerDefenceGame>): void {
    console.log('Game is playing');
  }

  public onUpdate(deltaTime: number): void {
    const world = this.context.world;
    
    // Get systems (core logic)
    const stateMachineSystem = world.getSystem(StateMachineSystem);
    const towerSystem = world.getSystem(TowerSystem);
    const projectileSystem = world.getSystem(ProjectileSystem);
    const pathFollowingSystem = world.getSystem(PathFollowingSystem);
    const towerSelectionSystem = world.getSystem(TowerSelectionSystem);
    
    // Update state machines first (enemy states)
    if (stateMachineSystem) {
      stateMachineSystem.update(deltaTime);
    }
    
    // Get entities
    const enemies = world.getEntitiesWithComponents(['Enemy', 'Transform']);
    
    // Update tower cooldowns
    if (towerSystem) {
      towerSystem.updateCooldowns(deltaTime);
    }
    
    // Tower targeting and shooting (business logic: towers attack enemies)
    if (towerSystem) {
      towerSystem.processTowers(enemies);
    }
    
    // Update projectiles (business logic: handle hits and rewards)
    if (projectileSystem) {
      const results = projectileSystem.processProjectiles(deltaTime);
      const enemyService = ServiceLocator.get<IEnemyService>('EnemyService');
      
      for (const result of results) {
        if (result.hit) {
          // Give reward if enemy was killed
          if (result.killed && result.target) {
            world.removeEntity(result.target);
            enemyService.onEnemyKilled(result.reward);
          }
          
          // Check if projectile is still chaining (system handles this)
          const chainComp = result.projectile.getComponent('ChainLightning') as ChainLightningComponent;
          if (!chainComp || !chainComp.canChain()) {
            // Remove projectile (no chaining component or max chains reached)
            world.removeEntity(result.projectile);
          }
          // If chainComp exists and can still chain, system already updated target
        } else if (result.targetDead) {
          // Remove projectiles whose target died (system checked for chains already)
          world.removeEntity(result.projectile);
        }
      }
    }
    
    // Update enemies following path (business logic: lose lives when enemies reach end)
    if (pathFollowingSystem) {
      const results = pathFollowingSystem.processEnemies(deltaTime);
      const enemyService = ServiceLocator.get<IEnemyService>('EnemyService');
      
      for (const result of results) {
        if (result.reachedEnd) {
          enemyService.onEnemyReachedEnd(result.damage);
          world.removeEntity(result.enemy);
        }
      }
    }
    
    // Check for dead enemies that need to be removed (handles stunned/slowed enemies that died)
    const allEnemies = world.getEntitiesWithComponents(['Enemy', 'StateMachine']);
    const enemyService = ServiceLocator.get<IEnemyService>('EnemyService');
    
    for (const enemy of allEnemies) {
      const stateMachine = enemy.getComponent('StateMachine') as StateMachineComponent;
      if (stateMachine && stateMachine.stateMachine.getCurrentStateName() === 'dead') {
        // Enemy is in dead state, remove it
        const enemyComp = enemy.getComponent('Enemy') as EnemyComponent;
        if (enemyComp) {
          enemyService.onEnemyKilled(enemyComp.stats.reward);
        }
        world.removeEntity(enemy);
      }
    }
    
    // Update tower selection graphics
    if (towerSelectionSystem) {
      towerSelectionSystem.updateTowerGraphics();
    }
  }

  public onExit(nextState?: State<TowerDefenceGame>): void {
    console.log('Exited playing state');
  }
}
