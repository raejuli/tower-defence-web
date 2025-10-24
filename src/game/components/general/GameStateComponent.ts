/**
 * GameStateComponent
 * 
 * Stores game configuration and runtime state.
 * This component defines the game rules, difficulty, and player resources.
 */

import { Component } from "@raejuli/core-engine-gdk/ecs";

export interface GameStateConfig {
  // Scene metadata
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  
  // Player resources
  startingMoney: number;
  startingLives: number;
  
  // Wave configuration
  maxWaves: number;
  enemiesPerWave: number;
  enemyHealth: number;
  enemySpeed: number;
  enemyDamage: number;
  enemyReward: number;
  spawnInterval: number;
  idleDuration: number;
  
  // Runtime state (not serialized in JSON, initialized at runtime)
  currentMoney?: number;
  currentLives?: number;
  currentWave?: number;
  isGameOver?: boolean;
  hasWon?: boolean;
}

export class GameStateComponent extends Component {
  public difficulty: 'easy' | 'medium' | 'hard' | 'extreme' = 'easy';
  
  // Player resources
  public startingMoney: number = 500;
  public startingLives: number = 20;
  
  // Wave configuration
  public maxWaves: number = 10;
  public enemiesPerWave: number = 5;
  public enemyHealth: number = 100;
  public enemySpeed: number = 50;
  public enemyDamage: number = 1;
  public enemyReward: number = 25;
  public spawnInterval: number = 1.0;
  public idleDuration: number = 10.0;
  
  // Runtime state
  public currentMoney: number = 500;
  public currentLives: number = 20;
  public currentWave: number = 0;
  public isGameOver: boolean = false;
  public hasWon: boolean = false;

  constructor(config?: GameStateConfig) {
    super();
    
    if (config) {
      this.configure(config);
    }
  }

  /**
   * Get component type identifier
   */
  getType(): string {
    return 'GameState';
  }

  /**
   * Configure the component with provided config
   */
  configure(config: GameStateConfig): void {
    // Scene metadata
    this.difficulty = config.difficulty;
    
    // Player resources
    this.startingMoney = config.startingMoney;
    this.startingLives = config.startingLives;
    
    // Wave configuration
    this.maxWaves = config.maxWaves;
    this.enemiesPerWave = config.enemiesPerWave;
    this.enemyHealth = config.enemyHealth;
    this.enemySpeed = config.enemySpeed;
    this.enemyDamage = config.enemyDamage;
    this.enemyReward = config.enemyReward;
    this.spawnInterval = config.spawnInterval;
    this.idleDuration = config.idleDuration;
    
    // Initialize runtime state
    this.currentMoney = config.currentMoney ?? config.startingMoney;
    this.currentLives = config.currentLives ?? config.startingLives;
    this.currentWave = config.currentWave ?? 0;
    this.isGameOver = config.isGameOver ?? false;
    this.hasWon = config.hasWon ?? false;
  }

  /**
   * Reset the game state to starting values
   */
  reset(): void {
    this.currentMoney = this.startingMoney;
    this.currentLives = this.startingLives;
    this.currentWave = 0;
    this.isGameOver = false;
    this.hasWon = false;
  }

  /**
   * Serialize component to JSON
   */
  toJSON(): any {
    return {
      type: 'GameState',
      data: {
        difficulty: this.difficulty,
        startingMoney: this.startingMoney,
        startingLives: this.startingLives,
        maxWaves: this.maxWaves,
        enemiesPerWave: this.enemiesPerWave,
        enemyHealth: this.enemyHealth,
        enemySpeed: this.enemySpeed,
        enemyDamage: this.enemyDamage,
        enemyReward: this.enemyReward,
        spawnInterval: this.spawnInterval,
        idleDuration: this.idleDuration
      }
    };
  }
}
