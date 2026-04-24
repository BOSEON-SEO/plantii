# Plantii Phase 2 - Step-1 기술 계획서 최종 검증 보고서

> **Reviewer**: Claude Opus 4.6 (독립 검증)
> **Review Date**: 2026-04-24
> **Target Document**: `docs/MILESTONE_TECHNICAL_PLAN.md` v1.0
> **Cross-Reference**: `PIXI_MIGRATION_PLAN.md`, `PIXI_MIGRATION_REVIEW.md`, `SPRITE_ANALYSIS.md`, `TECH_RESEARCH.md`, `SCENARIO_YEAR_SYSTEM_DESIGN.md`, `MILESTONE_REVIEW_REPORT.md`, `VALIDATION_REPORT.md`, Frontend/Backend `package.json`, 실제 소스 코드
> **Prior Review**: `MILESTONE_TECHNICAL_PLAN_REVIEW.md` (동일 날짜, 별도 에이전트)
> **Status**: **CONDITIONAL APPROVAL - 6건 필수 수정, 5건 권장 수정, 수정 후 즉시 착수 가능**

---

## 0. 검증 범위 및 방법론

본 보고서는 4가지 관점에서 기술 계획서를 독립 검증한다:

| # | 검증 관점 | 방법 |
|---|----------|------|
| (1) | 기술 선택 vs 릴리즈 후보(RC) 목표 부합성 | 6개 영역별 선택 근거를 프로젝트 제약 조건(React 18, Express, PG, PixiJS v8)과 대조 |
| (2) | 모바일 성능 (60fps, 저전력) 달성 가능성 | Draw call 수, 번들 크기, GPU/CPU 부하를 중저가 모바일 기기 기준으로 산정 |
| (3) | 기술 간 의존성 및 구현 순서 타당성 | 의존성 그래프를 코드 레벨에서 재구성, PIXI_MIGRATION_PLAN과의 시간축 정합 |
| (4) | 누락/충돌 항목 | 다른 설계 문서(5개)와의 교차 검증, 실제 package.json/코드와의 차이 식별 |

---

## 1. 종합 판정

### 1.1 점수 요약

| 검증 관점 | 점수 | 판정 |
|-----------|------|------|
| (1) 기술 선택 vs RC 목표 | **8.5 / 10** | PASS |
| (2) 모바일 60fps / 저전력 | **7.0 / 10** | CONDITIONAL |
| (3) 의존성 / 구현 순서 | **6.0 / 10** | CONDITIONAL - 구조적 수정 필요 |
| (4) 누락 / 충돌 | **6.5 / 10** | CONDITIONAL - 11건 이슈 확인 |
| **종합** | **7.0 / 10** | **CONDITIONAL APPROVAL** |

### 1.2 핵심 발견 3건 (Blocker-Class)

| 순위 | 발견 | 영향 | 근거 |
|------|------|------|------|
| **B-1** | PIXI_MIGRATION_PLAN(10주)과 Phase 2(6주)의 시간축 관계가 정의되지 않아 전체 일정이 비현실적 | 일정 산출 무효화 | 두 계획이 같은 PixiJS 설치를 전제하면서 주차 겹침 |
| **B-2** | `@pixi/react` v8은 React 19+ 필수, 현재 프로젝트는 React 18.2 -> 빌드 에러 확정 | 런타임 장애 | `frontend/package.json` line 14: `"react": "^18.2.0"` |
| **B-3** | 상태 관리 전략이 3개 문서에서 불일치 (Redux Toolkit / Zustand / React Context 혼재) | 아키텍처 분열 | 계획서 saveSlice(RTK) vs SCENARIO_YEAR(Zustand) vs 코드(AuthContext) |

---

## 2. 검증 (1): 기술 선택 vs 릴리즈 후보 목표 부합성

### 2.1 영역별 평가

