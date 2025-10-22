/**
 * Game States - Paused State
 */

import { State } from '../../engine/state/StateMachine';
import { TowerDefenceGame } from '../TowerDefenceGame';


export class PausedState extends State<TowerDefenceGame> {
  onEnter(previousState?: State<TowerDefenceGame>): void {
    console.log('Game paused');
  }

  onUpdate(deltaTime: number): void {
    // Don't update game systems when paused
  }

  onExit(nextState?: State<TowerDefenceGame>): void {
    console.log('Game resumed');
  }
}
