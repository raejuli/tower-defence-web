/**
 * Tower States - For state machine
 */

import { State } from '../../engine/state/StateMachine';
import { Entity } from '../../engine/ecs/Entity';

export class TowerIdleState extends State<Entity> {
  onEnter(): void {
    // Tower is idle, waiting for targets
  }

  onUpdate(deltaTime: number): void {
    // Targeting handled by TowerSystem
  }
}

export class TowerShootingState extends State<Entity> {
  onEnter(): void {
    // Tower found a target and is shooting
  }

  onUpdate(deltaTime: number): void {
    // Shooting handled by TowerSystem
  }
}
