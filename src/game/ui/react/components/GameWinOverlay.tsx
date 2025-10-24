/**
 * GameWinOverlay Component - Victory screen
 */

import React from 'react';
import './GameOverlay.css';

export interface GameWinOverlayProps {
  score: number;
  wave: number;
  lives: number;
  money: number;
  canReturn: boolean;
  onReturn: () => void;
}

export const GameWinOverlay: React.FC<GameWinOverlayProps> = ({
  score,
  wave,
  lives,
  money,
  canReturn,
  onReturn
}) => {
  return (
    <div className="game-overlay">
      <div className="end-game-content">
        <h1 className="game-win-title">🎉 VICTORY!</h1>
        <div className="end-game-stats">
          <div>Final Score: <span>{score}</span></div>
          <div>Waves Completed: <span>{wave}</span></div>
          <div>Lives Remaining: <span>{lives}</span></div>
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
