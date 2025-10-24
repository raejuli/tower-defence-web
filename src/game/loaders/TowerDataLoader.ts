/**
 * TowerDataLoader
 * 
 * Loads and manages tower and upgrade data from JSON files.
 * Provides type-safe access to tower definitions and upgrade trees.
 */

import towerData from '../data/towers.json';
import upgradeData from '../data/tower-upgrades.json';
import { TowerStats } from '../components/tower/TowerComponent';

export interface TowerDefinition {
  id: string;
  name: string;
  description: string;
  stats: TowerStats;
  color: number;
  visualTier: number;
  special?: {
    type?: string;
    maxChains?: number;
    chainRange?: number;
    coneAngle?: number;
    coneLength?: number;
    piercing?: number;
  };
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  tier: number;
  cost: number;
  requirements: string[];
  statChanges?: Partial<TowerStats & { fireRateMultiplier?: number }>;
  specialChanges?: Record<string, any>;
  nextUpgrades?: string[];
  visualTier?: number;
}

export class TowerDataLoader {
  private static towers: Map<string, TowerDefinition> = new Map();
  private static upgrades: Map<string, UpgradeDefinition[]> = new Map();
  private static isInitialized = false;

  /**
   * Initialize the data loader (loads JSON data)
   */
  public static initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Load tower definitions
    const towerEntries = Object.entries(towerData.towers);
    for (const [key, data] of towerEntries) {
      this.towers.set(key, data as TowerDefinition);
    }

    // Load upgrade definitions
    const upgradeEntries = Object.entries(upgradeData.upgrades);
    for (const [towerType, upgrades] of upgradeEntries) {
      this.upgrades.set(towerType, upgrades as UpgradeDefinition[]);
    }

    this.isInitialized = true;
    console.log(`📦 TowerDataLoader initialized: ${this.towers.size} tower types, ${this.upgrades.size} upgrade trees`);
  }

  /**
   * Get a tower definition by ID
   */
  public static getTowerDefinition(towerId: string): TowerDefinition | undefined {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.towers.get(towerId);
  }

  /**
   * Get all tower definitions
   */
  public static getAllTowerDefinitions(): TowerDefinition[] {
    if (!this.isInitialized) {
      this.initialize();
    }
    return Array.from(this.towers.values());
  }

  /**
   * Get all upgrades for a specific tower type
   */
  public static getUpgradesForTower(towerType: string): UpgradeDefinition[] {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.upgrades.get(towerType) || [];
  }

  /**
   * Get a specific upgrade by ID
   */
  public static getUpgrade(towerType: string, upgradeId: string): UpgradeDefinition | undefined {
    const upgrades = this.getUpgradesForTower(towerType);
    return upgrades.find(u => u.id === upgradeId);
  }

  /**
   * Get tier 1 upgrades for a tower type
   */
  public static getTier1Upgrades(towerType: string): UpgradeDefinition[] {
    const upgrades = this.getUpgradesForTower(towerType);
    return upgrades.filter(u => u.tier === 1);
  }

  /**
   * Get next tier upgrades based on current applied upgrades
   */
  public static getAvailableUpgrades(
    towerType: string,
    appliedUpgrades: string[]
  ): UpgradeDefinition[] {
    const allUpgrades = this.getUpgradesForTower(towerType);
    
    // If no upgrades applied yet, return tier 1
    if (appliedUpgrades.length === 0) {
      return this.getTier1Upgrades(towerType);
    }

    // Find which upgrades can be unlocked
    const available: UpgradeDefinition[] = [];
    
    for (const upgrade of allUpgrades) {
      // Skip if already applied
      if (appliedUpgrades.includes(upgrade.id)) {
        continue;
      }

      // Check if all requirements are met
      const requirementsMet = upgrade.requirements.every(req => 
        appliedUpgrades.includes(req)
      );

      if (requirementsMet) {
        available.push(upgrade);
      }
    }

    return available;
  }

  /**
   * Check if an upgrade's requirements are met
   */
  public static canApplyUpgrade(
    towerType: string,
    upgradeId: string,
    appliedUpgrades: string[]
  ): boolean {
    const upgrade = this.getUpgrade(towerType, upgradeId);
    if (!upgrade) {
      return false;
    }

    // Check if already applied
    if (appliedUpgrades.includes(upgradeId)) {
      return false;
    }

    // Check if all requirements are met
    return upgrade.requirements.every(req => appliedUpgrades.includes(req));
  }

  /**
   * Get all tower type IDs
   */
  public static getTowerTypes(): string[] {
    if (!this.isInitialized) {
      this.initialize();
    }
    return Array.from(this.towers.keys());
  }

  /**
   * Check if a tower type exists
   */
  public static hasTowerType(towerId: string): boolean {
    if (!this.isInitialized) {
      this.initialize();
    }
    return this.towers.has(towerId);
  }
}

// Auto-initialize on module load
TowerDataLoader.initialize();