| 영역 | 선택 | RC 부합도 | 판정 | 상세 근거 |
|------|------|----------|------|----------|
| (1) 칩튠 BGM | @pixi/sound + 프리메이드 OGG/MP3 | **적합** | PASS | PixiJS Assets 파이프라인 네이티브 통합. 번들 ~15KB. 실시간 합성 배제는 올바른 판단 - 게임 UX에 불필요한 복잡도 회피 |
| (2) 터치 제스처 | PixiJS 내장 이벤트 + 커스텀 인식기 | **적합** | PASS | Hammer.js(유지보수 중단) 배제 올바름. 필요 제스처(tap/longpress/swipe/drag)가 제한적이므로 풀 라이브러리 불필요. FederatedEvent가 Canvas 내 최적 |
| (3) PWA 푸시 | Web Push API + web-push(서버) | **적합** | PASS | 자체 Express 백엔드 보유 -> FCM/OneSignal 의존 불필요. 알림 유형 단순(물주기/수확). VAPID 키 관리 직접 제어 가능 |
| (4) 클라우드 세이브 | REST API 직접 + 낙관적 동기화 | **적합** | PASS | 기존 Express+PG+Knex 완비. 게임 데이터 단순(식물 상태, 인벤토리). Firebase/Supabase 이중 DB 관리 회피는 합리적 |
| (5) 스프라이트/배칭 | PixiJS v8 + TexturePacker 아틀라스 | **적합** | PASS | PIXI_MIGRATION_PLAN과 일치. nearest-neighbor 필터링으로 픽셀아트 선명도 보장. 자동 WebGL 배칭 |
| (6) 다국어 | react-i18next + TypeScript 키 타이핑 | **적합** | PASS | 가장 성숙한 React i18n 생태계. 네임스페이스 분리, lazy 로딩. 기존 plant 데이터에 name_ko/name_en 이미 존재 |

### 2.2 강점 종합

**A. PixiJS 생태계 일관성** - (1)(2)(5)가 동일 렌더링 엔진 생태계 내에서 해결. 패키지 간 버전 충돌 최소화, Assets 로딩 패턴 통일.

**B. 외부 서비스 의존성 제로** - FCM, OneSignal, Firebase, Supabase 모두 배제하고 자체 인프라(Express+PG) 재활용. 장기 유지보수 비용 절감, 벤더 락인 방지.

**C. 번들 크기 의식적 통제** - 각 영역별 gzipped 크기를 명시하고, 총 ~185KB로 산정. 다만 이전 마이그레이션 추가분을 합산하면 초과 (아래 ISSUE-1).

### 2.3 이슈

#### ISSUE-1: 총 번들 크기 누적 과소평가 [Severity: HIGH]

계획서 Section 8.3의 "프론트엔드 추가 번들 ~185KB gzipped"는 Phase 2 추가분만 계산. PIXI_MIGRATION_PLAN 추가분을 합산하면:

```
기존 (React 18 + Router + RTK + Axios + date-fns):       ~70KB
PIXI_MIGRATION 추가:
  pixi.js v8:                                              ~150KB
  gsap:                                                    ~26KB
  @pixi/particle-emitter:                                  ~30KB
Phase 2 추가 (본 계획서):
  @pixi/sound:                                             ~15KB
  i18next + react-i18next + detector:                      ~15KB
  web-push (백엔드만):                                       0KB
--------------------------------------------------------------
총 프론트엔드 번들:                                         ~306KB gzipped
```

PIXI_MIGRATION_REVIEW의 "<250KB app JS" 타겟을 **56KB 초과**.

> **필수 조치**: 번들 예산을 Phase 전체 기준으로 재계산. PixiJS v8 트리 셰이킹(`import { Application, Sprite } from 'pixi.js'` 선택적 임포트) + 게임 에셋의 lazy import(`React.lazy` + `Suspense`)로 초기 로드 <150KB, 게임 진입 시 추가 로드 ~150KB 전략 명시.

#### ISSUE-2: @pixi/react v8의 React 18 비호환 [Severity: BLOCKER]

`frontend/package.json` line 14: `"react": "^18.2.0"`
`@pixi/react` v8은 `peerDependencies`에 React 19+를 요구.

다행히 PIXI_MIGRATION_PLAN의 `GameShell.tsx`는 수동 canvas ref 패턴(`useRef` + `useEffect`에서 `new Application()`)을 사용하므로 `@pixi/react` 없이 동작.

> **필수 조치**: Section 5.9, Section 8.3에서 `@pixi/react` 제거. 번들 예산에서 ~5KB 차감.

---

## 3. 검증 (2): 모바일 성능 (60fps, 저전력) 달성 가능성

### 3.1 영역별 성능 영향도

