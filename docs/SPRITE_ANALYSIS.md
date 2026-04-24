# Plantii Pixel Art Sprite Analysis Report

> **Date**: 2026-04-24
> **Scope**: `frontend/src/assets/plants/` (75 files)

---

## 1. Overview

| Item | Value |
|------|-------|
| Total sprites | **75** |
| Plant species | **15** |
| Stages per plant | **5** (stage1 ~ stage5) |
| File format | PNG, 8-bit/color RGBA, non-interlaced |
| Resolution (all) | **64 x 64 px** |
| Total disk size | **~115 KB** |
| Animation type | **None** (static frames; no GIF/APNG/spritesheet) |

---

## 2. Plant Species Inventory

| # | ID (filename prefix) | Category | Difficulty |
|---|---------------------|----------|------------|
| 1 | `aloe` | succulent | easy |
| 2 | `basil` | herb | easy |
| 3 | `cactus` | succulent | easy |
| 4 | `chili` | fruiting | medium |
| 5 | `lavender` | herb | medium |
| 6 | `lettuce` | leafy | easy |
| 7 | `mint` | herb | easy |
| 8 | `monstera` | foliage | medium |
| 9 | `orchid` | flowering | hard |
| 10 | `rose` | flowering | hard |
| 11 | `rubber_plant` | foliage | medium |
| 12 | `succulent` | succulent | easy |
| 13 | `sunflower` | flowering | medium |
| 14 | `tomato` | fruiting | medium |
| 15 | `tulip` | flowering | medium |

---

## 3. File Naming Convention

```
{plant_id}_stage{N}.png
```

- `plant_id`: snake_case plant identifier (e.g., `rubber_plant`)
- `N`: integer 1-5 representing growth stage
- Example: `rubber_plant_stage3.png`

---

## 4. File Size Distribution by Stage

| Stage | Min (bytes) | Max (bytes) | Avg (bytes) | Notes |
|-------|-------------|-------------|-------------|-------|
| 1 | 197 | 197 | **197** | Identical across all 15 plants |
| 2 | 256 | 256 | **256** | Identical across all 15 plants |
| 3 | 314 | 330 | **327** | Slight variation |
| 4 | 418 | 449 | **441** | Moderate variation |
| 5 | 381 | 560 | **465** | Highest variation |

**Key observations:**
- Stage 1 and Stage 2 are **byte-identical** across all species (same seed/sprout image reused).
- File size increases progressively with stage, reflecting growing visual complexity.
- Stage 5 has the widest size range (381-560 bytes) due to species-specific features (flowers, fruits, etc.).

---

## 5. Growth Stage Visual Progression

All sprites are **static pixel art** rendered on a 64x64 transparent canvas. There are no animation frames, spritesheets, or multi-frame files. Visual progression is achieved by swapping between the 5 discrete stage images.

### Stage 1 - Seed (all species identical)
- **Visual**: Small brown oval/circle (seed) centered on canvas
- **Size**: ~5x4 pixels of content; rest is transparent
- **Shared**: All 15 plants render the exact same image (197 bytes each)

### Stage 2 - Sprout (all species identical)
- **Visual**: Small green sprout with two tiny leaves emerging from brown soil/ground line
- **Size**: ~16x20 pixels of content
- **Shared**: All 15 plants render the exact same image (256 bytes each)

### Stage 3 - Seedling (minor species variation)
- **Visual**: Slightly taller stem with 2-4 leaves, visible brown stem/trunk, ground line
- **Size**: ~20x26 pixels of content
- **Differentiation begins**: Leaf shape varies slightly (e.g., cactus rounded vs. mint pointed)

### Stage 4 - Vegetative / Mature Foliage (species-specific)
- **Visual**: Full canopy development with distinct trunk; large green mass
- **Size**: ~36x40 pixels of content
- **Features**: Species show clear differences in canopy shape (round vs. spread), trunk thickness, and leaf density

### Stage 5 - Mature / Flowering / Fruiting (fully differentiated)
- **Visual**: Maximum development; species-specific features fully expressed
- **Size**: ~44x48 pixels of content
- **Features by type**:
  - **Flowering** (rose, orchid, sunflower, tulip): Colored flower buds/blooms on top of canopy (pink, purple, yellow, red)
  - **Fruiting** (tomato, chili): Small red fruit elements appear on foliage
  - **Foliage** (monstera, rubber_plant): Dense, wide leaf canopy; no flowers
  - **Succulent** (aloe, cactus, succulent): Compact rosette/padded forms
  - **Herb** (basil, mint, lavender): Medium bushy canopy; lavender has purple tint
  - **Leafy** (lettuce): Bright green bushy form

---

## 6. Stage-to-Backend Mapping

### Backend growth_stages (from TECHNICAL_DESIGN.md)

The backend defines **6-7 named stages** per plant species:

```
seed -> sprout -> seedling -> vegetative -> [flowering] -> [fruiting] -> mature -> harvestable
```

- Leafy/herb plants: `seed, sprout, seedling, vegetative, mature, harvestable` (6 stages)
- Fruiting plants: `seed, sprout, seedling, vegetative, flowering, fruiting, mature` (7 stages)

### Sprite stage mapping (5 sprites vs 6-7 backend stages)

There is a **mismatch** between the 5 sprite files and the 6-7 backend stages. The current mapping must be:

