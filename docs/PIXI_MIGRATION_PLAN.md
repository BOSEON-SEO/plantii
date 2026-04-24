# Plantii PixiJS Game Canvas Migration Plan

> **Version**: 1.0
> **Date**: 2026-04-24
> **Base Analysis**: SPRITE_ANALYSIS.md (step-1), TECH_RESEARCH.md (step-2), Frontend Code Audit (step-3)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [PixiJS Rendering Pipeline Architecture](#3-pixijs-rendering-pipeline-architecture)
4. [Sprite Loading & Plant Stage Display Strategy](#4-sprite-loading--plant-stage-display-strategy)
5. [Animation System](#5-animation-system)
6. [Kairosoft-Style Pixel UI Implementation](#6-kairosoft-style-pixel-ui-implementation)
7. [PWA Manifest & Mobile Install Setup](#7-pwa-manifest--mobile-install-setup)
8. [Migration Path from Tailwind UI](#8-migration-path-from-tailwind-ui)
9. [Implementation Phases & Timeline](#9-implementation-phases--timeline)
10. [Risk Matrix & Mitigation](#10-risk-matrix--mitigation)

---

## 1. Executive Summary

### 1.1 Migration Goal

React + Tailwind CSS 기반의 정적 HTML UI를 **PixiJS v8 WebGL 게임 캔버스**로 전환하여, 카이로소프트(Kairosoft) 스타일의 도트 그래픽 식물 육성 시뮬레이션 게임을 구현한다.

### 1.2 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering Engine | PixiJS v8 | 최고 2D 성능, TS 네이티브, nearest-neighbor 지원 |
| React Integration | @pixi/react | 기존 React 라우팅/인증 유지, 게임 캔버스만 PixiJS |
| Animation (UI) | GSAP | 타임라인 시퀀싱, 60+ 이징 함수 |
| Animation (Game Loop) | PixiJS Ticker | deltaTime 기반 프레임 독립 애니메이션 |
| Particle System | ParticleContainer + @pixi/particle-emitter | 대량 파티클(날씨) + 이펙트 파티클(물주기) |
| Pixel Font | BitmapText | 빈번한 텍스트 갱신 최적 |
| Build Tool | Vite (기존 유지) | 이미 설정됨, PixiJS 호환 |

### 1.3 What Changes vs What Stays

```
STAYS (React Layer)                  CHANGES (PixiJS Canvas)
================================     ================================
- React Router (SPA routing)         - Dashboard.tsx emoji -> PixiJS sprite
- AuthContext (login/register)       - Collection.tsx cards -> PixiJS catalog scene
- plant.service.ts (API calls)       - Layout.tsx bottom nav -> PixiJS pixel nav
- api.ts (axios instance)           - ProgressBar.tsx -> PixiJS gauge bars
- PrivateRoute.tsx                   - Button.tsx -> NineSlice pixel buttons
- Login.tsx / Register.tsx           - NEW: Game canvas with plant rendering
- Profile.tsx                        - NEW: Animation system
                                     - NEW: Particle effects
                                     - NEW: Day/Night cycle
                                     - NEW: PWA manifest + enhanced SW
```

---

## 2. Current State Assessment

### 2.1 Frontend Architecture (AS-IS)

```
frontend/
  src/
    App.tsx              -- React Router (/, /collection, /profile, /login, /register)
    main.tsx             -- Entry point
    contexts/
      AuthContext.tsx     -- JWT auth state
    components/
      Layout.tsx         -- Bottom nav bar (emoji icons, Tailwind)
      PrivateRoute.tsx   -- Auth guard
      Button.tsx         -- Tailwind button
      ProgressBar.tsx    -- Tailwind progress bar
    pages/
      Dashboard.tsx      -- Main plant view (EMOJI ONLY, no sprites)
      Collection.tsx     -- Plant catalog (EMOJI ONLY, no sprites)
      Profile.tsx        -- User profile
      Login.tsx          -- Login form
      Register.tsx       -- Register form
    services/
      api.ts             -- Axios instance
      auth.service.ts    -- Auth API
      plant.service.ts   -- Plant/UserPlant API
    assets/
      plants/            -- 75 PNG sprites (64x64, UNUSED)
```

### 2.2 Critical Gaps

| Gap | Impact | Resolution in This Plan |
|-----|--------|------------------------|
| 75 sprites exist but UNUSED | No visual game experience | Section 4: Sprite Loading Strategy |
| Emoji-only plant display | Not a game, just a dashboard | Section 3: PixiJS Canvas |
| No animation at all | Static, non-engaging UI | Section 5: Animation System |
| 5 sprites vs 6-7 backend stages | Stage mapping mismatch | Section 4.3: Stage Mapping |
| Service Worker caches .tsx files | Won't work in production build | Section 7: PWA Enhancement |
| No manifest.json | Can't install as PWA | Section 7: PWA Manifest |
| No pixel art UI | Doesn't look like Kairosoft game | Section 6: Pixel UI |

---

## 3. PixiJS Rendering Pipeline Architecture

### 3.1 Hybrid Architecture: React Shell + PixiJS Canvas

React가 라우팅, 인증, API 통신을 담당하고, PixiJS가 게임 렌더링을 전담하는 **하이브리드 구조**를 채택한다.

```
+---------------------------------------------------------------+
|                     Browser Window                             |
+---------------------------------------------------------------+
|  React Layer (DOM)                                             |
|  +----------------------------------------------------------+ |
|  | App.tsx (Router)                                          | |
|  |  +-- Login.tsx (Tailwind, DOM)                           | |
|  |  +-- Register.tsx (Tailwind, DOM)                        | |
|  |  +-- Profile.tsx (Tailwind, DOM)                         | |
|  |  +-- GameShell.tsx (NEW - PixiJS mount point)            | |
|  |       |                                                   | |
|  |       v                                                   | |
|  |  +--------------------------------------------------+    | |
|  |  |  PixiJS Canvas (WebGL)                           |    | |
|  |  |  +--------------------------------------------+  |    | |
|  |  |  |  Stage (Root Container)                     |  |    | |
|  |  |  |  +-- BackgroundLayer (sky, ground, time)    |  |    | |
|  |  |  |  +-- GameLayer (plants, pots, effects)      |  |    | |
|  |  |  |  +-- ParticleLayer (weather, sparkles)      |  |    | |
|  |  |  |  +-- UILayer (HUD, panels, buttons)         |  |    | |
|  |  |  |  +-- OverlayLayer (dialogs, transitions)    |  |    | |
|  |  |  +--------------------------------------------+  |    | |
|  |  +--------------------------------------------------+    | |
|  +----------------------------------------------------------+ |
+---------------------------------------------------------------+
```

### 3.2 Layer Architecture

5개의 렌더링 레이어로 z-order를 관리한다:

```typescript
// frontend/src/game/layers.ts

export enum LayerDepth {
  BACKGROUND = 0,   // 하늘, 땅, 낮밤 그라데이션
  GAME       = 1,   // 식물 스프라이트, 화분, 인터랙션 요소
  PARTICLE   = 2,   // 날씨 파티클, 이펙트 파티클
  UI         = 3,   // HUD (자원, 상태바, 버튼)
  OVERLAY    = 4,   // 다이얼로그, 씬 전환, 모달
}
```

| Layer | Container Type | Content | Update Frequency |
|-------|---------------|---------|------------------|
| Background | Container | Sky gradient, ground tiles, sun/moon | Per time-of-day change |
| Game | Container | Plant sprites, pots, soil | On user action / growth tick |
| Particle | ParticleContainer | Rain, sparkles, pollen, dust | Every frame (60fps) |
| UI | Container | BitmapText, NineSlice panels, buttons | On state change |
| Overlay | Container | Modal dialogs, scene transitions | On user interaction |

### 3.3 Application Bootstrap

```typescript
// frontend/src/game/Game.ts

import { Application, Container } from 'pixi.js';

export class Game {
  public app: Application;
  public layers: {
    background: Container;
    game: Container;
    particle: Container;
    ui: Container;
    overlay: Container;
  };

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new Application();

    await this.app.init({
      canvas,
      width: 320,                          // Kairosoft-style low-res
      height: 480,
      backgroundColor: 0x87ceeb,           // Sky blue default
      antialias: false,                    // CRITICAL: pixel-perfect
      roundPixels: true,                   // CRITICAL: integer coords
      resolution: window.devicePixelRatio,
      autoDensity: true,
    });

    // CSS pixel-perfect scaling
    canvas.style.imageRendering = 'pixelated';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.objectFit = 'contain';

    // Create layer hierarchy
    this.layers = {
      background: new Container(),
      game: new Container(),
      particle: new Container(),
      ui: new Container(),
      overlay: new Container(),
    };

    this.app.stage.addChild(
      this.layers.background,
      this.layers.game,
      this.layers.particle,
      this.layers.ui,
      this.layers.overlay,
    );
  }

  destroy(): void {
    this.app.destroy(true, { children: true, texture: true });
  }
}
```

### 3.4 React Integration Component

```typescript
// frontend/src/components/GameShell.tsx

import React, { useRef, useEffect } from 'react';
import { Game } from '../game/Game';
import { AssetManager } from '../game/engine/AssetManager';
import { SceneManager } from '../game/engine/SceneManager';

interface GameShellProps {
  scene: 'garden' | 'collection' | 'shop';
  plantData?: any;
}

const GameShell: React.FC<GameShellProps> = ({ scene, plantData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  useEffect(() => {
    const game = new Game();
    gameRef.current = game;

    const setup = async () => {
      if (!canvasRef.current) return;
      await game.init(canvasRef.current);
      await AssetManager.loadBundle('core');
      SceneManager.switchTo(scene, plantData);
    };

    setup();

    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  // React state -> PixiJS bridge
  useEffect(() => {
    if (gameRef.current && plantData) {
      SceneManager.updatePlantData(plantData);
    }
  }, [plantData]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100vh',
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  );
};

export default GameShell;
```

### 3.5 Scene Manager

```typescript
// frontend/src/game/engine/SceneManager.ts

import { Container } from 'pixi.js';

export interface GameScene {
  name: string;
  container: Container;
  onEnter(data?: any): Promise<void>;
  onExit(): Promise<void>;
  onUpdate(deltaTime: number): void;
  onResize(width: number, height: number): void;
}

export class SceneManager {
  private static scenes = new Map<string, GameScene>();
  private static currentScene: GameScene | null = null;
  private static game: Game;

  static register(scene: GameScene): void {
    this.scenes.set(scene.name, scene);
  }

  static async switchTo(name: string, data?: any): Promise<void> {
    // Exit current scene
    if (this.currentScene) {
      await this.currentScene.onExit();
      this.game.layers.game.removeChild(this.currentScene.container);
    }

    // Enter new scene
    const scene = this.scenes.get(name);
    if (!scene) throw new Error(`Scene "${name}" not found`);

    this.currentScene = scene;
    this.game.layers.game.addChild(scene.container);
    await scene.onEnter(data);
  }

  static updatePlantData(data: any): void {
    // Bridge: React state -> PixiJS scene
    if (this.currentScene && 'updatePlantData' in this.currentScene) {
      (this.currentScene as any).updatePlantData(data);
    }
  }
}
```

### 3.6 Game Loop (Ticker)

```typescript
// frontend/src/game/engine/GameLoop.ts

import { Ticker } from 'pixi.js';

export class GameLoop {
  private ticker: Ticker;
  private systems: Array<{ update(dt: number): void }> = [];

  constructor(app: Application) {
    this.ticker = app.ticker;
    this.ticker.maxFPS = 60;

    this.ticker.add((ticker) => {
      const dt = ticker.deltaTime;  // Frame-independent delta

      // Update all registered systems
      for (const system of this.systems) {
        system.update(dt);
      }

      // Update current scene
      SceneManager.currentScene?.onUpdate(dt);
    });
  }

  registerSystem(system: { update(dt: number): void }): void {
    this.systems.push(system);
  }
}
```

### 3.7 Rendering Pipeline Flow

```
Frame N:
  1. Ticker fires (requestAnimationFrame)
  2. GameLoop.update(deltaTime)
     +-- DayNightSystem.update(dt)     -> updates background tint/gradient
     +-- ParticleSystem.update(dt)     -> moves particles, spawns/kills
     +-- AnimationSystem.update(dt)    -> advances tweens, sprite animations
     +-- PlantSystem.update(dt)        -> checks growth timers
  3. SceneManager.currentScene.onUpdate(dt)
     +-- Updates plant sprite positions
     +-- Updates UI text values
  4. PixiJS Scene Graph Traversal
     +-- Calculates world transforms
     +-- Culls off-screen objects
  5. WebGL Batch Rendering
     +-- Groups sprites by texture atlas
     +-- Issues minimal draw calls
     +-- GPU renders to canvas
```

---

## 4. Sprite Loading & Plant Stage Display Strategy

### 4.1 Asset Organization

현재 75개 개별 PNG를 **텍스처 아틀라스**로 통합하여 draw call을 최소화한다.

```
frontend/
  public/
    assets/
      plants/
        plants-atlas.png           -- 모든 75 스프라이트를 한 시트에 (640x640 이내)
        plants-atlas.json          -- TexturePacker JSON Hash format
      ui/
        ui-atlas.png               -- 버튼, 패널, 아이콘, 게이지 등
        ui-atlas.json
        9slice-panel.png           -- 9-slice용 패널 텍스처 (별도)
      fonts/
        pixel-kr.fnt               -- 한국어 비트맵 폰트 (BMFont format)
        pixel-kr.png               -- 폰트 텍스처
      particles/
        sparkle.png                -- 파티클 텍스처 (4x4 ~ 8x8)
        water-drop.png
        leaf.png
        pollen.png
      backgrounds/
        sky-gradient.png           -- 낮 하늘
        ground-tiles.png           -- 흙/잔디 타일
  src/
    assets/
      plants/                     -- 기존 75 PNG (개발 소스, 빌드시 아틀라스로 통합)
```

### 4.2 Asset Manifest & Bundle Loading

```typescript
// frontend/src/game/engine/AssetManager.ts

import { Assets } from 'pixi.js';

const ASSET_MANIFEST = {
  bundles: [
    {
      name: 'core',
      assets: [
        { alias: 'ui-atlas', src: '/assets/ui/ui-atlas.json', data: { scaleMode: 'nearest' } },
        { alias: 'pixel-font', src: '/assets/fonts/pixel-kr.fnt' },
      ],
    },
    {
      name: 'plants',
      assets: [
        { alias: 'plants-atlas', src: '/assets/plants/plants-atlas.json', data: { scaleMode: 'nearest' } },
      ],
    },
    {
      name: 'particles',
      assets: [
        { alias: 'sparkle', src: '/assets/particles/sparkle.png', data: { scaleMode: 'nearest' } },
        { alias: 'water-drop', src: '/assets/particles/water-drop.png', data: { scaleMode: 'nearest' } },
        { alias: 'leaf', src: '/assets/particles/leaf.png', data: { scaleMode: 'nearest' } },
        { alias: 'pollen', src: '/assets/particles/pollen.png', data: { scaleMode: 'nearest' } },
      ],
    },
    {
      name: 'backgrounds',
      assets: [
        { alias: 'sky-gradient', src: '/assets/backgrounds/sky-gradient.png', data: { scaleMode: 'nearest' } },
        { alias: 'ground-tiles', src: '/assets/backgrounds/ground-tiles.png', data: { scaleMode: 'nearest' } },
      ],
    },
  ],
};

export class AssetManager {
  private static initialized = false;

  static async init(): Promise<void> {
    if (this.initialized) return;
    await Assets.init({ manifest: ASSET_MANIFEST });
    this.initialized = true;
  }

  static async loadBundle(name: string, onProgress?: (p: number) => void): Promise<void> {
    await Assets.loadBundle(name, onProgress);
  }

  static async loadAll(onProgress?: (p: number) => void): Promise<void> {
    const bundles = ASSET_MANIFEST.bundles.map(b => b.name);
    await Assets.loadBundle(bundles, onProgress);
  }
}
```

### 4.3 Plant Stage Mapping (5 Sprites -> 6-7 Backend Stages)

```typescript
// frontend/src/game/utils/plantSprite.ts

import { Texture, Assets } from 'pixi.js';

/**
 * Backend defines 6-7 stages per plant:
 *   seed -> sprout -> seedling -> vegetative -> [flowering] -> [fruiting] -> mature -> harvestable
 *
 * We have 5 sprite files per plant:
 *   stage1 (seed), stage2 (sprout), stage3 (seedling), stage4 (vegetative), stage5 (mature)
 *
 * Mapping strategy: multiple backend stages share a single sprite.
 */
const STAGE_TO_SPRITE_INDEX: Record<string, number> = {
  seed:        1,
  sprout:      2,
  seedling:    3,
  vegetative:  4,
  flowering:   4,   // shares with vegetative (intermediate state)
  fruiting:    5,
  mature:      5,   // shares with fruiting
  harvestable: 5,   // shares with mature (add sparkle overlay via animation)
};

/**
 * Get the PixiJS Texture for a specific plant at a specific growth stage.
 *
 * Assumes plants-atlas.json uses frame names like: "aloe_stage1", "basil_stage3", etc.
 */
export function getPlantTexture(plantId: string, stage: string): Texture {
  const spriteIndex = STAGE_TO_SPRITE_INDEX[stage] ?? 1;
  const frameName = `${plantId}_stage${spriteIndex}`;

  // Try atlas frame first, fallback to individual texture
  const sheet = Assets.get('plants-atlas');
  if (sheet?.textures?.[frameName]) {
    return sheet.textures[frameName];
  }

  // Fallback: direct texture load (development mode)
  return Assets.get(frameName) ?? Texture.EMPTY;
}

/**
 * Determine if this stage should show special visual effects.
 */
export function getStageEffects(stage: string): {
  showSparkle: boolean;
  showFlower: boolean;
  idleSwayAmplitude: number;
} {
  return {
    showSparkle: stage === 'harvestable',
    showFlower: stage === 'flowering',
    idleSwayAmplitude: stage === 'seed' ? 0 : stage === 'sprout' ? 0.5 : 1.0,
  };
}

/**
 * All 15 plant IDs matching the asset filenames.
 */
export const PLANT_IDS = [
  'aloe', 'basil', 'cactus', 'chili', 'lavender',
  'lettuce', 'mint', 'monstera', 'orchid', 'rose',
  'rubber_plant', 'succulent', 'sunflower', 'tomato', 'tulip',
] as const;
```

### 4.4 Plant Entity

```typescript
// frontend/src/game/entities/PlantEntity.ts

import { Container, Sprite, Texture } from 'pixi.js';
import { getPlantTexture, getStageEffects } from '../utils/plantSprite';

export class PlantEntity extends Container {
  private plantSprite: Sprite;
  private potSprite: Sprite;
  private sparkleEmitter: any | null = null;

  public plantId: string;
  public currentStage: string;

  constructor(plantId: string, stage: string) {
    super();
    this.plantId = plantId;
    this.currentStage = stage;

    // Pot (below plant)
    this.potSprite = new Sprite(Texture.from('pot'));  // from ui-atlas
    this.potSprite.anchor.set(0.5, 0);
    this.potSprite.y = 0;
    this.addChild(this.potSprite);

    // Plant sprite (above pot, scaled up from 64x64 to display size)
    const texture = getPlantTexture(plantId, stage);
    this.plantSprite = new Sprite(texture);
    this.plantSprite.anchor.set(0.5, 1);      // bottom-center anchor
    this.plantSprite.y = 0;                    // sits on top of pot
    this.plantSprite.scale.set(2);             // 64px -> 128px display (pixel-perfect 2x)
    this.addChild(this.plantSprite);

    this.applyStageEffects();
  }

  /**
   * Transition to a new growth stage with crossfade animation.
   */
  async transitionToStage(newStage: string): Promise<void> {
    if (newStage === this.currentStage) return;

    const oldTexture = this.plantSprite.texture;
    const newTexture = getPlantTexture(this.plantId, newStage);

    // Only animate if texture actually changes
    if (oldTexture !== newTexture) {
      // Create temporary sprite for crossfade
      const oldSprite = new Sprite(oldTexture);
      oldSprite.anchor.copyFrom(this.plantSprite.anchor);
      oldSprite.position.copyFrom(this.plantSprite.position);
      oldSprite.scale.copyFrom(this.plantSprite.scale);
      this.addChild(oldSprite);

      // Swap texture on main sprite
      this.plantSprite.texture = newTexture;
      this.plantSprite.alpha = 0;

      // GSAP crossfade (400ms)
      const gsap = (await import('gsap')).default;
      await Promise.all([
        gsap.to(oldSprite, { alpha: 0, duration: 0.4, ease: 'power2.inOut' }),
        gsap.to(this.plantSprite, { alpha: 1, duration: 0.4, ease: 'power2.inOut' }),
      ]);

      this.removeChild(oldSprite);
      oldSprite.destroy();
    }

    this.currentStage = newStage;
    this.applyStageEffects();
  }

  private applyStageEffects(): void {
    const effects = getStageEffects(this.currentStage);

    // Sparkle effect for harvestable
    if (effects.showSparkle && !this.sparkleEmitter) {
      // ParticleEmitter setup (see Section 5)
    } else if (!effects.showSparkle && this.sparkleEmitter) {
      this.sparkleEmitter = null;
    }
  }
}
```

### 4.5 Loading Screen

```typescript
// frontend/src/game/scenes/LoadingScene.ts

import { Container, Graphics, BitmapText } from 'pixi.js';
import { AssetManager } from '../engine/AssetManager';

export class LoadingScene implements GameScene {
  name = 'loading';
  container = new Container();

  private progressBar: Graphics;
  private progressText: BitmapText;

  async onEnter(): Promise<void> {
    const GAME_WIDTH = 320;
    const GAME_HEIGHT = 480;

    // Background
    const bg = new Graphics().rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill(0x1a1a2e);
    this.container.addChild(bg);

    // "Plantii" title text (temporary Text until BitmapFont loads)
    // ... (use PixiJS Text for loading screen only)

    // Progress bar track
    const track = new Graphics()
      .rect(40, GAME_HEIGHT / 2, GAME_WIDTH - 80, 8)
      .fill(0x2a2a3e);
    this.container.addChild(track);

    // Progress bar fill
    this.progressBar = new Graphics();
    this.container.addChild(this.progressBar);

    // Load all asset bundles
    await AssetManager.init();
    await AssetManager.loadAll((progress) => {
      this.updateProgress(progress);
    });

    // Transition to garden scene
    await SceneManager.switchTo('garden');
  }

  private updateProgress(progress: number): void {
    const GAME_WIDTH = 320;
    const GAME_HEIGHT = 480;
    const barWidth = (GAME_WIDTH - 80) * progress;

    this.progressBar.clear();
    this.progressBar
      .rect(40, GAME_HEIGHT / 2, barWidth, 8)
      .fill(0x4caf50);
  }

  async onExit(): Promise<void> {
    this.container.removeChildren();
  }

  onUpdate(dt: number): void {}
  onResize(w: number, h: number): void {}
}
```

### 4.6 Atlas Generation (Build Pipeline)

개발 시에는 개별 PNG를 직접 로드하고, 프로덕션 빌드에서는 TexturePacker로 아틀라스를 생성한다.

```jsonc
// package.json에 추가할 스크립트
{
  "scripts": {
    "atlas:plants": "npx free-tex-packer-cli --input src/assets/plants --output public/assets/plants --name plants-atlas --format pixijs --scale 1 --padding 1 --max-width 1024 --max-height 1024",
    "atlas:ui": "npx free-tex-packer-cli --input src/assets/ui --output public/assets/ui --name ui-atlas --format pixijs --scale 1 --padding 1",
    "atlas": "npm run atlas:plants && npm run atlas:ui",
    "prebuild": "npm run atlas"
  }
}
```

**Atlas Layout (plants-atlas.png):**

```
+------------------------------------------------------------------+
| aloe_s1 | aloe_s2 | aloe_s3 | aloe_s4 | aloe_s5 | basil_s1 |...|
| 64x64   | 64x64   | 64x64   | 64x64   | 64x64   | 64x64    |...|
+------------------------------------------------------------------+
| ...     | ...     | ...     | ...     | ...     | ...      |...|
+------------------------------------------------------------------+
|  (15 plants x 5 stages = 75 frames, ~640x640 total)              |
+------------------------------------------------------------------+
```

- **Total atlas size**: ~640x640px (fits in a single 1024x1024 texture)
- **Draw calls**: 1 (all plant sprites batched)
- **Memory**: ~1.6MB uncompressed RGBA

---

## 5. Animation System

### 5.1 Animation Architecture Overview

```
AnimationSystem
  +-- IdleSwaySystem          -- 식물 좌우 미세 흔들림 (Ticker 기반)
  +-- StageTransitionSystem   -- 성장 단계 전환 크로스페이드 (GSAP)
  +-- ParticleEffectSystem    -- 물/빛/수확 이펙트 (@pixi/particle-emitter)
  +-- WeatherParticleSystem   -- 비/눈/꽃잎 (ParticleContainer)
  +-- DayNightCycleSystem     -- 낮밤 색조 변환 (Ticker + ColorMatrixFilter)
  +-- UIAnimationSystem       -- 패널 슬라이드/팝업 (GSAP Timeline)
```

### 5.2 Idle Sway Animation (Plant Breathing)

모든 살아있는 식물에 적용되는 미세한 흔들림. CSS가 아닌 PixiJS Ticker에서 처리한다.

```typescript
// frontend/src/game/systems/IdleSwaySystem.ts

export class IdleSwaySystem {
  private plants: PlantEntity[] = [];
  private elapsed = 0;

  register(plant: PlantEntity): void {
    this.plants.push(plant);
  }

  unregister(plant: PlantEntity): void {
    this.plants = this.plants.filter(p => p !== plant);
  }

  update(dt: number): void {
    this.elapsed += dt * 0.02;  // Slow accumulator

    for (const plant of this.plants) {
      const effects = getStageEffects(plant.currentStage);
      if (effects.idleSwayAmplitude === 0) continue;

      // Sinusoidal rotation: -2deg to +2deg
      const amplitude = effects.idleSwayAmplitude * 0.035;  // ~2 degrees in radians
      const frequency = 0.8;  // Slow, organic sway
      const phase = plant.position.x * 0.1;  // Different phase per plant position

      plant.plantSprite.rotation = Math.sin(this.elapsed * frequency + phase) * amplitude;

      // Subtle vertical breathing: scale 1.0 to 1.02
      const breathScale = 1.0 + Math.sin(this.elapsed * 1.2 + phase) * 0.01;
      plant.plantSprite.scale.y = 2 * breathScale;  // Base scale is 2x
    }
  }
}
```

### 5.3 Particle Effects

#### 5.3.1 Watering Effect (User Action)

```typescript
// frontend/src/game/effects/WaterEffect.ts

import { Emitter } from '@pixi/particle-emitter';

export function createWaterEffect(parent: Container, x: number, y: number): Emitter {
  return new Emitter(parent, {
    lifetime: { min: 0.3, max: 0.8 },
    frequency: 0.02,
    emitterLifetime: 1.0,        // Auto-stop after 1 second
    maxParticles: 30,
    pos: { x, y },
    behaviors: [
      {
        type: 'alpha',
        config: {
          alpha: {
            list: [
              { value: 0.8, time: 0 },
              { value: 0, time: 1 },
            ],
          },
        },
      },
      {
        type: 'scale',
        config: {
          scale: {
            list: [
              { value: 0.3, time: 0 },
              { value: 0.1, time: 1 },
            ],
          },
        },
      },
      {
        type: 'color',
        config: {
          color: {
            list: [
              { value: '4fc3f7', time: 0 },   // Light blue
              { value: '0288d1', time: 1 },    // Dark blue
            ],
          },
        },
      },
      {
        type: 'moveSpeed',
        config: {
          speed: {
            list: [
              { value: 80, time: 0 },
              { value: 20, time: 1 },
            ],
          },
        },
      },
      {
        type: 'rotationStatic',
        config: { min: 70, max: 110 },    // Downward spray
      },
      {
        type: 'textureSingle',
        config: { texture: 'water-drop' },
      },
      {
        type: 'spawnShape',
        config: {
          type: 'rect',
          data: { x: -20, y: -10, w: 40, h: 5 },
        },
      },
    ],
  });
}
```

#### 5.3.2 Harvest Sparkle Effect

```typescript
// frontend/src/game/effects/HarvestSparkle.ts

export function createHarvestSparkle(parent: Container, x: number, y: number): Emitter {
  return new Emitter(parent, {
    lifetime: { min: 0.5, max: 1.5 },
    frequency: 0.05,
    emitterLifetime: -1,           // Continuous until destroyed
    maxParticles: 20,
    pos: { x, y: y - 40 },        // Above the plant
    behaviors: [
      {
        type: 'alpha',
        config: {
          alpha: {
            list: [
              { value: 0, time: 0 },
              { value: 1, time: 0.3 },
              { value: 0, time: 1 },
            ],
          },
        },
      },
      {
        type: 'scale',
        config: {
          scale: {
            list: [
              { value: 0.5, time: 0 },
              { value: 0.2, time: 1 },
            ],
          },
          minMult: 0.5,
        },
      },
      {
        type: 'color',
        config: {
          color: {
            list: [
              { value: 'ffeb3b', time: 0 },   // Gold
              { value: 'fff9c4', time: 1 },    // Light gold
            ],
          },
        },
      },
      {
        type: 'moveSpeed',
        config: {
          speed: {
            list: [
              { value: 30, time: 0 },
              { value: 5, time: 1 },
            ],
          },
        },
      },
      {
        type: 'rotationStatic',
        config: { min: 0, max: 360 },
      },
      {
        type: 'textureSingle',
        config: { texture: 'sparkle' },
      },
      {
        type: 'spawnShape',
        config: {
          type: 'torus',
          data: { x: 0, y: 0, radius: 30, innerRadius: 10 },
        },
      },
    ],
  });
}
```

#### 5.3.3 Weather Particles (Rain/Snow - ParticleContainer for Performance)

```typescript
// frontend/src/game/systems/WeatherSystem.ts

import { ParticleContainer, Particle, Texture } from 'pixi.js';

export class WeatherSystem {
  private container: ParticleContainer;
  private particles: Particle[] = [];
  private weatherType: 'clear' | 'rain' | 'snow' = 'clear';

  private readonly GAME_WIDTH = 320;
  private readonly GAME_HEIGHT = 480;
  private readonly MAX_RAIN = 200;
  private readonly MAX_SNOW = 100;

  constructor(parent: Container) {
    this.container = new ParticleContainer({
      dynamicProperties: {
        position: true,
        scale: false,
        rotation: false,
        color: false,
      },
    });
    parent.addChild(this.container);
  }

  setWeather(type: 'clear' | 'rain' | 'snow'): void {
    if (this.weatherType === type) return;
    this.weatherType = type;

    // Clear existing particles
    this.container.removeChildren();
    this.particles = [];

    if (type === 'clear') return;

    // Spawn particles
    const count = type === 'rain' ? this.MAX_RAIN : this.MAX_SNOW;
    const texture = Texture.from(type === 'rain' ? 'water-drop' : 'sparkle');

    for (let i = 0; i < count; i++) {
      const p = new Particle({
        texture,
        x: Math.random() * this.GAME_WIDTH,
        y: Math.random() * this.GAME_HEIGHT,
      });
      this.container.addParticle(p);
      this.particles.push(p);
    }
  }

  update(dt: number): void {
    if (this.weatherType === 'clear') return;

    for (const p of this.particles) {
      if (this.weatherType === 'rain') {
        p.y += 3 * dt;           // Fast downward
        p.x += 0.5 * dt;        // Slight wind drift
      } else {
        p.y += 0.5 * dt;        // Slow float down
        p.x += Math.sin(p.y * 0.02) * 0.3 * dt;  // Gentle horizontal drift
      }

      // Wrap around
      if (p.y > this.GAME_HEIGHT) {
        p.y = -5;
        p.x = Math.random() * this.GAME_WIDTH;
      }
    }
  }
}
```

### 5.4 Day/Night Cycle System

게임 내 시간에 따라 배경색과 조명이 변화하는 낮밤 사이클.

```typescript
// frontend/src/game/systems/DayNightSystem.ts

import { Container, Graphics, ColorMatrixFilter } from 'pixi.js';

interface TimeOfDay {
  name: string;
  hour: number;
  skyColor: number;
  ambientTint: number;
  lightIntensity: number;
}

const TIME_PHASES: TimeOfDay[] = [
  { name: 'dawn',      hour: 6,  skyColor: 0xffb74d, ambientTint: 0xffe0b2, lightIntensity: 0.6 },
  { name: 'morning',   hour: 8,  skyColor: 0x87ceeb, ambientTint: 0xffffff, lightIntensity: 0.9 },
  { name: 'noon',      hour: 12, skyColor: 0x64b5f6, ambientTint: 0xffffff, lightIntensity: 1.0 },
  { name: 'afternoon', hour: 16, skyColor: 0x90caf9, ambientTint: 0xfff8e1, lightIntensity: 0.85 },
  { name: 'sunset',    hour: 18, skyColor: 0xff7043, ambientTint: 0xffcc80, lightIntensity: 0.5 },
  { name: 'dusk',      hour: 20, skyColor: 0x3f51b5, ambientTint: 0x9fa8da, lightIntensity: 0.3 },
  { name: 'night',     hour: 22, skyColor: 0x1a1a2e, ambientTint: 0x7986cb, lightIntensity: 0.15 },
  { name: 'midnight',  hour: 2,  skyColor: 0x0d0d1a, ambientTint: 0x5c6bc0, lightIntensity: 0.1 },
];

export class DayNightSystem {
  private backgroundLayer: Container;
  private gameLayer: Container;
  private skyGradient: Graphics;
  private colorFilter: ColorMatrixFilter;

  // Game time: 1 real minute = 1 game hour (24-min full cycle)
  private gameHour = 8;  // Start at morning
  private readonly REAL_SECONDS_PER_GAME_HOUR = 60;

  constructor(backgroundLayer: Container, gameLayer: Container) {
    this.backgroundLayer = backgroundLayer;
    this.gameLayer = gameLayer;

    // Sky background
    this.skyGradient = new Graphics();
    this.backgroundLayer.addChildAt(this.skyGradient, 0);

    // Color filter for ambient lighting on game layer
    this.colorFilter = new ColorMatrixFilter();
    this.gameLayer.filters = [this.colorFilter];

    this.updateVisuals();
  }

  update(dt: number): void {
    // Advance game time
    const realSecondsElapsed = dt / 60;  // dt is in frames (60fps = 1 second)
    this.gameHour += realSecondsElapsed / this.REAL_SECONDS_PER_GAME_HOUR;
    if (this.gameHour >= 24) this.gameHour -= 24;

    this.updateVisuals();
  }

  private updateVisuals(): void {
    // Find surrounding time phases for interpolation
    const { prev, next, t } = this.findPhases(this.gameHour);

    // Interpolate sky color
    const skyColor = this.lerpColor(prev.skyColor, next.skyColor, t);

    // Draw sky
    this.skyGradient.clear();
    this.skyGradient.rect(0, 0, 320, 480).fill(skyColor);

    // Apply ambient tint via brightness/tint
    const intensity = prev.lightIntensity + (next.lightIntensity - prev.lightIntensity) * t;
    this.colorFilter.brightness(intensity, false);
  }

  private findPhases(hour: number): { prev: TimeOfDay; next: TimeOfDay; t: number } {
    // Find the two phases surrounding the current hour
    let prev = TIME_PHASES[TIME_PHASES.length - 1];
    let next = TIME_PHASES[0];

    for (let i = 0; i < TIME_PHASES.length; i++) {
      if (hour >= TIME_PHASES[i].hour) {
        prev = TIME_PHASES[i];
        next = TIME_PHASES[(i + 1) % TIME_PHASES.length];
      }
    }

    // Calculate interpolation t
    let range = next.hour - prev.hour;
    if (range <= 0) range += 24;
    let elapsed = hour - prev.hour;
    if (elapsed < 0) elapsed += 24;

    return { prev, next, t: elapsed / range };
  }

  private lerpColor(a: number, b: number, t: number): number {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return (r << 16) | (g << 8) | bl;
  }

  /** Get current game hour (for UI display) */
  getGameHour(): number {
    return this.gameHour;
  }

  /** Get time-of-day name */
  getTimeOfDayName(): string {
    const { prev } = this.findPhases(this.gameHour);
    return prev.name;
  }
}
```

### 5.5 Sunlight Glow Effect

```typescript
// frontend/src/game/effects/SunlightEffect.ts

import gsap from 'gsap';
import { Graphics, BlurFilter } from 'pixi.js';

export function playSunlightEffect(
  parent: Container,
  x: number,
  y: number
): Promise<void> {
  // Radial glow circle
  const glow = new Graphics()
    .circle(0, 0, 40)
    .fill({ color: 0xffeb3b, alpha: 0.3 });

  glow.position.set(x, y - 30);
  glow.filters = [new BlurFilter({ strength: 4 })];
  glow.alpha = 0;
  parent.addChild(glow);

  return new Promise((resolve) => {
    gsap.timeline({ onComplete: () => { parent.removeChild(glow); glow.destroy(); resolve(); } })
      .to(glow, { alpha: 0.6, duration: 0.3, ease: 'power2.out' })
      .to(glow.scale, { x: 1.5, y: 1.5, duration: 0.5, ease: 'power2.out' }, 0)
      .to(glow, { alpha: 0, duration: 0.4, ease: 'power2.in' }, 0.4);
  });
}
```

### 5.6 Wilting Animation (Low Health)

```typescript
// frontend/src/game/effects/WiltEffect.ts

export function applyWiltState(plant: PlantEntity, health: number): void {
  // Desaturation based on health (0-100)
  const saturation = health / 100;  // 1.0 = full color, 0.0 = grayscale

  if (health < 40) {
    // Apply desaturation filter
    const colorMatrix = new ColorMatrixFilter();
    colorMatrix.desaturate();
    // Blend: partially desaturated
    plant.plantSprite.filters = [colorMatrix];

    // Droop: lean to one side
    plant.plantSprite.rotation = -0.15;  // ~8.5 degrees droop
    plant.plantSprite.skew.x = 0.05;
  } else {
    // Remove wilt effects
    plant.plantSprite.filters = [];
    // Rotation managed by IdleSwaySystem
  }
}
```

---

## 6. Kairosoft-Style Pixel UI Implementation

### 6.1 Design Principles

| Principle | Implementation |
|-----------|---------------|
| Pixel-perfect rendering | `antialias: false`, `roundPixels: true`, `imageRendering: pixelated` |
| Low logical resolution | 320x480 canvas, scaled up to screen via CSS |
| Bitmap font only | No TrueType rendering in game canvas |
| 9-slice panels | `NineSliceSprite` for all panels/dialogs |
| Limited color palette | Centralized `PALETTE` constant |
| Immediate feedback | 1px button press offset, tint change |
| Icon-driven info | Small dot icons for resources, status |

### 6.2 Color Palette

```typescript
// frontend/src/game/ui/theme.ts

export const PALETTE = {
  // Background
  bg_dark:      0x1a1a2e,
  bg_medium:    0x2a2a3e,
  bg_light:     0x3a3a4e,

  // Primary (Green - Plantii theme)
  primary:      0x4caf50,
  primary_light:0x81c784,
  primary_dark: 0x388e3c,

  // Accent (Golden)
  accent:       0xffc107,
  accent_light: 0xffd54f,
  accent_dark:  0xf9a825,

  // Text
  text_white:   0xffffff,
  text_light:   0xcccccc,
  text_dark:    0x333333,

  // Status
  hp_green:     0x4caf50,
  hp_yellow:    0xffc107,
  hp_red:       0xf44336,
  water_blue:   0x42a5f5,
  xp_purple:    0xab47bc,

  // Nature
  sky_day:      0x87ceeb,
  sky_night:    0x1a1a2e,
  ground_brown: 0x795548,
  grass_green:  0x8bc34a,

  // UI Chrome
  panel_bg:     0xf5f0e1,     // Warm paper-like background
  panel_border: 0x8d6e63,     // Brown border
  button_face:  0x4caf50,
  button_press: 0x388e3c,
} as const;
```

### 6.3 Pixel UI Components

#### 6.3.1 PixelButton

```typescript
// frontend/src/game/ui/components/PixelButton.ts

import { Container, NineSliceSprite, BitmapText, Texture } from 'pixi.js';
import { PALETTE } from '../theme';

export class PixelButton extends Container {
  private bg: NineSliceSprite;
  private label: BitmapText;
  private _onTap: (() => void) | null = null;

  constructor(text: string, width = 80, height = 20) {
    super();

    // 9-slice background
    this.bg = new NineSliceSprite({
      texture: Texture.from('btn-normal'),   // from ui-atlas
      leftWidth: 4,
      topHeight: 4,
      rightWidth: 4,
      bottomHeight: 4,
    });
    this.bg.width = width;
    this.bg.height = height;
    this.addChild(this.bg);

    // Label
    this.label = new BitmapText({
      text,
      style: { fontFamily: 'PixelFont', fontSize: 8 },
    });
    this.label.anchor.set(0.5);
    this.label.position.set(width / 2, height / 2);
    this.addChild(this.label);

    // Interaction
    this.eventMode = 'static';
    this.cursor = 'pointer';

    this.on('pointerdown', () => {
      this.bg.texture = Texture.from('btn-pressed');
      this.label.y += 1;  // Kairosoft-style 1px press offset
    });

    this.on('pointerup', () => {
      this.bg.texture = Texture.from('btn-normal');
      this.label.y -= 1;
      this._onTap?.();
    });

    this.on('pointerupoutside', () => {
      this.bg.texture = Texture.from('btn-normal');
      this.label.y = height / 2;
    });
  }

  onTap(callback: () => void): this {
    this._onTap = callback;
    return this;
  }
}
```

#### 6.3.2 PixelPanel (9-Slice Dialog)

```typescript
// frontend/src/game/ui/components/PixelPanel.ts

import { Container, NineSliceSprite, BitmapText, Graphics, Texture } from 'pixi.js';
import { PALETTE } from '../theme';

export class PixelPanel extends Container {
  private bg: NineSliceSprite;
  private titleBar: Graphics;
  private titleText: BitmapText;
  protected contentArea: Container;

  constructor(options: {
    width: number;
    height: number;
    title?: string;
  }) {
    super();

    const { width, height, title } = options;

    // 9-slice panel background
    this.bg = new NineSliceSprite({
      texture: Texture.from('panel-bg'),
      leftWidth: 6,
      topHeight: 6,
      rightWidth: 6,
      bottomHeight: 6,
    });
    this.bg.width = width;
    this.bg.height = height;
    this.addChild(this.bg);

    // Title bar
    if (title) {
      this.titleBar = new Graphics()
        .rect(2, 2, width - 4, 14)
        .fill(PALETTE.primary);
      this.addChild(this.titleBar);

      this.titleText = new BitmapText({
        text: title,
        style: { fontFamily: 'PixelFont', fontSize: 8 },
      });
      this.titleText.tint = PALETTE.text_white;
      this.titleText.position.set(6, 5);
      this.addChild(this.titleText);
    }

    // Content area
    this.contentArea = new Container();
    this.contentArea.position.set(4, title ? 18 : 4);
    this.addChild(this.contentArea);
  }
}
```

#### 6.3.3 PixelGauge (Health/Growth Bar)

```typescript
// frontend/src/game/ui/components/PixelGauge.ts

import { Container, Graphics, BitmapText } from 'pixi.js';
import { PALETTE } from '../theme';

export class PixelGauge extends Container {
  private track: Graphics;
  private fill: Graphics;
  private label: BitmapText;
  private valueText: BitmapText;

  private _value = 100;
  private _maxWidth: number;

  constructor(options: {
    label: string;
    width: number;
    color: number;
  }) {
    super();

    this._maxWidth = options.width;

    // Label
    this.label = new BitmapText({
      text: options.label,
      style: { fontFamily: 'PixelFont', fontSize: 8 },
    });
    this.label.tint = PALETTE.text_dark;
    this.addChild(this.label);

    // Track (background)
    this.track = new Graphics()
      .rect(0, 10, options.width, 6)
      .fill(0xdddddd);
    this.addChild(this.track);

    // Fill
    this.fill = new Graphics()
      .rect(0, 10, options.width, 6)
      .fill(options.color);
    this.addChild(this.fill);

    // Value text
    this.valueText = new BitmapText({
      text: '100%',
      style: { fontFamily: 'PixelFont', fontSize: 8 },
    });
    this.valueText.anchor.set(1, 0);
    this.valueText.position.set(options.width, 0);
    this.valueText.tint = PALETTE.text_dark;
    this.addChild(this.valueText);
  }

  setValue(value: number, color?: number): void {
    this._value = Math.max(0, Math.min(100, value));
    const fillWidth = (this._value / 100) * this._maxWidth;

    this.fill.clear();
    this.fill.rect(0, 10, fillWidth, 6).fill(color ?? PALETTE.hp_green);
    this.valueText.text = `${Math.round(this._value)}%`;
  }
}
```

### 6.4 Game HUD Layout

```typescript
// frontend/src/game/ui/screens/GameHUD.ts

import { Container, BitmapText, Sprite, Texture } from 'pixi.js';
import { PixelPanel } from '../components/PixelPanel';
import { PixelButton } from '../components/PixelButton';
import { PixelGauge } from '../components/PixelGauge';
import { PALETTE } from '../theme';

const GAME_WIDTH = 320;
const GAME_HEIGHT = 480;

export class GameHUD extends Container {
  // Top bar: coins, level, time
  private topBar: PixelPanel;
  private coinsText: BitmapText;
  private levelText: BitmapText;
  private timeText: BitmapText;

  // Status panel (below plant)
  private statusPanel: PixelPanel;
  private healthGauge: PixelGauge;
  private growthGauge: PixelGauge;
  private moistureGauge: PixelGauge;

  // Environment display
  private tempText: BitmapText;
  private humidityText: BitmapText;
  private lightText: BitmapText;

  // Action buttons
  private waterBtn: PixelButton;
  private sunBtn: PixelButton;
  private harvestBtn: PixelButton;

  // Bottom navigation
  private bottomNav: Container;

  constructor() {
    super();
    this.buildTopBar();
    this.buildStatusPanel();
    this.buildActionButtons();
    this.buildBottomNav();
  }

  private buildTopBar(): void {
    this.topBar = new PixelPanel({ width: GAME_WIDTH - 8, height: 24 });
    this.topBar.position.set(4, 4);
    this.addChild(this.topBar);

    // Coin icon + text
    const coinIcon = new Sprite(Texture.from('icon-coin'));
    coinIcon.position.set(6, 6);
    coinIcon.scale.set(1);
    this.topBar.addChild(coinIcon);

    this.coinsText = new BitmapText({
      text: '0',
      style: { fontFamily: 'PixelFont', fontSize: 8 },
    });
    this.coinsText.position.set(18, 8);
    this.topBar.addChild(this.coinsText);

    // Level
    this.levelText = new BitmapText({
      text: 'Lv.1',
      style: { fontFamily: 'PixelFont', fontSize: 8 },
    });
    this.levelText.position.set(GAME_WIDTH / 2 - 15, 8);
    this.topBar.addChild(this.levelText);

    // Time of day
    this.timeText = new BitmapText({
      text: '08:00',
      style: { fontFamily: 'PixelFont', fontSize: 8 },
    });
    this.timeText.anchor.set(1, 0);
    this.timeText.position.set(GAME_WIDTH - 14, 8);
    this.topBar.addChild(this.timeText);
  }

  private buildStatusPanel(): void {
    this.statusPanel = new PixelPanel({
      width: GAME_WIDTH - 16,
      height: 80,
      title: 'Status',
    });
    this.statusPanel.position.set(8, 300);
    this.addChild(this.statusPanel);

    this.healthGauge = new PixelGauge({ label: 'HP', width: GAME_WIDTH - 40, color: PALETTE.hp_green });
    this.healthGauge.position.set(4, 2);
    this.statusPanel.contentArea.addChild(this.healthGauge);

    this.growthGauge = new PixelGauge({ label: 'Growth', width: GAME_WIDTH - 40, color: PALETTE.primary });
    this.growthGauge.position.set(4, 22);
    this.statusPanel.contentArea.addChild(this.growthGauge);

    this.moistureGauge = new PixelGauge({ label: 'Water', width: GAME_WIDTH - 40, color: PALETTE.water_blue });
    this.moistureGauge.position.set(4, 42);
    this.statusPanel.contentArea.addChild(this.moistureGauge);
  }

  private buildActionButtons(): void {
    this.waterBtn = new PixelButton('Water', 90, 22);
    this.waterBtn.position.set(20, 395);
    this.addChild(this.waterBtn);

    this.sunBtn = new PixelButton('Sun', 90, 22);
    this.sunBtn.position.set(120, 395);
    this.addChild(this.sunBtn);

    this.harvestBtn = new PixelButton('Harvest', 90, 22);
    this.harvestBtn.position.set(210, 395);
    this.harvestBtn.visible = false;  // Only shown when harvestable
    this.addChild(this.harvestBtn);
  }

  private buildBottomNav(): void {
    this.bottomNav = new Container();
    this.bottomNav.position.set(0, GAME_HEIGHT - 28);
    this.addChild(this.bottomNav);

    // Nav background
    const navBg = new Graphics()
      .rect(0, 0, GAME_WIDTH, 28)
      .fill(PALETTE.panel_bg);
    this.bottomNav.addChild(navBg);

    // Nav items (3 tabs)
    const tabs = [
      { icon: 'icon-home', label: 'Home', x: GAME_WIDTH * 0.167 },
      { icon: 'icon-book', label: 'Catalog', x: GAME_WIDTH * 0.5 },
      { icon: 'icon-user', label: 'Profile', x: GAME_WIDTH * 0.833 },
    ];

    for (const tab of tabs) {
      const icon = new Sprite(Texture.from(tab.icon));
      icon.anchor.set(0.5);
      icon.position.set(tab.x, 10);
      icon.eventMode = 'static';
      icon.cursor = 'pointer';
      this.bottomNav.addChild(icon);

      const label = new BitmapText({
        text: tab.label,
        style: { fontFamily: 'PixelFont', fontSize: 6 },
      });
      label.anchor.set(0.5, 0);
      label.position.set(tab.x, 18);
      label.tint = PALETTE.text_dark;
      this.bottomNav.addChild(label);
    }
  }

  // Public update methods
  updateCoins(value: number): void { this.coinsText.text = value.toString(); }
  updateLevel(value: number): void { this.levelText.text = `Lv.${value}`; }
  updateTime(hour: number): void {
    const h = Math.floor(hour).toString().padStart(2, '0');
    const m = Math.floor((hour % 1) * 60).toString().padStart(2, '0');
    this.timeText.text = `${h}:${m}`;
  }
  updateHealth(value: number): void {
    const color = value >= 70 ? PALETTE.hp_green : value >= 40 ? PALETTE.hp_yellow : PALETTE.hp_red;
    this.healthGauge.setValue(value, color);
  }
  updateGrowth(value: number): void { this.growthGauge.setValue(value); }
  updateMoisture(value: number): void { this.moistureGauge.setValue(value); }
  showHarvestButton(show: boolean): void { this.harvestBtn.visible = show; }
}
```

### 6.5 Screen Layout Map (320x480)

```
+----------------------------------+  y=0
| [coin] 1234  Lv.5   08:00 [sun] |  Top Bar (24px)
+----------------------------------+  y=28
|                                  |
|          [Sky / Background]      |
|                                  |
|        +------------------+      |
|        |                  |      |
|        |    [Plant Sprite]|      |  Main Plant Display
|        |    128x128 px    |      |  (center of screen)
|        |                  |      |
|        +--[Pot Sprite]----+      |
|                                  |
+----------------------------------+  y=300
| Status                           |
| HP:   [============    ] 78%     |
| Growth:[======         ] 45%     |
| Water: [=========      ] 62%     |
+----------------------------------+  y=384
|                                  |
| [Water]  [Sun]  [Harvest]        |  Action Buttons
|                                  |
+----------------------------------+  y=424
|                                  |
| Environment: 22C | 65% | 14 DLI |  Env Info
|                                  |
+----------------------------------+  y=452
| [Home]     [Catalog]    [Profile]|  Bottom Nav (28px)
+----------------------------------+  y=480
```

---

## 7. PWA Manifest & Mobile Install Setup

### 7.1 New manifest.json

```jsonc
// frontend/public/manifest.json (NEW - replace any existing)
{
  "name": "Plantii - Plant Tycoon",
  "short_name": "Plantii",
  "description": "Grow your dream garden in this pixel art plant simulation game",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1a1a2e",
  "background_color": "#1a1a2e",
  "categories": ["games", "entertainment"],
  "lang": "ko",
  "dir": "ltr",
  "icons": [
    { "src": "/icons/icon-72x72.png",   "sizes": "72x72",   "type": "image/png" },
    { "src": "/icons/icon-96x96.png",   "sizes": "96x96",   "type": "image/png" },
    { "src": "/icons/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-192x192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-maskable-512x512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    {
      "src": "/screenshots/gameplay-portrait.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Plant growing gameplay"
    }
  ],
  "prefer_related_applications": false,
  "display_override": ["window-controls-overlay", "standalone"]
}
```

### 7.2 Enhanced index.html

```html
<!-- frontend/index.html - head section additions -->

<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme & viewport -->
<meta name="theme-color" content="#1a1a2e">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">

<!-- iOS PWA support -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Plantii">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png">

<!-- iOS splash screens (key sizes) -->
<link rel="apple-touch-startup-image"
      media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
      href="/splash/splash-1170x2532.png">
<link rel="apple-touch-startup-image"
      media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)"
      href="/splash/splash-1179x2556.png">

<!-- Prevent text selection and zoom in game -->
<style>
  * { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
  body { overscroll-behavior: none; }
</style>
```

### 7.3 Enhanced Service Worker

```typescript
// frontend/public/service-worker.js (REWRITE)

const CACHE_VERSION = 'plantii-v2';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  // JS/CSS bundles (Vite fingerprinted - update on deploy)
];

const ASSET_CACHE = 'plantii-assets-v1';
const ASSET_PATTERNS = [
  '/assets/',
  '/icons/',
  '/fonts/',
];

const API_CACHE = 'plantii-api-v1';

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION && k !== ASSET_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: strategy per URL pattern
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Game assets: Cache-First (sprites, fonts, audio are immutable)
  if (ASSET_PATTERNS.some(p => url.pathname.startsWith(p))) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
        })
      )
    );
    return;
  }

  // API calls: Network-First with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache GET responses for offline
          if (event.request.method === 'GET' && response.ok) {
            caches.open(API_CACHE).then(cache =>
              cache.put(event.request, response.clone())
            );
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // App shell: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request).then(response => {
        if (response.ok) {
          caches.open(CACHE_VERSION).then(cache =>
            cache.put(event.request, response.clone())
          );
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
```

### 7.4 Landscape Lock Overlay

iOS doesn't support `orientation` lock. Show a CSS overlay prompting rotation:

```typescript
// frontend/src/game/ui/LandscapeBlocker.ts

export function setupLandscapeBlocker(): void {
  const blocker = document.createElement('div');
  blocker.id = 'landscape-blocker';
  blocker.innerHTML = `
    <div style="
      position: fixed; inset: 0; z-index: 99999;
      background: #1a1a2e; color: white;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      font-family: monospace; font-size: 16px;
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">📱</div>
      <p>Please rotate your device to portrait mode</p>
    </div>
  `;
  blocker.style.display = 'none';
  document.body.appendChild(blocker);

  const check = () => {
    blocker.style.display = window.innerWidth > window.innerHeight ? 'block' : 'none';
  };

  window.addEventListener('resize', check);
  check();
}
```

---

## 8. Migration Path from Tailwind UI

### 8.1 Migration Strategy: Incremental, Not Big-Bang

**Phase approach**: 기존 React + Tailwind 페이지를 유지하면서, 게임 캔버스를 별도 라우트에 먼저 구현하고, 검증 후 점진적으로 대체한다.

```
Phase A (Week 1-2): Side-by-Side
  - 기존 Dashboard.tsx, Collection.tsx 유지
  - 새 /game 라우트에 GameShell.tsx + PixiJS 캔버스 추가
  - PixiJS 렌더링 기본 동작 검증

Phase B (Week 3-4): Feature Parity
  - GameShell에 식물 표시, 상태바, 버튼 기능 구현
  - 기존 API 서비스(plant.service.ts) 재사용
  - 애니메이션 + 파티클 시스템 통합

Phase C (Week 5-6): Switch Over
  - / 라우트를 GameShell로 교체
  - 기존 Dashboard.tsx를 fallback/legacy로 보관
  - Collection.tsx -> PixiJS catalog scene으로 전환

Phase D (Week 7-8): Cleanup
  - 사용하지 않는 Tailwind 컴포넌트 제거
  - Tailwind CSS 자체는 Login/Register/Profile에서 계속 사용
  - 최종 성능 최적화
```

### 8.2 Route Changes

```typescript
// frontend/src/App.tsx (Migration Phase A)

import GameShell from './components/GameShell';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes - KEEP Tailwind */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/" element={
            <PrivateRoute>
              <GameShell scene="garden" />       {/* NEW: PixiJS canvas */}
            </PrivateRoute>
          } />
          <Route path="/collection" element={
            <PrivateRoute>
              <GameShell scene="collection" />   {/* NEW: PixiJS canvas */}
            </PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />                        {/* KEEP: Tailwind */}
            </PrivateRoute>
          } />

          {/* Legacy fallback during migration */}
          <Route path="/legacy" element={
            <PrivateRoute>
              <Layout><Dashboard /></Layout>
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
```

### 8.3 Component Migration Map

| Tailwind Component | PixiJS Replacement | Migration Phase |
|-------------------|--------------------|-----------------|
| `Dashboard.tsx` (emoji plant display) | `GardenScene` + `PlantEntity` | Phase B |
| `Dashboard.tsx` (ProgressBar x3) | `PixelGauge` x3 in `GameHUD` | Phase B |
| `Dashboard.tsx` (action buttons) | `PixelButton` x3 in `GameHUD` | Phase B |
| `Dashboard.tsx` (user info bar) | `GameHUD.topBar` | Phase B |
| `Dashboard.tsx` (environment grid) | `GameHUD` env text | Phase B |
| `Collection.tsx` (plant cards) | `CatalogScene` (PixiJS scroll list) | Phase C |
| `Collection.tsx` (category groups) | `CatalogScene` tabs | Phase C |
| `Layout.tsx` (bottom nav) | `GameHUD.bottomNav` | Phase B |
| `Button.tsx` | `PixelButton` | Phase B |
| `ProgressBar.tsx` | `PixelGauge` | Phase B |
| `Login.tsx` | **KEEP** (Tailwind) | N/A |
| `Register.tsx` | **KEEP** (Tailwind) | N/A |
| `Profile.tsx` | **KEEP** (Tailwind) | N/A |

### 8.4 Data Flow Bridge (React <-> PixiJS)

```typescript
// frontend/src/hooks/useGameBridge.ts

import { useEffect, useRef, useCallback } from 'react';
import { plantService, UserPlant } from '../services/plant.service';
import { useAuth } from '../contexts/AuthContext';

/**
 * Bridge hook: React state -> PixiJS game canvas
 * Manages API calls and passes data to game engine.
 */
export function useGameBridge() {
  const { user } = useAuth();
  const gameRef = useRef<Game | null>(null);

  // Load plant data from API and push to game
  const refreshPlantData = useCallback(async () => {
    try {
      const plants = await plantService.getUserPlants();
      if (gameRef.current && plants.length > 0) {
        gameRef.current.updatePlantState(plants[0]);
      }
    } catch (e) {
      console.error('Failed to load plant data:', e);
    }
  }, []);

  // Action handlers (called from PixiJS button taps)
  const handleWater = useCallback(async (plantId: string) => {
    const result = await plantService.waterPlant(plantId);
    await refreshPlantData();
    return result;
  }, [refreshPlantData]);

  const handleSunlight = useCallback(async (plantId: string, dli: number) => {
    const result = await plantService.adjustEnvironment(plantId, { light_dli: dli });
    await refreshPlantData();
    return result;
  }, [refreshPlantData]);

  const handleHarvest = useCallback(async (plantId: string) => {
    const result = await plantService.harvestPlant(plantId);
    await refreshPlantData();
    return result;
  }, [refreshPlantData]);

  return {
    user,
    gameRef,
    refreshPlantData,
    handleWater,
    handleSunlight,
    handleHarvest,
  };
}
```

### 8.5 New Dependencies

```jsonc
// package.json additions
{
  "dependencies": {
    // ... existing ...
    "pixi.js": "^8.x",                    // Core rendering engine
    "@pixi/react": "^8.x",                // React integration (optional)
    "gsap": "^3.12",                       // UI/tween animation
    "@pixi/particle-emitter": "^5.x",      // Effect particles
    "@pixi/sound": "^6.x"                  // Audio (future)
  },
  "devDependencies": {
    // ... existing ...
    "free-tex-packer-cli": "^0.6",         // Atlas generation
    "vite-plugin-pwa": "^0.20"             // PWA build integration (optional)
  }
}
```

### 8.6 Tailwind Coexistence

Tailwind CSS는 제거하지 않는다. Login, Register, Profile 페이지에서 계속 사용한다.
게임 캔버스(`<canvas>`)에는 Tailwind가 적용되지 않으므로 충돌이 없다.

```
Tailwind CSS scope:
  - Login.tsx       (DOM-based form)
  - Register.tsx    (DOM-based form)
  - Profile.tsx     (DOM-based settings)

PixiJS Canvas scope:
  - GardenScene     (WebGL canvas)
  - CatalogScene    (WebGL canvas)
  - GameHUD         (WebGL canvas)

No overlap. Both can coexist.
```

---

## 9. Implementation Phases & Timeline

### Phase 1: Foundation (Week 1-2)

| Task | Files | Priority |
|------|-------|----------|
| Install PixiJS v8 + GSAP | `package.json` | P0 |
| Create `Game.ts` bootstrap | `src/game/Game.ts` | P0 |
| Create `GameShell.tsx` React wrapper | `src/components/GameShell.tsx` | P0 |
| Create `AssetManager.ts` | `src/game/engine/AssetManager.ts` | P0 |
| Create `SceneManager.ts` | `src/game/engine/SceneManager.ts` | P0 |
| Generate plants-atlas from 75 PNGs | Build script | P0 |
| Create `LoadingScene.ts` | `src/game/scenes/LoadingScene.ts` | P1 |
| Create pixel-perfect canvas CSS | `Game.ts` init config | P0 |
| Add `/game` route (side-by-side) | `App.tsx` | P0 |

**Milestone**: PixiJS canvas renders at 320x480, loads plant atlas, displays a static sprite.

### Phase 2: Plant Display & HUD (Week 3-4)

| Task | Files | Priority |
|------|-------|----------|
| Create `PlantEntity.ts` | `src/game/entities/PlantEntity.ts` | P0 |
| Create `plantSprite.ts` stage mapping | `src/game/utils/plantSprite.ts` | P0 |
| Create `GardenScene.ts` | `src/game/scenes/GardenScene.ts` | P0 |
| Create `PixelButton.ts` | `src/game/ui/components/PixelButton.ts` | P0 |
| Create `PixelPanel.ts` | `src/game/ui/components/PixelPanel.ts` | P0 |
| Create `PixelGauge.ts` | `src/game/ui/components/PixelGauge.ts` | P0 |
| Create `GameHUD.ts` | `src/game/ui/screens/GameHUD.ts` | P0 |
| Create `theme.ts` palette | `src/game/ui/theme.ts` | P1 |
| Create `useGameBridge.ts` | `src/hooks/useGameBridge.ts` | P0 |
| Wire water/sun/harvest buttons to API | `GameHUD.ts` + `useGameBridge.ts` | P0 |

**Milestone**: Plant sprite displayed with correct stage, status gauges update from API, action buttons work.

### Phase 3: Animation & Effects (Week 5-6)

| Task | Files | Priority |
|------|-------|----------|
| Create `IdleSwaySystem.ts` | `src/game/systems/IdleSwaySystem.ts` | P1 |
| Create `DayNightSystem.ts` | `src/game/systems/DayNightSystem.ts` | P1 |
| Create water particle effect | `src/game/effects/WaterEffect.ts` | P1 |
| Create harvest sparkle effect | `src/game/effects/HarvestSparkle.ts` | P1 |
| Create sunlight glow effect | `src/game/effects/SunlightEffect.ts` | P2 |
| Create `WeatherSystem.ts` | `src/game/systems/WeatherSystem.ts` | P2 |
| Create wilt animation | `src/game/effects/WiltEffect.ts` | P2 |
| Stage transition crossfade | `PlantEntity.ts` | P1 |
| GSAP panel slide-in animations | `GameHUD.ts` | P2 |

**Milestone**: Plants sway, day/night cycle runs, particle effects fire on user actions.

### Phase 4: PWA & Polish (Week 7-8)

| Task | Files | Priority |
|------|-------|----------|
| Create `manifest.json` | `public/manifest.json` | P0 |
| Generate PWA icons (10 sizes) | `public/icons/` | P0 |
| Rewrite `service-worker.js` | `public/service-worker.js` | P0 |
| Update `index.html` meta tags | `index.html` | P0 |
| Create landscape blocker | `src/game/ui/LandscapeBlocker.ts` | P1 |
| Switch `/` route to GameShell | `App.tsx` | P0 |
| Create `CatalogScene.ts` | `src/game/scenes/CatalogScene.ts` | P1 |
| Create bitmap font (Korean) | `public/assets/fonts/` | P1 |
| Performance profiling | DevTools | P1 |
| Remove unused Tailwind components | Cleanup | P2 |

**Milestone**: App installable as PWA, works offline for cached data, full game UI in PixiJS.

---

## 10. Risk Matrix & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Korean bitmap font complexity** (thousands of glyphs) | High | Medium | Use subset font (most common 2,350 KS X 1001 characters). Fallback to PixiJS `Text` for rare characters. |
| **Mobile WebGL performance** (low-end devices) | Medium | High | LOD system: reduce particles on low FPS. 320x480 logical resolution keeps GPU load minimal. |
| **PixiJS v8 breaking changes** | Low | Medium | Pin exact version. Follow migration guide. |
| **GSAP license for commercial use** | Medium | Low | Free tier covers non-commercial. If commercial, switch to Anime.js (~52KB, MIT license). |
| **iOS PWA cache eviction** | High | Medium | Verify cache on app launch. Re-fetch missing assets. Keep total cache < 50MB. |
| **Atlas generation in CI/CD** | Low | Low | Use `free-tex-packer-cli` in `prebuild` script. Falls back to individual PNGs in dev. |
| **React<->PixiJS state sync bugs** | Medium | Medium | Unidirectional flow: React owns state, PixiJS is pure renderer. Use `useGameBridge` hook as single sync point. |
| **Stage 1-2 sprites identical** | Low | Low | Acceptable for MVP. Stage 1 (seed) and Stage 2 (sprout) share across species by design. |
| **Missing harvestable sprite** | Low | Low | Use stage 5 sprite + sparkle particle overlay for `harvestable` state. |

---

## Appendix A: Final Project Structure (Target State)

```
frontend/
  public/
    manifest.json                    -- PWA manifest (NEW)
    service-worker.js                -- Enhanced SW (REWRITE)
    icons/                           -- PWA icons (NEW, 10 sizes)
    splash/                          -- iOS splash screens (NEW)
    assets/
      plants/
        plants-atlas.png             -- Generated from 75 PNGs (NEW)
        plants-atlas.json            -- Atlas metadata (NEW)
      ui/
        ui-atlas.png                 -- UI sprites (NEW)
        ui-atlas.json                -- Atlas metadata (NEW)
      fonts/
        pixel-kr.fnt                 -- Korean bitmap font (NEW)
        pixel-kr.png                 -- Font texture (NEW)
      particles/
        sparkle.png                  -- 4x4 particle (NEW)
        water-drop.png               -- 4x4 particle (NEW)
        leaf.png                     -- 8x8 particle (NEW)
      backgrounds/
        ground-tiles.png             -- Ground tileset (NEW)
  src/
    App.tsx                          -- Updated routes (MODIFIED)
    main.tsx                         -- Entry (UNCHANGED)
    registerSW.ts                    -- SW registration (UNCHANGED)
    contexts/
      AuthContext.tsx                -- Auth state (UNCHANGED)
    services/
      api.ts                        -- Axios (UNCHANGED)
      auth.service.ts               -- Auth API (UNCHANGED)
      plant.service.ts              -- Plant API (UNCHANGED)
    hooks/
      useGameBridge.ts              -- React<->PixiJS bridge (NEW)
    components/
      GameShell.tsx                 -- PixiJS mount point (NEW)
      PrivateRoute.tsx              -- Auth guard (UNCHANGED)
      Layout.tsx                    -- Tailwind layout (KEEP for legacy)
      Button.tsx                    -- Tailwind button (KEEP for Login/Register)
      ProgressBar.tsx               -- Tailwind bar (KEEP for legacy)
    pages/
      Login.tsx                     -- Tailwind (UNCHANGED)
      Register.tsx                  -- Tailwind (UNCHANGED)
      Profile.tsx                   -- Tailwind (UNCHANGED)
      Dashboard.tsx                 -- Tailwind (DEPRECATED, keep as fallback)
      Collection.tsx                -- Tailwind (DEPRECATED, keep as fallback)
    game/                           -- ALL NEW
      Game.ts                       -- Application bootstrap
      engine/
        SceneManager.ts             -- Scene lifecycle
        AssetManager.ts             -- Asset bundle loading
        GameLoop.ts                 -- Ticker-based game loop
      scenes/
        LoadingScene.ts             -- Asset loading progress
        GardenScene.ts              -- Main plant view
        CatalogScene.ts             -- Plant catalog/shop
      entities/
        PlantEntity.ts              -- Plant sprite + pot + effects
      systems/
        IdleSwaySystem.ts           -- Plant sway animation
        DayNightSystem.ts           -- Sky color + ambient light
        WeatherSystem.ts            -- Rain/snow particles
      effects/
        WaterEffect.ts              -- Watering particle burst
        HarvestSparkle.ts           -- Harvest celebration
        SunlightEffect.ts           -- Light glow effect
        WiltEffect.ts               -- Low health visual
      ui/
        theme.ts                    -- Color palette + constants
        LandscapeBlocker.ts         -- Portrait lock overlay
        components/
          PixelButton.ts            -- 9-slice dot button
          PixelPanel.ts             -- 9-slice dialog panel
          PixelGauge.ts             -- Status bar
        screens/
          GameHUD.ts                -- In-game HUD layout
      utils/
        plantSprite.ts              -- Stage-to-sprite mapping
        constants.ts                -- Game dimensions, timings
    assets/
      plants/                      -- 75 source PNGs (EXISTING, unchanged)
```

---

## Appendix B: Performance Budget

| Metric | Target | Measurement |
|--------|--------|-------------|
| FPS (mobile, mid-tier) | 60fps stable | PixiJS DevTools FPS counter |
| FPS (mobile, low-end) | 30fps minimum | Reduce particles via LOD |
| Draw calls | < 15 per frame | PixiJS DevTools |
| JS bundle (gzipped) | < 250KB (app) + 150KB (PixiJS) | Vite build output |
| Atlas textures | < 2MB total VRAM | 1x 1024x1024 plants + 1x 512x512 UI |
| Initial load (3G) | < 5 seconds | Lighthouse |
| Time to interactive | < 3 seconds | Lighthouse |
| Total PWA cache | < 30MB | Application > Storage in DevTools |
| Memory (mobile) | < 80MB | Chrome DevTools Memory tab |