| 영역 | 런타임 성능 영향 | 60fps 가능 | 근거 |
|------|---------------|-----------|------|
| (1) 칩튠 BGM | **무시** | Yes | Web Audio API 디코딩은 별도 스레드. OGG/MP3 재생은 GPU/CPU 영향 <0.1% |
| (2) 터치 제스처 | **최소** | Yes | FederatedEvent는 렌더 루프와 분리. passive 리스너 + rAF 쓰로틀링 적용 시 이벤트 부하 무시 |
| (3) PWA 푸시 | **제로** | N/A | Service Worker는 별도 프로세스. 게임 메인 스레드에 무관 |
| (4) 클라우드 세이브 | **낮음** | Yes | debounce(5분) + 비동기 네트워크 I/O. localStorage 쓰기 ~1ms |
| (5) 스프라이트/배칭 | **핵심** | Yes (조건부) | 아래 상세 분석 |
| (6) 다국어 | **무시** | Yes | `t()` 호출은 해시맵 룩업 <0.01ms. 초기화 1회성 |

### 3.2 스프라이트/배칭 성능 상세 분석

계획서 Section 5.6의 "~6 draw calls" 예상을 검증:

```
논리 해상도: 320x480 (Kairosoft 스타일)
동시 표시 스프라이트: ~9개 플롯 (정원 3x3) + UI 요소 ~20개 = ~30개
아틀라스 텍스처: 1024x1024 (식물) + 512x512 (UI) = VRAM ~5MB
파티클: ParticleContainer 200~300개 (날씨 이펙트)

예상 Draw Calls:
  배경 TilingSprite:        1
  정원 그리드 (같은 아틀라스): 1 (자동 배칭)
  식물들 (plants 아틀라스):   1 (자동 배칭)
  파티클 (effects):          1 (ParticleContainer)
  UI 오버레이 (ui 아틀라스):   1 (자동 배칭)
  텍스트 (BitmapText):       1
  ----------------------------------
  합계:                       6 draw calls
```

**판정: 달성 가능.** 중저가 모바일(Snapdragon 665급, Mali-G52)에서 6 draw calls + 300 파티클은 60fps 안정 영역. 단, 아래 3건의 성능 anti-pattern 수정 필수.

### 3.3 성능 Anti-Pattern 미반영 [PIXI_MIGRATION_REVIEW에서 식별]

#### ISSUE-3: DayNightSystem 매 프레임 Graphics 재생성 [Severity: MEDIUM]

PIXI_MIGRATION_PLAN의 `DayNightSystem`이 매 프레임 `Graphics.clear() + rect() + fill()`을 호출. 색상이 변경되지 않는 프레임에서도 GPU 커맨드 버퍼를 재생성하므로 불필요한 오버헤드.

> **권장 조치**: Section 5.7에 "DayNightSystem: 색상 delta > threshold(0.01)일 때만 Graphics 갱신" 추가.

#### ISSUE-4: ColorMatrixFilter extra render pass [Severity: MEDIUM]

전체 게임 레이어에 `ColorMatrixFilter`를 적용하면 추가 렌더 패스가 발생하여 draw call이 사실상 2배.

> **권장 조치**: `Container.tint`로 ambient lighting 처리. filter 대비 GPU 부하 ~90% 감소.

#### ISSUE-5: 저사양 기기 LOD(Level of Detail) 전략 부재 [Severity: MEDIUM]

계획서 Section 5.8에 "성능 프로파일링 + 최적화"를 3시간으로 배정했으나 구체적 기준 없음.

> **권장 조치**: Section 5.7에 LOD 전략 추가:
> - `navigator.deviceMemory < 4GB` 또는 `navigator.hardwareConcurrency < 4`: 파티클 50% 감소, 날씨 이펙트 비활성화
> - 런타임 FPS 모니터링: 연속 3초간 < 45fps 시 ParticleContainer 동적 축소
> - 설정 UI에 "저사양 모드" 토글 제공

### 3.4 저전력 달성 분석

| 전력 소비 요인 | 계획서 대응 | 판정 |
|--------------|-----------|------|
| GPU 렌더링 | 320x480 저해상도 + 6 draw calls | OK |
| CPU (게임 루프) | Ticker 기반, dirty flag 패턴 | OK |
| 오디오 | `document.hidden` 시 BGM 일시정지 (Section 1.5) | OK |
| 네트워크 | 자동 세이브 debounce 5분 + SW 캐시 | OK |
| **비활성 탭** | **미언급** | **추가 필요** |

