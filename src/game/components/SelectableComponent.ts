/**
 * Game Components - Selectable Component
 */

import { Component } from '../../engine/ecs/Component';

export class SelectableComponent extends Component {
  public selected: boolean = false;

  public getType(): string {
    return 'Selectable';
  }

  public toString(): undefined {
    return undefined;
  }
}
