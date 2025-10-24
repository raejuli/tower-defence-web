/**
 * Game UI - Shop and HUD
 */

import { EventEmitter } from '../../engine/events/EventEmitter';
import { TowerStats } from '../components/TowerComponent';
import {
  TowerPlacementRequestEvent,
  TowerSelectionRequestEvent,
  TowerClickedEvent,
  CancelPlacementEvent
} from './UIEvents';
import { UIView } from './UIView';
import { TowerDetailsView } from './TowerDetailsView';
import { Entity } from '../../engine/ecs/Entity';

export interface TowerType {
  name: string;
  color: number;
  stats: TowerStats;
}

export interface GameUIState {
  money: number;
  lives: number;
  wave: number;
  score: number;
  isPaused: boolean;
  isPlacementMode: boolean;
  isSceneSelect: boolean;
}

export class GameUI extends EventEmitter {
  private readonly _container: HTMLDivElement;
  private readonly _viewsContainer: HTMLDivElement;
  private _selectedTowerType: string | null = null;
  private _selectedTowerEntityId: number | null = null;
  private _canvasElement: HTMLCanvasElement | null = null;
  private _state: GameUIState = {
    money: 0,
    lives: 0,
    wave: 0,
    score: 0,
    isPaused: false,
    isPlacementMode: false,
    isSceneSelect: false
  };

  // Views
  private _views: Map<string, UIView> = new Map();
  private _towerDetailsView: TowerDetailsView;