> **권장**: `visibilitychange` 이벤트에서 `app.ticker.stop()` / `app.ticker.start()` 호출로 비활성 탭에서 렌더 루프 완전 정지. 배터리 소모 방지.

---

## 4. 검증 (3): 기술 간 의존성 및 구현 순서 타당성

### 4.1 계획서 의존성 맵 검증

계획서 Section 7의 의존성 그래프를 코드 레벨에서 재검증:

```
계획서 주장                              실제 검증
--------------------------------------  ----------------------------------------
(5) -> (1): PixiJS 설치 후 @pixi/sound  OK. @pixi/sound은 pixi.js peer dependency
(5) -> (2): PixiJS 설치 후 FederatedEvent OK. EventSystem은 Application에 포함
(1)+(2) -> (6): 텍스트 확정 후 다국어    *** 잘못됨 *** (ISSUE-6)
(6) -> (3): 알림 텍스트 다국어화 후 푸시  부분적 OK. 서버 측 번역은 병렬 가능
(4): 독립                              OK. Express+PG REST API는 PixiJS 무관
```

#### ISSUE-6: 다국어(i18n) 의존성 위치 오류 [Severity: HIGH]

계획서는 다국어를 Sprint 3(Week 5-6)에 배치하고 "(1) BGM + (2) 터치의 텍스트가 확정된 후"라는 의존성을 주장. 그러나:

1. `react-i18next`는 **React 레이어**에서 동작 -> PixiJS와 **완전히 독립** 설치/적용 가능
2. 기존 React 페이지(Login, Register, Profile, Dashboard, Collection)에 **즉시** i18n 적용 가능
3. BGM 영역에 "텍스트"는 없음 (파일명과 볼륨 설정뿐)
4. 터치 영역에 "텍스트"는 없음 (제스처 이벤트 콜백뿐)
5. PixiJS `BitmapText` 연동은 `i18n.t()` 직접 호출 한 줄로 해결 -> 최종 통합 단계에서 5분 작업

**수정된 의존 관계:**
```
(6) 다국어: 선행 의존 없음 -> Sprint 1에서 (5)와 병렬, 심지어 PIXI_MIGRATION 기간에도 병렬 시작 가능
(3) 푸시:  (6)의 서버 측 번역 파일만 필요 -> (6) 착수 후 1주 뒤 시작 가능
```

> **필수 조치**: 의존성 맵(Section 7) 수정. 다국어를 독립 모듈로 재배치하여 가장 이른 시점에 착수.

#### ISSUE-7: Sprint 배정 불균형 + (5) 중복 시간 [Severity: HIGH]

```
현재 계획:
  Sprint 1 (Week 1-2): (5) 44h + (4 백엔드) ~12h = ~56h  <-- 2주에 56h: 비현실적
  Sprint 2 (Week 3-4): (1) 22h + (2) 20h + (4 프론트) ~13h = ~55h
  Sprint 3 (Week 5-6): (6) 23h + (3) 20h = ~43h

문제점:
  - (5)의 44h 중 ~34h는 PIXI_MIGRATION_PLAN Phase 1-3과 중복
    (PixiJS 설치, Application 설정, 스프라이트 렌더링, 정원 그리드 = 모두 Migration에서 구현)
  - Phase 2 고유 신규 작업은 아틀라스 빌드 파이프라인(3h) + 배칭 최적화(3h) + 성능 프로파일링(3h) = ~10h
  - Sprint 1에 44h 배정은 34h 이중 계산
```

> **필수 조치**: (5)의 시간을 PIXI_MIGRATION 중복 제거 후 ~10h로 재산정. 절약된 ~34h를 통합 테스트, 성능 최적화, 버퍼에 재배분.

#### ISSUE-8: PIXI_MIGRATION_PLAN과의 시간축 관계 미정의 [Severity: BLOCKER]

