/**
 * TowerDetailsPanel - Pure Functional React Component
 */

import React from 'react';
import './TowerDetailsPanel.css';
import { Entity } from '@raejuli/core-engine-gdk';
import { TowerComponent } from '../../../components/tower/TowerComponent';
import { UpgradeComponent } from '../../../components/tower/UpgradeComponent';

export interface TowerDetailsPanelProps {
  tower: Entity;
  onClose: () => void;
  onUpgrade?: (upgradeId: string) => void;
  onSell?: () => void;
  playerMoney?: number;
  availableUpgrades?: Array<{
    id: string;
    name: string;
    description: string;
    cost: number;
    tier: number;
  }>;
}

export const TowerDetailsPanel: React.FC<TowerDetailsPanelProps> = ({ 
  tower, 
  onClose, 
  onUpgrade,
  onSell,
  playerMoney = 0,
  availableUpgrades = []
}) => {
  const components = tower.getAllComponents();
  const towerComp = tower.getComponent('Tower') as TowerComponent;
  const upgradeComp = tower.getComponent('Upgrade') as UpgradeComponent;

  const handleUpgradeClick = (upgradeId: string) => {
    if (onUpgrade) {
      onUpgrade(upgradeId);
    }
  };

  const handleSellClick = () => {
    if (onSell) {
      onSell();
    }
  };

  const sellValue = upgradeComp && towerComp 
    ? upgradeComp.getRefundValue(towerComp.stats.cost) 
    : towerComp?.stats.cost || 0;

  return (
    <div className="tower-details-panel">
      <div className="tower-details-header">
        <h3>Tower Details</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="tower-details-content">
        {/* Upgrade Section */}
        {upgradeComp && availableUpgrades.length > 0 && (
          <div className="upgrade-section">
            <div className="section-title">Available Upgrades</div>
            <div className="upgrades-list">
              {availableUpgrades.map((upgrade) => {
                const canAfford = playerMoney >= upgrade.cost;
                return (
                  <button
                    key={upgrade.id}
                    className={`upgrade-button ${canAfford ? '' : 'disabled'}`}
                    onClick={() => handleUpgradeClick(upgrade.id)}
                    disabled={!canAfford}
                  >
                    <div className="upgrade-header">
                      <span className="upgrade-name">{upgrade.name}</span>
                      <span className={`upgrade-tier tier-${upgrade.tier}`}>T{upgrade.tier}</span>
                    </div>
                    <div className="upgrade-description">{upgrade.description}</div>
                    <div className="upgrade-footer">
                      <span className="upgrade-cost">💰 {upgrade.cost}</span>
                      {!canAfford && <span className="insufficient-funds">Insufficient Funds</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Max Level Indicator */}
        {upgradeComp && availableUpgrades.length === 0 && upgradeComp.currentTier > 0 && (
          <div className="upgrade-section">
            <div className="max-level-badge">⭐ MAX LEVEL ⭐</div>
          </div>
        )}

        {/* Current Stats */}
        {components.map((component, index) => {
          const componentType = component.getType();
          const componentString = component.toString();

          if (!componentString) return null;

          return (
            <div key={index} className="component-section">
              <div className="component-title">{componentType}</div>
              <pre className="component-content">{componentString}</pre>
            </div>
          );
        })}

        {/* Sell Button */}
        {onSell && (
          <div className="tower-actions">
            <button className="sell-button" onClick={handleSellClick}>
              <span className="sell-icon">💸</span>
              <span>Sell Tower</span>
              <span className="sell-value">+${sellValue}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
