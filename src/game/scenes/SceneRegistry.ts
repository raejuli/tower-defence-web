/**
 * Scene Registry - Central repository for all available scenes
 * 
 * This registry holds all playable scenes in the game.
 * Scenes can be retrieved by ID or listed for selection menus.
 */

import { SceneModel, SceneConfiguration } from '../models/SceneModel';

export class SceneRegistry {
  private static scenes: Map<string, SceneModel> = new Map();

  /**
   * Register a new scene
   */
  static register(config: SceneConfiguration): void {
    const scene = new SceneModel(config);
    this.scenes.set(scene.id, scene);
    console.log(`📦 Registered scene: ${scene.name} (${scene.id})`);
  }

  /**
   * Get a scene by ID
   */
  static getScene(id: string): SceneModel | undefined {
    return this.scenes.get(id);
  }

  /**
   * Get all available scenes
   */
  static getAllScenes(): SceneModel[] {
    return Array.from(this.scenes.values());
  }

  /**
   * Get scenes filtered by difficulty
   */
  static getScenesByDifficulty(difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert'): SceneModel[] {
    return this.getAllScenes().filter(scene => scene.difficulty === difficulty);
  }

  /**
   * Clear all scenes (useful for testing)
   */
  static clear(): void {
    this.scenes.clear();
  }
}

// ============================================================
// BUILT-IN SCENES
// ============================================================

// Scene 1: Tutorial Path (Easy)
SceneRegistry.register({
  metadata: {
    id: 'tutorial-path',
    name: 'Tutorial Path',
    description: 'A simple winding path perfect for learning the basics.',
    difficulty: 'Easy'
  },
  path: [
    { x: 0, y: 200 },
    { x: 200, y: 200 },
    { x: 200, y: 400 },
    { x: 400, y: 400 },
    { x: 400, y: 100 },
    { x: 600, y: 100 },
    { x: 600, y: 300 },
    { x: 800, y: 300 }
  ],
  width: 800,
  height: 600,
  backgroundColor: 0x1a1a2e,
  waves: {
    enemiesPerWave: 5,
    enemyHealth: 50,
    enemySpeed: 50,
    enemyDamage: 1,
    enemyReward: 25,
    spawnInterval: 1.0,
    idleDuration: 10.0
  },
  startingMoney: 500,
  startingLives: 20
});

// Scene 2: Spiral Challenge (Medium)
SceneRegistry.register({
  metadata: {
    id: 'spiral-challenge',
    name: 'Spiral Challenge',
    description: 'A spiral path that tests your tower placement strategy.',
    difficulty: 'Medium'
  },
  path: [
    { x: 0, y: 300 },
    { x: 150, y: 300 },
    { x: 150, y: 150 },
    { x: 450, y: 150 },
    { x: 450, y: 450 },
    { x: 250, y: 450 },
    { x: 250, y: 250 },
    { x: 600, y: 250 },
    { x: 600, y: 500 },
    { x: 800, y: 500 }
  ],
  width: 800,
  height: 600,
  backgroundColor: 0x1a2a1e,
  waves: {
    enemiesPerWave: 8,
    enemyHealth: 75,
    enemySpeed: 60,
    enemyDamage: 2,
    enemyReward: 30,
    spawnInterval: 0.8,
    idleDuration: 8.0
  },
  startingMoney: 400,
  startingLives: 15
});

// Scene 3: Zigzag Rush (Hard)
SceneRegistry.register({
  metadata: {
    id: 'zigzag-rush',
    name: 'Zigzag Rush',
    description: 'Fast enemies on a zigzag path. Can you keep up?',
    difficulty: 'Hard'
  },
  path: [
    { x: 0, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 300 },
    { x: 400, y: 300 },
    { x: 400, y: 150 },
    { x: 600, y: 150 },
    { x: 600, y: 450 },
    { x: 800, y: 450 }
  ],
  width: 800,
  height: 600,
  backgroundColor: 0x2a1a1e,
  waves: {
    enemiesPerWave: 12,
    enemyHealth: 100,
    enemySpeed: 80,
    enemyDamage: 3,
    enemyReward: 35,
    spawnInterval: 0.6,
    idleDuration: 6.0
  },
  startingMoney: 350,
  startingLives: 10
});

// Scene 4: The Maze (Expert)
SceneRegistry.register({
  metadata: {
    id: 'the-maze',
    name: 'The Maze',
    description: 'A complex maze with many turns. Ultimate challenge!',
    difficulty: 'Expert'
  },
  path: [
    { x: 0, y: 500 },
    { x: 150, y: 500 },
    { x: 150, y: 200 },
    { x: 300, y: 200 },
    { x: 300, y: 450 },
    { x: 450, y: 450 },
    { x: 450, y: 100 },
    { x: 600, y: 100 },
    { x: 600, y: 350 },
    { x: 750, y: 350 },
    { x: 750, y: 550 },
    { x: 800, y: 550 }
  ],
  width: 800,
  height: 600,
  backgroundColor: 0x1a1a3e,
  waves: {
    enemiesPerWave: 15,
    enemyHealth: 150,
    enemySpeed: 70,
    enemyDamage: 5,
    enemyReward: 50,
    spawnInterval: 0.5,
    idleDuration: 5.0
  },
  startingMoney: 300,
  startingLives: 5
});
