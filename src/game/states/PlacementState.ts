/**
 * Game States - Placement State
 * BEHAVIOUR TREE: Defines tower placement behaviour
 */

import { State } from '@raejuli/core-engine-gdk/state';
import { TowerDefenceGame } from '../TowerDefenceGame';
import { ServiceLocator } from '@raejuli/core-engine-gdk/services';
import { IPlacementService, ITowerService, IGameStateService } from '../services/IGameServices';
import { UIService } from '../services/UIService';

/**
 * PLACEMENT STATE BEHAVIOUR TREE
 * 
 * This state defines the rules for placing towers on the map.
 * 
 * Flow:
 * 1. Show ghost tower preview following mouse cursor
 * 2. RULE: Preview is green if valid placement location
 * 3. RULE: Preview is red if invalid (on path or occupied)
 * 4. On click:
 *    - RULE: If valid position AND enough money → Place tower
 *    - RULE: Deduct tower cost from player money
 *    - RULE: Return to playing state
 * 5. On cancel (right-click/escape) → Return to playing state
 */
export class PlacementState extends State<TowerDefenceGame> {
  private _selectedTowerType: string | null = null;
  private _selectedTowerRange: number = 100;
  private _placementRequestHandler: ((data: any) => void) | null = null;
  private _placementCancelledHandler: (() => void) | null = null;

  public onEnter(previousState?: State<TowerDefenceGame>): void {
    console.log('🏗️ Entered placement mode - Move mouse to place tower');
    console.log('Selected tower type:', this._selectedTowerType);
    
    // Pause the game during placement
    const gameStateService = ServiceLocator.get<IGameStateService>('GameStateService');
    gameStateService.setPaused(true);
    
    const ui = ServiceLocator.get<UIService>('UI').ui;

    // Register UI event listener for placement requests
    this._placementRequestHandler = (data: any) => {
      console.log('PlacementState: Received towerPlacementRequested event', data);
      this.handlePlacementRequest(data.towerType, data.x, data.y);
    };

    // Register UI event listener for placement cancelled
    this._placementCancelledHandler = () => {
      console.log('Placement cancelled');
      this._context.gameStateMachine.setState('playing');
    };

    ui.on('towerPlacementRequested', this._placementRequestHandler);
    ui.on('placementCancelled', this._placementCancelledHandler);
    console.log('PlacementState: Event listeners registered');
  }

  /**
   * PLACEMENT UPDATE LOOP
   * Each frame, update the ghost tower preview to follow the mouse
   */
  public onUpdate(deltaTime: number): void {
    if (!this._selectedTowerType) return;

    // ============================================================
    // RULE 1: Ghost tower follows mouse cursor
    // ============================================================
    const mousePos = this._context.input.getMousePosition();
    const x = mousePos.x;
    const y = mousePos.y;

    // ============================================================
    // RULE 2: Validate placement location
    // GAME RULE: Can't place on path or on other towers
    // ============================================================
    const towerService = ServiceLocator.get<ITowerService>('TowerService');
    const canPlace = towerService.canPlaceTower(x, y);

    // ============================================================
    // RULE 3: Visual feedback - green if valid, red if invalid
    // ============================================================
    const placementService = ServiceLocator.get<IPlacementService>('PlacementService');
    placementService.updatePreview(x, y, this._selectedTowerRange, canPlace);
  }

  public onExit(nextState?: State<TowerDefenceGame>): void {
    console.log('✅ Exited placement mode');
    
    // Unpause the game when exiting placement
    const gameStateService = ServiceLocator.get<IGameStateService>('GameStateService');
    gameStateService.setPaused(false);
    
    const ui = ServiceLocator.get<UIService>('UI').ui;

    // Unregister UI event listeners
    if (this._placementRequestHandler) {
      ui.off('towerPlacementRequested', this._placementRequestHandler);
      this._placementRequestHandler = null;
    }

    if (this._placementCancelledHandler) {
      ui.off('placementCancelled', this._placementCancelledHandler);
      this._placementCancelledHandler = null;
    }

    // Clean up visual feedback
    const placementService = ServiceLocator.get<IPlacementService>('PlacementService');
    placementService.hidePreview();

    ui.setPlacementMode(false);
  }

  public setSelectedTowerType(type: string, range: number): void {
    console.log('setSelectedTowerType called with:', type, range);
    const ui = ServiceLocator.get<UIService>('UI').ui;
    this._selectedTowerType = type;
    this._selectedTowerRange = range;
    ui.setPlacementMode(true);
  }

  public getSelectedTowerType(): string | null {
    return this._selectedTowerType;
  }

  /**
   * PLACEMENT REQUEST HANDLER
   * This is called when the player clicks to place a tower
   */
  public handlePlacementRequest(towerType: string, _x: number, _y: number): void {
    // Always trust the engine's input manager for final placement coordinates
    const { x: pointerX, y: pointerY } = this._context.input.getMousePosition();

    const ui = ServiceLocator.get<UIService>('UI').ui;
    const towerData = ui.towerTypes.get(towerType);
    if (!towerData) {
      console.log('❌ Tower data not found for type:', towerType);
      return;
    }

    // ============================================================
    // RULE 1: Validate placement location
    // GAME RULE: Can't place on path or on other towers
    // ============================================================
    const towerService = ServiceLocator.get<ITowerService>('TowerService');
    if (!towerService.canPlaceTower(pointerX, pointerY)) {
      console.log('❌ Cannot place tower here!');
      return;
    }

    // ============================================================
    // RULE 2: Check if player can afford the tower
    // GAME RULE: Must have enough money to buy tower
    // ============================================================
    const gameStateService = ServiceLocator.get<IGameStateService>('GameStateService');
    if (!gameStateService.spendMoney(towerData.stats.cost)) {
      console.log('❌ Not enough money!');
      return;
    }

    // ============================================================
    // RULE 3: Create tower entity and add to game using TowerService
    // ============================================================
  towerService.createAndPlaceTower(pointerX, pointerY, towerType, towerData);

    // ============================================================
    // RULE 4: Exit placement mode after successful placement
    // ============================================================
    this._context.gameStateMachine.setState('playing')
  }
}
