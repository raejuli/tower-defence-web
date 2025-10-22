/**
 * Generic State Machine Implementation
 */

/**
 * Base State class
 */
export abstract class State<T = any> {
  protected readonly _context: T;
  public readonly name: string;

  constructor(name: string, context: T) {
    this.name = name;
    this._context = context;
  }

  /**
   * Called when entering this state
   */
  public onEnter(previousState?: State<T>): void {}

  /**
   * Called every frame while in this state
   */
  public onUpdate(deltaTime: number): void {}

  /**
   * Called when exiting this state
   */
  public onExit(nextState?: State<T>): void {}

  /**
   * Check if can transition to another state
   */
  public canTransitionTo(stateName: string): boolean {
    return true;
  }

  protected get context(): T {
    return this._context;
  }
}

/**
 * State Machine - Manages state transitions
 */
export class StateMachine<T = any> {
  private readonly _states: Map<string, State<T>> = new Map();
  private _currentState: State<T> | null = null;
  private readonly _context: T;

  constructor(context: T) {
    this._context = context;
  }

  /**
   * Add a state to the machine
   */
  public addState(state: State<T>): void {
    this._states.set(state.name, state);
  }

  /**
   * Create and add a state
   */
  public createState(name: string, StateClass: new (name: string, context: T) => State<T>): State<T> {
    const state = new StateClass(name, this._context);
    this.addState(state);
    return state;
  }

  /**
   * Set the initial state
   */
  public setState(stateName: string): boolean {
    const newState = this._states.get(stateName);
    if (!newState) {
      console.warn(`State ${stateName} not found`);
      return false;
    }

    if (this._currentState) {
      if (!this._currentState.canTransitionTo(stateName)) {
        return false;
      }
      this._currentState.onExit(newState);
    }

    const previousState = this._currentState;
    this._currentState = newState;
    this._currentState.onEnter(previousState || undefined);
    
    return true;
  }

  /**
   * Get current state name
   */
  public getCurrentStateName(): string | null {
    return this._currentState?.name || null;
  }

  /**
   * Get current state
   */
  public getCurrentState(): State<T> | null {
    return this._currentState;
  }

  /**
   * Update current state
   */
  public update(deltaTime: number): void {
    this._currentState?.onUpdate(deltaTime);
  }

  /**
   * Check if machine has a state
   */
  public hasState(stateName: string): boolean {
    return this._states.has(stateName);
  }

  /**
   * Get a state by name
   */
  public getState(stateName: string): State<T> | undefined {
    return this._states.get(stateName);
  }
}