| Sprite File | Likely Backend Stage(s) | Notes |
|-------------|------------------------|-------|
| `_stage1.png` | `seed` | All identical |
| `_stage2.png` | `sprout` | All identical |
| `_stage3.png` | `seedling` | Minor variation |
| `_stage4.png` | `vegetative` (leafy) / `flowering` (fruiting) | Species-specific |
| `_stage5.png` | `mature` + `harvestable` (leafy) / `fruiting` + `mature` (fruiting) | Max differentiation |

**Gap**: The `harvestable` stage has no dedicated sprite. Multiple backend stages must share a single sprite image.

---

## 7. Current Usage in Frontend Code

### Dashboard.tsx
- **Does NOT use sprite PNGs** - uses emoji fallback instead:
  ```tsx
  const stageEmojis = {
    seed: '..', sprout: '..', seedling: '..', vegetative: '...',
    flowering: '..', fruiting: '..', mature: '..', harvestable: '..'
  };
  ```
- Displays `stageEmojis[currentPlant.current_stage]` as text, not as `<img>`.

### Collection.tsx
- **Does NOT use sprite PNGs** - hardcodes a generic emoji for all user plants.

### plant.service.ts
- No sprite/image URL logic. The `UserPlant` interface has no image field.
- The backend API response example in TECHNICAL_DESIGN shows an `icon_url` field pointing to an external CDN (`cdn.plantii.app`), but this is not implemented.

### Result: **Sprites are UNUSED**
The 75 pixel art sprite PNGs exist in the assets folder but are **not imported or referenced anywhere** in the current frontend code.

---

## 8. Animation Requirements Assessment

### Current State
- **No animation exists.** All 75 files are static single-frame PNGs.
- No CSS animations, sprite sheet animations, or frame-based animations are applied.

### Recommended Animations for Plant Growth UX

| Animation Type | Purpose | Implementation Approach |
|---------------|---------|------------------------|
| **Stage transition** | Smooth visual when plant grows to next stage | CSS crossfade / opacity transition between two stage PNGs (300-500ms) |
| **Idle sway** | Gentle swaying while plant is alive | CSS `@keyframes` transform: rotate(-2deg to 2deg), 3-4s loop |
| **Watering effect** | Visual feedback when user waters | CSS water droplet overlay animation or particle effect |
| **Sunlight glow** | Visual feedback for light adjustment | CSS radial-gradient pulse or brightness filter |
| **Wilting** | Show low health state | CSS transform: skewX + desaturation filter |
| **Harvest sparkle** | Celebrate harvestable state | CSS sparkle keyframes on stage5 sprite |
| **Growth pulse** | Subtle "breathing" on healthy plants | CSS scale(1.0 to 1.03) ping animation |

### Sprite Animation Alternative (if richer animation desired)
For frame-by-frame pixel animation, each stage would need 2-4 additional frames:
- Current: 75 sprites (15 plants x 5 stages x 1 frame)
- With idle animation (3 frames): 225 sprites
- Recommendation: Use CSS transforms on the existing static sprites rather than creating hundreds of additional pixel art frames.

---

## 9. Integration Roadmap

### Priority 1: Wire up existing sprites
1. Create a utility function to map `(plant_id, current_stage)` to the correct sprite file path
2. Handle the 5-sprite vs 6-7-stage mismatch with a mapping table
3. Replace emoji rendering in Dashboard.tsx and Collection.tsx with `<img>` tags

### Priority 2: Add CSS animations
1. Implement crossfade transition on stage change
2. Add idle sway animation to the plant display
3. Add interaction feedback animations (water, sunlight)

### Priority 3: Address sprite gaps
1. Consider adding `_stage6.png` for `harvestable` state (with sparkle/highlight effect)
2. Consider adding unique `_stage1.png` per species (currently all identical seeds)
3. Consider larger resolution variants (128x128 or 256x256) for the main Dashboard display

---

## 10. Proposed Stage Mapping Function

```typescript
// Suggested implementation for frontend/src/utils/plantSprite.ts

const STAGE_TO_SPRITE: Record<string, number> = {
  seed: 1,
  sprout: 2,
  seedling: 3,
  vegetative: 4,
  flowering: 4,   // shares sprite with vegetative
  fruiting: 5,
  mature: 5,       // shares sprite with fruiting
  harvestable: 5,  // shares sprite with mature
};

export function getPlantSpriteUrl(plantId: string, stage: string): string {
  const spriteStage = STAGE_TO_SPRITE[stage] ?? 1;
  // Dynamic import pattern for Vite/webpack
  return new URL(
    `../assets/plants/${plantId}_stage${spriteStage}.png`,
    import.meta.url
  ).href;
}
```

---

## 11. Summary of Findings

| Finding | Status |
|---------|--------|
| All 75 sprites exist and are valid PNGs | OK |
| Uniform 64x64 RGBA format | OK |
| Consistent naming convention | OK |
| Stage 1-2 identical across all species | Design decision (shared seed/sprout) |
| Stage 3-5 progressively differentiated | OK |
| Sprites NOT used in frontend code | **ACTION NEEDED** |
| Emoji fallback used instead of sprites | **REPLACE** |
| 5 sprites vs 6-7 backend stages | **MAPPING NEEDED** |
| No animation frames exist | **CSS ANIMATION RECOMMENDED** |
| No harvestable-specific sprite | **OPTIONAL: Add stage 6** |
