/**
 * UpgradeComponent
 * 
 * Tracks the upgrade path and current upgrades applied to a tower entity.
 * Works with the ECS architecture to store upgrade state as data.
 */

import { Component } from '@raejuli/core-engine-gdk/ecs';

export interface UpgradeData {
  id: string;
  tier: number;
  name: string;
}

export class UpgradeComponent extends Component {
  /** Tower type (for looking up available upgrades) */
  public towerType: string;
  
  /** List of upgrade IDs that have been applied */
  public appliedUpgrades: string[] = [];
  
  /** List of upgrade IDs available for the next tier */
  public availableUpgrades: string[] = [];
  
  /** Current upgrade tier (0 = base, 1-3 = upgrade tiers) */
  public currentTier: number = 0;
  
  /** Total money spent on upgrades */
  public totalUpgradeCost: number = 0;

  constructor(towerType: string) {
    super();
    this.towerType = towerType;
    // Initial available upgrades are tier 1 upgrades for this tower type
    // Will be populated by TowerUpgradeSystem
  }

  public getType(): string {
    return 'Upgrade';
  }

  /**
   * Check if an upgrade has been applied
   */
  public hasUpgrade(upgradeId: string): boolean {
    return this.appliedUpgrades.includes(upgradeId);
  }

  /**
   * Check if an upgrade is currently available
   */
  public isUpgradeAvailable(upgradeId: string): boolean {
    return this.availableUpgrades.includes(upgradeId);
  }

  /**
   * Record an applied upgrade
   */
  public applyUpgrade(upgradeId: string, tier: number, cost: number): void {
    this.appliedUpgrades.push(upgradeId);
    this.currentTier = Math.max(this.currentTier, tier);
    this.totalUpgradeCost += cost;
  }

  /**
   * Set available upgrades for the next tier
   */
  public setAvailableUpgrades(upgradeIds: string[]): void {
    this.availableUpgrades = upgradeIds;
  }

  /**
   * Get total refund value (for selling towers)
   */
  public getRefundValue(baseCost: number, refundPercent: number = 0.7): number {
    return Math.floor((baseCost + this.totalUpgradeCost) * refundPercent);
  }

  public override toString(): string {
    return `${super.toString()}\nTower Type: ${this.towerType}\nTier: ${this.currentTier}\nApplied Upgrades: ${this.appliedUpgrades.length}\nAvailable: ${this.availableUpgrades.length}`;
  }
}
