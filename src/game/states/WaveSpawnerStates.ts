/**
 * Wave Spawner States - States for the wave spawner state machine
 * 
 * These states handle the lifecycle of a wave spawner entity:
 * - Idle: Waiting before starting next wave
 * - Spawning: Actively spawning enemies
 * - Waiting: Wave completed, waiting for enemies to be defeated
 * - Complete: All waves finished
 */

import { State } from '@raejuli/core-engine-gdk/state';
import { Entity } from '@raejuli/core-engine-gdk/ecs';
import { TransformComponent } from '@raejuli/core-engine-gdk/components';
import { ServiceLocator } from '@raejuli/core-engine-gdk/services';
import { EventBus } from '@raejuli/core-engine-gdk/events';
import { RenderableComponent, StateMachineComponent, InteractableComponent } from '@raejuli/core-engine-gdk/components';
import { EnemyComponent, EnemyStats } from '../components/enemy/EnemyComponent';
import { PathFollowerComponent } from '../components/enemy/PathFollowerComponent';
import {
  EnemyMovingState,
  EnemyDamagedState,
  EnemyStunnedState,
  EnemySlowedState,
  EnemyDeadState,
  EnemyReachedEndState
} from './EnemyStates';
import { WaveSpawnerComponent } from '../components/enemy/WaveSpawnerComponent';
import { EntityIdRegistry } from '../loaders/EntityIdRegistry';

/**
 * Idle State - Waiting before starting the next wave
 */
export class WaveSpawnerIdleState extends State<Entity> {
  private events: EventBus;

  constructor(name: string, entity: Entity) {
    super(name, entity);
    const events = ServiceLocator.get<EventBus>('EventBus');
    if (!events) {
      throw new Error('EventBus not found in ServiceLocator');
    }
    this.events = events;
  }

  public onEnter(): void {
    const spawner = this.context.getComponent('WaveSpawner') as WaveSpawnerComponent;
    if (!spawner) return;

    const waveDelay = spawner.config.waveStartDelay || 0;
    console.log(`🎮 [Spawner ${this.context.name}] Wave ${spawner.currentWave} idle started (delay: ${waveDelay}s, idle: ${spawner.config.idleDuration}s)`);
    
    // Reset timers
    spawner.idleTimer = 0;
    spawner.waveDelayTimer = 0;
  }

  public onUpdate(deltaTime: number): void {
    const spawner = this.context.getComponent('WaveSpawner') as WaveSpawnerComponent;
    if (!spawner) {
      console.error(`❌ [Spawner ${this.context.name}] No WaveSpawner component found!`);
      return;
    }

    const waveDelay = spawner.config.waveStartDelay || 0;

    // First wait for wave start delay
    if (spawner.waveDelayTimer < waveDelay) {
      spawner.waveDelayTimer += deltaTime;
      return; // Still waiting for delay
    }

    // Then wait for idle duration
    spawner.idleTimer += deltaTime;

    if (spawner.idleTimer >= spawner.config.idleDuration) {
      // Start spawning
      const stateMachine = this.context.getComponent('StateMachine') as StateMachineComponent;
      if (stateMachine) {
        stateMachine.stateMachine.setState('spawning');
      }
    }
  }

  public onExit(): void {
    // Transition to spawning
  }
}

/**
 * Spawning State - Actively spawning enemies
 */
export class WaveSpawnerSpawningState extends State<Entity> {
  private events: EventBus;

  constructor(name: string, entity: Entity) {
    super(name, entity);
    const events = ServiceLocator.get<EventBus>('EventBus');
    if (!events) {
      throw new Error('EventBus not found in ServiceLocator');
    }
    this.events = events;
  }

  public onEnter(): void {
    const spawner = this.context.getComponent('WaveSpawner') as WaveSpawnerComponent;
    if (!spawner) return;

    // Increment wave counter
    spawner.currentWave++;
    spawner.enemiesSpawnedThisWave = 0;
    spawner.spawnTimer = 0;

    console.log(`🌊 [Spawner ${this.context.name}] Wave ${spawner.currentWave}/${spawner.config.maxWaves} started`);

    // Emit wave started event
    this.events.emit('wave:started', {
      spawnerId: this.context.id.toString(),
      spawnerName: this.context.name,
      wave: spawner.currentWave,
      totalWaves: spawner.config.maxWaves,
      enemiesInWave: spawner.config.enemiesPerWave
    });
  }

