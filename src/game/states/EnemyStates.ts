/**
 * Enemy States - For state machine
 */

import { State } from '@raejuli/core-engine-gdk/state';
import { Entity } from '@raejuli/core-engine-gdk/ecs';
import { EnemyComponent } from '../components/enemy/EnemyComponent';
import { PathFollowerComponent } from '../components/enemy/PathFollowerComponent';
import { RenderableComponent } from '@raejuli/core-engine-gdk/components';
import { StateMachineComponent } from '@raejuli/core-engine-gdk/components';

export class EnemyMovingState extends State<Entity> {
  public onEnter(previousState?: State<Entity>): void {
    // Enemy starts moving along path
  }

  public onUpdate(deltaTime: number): void {
    // Movement is handled by PathFollowingSystem
    // This state just represents normal movement behavior
  }

  public onExit(nextState?: State<Entity>): void {
    // Exiting moving state
  }
}

export class EnemyDamagedState extends State<Entity> {
  private _damageFlashTime: number = 0;
  private readonly _flashDuration: number = 0.2;

  public onEnter(previousState?: State<Entity>): void {
    this._damageFlashTime = 0;
    
    // Update health bar
    this.updateHealthBar();
    
    // Visual feedback - flash red
    const renderable = this._context.getComponent('Renderable') as RenderableComponent;
    if (renderable && renderable.graphics) {
      renderable.graphics.tint = 0x00ff00; // Red tint
    }
  }

  private updateHealthBar(): void {
    const enemy = this._context.getComponent('Enemy') as EnemyComponent;
    const renderable = this._context.getComponent('Renderable') as RenderableComponent;
    
    if (!enemy || !renderable) return;

    // Clear and redraw the entire enemy graphic
    renderable.graphics.clear();
    
    const enemySize = 20;
    const healthBarWidth = enemySize;
    const healthBarHeight = 4;
    const healthBarY = -5;
    
    // Draw enemy body (red circle)
    renderable.graphics.circle(enemySize / 2, enemySize / 2, enemySize / 2);
    renderable.graphics.fill({ color: 0xff0000 });
    
    // Draw health bar background (black)
    renderable.graphics.rect(0, healthBarY, healthBarWidth, healthBarHeight);
    renderable.graphics.fill({ color: 0x000000 });
    
    // Draw health bar foreground (green/yellow/red based on health)
    const healthPercent = enemy.getHealthPercent();
    let healthColor = 0x00ff00; // Green
    if (healthPercent < 0.3) {
      healthColor = 0xff0000; // Red
    } else if (healthPercent < 0.6) {
      healthColor = 0xffff00; // Yellow
    }
    
    renderable.graphics.rect(0, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
    renderable.graphics.fill({ color: healthColor });
  }

  public onUpdate(deltaTime: number): void {
    this._damageFlashTime += deltaTime;

    // Flash effect duration
    if (this._damageFlashTime >= this._flashDuration) {
      const enemy = this._context.getComponent('Enemy') as EnemyComponent;
      const stateMachine = this._context.getComponent('StateMachine') as StateMachineComponent;
      
      if (enemy && enemy.stats.health > 0 && stateMachine) {
        // Check if health is below 50%
        const healthPercent = enemy.getHealthPercent();
        
        if (healthPercent < 0.5) {
          // 30% chance to apply status effect when below 50% health
          const random = Math.random();
          
          if (random < 0.15) {
            // 15% chance for stun
            stateMachine.stateMachine.setState('stunned');
            return;
          } else if (random < 0.30) {
            // 15% chance for slow
            stateMachine.stateMachine.setState('slowed');
            return;
          }
        }
        
        // Default: return to moving state
        stateMachine.stateMachine.setState('moving');
      }
    }
  }

  public onExit(nextState?: State<Entity>): void {
    // Reset visual effects
    const renderable = this._context.getComponent('Renderable') as RenderableComponent;
    if (renderable && renderable.graphics) {
      renderable.graphics.tint = 0xffffff; // Reset tint
    }
  }
}

export class EnemyStunnedState extends State<Entity> {
  private _stunDuration: number = 0;
  private _stunTime: number = 0;

  constructor(name: string, context: Entity, stunDuration: number = 1.0) {
    super(name, context);
    this._stunDuration = stunDuration;
  }

