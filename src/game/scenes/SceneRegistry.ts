/**
 * Scene Registry - Central repository for all available scenes
 * 
 * This registry loads all playable scenes from JSON files.
 * Scenes can be retrieved by ID or listed for selection menus.
 */

import { SerializedScene } from '@raejuli/core-engine-gdk/serialization';
import { SceneLoader } from '../loaders/SceneLoader';

// Import scene JSON files directly so Vite bundles them
import tutorialPathScene from './data/tutorial-path.json';
import progressiveOnslaughtScene from './data/progressive-onslaught.json';
import dualAssaultScene from './data/dual-assault.json';
import spiralChallengeScene from './data/spiral-challenge.json';
import zigzagRushScene from './data/zigzag-rush.json';
import theMazeScene from './data/the-maze.json';

export class SceneRegistry {
  private static scenes: Map<string, SerializedScene> = new Map();
  private static initialized = false;

  /**
   * Register a scene directly
   */
  static registerScene(scene: SerializedScene): void {
    this.scenes.set(scene.metadata.id, scene);
    console.log(`📦 Registered scene: ${scene.metadata.name} (${scene.metadata.id})`);
  }

  /**
   * Load and register a scene from a JSON file
   */
  static async loadFromFile(url: string): Promise<SerializedScene> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const scene: SerializedScene = await response.json();
      this.registerScene(scene);
      return scene;
    } catch (error) {
      console.error(`❌ Failed to load scene from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Load and register multiple scenes from JSON files
   */
  static async loadFromFiles(urls: string[]): Promise<SerializedScene[]> {
    const promises = urls.map(url => this.loadFromFile(url));
    return Promise.all(promises);
  }

  /**
   * Get a scene by ID
   */
  static getScene(id: string): SerializedScene | undefined {
    return this.scenes.get(id);
  }

  /**
   * Get all available scenes
   */
  static getAllScenes(): SerializedScene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * Get scenes filtered by difficulty
   */
  static getScenesByDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): SerializedScene[] {
    return this.getAllScenes().filter(scene => {
      const gameStateEntity = scene.entities.find(e => e.type === 'gamestate');
      const gameStateComponent = gameStateEntity?.components.find(c => c.type === 'GameState');
      return (gameStateComponent?.data as any)?.difficulty === difficulty;
    });
  }

  /**
   * Clear all scenes (useful for testing)
   */
  static clear(): void {
    this.scenes.clear();
  }

  /**
   * Initialize built-in scenes (call this at startup)
   */
  static initialize(): void {
    if (this.initialized) return;

    console.log('📦 Initializing built-in scenes...');

    // Register all imported scenes
    const builtInScenes = [
      tutorialPathScene,
      progressiveOnslaughtScene,
      dualAssaultScene,
      spiralChallengeScene,
      zigzagRushScene,
      theMazeScene
    ];

    for (const scene of builtInScenes) {
      this.registerScene(scene as SerializedScene);
    }

    this.initialized = true;
    console.log(`✅ Loaded ${builtInScenes.length} built-in scenes`);
  }
}

// Initialize scenes immediately when this module is loaded
SceneRegistry.initialize();