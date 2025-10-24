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
import { SceneSelectState } from './states/SceneSelectState';
import { WaveIdleState, WaveSpawningState, WaveActiveState } from './states/WaveStates';
import { GameUI } from './ui/GameUI';
import { TransformComponent } from '../engine/components/TransformComponent';
import { RenderableComponent } from '../engine/components/RenderableComponent';
import { StateMachineComponent } from '../engine/components/StateMachineComponent';
import { EnemyComponent } from './components/EnemyComponent';
import { PathFollowerComponent } from './components/PathFollowerComponent';
import { PathComponent } from './components/PathComponent';
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
import { SceneModel } from './models/SceneModel';
import './scenes/SceneRegistry'; // Import to register built-in scenes

export interface GameConfig {
  width: number;
  height: number;
  backgroundColor: number;
  debug?: boolean; // Enable debug visualizations
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
  public ui: GameUI;  // Public so states can access it
  private lastTime: number = 0;
  public debug: boolean = true; // Debug mode flag

  public placedTowers: Entity[] = [];
  public pathEntity: Entity | null = null; // Reference to the main path entity

  constructor(config: GameConfig) {
    // Create PixiJS application
    this.app = new Application();

    // Create ECS world
    this.world = new World();

    // Set debug mode
    this.debug = config.debug ?? false;
    if (this.debug) {
      console.log('🐛 Debug mode enabled');
    }

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

    // Create game state machine (but don't set initial state yet)
    this.gameStateMachine = new StateMachine<TowerDefenceGame>(this);
    this.gameStateMachine.addState(new SceneSelectState('sceneSelect', this));
    this.gameStateMachine.addState(new PlayingState('playing', this));
    this.gameStateMachine.addState(new PlacementState('placement', this));
    this.gameStateMachine.addState(new PausedState('paused', this));
    // Don't call setState yet - wait until after UI is initialized

    // Create wave state machine (but don't set initial state yet)
    this.waveStateMachine = new StateMachine<TowerDefenceGame>(this);
    this.waveStateMachine.addState(new WaveIdleState('idle', this));
    this.waveStateMachine.addState(new WaveSpawningState('spawning', this));
    this.waveStateMachine.addState(new WaveActiveState('active', this));
    // Don't call setState yet - wait until after UI is initialized

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
    placementService.setGameStateMachine(this.gameStateMachine);
    ServiceLocator.register('PlacementService', placementService);
  }

  private _initializeEnemyService(): void {
    // Initialize enemy service with dependencies after path entity is created
    const enemyService = ServiceLocator.get<EnemyService>('EnemyService');
    if (this.pathEntity) {
      enemyService.setDependencies(this.world, this.waveState, this.level, this.pathEntity);
    }
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

    // Create path entity
    this.createPathEntity();

    // Initialize enemy service with dependencies
    this._initializeEnemyService();

    // Create UI (pass parent container so UI is scoped to it)
    this.ui = new GameUI(this.app.canvas as HTMLCanvasElement, parent);

    // Now that UI is initialized, set initial states (triggers onEnter which needs UI)
    // Start with scene selection instead of directly playing
    this.gameStateMachine.setState('sceneSelect');
    // Wave state machine will be initialized when a scene is selected

    // Start game loop
    this.app.ticker.add(() => this.update());
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

  private createPathEntity(): void {
    // Create a path entity that holds the path data
    const pathEntity = this.world.createEntity('Main Path');

    // Add transform at origin (path is drawn in world coordinates)
    const transform = new TransformComponent(0, 0);
    pathEntity.addComponent(transform);

    // Add path component with the level's waypoints
    const pathComponent = new PathComponent([...this.level.path], 30, 0x2a2a3e);
    pathEntity.addComponent(pathComponent);

    // Add renderable to draw the path
    const renderable = new RenderableComponent();

    // Draw path line
    renderable.graphics.moveTo(this.level.path[0].x, this.level.path[0].y);
    for (let i = 1; i < this.level.path.length; i++) {
      renderable.graphics.lineTo(this.level.path[i].x, this.level.path[i].y);
    }
    renderable.graphics.stroke({ width: pathComponent.pathWidth, color: pathComponent.color });

    // ============================================================
    // DEBUG MODE: Visualize waypoint positions
    // ============================================================
    if (this.debug) {
      console.log('🐛 Drawing waypoint debug visualization');
      for (let i = 0; i < this.level.path.length; i++) {
        const point = this.level.path[i];

        // Color-code by position (red=start, blue=end, yellow=middle)
        const waypointColor = i === 0 ? 0xff0000 : (i === this.level.path.length - 1 ? 0x0000ff : 0xffff00);

        // Draw outer ring (white)
        renderable.graphics
          .circle(point.x, point.y, 8)
          .stroke({ width: 3, color: 0xffffff });

        // Draw inner filled circle (color-coded)
        renderable.graphics
          .circle(point.x, point.y, 6)
          .fill({ color: waypointColor, alpha: 1 });

        console.log(`  Waypoint ${i}: (${point.x}, ${point.y}) - Color: 0x${waypointColor.toString(16)}`);
      }
    }

    pathEntity.addComponent(renderable);

    // Store reference for easy access
    this.pathEntity = pathEntity;

    console.log(`✅ Created path entity with ${this.level.path.length} waypoints`);
  }

  /**
   * Load a scene into the game
   * This replaces the current level, wave config, and resets game state
   */
  public loadScene(scene: SceneModel): void {
    console.log(`🎬 Loading scene: ${scene.name}`);

    // Clear existing entities (except UI-related ones)
    const entitiesToRemove = this.world.getAllEntities().filter(e => {
      // Remove all entities to start fresh
      return true;
    });
    
    entitiesToRemove.forEach(entity => {
      this.world.removeEntity(entity);
    });

    // Clear placed towers array
    this.placedTowers = [];

    // Update level with scene's path
    this.level = new LevelModel(
      scene.path,
      scene.width,
      scene.height,
      scene.backgroundColor
    );

    // Update wave configuration
    this.waveState = new WaveStateModel(scene.waves);

    // Reset game state with scene's starting resources
    this.gameState.money = scene.startingMoney;
    this.gameState.lives = scene.startingLives;
    this.gameState.score = 0;
    this.gameState.isPaused = false;

    // Recreate path entity with new level data
    this.createPathEntity();

    // Reinitialize enemy service with new path
    this._initializeEnemyService();

    // Update app background color
    this.app.renderer.background.color = scene.backgroundColor;

    // Reset wave state machine to idle
    this.waveStateMachine.setState('idle');

    // Update UI with new state
    this.ui.setState({
      money: this.gameState.money,
      lives: this.gameState.lives,
      wave: this.waveState.currentWave,
      score: this.gameState.score,
      isPaused: false
    });

    console.log(`✅ Scene loaded: ${scene.name}`);
  }
}

