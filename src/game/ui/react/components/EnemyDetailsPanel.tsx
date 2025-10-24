/**
 * Enemy Details Panel Component
 * 
 * Displays detailed information about a selected enemy
 */

import React from 'react';
import './EnemyDetailsPanel.css';
import { Entity } from '@raejuli/core-engine-gdk';

export interface EnemyDetailsPanelProps {
  enemy: Entity;
  onClose: () => void;
}

export const EnemyDetailsPanel: React.FC<EnemyDetailsPanelProps> = ({ enemy, onClose }) => {
  const enemyComponent = enemy.getComponent('Enemy');
  
  if (!enemyComponent) {
    return null;
  }

  // Get enemy stats using toString
  const details = enemyComponent.toString() || '';
  const lines = details.split('\n');

  return (
    <div className="enemy-details-panel">
      <div className="enemy-details-header">
        <h3>Enemy Details</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="enemy-details-body">
        <div className="enemy-info">
          <strong>{enemy.name}</strong>
          <div className="enemy-id">ID: {enemy.id}</div>
        </div>
        <div className="enemy-stats">
          {lines.map((line, index) => {
            const [label, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim();
            return (
              <div key={index} className="stat-row">
                <span className="stat-label">{label}:</span>
                <span className="stat-value">{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
