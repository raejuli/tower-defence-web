/**
 * Main Entry Point
 */

import { TowerDefenceGame } from "./game/TowerDefenceGame";

async function main() {
  // Create game container
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) {
    console.error('Game container not found!');
    return;
  }

  // Create and initialize game
  const game = new TowerDefenceGame({
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a2e
  });

  await game.initialize(gameContainer);

  // Hide loading screen
  const loadingEl = document.getElementById('loading');
  if (loadingEl) {
    loadingEl.style.display = 'none';
  }

  console.log('Tower Defence Game Initialized!');
  console.log('Select a tower and place it on the map.');
  console.log('Waves start automatically after a delay.');
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', main);