  public onUpdate(deltaTime: number): void {
    const spawner = this.context.getComponent('WaveSpawner') as WaveSpawnerComponent;
    if (!spawner) return;

    const transform = this.context.getComponent('Transform') as TransformComponent;
    if (!transform) return;

    spawner.spawnTimer += deltaTime;

    // Check if we should spawn an enemy
    if (spawner.spawnTimer >= spawner.config.spawnInterval) {
      if (spawner.enemiesSpawnedThisWave < spawner.config.enemiesPerWave) {
        this.spawnEnemy(spawner, transform);
        spawner.spawnTimer = 0;
      }
    }

    // Check if wave is complete
    if (spawner.enemiesSpawnedThisWave >= spawner.config.enemiesPerWave) {
      // All enemies spawned, transition to waiting
      const stateMachine = this.context.getComponent('StateMachine') as StateMachineComponent;
      if (stateMachine) {
        stateMachine.stateMachine.setState('waiting');
      }
    }
  }

  private spawnEnemy(spawner: WaveSpawnerComponent, transform: TransformComponent): void {
    const world = this.context.getWorld();
    if (!world) {
      console.error(`❌ [Spawner ${this.context.name}] World not found!`);
      return;
    }

    // Create enemy entity
    const enemy = world.createEntity('Enemy');
    
    const enemySize = 20;
    
    // Add transform - center enemy on spawn location
    const enemyTransform = new TransformComponent(
      transform.x - enemySize / 2,
      transform.y - enemySize / 2
    );
    enemy.addComponent(enemyTransform);

    // Add enemy component with stats
    const enemyStats: EnemyStats = {
      health: spawner.config.enemyHealth,
      maxHealth: spawner.config.enemyHealth,
      speed: spawner.config.enemySpeed,
      damage: spawner.config.enemyDamage,
      reward: spawner.config.enemyReward
    };
    const enemyComp = new EnemyComponent(enemyStats);
    enemy.addComponent(enemyComp);

    // Add renderable and draw enemy graphics
    const renderable = new RenderableComponent({ zIndex: 1 });
    
    // Draw enemy as a red circle
    renderable.graphics.circle(enemySize / 2, enemySize / 2, enemySize / 2);
    renderable.graphics.fill({ color: 0xff0000 });
    
    // Draw health bar background (black)
    const healthBarWidth = enemySize;
    const healthBarHeight = 4;
    const healthBarY = -5;
    renderable.graphics.rect(0, healthBarY, healthBarWidth, healthBarHeight);
    renderable.graphics.fill({ color: 0x000000 });
    
    // Draw health bar foreground (green) - will be updated by health system
    const healthPercent = enemyComp.stats.health / enemyComp.stats.maxHealth;
    renderable.graphics.rect(0, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
    renderable.graphics.fill({ color: 0x00ff00 });
    
    enemy.addComponent(renderable);

    // Add path follower if path entity is specified
    if (spawner.config.pathEntityId) {
      // Look up the path entity by its JSON string ID
      const pathEntity = EntityIdRegistry.getEntity(spawner.config.pathEntityId);
      
      if (pathEntity) {
        const pathFollower = new PathFollowerComponent(
          pathEntity.id,
          enemyStats.speed
        );
        enemy.addComponent(pathFollower);
        console.log(`  🔗 Enemy linked to path "${spawner.config.pathEntityId}" (entity #${pathEntity.id})`);
      } else {
        console.error(`  ❌ Path entity not found! JSON ID: "${spawner.config.pathEntityId}"`);
        console.error(`  Available JSON IDs:`, EntityIdRegistry.getAllIds());
      }
    }

    // Add interactable for clicking
    const interactable = new InteractableComponent(enemySize, enemySize, {
      onClick: (x, y, event) => {
        console.log(`🎯 Enemy clicked at (${x}, ${y})`);
        this.events.emit('enemy:clicked', enemy);
      }
    });
    enemy.addComponent(interactable);

    // Add state machine for AI behavior
    const stateMachine = new StateMachineComponent(enemy);
    stateMachine.stateMachine.addState(new EnemyMovingState('moving', enemy));
    stateMachine.stateMachine.addState(new EnemyDamagedState('damaged', enemy));
    stateMachine.stateMachine.addState(new EnemyStunnedState('stunned', enemy, 1.0));
    stateMachine.stateMachine.addState(new EnemySlowedState('slowed', enemy, 2.0, 0.5));
    stateMachine.stateMachine.addState(new EnemyDeadState('dead', enemy));
    stateMachine.stateMachine.addState(new EnemyReachedEndState('reachedEnd', enemy));
    stateMachine.stateMachine.setState('moving');
    enemy.addComponent(stateMachine);

    spawner.enemiesSpawnedThisWave++;
    spawner.totalEnemiesSpawned++;

    // Emit enemy spawned event
    this.events.emit('wave:enemySpawned', {
      spawnerId: this.context.id.toString(),
      spawnerName: this.context.name,
      enemyId: enemy.id.toString(),
      wave: spawner.currentWave,
      enemyNumber: spawner.enemiesSpawnedThisWave,
      totalInWave: spawner.config.enemiesPerWave
    });
  }

  public onExit(): void {
    const spawner = this.context.getComponent('WaveSpawner') as WaveSpawnerComponent;
    if (!spawner) return;

    console.log(`✅ [Spawner ${this.context.name}] Wave ${spawner.currentWave} spawning complete (${spawner.enemiesSpawnedThisWave} enemies)`);

    // Emit wave complete event
    this.events.emit('wave:complete', {
      spawnerId: this.context.id.toString(),
      spawnerName: this.context.name,
      wave: spawner.currentWave,
      enemiesSpawned: spawner.enemiesSpawnedThisWave
    });
  }
}

/**
 * Waiting State - Wave spawned, waiting for cooldown or next wave trigger
 */
export class WaveSpawnerWaitingState extends State<Entity> {
  private events: EventBus;

