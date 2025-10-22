/**
 * Game Models - Game State
 */

export class GameStateModel {
  public money: number = 500;
  public lives: number = 20;
  public wave: number = 0;
  public score: number = 0;
  public isPaused: boolean = false;

  constructor() {}
}
