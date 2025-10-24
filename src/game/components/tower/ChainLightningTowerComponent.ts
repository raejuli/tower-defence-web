/**
 * Game Components - Chain Lightning Tower
 * Component that marks a tower as shooting chain lightning projectiles
 */

import { Component } from '@raejuli/core-engine-gdk/ecs';

export class ChainLightningTowerComponent extends Component {
  public readonly maxChains: number;
  public readonly chainRange: number;

  constructor(maxChains: number, chainRange: number = 150) {
    super();
    this.maxChains = maxChains;
    this.chainRange = chainRange;
  }

  public getType(): string {
    return 'ChainLightningTower';
  }

  public toString(): string {
    return `Max Chain Targets: ${this.maxChains}
Chain Range: ${this.chainRange}`;
  }
}
