/**
 * Shop Component - Tower purchasing interface
 */

import React from 'react';
import './Shop.css';

export interface TowerType {
  name: string;
  color: number;
  stats: {
    damage: number;
    range: number;
    fireRate: number;
    projectileSpeed: number;
    cost: number;
    upgradeCost: number;
    level: number;
  };
}

export interface ShopProps {
  towerTypes: Map<string, TowerType>;
  money: number;
  selectedTowerType: string | null;
  onTowerSelect: (towerType: string) => void;
  onCancelPlacement: () => void;
}

export const Shop: React.FC<ShopProps> = ({
  towerTypes,
  money,
  selectedTowerType,
  onTowerSelect,
  onCancelPlacement
}) => {
  return (
    <div className="shop">
      <h3>Tower Shop</h3>
      <div className="tower-buttons">
        {Array.from(towerTypes.entries()).map(([key, towerType]) => {
          const canAfford = money >= towerType.stats.cost;
          const isSelected = selectedTowerType === key;
          
          return (
            <div
              key={key}
              className={`tower-button ${!canAfford ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => canAfford && onTowerSelect(key)}
              data-tower-type={key}
            >
              <span
                className="tower-color"
                style={{
                  backgroundColor: `#${towerType.color.toString(16).padStart(6, '0')}`
                }}
              />
              <strong>{towerType.name}</strong>
              <br />
              <small>
                ${towerType.stats.cost} | DMG: {towerType.stats.damage} | RNG: {towerType.stats.range}
              </small>
            </div>
          );
        })}
      </div>
      <div className="controls">
        <button className="control-button" onClick={onCancelPlacement}>
          Cancel (ESC)
        </button>
      </div>
    </div>
  );
};
