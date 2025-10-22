import { State } from '../../engine/state/StateMachine';
import { TowerDefenceGame } from '../TowerDefenceGame';
import { TransformComponent } from '../../engine/components/TransformComponent';
import { RenderableComponent } from '../../engine/components/RenderableComponent';
import { TowerComponent } from '../components/TowerComponent';
import { SelectableComponent } from '../components/SelectableComponent';
import { ChainLightningTowerComponent } from '../components/ChainLightningTowerComponent';
import { InteractableComponent } from '../../engine/components/InteractableComponent';
import { Entity } from '../../engine/ecs/Entity';
import { ServiceLocator } from '../../engine/services/ServiceLocator';
import { IPlacementService, ITowerService, IGameStateService } from '../services/IGameServices';

export class PlacementState extends State<TowerDefenceGame> {
  private _selectedTowerType: string | null = null;
  private _selectedTowerRange: number = 100;

  public onEnter(previousState?: State<TowerDefenceGame>): void {
    console.log('Entered placement mode - Move mouse to place tower');
  }

  public onUpdate(deltaTime: number): void {
    if (!this._selectedTowerType || !this._context.inputSystem) return;

    const mousePos = this._context.inputSystem.getMousePosition();
    
    // No grid snapping - free placement
    const x = mousePos.x;
    const y = mousePos.y;
    
    // Check if can place using service
    const towerService = ServiceLocator.get<ITowerService>('TowerService');
    const canPlace = towerService.canPlaceTower(x, y);
    
    // Update preview using service
    const placementService = ServiceLocator.get<IPlacementService>('PlacementService');
    placementService.updatePreview(x, y, this._selectedTowerRange, canPlace);
  }

  public onExit(nextState?: State<TowerDefenceGame>): void {
    console.log('Exited placement mode');
    
    const placementService = ServiceLocator.get<IPlacementService>('PlacementService');
    placementService.hidePreview();
    
    this._context['ui'].setPlacementMode(false);
  }

  public setSelectedTowerType(type: string, range: number): void {
    console.log('PlacementState: Setting tower type', type, 'with range', range);
    this._selectedTowerType = type;
    this._selectedTowerRange = range;
    this._context['ui'].setPlacementMode(true);
    console.log('PlacementState: UI placement mode set to true');
  }

  public getSelectedTowerType(): string | null {
    return this._selectedTowerType;
  }

  public handlePlacementRequest(towerType: string, x: number, y: number): void {
    console.log('PlacementState: Handling tower placement request', { towerType, x, y });
    
    const towerData = this._context['ui'].towerTypes.get(towerType);
    if (!towerData) {
      console.log('PlacementState: Tower data not found for type:', towerType);
      return;
    }

    // Check if placement is valid using service
    const towerService = ServiceLocator.get<ITowerService>('TowerService');
    if (!towerService.canPlaceTower(x, y)) {
      console.log('Cannot place tower here!');
      return;
    }

    // Check if can afford using service
    const gameStateService = ServiceLocator.get<IGameStateService>('GameStateService');
    if (!gameStateService.spendMoney(towerData.stats.cost)) {
      console.log('Not enough money!');
      return;
    }

    console.log('PlacementState: Creating tower entity');
    // Create tower entity
    const tower = this._createTowerEntity(x, y, towerData, towerType);
    
    // Add to placed towers list
    this._context.placedTowers.push(tower);
    console.log('PlacementState: Tower placed, total towers:', this._context.placedTowers.length);

    // Exit placement mode
    this._context.exitPlacementMode();
  }

  private _createTowerEntity(x: number, y: number, towerData: any, towerType: string): Entity {
    const tower = this._context.world.createEntity('Tower');
    
    const size = 30;
    // Center the tower on the cursor position
    const centerX = x - size / 2;
    const centerY = y - size / 2;
    
    // Add transform (top-left corner for rendering)
    const transform = new TransformComponent(centerX, centerY);
    tower.addComponent(transform);

    // Add tower component
    const towerComp = new TowerComponent(towerData.stats, towerData.color);
    tower.addComponent(towerComp);

    // Add chain lightning component if this is an electric tower
    if (towerType === 'electric') {
      const chainLightningTower = new ChainLightningTowerComponent(4, 150);
      tower.addComponent(chainLightningTower);
    }

    // Add renderable (no range circle by default)
    const renderable = new RenderableComponent();
    renderable.graphics.rect(0, 0, size, size);
    renderable.graphics.fill(towerData.color);
    tower.addComponent(renderable);
    
    // Add selectable component
    const selectable = new SelectableComponent();
    tower.addComponent(selectable);
    
    // Add interactable component for clicking
    const interactable = new InteractableComponent(size, size);
    interactable.onClick = () => {
      this._context.onTowerClicked(tower);
    };
    tower.addComponent(interactable);
    
    return tower;
  }
}
