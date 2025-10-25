/**
 * FlameConeEmitter - lightweight particle system to enhance the flamethrower cone
 * Emits short-lived additive sprites within a cone to mimic individual flame tongues.
 */

import { Container, Sprite, Texture } from 'pixi.js';

export interface FlameEmitterConfig {
  angle: number; // radians, world orientation of the cone centre
  coneAngle: number; // radians, total spread
  coneLength: number; // pixels, reach of the flamethrower
  intensity: number; // 0-2 range controlling emission strength
}

interface FlameParticle {
  sprite: Sprite;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  spin: number;
  startScale: number;
}

export class FlameConeEmitter {
  private container: Container;
  private particles: FlameParticle[] = [];
  private spawnAccumulator = 0;
  private readonly baseSpawnRate = 85; // particles per second

  constructor(parent: Container) {
    this.container = new Container();
    this.container.zIndex = 11;
    this.container.visible = false;
    parent.addChild(this.container);
  }

  public update(deltaTime: number, config: FlameEmitterConfig, emitting: boolean): void {
    const dt = deltaTime;
    const spawnRate = this.baseSpawnRate * clamp(config.intensity, 0.4, 2.0);

    if (emitting) {
      this.spawnAccumulator += spawnRate * dt;
    }

    const halfSpread = config.coneAngle * 0.5;
    while (emitting && this.spawnAccumulator >= 1) {
      this.spawnAccumulator -= 1;
      this.spawnParticle(config.angle, halfSpread, config.coneLength, config.intensity);
    }

    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.life -= dt;

      if (particle.life <= 0) {
        this.container.removeChild(particle.sprite);
        particle.sprite.destroy();
        this.particles.splice(i, 1);
        continue;
      }

      const lifeProgress = 1 - particle.life / particle.maxLife;

      particle.vx *= 0.982;
      particle.vy *= 0.982;
      particle.vy -= 40 * dt; // drift upward slightly

      particle.sprite.x += particle.vx * dt;
      particle.sprite.y += particle.vy * dt;
      particle.sprite.rotation += particle.spin * dt;

      const scale = particle.startScale * (1 + lifeProgress * 0.6);
      particle.sprite.scale.set(scale, scale * (0.55 + lifeProgress * 0.35));
      particle.sprite.alpha = clamp(1.0 - lifeProgress * 1.2, 0.0, 1.0);
      particle.sprite.tint = this.colorGradient(lifeProgress);
    }

    this.container.visible = emitting || this.particles.length > 0;

    if (!emitting) {
      this.spawnAccumulator = 0; // drop queued spawns when disabled
    }
  }

  public setPosition(x: number, y: number): void {
    this.container.position.set(x, y);
  }

  public hasParticles(): boolean {
    return this.particles.length > 0;
  }

  public reset(): void {
    for (const particle of this.particles) {
      this.container.removeChild(particle.sprite);
      particle.sprite.destroy();
    }
    this.particles.length = 0;
    this.spawnAccumulator = 0;
    this.container.visible = false;
  }

  public destroy(): void {
    for (const particle of this.particles) {
      this.container.removeChild(particle.sprite);
      particle.sprite.destroy();
    }
    this.particles.length = 0;
    this.container.destroy();
  }

  private spawnParticle(angle: number, halfSpread: number, coneLength: number, intensity: number): void {
    const emissionAngle = angle + (Math.random() * 2 - 1) * halfSpread;
    const distance = Math.pow(Math.random(), 1.2) * coneLength * 0.28;
    const startX = Math.cos(emissionAngle) * distance;
    const startY = Math.sin(emissionAngle) * distance;

    const baseSpeed = 140 + Math.random() * 120;
    const speed = baseSpeed * (0.7 + intensity * 0.3);
    const vx = Math.cos(emissionAngle) * speed;
    const vy = Math.sin(emissionAngle) * speed;

    const sprite = Sprite.from(Texture.WHITE);
    sprite.anchor.set(0.5);
    sprite.position.set(startX, startY);
    sprite.alpha = 0.9;
    sprite.blendMode = 'add';

    const startScale = 4 + Math.random() * 3;
    sprite.scale.set(startScale, startScale * 0.6);

    const maxLife = 0.4 + Math.random() * 0.35;

    const particle: FlameParticle = {
      sprite,
      vx,
      vy,
      life: maxLife,
      maxLife,
      spin: (Math.random() - 0.5) * 6,
      startScale,
    };

    particle.sprite.tint = this.colorGradient(0);

    this.particles.push(particle);
    this.container.addChild(sprite);
  }

  private colorGradient(t: number): number {
    // Blend from white-yellow to deep orange/red
    const clamped = clamp(t, 0, 1);
    const r = 1.0;
    const g = 0.85 - clamped * 0.65;
    const b = 0.2 - clamped * 0.18;
    return toColor(r, g, b);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toColor(r: number, g: number, b: number): number {
  const red = Math.round(clamp(r, 0, 1) * 255);
  const green = Math.round(clamp(g, 0, 1) * 255);
  const blue = Math.round(clamp(b, 0, 1) * 255);
  return (red << 16) | (green << 8) | blue;
}
