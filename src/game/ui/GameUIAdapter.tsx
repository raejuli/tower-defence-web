/**
 * GameUIAdapter - Simple adapter for TowerDefenceGame
 * 
 * Provides a class-based API while using pure React internally
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import type { GameUIHandle } from './GameUI';
import type { GameUIState, TowerType } from './GameUI';
import { GameUIComponent } from './GameUI';
import { Entity } from '@raejuli/core-engine-gdk/ecs';
import { EventBus } from '@raejuli/core-engine-gdk/events';
import { ServiceLocator } from '@raejuli/core-engine-gdk/services';

export class GameUIAdapter {
  private root: Root;
  private container: HTMLDivElement;
  private uiRef = React.createRef<GameUIHandle>();
  private canvasElement: HTMLCanvasElement;
  public readonly towerTypes: Map<string, TowerType>;
  private renderPending = false;
  private isReady = false;
  private events: EventBus;
  private onTowerUpgradeCallback?: (tower: Entity, upgradeId: string) => void;
  private onTowerSellCallback?: (tower: Entity) => void;

  constructor(canvasElement: HTMLCanvasElement, parentContainer?: HTMLElement) {
    // Get global event bus from ServiceLocator
    this.events = ServiceLocator.get<EventBus>('EventBus');

    this.canvasElement = canvasElement;

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'game-ui-root';
    this.container.style.position = 'absolute';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '100';

    // Make children receive pointer events
    const style = document.createElement('style');
    style.textContent = `
      #game-ui-root > * { pointer-events: auto; }
      .game-ui-container { pointer-events: none; }
      .game-ui-container > * { pointer-events: auto; }
    `;
    document.head.appendChild(style);

    const parent = parentContainer || document.body;
    parent.appendChild(this.container);

    // Tower types
    this.towerTypes = new Map([
      ['basic', {
        name: 'Basic Tower',
        color: 0x00ff00,
        stats: {
          damage: 10,
          range: 100,
          fireRate: 1,
          projectileSpeed: 200,
          cost: 50,
          upgradeCost: 75,
          level: 1
        }
      }],
      ['sniper', {
        name: 'Sniper Tower',
        color: 0x0000ff,
        stats: {
          damage: 50,
          range: 200,
          fireRate: 0.5,
          projectileSpeed: 400,
          cost: 150,
          upgradeCost: 200,
          level: 1
        }
      }],
      ['rapid', {
        name: 'Rapid Tower',
        color: 0xffff00,
        stats: {
          damage: 5,
          range: 80,
          fireRate: 3,
          projectileSpeed: 300,
          cost: 100,
          upgradeCost: 150,
          level: 1
        }
      }],
      ['electric', {
        name: 'Electric Tower',
        color: 0x00ffff,
        stats: {
          damage: 15,
          range: 120,
          fireRate: 0.8,
          projectileSpeed: 350,
          cost: 200,
          upgradeCost: 250,
          level: 1
        }
      }],
      ['flamethrower', {
        name: 'Flamethrower Tower',
        color: 0xff6600,
        stats: {
          damage: 30,
          range: 100,
          fireRate: 2,
          projectileSpeed: 0,
          cost: 175,
          upgradeCost: 225,
          level: 1
        }
      }]
    ]);

    // Create React root and render
    this.root = createRoot(this.container);
    this.render();
  }

  private async render() {
    const canvasRef = { current: this.canvasElement };

    this.root.render(
      React.createElement(GameUIComponent, {
        ref: this.uiRef,
        canvasRef,
        onTowerPlacementRequested: (data: any) => this.events.emit('ui:towerPlacementRequested', data),
        onTowerSelected: (data: any) => this.events.emit('ui:towerSelected', data),
        onPlacementCancelled: () => this.events.emit('ui:placementCancelled', {}),
        onTowerDeselected: () => this.events.emit('ui:towerDeselected', {}),
        onSceneSelected: (sceneId: string) => this.events.emit('ui:sceneSelected', sceneId),
        onReturnToMenu: () => this.events.emit('ui:returnToMenu', {}),
        onTowerUpgrade: (tower: Entity, upgradeId: string) => {
          if (this.onTowerUpgradeCallback) {
            this.onTowerUpgradeCallback(tower, upgradeId);
          }
        },
        onTowerSell: (tower: Entity) => {
          if (this.onTowerSellCallback) {
            this.onTowerSellCallback(tower);
          }
        },
        onReady: () => {
          this.isReady = true;
          // Emit ui:ready event
          this.events.emit('ui:ready', {});
        }
      })
    );
  }

  public whenReady(callback: () => void): void {
    // Deprecated: Use events instead
    // Listen to 'ui:ready' event
    if (this.isReady) {
      callback();
    } else {
      const unsubscribe = this.events.on('ui:ready', () => {
        callback();
        unsubscribe(); // Only call once
      });
    }
  }

  /**
   * Listen to a UI event
   * Deprecated: Use ServiceLocator.get<EventBus>('EventBus').on() instead
   */
  public on<T = any>(event: string, callback: (data: T) => void): () => void {
    // Prefix with ui: if not already prefixed
    const eventName = event.startsWith('ui:') ? event : `ui:${event}`;
    return this.events.on<T>(eventName, callback);
  }

  /**
   * Remove a UI event listener
   * Deprecated: Use the unsubscribe function returned by on() instead
   */
  public off<T = any>(event: string, callback: (data: T) => void): void {
    // Prefix with ui: if not already prefixed
    const eventName = event.startsWith('ui:') ? event : `ui:${event}`;
    this.events.off<T>(eventName, callback);
  }

  setState(state: Partial<GameUIState>): void {
    this.uiRef.current?.setState(state);
  }

  setScenes(scenesByDifficulty: { Easy: any[]; Medium: any[]; Hard: any[]; Expert: any[] }): void {
    this.uiRef.current?.setScenes(scenesByDifficulty);
  }

  setPlacementMode(active: boolean): void {
    this.uiRef.current?.setPlacementMode(active);
  }

  setGameOverReady(ready: boolean): void {
    this.uiRef.current?.setGameOverReady(ready);
  }

  setGameWinReady(ready: boolean): void {
    this.uiRef.current?.setGameWinReady(ready);
  }

  showTowerDetails(tower: Entity, availableUpgrades?: any[]): void {
    this.uiRef.current?.showTowerDetails(tower, availableUpgrades);
  }

  setOnTowerUpgrade(callback: (tower: Entity, upgradeId: string) => void): void {
    this.onTowerUpgradeCallback = callback;
  }

  setOnTowerSell(callback: (tower: Entity) => void): void {
    this.onTowerSellCallback = callback;
  }

  hideTowerDetails(): void {
    this.uiRef.current?.hideTowerDetails();
  }

  showEnemyDetails(enemy: Entity): void {
    this.uiRef.current?.showEnemyDetails(enemy);
  }

  hideEnemyDetails(): void {
    this.uiRef.current?.hideEnemyDetails();
  }

  update(deltaTime: number): void {
    // No-op - React handles its own updates
  }

  destroy(): void {
    this.root.unmount();
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    // Clear event listeners
    this.events.clear();
  }
}
