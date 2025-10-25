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
  private resizeObserver?: ResizeObserver;
  private readonly handleResizeListener = () => this.handleResize();
  private resizeRaf: number | null = null;
  
  // Scaling properties (same as WorldEngine)
  private safeWidth: number = 1280;
  private safeHeight: number = 960;
  private maxWidth: number = 1920;
  private maxHeight: number = 1080;
  
  // Current scale and offset for coordinate transformation
  private currentScale: number = 1;
  private currentOffsetX: number = 0;
  private currentOffsetY: number = 0;

  constructor(canvasElement: HTMLCanvasElement, parentContainer?: HTMLElement) {
    // Get global event bus from ServiceLocator
    this.events = ServiceLocator.get<EventBus>('EventBus');

    this.canvasElement = canvasElement;

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'game-ui-root';
    this.container.style.position = 'absolute';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '100';
    this.container.style.transformOrigin = 'top left';

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

    const canvasParent = this.canvasElement.parentElement;
    if (typeof ResizeObserver !== 'undefined' && canvasParent) {
      this.resizeObserver = new ResizeObserver(() => this.handleResize());
      this.resizeObserver.observe(canvasParent);
    }

    // Set up resize handling (same as WorldEngine)
    window.addEventListener('resize', this.handleResizeListener);
    window.addEventListener('orientationchange', this.handleResizeListener);
    this.handleResize();

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
        coordinateTransform: {
          scale: this.currentScale,
          offsetX: this.currentOffsetX,
          offsetY: this.currentOffsetY
        },
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

  /**
   * Handle window resize - scales and centers the UI (same logic as WorldEngine)
   */
  private handleResize(): void {
    if (!this.canvasElement.parentElement) return;
    
    const parent = this.canvasElement.parentElement;
    const containerWidth = parent.clientWidth;
    const containerHeight = parent.clientHeight;
    
    if (containerWidth <= 0 || containerHeight <= 0) return;

    // Calculate scale to fit safe area
    const scaleX = containerWidth / this.safeWidth;
    const scaleY = containerHeight / this.safeHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    // Calculate visible area (overdraw)
    const visibleWidth = Math.min(containerWidth / scale, this.maxWidth);
    const visibleHeight = Math.min(containerHeight / scale, this.maxHeight);

    // Calculate root offset (same as WorldEngine)
    const rootOffsetX = (containerWidth - visibleWidth * scale) / 2;
    const rootOffsetY = (containerHeight - visibleHeight * scale) / 2;
    
    // Calculate stage offset within visible area (same as WorldEngine)
    const stageOffsetX = (visibleWidth - this.safeWidth) / 2;
    const stageOffsetY = (visibleHeight - this.safeHeight) / 2;
    
    // Total offset = root offset + stage offset * scale
    const totalOffsetX = rootOffsetX + stageOffsetX * scale;
    const totalOffsetY = rootOffsetY + stageOffsetY * scale;

    // Store current transformation
    this.currentScale = scale;
    this.currentOffsetX = totalOffsetX;
    this.currentOffsetY = totalOffsetY;

    // Set UI container dimensions to safe area
    this.container.style.width = `${this.safeWidth}px`;
    this.container.style.height = `${this.safeHeight}px`;

    // Apply the same scale and position as WorldEngine root
    this.container.style.transform = `scale(${scale})`;
    this.container.style.left = `${rootOffsetX + stageOffsetX * scale}px`;
    this.container.style.top = `${rootOffsetY + stageOffsetY * scale}px`;

    // Re-render with updated coordinate transform
    this.render();
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
    window.removeEventListener('resize', this.handleResizeListener);
    window.removeEventListener('orientationchange', this.handleResizeListener);
    if (this.resizeRaf !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.resizeRaf);
      this.resizeRaf = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.root.unmount();
    if (this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    // Clear event listeners
    this.events.clear();
  }
}
