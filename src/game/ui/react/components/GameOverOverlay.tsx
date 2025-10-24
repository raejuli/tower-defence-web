/**
 * GameOverOverlay Component - Game over screen
 */

import React from 'react';
import './GameOverlay.css';

export interface GameOverOverlayProps {
  score: number;
  wave: number;
  money: number;
  canReturn: boolean;
  onReturn: () => void;
}

export const GameOverOverlay: React.FC<GameOverOverlayProps> = ({
  score,
  wave,
  money,
  canReturn,
  onReturn
}) => {
  return (
    <div className="game-overlay">
      <div className="end-game-content">
        <h1 className="game-over-title">💀 GAME OVER</h1>
        <div className="end-game-stats">
          <div>Final Score: <span>{score}</span></div>
          <div>Wave Reached: <span>{wave}</span></div>
          <div>Money Remaining: $<span>{money}</span></div>
        </div>
        <button
          className={`return-button ${canReturn ? 'ready' : ''}`}
          onClick={onReturn}
        >
          Return to Menu
        </button>
      </div>
    </div>
  );
};
