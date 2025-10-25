/**
 * Tower Defence Game - Main Game Class
 */

import { Graphics } from 'pixi.js';
import { WorldEngine, EngineUpdateEvent } from '@raejuli/core-engine-gdk/core';
import { RenderSystem, ClickHandlerSystem } from '../engine/systems';
import { StateMachine } from '@raejuli/core-engine-gdk/state';
import { PlayingState } from './states/PlayingState';
import { PlacementState } from './states/PlacementState';
import { PausedState } from './states/Game/PausedState';
import { SceneSelectState } from './states/SceneSelectState';
import { GameOverState } from './states/Game/GameOverState';
import { GameWinState } from './states/Game/GameWinState';

import { TransformComponent } from '@raejuli/core-engine-gdk/components';
import { RenderableComponent } from '@raejuli/core-engine-gdk/components';
import { StateMachineComponent } from '@raejuli/core-engine-gdk/components';
import { WaveSpawnerComponent } from './components/enemy/WaveSpawnerComponent';
import { EnemyComponent } from './components/enemy/EnemyComponent';
import { PathFollowerComponent } from './components/enemy/PathFollowerComponent';
import { PathComponent } from './components/enemy/PathComponent';
import { Entity } from '@raejuli/core-engine-gdk/ecs';
import { GameStateModel } from './models/GameStateModel';

import { LevelModel } from './models/LevelModel';
import { TowerSystem } from './systems/TowerSystem';
import { ProjectileSystem } from './systems/ProjectileSystem';
import { PathFollowingSystem } from './systems/PathFollowingSystem';
import { FlamethrowerSystem } from './systems/FlamethrowerSystem';
import { TowerSelectionSystem } from './systems/TowerSelectionSystem';
import { WaveProgressionSystem } from './systems/WaveProgressionSystem';
import { TowerComponent } from './components/tower/TowerComponent';
import { SelectableComponent } from './components/enemy/SelectableComponent';
import { ChainLightningTowerComponent } from './components/tower/ChainLightningTowerComponent';
import { UpgradeComponent } from './components/tower/UpgradeComponent';
import { InteractableComponent } from '@raejuli/core-engine-gdk/components';
import { ResourceManager, ServiceLocator } from '@raejuli/core-engine-gdk/services';
import { GameStateService } from './services/GameStateService';
import { EnemyService } from './services/EnemyService';
import { TowerService } from './services/TowerService';
import { PlacementService } from './services/PlacementService';
import { SerializedScene } from '@raejuli/core-engine-gdk/serialization';
import './scenes/SceneRegistry'; // Import to register built-in scenes
import { SceneLoader } from './loaders/SceneLoader';
import { TowerDataLoader } from './loaders/TowerDataLoader';
import { GameUIAdapter } from './ui/GameUIAdapter';
import { createRoot } from 'react-dom/client';
import { StateMachineSystem } from '@raejuli/core-engine-gdk/systems';
import { UIService } from './services/UIService';
import { TowerUpgradeSystem } from './systems';

export interface GameConfig {
  width: number;
  height: number;
  backgroundColor: number;
  debug?: boolean; // Enable debug visualizations
}

export class TowerDefenceGame {
  public readonly engine: WorldEngine;
  public readonly gameStateMachine: StateMachine<TowerDefenceGame>;

  // Convenience accessors
  public get app() { return this.engine.app; }
  public get world() { return this.engine.world; }
  public get input() { return this.engine.input; }

  // Models
  public gameState: GameStateModel;
  public level: LevelModel;

  private _ui!: GameUIAdapter;

  public debug: boolean = true; // Debug mode flag

  constructor(config: GameConfig) {
    // Create WorldEngine with config
    this.engine = new WorldEngine({
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor,
      debug: config.debug ?? false,
    });

    // Set debug mode
    this.debug = config.debug ?? false;
    if (this.debug) {
      console.log('🐛 Debug mode enabled');
    }

    // Initialize tower data loader
    TowerDataLoader.initialize();
    console.log('📦 Tower data system initialized');

    // Initialize models
    this.gameState = new GameStateModel();

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

    // Create game state machine (but don't set initial state yet)
    this.gameStateMachine = new StateMachine<TowerDefenceGame>(this);
    this.gameStateMachine.addState(new SceneSelectState('sceneSelect', this));
    this.gameStateMachine.addState(new PlayingState('playing', this));
    this.gameStateMachine.addState(new PlacementState('placement', this));
    this.gameStateMachine.addState(new PausedState('paused', this));
    this.gameStateMachine.addState(new GameOverState('gameOver', this));
    this.gameStateMachine.addState(new GameWinState('gameWin', this));
  }

