/**
 * Game Components - Flamethrower Tower
 * Component that marks a tower as a flamethrower with cone-based area damage
 */

import { Component } from '@raejuli/core-engine-gdk/ecs';

export class FlamethrowerTowerComponent extends Component {
  public readonly coneAngle: number; // Cone angle in degrees
  public readonly coneLength: number; // How far the flame reaches
  public readonly damagePerSecond: number; // Continuous damage while enemies are in cone
  public currentAngle: number = 0; // Current rotation angle of the cone

  constructor(coneAngle: number = 60, coneLength: number = 100, damagePerSecond: number = 20) {
    super();
    this.coneAngle = coneAngle;
    this.coneLength = coneLength;
    this.damagePerSecond = damagePerSecond;
  }

  public getType(): string {
    return 'FlamethrowerTower';
  }

  public toString(): string {
    return `Cone Angle: ${this.coneAngle}°
Cone Length: ${this.coneLength}
Damage/Second: ${this.damagePerSecond}`;
  }
}
