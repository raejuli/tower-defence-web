/**
 * Tower Defence Game - Main Game Class
 */

import { Application, Graphics } from 'pixi.js';
import { World } from '../engine/ecs/World';
import { RenderSystem } from '../engine/systems/RenderSystem';
import { InputSystem } from '../engine/systems/InputSystem';
import { StateMachineSystem } from '../engine/systems/StateMachineSystem';
import { StateMachine } from '../engine/state/StateMachine';
import { PlayingState } from './states/PlayingState';
import { PlacementState } from './states/PlacementState';
import { PausedState } from './states/PausedState';
import { WaveIdleState, WaveSpawningState, WaveActiveState } from './states/WaveStates';
import { GameUI } from './ui/GameUI';
import { TransformComponent } from '../engine/components/TransformComponent';
import { RenderableComponent } from '../engine/components/RenderableComponent';
import { StateMachineComponent } from '../engine/components/StateMachineComponent';
import { EnemyComponent } from './components/EnemyComponent';
import { PathFollowerComponent } from './components/PathFollowerComponent';
import { Entity } from '../engine/ecs/Entity';
import { GameStateModel } from './models/GameStateModel';
import { WaveStateModel, WaveConfiguration } from './models/WaveStateModel';
import { LevelModel } from './models/LevelModel';
import { TowerSystem } from './systems/TowerSystem';
import { ProjectileSystem } from './systems/ProjectileSystem';
import { PathFollowingSystem } from './systems/PathFollowingSystem';
import { TowerSelectionSystem } from './systems/TowerSelectionSystem';
import { TowerComponent } from './components/TowerComponent';
import { SelectableComponent } from './components/SelectableComponent';
import { ChainLightningTowerComponent } from './components/ChainLightningTowerComponent';
import { InteractableComponent } from '../engine/components/InteractableComponent';
import { ServiceLocator } from '../engine/services/ServiceLocator';
import { 
  EnemyMovingState, 
  EnemyDamagedState, 
  EnemyStunnedState, 
  EnemySlowedState, 
  EnemyDeadState, 
  EnemyReachedEndState 
} from './states/EnemyStates';
import { GameStateService } from './services/GameStateService';
import { EnemyService } from './services/EnemyService';
import { TowerService } from './services/TowerService';
import { PlacementService } from './services/PlacementService';

export interface GameConfig {
  width: number;
  height: number;
  backgroundColor: number;
}

export class TowerDefenceGame {
  public app: Application;
  public world: World;
  public gameStateMachine: StateMachine<TowerDefenceGame>;
  public waveStateMachine: StateMachine<TowerDefenceGame>;
  public inputSystem: InputSystem | null = null;
  
  // Models (MVC)
  public gameState: GameStateModel;
  public waveState: WaveStateModel;
  public level: LevelModel;
  
  private renderSystem: RenderSystem;
  private ui: GameUI;
  private lastTime: number = 0;
  
  public placedTowers: Entity[] = [];

  constructor(config: GameConfig) {
    // Create PixiJS application
    this.app = new Application();
    
    // Create ECS world
    this.world = new World();
    
    // Initialize models
    this.gameState = new GameStateModel();
    
    const waveConfig: WaveConfiguration = {
      enemiesPerWave: 5,
      enemyHealth: 50,
      enemySpeed: 50,
      enemyDamage: 1,
      enemyReward: 25,
      spawnInterval: 1.0,
      idleDuration: 10.0
    };
    this.waveState = new WaveStateModel(waveConfig);
    
    this.level = new LevelModel([
      { x: 0, y: 200 },
      { x: 200, y: 200 },
      { x: 200, y: 400 },
      { x: 400, y: 400 },
      { x: 400, y: 100 },
      { x: 600, y: 100 },
      { x: 600, y: 300 },
      { x: 800, y: 300 }
    ], config.width, config.height, config.backgroundColor);
    
    // Register services
    this._registerServices();
    
    // Create game state machine
    this.gameStateMachine = new StateMachine<TowerDefenceGame>(this);
    this.gameStateMachine.addState(new PlayingState('playing', this));
    this.gameStateMachine.addState(new PlacementState('placement', this));
    this.gameStateMachine.addState(new PausedState('paused', this));
    this.gameStateMachine.setState('playing');
    
    // Create wave state machine
    this.waveStateMachine = new StateMachine<TowerDefenceGame>(this);
    this.waveStateMachine.addState(new WaveIdleState('idle', this));
    this.waveStateMachine.addState(new WaveSpawningState('spawning', this));
    this.waveStateMachine.addState(new WaveActiveState('active', this));
    this.waveStateMachine.setState('idle'); // Start with idle, will auto-start first wave
    
    // Initialize will be called after app is ready
    this.renderSystem = null as any;
    this.ui = null as any;
  }

  private _registerServices(): void {
    // Register game state service
    const gameStateService = new GameStateService(this.gameState);
    ServiceLocator.register('GameStateService', gameStateService);
    
    // Register enemy service
    const enemyService = new EnemyService();
    ServiceLocator.register('EnemyService', enemyService);
    
    // Register tower service
    const towerService = new TowerService(this.level, this.placedTowers);
    towerService.setOnTowerClickedCallback((tower) => this._showTowerDetails(tower));
    ServiceLocator.register('TowerService', towerService);
  }

  private _registerPlacementService(): void {
    // Register placement service (needs stage from app)
    const placementService = new PlacementService(this.app.stage);
    ServiceLocator.register('PlacementService', placementService);
  }

