/**
 * Enemy Service Implementation
 */

import { IEnemyService } from './IGameServices';
import { ServiceLocator } from '../../engine/services/ServiceLocator';
import { IGameStateService } from './IGameServices';

export class EnemyService implements IEnemyService {
  public onEnemyKilled(reward: number): void {
    const gameStateService = ServiceLocator.get<IGameStateService>('GameStateService');
    gameStateService.addMoney(reward);
    gameStateService.addScore(reward);
  }

  public onEnemyReachedEnd(damage: number): void {
    const gameStateService = ServiceLocator.get<IGameStateService>('GameStateService');
    gameStateService.loseLife(damage);
  }
}