  // Tower types
  public readonly towerTypes: Map<string, TowerType> = new Map([
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
    }]
  ]);

  constructor(canvasElement: HTMLCanvasElement, parentContainer?: HTMLElement) {
    super();
    this._canvasElement = canvasElement;
    this._container = document.createElement('div');
    this._container.id = 'game-ui';
    
    // Create views container
    this._viewsContainer = document.createElement('div');
    this._viewsContainer.id = 'ui-views-container';
    this._container.appendChild(this._viewsContainer);
    
    // Create tower details view
    this._towerDetailsView = new TowerDetailsView();
    this._viewsContainer.appendChild(this._towerDetailsView.getContainer());
    this._views.set('towerDetails', this._towerDetailsView);
    
    // Listen for tower details close event
    this._towerDetailsView.getContainer().addEventListener('towerDetailsClose', () => {
      this.emit('towerDeselected');
    });
    
    this._setupUI();
    
    // Append to parent container if provided, otherwise append to body
    const parent = parentContainer || canvasElement.parentElement || document.body;
    parent.appendChild(this._container);
  }

  public addView(key: string, view: UIView): void {
    this._views.set(key, view);
    this._viewsContainer.appendChild(view.getContainer());
  }

  public removeView(key: string): void {
    const view = this._views.get(key);
    if (view) {
      view.destroy();
      this._views.delete(key);
    }
  }

  public getView(key: string): UIView | undefined {
    return this._views.get(key);
  }

  public showTowerDetails(tower: Entity): void {
    this._towerDetailsView.setTower(tower);
    this._towerDetailsView.show();
  }

  public hideTowerDetails(): void {
    this._towerDetailsView.hide();
  }

  public setState(state: Partial<GameUIState>): void {
    this._state = { ...this._state, ...state };
    this._updateDisplay();
    this._updateSceneSelectVisibility();
  }

  public setScenes(scenesByDifficulty: { Easy: any[]; Medium: any[]; Hard: any[]; Expert: any[] }): void {
    const container = this._container.querySelector('#scenes-container');
    if (!container) return;

    container.innerHTML = '';

    // Render each difficulty section
    (['Easy', 'Medium', 'Hard', 'Expert'] as const).forEach(difficulty => {
      const scenes = scenesByDifficulty[difficulty];
      if (scenes.length === 0) return;

      const section = document.createElement('div');
      section.className = 'difficulty-section';
      section.innerHTML = `
        <h3>${difficulty}</h3>
        <div class="scene-grid" data-difficulty="${difficulty}"></div>
      `;

      const grid = section.querySelector('.scene-grid')!;
      scenes.forEach((scene: any) => {
        const card = document.createElement('div');
        card.className = 'scene-card';
        card.dataset.sceneId = scene.id;
        card.innerHTML = `
          <h4>${scene.name}</h4>
          <p>${scene.description}</p>
          <span class="difficulty difficulty-${scene.difficulty}">${scene.difficulty}</span>
        `;

        card.addEventListener('click', () => {
          this.emit('sceneSelected', scene.id);
        });

        grid.appendChild(card);
      });

      container.appendChild(section);
    });
  }

  private _updateSceneSelectVisibility(): void {
    const sceneSelect = this._container.querySelector('#scene-select');
    if (sceneSelect) {
      if (this._state.isSceneSelect) {
        sceneSelect.classList.add('visible');
      } else {
        sceneSelect.classList.remove('visible');
      }
    }
  }

  public setPlacementMode(active: boolean): void {
    console.log('GameUI: setPlacementMode called with', active);
    this._state.isPlacementMode = active;
    if (!active) {
      this._selectedTowerType = null;
      this._updateTowerButtonStates();
    }
  }

  private _setupUI(): void {
    const uiHTML = document.createElement('div');
    uiHTML.innerHTML = `
      <style>
        #game-ui {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 250px;
          font-family: Arial, sans-serif;
          color: white;
          pointer-events: all;
          z-index: 100;
        }
        
        #ui-views-container {
          margin-bottom: 10px;
        }
        
        #scene-select {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        #scene-select.visible {
          display: flex;
        }
        
        #scene-select-content {
          max-width: 900px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          padding: 30px;
          background: rgba(20, 20, 40, 0.95);
          border-radius: 10px;
          border: 2px solid #444;
        }
        
        #scene-select h2 {
          margin-top: 0;
          color: #fff;
          text-align: center;
          font-size: 32px;
        }
        
        .difficulty-section {
          margin: 20px 0;
        }
        
        .difficulty-section h3 {
          color: #aaa;
          border-bottom: 2px solid #444;
          padding-bottom: 5px;
        }
        
        .scene-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 10px;
        }
        
        .scene-card {
          background: rgba(50, 50, 70, 0.8);
          padding: 20px;
          border-radius: 8px;
          border: 2px solid #555;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .scene-card:hover {
          border-color: #0f0;
          background: rgba(60, 60, 80, 0.9);
          transform: translateY(-3px);
        }
        
        .scene-card h4 {
          margin: 0 0 10px 0;
          color: #fff;
          font-size: 18px;
        }
        
        .scene-card p {
          margin: 5px 0;
          color: #ccc;
          font-size: 14px;
        }
        
        .scene-card .difficulty {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: bold;
          margin-top: 5px;
        }
        
        .difficulty-Easy { background: #4CAF50; }
        .difficulty-Medium { background: #FF9800; }
        .difficulty-Hard { background: #F44336; }
        .difficulty-Expert { background: #9C27B0; }
        
        #hud {
          background: rgba(0, 0, 0, 0.8);
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 10px;
        }
        
        #shop {
          background: rgba(0, 0, 0, 0.8);
          padding: 10px;
          border-radius: 5px;
        }
        
        #shop h3 {
          margin-top: 0;
        }
        
        .tower-button {
          display: block;
          margin: 5px 0;
          padding: 10px;
          background: #333;
          border: 2px solid #666;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .tower-button:hover {
          background: #444;
          border-color: #888;
          transform: translateY(-2px);
        }
        
        .tower-button.selected {
          border-color: #0f0;
          background: #264;
        }
        
        .tower-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .tower-color {
          display: inline-block;
          width: 20px;
          height: 20px;
          margin-right: 10px;
          border-radius: 3px;
          vertical-align: middle;
        }
        
        #controls {
          margin-top: 10px;
        }
        
        .control-button {
          padding: 8px 15px;
          margin: 5px 0;
          width: 100%;
          background: #333;
          border: 2px solid #666;
          color: white;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .control-button:hover {
          background: #444;
        }
      </style>
      
      <div id="scene-select">
        <div id="scene-select-content">
          <h2>🎬 Select a Scene</h2>
          <div id="scenes-container"></div>
        </div>
      </div>
      
      <div id="hud">
        <div>💰 Money: $<span id="money">500</span></div>
        <div>❤️ Lives: <span id="lives">20</span></div>
        <div>🌊 Wave: <span id="wave">0</span></div>
        <div>⭐ Score: <span id="score">0</span></div>
      </div>
      
      <div id="shop">
        <h3>Tower Shop</h3>
        <div id="tower-buttons"></div>
        <div id="controls">
          <button class="control-button" id="cancel-placement">Cancel (ESC)</button>
        </div>
      </div>
    `;

    // Append to container (after views container)
    this._container.appendChild(uiHTML);

    // Create tower buttons
    const towerButtonsContainer = this._container.querySelector('#tower-buttons')!;
    this.towerTypes.forEach((towerType, key) => {
      const button = document.createElement('div');
      button.className = 'tower-button';
      button.dataset.towerType = key;
      button.innerHTML = `
        <span class="tower-color" style="background-color: #${towerType.color.toString(16).padStart(6, '0')}"></span>
        <strong>${towerType.name}</strong><br>
        <small>$${towerType.stats.cost} | DMG: ${towerType.stats.damage} | RNG: ${towerType.stats.range}</small>
      `;
      
      button.addEventListener('click', () => this._selectTower(key));
      towerButtonsContainer.appendChild(button);
    });

    // Setup control buttons
    this._container.querySelector('#cancel-placement')?.addEventListener('click', () => {
      this._cancelPlacement();
    });
    
    // ESC key to cancel placement
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this._cancelPlacement();
        this.emit('towerDeselected');
      }
    });

    // Click to place tower
    if (this._canvasElement) {
      this._canvasElement.addEventListener('click', (e) => {
        console.log('Canvas clicked, isPlacementMode:', this._state.isPlacementMode);
        if (this._state.isPlacementMode) {
          this._placeTower(e);
        }
      });
    }
  }

  private _selectTower(towerType: string): void {
    const towerData = this.towerTypes.get(towerType);
    if (!towerData) return;

    if (this._state.money < towerData.stats.cost) {
      console.log('Not enough money!');
      return;
    }

    this._selectedTowerType = towerType;
    
    // Emit event for game to handle
    this.emit('towerSelected', {
      towerType,
      range: towerData.stats.range
    } as TowerSelectionRequestEvent);
    
    // Update button states
    this._updateTowerButtonStates();
  }

  private _placeTower(e: MouseEvent): void {
    if (!this._selectedTowerType || !this._canvasElement) return;

    const towerData = this.towerTypes.get(this._selectedTowerType);
    if (!towerData) return;

    const rect = this._canvasElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    console.log('GameUI: Emitting towerPlacementRequested', { towerType: this._selectedTowerType, x, y });

    // Emit event for game to handle placement logic
    this.emit('towerPlacementRequested', {
      towerType: this._selectedTowerType,
      x,
      y
    } as TowerPlacementRequestEvent);
  }

  private _cancelPlacement(): void {
    this._selectedTowerType = null;
    this.emit('placementCancelled', {} as CancelPlacementEvent);
    this._updateTowerButtonStates();
  }

  private _updateTowerButtonStates(): void {
    this._container.querySelectorAll('.tower-button').forEach(btn => {
      const towerType = btn.getAttribute('data-tower-type');
      const towerData = towerType ? this.towerTypes.get(towerType) : null;
      
      btn.classList.remove('selected');
      
      if (towerType === this._selectedTowerType) {
        btn.classList.add('selected');
      }
      
      if (towerData && this._state.money < towerData.stats.cost) {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }
    });
  }

  private _updateDisplay(): void {
    // Update HUD
    const moneyEl = this._container.querySelector('#money');
    const livesEl = this._container.querySelector('#lives');
    const waveEl = this._container.querySelector('#wave');
    const scoreEl = this._container.querySelector('#score');

    if (moneyEl) moneyEl.textContent = this._state.money.toString();
    if (livesEl) livesEl.textContent = this._state.lives.toString();
    if (waveEl) waveEl.textContent = this._state.wave.toString();
    if (scoreEl) scoreEl.textContent = this._state.score.toString();

    this._updateTowerButtonStates();
  }

  public destroy(): void {
    this.clear();
    if (this._container.parentElement) {
      this._container.parentElement.removeChild(this._container);
    }
  }
}