```
PIXI_MIGRATION_PLAN:                    MILESTONE_TECHNICAL_PLAN:
  Phase 1 (Week 1-2): Foundation          Sprint 1 (Week 1-2): 스프라이트
  Phase 2 (Week 3-4): Plant Display       Sprint 2 (Week 3-4): BGM + 터치
  Phase 3 (Week 5-6): Animation           Sprint 3 (Week 5-6): 다국어 + 푸시
  Phase 4 (Week 7-8): PWA + Polish
  (+2주 버퍼 = 10주)

질문: 순차? 병렬? 동시 시작?
  -> 순차라면 총 16~19주 (4~5개월)
  -> 부분 병렬이라면 ~14주
  -> 완전 병렬은 불가 (PixiJS 설치가 선행되어야 함)
```

> **필수 조치**: 두 계획의 시간축 관계를 명시적으로 정의. 아래 Section 5의 수정안 참조.

### 4.2 수정된 의존성 맵

```
[독립 트랙 - Migration과 병렬 가능]
  (6) KO/EN 다국어 (react-i18next) -----> 선행 의존: 없음
  (4) 클라우드 세이브 백엔드 (REST API) -> 선행 의존: 없음

[PixiJS 의존 트랙 - Migration Phase 2 완료 후]
  (5) 스프라이트 아틀라스 신규분 (10h) --> 선행: PIXI_MIGRATION Phase 2
       |          |
       v          v
  (1) 칩튠 BGM   (2) 터치 제스처
  (@pixi/sound)   (FederatedEvent)

[후행 트랙]
  (3) PWA 푸시 알림 -----> 선행: (6) 서버 번역 파일
  (4) 클라우드 세이브 프론트엔드 -> 선행: PixiJS 게임 상태 확정
```

---

## 5. 검증 (4): 누락/충돌 항목

### 5.1 문서 간 충돌

#### ISSUE-9: 상태 관리 전략 불일치 [Severity: HIGH]

| 출처 | 상태 관리 선택 |
|------|-------------|
| `frontend/package.json` (현재 코드) | `@reduxjs/toolkit` + `react-redux` |
| 기술 계획서 Section 4.5 | Redux `saveSlice` |
| `SCENARIO_YEAR_SYSTEM_DESIGN.md` Section 11.3 | Zustand `gameSessionStore` |
| `MILESTONE_REVIEW_REPORT.md` Section 6.2 | "Zustand 도입" 권장 |
| `frontend/src/contexts/AuthContext.tsx` (현재 코드) | React Context |

3가지 상태 관리 패턴이 혼재. RC 품질에서 이는 유지보수 악몽.

> **필수 조치**: 하나로 통일.
> - **Option A (권장)**: 기존 Redux Toolkit 유지. 신규 상태를 모두 slice로 추가. 마이그레이션 비용 제로. RC 단계에서 라이브러리 교체는 고위험.
> - **Option B**: Zustand 전환. 보일러플레이트 감소, 번들 ~2KB. 단, 기존 RTK 코드 마이그레이션 필요 (+8~12h).

#### ISSUE-10: Service Worker 변경 충돌 [Severity: MEDIUM]

- PIXI_MIGRATION_PLAN Section 7.3: SW를 **완전 재작성** (3가지 캐싱 전략: Cache-First/StaleWhileRevalidate/Network-First)
- 기술 계획서 Section 3.5: 기존 SW에 **push 핸들러 추가**

두 계획이 같은 `service-worker.js`를 수정하며 순서에 따라 한쪽 변경이 소실될 수 있음.

> **권장 조치**: PIXI_MIGRATION Phase 4에서 SW 재작성 시 push 핸들러까지 통합 구현. 단일 변경점으로 관리.

#### ISSUE-11: GSAP 라이선스 리스크 [Severity: LOW]

PIXI_MIGRATION_PLAN에서 UI 애니메이션에 GSAP을 사용. Plantii가 상용 출시될 경우 GSAP 유료 라이선스(Business Green) 필요 가능성. 기술 계획서가 직접 GSAP을 사용하지는 않으나, (5) 스프라이트/배칭이 GSAP에 의존.

> **권장 조치**: Section 8.4 리스크에 "GSAP 상용 라이선스 확인. 불가 시 Anime.js(MIT, ~16KB gzipped) 대체" 추가.

### 5.2 누락 항목

