/**
 * Game Systems - Tower Selection System
 * Core logic for updating tower graphics based on selection
 */

import { System } from '@raejuli/core-engine-gdk/ecs';
import { World } from '@raejuli/core-engine-gdk/ecs';
import { SelectableComponent } from '../components/enemy/SelectableComponent';
import { RenderableComponent } from '@raejuli/core-engine-gdk/components';
import { TowerComponent } from '../components/tower/TowerComponent';
import { FlamethrowerTowerComponent } from '../components/tower/FlamethrowerTowerComponent';
import { Container, Graphics } from 'pixi.js';
import { FlameConeEmitter, FlameEmitterConfig } from '../effects/FlameConeEmitter';

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const lerpColor = (from: number, to: number, t: number): number => {
  const clamped = clamp01(t);
  const fr = (from >> 16) & 0xff;
  const fg = (from >> 8) & 0xff;
  const fb = from & 0xff;
  const tr = (to >> 16) & 0xff;
  const tg = (to >> 8) & 0xff;
  const tb = to & 0xff;

  const r = Math.round(fr + (tr - fr) * clamped);
  const g = Math.round(fg + (tg - fg) * clamped);
  const b = Math.round(fb + (tb - fb) * clamped);

  return (r << 16) | (g << 8) | b;
};

interface FlameOverlay {
  container: Container;
  cone: Graphics;
  emitter: FlameConeEmitter;
  active: boolean;
  config: FlameEmitterConfig;
}

export class TowerSelectionSystem extends System {
  private flameOverlays: Map<number, FlameOverlay> = new Map();
  private elapsedTime: number = 0;
  private stage: Container | null = null;

  constructor(world: World) {
    super(world);
    this.priority = 90; // Run before render
  }

  /**
   * Initialize with the stage container
   */
  public setStage(stage: Container): void {
    this.stage = stage;
  }

  public getRequiredComponents(): string[] {
    return ['Selectable', 'Renderable', 'Tower'];
  }

  /**
   * Update the filter animations
   */
  public update(deltaTime: number): void {
    this.elapsedTime += deltaTime;

    const world = this.getWorld();
    for (const [entityId, overlay] of this.flameOverlays.entries()) {
      if (!world.getEntity(entityId)) {
        this.disposeOverlay(entityId);
        continue;
      }

      overlay.emitter.update(deltaTime, overlay.config, overlay.active);
      const hasParticles = overlay.emitter.hasParticles();
      overlay.container.visible = overlay.cone.visible || overlay.active || hasParticles;

      if (!overlay.cone.visible && !overlay.active && !hasParticles) {
        this.disposeOverlay(entityId);
        continue;
      }
    }
  }

  /**
   * Update all tower graphics based on selection state
   */
  public updateTowerGraphics(): void {
    const entities = this.getEntities();

    for (const entity of entities) {
      const selectable = entity.getComponent('Selectable') as SelectableComponent;
      const renderable = entity.getComponent('Renderable') as RenderableComponent;
      const tower = entity.getComponent('Tower') as TowerComponent;
      const flamethrower = entity.getComponent('FlamethrowerTower') as FlamethrowerTowerComponent;

      if (!selectable || !renderable || !tower) continue;

      // Update graphics based on selection state
      this._renderTower(entity.id, renderable, tower, selectable.selected, flamethrower);
    }
  }

  /**
   * Cleanup when system is destroyed
   */
  public onDestroy(): void {
    for (const entityId of Array.from(this.flameOverlays.keys())) {
      this.disposeOverlay(entityId);
    }
  }

