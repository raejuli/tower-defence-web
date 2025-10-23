/**
 * Enemy Service Implementation
 */

import { IEnemyService } from './IGameServices';
import { ServiceLocator } from '../../engine/services/ServiceLocator';
import { IGameStateService } from './IGameServices';
import { World } from '../../engine/ecs/World';
import { TransformComponent } from '../../engine/components/TransformComponent';
import { RenderableComponent } from '../../engine/components/RenderableComponent';
import { StateMachineComponent } from '../../engine/components/StateMachineComponent';
import { EnemyComponent } from '../components/EnemyComponent';
import { PathFollowerComponent } from '../components/PathFollowerComponent';
import { WaveStateModel } from '../models/WaveStateModel';
import { LevelModel } from '../models/LevelModel';
import { Entity } from '../../engine/ecs/Entity';
import {
  EnemyMovingState,
  EnemyDamagedState,
  EnemyStunnedState,
  EnemySlowedState,
  EnemyDeadState,
  EnemyReachedEndState
} from '../states/EnemyStates';

export class EnemyService implements IEnemyService {
  private _world: World | null = null;
  private _waveState: WaveStateModel | null = null;
  private _level: LevelModel | null = null;
  private _pathEntity: Entity | null = null;

  public setDependencies(world: World, waveState: WaveStateModel, level: LevelModel, pathEntity: Entity): void {
    this._world = world;
    this._waveState = waveState;
    this._level = level;
    this._pathEntity = pathEntity;
  }

  public onEnemyKilled(reward: number): void {
    const gameStateService = ServiceLocator.get<IGameStateService>('GameStateService');
    gameStateService.addMoney(reward);
    gameStateService.addScore(reward);
  }

  public onEnemyReachedEnd(damage: number): void {
    const gameStateService = ServiceLocator.get<IGameStateService>('GameStateService');
    gameStateService.loseLife(damage);
  }

  public spawnEnemy(): void {
    if (!this._world || !this._waveState || !this._level || !this._pathEntity) {
      console.error('EnemyService: Dependencies not set. Call setDependencies() first.');
      return;
    }

    const enemy = this._world.createEntity('Enemy');
    
    const enemySize = 20;
    // Add transform - center enemy on path start
    const startPos = this._level.path[0];
    const transform = new TransformComponent(startPos.x - enemySize / 2, startPos.y - enemySize / 2);
    enemy.addComponent(transform);

    // Calculate scaled stats based on wave
    const health = Math.floor(this._waveState.config.enemyHealth * (1 + (this._waveState.currentWave - 1) * 0.2));
    const speed = this._waveState.config.enemySpeed * (1 + (this._waveState.currentWave - 1) * 0.05);
    const reward = Math.floor(this._waveState.config.enemyReward * (1 + (this._waveState.currentWave - 1) * 0.15));

    // Add enemy component
    const enemyComp = new EnemyComponent({
      health: health,
      maxHealth: health,
      speed: speed,
      damage: this._waveState.config.enemyDamage,
      reward: reward
    });
    enemy.addComponent(enemyComp);

    // Add path follower - reference the path entity
    const pathFollower = new PathFollowerComponent(this._pathEntity.id, speed);
    enemy.addComponent(pathFollower);

    // Add renderable
    const renderable = new RenderableComponent();
    renderable.graphics.rect(0, 0, enemySize, enemySize);
    renderable.graphics.fill(0xff0000);
    enemy.addComponent(renderable);

    // Add state machine with all enemy states
    const stateMachine = new StateMachineComponent(enemy);
    stateMachine.stateMachine.addState(new EnemyMovingState('moving', enemy));
    stateMachine.stateMachine.addState(new EnemyDamagedState('damaged', enemy));
    stateMachine.stateMachine.addState(new EnemyStunnedState('stunned', enemy, 1.0));
    stateMachine.stateMachine.addState(new EnemySlowedState('slowed', enemy, 2.0, 0.5));
    stateMachine.stateMachine.addState(new EnemyDeadState('dead', enemy));
    stateMachine.stateMachine.addState(new EnemyReachedEndState('reachedEnd', enemy));
    stateMachine.stateMachine.setState('moving');
    enemy.addComponent(stateMachine);
  }
}