| # | 누락 항목 | 영향도 | 대응 |
|---|----------|--------|------|
| N-1 | 한글 BitmapFont 서브셋 생성 파이프라인 미정의 (완성형 한글 2,350자) | 중 | PixiJS `Text`(Canvas 기반)를 한글 폴백으로 사용. ASCII만 BitmapText |
| N-2 | WebGL context loss 핸들러 미계획 | 높음 | `renderer.on('context-lost')` 에서 게임 상태 저장 + 재초기화 루틴 |
| N-3 | 모바일 100vh 뷰포트 이슈 (주소창에 의한 높이 변동) | 중 | CSS `dvh` 단위 또는 JS `window.visualViewport.height` 동적 계산 |
| N-4 | iOS safe area insets (노치 대응) | 중 | CSS `env(safe-area-inset-*)` + 게임 캔버스 padding 조정 |
| N-5 | 오프라인 -> 온라인 전환 시 세이브 동기화 큐 재시도 전략 | 중 | `navigator.onLine` + `online` 이벤트에서 큐 flush, 지수 백오프 |

### 5.3 영역 내부 정합성 검증 (OK 항목)

| 검증 항목 | 결과 |
|----------|------|
| @pixi/sound v6과 pixi.js v8 호환 | OK - v6은 PixiJS v8용 릴리즈 |
| PointerEvent API 브라우저 지원 | OK - caniuse 98%+ |
| `web-push` + 기존 `node-cron` 호환 | OK - node-cron 이미 backend에 설치 |
| iOS Safari 16.4+ PWA 푸시 제한 인지 | OK - 계획서에서 PWA 설치 유도 전략 기술 |
| Knex + PostgreSQL JSONB 세이브 | OK - 기존 인프라 |
| 식물 카탈로그 name_ko/name_en 기존 존재 | OK - TECHNICAL_DESIGN.md에서 확인 |
| free-tex-packer-core CI 호환 | OK - prebuild 스크립트로 자동화 가능 |

---

## 6. 최종 실행 계획 (수정안)

### 6.1 전제 조건

```
PIXI_MIGRATION_PLAN이 선행되어야 하는 항목:
  - PixiJS v8 설치 + GameShell + AssetManager (Phase 1, Week 1-2)
  - PlantEntity + GameHUD 렌더링 (Phase 2, Week 3-4)

PIXI_MIGRATION과 병렬 가능한 항목:
  - (6) 다국어: React UI 레이어에서 독립 작동
  - (4) 클라우드 세이브 백엔드: Express REST API, PixiJS 무관
  - (5) 스프라이트 아틀라스 빌드 파이프라인: free-tex-packer 설정만 (PixiJS 런타임 불필요)
```

### 6.2 수정된 통합 타임라인

```
=== Phase A: PIXI_MIGRATION + 병렬 작업 (Week 1-4) ===

Week 1-2: Foundation
  [Migration] PixiJS v8 설치, GameShell, AssetManager, 기본 렌더링
  [병렬-6]    i18next + react-i18next 설치, 번역 파일 구조 설계        (5h)
  [병렬-6]    KO 원본 텍스트 추출, Login/Register/Profile i18n 적용    (5h)
  [병렬-4]    백엔드 save_data DB 마이그레이션                          (1h)

Week 3-4: Plant Display + HUD
  [Migration] PlantEntity, GameHUD, 기본 인터랙션
  [병렬-4]    백엔드 save.service + CRUD 엔드포인트 + 버전 충돌 로직    (8h)
  [병렬-6]    EN 번역 작성 + Dashboard/Collection i18n 적용             (8h)
  [병렬-5]    스프라이트 아틀라스 빌드 파이프라인 (free-tex-packer)      (3h)

=== Phase B: Phase 2 핵심 구현 (Week 5-8) ===

Week 5-6: Sprint A - 게임 인터랙션
  (1) 칩튠 BGM: AudioManager + @pixi/sound + BGM 3곡 + SFX 5종       (22h)
  (2) 터치 제스처: GestureRecognizer + InputManager + 게임 매핑        (20h)
  (5) 배칭 최적화: 뷰포트 컬링 + 오브젝트 풀링 + 성능 프로파일링       (7h)

Week 7-8: Sprint B - 세이브 프론트 + 알림
  (4) 클라우드 세이브 프론트: syncManager + 자동 세이브 + 충돌 UI      (16h)
  (3) PWA 푸시 알림: VAPID + SW push 핸들러 + NotificationConsent     (20h)
  (6) 다국어 마무리: PixiJS BitmapText 연동 + 알림 텍스트 + 카탈로그   (5h)

=== Phase C: 통합 + RC 준비 (Week 9-10) ===

Week 9: 통합 테스트
  6개 영역 교차 검증 (BGM+터치+세이브+알림+다국어+렌더링)              (8h)
  모바일 디바이스 테스트 (iOS Safari + Android Chrome)                  (6h)
  성능 프로파일링: 번들 크기 검증 + draw call 확인 + FPS 모니터링       (4h)

Week 10: 버퍼 + 폴리시
  버그 수정 + 크로스브라우저 검증                                      (8h)
  번들 스플리팅/트리 셰이킹 최종 검증                                   (4h)
  릴리즈 노트 + 배포 체크리스트                                        (4h)
```

