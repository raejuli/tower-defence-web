/**
 * Core Systems - Rendering System
 */

import { System } from '../ecs/System';
import { World } from '../ecs/World';
import { TransformComponent } from '../components/TransformComponent';
import { RenderableComponent } from '../components/RenderableComponent';
import { Container } from 'pixi.js';

export class RenderSystem extends System {
  private readonly _container: Container;

  constructor(world: World, container: Container) {
    super(world);
    this._container = container;
    this.priority = 100; // Render last
  }

  public getRequiredComponents(): string[] {
    return ['Transform', 'Renderable'];
  }

  public onInit(): void {
    // Initialize rendering
  }

  public update(deltaTime: number): void {
    const entities = this.getEntities();

    for (const entity of entities) {
      const transform = entity.getComponent<TransformComponent>('Transform')!;
      const renderable = entity.getComponent<RenderableComponent>('Renderable')!;

      if (!renderable.enabled || !renderable.visible) {
        if (renderable.graphics.parent) {
          this._container.removeChild(renderable.graphics);
        }
        continue;
      }

      // Add to container if not already added
      if (!renderable.graphics.parent) {
        this._container.addChild(renderable.graphics);
      }

      // Sync graphics transform with entity transform
      renderable.graphics.position.set(transform.x, transform.y);
      renderable.graphics.rotation = transform.rotation;
      renderable.graphics.scale.set(transform.scaleX, transform.scaleY);
      renderable.graphics.zIndex = renderable.zIndex;
    }

    // Sort by z-index
    this._container.sortChildren();
  }

  public onDestroy(): void {
    // Clean up all graphics
    const entities = this.getEntities();
    for (const entity of entities) {
      const renderable = entity.getComponent<RenderableComponent>('Renderable');
      if (renderable && renderable.graphics.parent) {
        this._container.removeChild(renderable.graphics);
      }
    }
  }

  /**
   * Remove graphics for a specific entity
   */
  public removeEntityGraphics(entity: any): void {
    const renderable = entity.getComponent('Renderable') as RenderableComponent;
    if (renderable && renderable.graphics.parent) {
      this._container.removeChild(renderable.graphics);
      renderable.graphics.destroy();
    }
  }
}
