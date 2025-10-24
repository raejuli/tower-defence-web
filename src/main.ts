/**
 * Main Entry Point
 */

import { TowerDefenceGame } from "./game/TowerDefenceGame";
import { initializeGameSystems } from "./game/init/GameInitializer";

async function main() {
  // Create game container
  const gameContainer = document.getElementById('game-container');
  if (!gameContainer) {
    console.error('Game container not found!');
    return;
  }

  // Initialize serialization system and load JSON scenes
  console.log('🎮 Initializing game systems...');
  await initializeGameSystems();

  // Check for debug mode (via URL parameter or localStorage)
  const urlParams = new URLSearchParams(window.location.search);
  const debugMode = urlParams.has('debug') || localStorage.getItem('debugMode') === 'true';

  if (debugMode) {
    console.log('🐛 Debug mode enabled via URL parameter or localStorage');
    console.log('   Waypoints will be visualized on the path');
  }

  // Create and initialize game
  const game = new TowerDefenceGame({
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a2e,
    debug: true
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

  if (debugMode) {
    console.log('');
    console.log('🐛 Debug Mode Controls:');
    console.log('   - Green circles = waypoints');
    console.log('   - Red = start point, Blue = end point, Yellow = intermediate points');
    console.log('   - To disable: remove ?debug from URL or run: localStorage.removeItem("debugMode")');
  } else {
    console.log('');
    console.log('💡 Tip: Add ?debug to URL to enable debug visualizations');
    console.log('   Or run: localStorage.setItem("debugMode", "true")');
  }
}

// Start the game when the page loads
window.addEventListener('DOMContentLoaded', main);
