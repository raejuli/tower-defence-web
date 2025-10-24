/**
 * Scene Select State
 * 
 * BEHAVIOUR TREE ARCHITECTURE:
 * This state implements the scene selection menu as a behaviour tree node.
 * It represents the "SELECT SCENE" game rule/flow.
 * 
 * RESPONSIBILITIES (Game Rules):
 * - Display available scenes to the player
 * - Allow player to select a scene to play
 * - Transition to placement mode when scene is selected
 * - Handle back navigation to main menu (if applicable)
 * 
 * STATE TRANSITIONS:
 * SceneSelectState -> PlacementState (when scene selected)
 * 
 * SERVICES USED:
 * - SceneRegistry: Get list of available scenes
 */

import { State } from '../../engine/state/StateMachine';
import type { TowerDefenceGame } from '../TowerDefenceGame';
import { SceneRegistry } from '../scenes/SceneRegistry';
import { SceneModel } from '../models/SceneModel';

export class SceneSelectState extends State<TowerDefenceGame> {
  private selectedSceneId: string | null = null;
  private sceneButtons: HTMLElement[] = [];

  onEnter(): void {
    console.log('🎬 Entered SceneSelectState');
    
    // Update UI to show scene selection screen
    this.context.ui.setState({
      isSceneSelect: true,
      money: 0,
      lives: 0,
      wave: 0,
      score: 0,
      isPaused: false
    });
    
    // Listen for scene selection events
    this.context.ui.on('sceneSelected', this.handleSceneSelected);
    
    // RULE: Display all available scenes for selection
    this.displayScenes();
  }

  onUpdate(deltaTime: number): void {
    // RULE: Wait for player to select a scene (handled via events)
    // No active game simulation in this state
  }

  onExit(): void {
    console.log('🎬 Exited SceneSelectState');
    
    // Clean up UI event listeners
    this.context.ui.off('sceneSelected', this.handleSceneSelected);
    
    // Hide scene selection UI
    this.context.ui.setState({
      isSceneSelect: false
    });
    
    // Clear scene button references
    this.sceneButtons = [];
  }

  // ============================================================
  // GAME RULES
  // ============================================================

  /**
   * RULE: Display all available scenes grouped by difficulty
   */
  private displayScenes(): void {
    const scenes = SceneRegistry.getAllScenes();
    console.log(`📋 Displaying ${scenes.length} available scenes`);
    
    // Group scenes by difficulty
    const scenesByDifficulty = {
      Easy: scenes.filter(s => s.difficulty === 'Easy'),
      Medium: scenes.filter(s => s.difficulty === 'Medium'),
      Hard: scenes.filter(s => s.difficulty === 'Hard'),
      Expert: scenes.filter(s => s.difficulty === 'Expert')
    };
    
    // Send scene data to UI
    this.context.ui.setScenes(scenesByDifficulty);
  }

  /**
   * RULE: When a scene is selected, load it and start the game
   */
  private handleSceneSelected = (sceneId: string): void => {
    const scene = SceneRegistry.getScene(sceneId);
    
    if (!scene) {
      console.error(`❌ Scene not found: ${sceneId}`);
      return;
    }
    
    console.log(`✅ Scene selected: ${scene.name}`);
    this.selectedSceneId = sceneId;
    
    // RULE: Load the selected scene into the game
    this.loadScene(scene);
    
    // RULE: Transition to placement state to start the game
    this.context.gameStateMachine.setState('placement');
  };

  /**
   * RULE: Load a scene's configuration into the game
   */
  private loadScene(scene: SceneModel): void {
    console.log(`🎬 Loading scene: ${scene.name}`);
    
    // Update game level with scene's path
    this.context.loadScene(scene);
    
    console.log(`✅ Scene loaded successfully`);
  }
}
