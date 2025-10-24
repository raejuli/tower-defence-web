/**
 * Game Components - Projectile
 */

import { Component } from '@raejuli/core-engine-gdk/ecs';

export class ProjectileComponent extends Component {
  public readonly damage: number;
  public readonly speed: number;
  public targetId: number; // Entity ID of target
  public readonly color: number;

  constructor(damage: number, speed: number, targetId: number, color: number) {
    super();
    this.damage = damage;
    this.speed = speed;
    this.targetId = targetId;
    this.color = color;
  }

  public getType(): string {
    return 'Projectile';
  }

  public toString(): string {
    return `Damage: ${this.damage}
Speed: ${this.speed}
Target: Entity #${this.targetId}
Color: #${this.color.toString(16).padStart(6, '0')}`;
  }
}
