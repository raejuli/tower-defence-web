/**
 * Click Handler System
 * 
 * Handles mouse click events for InteractableComponent entities.
 * Uses the WorldEngine's InputManager to detect clicks.
 */

import { InteractableComponent, TransformComponent } from '@raejuli/core-engine-gdk';
import { System, World } from '@raejuli/core-engine-gdk/ecs';
import { InputManager, MouseButton } from '@raejuli/core-engine-gdk/input';

export class ClickHandlerSystem extends System {
  private _inputManager: InputManager;
  private _hoveredEntity: number | null = null;

  constructor(world: World, inputManager: InputManager) {
    super(world);
    this._inputManager = inputManager;
    this.priority = -100; // Process input early
  }

  public getRequiredComponents(): string[] {
    return ['Transform', 'Interactable'];
  }

  public update(deltaTime: number): void {
    const entities = this.getEntities();
    const mousePos = this._inputManager.getMousePosition();
    const clicked = this._inputManager.isMouseButtonJustPressed(MouseButton.Left);
    
    let newHoveredEntity: number | null = null;

    // Check for hover and clicks
    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('Transform')!;
      const interactable = entity.getComponent<InteractableComponent>('Interactable')!;

      if (!interactable.enabled || !interactable.interactive) continue;

      if (interactable.isPointInside(mousePos.x, mousePos.y, transform.x, transform.y)) {
        newHoveredEntity = entity.id;
        
        // Call hover callback
        if (interactable.onHover) {
          interactable.onHover(mousePos.x, mousePos.y);
        }
        
        // Call click callback if mouse was just clicked
        if (clicked && interactable.onClick) {
          interactable.onClick(mousePos.x, mousePos.y);
        }
        
        break; // Only process one entity at a time (top-most)
      }
    }

    this._hoveredEntity = newHoveredEntity;
  }
}