  constructor(name: string, entity: Entity) {
    super(name, entity);
    const events = ServiceLocator.get<EventBus>('EventBus');
    if (!events) {
      throw new Error('EventBus not found in ServiceLocator');
    }
    this.events = events;
  }

  public onEnter(): void {
    const spawner = this.context.getComponent('WaveSpawner') as WaveSpawnerComponent;
    if (!spawner) return;

    console.log(`⏳ [Spawner ${this.context.name}] Waiting after wave ${spawner.currentWave}`);
  }

  public onUpdate(deltaTime: number): void {
    const spawner = this.context.getComponent('WaveSpawner') as WaveSpawnerComponent;
    if (!spawner) return;

    const world = this.context.getWorld();
    if (!world) return;

    // Check if WaveProgressionComponent exists in the scene
    const entities = world.getAllEntities();
    const hasWaveProgression = entities.some(e => e.hasComponent('WaveProgression'));
    
    if (hasWaveProgression) {
      // When using WaveProgressionSystem, let that system handle wave transitions
      // Spawners just wait in this state until they are reconfigured or disabled by the system
      return;
    }

    // ORIGINAL WAVE SPAWNER BEHAVIOR (no WaveProgressionComponent)
    // Check if all enemies are defeated
    const activeEnemies = world.getEntitiesWithComponents(['Enemy']);
    
    if (activeEnemies.length === 0) {
      console.log(`✅ [Spawner ${this.context.name}] All enemies defeated, checking for next wave`);
      
      // Check if there are more waves to spawn
      if (spawner.currentWave < spawner.config.maxWaves) {
        console.log(`🔄 [Spawner ${this.context.name}] Transitioning to idle for wave ${spawner.currentWave + 1}`);
        // Transition back to idle to start the next wave
        const stateMachine = this.context.getComponent('StateMachine') as StateMachineComponent;
        if (stateMachine) {
          stateMachine.stateMachine.setState('idle');
        }
      } else {
        console.log(`🎉 [Spawner ${this.context.name}] All waves complete!`);
        // All waves done, transition to complete
        const stateMachine = this.context.getComponent('StateMachine') as StateMachineComponent;
        if (stateMachine) {
          stateMachine.stateMachine.setState('complete');
        }
      }
    }
  }

  public onExit(): void {
    // Transition to next state
  }
}

/**
 * Complete State - All waves finished
 */
export class WaveSpawnerCompleteState extends State<Entity> {
  private events: EventBus;
  private eventEmitted: boolean = false;

  constructor(name: string, entity: Entity) {
    super(name, entity);
    const events = ServiceLocator.get<EventBus>('EventBus');
    if (!events) {
      throw new Error('EventBus not found in ServiceLocator');
    }
    this.events = events;
  }

  public onEnter(): void {
    const spawner = this.context.getComponent('WaveSpawner') as WaveSpawnerComponent;
    if (!spawner) return;

    console.log(`🎉 [Spawner ${this.context.name}] All waves complete!`);

    // Emit all waves complete event (only once)
    if (!this.eventEmitted) {
      this.events.emit('wave:allComplete', {
        spawnerId: this.context.id.toString(),
        spawnerName: this.context.name,
        totalWaves: spawner.currentWave,
        totalEnemies: spawner.totalEnemiesSpawned
      });
      this.eventEmitted = true;
    }
  }

  public onUpdate(deltaTime: number): void {
    // Stay in complete state - game logic will handle what happens next
  }

  public onExit(): void {
    // Can be reset by external logic if needed
  }
}
