# Plantii Phase 2 - 마일스톤 기술 계획서 검증 보고서

> **Reviewer**: Claude Agent (Step-2 Validation)
> **Review Date**: 2026-04-24
> **Target Document**: `docs/MILESTONE_TECHNICAL_PLAN.md` v1.0
> **Supporting References**: `TECH_RESEARCH.md`, `PIXI_MIGRATION_PLAN.md`, `PIXI_MIGRATION_REVIEW.md`, `SCENARIO_YEAR_SYSTEM_DESIGN.md`, `MILESTONE_REVIEW_REPORT.md`, `PROJECT_INVESTIGATION_REPORT.md`, Frontend/Backend `package.json`
> **Status**: CONDITIONAL APPROVAL (11개 수정 필요)

---

## 목차

1. [종합 평가 요약](#1-종합-평가-요약)
2. [검증 (1): 기술 선택과 릴리즈 후보 목표 부합성](#2-검증-1-기술-선택과-릴리즈-후보-목표-부합성)
3. [검증 (2): 모바일 성능 60fps 및 저전력 달성 가능성](#3-검증-2-모바일-성능-60fps-및-저전력-달성-가능성)
4. [검증 (3): 기술 간 의존성과 구현 순서 타당성](#4-검증-3-기술-간-의존성과-구현-순서-타당성)
5. [검증 (4): 누락/충돌 항목 식별](#5-검증-4-누락충돌-항목-식별)
6. [최종 실행 계획 (수정안)](#6-최종-실행-계획-수정안)
7. [리스크 레지스터 (보강)](#7-리스크-레지스터-보강)
8. [필수 조치 체크리스트](#8-필수-조치-체크리스트)

---

## 1. 종합 평가 요약

### 1.1 Overall Verdict

| 검증 영역 | 점수 | 판정 |
|-----------|------|------|
| (1) 기술 선택 vs 릴리즈 후보 목표 | 8.5/10 | PASS |
| (2) 모바일 60fps / 저전력 달성 가능성 | 7.5/10 | CONDITIONAL |
| (3) 의존성 / 구현 순서 타당성 | 6.5/10 | CONDITIONAL - 순서 수정 필요 |
| (4) 누락 / 충돌 항목 | 7.0/10 | CONDITIONAL - 11개 이슈 |

### 1.2 핵심 판단

기술 계획서의 **6개 영역 기술 선택은 전반적으로 우수**하다. 각 후보를 체계적으로 비교하고, 프로젝트 맥락(PixiJS v8 기반, Express 백엔드, React 18 프론트엔드)에 맞는 합리적 결론을 도출했다. 그러나 다음 **3대 구조적 이슈**가 식별되었으며, 이를 해결해야 릴리즈 후보 품질에 도달할 수 있다:

1. **React 18 vs @pixi/react v8 비호환** - @pixi/react는 React 19+를 요구하나 프로젝트는 React 18.2
2. **다국어(i18n)의 의존성 위치 오류** - 다국어가 BGM/터치보다 뒤로 배치되었으나, 실제로는 독립적으로 가장 일찍 시작 가능
3. **클라우드 세이브의 상태 관리 충돌** - 기존 Redux Toolkit과 신규 제안(saveSlice)이 기술 계획 전체에서 Zustand와 혼재

---

## 2. 검증 (1): 기술 선택과 릴리즈 후보 목표 부합성

### 2.1 영역별 기술 선택 적합성

| 영역 | 권장안 | 릴리즈 후보 부합도 | 판정 |
|------|--------|-------------------|------|
| (1) 칩튠 BGM | @pixi/sound + 프리메이드 파일 | **적합** - PixiJS 생태계 통합, 최소 번들(~15KB) | PASS |
| (2) 터치 제스처 | PixiJS 내장 + 커스텀 인식기 | **적합** - 제로 의존성, 게임 캔버스 네이티브 통합 | PASS |
| (3) PWA 푸시 | Web Push API + web-push | **적합** - 자체 인프라 활용, 외부 의존 배제 | PASS |
| (4) 클라우드 세이브 | REST API 직접 + 낙관적 동기화 | **적합** - 기존 Express+PG 활용, 합리적 복잡도 | PASS |
| (5) 스프라이트/배칭 | PixiJS v8 + TexturePacker | **적합** - 이미 마이그레이션 계획과 일치 | PASS |
| (6) 다국어 | react-i18next | **적합** - 성숙한 생태계, TypeScript 지원 | PASS |

### 2.2 기술 선택의 강점

**A. 일관된 PixiJS 생태계 활용**
- 영역 (1), (2), (5)가 모두 PixiJS v8 생태계 내에서 해결 -> 패키지 간 버전 충돌 최소화
- `@pixi/sound`는 `Assets` 파이프라인과 네이티브 통합 -> 오디오 로딩이 스프라이트 로딩과 동일한 패턴

**B. 외부 서비스 의존성 배제**
- FCM/OneSignal 대신 Web Push API 직접 사용 -> 장기 유지보수 비용 절감
- Firebase/Supabase 대신 자체 REST API -> 이미 구축된 인프라 재활용

**C. 번들 크기 의식적 통제**
- 추가 프론트엔드 번들 ~185KB gzipped는 합리적 수준
- 다만 PIXI_MIGRATION_PLAN에서 이미 PixiJS ~150KB + GSAP ~26KB가 추가되므로 **총 누적 번들**을 재계산 필요 (아래 ISSUE-1)

### 2.3 이슈

**ISSUE-1: 총 번들 크기 누적 미계산**

기술 계획서 Section 8.3에서 "프론트엔드 추가 번들 합계 ~185KB gzipped"로 표기했으나, 이는 Phase 2 추가분만 계산한 것이다. PIXI_MIGRATION_PLAN에서 이미 추가되는 패키지를 합산하면:

```
기존 React 18 + React Router + Redux + Axios:     ~65KB gzipped
PIXI_MIGRATION_PLAN 추가:
  pixi.js v8:                                       ~150KB gzipped
  gsap:                                             ~26KB gzipped
  @pixi/particle-emitter:                           ~30KB gzipped
Phase 2 추가 (본 계획서):
  @pixi/sound:                                      ~15KB gzipped
  i18next + react-i18next + detector:               ~15KB gzipped
  web-push (백엔드만, 프론트 0KB):                    0KB
---------------------------------------------------------
총 프론트엔드 번들:                                  ~301KB gzipped
```

PIXI_MIGRATION_REVIEW에서 "< 250KB app JS" 타겟을 제시했으나, 이미 ~301KB로 초과한다. **트리 셰이킹**과 **코드 스플리팅**이 필수다.

> **Required Action**: 번들 크기 예산을 Phase 전체 기준으로 재계산하고, PixiJS v8의 트리 셰이킹(미사용 모듈 제외) + 게임 에셋의 lazy import 전략을 Section 8에 명시

**ISSUE-2: @pixi/react v8의 React 18 비호환**

기술 계획서 Section 5.9에 `@pixi/react`가 의존성으로 나열되어 있으나, PIXI_MIGRATION_REVIEW에서 이미 "**@pixi/react v8는 React 19+ 필요**"로 식별됨. 현재 프로젝트는 React 18.2.

다행히 PIXI_MIGRATION_PLAN의 `GameShell.tsx`는 `@pixi/react`를 사용하지 않고 수동 canvas ref 패턴을 사용하므로, 의존성 목록에서 제거하면 된다.

> **Required Action**: Section 5.9, Section 8.3에서 `@pixi/react` 제거. 이미 GameShell.tsx가 수동 통합을 사용하므로 기능 영향 없음

---

## 3. 검증 (2): 모바일 성능 60fps 및 저전력 달성 가능성

### 3.1 성능 달성 분석 (영역별)

| 영역 | 성능 영향도 | 60fps 달성 가능 여부 | 근거 |
|------|-----------|-------------------|------|
| (1) 칩튠 BGM | **최소** | Yes | @pixi/sound는 Web Audio API 위의 경량 래퍼. 오디오 디코딩은 별도 스레드. OGG/MP3 재생은 CPU 영향 무시 가능 |
| (2) 터치 제스처 | **최소** | Yes | PixiJS FederatedEvent는 이미 렌더 루프와 독립. passive 리스너 + rAF 쓰로틀링으로 이벤트 부하 제어 |
| (3) PWA 푸시 | **무시** | N/A | Service Worker는 별도 스레드. 런타임 성능 영향 없음 |
| (4) 클라우드 세이브 | **낮음** | Yes | 자동 세이브는 debounce + visibilitychange 트리거. 네트워크 I/O는 비동기. localStorage 쓰기는 ~1ms |
| (5) 스프라이트/배칭 | **핵심** | Yes (조건부) | 아래 상세 분석 |
| (6) 다국어 | **무시** | Yes | i18next는 초기화 시 1회 로드. 런타임 t() 호출은 해시맵 룩업 (~0.01ms) |

### 3.2 스프라이트/배칭 성능 상세 분석

기술 계획서 Section 5.6의 "~6 draw calls" 예상은 **현실적이며 달성 가능**하다:

```
320x480 논리 해상도에서:
- 스프라이트 수: 최대 ~75개 (15종 x 5단계, 동시 표시는 9개 플롯 = ~9개)
- 아틀라스 텍스처: 1024x1024 (식물) + 512x512 (UI) = VRAM ~5MB
- ParticleContainer: 200~300 파티클 (날씨)
- BitmapText: ~10~15개 텍스트 요소

예상 Draw Calls: 6~8 (아틀라스별 1 + 파티클 1 + 텍스트 1)
GPU Load: 320x480 @ 8 draw calls = 중급 모바일에서 여유 (60fps 안정)
```

**그러나 PIXI_MIGRATION_REVIEW에서 식별된 성능 anti-pattern이 계획서에 미반영:**

**ISSUE-3: DayNightSystem 매 프레임 Graphics 재생성**

PIXI_MIGRATION_PLAN Section 5.4의 `DayNightSystem`이 매 프레임 `Graphics.clear() + rect() + fill()`을 호출한다. PIXI_MIGRATION_REVIEW에서 이미 지적되었으나, 본 기술 계획서의 성능 최적화 전략(Section 5.7)에 이 수정이 반영되지 않았다.

> **Required Action**: Section 5.7 성능 최적화 기법에 "DayNightSystem 조건부 갱신(색상 변경 시에만 redraw)" 항목 추가

**ISSUE-4: ColorMatrixFilter 불필요한 렌더 패스**

PIXI_MIGRATION_PLAN의 `DayNightSystem`이 전체 게임 레이어에 `ColorMatrixFilter`를 적용하여 extra render pass가 발생한다. PIXI_MIGRATION_REVIEW에서 `container.tint` 대체를 권장했으나, 본 계획서에서도 미반영.

> **Required Action**: Section 5.7에 "ambient lighting은 Container.tint로 처리 (filter 대신)" 추가

### 3.3 저전력 달성 분석

| 전력 소비 요인 | 계획서 대응 | 추가 권장 |
|-------------|-----------|----------|
| GPU 렌더링 | 320x480 저해상도 + 최소 draw calls | OK |
| CPU (게임 루프) | Ticker 기반, 변경 시에만 업데이트 | 비활성 탭에서 Ticker 정지 필요 |
| 네트워크 | 자동 세이브 debounce, SW 캐시 | OK |
| 오디오 | `document.hidden` 시 BGM 일시정지 | OK (Section 1.5) |
| 화면 갱신 | - | **누락**: `requestAnimationFrame`은 탭 비활성 시 자동 정지되지만, `node-cron` 기반 시뮬레이션은 서버 측이므로 무관 |

**ISSUE-5: 저사양 기기 대응 LOD 전략 부재**

계획서는 "성능 프로파일링 + 최적화"(Section 5.8)을 3시간으로 배정했으나, 구체적인 LOD(Level of Detail) 전략이 없다. TECH_RESEARCH.md에서 "파티클 수 동적 조절"을 언급했으나, 기준값이 없다.

> **Required Action**: Section 5.7에 LOD 전략 추가:
> ```
> - navigator.deviceMemory < 4GB: 파티클 50% 감소, 날씨 파티클 비활성화
> - FPS < 45 감지 시: ParticleContainer 동적 축소
> - 저사양 모드 토글: 설정 UI에서 수동 선택 가능
> ```

---

## 4. 검증 (3): 기술 간 의존성과 구현 순서 타당성

### 4.1 계획서의 의존성 맵 검증

계획서 Section 7의 의존성 맵을 코드 레벨에서 검증한다:

```
계획서 주장:
  (5) 스프라이트/배칭 -> (1) BGM, (2) 터치 [PixiJS 설치 의존]
  (1) BGM + (2) 터치 -> (6) 다국어 [텍스트 확정 후]
  (6) 다국어 -> (3) 푸시 [알림 텍스트]
  (4) 세이브는 독립

검증 결과:
  (5) -> (1): OK. @pixi/sound는 pixi.js 설치 후에만 동작
  (5) -> (2): OK. FederatedEvent는 PixiJS Application 필요
  (1)+(2) -> (6): *** 잘못됨 *** (아래 ISSUE-6)
  (6) -> (3): 부분적 OK. 알림 텍스트는 서버 측에서도 처리 가능
  (4) 독립: OK. 백엔드 REST API + 프론트 localStorage는 PixiJS 무관
```

**ISSUE-6: 다국어(i18n)의 의존성 위치가 잘못됨**

계획서는 다국어를 "(1) BGM + (2) 터치의 텍스트가 확정된 후"에 배치했다. 그러나:

1. `react-i18next`는 React 컴포넌트에 적용되는 것이며 PixiJS와 **독립적으로 설치 가능**
2. 기존 React UI (Login, Register, Profile)에 먼저 i18n을 적용할 수 있음
3. PixiJS `BitmapText` 연동은 i18n 인스턴스 직접 호출(`i18n.t()`)로 해결하며, BGM/터치 완성을 기다릴 필요 없음
4. BGM과 터치에는 "텍스트"가 거의 없음 (BGM은 파일명, 터치는 제스처 이벤트)

실제 의존 관계:
```
(6) 다국어는 (5) 스프라이트/배칭에도 의존하지 않음
  - react-i18next는 React 레이어에서 동작
  - PixiJS BitmapText 연동은 최종 통합 단계에서 수행 (i18n.t() 호출만 추가)
  - 번역 파일 작성은 코드 구현과 병렬 진행 가능

수정된 의존성:
  (6) 다국어: 선행 의존 없음 -> Sprint 1에서 (5)와 병렬 시작 가능
  (3) 푸시: (6) 서버 측 번역만 필요 -> Sprint 2에서 (6)와 병렬
```

> **Required Action**: 의존성 맵(Section 7) 수정 - 다국어를 독립 모듈로 재배치, Sprint 1부터 시작 가능

**ISSUE-7: 통합 일정(Section 8.2) Sprint 배정 불균형**

```
현재 계획:
  Sprint 1 (Week 1-2): (5) 44h + (4 백엔드) ~12h = 56h
  Sprint 2 (Week 3-4): (1) 22h + (2) 20h + (4 프론트) ~13h = 55h
  Sprint 3 (Week 5-6): (6) 23h + (3) 20h + 통합 테스트 = 43h+

문제점:
  - Sprint 1에 44h 작업이 포함되나, 이 중 12h는 "스프라이트 제작"으로 디자인 작업
    -> 순수 코딩은 ~32h. 그러나 (5)는 PIXI_MIGRATION_PLAN 전체(8주)와 겹침
  - (5)의 44h는 PIXI_MIGRATION_PLAN의 Phase 1~2 (Foundation + Plant Display + HUD)와
    대부분 중복. 기술 계획서만의 신규 작업은 아틀라스 빌드 파이프라인(3h)과
    성능 최적화(3h) 정도
```

> **Required Action**: (5)의 44h를 PIXI_MIGRATION_PLAN과의 중복 제거 후 재산정. 순수 신규 작업만 추출하면 ~10-15h로 감소 가능. 절약된 시간을 통합 테스트와 다국어에 재배분

### 4.2 수정된 의존성 맵

```
                        ┌─────────────────────────┐
                        │  (5) 스프라이트 아틀라스  │  <-- 기반 (PixiJS 설치)
                        │   + 렌더링 배칭          │
                        └──────┬───────┬──────────┘
                               │       │
                  ┌────────────┘       └────────────┐
                  v                                  v
       ┌───────────────────┐            ┌───────────────────┐
       │ (1) 칩튠 BGM/효과음│            │ (2) 터치 제스처     │
       │  (@pixi/sound)     │            │  (PixiJS Event)    │
       └───────────────────┘            └───────────────────┘

  [독립 트랙 A]                    [독립 트랙 B]
  ┌───────────────────┐            ┌───────────────────┐
  │ (6) KO/EN 다국어   │            │ (4) 클라우드 세이브  │
  │  (react-i18next)  │            │  (REST API 직접)   │
  │  선행 의존: 없음    │            │  선행 의존: 없음     │
  └────────┬──────────┘            └───────────────────┘
           │
           v
  ┌───────────────────┐
  │ (3) PWA 푸시 알림   │  <-- (6)의 서버 번역 파일만 필요
  │  (Web Push API)   │
  └───────────────────┘
```

### 4.3 PIXI_MIGRATION_PLAN과의 시간축 정합성

**치명적 발견**: 기술 계획서(Phase 2 확장)와 PIXI_MIGRATION_PLAN(Phase 1 게임 캔버스)이 **동일한 PixiJS 설치를 전제**로 하면서, 구현 일정이 **겹치거나 순서가 불명확**하다.

```
PIXI_MIGRATION_PLAN 일정:
  Phase 1 (Week 1-2): Foundation (PixiJS 설치, GameShell, Asset Pipeline)
  Phase 2 (Week 3-4): Plant Display + HUD
  Phase 3 (Week 5-6): Animation + Effects
  Phase 4 (Week 7-8): PWA + Polish
  (PIXI_MIGRATION_REVIEW는 +2주 버퍼 권장 = 10주)

MILESTONE_TECHNICAL_PLAN 일정:
  Sprint 1 (Week 1-2): 스프라이트 아틀라스 + 클라우드 세이브 백엔드
  Sprint 2 (Week 3-4): BGM + 터치 + 세이브 프론트
  Sprint 3 (Week 5-6): 다국어 + 푸시 + 통합 테스트

질문: 이 두 계획은 순차 실행인가 병렬 실행인가?
```

**ISSUE-8: 두 계획의 시간축 관계 미정의**

> **Required Action**: PIXI_MIGRATION_PLAN이 **선행**되어야 한다고 명시. 기술 계획서의 Sprint 1 시작은 PIXI_MIGRATION Phase 2 완료(Week 4) 이후로 재배정. 또는 병렬 가능 항목(다국어, 클라우드 세이브 백엔드)을 Migration 기간 중 진행하도록 조정

---

## 5. 검증 (4): 누락/충돌 항목 식별

### 5.1 누락 항목

**ISSUE-9: 상태 관리 전략 충돌 (Redux vs Zustand)**

현재 `package.json`에 이미 `@reduxjs/toolkit`과 `react-redux`가 설치되어 있다. 그런데:

- 기술 계획서 Section 4.5: `saveSlice.ts` (Redux 사용)
- SCENARIO_YEAR_SYSTEM_DESIGN Section 11.3: `gameSessionStore.ts` (Zustand 사용)
- MILESTONE_REVIEW_REPORT Section 6.2: "Zustand 도입, 도메인별 store 분리" 권장

세 문서에서 상태 관리 전략이 통일되지 않았다.

```
현재 코드: Redux Toolkit (AuthContext는 React Context)
계획서 (4) 세이브: Redux saveSlice
시나리오 시스템: Zustand stores
리뷰 보고서: Zustand 권장
```

> **Required Action**: 전체 프로젝트의 상태 관리 전략을 하나로 통일. 두 가지 옵션:
> - **Option A**: 기존 Redux Toolkit 유지, 모든 신규 상태를 slice로 추가 (마이그레이션 비용 0)
> - **Option B**: Zustand로 전환, 기존 Redux 코드 마이그레이션 (더 경량, 보일러플레이트 감소)
> **권장: Option A** - 릴리즈 후보 단계에서 상태 관리 라이브러리 교체는 리스크. 기존 RTK 유지가 안전

**ISSUE-10: Service Worker 캐싱 전략의 Phase 간 충돌**

- PIXI_MIGRATION_PLAN Section 7.3: Service Worker를 **완전히 재작성** (3가지 캐싱 전략)
- 기술 계획서 Section 3.5: 기존 Service Worker에 **push 핸들러 추가**

두 계획이 같은 `service-worker.js` 파일을 수정하며, 순서에 따라 한쪽의 변경이 덮어씌워질 수 있다.

> **Required Action**: Service Worker 변경을 단일 계획으로 통합. PIXI_MIGRATION Phase 4에서 SW를 재작성할 때 push 핸들러까지 포함시키는 것이 효율적

**ISSUE-11: GSAP 라이선스 리스크 미해결**

TECH_RESEARCH.md와 PIXI_MIGRATION_PLAN 모두 GSAP을 UI 애니메이션에 사용한다. PIXI_MIGRATION_REVIEW에서 "GSAP license for commercial use" 리스크를 식별했다. Plantii가 상용 출시될 경우 GSAP 유료 라이선스가 필요할 수 있다.

기술 계획서에서는 GSAP을 직접 사용하지 않지만, 의존 영역(스프라이트/배칭)이 GSAP에 의존하므로 전체 프로젝트 라이선스 리스크다.

> **Required Action**: GSAP 상용 라이선스 정책 확인. 무료 사용 불가 시 Anime.js(MIT, ~52KB)로 대체 계획을 Section 8.4 리스크에 추가

### 5.2 영역 내부 충돌/정합성 검증

| 검증 항목 | 결과 | 비고 |
|----------|------|------|
| (1) BGM: @pixi/sound v6과 pixi.js v8 호환 | OK | @pixi/sound v6은 PixiJS v8용으로 릴리즈 |
| (2) 터치: PointerEvent API 브라우저 지원 | OK | Chrome/Safari/Firefox 모두 지원 (caniuse 98%+) |
| (3) 푸시: `web-push` + 기존 `node-cron` | OK | node-cron은 이미 backend에 설치됨 |
| (3) 푸시: iOS Safari 16.4+ 제한 | OK | 계획서에서 인지하고 PWA 설치 유도 전략 기술 |
| (4) 세이브: Knex + PostgreSQL 호환 | OK | 기존 인프라 |
| (4) 세이브: save_data JSONB 크기 | **주의** | JSONB에 전체 게임 상태 저장 시 사이즈 모니터링 필요 |
| (5) 배칭: free-tex-packer-cli CI 호환 | OK | prebuild 스크립트로 자동화 |
| (6) 다국어: 식물 카탈로그 name_ko/name_en | OK | 기존 DB에 이미 필드 존재 |
| (6) 다국어: PixiJS BitmapText + i18n | **주의** | 한글 BitmapFont 서브셋(2,350자) 생성 파이프라인 미정의 |

---

## 6. 최종 실행 계획 (수정안)

### 6.1 전제 조건

```
선행 완료 필수:
  1. PIXI_MIGRATION_PLAN Phase 1-2 (Foundation + Plant Display) = Week 1-4
  2. PIXI_MIGRATION_REVIEW의 P0 수정 5건 반영

병렬 진행 가능 (Migration과 동시):
  - (6) 다국어: 번역 파일 구조 설계 + KO/EN 원본 텍스트 추출 (Week 1-2)
  - (4) 클라우드 세이브: 백엔드 API (Week 2-4)
```

### 6.2 수정된 통합 일정

```
Week 1-4: PIXI_MIGRATION Phase 1-2 (병렬 진행)
  ├── [Migration] PixiJS 설치, GameShell, AssetManager, PlantEntity, GameHUD
  ├── [병렬] (6) i18next 설치 + 번역 파일 구조 + React UI 적용    (8h)
  └── [병렬] (4) 백엔드 save.service + CRUD 엔드포인트 + DB migration (9h)

Week 5-6: Sprint A - 게임 인터랙션 + 세이브 통합
  ├── (1) 칩튠 BGM: AudioManager + @pixi/sound 통합 + BGM/SFX     (22h)
  ├── (2) 터치 제스처: GestureRecognizer + InputManager              (20h)
  ├── (4) 클라우드 세이브: 프론트엔드 syncManager + 자동 세이브 UI     (16h)
  └── (6) 다국어: PixiJS BitmapText 연동 + 언어 전환 UI             (8h)

Week 7-8: Sprint B - 알림 + 통합 + 폴리시
  ├── (3) PWA 푸시 알림: 전체 구현                                   (20h)
  ├── (6) 다국어: 푸시 알림 텍스트 + 식물 카탈로그 다국어화            (7h)
  ├── 통합 테스트 (6개 영역 교차 검증)                                (8h)
  ├── 성능 프로파일링 + 모바일 기기 테스트                             (6h)
  └── 버그 수정 + 크로스브라우저 검증                                  (6h)

Week 9 (버퍼): 릴리즈 후보 준비
  ├── 최종 성능 최적화 (번들 스플리팅, 트리 셰이킹 검증)
  ├── iOS Safari + Android Chrome 최종 검증
  └── 릴리즈 노트 + 배포 체크리스트
```

### 6.3 수정된 소요시간 요약

| 영역 | 원래 예상 | 수정 예상 | 변경 사유 |
|------|----------|----------|----------|
| (5) 스프라이트/배칭 | 44h | **10h** (신규분만) | PIXI_MIGRATION과 중복 34h 제거 |
| (4) 클라우드 세이브 | 25h | 25h | 변경 없음 |
| (6) 다국어 | 23h | 23h | 변경 없음 (단, 시작 시점을 Week 1로 앞당김) |
| (1) 칩튠 BGM | 22h | 22h | 변경 없음 |
| (2) 터치 제스처 | 20h | 20h | 변경 없음 |
| (3) PWA 푸시 | 20h | 20h | 변경 없음 |
| 통합/테스트/버퍼 | (미배정) | **20h** | 신규 추가 |
| **합계** | **154h** | **140h** | -14h (중복 제거 + 테스트 추가) |

---

## 7. 리스크 레지스터 (보강)

### 7.1 계획서 기존 리스크 검증

| 계획서 리스크 | 검증 결과 | 수정 필요 |
|-------------|----------|----------|
| iOS Safari 오디오 잠금 | 유효. 첫 인터랙션 AudioContext.resume() 필수 | 없음 |
| iOS Safari 푸시 미지원 (비PWA) | 유효. PWA 설치 유도 필수 | 없음 |
| 스프라이트 아트 제작 병목 | 유효. 12h + 6h = 18h 디자인 작업 | PIXI_MIGRATION과 공유, 이중 계산 방지 필요 |
| 클라우드 동기화 충돌 | 유효. 충돌 해결 UI 필수 | 없음 |
| PixiJS v8 브레이킹 체인지 | 유효하나 낮은 확률 | 없음 |
| 번들 크기 증가 (+185KB) | **과소평가**. 실제 누적 ~301KB | ISSUE-1 반영 필요 |

### 7.2 추가 식별 리스크

| ID | 리스크 | 확률 | 영향 | 완화 전략 |
|----|--------|------|------|----------|
| R-NEW-1 | @pixi/react React 18 비호환 | **확정** | 중 | 의존성에서 제거 (ISSUE-2) |
| R-NEW-2 | 상태 관리 전략 혼재 (Redux vs Zustand) | 높음 | 높음 | 하나로 통일 결정 (ISSUE-9, RTK 유지 권장) |
| R-NEW-3 | PIXI_MIGRATION과 일정 충돌 | 높음 | 높음 | 시간축 관계 명시, 병렬 항목 분리 (ISSUE-8) |
| R-NEW-4 | Service Worker 변경 충돌 | 중 | 중 | 단일 계획으로 통합 (ISSUE-10) |
| R-NEW-5 | 한글 BitmapFont 생성 파이프라인 미정 | 중 | 중 | PixiJS Text 폴백 전략 수립 (한글은 Text, ASCII는 BitmapText) |
| R-NEW-6 | WebGL context loss 미대응 | 중 | 높음 | PIXI_MIGRATION_REVIEW 권장대로 context-loss 핸들러 추가 |
| R-NEW-7 | GSAP 상용 라이선스 리스크 | 낮음 | 중 | Anime.js(MIT) 대체 계획 수립 (ISSUE-11) |
| R-NEW-8 | 총 프로젝트 기간 과소 추정 | 높음 | 높음 | PIXI_MIGRATION(10주) + Phase 2(9주) = 최소 19주. 병렬 최적화로 ~14주 목표 |
| R-NEW-9 | 100vh 모바일 뷰포트 이슈 | 높음 | 중 | dvh 사용 또는 JS 계산 (PIXI_MIGRATION_REVIEW 반영) |

---

## 8. 필수 조치 체크리스트

### Must Fix (구현 전 반드시 수정)

- [ ] **ISSUE-1**: 번들 크기 예산을 Phase 전체 기준으로 재계산 + 트리 셰이킹/코드 스플리팅 전략 명시
- [ ] **ISSUE-2**: `@pixi/react` 의존성 제거 (Section 5.9, 8.3)
- [ ] **ISSUE-6**: 다국어(i18n) 의존성 위치 수정 - 독립 모듈로 재배치, Sprint 1부터 병렬 시작
- [ ] **ISSUE-8**: PIXI_MIGRATION_PLAN과의 시간축 관계 명시 (선행/병렬 구분)
- [ ] **ISSUE-9**: 상태 관리 전략 통일 (Redux Toolkit 유지 권장)
- [ ] **ISSUE-10**: Service Worker 변경을 PIXI_MIGRATION Phase 4와 통합

### Should Fix (구현 중 반영 권장)

- [ ] **ISSUE-3**: DayNightSystem 조건부 갱신 전략 추가 (Section 5.7)
- [ ] **ISSUE-4**: ColorMatrixFilter -> Container.tint 대체 (Section 5.7)
- [ ] **ISSUE-5**: 저사양 기기 LOD 전략 구체화 (Section 5.7)
- [ ] **ISSUE-7**: Sprint 배정 재균형 + (5) 중복 시간 제거
- [ ] **ISSUE-11**: GSAP 라이선스 리스크 문서화 + 대체 계획

### 추가 반영 사항 (PIXI_MIGRATION_REVIEW에서 미반영된 항목)

- [ ] 모바일 100vh -> dvh 또는 JS viewport 계산
- [ ] iOS safe area insets (notch) 대응 CSS
- [ ] WebGL context loss recovery 핸들러
- [ ] `touch-action: manipulation` CSS
- [ ] CatalogScene 상세 구현 명세 (스크롤 컨테이너 포함)

---

## 9. Final Verdict

### CONDITIONAL APPROVAL

기술 계획서는 **6개 확장 영역의 기술 선택이 모두 합리적**이며, 각 후보의 비교 분석이 철저하다. 프로젝트 맥락(PixiJS v8, Express, React 18, PostgreSQL)에 맞는 최적의 조합을 도출했다.

그러나 **문서 간 정합성**(PIXI_MIGRATION_PLAN, SCENARIO_YEAR_SYSTEM, MILESTONE_REVIEW_REPORT와의 관계)에서 11개 이슈가 식별되었으며, 특히 다음 **3대 필수 수정**이 반영되어야 릴리즈 후보 품질에 도달할 수 있다:

| 우선순위 | 수정 사항 | 영향 |
|---------|----------|------|
| **1순위** | PIXI_MIGRATION과의 시간축 통합 (ISSUE-8) | 전체 일정의 현실성 결정 |
| **2순위** | @pixi/react 제거 + 상태관리 통일 (ISSUE-2, 9) | 빌드/런타임 에러 방지 |
| **3순위** | 의존성 맵 수정 + Sprint 재배정 (ISSUE-6, 7) | ~2주 일정 단축 가능 |

이 3가지가 반영되면 **즉시 구현에 착수 가능**하다.

---

*Review completed: 2026-04-24*
