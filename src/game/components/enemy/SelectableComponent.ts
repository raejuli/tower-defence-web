/**
 * Game Components - Selectable Component
 */

import { Component } from '@raejuli/core-engine-gdk/ecs';

export class SelectableComponent extends Component {
  public selected: boolean = false;

  public getType(): string {
    return 'Selectable';
  }

  public toString(): undefined {
    return undefined;
  }
}
