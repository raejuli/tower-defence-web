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

import { State } from '@raejuli/core-engine-gdk/state';
import type { TowerDefenceGame } from '../TowerDefenceGame';
import { SceneRegistry } from '../scenes/SceneRegistry';
import { SerializedScene } from '@raejuli/core-engine-gdk/serialization';
import { ServiceLocator } from '@raejuli/core-engine-gdk';
import { UIService } from '../services/UIService';
import { EventBus } from '@raejuli/core-engine-gdk/events';

export class SceneSelectState extends State<TowerDefenceGame> {
  private selectedSceneId: string | null = null;
  private sceneButtons: HTMLElement[] = [];

  onEnter(): void {
    console.log('🎬 Entered SceneSelectState');
    const ui = ServiceLocator.get<UIService>('UI').ui;
    const events = ServiceLocator.get<EventBus>('EventBus');

    // Update UI to show scene selection screen
    ui.setState({
      isSceneSelect: true,
      money: 0,
      lives: 0,
      wave: 0,
      score: 0,
      isPaused: false
    });

    // Listen for scene selection events (using EventBus directly)
    events.on('ui:sceneSelected', this.handleSceneSelected);

    // RULE: Display all available scenes for selection
    this.displayScenes();
  }

  onUpdate(deltaTime: number): void {
    // RULE: Wait for player to select a scene (handled via events)
    // No active game simulation in this state
  }

  onExit(): void {
    console.log('🎬 Exited SceneSelectState');
    const ui = ServiceLocator.get<UIService>('UI').ui;
    const events = ServiceLocator.get<EventBus>('EventBus');

    // Clean up UI event listeners (using EventBus directly)
    events.off('ui:sceneSelected', this.handleSceneSelected);

    // Hide scene selection UI
    ui.setState({
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
    const ui = ServiceLocator.get<UIService>('UI').ui;

    // Helper function to get difficulty from game state entity
    const getDifficulty = (scene: SerializedScene): string => {
      const gameStateEntity = scene.entities.find(e => e.type === 'gamestate');
      const gameStateComponent = gameStateEntity?.components.find(c => c.type === 'GameState');
      return (gameStateComponent?.data as any)?.difficulty || 'easy';
    };

    // Transform SerializedScene to UI format and group by difficulty
    const scenesByDifficulty = {
      Easy: scenes
        .filter(s => getDifficulty(s) === 'easy')
        .map(s => ({
          id: s.metadata.id,
          name: s.metadata.name,
          description: s.metadata.description || '',
          difficulty: getDifficulty(s)
        })),
      Medium: scenes
        .filter(s => getDifficulty(s) === 'medium')
        .map(s => ({
          id: s.metadata.id,
          name: s.metadata.name,
          description: s.metadata.description || '',
          difficulty: getDifficulty(s)
        })),
      Hard: scenes
        .filter(s => getDifficulty(s) === 'hard')
        .map(s => ({
          id: s.metadata.id,
          name: s.metadata.name,
          description: s.metadata.description || '',
          difficulty: getDifficulty(s)
        })),
      Expert: scenes
        .filter(s => getDifficulty(s) === 'extreme')
        .map(s => ({
          id: s.metadata.id,
          name: s.metadata.name,
          description: s.metadata.description || '',
          difficulty: getDifficulty(s)
        }))
    };

    // Send scene data to UI
    ui.setScenes(scenesByDifficulty);
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

    console.log(`✅ Scene selected: ${scene.metadata.name}`);
    this.selectedSceneId = sceneId;

    try {
      // RULE: Load the selected scene into the game
      this.loadScene(scene);

      // RULE: Transition to playing state to start the game
      console.log(`🎮 Transitioning to playing state...`);
      this.context.gameStateMachine.setState('playing');
    } catch (error) {
      console.error(`❌ Error loading scene:`, error);
    }
  };

  /**
   * RULE: Load a scene's configuration into the game
   */
  private loadScene(scene: SerializedScene): void {
    console.log(`🎬 Loading scene: ${scene.metadata.name}`);

    // Update game level with scene's path
    this.context.loadScene(scene);

    console.log(`✅ Scene loaded successfully`);
  }
}
