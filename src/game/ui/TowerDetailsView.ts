/**
 * Tower Details UI View
 */

import { UIView } from './UIView';
import { Entity } from '../../engine/ecs/Entity';

export class TowerDetailsView extends UIView {
  private _tower: Entity | null = null;

  protected _createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'tower-details-view';
    container.className = 'ui-view';
    return container;
  }

  public setTower(tower: Entity): void {
    this._tower = tower;
    this.render();
  }

  public render(): void {
    if (!this._tower) {
      this._container.innerHTML = '';
      return;
    }

    const components = this._tower.getAllComponents();
    
    let html = `
      <style>
        .ui-view {
          background: rgba(0, 0, 0, 0.8);
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 10px;
          color: white;
          font-family: Arial, sans-serif;
        }
        
        .ui-view h3 {
          margin-top: 0;
          border-bottom: 1px solid #666;
          padding-bottom: 5px;
        }
        
        .close-button {
          float: right;
          cursor: pointer;
          font-size: 18px;
          line-height: 1;
        }
        
        .close-button:hover {
          color: #f00;
        }
        
        .component-section {
          margin: 10px 0;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
          border-left: 3px solid #4a9eff;
        }
        
        .component-title {
          font-weight: bold;
          color: #4a9eff;
          font-size: 14px;
          margin-bottom: 5px;
        }
        
        .component-content {
          color: #ddd;
          font-size: 12px;
          white-space: pre-wrap;
          font-family: 'Courier New', monospace;
        }
      </style>
      
      <h3>
        Tower Details
        <span class="close-button" id="close-tower-details">×</span>
      </h3>
    `;

    // Loop through all components and call toString()
    for (const component of components) {
      const componentType = component.getType();
      const componentString = component.toString();
      
      if (componentString)
      {
        html += `
        <div class="component-section">
          <div class="component-title">${componentType}</div>
          <div class="component-content">${this._escapeHtml(componentString)}</div>
        </div>
      `;
      }
    }

    this._container.innerHTML = html;

    // Setup close button
    const closeButton = this._container.querySelector('#close-tower-details');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hide();
        // Emit event through parent if needed
        const event = new CustomEvent('towerDetailsClose');
        this._container.dispatchEvent(event);
      });
    }
  }

  private _escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
