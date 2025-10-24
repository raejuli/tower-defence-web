/**
 * Game Components - Chain Lightning
 * Component for projectiles that chain between targets
 */

import { Component } from '@raejuli/core-engine-gdk/ecs';

export class ChainLightningComponent extends Component {
  public chainCount: number = 0; // How many times this has chained
  public readonly maxChains: number; // Maximum number of chains
  public readonly hitTargets: Set<number> = new Set(); // IDs of already hit targets
  public readonly chainRange: number; // Range to search for next target

  constructor(maxChains: number, chainRange: number = 150) {
    super();
    this.maxChains = maxChains;
    this.chainRange = chainRange;
  }

  public getType(): string {
    return 'ChainLightning';
  }

  public canChain(): boolean {
    return this.chainCount < this.maxChains;
  }

  public addHitTarget(targetId: number): void {
    this.hitTargets.add(targetId);
  }

  public hasHitTarget(targetId: number): boolean {
    return this.hitTargets.has(targetId);
  }

  public toString(): string {
    return `Chain Count: ${this.chainCount}/${this.maxChains}
Chain Range: ${this.chainRange}
Hit Targets: [${Array.from(this.hitTargets).join(', ')}]
Can Chain: ${this.canChain() ? 'Yes' : 'No'}`;
  }
}
