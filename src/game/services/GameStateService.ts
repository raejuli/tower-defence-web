/**
 * Game State Service Implementation
 */

import { IGameStateService } from './IGameServices';
import { GameStateModel } from '../models/GameStateModel';

export class GameStateService implements IGameStateService {
  constructor(private readonly _gameState: GameStateModel) {}

  public addMoney(amount: number): void {
    this._gameState.money += amount;
  }

  public spendMoney(amount: number): boolean {
    if (this._gameState.money >= amount) {
      this._gameState.money -= amount;
      return true;
    }
    return false;
  }

  public loseLife(damage: number = 1): void {
    this._gameState.lives = Math.max(0, this._gameState.lives - damage);
    console.log(`Lives lost! Remaining: ${this._gameState.lives}`);
    if (this._gameState.lives <= 0) {
      this._gameOver();
    }
  }

  public addScore(points: number): void {
    this._gameState.score += points;
  }

  public getMoney(): number {
    return this._gameState.money;
  }

  public getLives(): number {
    return this._gameState.lives;
  }

  public getScore(): number {
    return this._gameState.score;
  }

  public isPaused(): boolean {
    return this._gameState.isPaused;
  }

  public setPaused(paused: boolean): void {
    this._gameState.isPaused = paused;
  }

  private _gameOver(): void {
    console.log('Game Over! Score:', this._gameState.score);
    // Emit game over event or handle through event system
  }
}
