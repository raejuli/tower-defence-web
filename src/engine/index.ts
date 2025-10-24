/**
 * Game Engine Core Exports
 * 
 * This file re-exports the core engine functionality from the shared library
 * plus the game-specific components, systems, and serialization.
 */

// Re-export core ECS from shared library
export * from '@raejuli/core-engine-gdk/ecs';

// Re-export state management from shared library
export * from '@raejuli/core-engine-gdk/state';

// Re-export services from shared library
export * from '@raejuli/core-engine-gdk/services';

// Game-specific systems
export * from './systems';
