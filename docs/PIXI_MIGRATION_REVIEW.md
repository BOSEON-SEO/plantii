# PixiJS Migration Plan Review Report

> **Reviewer**: Claude Agent (step-4 review)
> **Date**: 2026-04-24
> **Target Document**: `docs/PIXI_MIGRATION_PLAN.md` v1.0
> **Supporting References**: `SPRITE_ANALYSIS.md`, `TECH_RESEARCH.md`, `TECHNICAL_DESIGN.md`, Frontend Source Code

---

## Executive Assessment

**Overall Rating: 4.2 / 5 - Excellent plan with targeted improvements needed**

The migration plan is comprehensive, technically well-grounded, and demonstrates deep understanding of both the current codebase and the target architecture. It correctly identifies all critical gaps (unused sprites, emoji-only rendering, missing animations, broken SW caching) and proposes a pragmatic hybrid React + PixiJS architecture. The plan is implementable as-written with the improvements noted below.

---

## 1. Technical Feasibility Evaluation

### 1.1 Architecture Decision: Hybrid React Shell + PixiJS Canvas

| Aspect | Assessment | Score |
|--------|-----------|-------|
| React routing/auth preservation | Correct - avoids rewriting auth/login flows | 5/5 |
| GameShell.tsx as mount point | Sound pattern, clean separation | 5/5 |
| Layer architecture (5 layers) | Well-structured z-ordering | 5/5 |
| SceneManager pattern | Functional but has design issues (see below) | 3/5 |
| React <-> PixiJS data bridge | Unidirectional flow is correct, but incomplete | 3/5 |

**Feasibility Verdict**: Fully implementable. The hybrid architecture is the correct choice for this project - it preserves working authentication/routing while allowing game canvas to own rendering.

### 1.2 Code-Level Issues Found

#### ISSUE 1: SceneManager uses static methods without initialization guard

```typescript
// PIXI_MIGRATION_PLAN.md, Section 3.5
export class SceneManager {
  private static game: Game;  // Never assigned!

  static async switchTo(name: string, data?: any): Promise<void> {
    // this.game.layers.game is used but game is never set
    this.game.layers.game.removeChild(this.currentScene.container);
```

**Problem**: `SceneManager.game` is never initialized. There is no `static init(game: Game)` method.
**Fix Required**: Add `static init(game: Game): void { this.game = game; }` and call it from `Game.init()`.

#### ISSUE 2: GameShell.tsx useEffect dependency array is incomplete

```typescript
// Section 3.4
useEffect(() => {
  // setup uses scene and plantData from props
  SceneManager.switchTo(scene, plantData);
}, []);  // Empty deps - won't react to scene/plantData changes
```

**Problem**: When React Router navigates from `/` (garden) to `/collection`, the `scene` prop changes but the effect won't re-run. The second `useEffect` only handles `plantData`, not `scene` changes.
**Fix Required**: Either add `scene` to the dependency array of the first effect, or add a third effect that watches `scene` and calls `SceneManager.switchTo(scene)`.

#### ISSUE 3: GameLoop references undeclared import

```typescript
// Section 3.6
export class GameLoop {
  constructor(app: Application) {  // Application not imported
    // ...
    SceneManager.currentScene?.onUpdate(dt);  // currentScene is private
```

**Problem**: `Application` type is not imported. `SceneManager.currentScene` is declared `private static` but accessed externally.
**Fix**: Import `Application` from pixi.js. Change `currentScene` visibility to `public static` or add a `static update(dt)` method.

#### ISSUE 4: PlantEntity accesses private member

```typescript
// Section 5.2 IdleSwaySystem
plant.plantSprite.rotation = Math.sin(...) * amplitude;
plant.plantSprite.scale.y = 2 * breathScale;
```

**Problem**: `plantSprite` is declared `private` in `PlantEntity` (Section 4.4) but accessed directly by `IdleSwaySystem`.
**Fix**: Either make `plantSprite` public/protected, or expose setter methods like `setSwayRotation(r)` and `setBreathScale(s)`.

### 1.3 Dependency Compatibility Verification

