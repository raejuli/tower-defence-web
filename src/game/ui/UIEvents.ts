/**
 * Game UI Events
 */

export interface TowerPlacementRequestEvent {
  towerType: string;
  x: number;
  y: number;
}

export interface TowerSelectionRequestEvent {
  towerType: string;
}

export interface TowerClickedEvent {
  entityId: number;
}

export interface CancelPlacementEvent {}