  async initialize(parent: HTMLElement): Promise<void> {
    // Initialize PixiJS
    await this.app.init({
      width: 800,
      height: 600,
      backgroundColor: 0x1a1a2e
    });
    
    parent.appendChild(this.app.canvas);

    // Setup systems (but states will call them, not automatic updates)
    this.renderSystem = new RenderSystem(this.world, this.app.stage);
    this.world.addSystem(this.renderSystem);
    
    this.inputSystem = new InputSystem(this.world, this.app);
    this.world.addSystem(this.inputSystem);
    
    // Register game systems (states will call their methods)
    this.world.addSystem(new StateMachineSystem(this.world));
    this.world.addSystem(new TowerSystem(this.world));
    this.world.addSystem(new ProjectileSystem(this.world));
    this.world.addSystem(new PathFollowingSystem(this.world));
    this.world.addSystem(new TowerSelectionSystem(this.world));

    // Register placement service (needs stage)
    this._registerPlacementService();
    
    // Create UI
    this.ui = new GameUI(this.app.canvas as HTMLCanvasElement);
    
    // Setup UI event listeners
    this._setupUIEventListeners();
    
    // Draw path
    this.drawPath();
    
    // Start game loop
    this.app.ticker.add(() => this.update());
  }

  private _setupUIEventListeners(): void {
    // Tower selection
    this.ui.on('towerSelected', (data: any) => {
      console.log('Game: Received towerSelected event', data);
      this.enterPlacementMode(data.towerType, data.range);
    });

    // Tower placement request
    this.ui.on('towerPlacementRequested', (data: any) => {
      console.log('Game: Received towerPlacementRequested event', data);
      
      // Delegate to placement state if we're in placement mode
      const placementState = this.gameStateMachine.getState('placement') as PlacementState;
      if (placementState && this.gameStateMachine.getCurrentStateName() === 'placement') {
        placementState.handlePlacementRequest(data.towerType, data.x, data.y);
      }
    });

    // Placement cancelled
    this.ui.on('placementCancelled', () => {
      console.log('Game: Received placementCancelled event');
      this.exitPlacementMode();
    });

    // Tower deselected
    this.ui.on('towerDeselected', () => {
      console.log('Game: Received towerDeselected event');
      const towerService = ServiceLocator.get<TowerService>('TowerService');
      towerService.deselectAllTowers();
      this.ui.hideTowerDetails();
    });
  }

  public onTowerClicked(tower: Entity): void {
    const towerService = ServiceLocator.get<TowerService>('TowerService');
    towerService.onTowerClicked(tower);
  }

  private _showTowerDetails(tower: Entity): void {
    // Simply pass the tower entity to the UI
    // The TowerDetailsView will call toString() on all components
    this.ui.showTowerDetails(tower);
  }

  private update(): void {
    const currentTime = performance.now();
    const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 1000 : 0;
    this.lastTime = currentTime;

    if (!this.gameState.isPaused) {
      // Update input system to handle clicks
      if (this.inputSystem) {
        this.inputSystem.update(deltaTime);
      }
      
      // Update game state machine (business logic layer)
      this.gameStateMachine.update(deltaTime);
      
      // Update wave state machine (business logic layer)
      this.waveStateMachine.update(deltaTime);
      
      // Process pending entity changes
      this.world.update(deltaTime);
      
      // Render everything
      if (this.renderSystem) {
        this.renderSystem.update(deltaTime);
      }
    }

    // Update UI state
    this.ui.setState({
      money: this.gameState.money,
      lives: this.gameState.lives,
      wave: this.waveState.currentWave,
      score: this.gameState.score,
      isPaused: this.gameState.isPaused
    });
  }

  public spawnEnemy(): void {
    const enemy = this.world.createEntity('Enemy');
    
    const enemySize = 20;
    // Add transform - center enemy on path start
    const startPos = this.level.path[0];
    const transform = new TransformComponent(startPos.x - enemySize / 2, startPos.y - enemySize / 2);
    enemy.addComponent(transform);

    // Calculate scaled stats based on wave (business logic here, not in model)
    const health = Math.floor(this.waveState.config.enemyHealth * (1 + (this.waveState.currentWave - 1) * 0.2));
    const speed = this.waveState.config.enemySpeed * (1 + (this.waveState.currentWave - 1) * 0.05);
    const reward = Math.floor(this.waveState.config.enemyReward * (1 + (this.waveState.currentWave - 1) * 0.15));

    // Add enemy component
    const enemyComp = new EnemyComponent({
      health: health,
      maxHealth: health,
      speed: speed,
      damage: this.waveState.config.enemyDamage,
      reward: reward
    });
    enemy.addComponent(enemyComp);

    // Add path follower
    const pathFollower = new PathFollowerComponent([...this.level.path], speed);
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

  private drawPath(): void {
    const graphics = this.app.stage.addChild(new Graphics());
    graphics.zIndex = -1;
    
    graphics.moveTo(this.level.path[0].x, this.level.path[0].y);
    for (let i = 1; i < this.level.path.length; i++) {
      graphics.lineTo(this.level.path[i].x, this.level.path[i].y);
    }
    graphics.stroke({ width: 30, color: 0x2a2a3e });
  }

  enterPlacementMode(towerType: string, range: number): void {
    const placementState = this.gameStateMachine.getState('placement') as PlacementState;
    if (placementState) {
      placementState.setSelectedTowerType(towerType, range);
    }
    this.gameStateMachine.setState('placement');
  }

  exitPlacementMode(): void {
    this.gameStateMachine.setState('playing');
  }

  togglePause(): void {
    const gameStateService = ServiceLocator.get<GameStateService>('GameStateService');
    
    if (this.gameStateMachine.getCurrentStateName() === 'paused') {
      this.gameStateMachine.setState('playing');
      gameStateService.setPaused(false);
    } else {
      this.gameStateMachine.setState('paused');
      gameStateService.setPaused(true);
    }
  }
}
