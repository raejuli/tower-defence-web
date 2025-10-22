/**
 * Core Systems - Input System
 */

import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { TransformComponent } from '../components/TransformComponent';
import { InteractableComponent } from '../components/InteractableComponent';
import { Application } from 'pixi.js';

export class InputSystem extends System {
  private readonly _app: Application;
  private _mouseX: number = 0;
  private _mouseY: number = 0;
  private _mouseDown: boolean = false;
  private _hoveredEntity: number | null = null;

  constructor(world: World, app: Application) {
    super(world);
    this._app = app;
    this.priority = -100; // Process input early
  }

  public getRequiredComponents(): string[] {
    return ['Transform', 'Interactable'];
  }

  public onInit(): void {
    // Setup input listeners
    const canvas = this._app.canvas;

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this._mouseX = e.clientX - rect.left;
      this._mouseY = e.clientY - rect.top;
    });

    canvas.addEventListener('mousedown', () => {
      this._mouseDown = true;
    });

    canvas.addEventListener('mouseup', () => {
      this._mouseDown = false;
    });

    canvas.addEventListener('click', (e) => {
      this._handleClick(e);
    });
  }

  public update(deltaTime: number): void {
    const entities = this.getEntities();
    let newHoveredEntity: number | null = null;

    // Check for hover
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('Transform')!;
      const interactable = entity.getComponent<InteractableComponent>('Interactable')!;

      if (!interactable.enabled || !interactable.interactive) continue;

      if (interactable.isPointInside(this._mouseX, this._mouseY, transform.x, transform.y)) {
        newHoveredEntity = entity.id;
        if (interactable.onHover) {
          interactable.onHover(this._mouseX, this._mouseY);
        }
        break; // Only hover one entity at a time
      }
    }

    this._hoveredEntity = newHoveredEntity;
  }

  private _handleClick(e: MouseEvent): void {
    const rect = this._app.canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const entities = this.getEntities();

    // Check which entity was clicked (top to bottom)
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('Transform')!;
      const interactable = entity.getComponent<InteractableComponent>('Interactable')!;

      if (!interactable.enabled || !interactable.interactive) continue;

      if (interactable.isPointInside(clickX, clickY, transform.x, transform.y)) {
        if (interactable.onClick) {
          interactable.onClick(clickX, clickY);
        }
        break; // Only click one entity
      }
    }
  }

  public getMousePosition(): { x: number; y: number } {
    return { x: this._mouseX, y: this._mouseY };
  }
}
