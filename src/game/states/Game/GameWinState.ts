/**
 * Game Win State
 * 
 * BEHAVIOUR TREE ARCHITECTURE:
 * This state represents the "VICTORY" condition in the behaviour tree.
 * It handles the win condition and provides options to return to scene select.
 * 
 * RESPONSIBILITIES (Game Rules):
 * - Display victory screen with final stats
 * - Show the player's score and performance
 * - Provide option to return to scene select
 * - Celebrate the player's achievement
 * 
 * STATE TRANSITIONS:
 * GameWinState -> SceneSelectState (when player chooses to continue)
 * 
 * ENTRY CONDITIONS:
 * - All waves have been completed successfully
 * - Player still has lives remaining
 */

import { State } from '@raejuli/core-engine-gdk/state';
import type { TowerDefenceGame } from '../../TowerDefenceGame';
import { ServiceLocator } from '@raejuli/core-engine-gdk';
import { UIService } from '../../services/UIService';

export class GameWinState extends State<TowerDefenceGame> {
  private returnTimer: number = 0;
  private readonly AUTO_RETURN_DELAY = 2.0; // Seconds before showing return option

  onEnter(): void {
    console.log('🎉 Victory! Player has won the scene!');
    const ui = ServiceLocator.get<UIService>('UI').ui;

    this.returnTimer = 0;

    // Pause the game
    this.context.gameState.isPaused = true;

    // Get current wave from spawner entities
    const spawners = this.context.world.getEntitiesWithComponents(['WaveSpawner']);
    const currentWave = spawners.length > 0
      ? (spawners[0].getComponent('WaveSpawner') as any)?.currentWave || 0
      : 0;

    // Update UI to show victory screen
    ui.setState({
      isGameWin: true,
      money: this.context.gameState.money,
      lives: this.context.gameState.lives,
      wave: currentWave,
      score: this.context.gameState.score,
      isPaused: true
    });

    // Listen for return to menu event
    ui.on('returnToMenu', this.handleReturnToMenu);
  }

  onUpdate(deltaTime: number): void {
    const ui = ServiceLocator.get<UIService>('UI').ui;
    // RULE: Wait a moment before allowing return to menu
    this.returnTimer += deltaTime;

    if (this.returnTimer >= this.AUTO_RETURN_DELAY) {
      // Show the return button after delay
      console.log(`🎉 GameWinState: Timer reached ${this.returnTimer.toFixed(2)}s, showing button`);
      ui.setGameWinReady(true);
    } else {
      console.log(`🎉 GameWinState: Timer at ${this.returnTimer.toFixed(2)}s / ${this.AUTO_RETURN_DELAY}s`);
    }
  }

  onExit(): void {
    console.log('🎉 Exited Game Win State');
    const ui = ServiceLocator.get<UIService>('UI').ui;

    // Clean up UI event listeners
    ui.off('returnToMenu', this.handleReturnToMenu);

    // Hide victory UI
    ui.setState({
      isGameWin: false,
      isPaused: false
    });
  }

  // ============================================================
  // GAME RULES
  // ============================================================

  /**
   * RULE: When player chooses to return, go back to scene select
   */
  private handleReturnToMenu = (): void => {
    console.log('🔙 Returning to scene select');
    this.context.gameStateMachine.setState('sceneSelect');
  };
}
