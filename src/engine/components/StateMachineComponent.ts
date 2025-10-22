/**
 * Core Components - State Machine Component
 */

import { Component } from '../ecs/Component';
import { StateMachine } from '../state/StateMachine';

export class StateMachineComponent extends Component {
  public stateMachine: StateMachine<any>;

  constructor(context: any) {
    super();
    this.stateMachine = new StateMachine(context);
  }

  getType(): string {
    return 'StateMachine';
  }

  public toString(): string {
    const currentState = this.stateMachine.getCurrentStateName();
    const stateCount = this.stateMachine['_states']?.size || 0;
    return `Current State: ${currentState || 'None'}
Total States: ${stateCount}`;
  }
}
