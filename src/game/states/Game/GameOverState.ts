/**
 * Game Over State
 * 
 * BEHAVIOUR TREE ARCHITECTURE:
 * This state represents the "GAME OVER" condition in the behaviour tree.
 * It handles the loss condition and provides options to return to scene select.
 * 
 * RESPONSIBILITIES (Game Rules):
 * - Display game over screen with final stats
 * - Show the player's score and performance
 * - Provide option to return to scene select
 * - Clean up any remaining game entities
 * 
 * STATE TRANSITIONS:
 * GameOverState -> SceneSelectState (when player chooses to continue)
 * 
 * ENTRY CONDITIONS:
 * - Player's lives reach 0
 */

import { State } from '@raejuli/core-engine-gdk/state';
import type { TowerDefenceGame } from '../../TowerDefenceGame';
import { ServiceLocator } from '@raejuli/core-engine-gdk';
import { UIService } from '../../services/UIService';

export class GameOverState extends State<TowerDefenceGame> {
  private returnTimer: number = 0;
  private readonly AUTO_RETURN_DELAY = 3.0; // Seconds before showing return option

  public onEnter(): void {
    console.log('💀 Game Over - Player has lost');
    const ui = ServiceLocator.get<UIService>('UI').ui;

    this.returnTimer = 0;

    // Pause the game
    this.context.gameState.isPaused = true;

    // Get current wave from spawner entities
    const spawners = this.context.world.getEntitiesWithComponents(['WaveSpawner']);
    const currentWave = spawners.length > 0
      ? (spawners[0].getComponent('WaveSpawner') as any)?.currentWave || 0
      : 0;

    // Update UI to show game over screen
    ui.setState({
      isGameOver: true,
      money: this.context.gameState.money,
      lives: 0,
      wave: currentWave,
      score: this.context.gameState.score,
      isPaused: true
    });

    // Listen for return to menu event
    ui.on('returnToMenu', this._handleReturnToMenu);
  }

  public onUpdate(deltaTime: number): void {
    const ui = ServiceLocator.get<UIService>('UI').ui;
    // RULE: Wait a moment before allowing return to menu
    this.returnTimer += deltaTime;

    if (this.returnTimer >= this.AUTO_RETURN_DELAY) {
      // Show the return button after delay
      ui.setGameOverReady(true);
    }
  }

  onExit(): void {
    const ui = ServiceLocator.get<UIService>('UI').ui;
    console.log('💀 Exited Game Over State');

    // Clean up UI event listeners
    ui.off('returnToMenu', this._handleReturnToMenu);

    // Hide game over UI
    ui.setState({
      isGameOver: false,
      isPaused: false
    });
  }

  // ============================================================
  // GAME RULES
  // ============================================================

  /**
   * RULE: When player chooses to return, go back to scene select
   */
  private _handleReturnToMenu = (): void => {
    console.log('🔙 Returning to scene select');
    this.context.gameStateMachine.setState('sceneSelect');
  };
}
