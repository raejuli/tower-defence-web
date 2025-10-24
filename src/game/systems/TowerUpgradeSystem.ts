/**
 * TowerUpgradeSystem
 * 
 * ECS System that handles tower upgrade logic.
 * Manages available upgrades, applies stat changes, and updates tower visuals.
 */

import { System } from '@raejuli/core-engine-gdk/ecs';
import { World, Entity } from '@raejuli/core-engine-gdk/ecs';
import { TowerComponent } from '../components/tower/TowerComponent';
import { UpgradeComponent } from '../components/tower/UpgradeComponent';
import { TowerDataLoader, UpgradeDefinition } from '../loaders/TowerDataLoader';
import { RenderableComponent } from '@raejuli/core-engine-gdk/components';
import { ChainLightningTowerComponent } from '../components/tower/ChainLightningTowerComponent';
import { FlamethrowerTowerComponent } from '../components/tower/FlamethrowerTowerComponent';

export class TowerUpgradeSystem extends System {
  constructor(world: World) {
    super(world);
    this.priority = 5; // Run after tower placement but before combat
  }

  public getRequiredComponents(): string[] {
    return ['Tower', 'Upgrade'];
  }

  public onInit(): void {
    // Initialize available upgrades for all existing towers with UpgradeComponent
    const towers = this.getEntities();
    for (const tower of towers) {
      this.initializeUpgradeComponent(tower);
    }
  }

  /**
   * Initialize upgrade component with tier 1 upgrades
   */
  public initializeUpgradeComponent(tower: Entity): void {
    const upgradeComp = tower.getComponent('Upgrade') as UpgradeComponent;
    if (!upgradeComp) return;

    const tier1Upgrades = TowerDataLoader.getTier1Upgrades(upgradeComp.towerType);
    upgradeComp.setAvailableUpgrades(tier1Upgrades.map(u => u.id));
  }

  /**
   * Apply an upgrade to a tower
   * Returns true if successful, false otherwise
   */
  public applyUpgrade(tower: Entity, upgradeId: string, playerMoney: number): { success: boolean; cost: number; newMoney: number } {
    const towerComp = tower.getComponent('Tower') as TowerComponent;
    const upgradeComp = tower.getComponent('Upgrade') as UpgradeComponent;

    if (!towerComp || !upgradeComp) {
      return { success: false, cost: 0, newMoney: playerMoney };
    }

    // Get upgrade definition
    const upgrade = TowerDataLoader.getUpgrade(upgradeComp.towerType, upgradeId);
    if (!upgrade) {
      console.warn(`Upgrade ${upgradeId} not found for tower type ${upgradeComp.towerType}`);
      return { success: false, cost: 0, newMoney: playerMoney };
    }

    // Check if upgrade is available
    if (!upgradeComp.isUpgradeAvailable(upgradeId)) {
      console.warn(`Upgrade ${upgradeId} is not available`);
      return { success: false, cost: 0, newMoney: playerMoney };
    }

    // Check if player has enough money
    if (playerMoney < upgrade.cost) {
      console.warn(`Not enough money for upgrade ${upgradeId}. Cost: ${upgrade.cost}, Available: ${playerMoney}`);
      return { success: false, cost: upgrade.cost, newMoney: playerMoney };
    }

    // Apply stat changes
    this.applyStatChanges(towerComp, upgrade);
    
    // Apply special changes (chain lightning, flamethrower, etc.)
    this.applySpecialChanges(tower, upgrade);

    // Update upgrade component
    upgradeComp.applyUpgrade(upgradeId, upgrade.tier, upgrade.cost);

    // Update available upgrades for next tier
    const nextUpgrades = TowerDataLoader.getAvailableUpgrades(
      upgradeComp.towerType,
      upgradeComp.appliedUpgrades
    );
    upgradeComp.setAvailableUpgrades(nextUpgrades.map(u => u.id));

    // Update visual tier if specified
    if (upgrade.visualTier !== undefined) {
      this.updateVisualTier(tower, upgrade.visualTier);
    }

    console.log(`✅ Applied upgrade "${upgrade.name}" to tower (Tier ${upgrade.tier})`);

    const newMoney = playerMoney - upgrade.cost;
    return { success: true, cost: upgrade.cost, newMoney };
  }

  /**
   * Apply stat changes from an upgrade
   */
  private applyStatChanges(towerComp: TowerComponent, upgrade: UpgradeDefinition): void {
    if (!upgrade.statChanges) return;

    const changes = upgrade.statChanges;

    // Apply additive changes
    if (changes.damage !== undefined) {
      towerComp.stats.damage += changes.damage;
    }
    if (changes.range !== undefined) {
      towerComp.stats.range += changes.range;
    }
    if (changes.projectileSpeed !== undefined) {
      towerComp.stats.projectileSpeed += changes.projectileSpeed;
    }

    // Apply multiplicative changes
    if (changes.fireRateMultiplier !== undefined) {
      towerComp.stats.fireRate *= changes.fireRateMultiplier;
    }
  }

