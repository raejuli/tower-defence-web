/**
 * Serialization System Initializer
 * 
 * Initializes the serialization system.
 * Scenes are loaded by SceneRegistry from JSON files.
 */

import { registerComponentFactories } from '../loaders/ComponentFactoryRegistry';

/**
 * Initialize the serialization system
 * Call this before loading any scenes
 */
export async function initializeSerializationSystem(): Promise<void> {
  console.log('🔧 Initializing serialization system...');
  
  // Register component factories
  registerComponentFactories();
  
  console.log('✅ Serialization system initialized');
}

/**
 * Initialize everything needed for the game
 */
export async function initializeGameSystems(): Promise<void> {
  await initializeSerializationSystem();
  // Note: Scenes are now loaded by SceneRegistry.loadFromFiles() at startup
}