### 6.3 수정된 소요시간 비교

| 영역 | 원래 | 수정 | 변경 사유 |
|------|------|------|----------|
| (5) 스프라이트/배칭 | 44h | **10h** | PIXI_MIGRATION과 34h 중복 제거. 신규분(아틀라스 파이프라인 3h + 배칭 최적화 4h + 프로파일링 3h)만 |
| (4) 클라우드 세이브 | 25h | 25h | 변경 없음 |
| (6) 다국어 | 23h | 23h | 총량 동일, 시작 시점을 Week 1로 앞당김 (Phase A에 분산) |
| (1) 칩튠 BGM | 22h | 22h | 변경 없음 |
| (2) 터치 제스처 | 20h | 20h | 변경 없음 |
| (3) PWA 푸시 | 20h | 20h | 변경 없음 |
| 통합/테스트/버퍼 | 미배정 | **30h** | 신규 추가 (RC 품질 달성에 필수) |
| **합계** | **154h** | **150h** | -4h (중복 제거 -34h, 테스트 추가 +30h) |

### 6.4 일정 요약

| 구간 | 기간 | 비고 |
|------|------|------|
| Phase A (Migration + 병렬) | Week 1-4 | PIXI_MIGRATION Phase 1-2와 동시 진행 |
| Phase B (Phase 2 핵심) | Week 5-8 | Migration Phase 3-4와 일부 겹침 가능 |
| Phase C (통합 + RC) | Week 9-10 | 버퍼 포함 |
| **총 기간** | **10주** | PIXI_MIGRATION(10주)과 통합하여 단일 타임라인 |

---

## 7. 리스크 레지스터

### 7.1 기술 리스크

| ID | 리스크 | 확률 | 영향 | 완화 전략 |
|----|--------|------|------|----------|
| R-1 | **@pixi/react React 18 비호환** | 확정 | BLOCKER | 의존성에서 제거. 수동 canvas ref 패턴 사용 (이미 계획됨) |
| R-2 | **상태 관리 혼재 (Redux vs Zustand)** | 확정 | HIGH | Redux Toolkit 유지로 통일 결정 |
| R-3 | **번들 크기 ~306KB > 250KB 타겟** | 높음 | HIGH | 코드 스플리팅 + 트리 셰이킹 + lazy import. 초기 로드 <150KB 타겟 |
| R-4 | iOS Safari 오디오 잠금 | 높음 | MEDIUM | 첫 인터랙션에서 `AudioContext.resume()` 명시적 호출 |
| R-5 | iOS Safari 푸시 미지원 (비PWA) | 높음 | MEDIUM | PWA 설치 유도 배너 + 인앱 폴백 알림 |
| R-6 | 스프라이트 아트 제작 병목 (18h 디자인) | 중 | HIGH | AI 픽셀아트 도구 활용 또는 에셋 스토어. PIXI_MIGRATION과 공유 |
| R-7 | WebGL context loss (모바일) | 중 | HIGH | context-lost 핸들러에서 게임 상태 localStorage 저장 + 재초기화 |
| R-8 | 한글 BitmapFont 2,350자 생성 | 중 | MEDIUM | 한글은 PixiJS `Text`(Canvas), ASCII만 `BitmapText` |
| R-9 | GSAP 상용 라이선스 | 낮음 | MEDIUM | Anime.js(MIT) 대체 계획 수립 |

### 7.2 일정 리스크

