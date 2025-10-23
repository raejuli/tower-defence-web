/**
 * Placement Service Implementation
 */

import { IPlacementService } from './IGameServices';
import { Graphics, Container } from 'pixi.js';
import { StateMachine } from '../../engine/state/StateMachine';
import { TowerDefenceGame } from '../TowerDefenceGame';
import { PlacementState } from '../states/PlacementState';

export class PlacementService implements IPlacementService {
  private _placementPreview: Graphics | null = null;
  private _stage: Container;
  private _gameStateMachine: StateMachine<TowerDefenceGame> | null = null;

  constructor(stage: Container) {
    this._stage = stage;
  }

  public setGameStateMachine(gameStateMachine: StateMachine<TowerDefenceGame>): void {
    this._gameStateMachine = gameStateMachine;
  }

  public updatePreview(x: number, y: number, range: number, canPlace: boolean): void {
    if (!this._placementPreview) {
      this._placementPreview = new Graphics();
      this._stage.addChild(this._placementPreview);
      this._placementPreview.zIndex = 50;
    }

    this._placementPreview.clear();
    
    const size = 30;
    const color = canPlace ? 0x00ff00 : 0xff0000;
    const alpha = 0.5;
    
    // Center the tower on the cursor
    const centerX = x - size / 2;
    const centerY = y - size / 2;
    
    // Draw placement square (centered on cursor)
    this._placementPreview.rect(centerX, centerY, size, size);
    this._placementPreview.fill({ color, alpha });
    
    // Draw range circle (centered on cursor)
    this._placementPreview.circle(x, y, range);
    this._placementPreview.stroke({ width: 2, color, alpha: 0.3 });
  }

  public hidePreview(): void {
    if (this._placementPreview) {
      this._placementPreview.clear();
    }
  }

  public enterPlacementMode(towerType: string, range: number): void {
    if (!this._gameStateMachine) {
      console.error('PlacementService: Game state machine not set. Call setGameStateMachine() first.');
      return;
    }

    const placementState = this._gameStateMachine.getState('placement') as PlacementState;
    if (placementState) {
      placementState.setSelectedTowerType(towerType, range);
    }
    this._gameStateMachine.setState('placement');
  }

  public exitPlacementMode(): void {
    if (!this._gameStateMachine) {
      console.error('PlacementService: Game state machine not set. Call setGameStateMachine() first.');
      return;
    }

    this._gameStateMachine.setState('playing');
  }
}
