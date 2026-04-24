# Plantii Phase 2 - 마일스톤 상세 기술 계획서

> **Version**: 1.0
> **작성일**: 2026-04-24
> **프로젝트**: Plantii - 디지털 식물 육성 시뮬레이션 플랫폼
> **대상**: Phase 2 확장 기능 6개 영역

---

## 목차

1. [칩튠 BGM + 효과음 구현](#1-칩튠-bgm--효과음-구현)
2. [터치 제스처 최적화](#2-터치-제스처-최적화)
3. [PWA 푸시 알림](#3-pwa-푸시-알림)
4. [클라우드 세이브/로드](#4-클라우드-세이브로드)
5. [스프라이트 아틀라스 및 렌더링 배칭](#5-스프라이트-아틀라스-및-렌더링-배칭)
6. [KO/EN 다국어 지원](#6-koen-다국어-지원)
7. [영역 간 의존성 맵](#7-영역-간-의존성-맵)
8. [통합 일정 및 우선순위](#8-통합-일정-및-우선순위)

---

## 1. 칩튠 BGM + 효과음 구현

### 1.1 기술 조사

#### Web Audio API (네이티브)

| 항목 | 내용 |
|------|------|
| **개요** | 브라우저 내장 저수준 오디오 처리 API |
| **장점** | 제로 의존성, 완전한 제어, 실시간 합성 가능 |
| **단점** | 보일러플레이트 다량, 크로스브라우저 이슈 직접 처리 |
| **번들 크기** | 0KB (네이티브) |
| **브라우저 지원** | Chrome/Edge/Firefox/Safari 모두 지원 (iOS Safari는 사용자 인터랙션 후 활성화 필수) |

#### Tone.js

| 항목 | 내용 |
|------|------|
| **개요** | Web Audio API 위의 음악 제작 전문 프레임워크 |
| **장점** | 신시사이저 내장, 시퀀서/트랜스포트, 이펙트 체인, 프로그래매틱 칩튠 생성에 최적 |
| **단점** | 번들 크기 큼 (~150KB gzipped), 게임용이 아닌 음악 제작 도구 |
| **번들 크기** | ~150KB gzipped |
| **라이선스** | MIT |

#### Howler.js

| 항목 | 내용 |
|------|------|
| **개요** | 게임/앱 오디오 재생 전문 라이브러리 |
| **장점** | 스프라이트 시트 오디오, 자동 폴백(HTML5 Audio), 풀링, 간결한 API |
| **단점** | 실시간 합성 불가, 프리메이드 오디오 파일 필수 |
| **번들 크기** | ~10KB gzipped |
| **라이선스** | MIT |

#### PixiJS Sound (@pixi/sound)

| 항목 | 내용 |
|------|------|
| **개요** | PixiJS 공식 오디오 플러그인 |
| **장점** | PixiJS Assets 파이프라인과 통합, 필터(리버브/디스토션), 스프라이트 지원 |
| **단점** | PixiJS 의존, 단독 사용 불가 |
| **번들 크기** | ~15KB gzipped |
| **라이선스** | MIT |

### 1.2 구현 옵션 비교

| 기준 | Web Audio 직접 | Tone.js | Howler.js | @pixi/sound |
|------|---------------|---------|-----------|-------------|
| **칩튠 합성** | 가능(고난도) | 최적 | 불가 | 불가 |
| **파일 재생** | 가능(수동) | 가능 | 최적 | 최적 |
| **PixiJS 통합** | 수동 | 수동 | 수동 | 네이티브 |
| **모바일 호환성** | 수동 처리 | 자동 | 자동 | 자동 |
| **구현 난이도** | 상 | 중 | 하 | 하 |
| **성능 영향** | 최소 | 중 | 최소 | 최소 |

### 1.3 권장안: @pixi/sound + 프리메이드 칩튠 파일

**선택 근거:**
- 프로젝트가 이미 PixiJS v8 기반으로 마이그레이션 예정 (PIXI_MIGRATION_PLAN.md)
- @pixi/sound는 Assets API와 번들 로딩 통합이 네이티브
- 칩튠 BGM은 외부 도구(FamiTracker, Bosca Ceoil, BeepBox)로 미리 제작하여 OGG/MP3 파일로 내보내는 방식이 품질/효율 면에서 우수
- 실시간 합성은 게임 UX에 불필요한 복잡도 추가

### 1.4 구현 아키텍처

```
frontend/src/audio/
  ├── AudioManager.ts          # 싱글톤: BGM/SFX 총괄 관리
  ├── SoundPool.ts             # SFX 풀링 (동시 다중 효과음)
  ├── tracks/                  # BGM 정의 (씬별 매핑)
  │   ├── bgm-manifest.json    # { "garden": "bgm-garden.ogg", ... }
  │   └── sfx-manifest.json    # { "water": { src: "sfx-water.ogg", volume: 0.6 }, ... }
  └── hooks/
      └── useAudio.ts          # React hook: 음량/뮤트 상태 연동

frontend/public/assets/audio/
  ├── bgm/                     # 칩튠 BGM 파일 (OGG + MP3 폴백)
  │   ├── bgm-garden.ogg
  │   ├── bgm-menu.ogg
  │   └── bgm-night.ogg
  └── sfx/                     # 효과음 파일
      ├── sfx-water.ogg
      ├── sfx-harvest.ogg
      ├── sfx-plant.ogg
      ├── sfx-levelup.ogg
      └── sfx-click.ogg
```

### 1.5 핵심 구현 사항

| 항목 | 설명 |
|------|------|
| **iOS 오디오 잠금 해제** | 첫 터치/클릭 이벤트에서 AudioContext.resume() 호출 |
| **BGM 크로스페이드** | 씬 전환 시 1초 페이드아웃 -> 페이드인 |
| **볼륨 컨트롤** | BGM/SFX 독립 볼륨, localStorage 저장 |
| **포커스 처리** | document.hidden 시 BGM 일시정지 |
| **SFX 스프라이트 시트** | 짧은 효과음 10개를 1파일로 합쳐 HTTP 요청 절감 |

### 1.6 예상 소요시간

| 태스크 | 시간 |
|--------|------|
| AudioManager 싱글톤 + @pixi/sound 통합 | 4h |
| BGM 크로스페이드/루프 시스템 | 3h |
| SFX 풀링 + 스프라이트 시트 | 3h |
| useAudio React 훅 + 설정 UI | 2h |
| iOS/모바일 오디오 잠금 해제 | 2h |
| 칩튠 BGM 3곡 제작/소싱 (외부 도구) | 4h |
| 효과음 5종 제작/소싱 | 2h |
| 테스트 및 크로스브라우저 검증 | 2h |
| **합계** | **22h** |

### 1.7 의존성

- PixiJS v8 설치 (스프라이트 아틀라스 영역과 공유)
- @pixi/sound 패키지 (`npm install @pixi/sound`)
- OGG 코덱 지원 확인 (Safari는 MP3 폴백 필수)

---

## 2. 터치 제스처 최적화

### 2.1 기술 조사

#### Hammer.js

| 항목 | 내용 |
|------|------|
| **개요** | 가장 널리 사용되는 멀티터치 제스처 인식 라이브러리 |
| **장점** | pan/pinch/rotate/swipe/tap/press 내장, 커스텀 인식기 추가 가능 |
| **단점** | 마지막 업데이트 2016년, 유지보수 중단, passive event 미지원, 번들 크기 |
| **번들 크기** | ~7.5KB gzipped |
| **라이선스** | MIT |

#### use-gesture (@use-gesture/react)

| 항목 | 내용 |
|------|------|
| **개요** | React 전용 제스처 훅 라이브러리 (pmndrs 생태계) |
| **장점** | React 친화적, 현대적 API, passive 기본, TypeScript, 활발한 유지보수 |
| **단점** | React 종속, PixiJS Canvas 이벤트와 직접 통합 어려움 |
| **번들 크기** | ~5KB gzipped |
| **라이선스** | MIT |

#### PixiJS 내장 이벤트 시스템

| 항목 | 내용 |
|------|------|
| **개요** | PixiJS v8의 EventSystem (FederatedEvent 기반) |
| **장점** | 제로 의존성, DisplayObject 단위 이벤트, 터치+마우스 통합 |
| **단점** | 복합 제스처(pinch/swipe) 직접 구현 필요 |
| **번들 크기** | 0KB (PixiJS에 포함) |

#### 커스텀 Pointer Events 핸들러

| 항목 | 내용 |
|------|------|
| **개요** | Pointer Events API 직접 활용한 제스처 인식기 자체 구현 |
| **장점** | 완전한 제어, 최소 번들, 게임 로직과 밀결합 가능 |
| **단점** | 개발 시간 증가, 엣지 케이스 처리 부담 |
| **번들 크기** | 0KB |

### 2.2 구현 옵션 비교

| 기준 | Hammer.js | use-gesture | PixiJS 내장 | 커스텀 |
|------|-----------|-------------|-------------|--------|
| **React 통합** | 래퍼 필요 | 네이티브 | 별도 계층 | 수동 |
| **PixiJS Canvas 통합** | DOM 오버레이 | DOM 오버레이 | 네이티브 | 네이티브 |
| **복합 제스처** | 내장 | 내장 | 수동 구현 | 수동 구현 |
| **유지보수 상태** | 중단 | 활발 | 활발 | N/A |
| **성능** | 중 | 중 | 상 | 상 |
| **구현 난이도** | 하 | 하 | 중 | 상 |
| **성능 영향** | 이벤트 리스너 오버헤드 | 이벤트 리스너 오버헤드 | 최소 | 최소 |

### 2.3 권장안: PixiJS 내장 이벤트 + 경량 커스텀 제스처 인식기

**선택 근거:**
- 게임 캔버스 내 식물 상호작용(탭, 드래그, 길게 누르기)이 핵심 → PixiJS FederatedEvent가 최적
- Hammer.js는 유지보수 중단으로 보안/호환성 리스크
- 필요한 제스처가 제한적 (tap, long-press, swipe, drag) → 풀 라이브러리 불필요
- React UI 영역(로그인, 설정)은 기본 onClick/onTouchStart로 충분

### 2.4 구현 아키텍처

```
frontend/src/input/
  ├── GestureRecognizer.ts     # 커스텀 제스처 인식기 (PointerEvent 기반)
  │   ├── TapRecognizer         # 단일/더블 탭 (300ms threshold)
  │   ├── LongPressRecognizer   # 길게 누르기 (500ms)
  │   ├── SwipeRecognizer       # 4방향 스와이프 (velocity threshold)
  │   └── DragRecognizer        # 드래그 (delta tracking)
  ├── InputManager.ts           # PixiJS Stage에 이벤트 바인딩, 게임 이벤트 디스패치
  └── constants.ts              # 제스처 임계값 설정
```

### 2.5 게임 내 제스처 매핑

| 제스처 | 게임 동작 | 구현 방식 |
|--------|-----------|-----------|
| **탭** | 식물 선택 / UI 버튼 클릭 | PixiJS `pointertap` |
| **더블 탭** | 식물 상세 정보 열기 | 커스텀 (300ms 간격 판정) |
| **길게 누르기** | 식물 물주기 액션 | 커스텀 (500ms 홀드) |
| **좌우 스와이프** | 정원 영역 전환 | 커스텀 (velocity > 0.3px/ms) |
| **드래그** | 정원 뷰 패닝 | PixiJS `pointermove` + delta |
| **핀치 (선택)** | 정원 줌 인/아웃 | PointerEvent 2점 거리 계산 |

### 2.6 성능 최적화 전략

| 항목 | 설명 |
|------|------|
| **passive 리스너** | 스크롤 성능을 위해 `{ passive: true }` 기본 적용 |
| **requestAnimationFrame 쓰로틀링** | 드래그/패닝 이벤트를 rAF 프레임 단위로 합침 |
| **히트 영역 최적화** | PixiJS `hitArea` 속성으로 복잡한 스프라이트의 감지 영역 단순화 |
| **이벤트 전파 제어** | `stopPropagation()`으로 불필요한 버블링 차단 |
| **touch-action: none** | 캔버스 요소에 CSS 설정으로 브라우저 기본 제스처 차단 |

### 2.7 예상 소요시간

| 태스크 | 시간 |
|--------|------|
| GestureRecognizer 코어 (tap/longpress/swipe/drag) | 6h |
| InputManager + PixiJS Stage 통합 | 3h |
| 핀치 줌 (선택적) | 3h |
| 게임 동작 매핑 + 이벤트 시스템 | 3h |
| 모바일 성능 최적화 (passive, rAF throttle) | 2h |
| 디바이스별 테스트 (iOS Safari, Android Chrome) | 3h |
| **합계** | **20h** |

### 2.8 의존성

- PixiJS v8 설치 (FederatedEvent 시스템)
- 스프라이트 아틀라스 영역 (히트 영역 설정을 위한 스프라이트 메타데이터)

---

## 3. PWA 푸시 알림

### 3.1 현재 상태 분석

프로젝트에 이미 기본 Service Worker가 존재:
- `frontend/public/service-worker.js`: 기본 캐시 전략 (network-first, cache fallback)
- `frontend/src/registerSW.ts`: SW 등록 + 주기적 업데이트 체크
- **미구현**: 푸시 알림, 알림 동의 관리, 백그라운드 동기화

### 3.2 기술 조사

#### Web Push API (네이티브)

| 항목 | 내용 |
|------|------|
| **개요** | Push API + Notification API를 Service Worker에서 처리 |
| **장점** | 표준 API, 서버 제어 가능, 무료 |
| **단점** | VAPID 키 관리, 서버 측 push 라이브러리 필요, iOS 16.4+ 제한 |
| **서버 라이브러리** | `web-push` (Node.js), 무료, MIT |
| **브라우저 지원** | Chrome/Edge/Firefox 완전 지원, Safari 16.4+ (PWA 설치 후만) |

#### Firebase Cloud Messaging (FCM)

| 항목 | 내용 |
|------|------|
| **개요** | Google의 관리형 푸시 서비스 |
| **장점** | 인프라 관리 불필요, 토픽 기반 구독, 분석 내장 |
| **단점** | Google 종속, SDK 번들 크기 (~50KB), 무료 제한 있음 |
| **번들 크기** | ~50KB gzipped (firebase/messaging) |

#### OneSignal

| 항목 | 내용 |
|------|------|
| **개요** | 서드파티 푸시 알림 SaaS |
| **장점** | UI 대시보드, A/B 테스트, 세그먼테이션 |
| **단점** | 월 비용 발생 (무료 티어 제한), 제3자 의존 |

### 3.3 구현 옵션 비교

| 기준 | Web Push (네이티브) | FCM | OneSignal |
|------|-------------------|-----|-----------|
| **비용** | 무료 | 무료(제한) | 유료(고급) |
| **서버 제어** | 완전 | 부분 | 없음 |
| **구현 난이도** | 중 | 중 | 하 |
| **번들 영향** | 최소 | ~50KB | ~30KB |
| **iOS 지원** | 제한적 | 제한적 | 제한적 |
| **커스텀 가능성** | 상 | 중 | 하 |
| **성능 영향** | 최소 | 중 | 중 |

### 3.4 권장안: Web Push API (네이티브) + web-push (서버)

**선택 근거:**
- 프로젝트가 이미 자체 Express 백엔드를 보유 → VAPID 키 관리와 push 전송을 직접 제어 가능
- 외부 서비스 의존성 제거로 장기적 유지보수 비용 절감
- 알림 유형이 단순 (물주기 리마인더, 수확 알림) → 복잡한 세그먼테이션 불필요
- 번들 크기 최소화

### 3.5 구현 아키텍처

```
backend/src/
  ├── services/
  │   └── push.service.ts         # web-push 래핑, 구독 관리, 알림 전송
  ├── routes/
  │   └── push.routes.ts          # POST /subscribe, DELETE /unsubscribe
  ├── controllers/
  │   └── push.controller.ts      # 구독 CRUD
  └── jobs/
      └── notification.job.ts     # node-cron: 물주기/수확 리마인더 스케줄러

backend/migrations/
  └── 02_push_subscriptions.sql   # push_subscriptions 테이블

frontend/src/
  ├── services/
  │   └── push.service.ts         # 구독 등록/해제 API 호출
  ├── components/
  │   └── NotificationConsent.tsx  # 동의 관리 UI (모달)
  └── hooks/
      └── usePushNotification.ts  # 구독 상태 관리 훅

frontend/public/
  └── service-worker.js           # push + notificationclick 핸들러 추가
```

### 3.6 동의 관리 플로우

```
사용자 첫 방문
  └─> 게임 튜토리얼 완료 (자연스러운 시점)
       └─> NotificationConsent 모달 표시
            ├─> "알림 받기" → Notification.requestPermission()
            │    ├─> granted → PushManager.subscribe() → 서버에 구독 정보 전송
            │    └─> denied → UI에 안내 메시지, 설정에서 재활성화 가능 안내
            └─> "나중에" → 7일 후 재표시 (localStorage 타이머)
```

### 3.7 알림 유형 및 스케줄

| 알림 유형 | 트리거 | 서버 로직 |
|-----------|--------|-----------|
| **물주기 리마인더** | 마지막 물주기 + water_frequency_days 경과 | node-cron 매 시간 체크 |
| **수확 가능 알림** | 식물 성장 단계가 harvest에 도달 | simulation tick 시 push |
| **건강도 경고** | health < 30% | simulation tick 시 push |
| **일일 출석 보상** | 매일 오전 9시 | node-cron 고정 스케줄 |

### 3.8 예상 소요시간

| 태스크 | 시간 |
|--------|------|
| VAPID 키 생성 + 환경변수 설정 | 1h |
| push_subscriptions DB 마이그레이션 | 1h |
| 백엔드 push.service + routes | 4h |
| Service Worker push/notificationclick 핸들러 | 3h |
| NotificationConsent UI 컴포넌트 | 2h |
| usePushNotification 훅 | 2h |
| notification.job 스케줄러 (node-cron 연동) | 3h |
| iOS Safari PWA 제한사항 대응 | 2h |
| 테스트 (Chrome DevTools Push 시뮬레이션) | 2h |
| **합계** | **20h** |

### 3.9 의존성

- `web-push` npm 패키지 (백엔드)
- VAPID 키 쌍 (환경변수)
- 기존 Service Worker 확장 (현재 캐시 전용 → push 핸들러 추가)
- 사용자 인증 시스템 (구독을 user_id에 연결)
- `node-cron` (이미 백엔드에 설치됨)

---

## 4. 클라우드 세이브/로드

### 4.1 기술 조사

#### REST API 직접 구현

| 항목 | 내용 |
|------|------|
| **개요** | Express 백엔드에 세이브/로드 엔드포인트 추가 |
| **장점** | 완전한 제어, 기존 인프라 활용, 스키마 검증 가능 |
| **단점** | 동기화 충돌 해결 직접 구현 |

#### Firebase Realtime Database / Firestore

| 항목 | 내용 |
|------|------|
| **개요** | Google 관리형 NoSQL DB |
| **장점** | 실시간 동기화 내장, 오프라인 퍼시스턴스 |
| **단점** | Google 종속, 이중 DB 관리, 비용 |

#### Supabase

| 항목 | 내용 |
|------|------|
| **개요** | 오픈소스 Firebase 대안 (PostgreSQL 기반) |
| **장점** | PostgreSQL 네이티브, 실시간 구독, 자체 호스팅 가능 |
| **단점** | 추가 인프라, 기존 DB와 이중 관리 |

### 4.2 구현 옵션 비교

| 기준 | REST API 직접 | Firebase | Supabase |
|------|-------------|----------|----------|
| **기존 인프라 활용** | 완전 | 없음 | 부분 |
| **동기화 복잡도** | 수동 구현 | 내장 | 내장 |
| **오프라인 지원** | localStorage + 동기화 | 내장 | 부분 |
| **비용** | 자체 서버만 | 무료 티어 제한 | 무료 티어 제한 |
| **구현 난이도** | 중 | 하 | 중 |
| **데이터 일관성** | 직접 보장 | 최종 일관성 | 강한 일관성 |
| **성능 영향** | API 호출 빈도에 비례 | SDK 오버헤드 | SDK 오버헤드 |

### 4.3 권장안: REST API 직접 구현 + 낙관적 동기화

**선택 근거:**
- 이미 Express + PostgreSQL + Knex 인프라 완비
- user_plants 테이블에 이미 성장 데이터 저장 중 → 세이브 데이터 스키마 확장이 자연스러움
- 외부 서비스 의존성 배제
- 게임 데이터가 비교적 단순 (식물 상태, 인벤토리, 설정) → 복잡한 실시간 동기화 불필요

### 4.4 동기화 전략: Last-Write-Wins + 버전 벡터

```
클라이언트 A (모바일)              서버                클라이언트 B (PC)
     │                              │                       │
     ├── 게임 플레이 (로컬 저장) ──>│                       │
     │   localStorage 업데이트      │                       │
     │                              │                       │
     ├── 자동 세이브 ─────────────>│ save_version++         │
     │   POST /api/v1/saves        │ updated_at = now()    │
     │   { version, data, hash }   │                       │
     │                              │                       │
     │                              │<── 로그인 ────────────┤
     │                              │    GET /api/v1/saves  │
     │                              │──> { version, data } ─>│
     │                              │                       │
     │                              │    충돌 감지:          │
     │                              │    local.ver < remote  │
     │                              │    → 서버 데이터 적용  │
     │                              │    local.ver > remote  │
     │                              │    → 로컬 업로드       │
     │                              │    local.ver == remote │
     │                              │    → hash 비교, 다르면 │
     │                              │      최신 timestamp 우선│
```

### 4.5 구현 아키텍처

```
backend/src/
  ├── models/
  │   └── SaveData.ts            # save_data 모델
  ├── services/
  │   └── save.service.ts        # 세이브 CRUD, 버전 관리, 충돌 해결
  ├── controllers/
  │   └── save.controller.ts     # 세이브/로드 엔드포인트
  └── routes/
      └── save.routes.ts         # GET/POST/PUT /api/v1/saves

backend/migrations/
  └── 03_save_data.sql           # save_data 테이블

frontend/src/
  ├── services/
  │   └── save.service.ts        # 세이브/로드 API 호출
  ├── store/
  │   └── saveSlice.ts           # Redux: 세이브 상태 관리
  └── utils/
      ├── localSave.ts           # localStorage 세이브/로드
      └── syncManager.ts         # 온라인/오프라인 동기화 관리
```

### 4.6 REST API 설계

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/v1/saves` | 현재 사용자의 세이브 메타 목록 |
| `GET` | `/api/v1/saves/:slot` | 특정 슬롯의 세이브 데이터 로드 |
| `POST` | `/api/v1/saves` | 새 세이브 생성 |
| `PUT` | `/api/v1/saves/:slot` | 세이브 업데이트 (version 체크) |
| `DELETE` | `/api/v1/saves/:slot` | 세이브 삭제 |
| `POST` | `/api/v1/saves/sync` | 충돌 해결 동기화 |

### 4.7 세이브 데이터 스키마

```sql
CREATE TABLE save_data (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  slot          SMALLINT NOT NULL DEFAULT 1,     -- 세이브 슬롯 (1~3)
  version       INTEGER NOT NULL DEFAULT 1,       -- 낙관적 잠금 버전
  data          JSONB NOT NULL,                    -- 게임 상태 전체
  checksum      VARCHAR(64) NOT NULL,              -- SHA-256 무결성 검증
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slot)
);
```

### 4.8 자동 세이브 정책

| 트리거 | 조건 | 방식 |
|--------|------|------|
| **주기적** | 5분마다 | localStorage 즉시 + 서버 debounce |
| **액션 기반** | 물주기/수확/구매 후 | localStorage 즉시 |
| **포커스 이탈** | `visibilitychange` hidden | localStorage 즉시 + 서버 전송 |
| **명시적** | 사용자 "저장" 버튼 | localStorage + 서버 즉시 |

### 4.9 예상 소요시간

| 태스크 | 시간 |
|--------|------|
| save_data DB 마이그레이션 | 1h |
| 백엔드 save.service + CRUD 엔드포인트 | 5h |
| 버전 충돌 해결 로직 | 3h |
| 프론트엔드 localSave 유틸리티 | 2h |
| syncManager (온라인/오프라인 감지 + 동기화) | 4h |
| Redux saveSlice + 자동 세이브 미들웨어 | 3h |
| 세이브/로드 UI (슬롯 선택, 충돌 해결 모달) | 3h |
| 무결성 검증 (checksum) | 1h |
| 테스트 (오프라인 시나리오, 충돌 시나리오) | 3h |
| **합계** | **25h** |

### 4.10 의존성

- 사용자 인증 시스템 (JWT) - 이미 구현됨
- PostgreSQL + Knex - 이미 구현됨
- `navigator.onLine` + `online`/`offline` 이벤트 (네이티브)

---

## 5. 스프라이트 아틀라스 및 렌더링 배칭

### 5.1 현재 상태

- PIXI_MIGRATION_PLAN.md에서 PixiJS v8 마이그레이션이 계획됨
- SPRITE_ANALYSIS.md에서 스프라이트 요구사항 분석 완료
- 현재는 React + Tailwind CSS로 이모지 기반 식물 표시

### 5.2 기술 조사

#### Canvas 2D API (네이티브)

| 항목 | 내용 |
|------|------|
| **장점** | 제로 의존성, 간단한 2D 렌더링 |
| **단점** | CPU 기반, 배칭 수동 구현, 성능 한계 (100+ 스프라이트에서 프레임 드롭) |
| **적합 시나리오** | 매우 단순한 게임, 스프라이트 10개 이하 |

#### WebGL 직접 구현

| 항목 | 내용 |
|------|------|
| **장점** | GPU 가속, 최대 성능, 완전한 제어 |
| **단점** | 극도의 복잡도, 셰이더 직접 작성, 수개월 개발 |
| **적합 시나리오** | 고도의 커스텀 렌더링이 필요한 AAA급 게임 |

#### PixiJS v8

| 항목 | 내용 |
|------|------|
| **장점** | WebGL2 자동 배칭, TypeScript 네이티브, nearest-neighbor 필터링, 거대한 생태계 |
| **단점** | ~150KB 번들, 학습 곡선 |
| **적합 시나리오** | 2D 게임, 픽셀아트, 시뮬레이션 |

#### Phaser 3

| 항목 | 내용 |
|------|------|
| **장점** | 풀스택 게임 프레임워크, 물리엔진/오디오/입력 통합 |
| **단점** | ~500KB 번들, React 통합 어려움, 과도한 기능 |
| **적합 시나리오** | 완전한 게임 프로젝트 (React 미사용) |

### 5.3 구현 옵션 비교

| 기준 | Canvas 2D | WebGL 직접 | PixiJS v8 | Phaser 3 |
|------|-----------|-----------|-----------|----------|
| **자동 배칭** | 불가 | 수동 | 자동 | 자동 |
| **스프라이트 성능** | ~100개 | ~10,000개 | ~10,000개 | ~10,000개 |
| **React 통합** | 수동 | 수동 | @pixi/react | 매우 어려움 |
| **아틀라스 지원** | 수동 파싱 | 수동 | TexturePacker JSON 네이티브 | Texture Packer 네이티브 |
| **구현 난이도** | 중 | 최상 | 중 | 중상 |
| **번들 크기** | 0KB | 0KB | ~150KB | ~500KB |
| **성능 영향** | CPU 병목 | GPU 최적 | GPU 최적 | GPU 최적 |

### 5.4 권장안: PixiJS v8 + TexturePacker 아틀라스

**선택 근거:**
- PIXI_MIGRATION_PLAN.md에서 이미 PixiJS v8 선정 → 일관성
- 자동 스프라이트 배칭으로 같은 아틀라스의 스프라이트를 1 draw call로 렌더링
- nearest-neighbor 필터링으로 픽셀아트 선명도 보장
- @pixi/react로 기존 React 앱과 자연스러운 통합

### 5.5 스프라이트 아틀라스 설계

```
frontend/public/assets/sprites/
  ├── atlas/
  │   ├── plants.json            # 식물 스프라이트 아틀라스 (15종 x 6단계 = 90 프레임)
  │   ├── plants.png             # 2048x2048 스프라이트시트 (32x32 각 프레임)
  │   ├── ui.json                # UI 요소 아틀라스 (버튼, 게이지, 아이콘)
  │   ├── ui.png                 # UI 스프라이트시트
  │   ├── effects.json           # 이펙트 아틀라스 (파티클, 날씨)
  │   └── effects.png            # 이펙트 스프라이트시트
  └── raw/                       # 원본 개별 스프라이트 (빌드 시 아틀라스로 패킹)
      ├── plants/
      │   ├── rose-seed.png
      │   ├── rose-sprout.png
      │   └── ...
      ├── ui/
      └── effects/
```

### 5.6 렌더링 배칭 전략

| 레이어 | 렌더링 방식 | Draw Calls (예상) |
|--------|-------------|-------------------|
| **배경** | TilingSprite (반복 패턴 1장) | 1 |
| **정원 그리드** | Container + 동일 아틀라스 Sprite | 1 (자동 배칭) |
| **식물들** | Container + plants 아틀라스 Sprite | 1 (자동 배칭) |
| **파티클** | ParticleContainer (effects 아틀라스) | 1 |
| **UI 오버레이** | Container + ui 아틀라스 | 1 |
| **텍스트** | BitmapText (같은 폰트) | 1 |
| **합계** | | **~6 draw calls** |

### 5.7 성능 최적화 기법

| 기법 | 설명 | 성능 이득 |
|------|------|-----------|
| **텍스처 아틀라스** | 개별 이미지 → 1장 스프라이트시트 | HTTP 요청 90% 감소, 배칭 가능 |
| **오브젝트 풀링** | 파티클/이펙트 재사용 | GC 압력 감소 |
| **뷰포트 컬링** | 화면 밖 스프라이트 `renderable = false` | GPU 부하 감소 |
| **더티 플래그** | 변경된 스프라이트만 업데이트 | CPU 연산 감소 |
| **Power-of-2 텍스처** | 2048x2048 아틀라스 | GPU 메모리 최적화 |
| **WebP 포맷** | PNG 대비 ~30% 용량 감소 | 로딩 시간 감소 |

### 5.8 예상 소요시간

| 태스크 | 시간 |
|--------|------|
| PixiJS v8 + @pixi/react 설치 및 설정 | 2h |
| 스프라이트 아틀라스 빌드 파이프라인 (TexturePacker/free-tex-packer) | 3h |
| 식물 스프라이트 제작 (15종 x 6단계, 32x32 픽셀) | 12h |
| UI 스프라이트 제작 (버튼, 게이지, 아이콘) | 6h |
| PixiJS Application + Stage 설정 | 3h |
| 식물 렌더링 컴포넌트 (AnimatedSprite) | 4h |
| 정원 그리드 렌더링 + 레이어 시스템 | 4h |
| ParticleContainer 이펙트 시스템 | 4h |
| 뷰포트 컬링 + 오브젝트 풀링 | 3h |
| 성능 프로파일링 + 최적화 | 3h |
| **합계** | **44h** |

### 5.9 의존성

- `pixi.js` v8 (핵심)
- `@pixi/react` (React 통합)
- `free-tex-packer-core` 또는 TexturePacker CLI (빌드 도구)
- 칩튠 BGM 영역: @pixi/sound는 PixiJS 설치 후 추가
- 터치 제스처 영역: PixiJS EventSystem 활용

---

## 6. KO/EN 다국어 지원

### 6.1 기술 조사

#### react-i18next

| 항목 | 내용 |
|------|------|
| **개요** | i18next의 React 바인딩, 가장 널리 사용되는 i18n 솔루션 |
| **장점** | 네임스페이스, 복수형, 보간, lazy 로딩, 풍부한 플러그인 |
| **단점** | 설정 복잡도, 번들 크기 |
| **번들 크기** | ~15KB gzipped (i18next + react-i18next) |
| **라이선스** | MIT |

#### react-intl (FormatJS)

| 항목 | 내용 |
|------|------|
| **개요** | ICU MessageFormat 기반 국제화 라이브러리 |
| **장점** | ICU 표준 준수, 날짜/숫자 포맷 강력, Yahoo/Meta 지원 |
| **단점** | 학습 곡선 (ICU 문법), 단순 키-값 매핑에 과도 |
| **번들 크기** | ~12KB gzipped |

#### typesafe-i18n

| 항목 | 내용 |
|------|------|
| **개요** | TypeScript 전용 경량 i18n |
| **장점** | 완전한 타입 안전성, 자동 완성, 경량 (~2KB) |
| **단점** | 생태계 작음, 플러그인 제한적 |
| **번들 크기** | ~2KB gzipped |

#### 커스텀 Context + JSON

| 항목 | 내용 |
|------|------|
| **개요** | React Context + JSON 번역 파일 자체 구현 |
| **장점** | 제로 의존성, 완전한 제어 |
| **단점** | 복수형/포맷 직접 구현, 확장성 제한 |
| **번들 크기** | 0KB |

### 6.2 구현 옵션 비교

| 기준 | react-i18next | react-intl | typesafe-i18n | 커스텀 |
|------|--------------|------------|---------------|--------|
| **타입 안전성** | 플러그인 | 부분 | 완전 | 수동 |
| **복수형 처리** | 자동 | ICU 기반 | 자동 | 수동 |
| **Lazy 로딩** | 내장 | 수동 | 내장 | 수동 |
| **PixiJS 텍스트 연동** | 수동 | 수동 | 수동 | 수동 |
| **생태계/커뮤니티** | 최대 | 대 | 소 | N/A |
| **구현 난이도** | 하 | 중 | 하 | 중 |
| **성능 영향** | 최소 | 최소 | 최소 | 최소 |

### 6.3 권장안: react-i18next + TypeScript 키 타이핑

**선택 근거:**
- 프로젝트가 React + TypeScript 기반 → react-i18next가 가장 성숙한 선택
- 네임스페이스로 게임 텍스트 / UI 텍스트 / 알림 텍스트 분리 가능
- JSON 번역 파일의 lazy 로딩으로 초기 번들에 전체 번역 포함 불필요
- PixiJS BitmapText와의 연동은 i18next 인스턴스 직접 호출로 해결

### 6.4 콘텐츠 구조

```
frontend/src/locales/
  ├── ko/
  │   ├── common.json            # 공통 UI (버튼, 네비게이션, 에러)
  │   ├── game.json              # 게임 내 텍스트 (행동, 상태, 이벤트)
  │   ├── plants.json            # 식물 이름, 설명, 성장 단계
  │   └── notifications.json     # 푸시 알림 텍스트
  ├── en/
  │   ├── common.json
  │   ├── game.json
  │   ├── plants.json
  │   └── notifications.json
  └── index.ts                   # i18next 초기화 설정
```

### 6.5 번역 파일 예시

```json
// ko/game.json
{
  "actions": {
    "water": "물 주기",
    "harvest": "수확하기",
    "plant": "심기",
    "fertilize": "비료 주기"
  },
  "status": {
    "health": "건강도",
    "growth": "성장률",
    "stage": {
      "seed": "씨앗",
      "sprout": "새싹",
      "seedling": "모종",
      "vegetative": "성장기",
      "mature": "성숙",
      "harvest": "수확 가능"
    }
  },
  "messages": {
    "waterSuccess": "{{plantName}}에 물을 주었습니다!",
    "harvestReady": "{{plantName}}이(가) 수확할 준비가 되었습니다!",
    "healthWarning": "{{plantName}}의 건강도가 {{health}}%로 낮습니다!"
  }
}
```

```json
// en/game.json
{
  "actions": {
    "water": "Water",
    "harvest": "Harvest",
    "plant": "Plant",
    "fertilize": "Fertilize"
  },
  "status": {
    "health": "Health",
    "growth": "Growth Rate",
    "stage": {
      "seed": "Seed",
      "sprout": "Sprout",
      "seedling": "Seedling",
      "vegetative": "Vegetative",
      "mature": "Mature",
      "harvest": "Ready to Harvest"
    }
  },
  "messages": {
    "waterSuccess": "Watered {{plantName}} successfully!",
    "harvestReady": "{{plantName}} is ready to harvest!",
    "healthWarning": "{{plantName}} health is low at {{health}}%!"
  }
}
```

### 6.6 PixiJS 텍스트 연동 전략

```typescript
// PixiJS 내 텍스트 렌더링에서 i18next 직접 사용
import i18n from '../locales';

// BitmapText에 번역 적용
const statusText = new BitmapText({
  text: i18n.t('game:status.health'),
  style: { fontFamily: 'PixelFont', fontSize: 16 }
});

// 언어 변경 시 PixiJS 텍스트 갱신
i18n.on('languageChanged', () => {
  statusText.text = i18n.t('game:status.health');
});
```

### 6.7 언어 감지 및 전환 전략

| 전략 | 설명 |
|------|------|
| **초기 감지** | `navigator.language` → 지원 언어 매칭 → 폴백 ko |
| **사용자 선택** | 설정 화면 언어 드롭다운 → localStorage 저장 |
| **우선순위** | localStorage > navigator.language > 기본값(ko) |
| **실시간 전환** | i18n.changeLanguage() → React 리렌더 + PixiJS 텍스트 갱신 |

### 6.8 예상 소요시간

| 태스크 | 시간 |
|--------|------|
| i18next + react-i18next 설치 및 초기화 | 2h |
| 번역 파일 구조 설계 + KO 원본 텍스트 추출 | 3h |
| EN 번역 작성 | 4h |
| React 컴포넌트 i18n 적용 (useTranslation 훅) | 4h |
| PixiJS BitmapText 연동 헬퍼 | 2h |
| 언어 전환 UI + 감지 로직 | 2h |
| 푸시 알림 다국어 처리 (서버 사이드) | 2h |
| 식물 카탈로그 데이터 다국어화 (DB) | 2h |
| 테스트 (언어 전환, 누락 키 체크) | 2h |
| **합계** | **23h** |

### 6.9 의존성

- `i18next` + `react-i18next` + `i18next-browser-languagedetector` 패키지
- 식물 카탈로그 데이터에 이미 `name_ko`, `name_en` 필드 존재 (TECHNICAL_DESIGN.md 확인)
- 푸시 알림 영역: 서버 측 번역 파일 연동

---

## 7. 영역 간 의존성 맵

```
                    ┌─────────────────────────┐
                    │  (5) 스프라이트 아틀라스  │  ◄── 기반 인프라
                    │     + 렌더링 배칭        │
                    │     (PixiJS v8 설치)     │
                    └──────┬───────┬──────────┘
                           │       │
              ┌────────────┘       └────────────┐
              ▼                                  ▼
   ┌─────────────────────┐          ┌─────────────────────┐
   │ (1) 칩튠 BGM/효과음  │          │  (2) 터치 제스처     │
   │   (@pixi/sound)      │          │   (PixiJS Event)    │
   └─────────────────────┘          └─────────────────────┘
              │                                  │
              └──────────┐  ┌────────────────────┘
                         ▼  ▼
              ┌─────────────────────┐
              │  (6) KO/EN 다국어   │  ◄── UI/게임 텍스트 통합
              │   (react-i18next)   │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ (3) PWA 푸시  │ │ (4) 클라우드  │ │  게임 플레이  │
│   알림        │ │  세이브/로드  │ │   통합        │
└──────────────┘ └──────────────┘ └──────────────┘
```

### 의존성 요약 테이블

| 영역 | 선행 의존 | 병렬 가능 |
|------|----------|-----------|
| **(5) 스프라이트/배칭** | 없음 (가장 먼저) | - |
| **(1) 칩튠 BGM** | (5) PixiJS 설치 | (2)와 병렬 |
| **(2) 터치 제스처** | (5) PixiJS 설치 | (1)과 병렬 |
| **(6) 다국어** | (1)(2) 텍스트 확정 후 | (3)(4)와 병렬 |
| **(3) PWA 푸시** | (6) 알림 텍스트 | (4)와 병렬 |
| **(4) 클라우드 세이브** | 없음 (백엔드 독립) | (3)과 병렬 |

---

## 8. 통합 일정 및 우선순위

### 8.1 총 예상 소요시간

| 영역 | 예상 시간 | 난이도 | 우선순위 |
|------|----------|--------|----------|
| (5) 스프라이트 아틀라스 + 렌더링 배칭 | 44h | 중상 | P0 (기반) |
| (4) 클라우드 세이브/로드 | 25h | 중 | P1 |
| (6) KO/EN 다국어 지원 | 23h | 중하 | P1 |
| (1) 칩튠 BGM + 효과음 | 22h | 중 | P2 |
| (2) 터치 제스처 최적화 | 20h | 중 | P2 |
| (3) PWA 푸시 알림 | 20h | 중 | P3 |
| **합계** | **154h** | | |

### 8.2 권장 구현 순서 (스프린트 단위)

```
Sprint 1 (Week 1-2): 기반 구축
  └── (5) 스프라이트 아틀라스 + PixiJS v8 렌더링 파이프라인
  └── (4) 클라우드 세이브/로드 백엔드 API (프론트와 병렬)

Sprint 2 (Week 3-4): 게임 인터랙션
  └── (1) 칩튠 BGM + 효과음 (@pixi/sound)
  └── (2) 터치 제스처 (PixiJS EventSystem)
  └── (4) 클라우드 세이브/로드 프론트엔드 동기화

Sprint 3 (Week 5-6): 글로벌 + 알림
  └── (6) KO/EN 다국어 (react-i18next)
  └── (3) PWA 푸시 알림 (Web Push API)
  └── 통합 테스트 + 성능 최적화
```

### 8.3 기술 스택 요약

| 패키지 | 버전 | 용도 | 추가 번들 |
|--------|------|------|-----------|
| `pixi.js` | v8.x | 렌더링 엔진 | ~150KB |
| `@pixi/react` | v8.x | React 통합 | ~5KB |
| `@pixi/sound` | v6.x | 오디오 | ~15KB |
| `i18next` | v23.x | 다국어 코어 | ~10KB |
| `react-i18next` | v14.x | React 바인딩 | ~5KB |
| `web-push` | v3.x | 서버 푸시 (백엔드) | 0KB (프론트) |
| **프론트엔드 추가 번들 합계** | | | **~185KB gzipped** |

### 8.4 리스크 및 완화 전략

| 리스크 | 영향도 | 완화 전략 |
|--------|--------|-----------|
| iOS Safari 오디오 잠금 | 중 | 첫 인터랙션에서 AudioContext 명시적 활성화 |
| iOS Safari 푸시 미지원 (비PWA) | 중 | PWA 설치 유도 배너 + 인앱 알림 폴백 |
| 스프라이트 아트 제작 병목 | 상 | AI 픽셀아트 도구 (Aseprite + Stable Diffusion) 또는 에셋 스토어 활용 |
| 클라우드 동기화 충돌 | 중 | 명시적 충돌 해결 UI + 양쪽 데이터 미리보기 |
| PixiJS v8 브레이킹 체인지 | 하 | 버전 고정 (package-lock.json) |
| 번들 크기 증가 (+185KB) | 중 | 코드 스플리팅 + lazy import (게임 씬 진입 시 로드) |

---

> **문서 끝**
> 본 기술 계획서는 프로젝트 현재 상태(Phase 1 완료, PixiJS 마이그레이션 계획 수립)를 기반으로 작성되었습니다.
> 각 영역의 세부 구현 명세는 스프린트 착수 시 별도 설계 문서로 작성합니다.