  public onEnter(previousState?: State<Entity>): void {
    this._stunTime = 0;

    // Stop movement by setting speed to 0
    const pathFollower = this._context.getComponent('PathFollower') as PathFollowerComponent;
    if (pathFollower) {
      (pathFollower as any)._originalSpeed = pathFollower.speed;
      (pathFollower as any).speed = 0;
    }

    // Visual feedback - yellow tint
    const renderable = this._context.getComponent('Renderable') as RenderableComponent;
    if (renderable && renderable.graphics) {
      renderable.graphics.tint = 0xffff00; // Yellow tint
    }
  }

  public onUpdate(deltaTime: number): void {
    this._stunTime += deltaTime;

    if (this._stunTime >= this._stunDuration) {
      // Return to moving state
      const stateMachine = this._context.getComponent('StateMachine') as StateMachineComponent;
      if (stateMachine) {
        stateMachine.stateMachine.setState('moving');
      }
    }
  }

  public onExit(nextState?: State<Entity>): void {
    // Restore movement speed
    const pathFollower = this._context.getComponent('PathFollower') as PathFollowerComponent;
    if (pathFollower && (pathFollower as any)._originalSpeed) {
      (pathFollower as any).speed = (pathFollower as any)._originalSpeed;
    }

    // Reset visual effects
    const renderable = this._context.getComponent('Renderable') as RenderableComponent;
    if (renderable && renderable.graphics) {
      renderable.graphics.tint = 0xffffff; // Reset tint
    }
  }
}

export class EnemySlowedState extends State<Entity> {
  private _slowDuration: number = 0;
  private _slowTime: number = 0;
  private _slowFactor: number = 0.5;

  constructor(name: string, context: Entity, slowDuration: number = 2.0, slowFactor: number = 0.5) {
    super(name, context);
    this._slowDuration = slowDuration;
    this._slowFactor = slowFactor;
  }

  public onEnter(previousState?: State<Entity>): void {
    this._slowTime = 0;

    // Reduce movement speed
    const pathFollower = this._context.getComponent('PathFollower') as PathFollowerComponent;
    if (pathFollower) {
      (pathFollower as any)._originalSpeed = pathFollower.speed;
      (pathFollower as any).speed = pathFollower.speed * this._slowFactor;
    }

    // Visual feedback - blue tint
    const renderable = this._context.getComponent('Renderable') as RenderableComponent;
    if (renderable && renderable.graphics) {
      renderable.graphics.tint = 0x4444ff; // Blue tint
    }
  }

  public onUpdate(deltaTime: number): void {
    this._slowTime += deltaTime;

    if (this._slowTime >= this._slowDuration) {
      // Return to moving state
      const stateMachine = this._context.getComponent('StateMachine') as StateMachineComponent;
      if (stateMachine) {
        stateMachine.stateMachine.setState('moving');
      }
    }
  }

  public onExit(nextState?: State<Entity>): void {
    // Restore movement speed
    const pathFollower = this._context.getComponent('PathFollower') as PathFollowerComponent;
    if (pathFollower && (pathFollower as any)._originalSpeed) {
      (pathFollower as any).speed = (pathFollower as any)._originalSpeed;
    }

    // Reset visual effects
    const renderable = this._context.getComponent('Renderable') as RenderableComponent;
    if (renderable && renderable.graphics) {
      renderable.graphics.tint = 0xffffff; // Reset tint
    }
  }
}

export class EnemyDeadState extends State<Entity> {
  public onEnter(previousState?: State<Entity>): void {
    // Stop all movement
    const pathFollower = this._context.getComponent('PathFollower') as PathFollowerComponent;
    if (pathFollower) {
      (pathFollower as any).speed = 0;
    }

    // Visual feedback - gray tint
    const renderable = this._context.getComponent('Renderable') as RenderableComponent;
    if (renderable && renderable.graphics) {
      renderable.graphics.tint = 0x666666; // Gray tint
    }
  }

  public onUpdate(deltaTime: number): void {
    // Dead enemies don't update
    // Entity will be removed by the system
  }

  public onExit(nextState?: State<Entity>): void {
    // Clean up
  }
}

export class EnemyReachedEndState extends State<Entity> {
  public onEnter(previousState?: State<Entity>): void {
    // Enemy reached end, will damage player
    const pathFollower = this._context.getComponent('PathFollower') as PathFollowerComponent;
    if (pathFollower) {
      (pathFollower as any).speed = 0;
    }
  }

  public onUpdate(deltaTime: number): void {
    // Wait for removal by system
  }

  public onExit(nextState?: State<Entity>): void {
    // Clean up
  }
}
