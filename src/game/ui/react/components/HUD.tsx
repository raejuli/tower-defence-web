/**
 * HUD Component - Displays game stats
 */

import React from 'react';
import './HUD.css';

export interface HUDProps {
  money: number;
  lives: number;
  wave: number;
  score: number;
}

export const HUD: React.FC<HUDProps> = ({ money, lives, wave, score }) => {
  return (
    <div className="hud">
      <div className="hud-item">💰 Money: ${money}</div>
      <div className="hud-item">❤️ Lives: {lives}</div>
      <div className="hud-item">🌊 Wave: {wave}</div>
      <div className="hud-item">⭐ Score: {score}</div>
    </div>
  );
};
