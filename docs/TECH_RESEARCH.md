# Plantii 기술 조사 보고서

> 조사일: 2026-04-24
> 대상: PixiJS 2D 게임 엔진, 파티클 시스템, 애니메이션 프레임워크, 카이로소프트 스타일 도트 UI, PWA Manifest

---

## 목차

1. [PixiJS 2D 게임 엔진](#1-pixijs-2d-게임-엔진)
2. [파티클 시스템 라이브러리](#2-파티클-시스템-라이브러리)
3. [애니메이션 프레임워크](#3-애니메이션-프레임워크)
4. [카이로소프트 스타일 도트 UI 구현](#4-카이로소프트-스타일-도트-ui-구현)
5. [PWA Manifest 설정](#5-pwa-manifest-설정)
6. [통합 아키텍처 권장안](#6-통합-아키텍처-권장안)

---

## 1. PixiJS 2D 게임 엔진

### 1.1 개요

PixiJS는 WebGL/WebGPU 기반 고성능 2D 렌더링 엔진으로, 게임 프레임워크가 아닌 **렌더링 엔진**에 집중한다. 물리, 충돌 감지, 오디오 등은 포함하지 않으며, 필요한 라이브러리를 자유롭게 조합할 수 있다.

| 항목 | PixiJS v8 (최신) |
|------|-----------------|
| 언어 | TypeScript (네이티브) |
| 렌더러 | WebGL2 (기본), WebGPU (실험적), Canvas (폴백) |
| 번들 크기 | ~150KB (gzipped) |
| 라이선스 | MIT |
| 모바일 지원 | 터치 이벤트 내장, 모바일 최적화 |

### 1.2 핵심 아키텍처

```
Application
  +-- Stage (Root Container)
       +-- Container (Scene)
       |    +-- Sprite
       |    +-- AnimatedSprite
       |    +-- Graphics
       |    +-- BitmapText
       |    +-- Container (Nested)
       +-- Container (UI Layer)
```

- **Scene Graph**: 부모-자식 계층 구조로 모든 렌더 가능 객체를 관리
- **Extension System (v8)**: 모든 서브시스템이 모듈화/교체 가능, 트리 셰이킹 최적화
- **DisplayObject**: 모든 시각 요소의 공통 인터페이스 (position, scale, rotation, alpha, pivot)

### 1.3 렌더링 파이프라인

```
Ticker Callbacks (Game Logic) --> Scene Graph Traversal --> Culling --> GPU Rendering
```

- **자동 스프라이트 배칭**: 같은 텍스처 아틀라스의 스프라이트를 하나의 draw call로 합침
- **ParticleContainer (v8)**: 경량 파티클 객체로 **100만 파티클 @ 60fps** 달성
- **Render Layers API (v8)**: 씬 그래프와 독립적인 렌더링 순서 제어

### 1.4 Assets API (v8)

```typescript
// 단일 에셋 로드
const texture = await Assets.load('sprites/plant.png');

// 번들 매니페스트 기반 로드
await Assets.init({ manifest: 'assets-manifest.json' });
await Assets.loadBundle('gameplay');
```

- Promise 기반 비동기 로드
- 자동 캐싱, 포맷 감지 (PNG, WebP, AVIF, SVG, JSON, MP4 등)
- 번들 기반 에셋 관리로 점진적 로딩 가능

### 1.5 PixiJS vs 대안 비교

| 비교 항목 | PixiJS v8 | Phaser 3 | Kaboom.js | Babylon.js |
|-----------|-----------|----------|-----------|------------|
| **유형** | 렌더링 엔진 | 게임 프레임워크 | 미니멀 프레임워크 | 3D 엔진 |
| **번들 크기** | ~150KB | ~400-500KB | ~100KB | ~1-3MB |
| **10K 스프라이트 FPS** | 47fps | 43fps | N/A | 56fps |
| **TypeScript** | 네이티브 | 지원 (외부) | 제한적 | 네이티브 |
| **물리 엔진** | 없음 (외부) | 내장 (Arcade/Matter) | 내장 | 내장 |
| **학습 곡선** | 중간 | 낮음 | 매우 낮음 | 높음 |
| **유연성** | 매우 높음 | 중간 | 낮음 | 높음 |
| **2D 렌더링 성능** | 최상 | 좋음 | 보통 | 좋음 |

### 1.6 PixiJS 생태계

| 라이브러리 | 용도 |
|-----------|------|
| **@pixi/ui** | 버튼, 슬라이더, 체크박스, 스크롤박스 등 UI 컴포넌트 |
| **PixiJS Layout (Yoga)** | CSS-like flexbox 레이아웃 |
| **PixiJS Filters** | 블러, 글로우, 색상 조정 등 셰이더 이펙트 |
| **Spine-Pixi** | 스켈레탈 애니메이션 런타임 |
| **PixiJS Sound** | WebAudio API 기반 오디오 |
| **@pixi/react** | React JSX 바인딩 (React 19+) |
| **PixiJS DevTools** | 브라우저 확장 - 씬 인스펙터, 성능 모니터 |

### 1.7 Plantii에 대한 적합성 평가

| 장점 | 단점 |
|------|------|
| 2D 렌더링 최고 성능 | 게임 로직 별도 구현 필요 |
| 경량 번들 (모바일 최적) | 씬 관리 직접 구축 |
| TypeScript 네이티브 | 물리/충돌 라이브러리 별도 |
| 풍부한 생태계 | Phaser 대비 높은 초기 셋업 비용 |
| 카이로소프트 스타일 도트에 최적 (nearest-neighbor 지원) | - |

**결론: Plantii에 PixiJS v8 채택 권장** - 카이로소프트 스타일 경영 시뮬 게임에 필요한 정밀한 렌더링 제어, 경량 번들, TypeScript 지원이 핵심 요구사항과 부합.

---

## 2. 파티클 시스템 라이브러리

### 2.1 후보 비교표

| 라이브러리 | 최대 파티클 (60fps) | PixiJS 통합 | 번들 크기 | 모바일 적합성 | 설정 난이도 |
|-----------|-------------------|------------|----------|-------------|-----------|
| **PixiJS v8 ParticleContainer** | 1,000,000 | 네이티브 | 0 (포함) | 최상 | 낮음 (수동 로직) |
| **@pixi/particle-emitter** | ~50,000 | 네이티브 | ~30KB | 좋음 | 낮음 (설정 기반) |
| **Proton.js** | ~50,000 | 렌더러 플러그인 | ~45KB | 좋음 | 매우 낮음 |
| **tsParticles** | ~30,000 | 별도 렌더러 | ~70KB | 보통 | 낮음 |
| **커스텀 WebGL/GLSL** | 1,000,000+ | 수동 통합 | 최소 | 최상 | 높음 |

### 2.2 각 라이브러리 상세

#### PixiJS v8 ParticleContainer (권장)

```typescript
import { ParticleContainer, Particle, Texture } from 'pixi.js';

const container = new ParticleContainer({
  dynamicProperties: {
    position: true,   // 매 프레임 위치 업데이트
    scale: false,      // 정적 (성능 최적화)
    rotation: false,
    color: false,
  },
});

const texture = Texture.from('sparkle.png');
for (let i = 0; i < 10000; i++) {
  container.addParticle(new Particle({
    texture,
    x: Math.random() * 800,
    y: Math.random() * 600,
  }));
}
```

- **장점**: 추가 의존성 없음, 최고 성능, 정적/동적 프로퍼티 분리로 GPU 최적화
- **단점**: 이미터/행동 시스템 없음, 파티클 로직 직접 구현 필요

#### @pixi/particle-emitter (보조 권장)

```typescript
const emitter = new Emitter(container, {
  lifetime: { min: 0.5, max: 1.5 },
  frequency: 0.01,
  behaviors: [
    { type: 'alpha', config: { alpha: { list: [{value:1,time:0},{value:0,time:1}] }}},
    { type: 'scale', config: { scale: { list: [{value:0.5,time:0},{value:0.1,time:1}] }}},
    { type: 'color', config: { color: { list: [{value:"ffcc00",time:0},{value:"ff6600",time:1}] }}},
    { type: 'textureSingle', config: { texture: Texture.from('particle.png') }},
    { type: 'spawnShape', config: { type: 'torus', data: { x:0, y:0, radius:5 }}},
  ],
});
```

- **장점**: 비주얼 에디터, 행동 시스템, 설정 기반 이펙트 디자인
- **단점**: ParticleContainer 대비 성능 제한, 대규모 파티클에 부적합

### 2.3 Plantii 통합 전략

```
Plantii 파티클 아키텍처:
  - 대량 파티클 (비/눈/꽃잎/먼지): PixiJS ParticleContainer
  - 이펙트 파티클 (물주기 스파클, 성장 이펙트, 수확 효과): @pixi/particle-emitter
  - 모바일: 파티클 수 동적 조절 (LOD)
```

---

## 3. 애니메이션 프레임워크

### 3.1 후보 비교표

| 프레임워크 | 번들 크기 | 성능 (대량) | 타임라인 | 이징 함수 | PixiJS 통합 | 학습 곡선 |
|-----------|----------|-----------|---------|----------|------------|----------|
| **GSAP** | ~78KB | 최상 | 최상 | 60+ 내장 | 직접 프로퍼티 조작 | 중간 |
| **Anime.js** | ~52KB | 좋음 | 좋음 | 30+ 내장 | 직접 프로퍼티 조작 | 낮음 |
| **Tween.js** | ~15KB | 보통 | 없음 | 기본 내장 | 수동 통합 | 낮음 |
| **PixiJS Ticker** | 0 (내장) | 최상 | 없음 | 직접 구현 | 네이티브 | 매우 낮음 |
| **Spine-Pixi** | ~100KB+ | 좋음 | N/A | N/A | 전용 런타임 | 높음 |

### 3.2 각 프레임워크 상세

#### GSAP (권장 - UI/트윈 애니메이션)

```typescript
import gsap from 'gsap';

// PixiJS 스프라이트에 직접 사용
gsap.to(sprite, {
  x: 400,
  y: 300,
  rotation: Math.PI * 2,
  duration: 1.5,
  ease: 'back.out(1.7)',
});

// 타임라인으로 시퀀스 관리
const tl = gsap.timeline();
tl.to(panel, { alpha: 1, duration: 0.3 })
  .to(titleText, { y: 50, duration: 0.5 }, '-=0.1')
  .to(buttons, { alpha: 1, stagger: 0.1 });
```

- **장점**: 산업 표준, 수만 개 동시 트윈 처리, 강력한 타임라인 시퀀싱, CustomEase
- **단점**: 상용 라이선스 (무료 티어 존재), 번들 크기 상대적으로 큼

#### PixiJS Ticker (권장 - 게임 루프/프레임 기반)

```typescript
app.ticker.add((ticker) => {
  // 델타 타임 기반 프레임 독립 애니메이션
  sprite.x += speed * ticker.deltaTime;
  sprite.rotation += 0.01 * ticker.deltaTime;
});
```

- **장점**: 추가 의존성 없음, 렌더 루프와 완벽 동기화, 게임 로직 통합 최적
- **단점**: 이징/시퀀싱 직접 구현 필요

#### AnimatedSprite (권장 - 스프라이트 시트 애니메이션)

```typescript
// 스프라이트 시트에서 프레임 시퀀스 생성
const sheet = await Assets.load('character.json');
const frames = Object.keys(sheet.textures).map(k => sheet.textures[k]);

const animSprite = new AnimatedSprite(frames);
animSprite.animationSpeed = 0.1666; // ~10fps
animSprite.play();
```

- **장점**: 카이로소프트 스타일 도트 애니메이션에 최적, GPU 배칭 효율적
- **단점**: 프레임 수만큼 아트 에셋 필요

### 3.3 Plantii 통합 전략

```
Plantii 애니메이션 아키텍처:
  용도별 프레임워크 분배:
  +-- 캐릭터/식물 애니메이션: AnimatedSprite (스프라이트 시트)
  +-- UI 전환/팝업/패널: GSAP (타임라인 + 이징)
  +-- 게임 루프/물리/AI: PixiJS Ticker (deltaTime)
  +-- 복잡한 캐릭터 (필요시): Spine-Pixi
```

---

## 4. 카이로소프트 스타일 도트 UI 구현

### 4.1 카이로소프트 UI의 핵심 특징

카이로소프트 게임 (Game Dev Story, Mega Mall Story, 8-Bit Farm 등)의 UI 특성:

1. **픽셀 퍼펙트 렌더링**: 안티앨리어싱 없는 선명한 도트 그래픽
2. **비트맵 폰트**: 래스터화된 도트 폰트
3. **단순한 색상 팔레트**: 제한된 컬러로 통일감
4. **9-슬라이스 패널**: 모서리 보존 스케일링
5. **즉시 반응 UI**: 트랜지션 없는 즉각적 상태 변경
6. **아이콘 중심**: 작은 도트 아이콘으로 정보 전달

### 4.2 PixiJS 픽셀 퍼펙트 설정

```typescript
import { Application } from 'pixi.js';

// 논리 해상도 (카이로소프트 스타일: 저해상도)
const GAME_WIDTH = 320;
const GAME_HEIGHT = 480;

const app = new Application();
await app.init({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: 0x1a1a2e,
  antialias: false,                      // 핵심: 안티앨리어싱 비활성화
  roundPixels: true,                     // 핵심: 정수 좌표로 반올림
  resolution: window.devicePixelRatio,
});

// 캔버스 CSS 설정
app.canvas.style.imageRendering = 'pixelated';  // 핵심: nearest-neighbor
app.canvas.style.width = '100%';
app.canvas.style.height = '100%';
app.canvas.style.objectFit = 'contain';

// 텍스처 기본 필터를 nearest로 설정
// PixiJS v8: 텍스처 로드 시 scaleMode 지정
const texture = await Assets.load({
  src: 'ui-atlas.png',
  data: { scaleMode: 'nearest' }       // 핵심: 선형 보간 비활성화
});
```

### 4.3 비트맵 폰트

```typescript
// FNT 포맷의 비트맵 폰트 로드
await Assets.load('fonts/pixel-font.fnt');

// BitmapText 사용 (Text 대비 성능 우수)
const scoreText = new BitmapText({
  text: 'Score: 0',
  style: {
    fontFamily: 'PixelFont',
    fontSize: 16,
  },
});

// 빈번한 텍스트 업데이트에 최적 (자원 카운터, 점수 등)
app.ticker.add(() => {
  scoreText.text = `Gold: ${gameState.gold}`;
});
```

**비트맵 폰트 생성 도구:**
- **bmGlyph**: TrueType -> 비트맵 폰트 변환
- **SnowB Bitmap Font**: 웹 기반 비트맵 폰트 생성기
- **Bitmap Font Creator**: 커닝 지원 비트맵 폰트 제작

### 4.4 9-슬라이스 패널 (NineSlice)

```typescript
import { NineSliceSprite, Texture } from 'pixi.js';

// 9-슬라이스로 패널 생성 (모서리 보존 스케일링)
const panelTexture = Texture.from('panel-bg.png');
const panel = new NineSliceSprite({
  texture: panelTexture,
  leftWidth: 8,    // 왼쪽 모서리 8px
  topHeight: 8,    // 상단 모서리 8px
  rightWidth: 8,   // 오른쪽 모서리 8px
  bottomHeight: 8, // 하단 모서리 8px
});
panel.width = 200;
panel.height = 150;
```

### 4.5 레트로 UI 컴포넌트 패턴

```typescript
// 도트 스타일 버튼
class PixelButton extends Container {
  constructor(label: string, width = 80, height = 24) {
    super();

    // 9-슬라이스 배경
    this.bg = new NineSliceSprite({ /* ... */ });
    this.addChild(this.bg);

    // 비트맵 텍스트 라벨
    this.label = new BitmapText({ text: label, style: { fontFamily: 'PixelFont', fontSize: 8 } });
    this.label.anchor.set(0.5);
    this.label.position.set(width / 2, height / 2);
    this.addChild(this.label);

    // 인터랙션
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', () => { this.bg.tint = 0xaaaaaa; this.label.y += 1; });
    this.on('pointerup', () => { this.bg.tint = 0xffffff; this.label.y -= 1; });
  }
}

// 도트 스타일 다이얼로그
class PixelDialog extends Container {
  constructor(title: string, message: string) {
    super();
    // 반투명 오버레이
    const overlay = new Graphics().rect(0, 0, GAME_WIDTH, GAME_HEIGHT).fill({ color: 0x000000, alpha: 0.5 });
    this.addChild(overlay);
    // 9-슬라이스 패널
    const panel = new NineSliceSprite({ /* ... */ });
    panel.position.set(GAME_WIDTH/2 - 120, GAME_HEIGHT/2 - 80);
    this.addChild(panel);
    // 타이틀 바, 메시지, 버튼 추가...
  }
}
```

### 4.6 컬러 팔레트 관리

```typescript
// 중앙 집중식 컬러 팔레트 (카이로소프트 스타일)
export const PALETTE = {
  // 기본 UI
  bg_dark:     0x1a1a2e,
  bg_medium:   0x2a2a3e,
  bg_light:    0x3a3a4e,
  // 강조색
  accent:      0x4a90e2,
  accent_light:0x6da3f0,
  accent_dark: 0x2d5c9e,
  // 텍스트
  text_white:  0xffffff,
  text_gray:   0xbbbbbb,
  text_dark:   0x333333,
  // 상태
  success:     0x4caf50,
  warning:     0xffc107,
  danger:      0xf44336,
  // 자연 (Plantii 테마)
  green_light: 0x8bc34a,
  green_dark:  0x558b2f,
  brown:       0x795548,
  sky_blue:    0x87ceeb,
} as const;
```

### 4.7 스프라이트 아틀라스 조직

```
assets/
  +-- ui/
  |   +-- ui-atlas.png          (버튼, 패널, 아이콘을 하나의 아틀라스로)
  |   +-- ui-atlas.json         (TexturePacker 메타데이터)
  +-- fonts/
  |   +-- pixel-font.fnt
  |   +-- pixel-font.png
  +-- characters/
  |   +-- farmer-atlas.png
  |   +-- farmer-atlas.json
  +-- plants/
  |   +-- plants-atlas.png
  |   +-- plants-atlas.json
```

**핵심 원칙:**
- 기능별 아틀라스 분리 (UI, 캐릭터, 식물 등)
- 한 아틀라스 내의 스프라이트 = 하나의 draw call
- 모바일용 `@0.5x` 저해상도 변형 제공

---

## 5. PWA Manifest 설정

### 5.1 게임용 manifest.json 모범 사례

```json
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
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/gameplay.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Gameplay screen"
    }
  ],
  "prefer_related_applications": false,
  "display_override": ["window-controls-overlay", "standalone"]
}
```

### 5.2 주요 설정 항목 설명

| 항목 | 게임 권장값 | 이유 |
|------|-----------|------|
| `display` | `standalone` | 브라우저 UI 숨김, 앱 느낌. `fullscreen`은 iOS에서 미지원 |
| `orientation` | `portrait` | 카이로소프트 스타일 = 세로 모드 |
| `theme_color` | 게임 배경색 | 상태바/타이틀바 색상 통일 |
| `background_color` | 게임 배경색 | 스플래시 스크린 배경 |
| `start_url` | `/` | 오프라인 시 시작점 |
| `scope` | `/` | PWA 범위 제한 |

### 5.3 아이콘 사이즈 가이드

```
필수:
  - 192x192 (Android 홈 스크린)
  - 512x512 (Android 스플래시/스토어)

권장 추가:
  - 72x72, 96x96, 128x128, 144x144, 152x152, 384x384

Maskable 아이콘:
  - 192x192, 512x512 (purpose: "maskable")
  - 안전 영역: 중앙 80% 내에 핵심 콘텐츠 배치
  - purpose를 "any maskable"으로 합치지 말고 별도 항목으로 분리

Apple Touch Icon (HTML에서 추가):
  <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png">
```

### 5.4 Service Worker 캐싱 전략

```typescript
// service-worker.ts
const CACHE_NAME = 'plantii-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/game.js',
  '/style.css',
  // 핵심 게임 에셋
  '/assets/ui/ui-atlas.png',
  '/assets/ui/ui-atlas.json',
  '/assets/fonts/pixel-font.fnt',
  '/assets/fonts/pixel-font.png',
];

// Install: 핵심 에셋 프리캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

// Fetch: 게임 에셋은 Cache-First, API는 Network-First
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    // Cache-First: 게임 에셋 (스프라이트, 오디오, 폰트)
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      }))
    );
  } else if (url.pathname.startsWith('/api/')) {
    // Network-First: API 호출
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    // Stale-While-Revalidate: HTML/JS/CSS
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          return response;
        });
        return cached || fetchPromise;
      })
    );
  }
});
```

### 5.5 iOS Safari PWA 제한 사항과 워크어라운드

| 제한 | 워크어라운드 |
|------|-----------|
| `fullscreen` display 미지원 | `standalone` 사용 |
| 백그라운드 오디오 자동 중단 | 포그라운드 복귀 시 오디오 재개 로직 |
| 50MB 캐시 제한 | 에셋 최적화, 점진적 캐싱 |
| Push Notification 제한적 | 인앱 알림 UI 대체 |
| `orientation` lock 미지원 | CSS `@media (orientation: landscape)` + 회전 안내 오버레이 |
| 설치 배너 없음 | 커스텀 "홈 화면에 추가" 안내 UI |
| Service Worker 주기적 삭제 | 앱 실행 시 캐시 무결성 검증 |

```html
<!-- iOS 전용 메타 태그 -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Plantii">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png">

<!-- iOS 스플래시 스크린 -->
<link rel="apple-touch-startup-image"
      media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
      href="/splash/splash-1170x2532.png">
```

### 5.6 오프라인 게임플레이 지원

```
오프라인 전략:
  1. 핵심 게임 로직: 100% 클라이언트 사이드 (PixiJS + 로컬 상태)
  2. 세이브 데이터: IndexedDB 저장 (localStorage는 5MB 제한)
  3. 에셋: Service Worker 캐시 (Cache-First)
  4. 동기화: 온라인 복귀 시 서버에 세이브 동기화 (Background Sync API)
  5. 상태 표시: 오프라인/온라인 상태 UI 인디케이터
```

---

## 6. 통합 아키텍처 권장안

### 6.1 기술 스택 요약

```
+----------------------------------------------------------+
|                    Plantii Tech Stack                     |
+----------------------------------------------------------+
| 렌더링 엔진    | PixiJS v8 (TypeScript 네이티브)             |
| UI 컴포넌트    | @pixi/ui + 커스텀 도트 UI 시스템             |
| 레이아웃       | PixiJS Layout (Yoga flexbox)               |
| 애니메이션     | GSAP (UI) + Ticker (게임루프) + AnimatedSprite |
| 파티클        | ParticleContainer + @pixi/particle-emitter   |
| 오디오        | PixiJS Sound                                |
| 폰트         | BitmapText (커스텀 도트 폰트)                  |
| 빌드         | Vite + TypeScript                           |
| 배포         | PWA (manifest + Service Worker)              |
| 저장         | IndexedDB (idb-keyval)                      |
| 디버깅        | PixiJS DevTools                             |
+----------------------------------------------------------+
```

### 6.2 프로젝트 구조 (권장)

```
frontend/
  +-- public/
  |   +-- manifest.json
  |   +-- service-worker.js
  |   +-- icons/
  |   +-- assets/
  |       +-- ui/           (UI 아틀라스)
  |       +-- fonts/        (비트맵 폰트)
  |       +-- plants/       (식물 스프라이트)
  |       +-- characters/   (캐릭터 스프라이트)
  |       +-- particles/    (파티클 텍스처)
  |       +-- audio/        (효과음/BGM)
  +-- src/
      +-- main.ts           (앱 진입점)
      +-- game/
      |   +-- Game.ts       (게임 컨트롤러)
      |   +-- scenes/       (씬 관리)
      |   +-- entities/     (식물, 캐릭터 등)
      |   +-- systems/      (경제, 성장, 날씨)
      +-- ui/
      |   +-- components/   (PixelButton, PixelPanel, PixelDialog)
      |   +-- screens/      (MainMenu, GameHUD, Shop, Inventory)
      |   +-- theme.ts      (컬러 팔레트, 폰트 설정)
      +-- engine/
      |   +-- SceneManager.ts
      |   +-- AssetManager.ts
      |   +-- ParticleManager.ts
      |   +-- AnimationManager.ts
      |   +-- SaveManager.ts
      +-- utils/
          +-- math.ts
          +-- constants.ts
```

### 6.3 성능 목표

| 지표 | 데스크톱 | 모바일 (중급) | 모바일 (저사양) |
|------|---------|-------------|---------------|
| FPS | 60fps | 60fps | 30fps |
| Draw Calls | < 50 | < 30 | < 20 |
| 메모리 | < 200MB | < 100MB | < 50MB |
| 초기 로드 | < 2초 | < 3초 | < 5초 |
| 번들 크기 | < 500KB (gzip) | 동일 | 동일 |

### 6.4 장단점 종합

| 기술 선택 | 장점 | 단점 | 대안 |
|----------|------|------|------|
| PixiJS v8 | 최고 2D 성능, TS 네이티브, 경량 | 게임 로직 직접 구축 | Phaser 3 |
| GSAP | 타임라인 시퀀싱, 이징 풍부 | 라이선스 비용 (상용) | Anime.js |
| ParticleContainer | 100만 파티클 | 이미터 로직 수동 | @pixi/particle-emitter |
| BitmapText | 빈번한 텍스트 갱신에 최적 | 폰트 제작 필요 | Text (소량일 때) |
| PWA + SW | 오프라인 지원, 앱 스토어 불필요 | iOS 제한, 캐시 관리 복잡 | Capacitor/TWA |
| IndexedDB | 대용량 세이브, 구조화 데이터 | API 복잡 | idb-keyval 래퍼 사용 |
