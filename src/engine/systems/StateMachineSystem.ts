/**
 * Core Systems - State Machine System
 */

import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { StateMachineComponent } from '../components/StateMachineComponent';

export class StateMachineSystem extends System {
  constructor(world: World) {
    super(world);
    this.priority = 0; // Normal priority
  }

  getRequiredComponents(): string[] {
    return ['StateMachine'];
  }

  update(deltaTime: number): void {
    const entities = this.getEntities();

    for (const entity of entities) {
      const smComponent = entity.getComponent<StateMachineComponent>('StateMachine')!;
      
      if (smComponent.enabled) {
        smComponent.stateMachine.update(deltaTime);
      }
    }
  }
}
