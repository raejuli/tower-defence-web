/**
 * Game Components - Enemy
 */

import { Component } from '../../engine/ecs/Component';
import { StateMachineComponent } from '../../engine/components/StateMachineComponent';

export interface EnemyStats {
  health: number;
  maxHealth: number;
  speed: number;
  damage: number; // damage to player if reaches end
  reward: number; // money earned when killed
}

export class EnemyComponent extends Component {
  public stats: EnemyStats;
  public pathIndex: number = 0;
  public readonly color: number = 0xff0000; // Red

  constructor(stats: EnemyStats) {
    super();
    this.stats = { ...stats };
  }

  public getType(): string {
    return 'Enemy';
  }

  public takeDamage(damage: number): boolean {
    this.stats.health -= damage;
    const isDead = this.stats.health <= 0;
    
    // Trigger state transition
    const stateMachine = this.getSiblingComponent<StateMachineComponent>('StateMachine');
    if (stateMachine) {
      if (isDead) {
        stateMachine.stateMachine.setState('dead');
      } else {
        stateMachine.stateMachine.setState('damaged');
      }
    }
    
    return isDead;
  }

  public reachedEnd(): void {
    // Trigger state transition when enemy reaches end of path
    const stateMachine = this.getSiblingComponent<StateMachineComponent>('StateMachine');
    if (stateMachine) {
      stateMachine.stateMachine.setState('reachedEnd');
    }
  }

  public getHealthPercent(): number {
    return this.stats.health / this.stats.maxHealth;
  }

  public toString(): string {
    return `Health: ${this.stats.health.toFixed(1)}/${this.stats.maxHealth} (${(this.getHealthPercent() * 100).toFixed(1)}%)
Speed: ${this.stats.speed}
Damage: ${this.stats.damage}
Reward: $${this.stats.reward}
Path Index: ${this.pathIndex}`;
  }
}