  private _registerServices(): void {
    // Register global EventBus first - all services will use this
    ServiceLocator.register('EventBus', this.engine.events);

    // Register game state service
    const gameStateService = new GameStateService(this.gameState);
    ServiceLocator.register('GameStateService', gameStateService);

    // Register enemy service (just for click callbacks now)
    const enemyService = new EnemyService();
    ServiceLocator.register('EnemyService', enemyService);

    // Register tower service (upgrade system reference will be set later)
    const towerService = new TowerService(this.level, [], this.engine.world);
    ServiceLocator.register('TowerService', towerService);

    // Register placement service (needs stage from app)
    const placementService = new PlacementService(this.engine.stage);
    ServiceLocator.register('PlacementService', placementService);
  }

  private _addSystems(): void {
    this.world.addSystem(new RenderSystem(this.world, this.engine.stage));
    this.world.addSystem(new ClickHandlerSystem(this.world, this.engine.input));
    this.world.addSystem(new StateMachineSystem(this.world));
    this.world.addSystem(new WaveProgressionSystem(this.world));
    this.world.addSystem(new TowerSystem(this.world));
    this.world.addSystem(new FlamethrowerSystem(this.world));
    this.world.addSystem(new ProjectileSystem(this.world));
    this.world.addSystem(new PathFollowingSystem(this.world));
    
    const towerSelectionSystem = new TowerSelectionSystem(this.world);
    towerSelectionSystem.setStage(this.engine.stage);
    this.world.addSystem(towerSelectionSystem);
    
    this.world.addSystem(new TowerUpgradeSystem(this.world));
  }

  async initialize(parent: HTMLElement): Promise<void> {
    /**
     * TODO
     * improve this so that the engine can take in an adaptor for what we expect i.e. pixijs
     */

    // Initialize WorldEngine (handles PixiJS initialization)
    await this.engine.initialize(parent, {
      width: this.level.width,
      height: this.level.height,
      backgroundColor: this.level.backgroundColor,
    });

    // Register services
    this._addSystems();
    this._registerServices();

    // Create game UI adapter with canvas element
    this._ui = new GameUIAdapter(this.app.canvas as HTMLCanvasElement);
    // UI service (thin wrapper exposing the ui adapter)
    ServiceLocator.register('UI', new UIService(this._ui));

    // Set up tower upgrade and sell handlers
    this._ui.setOnTowerUpgrade((tower, upgradeId) => this._handleTowerUpgrade(tower, upgradeId));
    this._ui.setOnTowerSell((tower) => (ServiceLocator.get('TowerService') as TowerService).towerSell(tower));

    // Setup update hooks for custom game logic
    this.engine.events.on<EngineUpdateEvent>('engine:preUpdate', (event) => this._preUpdate(event.deltaTime));
    this.engine.events.on<EngineUpdateEvent>('engine:postUpdate', (event) => this._postUpdate(event.deltaTime));

    // Wait for UI to be ready before setting initial state
    this._ui.whenReady(() => {
      console.log('UI is ready, setting initial state to sceneSelect');
      // Now that UI is initialized, set initial states (triggers onEnter which needs UI)
      // Start with scene selection instead of directly playing
      this.gameStateMachine.setState('sceneSelect');
      // Wave state machine will be initialized when a scene is selected

      // Start the WorldEngine game loop
      this.engine.start();
    });
  }

  private _handleTowerUpgrade(tower: Entity, upgradeId: string): void {
    const towerUpgradeSystem = this.world.getSystem(TowerUpgradeSystem)!;
    if (!towerUpgradeSystem || typeof towerUpgradeSystem.applyUpgrade !== 'function') {
      console.error('TowerUpgradeSystem not found or applyUpgrade method missing');
      return;
    }

    // Apply the upgrade with current player money
    const result = towerUpgradeSystem.applyUpgrade(tower, upgradeId, this.gameState.money);

    if (result.success) {
      // Update game state money
      this.gameState.money = result.newMoney;

      console.log(`✅ Successfully applied upgrade ${upgradeId} to tower ${tower.id}. Cost: ${result.cost}, Remaining money: ${result.newMoney}`);

      // Refresh tower details to show updated stats and new available upgrades
      (ServiceLocator.get('TowerService') as TowerService).showTowerDetails(tower);
    } else {
      console.error(`❌ Failed to apply upgrade ${upgradeId} to tower ${tower.id}. Insufficient funds or invalid upgrade.`);
    }
  }