| Package | Planned Version | React 18 Compat | Vite 5 Compat | Status |
|---------|----------------|-----------------|---------------|--------|
| pixi.js | ^8.x | Yes (framework-agnostic) | Yes (ESM) | OK |
| @pixi/react | ^8.x | **RISK** - requires React 19+ per docs | Yes | NEEDS CHECK |
| gsap | ^3.12 | Yes | Yes | OK |
| @pixi/particle-emitter | ^5.x | N/A | Yes | OK |
| @pixi/sound | ^6.x | N/A | Yes | OK (future) |
| free-tex-packer-cli | ^0.6 | N/A | N/A (CLI) | OK |

**CRITICAL FINDING**: The plan specifies `@pixi/react ^8.x` for React integration, but the current project uses **React 18.2**. The `@pixi/react` v8 package [requires React 19+](https://github.com/pixijs/pixi-react). The plan's `GameShell.tsx` already uses manual canvas ref + imperative init (not @pixi/react JSX), which is actually the **better approach** for React 18.

**Recommendation**: Remove `@pixi/react` from dependencies. The `GameShell.tsx` component as designed doesn't use it and works correctly with React 18. This is actually a strength of the plan's implementation - it just needs the dependency list corrected.

---

## 2. Requirements Coverage Analysis

### 2.1 Mapping Plan to Original Requirements

| Requirement (from TECHNICAL_DESIGN.md) | Coverage in Plan | Section | Completeness |
|----------------------------------------|-----------------|---------|-------------|
| 15 plant species display | Full - all 15 mapped | 4.3 | 100% |
| Growth stage visualization | Full - 5 sprites mapped to 6-7 stages | 4.3 | 95% |
| Health/growth/moisture monitoring | Full - PixelGauge components | 6.3.3 | 100% |
| Water/sunlight/harvest actions | Full - PixelButton + useGameBridge | 6.3.1, 8.4 | 100% |
| User authentication | Preserved - React AuthContext unchanged | 1.3, 8.2 | 100% |
| Plant catalog/collection | Planned - CatalogScene in Phase C | 8.3 | 80% |
| PWA installability | Full - manifest + SW + meta tags | 7.1-7.4 | 100% |
| Pixel art visual style | Full - Kairosoft-style theming | 6.1-6.5 | 100% |
| Mobile support | Full - portrait lock, touch events | 7.4 | 95% |
| Offline capability | Partial - SW caching strategies defined | 7.3 | 70% |

### 2.2 Coverage Gaps

#### GAP 1: CatalogScene is underspecified (Section 8.3, Phase C)

The `Collection.tsx` migration to `CatalogScene` is listed in the timeline but has **zero implementation detail**. Given Collection.tsx shows a scrollable list of plant cards, this requires:
- Scrollable container implementation (PixiJS has no native scroll)
- Plant card component (thumbnail + stats in a panel)
- Category filter tabs

**Recommendation**: Add a Section 6.6 or Appendix C with CatalogScene wireframe and scroll implementation approach. Consider using `@pixi/ui ScrollBox` component.

#### GAP 2: Offline gameplay data sync is vague (Section 7.3)

The SW caches API GET responses but there's no plan for:
- Queuing POST actions (water/harvest) when offline
- Conflict resolution when syncing after reconnection
- IndexedDB storage for game state (mentioned in TECH_RESEARCH but absent from migration plan)

**Recommendation**: For MVP, this is acceptable. Add a simple offline indicator and disable action buttons when offline. Defer full offline sync to Phase 2.

#### GAP 3: No error handling strategy in the game canvas

The plan lacks error boundaries for the PixiJS canvas. If WebGL context is lost (common on mobile), the entire game screen goes blank with no recovery path.

**Recommendation**: Add WebGL context loss handling:
```typescript
canvas.addEventListener('webgl-context-lost', (e) => {
  e.preventDefault();
  showFallbackUI();
});
canvas.addEventListener('webgl-context-restored', () => {
  game.reinit();
});
```

#### GAP 4: No plant creation flow in PixiJS

`Dashboard.tsx` has a "no plant" state that redirects to `/collection` to create a new plant. The migration plan doesn't address how plant creation (selecting species, naming) will work in the PixiJS UI.

**Recommendation**: Keep plant creation as a React/Tailwind modal overlay on top of the canvas, or design a PixiJS plant selection scene.

---

## 3. Performance Analysis

### 3.1 Performance Budget Review

| Metric | Plan Target | Realistic Assessment | Verdict |
|--------|------------|---------------------|---------|
| 60fps mobile (mid-tier) | Target | Achievable - 320x480 is very low res, ~75 sprites max | OK |
| 30fps mobile (low-end) | Target | Achievable with particle LOD | OK |
| < 15 draw calls | Target | Achievable - 1 plant atlas + 1 UI atlas + particles = ~5-8 | OK |
| < 250KB app JS (gzip) | Target | **Tight** - React 18 (~45KB) + PixiJS (~150KB) + GSAP (~26KB gzip) + app code = ~250-280KB | RISK |
| < 2MB atlas VRAM | Target | 1x 1024x1024 RGBA + 1x 512x512 = ~5.2MB uncompressed | NEEDS CORRECTION |
| < 5s initial load (3G) | Target | Depends on atlas size, likely achievable with bundle loading | OK |
| < 80MB memory (mobile) | Target | Achievable for this scope | OK |

### 3.2 Performance Concerns

#### CONCERN 1: DayNightSystem updates sky every frame

```typescript
// Section 5.4 - update() called every frame
this.skyGradient.clear();
this.skyGradient.rect(0, 0, 320, 480).fill(skyColor);
```

**Problem**: `Graphics.clear()` + `rect()` + `fill()` every frame generates garbage and rebuilds geometry. Sky color changes slowly (once per game-minute at most).

**Fix**: Only update when the interpolated color actually changes:
```typescript
update(dt: number): void {
  this.gameHour += ...;
  const newColor = this.calculateSkyColor();
  if (newColor !== this.lastSkyColor) {
    this.skyGradient.clear().rect(0, 0, 320, 480).fill(newColor);
    this.lastSkyColor = newColor;
  }
}
```

#### CONCERN 2: ColorMatrixFilter on entire game layer

```typescript
// Section 5.4
this.gameLayer.filters = [this.colorFilter];
this.colorFilter.brightness(intensity, false);
```

**Problem**: Applying a filter to the entire game layer forces an extra render pass (render to texture -> apply filter -> render to screen). For a simple brightness adjustment, this doubles rendering cost.

**Fix**: Instead of a filter, apply `tint` directly to the game layer container:
```typescript
this.gameLayer.tint = this.lerpColor(0xffffff, ambientTint, 1 - intensity);
```
This is free (no extra render pass) and sufficient for ambient lighting.

#### CONCERN 3: GSAP dynamic import in PlantEntity.transitionToStage

```typescript
// Section 4.4
const gsap = (await import('gsap')).default;
```

**Problem**: Dynamic import on every stage transition adds latency and generates new module evaluation. GSAP should be imported statically or cached after first import.

**Fix**: Import GSAP statically at the top of the file, or use a module-level cache:
```typescript
import gsap from 'gsap';  // Static import - tree-shaken if unused
```

#### CONCERN 4: VRAM calculation is incorrect

The plan states "~1.6MB uncompressed RGBA" for the plants atlas. This is wrong.

- 1024x1024 RGBA = 1024 * 1024 * 4 = **4.0MB**
- 512x512 RGBA (UI) = 512 * 512 * 4 = **1.0MB**
- Total VRAM for atlas textures alone = **~5.0MB**

This is still well within mobile GPU limits (most have 256MB+), but the documentation should be corrected.

### 3.3 Bundle Size Optimization Opportunities

| Optimization | Savings | Effort |
|-------------|---------|--------|
| PixiJS tree-shaking (v8 supports it) | ~30-50KB gzip | Low - configure Vite |
| GSAP: only import core + PixiPlugin | ~10KB gzip | Low |
| Defer particle bundle loading | Faster initial load | Medium |
| WebP atlas instead of PNG | 25-35% smaller file | Low |

---

## 4. Mobile Compatibility Assessment

### 4.1 Strengths

| Feature | Implementation | Assessment |
|---------|---------------|------------|
| Touch input | PixiJS `eventMode: 'static'` | Correct - unified pointer events |
| Portrait lock | CSS landscape blocker overlay | Correct for iOS compatibility |
| Pixel-perfect scaling | `objectFit: contain`, `imageRendering: pixelated` | Correct |
| Low resolution (320x480) | Minimal GPU load | Excellent for low-end devices |
| PWA manifest | `orientation: portrait`, `display: standalone` | Correct |
| iOS meta tags | apple-mobile-web-app-capable, splash screens | Comprehensive |

### 4.2 Mobile Risks & Gaps

#### RISK 1: iOS Safari `imageRendering: pixelated` support

`imageRendering: pixelated` is supported in iOS Safari, but `image-rendering: crisp-edges` is the standard fallback. The plan only uses `pixelated`.

**Fix**: Add fallback:
```css
canvas.style.imageRendering = '-webkit-optimize-contrast'; /* Old Safari */
canvas.style.imageRendering = 'pixelated';
```

#### RISK 2: Canvas sizing with `100vh` on mobile browsers

```typescript
// Section 3.4
style={{ height: '100vh' }}
```

**Problem**: On mobile Safari, `100vh` includes the URL bar height, causing content to be hidden behind the browser chrome. This is a well-known mobile web issue.

**Fix**: Use `100dvh` (dynamic viewport height) or calculate via JavaScript:
```typescript
style={{ height: 'calc(var(--vh, 1vh) * 100)' }}
// And in JS:
const setVH = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
window.addEventListener('resize', setVH);
```

#### RISK 3: Touch feedback latency

The `PixelButton` uses `pointerdown`/`pointerup` which is correct (no 300ms tap delay). However, there's no `touch-action: manipulation` CSS on the canvas to prevent double-tap zoom.

**Fix**: Add to canvas style:
```css
canvas { touch-action: manipulation; }
```

#### RISK 4: No responsive scaling logic

The plan sets 320x480 logical resolution but doesn't handle the actual variety of phone aspect ratios (16:9, 19.5:9, 20:9). With `objectFit: contain`, there will be letterboxing (black bars) on phones with aspect ratios different from 2:3.

**Recommendation**:
- Option A: Accept letterboxing with a styled background color (simplest)
- Option B: Extend the background layer to fill the screen while keeping game content at 320x480
- Option C: Use flexible height (320xN) that adapts to the device

For MVP, Option A is acceptable. Document this as a known limitation.

#### RISK 5: Memory pressure on low-end Android

The plan's 80MB target is reasonable but doesn't account for the browser's own overhead (~100-200MB on Android WebView). Combined with the app, total memory could hit 300MB on Chrome.

**Mitigation**: The plan correctly mentions particle LOD. Additionally:
- Destroy textures for scenes not in use
- Limit particle pool sizes based on `navigator.deviceMemory` API
- Test on 2GB RAM devices

### 4.3 iOS-Specific PWA Issues

| Issue | Plan Coverage | Additional Notes |
|-------|-------------|-----------------|
| iOS cache eviction (7-day rule) | Mentioned in risk matrix | Need cache integrity check on launch |
| No Web Push on iOS < 16.4 | Not mentioned | Add in-app notification system as fallback |
| Audio autoplay restrictions | Not mentioned | Relevant when @pixi/sound is added |
| Safe area insets (notch) | Not addressed | Need `env(safe-area-inset-*)` CSS |

**Fix for safe area**:
```html
<meta name="viewport" content="..., viewport-fit=cover">
```
```css
canvas {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

---

## 5. Risk Assessment Supplement

### 5.1 Risks NOT in the plan's Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **WebGL context loss on mobile** | Medium | Critical | Add context-loss event handler with graceful recovery |
| **React 18 vs @pixi/react v8 incompatibility** | High | Medium | Remove @pixi/react dependency; use manual canvas ref (already done in GameShell) |
| **100vh mobile browser issue** | High | Medium | Use dvh units or JS-calculated viewport height |
| **Korean BitmapFont file size** (2,350 chars) | High | Medium | KS X 1001 subset at 8px = ~256x256 texture, manageable. But test CJK rendering |
| **Vite dev server HMR with PixiJS** | Medium | Low | PixiJS Application must be properly destroyed on HMR; add Vite HMR disposal hook |
| **Multi-plant garden view** (future) | Low | Medium | Current plan only handles single plant display; scalability not addressed |
| **Accessibility** | High | Medium | Canvas-based UI is invisible to screen readers. Add ARIA labels on canvas element |

### 5.2 Risk Matrix Corrections

The plan rates "Korean bitmap font complexity" as High probability / Medium impact. This assessment is correct but the mitigation needs refinement:

- A KS X 1001 subset of 2,350 characters at 8x8px per glyph requires a texture of at least 384x384 (more realistically ~512x512 with padding). This is feasible.
- **However**, the plan doesn't address the font generation pipeline. Who creates the `.fnt` + `.png` files? This is a manual design task that could become a bottleneck.
- **Fallback recommendation**: Use PixiJS `Text` (not `BitmapText`) for Korean text, and `BitmapText` only for ASCII (numbers, labels). `Text` performance is acceptable when text doesn't change every frame.

---

## 6. Improvement Recommendations (Priority Ordered)

### P0 - Must Fix Before Implementation

| # | Issue | Section | Action |
|---|-------|---------|--------|
| 1 | Remove `@pixi/react` from dependencies (React 18 incompatible) | 8.5 | Delete from package.json list |
| 2 | Fix SceneManager missing `init(game)` method | 3.5 | Add initialization method |
| 3 | Fix GameShell useEffect missing `scene` dependency | 3.4 | Add scene change handling |
| 4 | Fix 100vh mobile viewport issue | 3.4 | Use dvh or JS viewport calculation |
| 5 | Add WebGL context loss recovery | New | Add event listeners on canvas |

### P1 - Should Fix for Quality

| # | Issue | Section | Action |
|---|-------|---------|--------|
| 6 | DayNightSystem: skip-frame optimization for sky redraw | 5.4 | Only redraw when color changes |
| 7 | Replace ColorMatrixFilter with container tint | 5.4 | Use `gameLayer.tint` instead |
| 8 | GSAP: use static import instead of dynamic | 4.4 | Change to top-level import |
| 9 | Add `touch-action: manipulation` to canvas | 3.4 | Prevent double-tap zoom |
| 10 | Correct VRAM budget documentation | Appendix B | 1024x1024 RGBA = 4MB, not 1.6MB |
| 11 | Add iOS safe area inset handling | 7.2 | Add env(safe-area-inset-*) CSS |
| 12 | Add CatalogScene implementation details | New | Wireframe + scroll approach |

### P2 - Nice to Have

| # | Issue | Section | Action |
|---|-------|---------|--------|
| 13 | Add Vite HMR disposal hook for PixiJS | 3.3 | Prevent memory leaks in dev |
| 14 | Add accessibility ARIA attributes on canvas | 3.4 | Screen reader compatibility |
| 15 | Add `navigator.deviceMemory` check for LOD | 5.3.3 | Adaptive particle limits |
| 16 | Add WebP atlas variant for smaller downloads | 4.6 | 25-35% size reduction |
| 17 | Document multi-plant garden view scalability | New | Future-proofing |

---

## 7. Corrected Code Snippets

### 7.1 Fixed GameShell.tsx

```typescript
// frontend/src/components/GameShell.tsx (CORRECTED)

import React, { useRef, useEffect, useCallback } from 'react';
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
  const initializedRef = useRef(false);

  // Viewport height fix for mobile browsers
  useEffect(() => {
    const setVH = () => {
      document.documentElement.style.setProperty(
        '--vh', `${window.innerHeight * 0.01}px`
      );
    };
    setVH();
    window.addEventListener('resize', setVH);
    return () => window.removeEventListener('resize', setVH);
  }, []);

  // Game initialization
  useEffect(() => {
    if (initializedRef.current) return;
    const game = new Game();
    gameRef.current = game;

    const setup = async () => {
      if (!canvasRef.current) return;
      await game.init(canvasRef.current);
      SceneManager.init(game);  // FIX: Initialize SceneManager
      await AssetManager.loadBundle('core');
      await SceneManager.switchTo(scene, plantData);
      initializedRef.current = true;
    };

    setup();

    return () => {
      game.destroy();
      gameRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  // FIX: Handle scene changes from React Router
  useEffect(() => {
    if (initializedRef.current && gameRef.current) {
      SceneManager.switchTo(scene, plantData);
    }
  }, [scene]);

  // React state -> PixiJS bridge
  useEffect(() => {
    if (gameRef.current && plantData) {
      SceneManager.updatePlantData(plantData);
    }
  }, [plantData]);

  return (
    <canvas
      ref={canvasRef}
      role="application"
      aria-label="Plantii game canvas"
      style={{
        width: '100%',
        height: 'calc(var(--vh, 1vh) * 100)',  // FIX: mobile viewport
        display: 'block',
        imageRendering: 'pixelated',
        touchAction: 'manipulation',  // FIX: prevent double-tap zoom
      }}
    />
  );
};

export default GameShell;
```

### 7.2 Fixed SceneManager

```typescript
// frontend/src/game/engine/SceneManager.ts (CORRECTED)

import { Container } from 'pixi.js';
import type { Game } from '../Game';

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
  private static _currentScene: GameScene | null = null;  // FIX: renamed
  private static game: Game;

  // FIX: Add initialization method
  static init(game: Game): void {
    this.game = game;
  }

  static get currentScene(): GameScene | null {  // FIX: public getter
    return this._currentScene;
  }

  static register(scene: GameScene): void {
    this.scenes.set(scene.name, scene);
  }

  static async switchTo(name: string, data?: any): Promise<void> {
    if (!this.game) throw new Error('SceneManager not initialized. Call init() first.');

    if (this._currentScene) {
      await this._currentScene.onExit();
      this.game.layers.game.removeChild(this._currentScene.container);
    }

    const scene = this.scenes.get(name);
    if (!scene) throw new Error(`Scene "${name}" not found`);

    this._currentScene = scene;
    this.game.layers.game.addChild(scene.container);
    await scene.onEnter(data);
  }

  static updatePlantData(data: any): void {
    if (this._currentScene && 'updatePlantData' in this._currentScene) {
      (this._currentScene as any).updatePlantData(data);
    }
  }
}
```

---

## 8. Timeline Assessment

| Phase | Plan Estimate | Realistic Estimate | Notes |
|-------|--------------|-------------------|-------|
| Phase 1: Foundation | Week 1-2 | Week 1-2 | Achievable. Core setup is straightforward. |
| Phase 2: Plant + HUD | Week 3-4 | Week 3-5 | **+1 week** - Korean BitmapFont creation is a design bottleneck. Use PixiJS Text as interim. |
| Phase 3: Animation | Week 5-6 | Week 6-7 | **+1 week** - Particle tuning and visual polish takes longer than code implies. |
| Phase 4: PWA + Polish | Week 7-8 | Week 8-10 | **+2 weeks** - PWA icon generation, SW testing across devices, CatalogScene implementation are underestimated. |
| **Total** | **8 weeks** | **10 weeks** | 25% buffer recommended |

---

## 9. Final Verdict

### Strengths
1. **Excellent hybrid architecture** - preserves React auth/routing, isolates game rendering cleanly
2. **Thorough asset pipeline** - atlas generation, bundle loading, stage mapping all well-designed
3. **Correct pixel-perfect setup** - antialias:false, roundPixels:true, nearest-neighbor scaling
4. **Pragmatic stage mapping** - 5 sprites to 6-7 stages with visual effect differentiation (sparkle for harvestable)
5. **Incremental migration path** - side-by-side -> feature parity -> switchover -> cleanup is low-risk
6. **Comprehensive PWA coverage** - manifest, iOS meta tags, multi-strategy SW caching

### Weaknesses
1. **Code-level bugs** in SceneManager initialization, useEffect dependencies, access modifiers
2. **Missing @pixi/react React 18 compatibility** issue (but easily fixed by removing the dep)
3. **Mobile viewport** (100vh) and safe area (notch) issues not addressed
4. **Performance anti-patterns** in DayNightSystem (per-frame redraws, unnecessary filter passes)
5. **CatalogScene** is a significant feature with zero implementation detail
6. **No error recovery** for WebGL context loss
7. **Timeline is ~25% optimistic** due to asset creation bottlenecks

### Recommendation

**APPROVE with required fixes.** The plan provides a solid foundation for implementation. Apply the P0 fixes before starting Phase 1 code. The architecture, technology choices, and migration strategy are all sound. The identified issues are correctable without changing the overall plan structure.
