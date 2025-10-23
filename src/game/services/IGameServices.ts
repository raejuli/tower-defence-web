/**
 * Game Services - Interfaces for core game services
 */

import { Entity } from '../../engine/ecs/Entity';

export interface IGameStateService {
  addMoney(amount: number): void;
  spendMoney(amount: number): boolean;
  loseLife(damage: number): void;
  addScore(points: number): void;
  getMoney(): number;
  getLives(): number;
  getScore(): number;
  isPaused(): boolean;
  setPaused(paused: boolean): void;
}

export interface IEnemyService {
  onEnemyKilled(reward: number): void;
  onEnemyReachedEnd(damage: number): void;
  spawnEnemy(): void;
}

export interface ITowerService {
  onTowerClicked(tower: Entity): void;
  deselectAllTowers(): void;
  canPlaceTower(x: number, y: number): boolean;
  isPositionOnPath(x: number, y: number, size?: number): boolean;
  isPositionOccupied(x: number, y: number, size?: number): boolean;
}

export interface IPlacementService {
  updatePreview(x: number, y: number, range: number, canPlace: boolean): void;
  hidePreview(): void;
  enterPlacementMode(towerType: string, range: number): void;
  exitPlacementMode(): void;
}