  /**
   * Pre-update hook - runs before World.update()
   * Handles custom game logic like state machines
   */
  private _preUpdate(deltaTime: number): void {
    // Always update game state machine (handles UI states like game over/win)
    this.gameStateMachine.update(deltaTime);

    // Check if we're in a state that needs game simulation (not scene select, not game over)
    const currentStateName = this.gameStateMachine.getCurrentState()?.name;
    const isGameActive = currentStateName !== 'sceneSelect' && currentStateName !== 'gameOver' && currentStateName !== 'gameWin';

    // Toggle system enabled states based on pause
    if (isGameActive) {
      const isPaused = this.gameState.isPaused;
      
      // Get gameplay systems (these should be paused during placement)
      const stateMachineSystem = this.world.getSystem(StateMachineSystem);
      const waveProgressionSystem = this.world.getSystem(WaveProgressionSystem);
      const towerSystem = this.world.getSystem(TowerSystem);
      const projectileSystem = this.world.getSystem(ProjectileSystem);
      const pathFollowingSystem = this.world.getSystem(PathFollowingSystem);
      const flamethrowerSystem = this.world.getSystem(FlamethrowerSystem);
      
      // Disable gameplay systems when paused (placement mode)
      if (stateMachineSystem) stateMachineSystem.enabled = !isPaused;
      if (waveProgressionSystem) waveProgressionSystem.enabled = !isPaused;
      if (towerSystem) towerSystem.enabled = !isPaused;
      if (projectileSystem) projectileSystem.enabled = !isPaused;
      if (pathFollowingSystem) pathFollowingSystem.enabled = !isPaused;
      if (flamethrowerSystem) flamethrowerSystem.enabled = !isPaused;
      
      // RenderSystem and ClickHandlerSystem should always be enabled for UI
    }
  }

  /**
   * Post-update hook - runs after World.update()
   * Handles rendering and UI updates
   */
  private _postUpdate(deltaTime: number): void {
    const currentStateName = this.gameStateMachine.getCurrentState()?.name;
    const isGameActive = currentStateName !== 'sceneSelect' && currentStateName !== 'gameOver' && currentStateName !== 'gameWin';
    const renderSystem = this.world.getSystem(RenderSystem);
    // Always render (even when paused or in placement mode) if game is active
    if (isGameActive && renderSystem) {
      renderSystem.update(deltaTime);
    }

    // Get current wave from spawner entities
    const spawners = this.world.getEntitiesWithComponents(['WaveSpawner']);
    const currentWave = spawners.length > 0
      ? (spawners[0].getComponent('WaveSpawner') as WaveSpawnerComponent)?.currentWave || 0
      : 0;

    // Update UI state
    this._ui.setState({
      money: this.gameState.money,
      lives: this.gameState.lives,
      wave: currentWave,
      score: this.gameState.score,
      isPaused: this.gameState.isPaused
    });
  }

  /**
   * Load a scene into the game
   * This replaces the current level, wave config, and resets game state
   */
  public loadScene(scene: SerializedScene): void {
    console.log(`🎬 Loading scene: ${scene.metadata.name}`);

    // Clear all existing entities
    this.world.getAllEntities().forEach(entity => {
      this.world.removeEntity(entity);
    });

    // Clear placed towers array via TowerService
    const towerService = ServiceLocator.get<TowerService>('TowerService');
    if (towerService) {
      towerService.clearAllTowers();
    }

    // Extract path from scene entities for LevelModel
    const pathEntity = scene.entities.find(e => e.type === 'path');
    let path: { x: number; y: number }[] = [];
    if (pathEntity) {
      const pathComponent = pathEntity.components.find(c => c.type === 'PathComponent');
      if (pathComponent && pathComponent.data.waypoints) {
        path = pathComponent.data.waypoints;
      }
    }

    // Find game state entity
    const gameStateEntity = scene.entities.find(e => e.type === 'gamestate');
    if (!gameStateEntity) {
      console.warn('⚠️ No game state entity found in scene, using defaults');
    }

    const gameStateComponent = gameStateEntity?.components.find(c => c.type === 'GameState');
    const gameStateData = gameStateComponent?.data as any;

    // Update level with scene's data
    this.level = new LevelModel(
      path,
      scene.config.width,
      scene.config.height,
      scene.config.backgroundColor
    );

    // Reset game state with scene's starting resources from game state entity
    if (gameStateData) {
      this.gameState.money = gameStateData.startingMoney ?? 500;
      this.gameState.lives = gameStateData.startingLives ?? 20;
    } else {
      this.gameState.money = 500;
      this.gameState.lives = 20;
    }
    this.gameState.score = 0;
    this.gameState.isPaused = false;

    // Instantiate all entities from scene (including path and game state)
    console.log(`📦 Loading all entities from scene...`);
    SceneLoader.instantiateGameObjects(this.world, scene, this.debug);
    console.log(`✅ Instantiated all entities from scene JSON`);

    // Update app background color
    this.app.renderer.background.color = scene.config.backgroundColor;

    // Update UI with new state (wave starts at 0)
    this._ui.setState({
      money: this.gameState.money,
      lives: this.gameState.lives,
      wave: 0,
      score: this.gameState.score,
      isPaused: false
    });

    console.log(`✅ Scene loaded: ${scene.metadata.name}`);
  }
}