| ID | 리스크 | 확률 | 영향 | 완화 전략 |
|----|--------|------|------|----------|
| S-1 | PIXI_MIGRATION 지연으로 Phase B 시작 밀림 | 중 | HIGH | 병렬 가능 항목(다국어, 세이브 백엔드)을 Phase A에서 최대한 진행 |
| S-2 | 6개 영역 통합 시 예상치 못한 충돌 | 중 | HIGH | Phase C에 30h 통합 테스트 + 버퍼 배정 |
| S-3 | 크로스 브라우저/디바이스 이슈 폭발 | 중 | MEDIUM | 주요 타겟 3개 (Chrome Android, Safari iOS, Chrome Desktop)만 우선 지원 |

---

## 8. 필수 조치 체크리스트

### MUST FIX (구현 전 반드시 수정 - 6건)

- [ ] **ISSUE-1**: 번들 크기 예산을 Phase 전체 기준으로 재계산. 코드 스플리팅 + 트리 셰이킹 전략 Section 8에 명시
- [ ] **ISSUE-2**: `@pixi/react` 의존성 제거 (Section 5.9, 8.3). 수동 canvas ref 패턴 명시
- [ ] **ISSUE-6**: 다국어(i18n) 의존성 위치 수정 - 독립 모듈로 재배치, Phase A(Week 1)부터 시작
- [ ] **ISSUE-7**: Sprint 배정 재균형. (5)의 PIXI_MIGRATION 중복 34h 제거, 통합 테스트 30h 추가
- [ ] **ISSUE-8**: PIXI_MIGRATION_PLAN과의 시간축 관계를 "Phase A = Migration + 병렬, Phase B = Phase 2 전용"으로 명시
- [ ] **ISSUE-9**: 상태 관리 전략을 Redux Toolkit으로 통일 결정. 모든 문서에 반영

### SHOULD FIX (구현 중 반영 권장 - 5건)

- [ ] **ISSUE-3**: DayNightSystem 조건부 갱신 (색상 delta > threshold일 때만)
- [ ] **ISSUE-4**: ColorMatrixFilter -> Container.tint 대체
- [ ] **ISSUE-5**: 저사양 기기 LOD 전략 (deviceMemory, FPS 모니터링, 토글)
- [ ] **ISSUE-10**: Service Worker 변경을 PIXI_MIGRATION Phase 4에 통합
- [ ] **ISSUE-11**: GSAP 라이선스 확인 + Anime.js 대체 계획

### 추가 반영 사항

- [ ] 모바일 100vh -> dvh 또는 JS visualViewport 계산
- [ ] iOS safe area insets (노치) CSS 대응
- [ ] WebGL context loss recovery 핸들러
- [ ] 비활성 탭에서 Ticker 정지 (저전력)
- [ ] 오프라인->온라인 세이브 동기화 큐 재시도 (지수 백오프)

---

## 9. 최종 판정

### CONDITIONAL APPROVAL

기술 계획서의 **6개 영역 기술 선택은 모두 합리적이며 프로젝트 맥락에 부합**한다. PixiJS 생태계 일관성, 외부 서비스 의존 배제, 번들 크기 의식적 통제는 높이 평가할 수 있다.

그러나 **문서 간 정합성**에서 11건의 이슈가 식별되었으며, 그중 **3건은 Blocker급**이다:

| 우선순위 | 수정 사항 | 미수정 시 결과 |
|---------|----------|--------------|
| **1순위** | PIXI_MIGRATION과의 시간축 통합 (B-1) | 일정 산출이 무효화되어 프로젝트 관리 불가 |
| **2순위** | @pixi/react 제거 + 상태관리 통일 (B-2, B-3) | 빌드 에러 확정 + 아키텍처 분열 |
| **3순위** | 의존성 맵 수정 + Sprint 재배정 (ISSUE-6, 7) | ~2주 일정 낭비 가능 (다국어 불필요 대기) |

**위 6건의 MUST FIX가 반영되면 즉시 구현 착수 가능.**
수정 후 예상 총 기간: **10주 (PIXI_MIGRATION 통합 기준)**, 순수 Phase 2 신규 작업 **~150h**.

---

*Independently reviewed: 2026-04-24*
*Reviewer: Claude Opus 4.6 (1M context)*