  private _renderTower(
    entityId: number,
    renderable: RenderableComponent,
    tower: TowerComponent,
    showRange: boolean,
    flamethrower?: FlamethrowerTowerComponent
  ): void {
    const size = 30;

    renderable.graphics.clear();
    renderable.graphics.rect(0, 0, size, size);
    renderable.graphics.fill(tower.color);

    if (flamethrower) {
      const isAttacking = tower.currentTarget !== null;
      const showCone = showRange && !isAttacking;
      const shouldEmit = isAttacking;
      const emitterIntensity = isAttacking ? 1.3 : 0.7;

      // Simple cone rendering when selected but not attacking
      if (showCone) {
        const centerX = size / 2;
        const centerY = size / 2;
        const angle = flamethrower.currentAngle;
        const halfCone = (flamethrower.coneAngle * Math.PI) / 180 / 2;
        const length = flamethrower.coneLength;

        const startAngle = angle - halfCone;
        const endAngle = angle + halfCone;

        renderable.graphics.moveTo(centerX, centerY);
        renderable.graphics.lineTo(
          centerX + Math.cos(startAngle) * length,
          centerY + Math.sin(startAngle) * length
        );
        renderable.graphics.arc(centerX, centerY, length, startAngle, endAngle);
        renderable.graphics.lineTo(centerX, centerY);
        renderable.graphics.fill({ color: 0xffaa00, alpha: 0.6 });
      }

      // Particle effects when attacking
      if (shouldEmit) {
        const overlay = this.getOrCreateOverlay(entityId, renderable, emitterIntensity);
        
        if (overlay) {
          const centerX = size / 2;
          const centerY = size / 2;
          const angle = flamethrower.currentAngle;
          const coneAngleRad = (flamethrower.coneAngle * Math.PI) / 180;

          const parentContainer = overlay.container.parent;
          if (parentContainer) {
            const globalPos = renderable.graphics.getGlobalPosition();
            const localPos = parentContainer.toLocal(globalPos);
            overlay.container.position.set(localPos.x + centerX, localPos.y + centerY);
          }

          overlay.config.angle = angle;
          overlay.config.coneAngle = coneAngleRad;
          overlay.config.coneLength = flamethrower.coneLength;
          overlay.config.intensity = emitterIntensity;
          overlay.active = true;
          overlay.cone.visible = false;
        }
      } else if (this.flameOverlays.has(entityId)) {
        const overlay = this.flameOverlays.get(entityId);
        if (overlay) {
          overlay.active = false;
          if (!overlay.emitter.hasParticles()) {
            this.disposeOverlay(entityId);
          }
        }
      }
    } else {
      if (this.flameOverlays.has(entityId)) {
        this.disposeOverlay(entityId);
      }

      if (showRange) {
        renderable.graphics.circle(size / 2, size / 2, tower.stats.range);
        renderable.graphics.stroke({ width: 2, color: tower.color, alpha: 0.5 });
      }
    }
  }

  private getOrCreateOverlay(
    entityId: number,
    renderable: RenderableComponent,
    intensity: number
  ): FlameOverlay | null {
    let overlay = this.flameOverlays.get(entityId);
    const parent = this.stage ?? renderable.graphics.parent;

    if (!parent) {
      return null;
    }

    if (!overlay) {
      const container = new Container();
      container.zIndex = 10;

      const cone = new Graphics();
      cone.visible = false;
      cone.blendMode = 'add';
      container.addChild(cone);

      const emitter = new FlameConeEmitter(container);

      if (!parent.sortableChildren) {
        parent.sortableChildren = true;
      }
      parent.addChild(container);

      const newOverlay: FlameOverlay = {
        container,
        cone,
        emitter,
        active: false,
        config: {
          angle: 0,
          coneAngle: 0,
          coneLength: 0,
          intensity,
        },
      };

      this.flameOverlays.set(entityId, newOverlay);
      overlay = newOverlay;
    } else if (overlay.container.parent !== parent) {
      overlay.container.parent?.removeChild(overlay.container);
      parent.addChild(overlay.container);
    }

    if (overlay) {
      overlay.container.visible = true;
      overlay.config.intensity = intensity;
    }

    return overlay ?? null;
  }

  private disposeOverlay(entityId: number): void {
    const overlay = this.flameOverlays.get(entityId);
    if (!overlay) {
      return;
    }

    overlay.cone.filters = null;
    overlay.emitter.destroy();
    overlay.container.destroy();
    this.flameOverlays.delete(entityId);
  }
}