  /**
   * Apply special changes (chain lightning, flamethrower, etc.)
   */
  private applySpecialChanges(tower: Entity, upgrade: UpgradeDefinition): void {
    if (!upgrade.specialChanges) return;

    const changes = upgrade.specialChanges;

    // Handle chain lightning changes
    if (changes.maxChains !== undefined || changes.chainRange !== undefined) {
      const oldChainComp = tower.getComponent('ChainLightningTower') as ChainLightningTowerComponent;
      
      // Get current or default values
      const currentMaxChains = oldChainComp?.maxChains || 3;
      const currentChainRange = oldChainComp?.chainRange || 80;
      
      // Create new component with updated values
      const newMaxChains = changes.maxChains !== undefined ? changes.maxChains : currentMaxChains;
      const newChainRange = changes.chainRange !== undefined ? changes.chainRange : currentChainRange;
      
      // Remove old component if it exists
      if (oldChainComp) {
        tower.removeComponent(oldChainComp);
      }
      
      // Add new component with updated values
      const chainComp = new ChainLightningTowerComponent(newMaxChains, newChainRange);
      tower.addComponent(chainComp);
    }

    // Handle flamethrower changes
    if (changes.coneAngle !== undefined || changes.coneLength !== undefined) {
      const oldFlameComp = tower.getComponent('FlamethrowerTower') as FlamethrowerTowerComponent;
      
      // Get current or default values
      const currentConeAngle = oldFlameComp?.coneAngle || 60;
      const currentConeLength = oldFlameComp?.coneLength || 80;
      const currentDamagePerSecond = oldFlameComp?.damagePerSecond || 20;
      const currentAngle = oldFlameComp?.currentAngle || 0;
      
      // Calculate new values (additive for upgrades)
      const newConeAngle = changes.coneAngle !== undefined ? currentConeAngle + changes.coneAngle : currentConeAngle;
      const newConeLength = changes.coneLength !== undefined ? currentConeLength + changes.coneLength : currentConeLength;
      
      // Remove old component if it exists
      if (oldFlameComp) {
        tower.removeComponent(oldFlameComp);
      }
      
      // Add new component with updated values
      const flameComp = new FlamethrowerTowerComponent(newConeAngle, newConeLength, currentDamagePerSecond);
      flameComp.currentAngle = currentAngle; // Preserve rotation
      tower.addComponent(flameComp);
    }

    // Handle piercing changes (stored in tower stats as a pseudo-property)
    if (changes.piercing !== undefined) {
      // Add piercing capability via a special property
      // This would need to be handled in ProjectileComponent or ProjectileSystem
      (tower as any).piercing = changes.piercing;
    }

    // Handle type changes (e.g., basic tower becoming sniper)
    if (changes.type !== undefined) {
      // Store the specialized type for behavior changes
      (tower as any).specializedType = changes.type;
    }
  }

  /**
   * Update tower visual based on upgrade tier
   */
  private updateVisualTier(tower: Entity, visualTier: number): void {
    const renderable = tower.getComponent('Renderable') as RenderableComponent;
    if (!renderable) return;

    // Visual changes based on tier
    // Tier 0: Base (no changes)
    // Tier 1: Slightly larger, glowing effect
    // Tier 2: Larger, brighter glow
    // Tier 3: Maximum size, intense glow

    const baseSize = 30;
    const sizeMultiplier = 1 + (visualTier * 0.1); // 1.0, 1.1, 1.2, 1.3
    const newSize = baseSize * sizeMultiplier;

    const towerComp = tower.getComponent('Tower') as TowerComponent;
    if (!towerComp) return;

    // Redraw with new size and glow
    renderable.graphics.clear();
    renderable.graphics.rect(0, 0, newSize, newSize);
    renderable.graphics.fill(towerComp.color);

    // Add glow effect for higher tiers
    if (visualTier > 0) {
      const glowAlpha = 0.2 + (visualTier * 0.1);
      const glowSize = newSize + (visualTier * 5);
      renderable.graphics.rect(-visualTier * 2.5, -visualTier * 2.5, glowSize, glowSize);
      renderable.graphics.fill({ color: towerComp.color, alpha: glowAlpha });
    }
  }

  /**
   * Get available upgrades for a tower
   */
  public getAvailableUpgrades(tower: Entity): UpgradeDefinition[] {
    const upgradeComp = tower.getComponent('Upgrade') as UpgradeComponent;
    if (!upgradeComp) return [];

    const availableIds = upgradeComp.availableUpgrades;
    return availableIds
      .map(id => TowerDataLoader.getUpgrade(upgradeComp.towerType, id))
      .filter((u): u is UpgradeDefinition => u !== undefined);
  }

  /**
   * Check if a tower can be upgraded
   */
  public canUpgrade(tower: Entity): boolean {
    const upgradeComp = tower.getComponent('Upgrade') as UpgradeComponent;
    return upgradeComp ? upgradeComp.availableUpgrades.length > 0 : false;
  }

  /**
   * Get total upgrade cost for selling
   */
  public getTotalValue(tower: Entity, baseCost: number): number {
    const upgradeComp = tower.getComponent('Upgrade') as UpgradeComponent;
    return upgradeComp ? upgradeComp.getRefundValue(baseCost) : baseCost;
  }
}
