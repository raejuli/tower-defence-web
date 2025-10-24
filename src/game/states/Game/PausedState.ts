/**
 * Game States - Paused State
 * BEHAVIOUR TREE: Defines paused game behaviour
 */

import { State } from '@raejuli/core-engine-gdk/state';
import { TowerDefenceGame } from '../../TowerDefenceGame';

/**
 * PAUSED STATE BEHAVIOUR TREE
 * 
 * This state defines what happens when the game is paused.
 * 
 * Flow:
 * 1. Stop all game logic updates
 * 2. Keep rendering (so player can see the game state)
 * 3. Wait for unpause input
 */
export class PausedState extends State<TowerDefenceGame> {
  public onEnter(previousState?: State<TowerDefenceGame>): void {
    console.log('⏸️ Game paused');
    // GAME RULE: Game state is marked as paused (handled by TowerDefenceGame)
    // This prevents game loop from running
  }

  public onUpdate(deltaTime: number): void {
    // ============================================================
    // RULE: While paused, no game logic updates
    // ============================================================
    // The game loop in TowerDefenceGame checks isPaused flag
    // and skips all system updates when paused
    // 
    // This state intentionally does nothing - pause means freeze gameplay
  }

  public onExit(nextState?: State<TowerDefenceGame>): void {
    console.log('▶️ Game resumed');
    // GAME RULE: Game state is marked as active (handled by TowerDefenceGame)
  }
}
