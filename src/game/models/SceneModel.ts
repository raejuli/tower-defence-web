/**
 * Scene Model - Contains all configuration for a playable level/scene
 * 
 * A Scene defines:
 * - The path layout (waypoints)
 * - Wave configuration (enemy stats, spawn rates)
 * - Visual settings (size, colors)
 * - Metadata (name, description, difficulty)
 */

import { PathPoint } from '../components/PathComponent';
import { WaveConfiguration } from './WaveStateModel';

export interface SceneMetadata {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  thumbnail?: string; // Optional thumbnail image path
}

export interface SceneConfiguration {
  metadata: SceneMetadata;
  
  // Level layout
  path: PathPoint[];
  width: number;
  height: number;
  backgroundColor: number;
  
  // Wave setup
  waves: WaveConfiguration;
  
  // Starting resources
  startingMoney: number;
  startingLives: number;
}

/**
 * SceneModel - Immutable scene definition
 */
export class SceneModel {
  public readonly id: string;
  public readonly name: string;
  public readonly description: string;
  public readonly difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  public readonly thumbnail?: string;
  
  public readonly path: PathPoint[];
  public readonly width: number;
  public readonly height: number;
  public readonly backgroundColor: number;
  
  public readonly waves: WaveConfiguration;
  
  public readonly startingMoney: number;
  public readonly startingLives: number;

  constructor(config: SceneConfiguration) {
    // Metadata
    this.id = config.metadata.id;
    this.name = config.metadata.name;
    this.description = config.metadata.description;
    this.difficulty = config.metadata.difficulty;
    this.thumbnail = config.metadata.thumbnail;
    
    // Level
    this.path = [...config.path]; // Clone to ensure immutability
    this.width = config.width;
    this.height = config.height;
    this.backgroundColor = config.backgroundColor;
    
    // Waves
    this.waves = { ...config.waves }; // Clone
    
    // Starting resources
    this.startingMoney = config.startingMoney;
    this.startingLives = config.startingLives;
  }
}
