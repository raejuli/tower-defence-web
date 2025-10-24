/**
 * Game UI exports - Pure Functional React (No Classes!)
 */

// Main UI - Adapter for backwards compatibility with TowerDefenceGame
export { GameUIAdapter as GameUI } from './GameUIAdapter';
export type { GameUIState, TowerType } from './GameUI';

// Pure React Component (use this for new code!)
export { GameUIComponent } from './GameUI';
export type { GameUIHandle } from './GameUI';

// Events
export * from './UIEvents';

// React Components
export * from './react/components/HUD';
export * from './react/components/Shop';
export * from './react/components/SceneSelect';
export * from './react/components/GameOverOverlay';
export * from './react/components/GameWinOverlay';
export * from './react/components/TowerDetailsPanel';
