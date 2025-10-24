/**
 * Game Components - Tower
 */

import { Component } from '@raejuli/core-engine-gdk/ecs';

export interface TowerStats {
  damage: number;
  range: number;
  fireRate: number; // shots per second
  projectileSpeed: number;
  cost: number;
  upgradeCost: number;
  level: number;
}

export class TowerComponent extends Component {
  public stats: TowerStats;
  public timeSinceLastShot: number = 0;
  public currentTarget: number | null = null; // Entity ID of target
  public readonly color: number; // Color for rendering

  constructor(stats: TowerStats, color: number) {
    super();
    this.stats = { ...stats };
    this.color = color;
  }

  public getType(): string {
    return 'Tower';
  }

  public canShoot(): boolean {
    const fireInterval = 1 / this.stats.fireRate;
    return this.timeSinceLastShot >= fireInterval;
  }

  public resetShootTimer(): void {
    this.timeSinceLastShot = 0;
  }

  public upgrade(): void {
    this.stats.level++;
    this.stats.damage *= 1.5;
    this.stats.range *= 1.2;
    this.stats.fireRate *= 1.3;
    this.stats.upgradeCost = Math.floor(this.stats.upgradeCost * 1.5);
  }

  public toString(): string {
    const cooldownRemaining = Math.max(0, (1 / this.stats.fireRate) - this.timeSinceLastShot);
    return `Level: ${this.stats.level}
Damage: ${this.stats.damage}
Range: ${this.stats.range}
Fire Rate: ${this.stats.fireRate.toFixed(2)}/s
Projectile Speed: ${this.stats.projectileSpeed}
Cooldown: ${cooldownRemaining.toFixed(2)}s
Current Target: ${this.currentTarget !== null ? `Entity #${this.currentTarget}` : 'None'}
Upgrade Cost: $${this.stats.upgradeCost}`;
  }
}
