# Plantii 프로젝트 현황 조사 보고서

> **조사일**: 2026-04-24
> **목적**: 시나리오/스토리, 게임 상태 관리, 진행도 시스템, 엔딩/결과 화면 관련 기존 구현 현황 파악

---

## 1. 프로젝트 루트 디렉토리 구조

```
plantii/
├── backend/                    # Node.js + Express + TypeScript 백엔드
│   ├── src/
│   │   ├── config/             # DB 설정 (database.ts, knexfile.ts)
│   │   ├── controllers/        # auth, plant, userPlant 컨트롤러
│   │   ├── models/             # User, Plant, UserPlant 모델
│   │   ├── services/           # auth, plant, userPlant, simulation 서비스
│   │   ├── routes/             # API 라우트 정의
│   │   ├── jobs/               # simulationCron.ts (매시간 배경 시뮬레이션)
│   │   ├── middleware/         # auth, errorHandler
│   │   ├── utils/              # encryption, logger, response, validation
│   │   └── tests/              # unit, integration 테스트
│   └── migrations/             # SQL 마이그레이션 (스키마 + 시드)
│
├── frontend/                   # React 18 + TypeScript + Vite + Tailwind
│   └── src/
│       ├── components/         # Button, Layout, PrivateRoute, ProgressBar
│       ├── contexts/           # AuthContext (인증 상태 관리)
│       ├── pages/              # Dashboard, Collection, Login, Register, Profile
│       ├── services/           # api.ts, auth.service.ts, plant.service.ts
│       ├── assets/plants/      # 15종 x 5단계 = 75개 스프라이트 PNG
│       └── styles/             # index.css (Tailwind)
│
├── docs/                       # 프로젝트 문서
│   ├── MILESTONE_GARDEN_ECONOMY_SYSTEM.md   # Phase 2 기획 (정원/경제 시스템)
│   ├── MILESTONE_REVIEW_REPORT.md           # 마일스톤 리뷰
│   ├── PIXI_MIGRATION_PLAN.md               # PixiJS 마이그레이션 계획
│   ├── SPRITE_ANALYSIS.md                   # 스프라이트 분석
│   ├── TECH_RESEARCH.md                     # 기술 리서치
│   └── TECHNICAL_DESIGN.md                  # 기술 설계 문서
│
├── scripts/                    # generate_plant_sprites.py
├── plant_catalog_15species.*   # 15종 식물 카탈로그 (CSV/JSON)
├── plant_growth_data.*         # 식물 성장 데이터
└── TECHNICAL_DESIGN.md         # 루트 기술 설계 문서
```

**기술 스택**: Node.js 20 + Express + TypeScript + PostgreSQL(Knex) / React 18 + Vite + Tailwind CSS

---

## 2. 시나리오/스토리 관련 기존 코드 및 문서

### 결론: 시나리오/스토리 시스템은 존재하지 않음

프로젝트 전체를 검색한 결과 (scenario, story, ending, 시나리오, 스토리, 엔딩 키워드), **게임 내 시나리오나 스토리 시스템은 전혀 구현되어 있지 않습니다.**

- "시나리오"라는 단어는 테스트 보고서(`test-report.md`, `VALIDATION_REPORT.md`)에서 **테스트 시나리오**(회원가입 -> 로그인 -> 식물 추가 -> 액션) 맥락으로만 사용됨
- 튜토리얼, 내러티브, 퀘스트, 이벤트 체인 등의 개념은 코드/문서 어디에도 없음
- 식물 카탈로그에 `description` 필드가 존재하나 짧은 설명 용도이지 스토리용이 아님

### 기존에 존재하는 "시나리오적 요소"

| 요소 | 현황 | 위치 |
|------|------|------|
| 식물 성장 단계 | seed -> sprout -> seedling -> vegetative -> flowering -> fruiting -> mature -> harvestable (8단계) | `migrations/01_initial_schema.sql`, `simulation.service.ts` |
| 식물 카탈로그 | 15종, 5개 카테고리 (화훼, 다육, 허브, 관엽, 채소) | `plant_catalog_15species.json` |
| 난이도 분류 | easy / medium / hard | `Plant.ts` 모델 |
| 업적 시스템 (스키마만) | DB 테이블 정의됨 (achievements, user_achievements) | `migrations/01_initial_schema.sql` |

---

## 3. 게임 상태 관리 및 진행도 시스템

### 3.1 사용자 상태 (`User` 모델)

```typescript
// backend/src/models/User.ts
interface User {
  id: string;              // UUID
  username: string;
  email: string;
  experience_points: number; // 기본값 0 - 물주기(+5), 수확 시 보상
  level: number;             // 기본값 1 - 레벨업 로직 미구현
  coins: number;             // 기본값 1000 - 수확 시 획득, 소비 메커니즘 없음
  is_active: boolean;
}
```

**핵심 이슈**:
- `level`은 DB에 존재하나 **레벨업 로직이 구현되지 않음** (경험치 -> 레벨 변환 없음)
- `coins`은 수확 시 획득되나 **소비 메커니즘이 없음** (환경 조절 응답에 `cost_coins: 10`이 포함되나 실제 차감 안 됨)

### 3.2 식물 상태 (`UserPlant` 모델)

```typescript
// backend/src/models/UserPlant.ts
interface UserPlant {
  current_stage: string;        // 'seed' | 'sprout' | ... | 'harvestable'
  current_age_days: number;     // 경과 일수 (실수)
  health: number;               // 0-100 건강도
  growth_progress: number;      // 0-100 성장 진행도
  temperature?: number;         // 현재 온도
  humidity?: number;            // 현재 습도
  light_dli?: number;           // 광량 (DLI)
  soil_moisture?: number;       // 토양 수분 0-100
  is_active: boolean;           // 활성 여부
  is_wilted: boolean;           // 시들음 여부 (health < 20 || moisture < 20)
  is_harvestable: boolean;      // 수확 가능 여부
  optimal_days_count: number;   // 최적 환경 유지 일수
}
```

### 3.3 시뮬레이션 엔진 (`simulation.service.ts`)

매시간 크론잡(`simulationCron.ts`)이 실행되며 모든 활성 식물에 대해:

1. **환경 인자 계산**: 온도, 습도, 광량, 수분 각각 0~1 범위의 계수 산출
2. **성장률 계산**: 4가지 계수의 곱 x 기본 성장률 (0~2 범위로 클램핑)
3. **건강도 갱신**: 환경 점수에 따라 시간당 +0.5 ~ -2.0 변동
4. **토양 수분 증발**: 온도/습도에 따른 시간당 감소
5. **성장 단계 결정**: `current_age_days` 기반으로 자동 단계 전환
6. **수확 가능 판정**: `age >= harvest_days_min`이면 수확 가능
7. **시들음 판정**: `health < 20 || moisture < 20`이면 시들음
8. **상태 히스토리 저장**: `plant_states` 테이블에 시계열 기록

### 3.4 진행도 시스템의 한계

| 항목 | 상태 | 비고 |
|------|------|------|
| 식물별 성장 진행도 | 구현됨 | `growth_progress` 0-100% |
| 사용자 레벨 시스템 | 스키마만 | 레벨업 로직 미구현 |
| 업적 시스템 | 스키마만 | `achievements`, `user_achievements` 테이블 존재, 코드 없음 |
| 식물 잠금해제 | 스키마만 | `unlock_level`, `unlock_cost` 필드 존재, 로직 미구현 |
| 멀티 식물 관리 | 부분적 | DB는 다수 식물 지원, Dashboard는 `data[0]`만 표시 |
| 정원 그리드 | 미구현 | Phase 2에서 계획 중 (`MILESTONE_GARDEN_ECONOMY_SYSTEM.md`) |
| 코인 경제 | 최소한 | 수확 시 획득만, 소비/상점 미구현 |

---

## 4. 엔딩 또는 결과 화면 관련 구현

### 결론: 전용 엔딩/결과 화면은 존재하지 않음

현재 게임에는 두 가지 "종료 상태"가 존재하지만, **전용 결과 화면(Result Screen)이나 엔딩 화면은 구현되어 있지 않습니다.**

### 4.1 수확 (긍정적 종료)

- **트리거**: `is_harvestable === true`일 때 Dashboard에 "수확하기" 버튼 표시
- **처리**: `userPlant.service.ts`의 `harvestPlant()` 호출
  - 보상 계산: 기본 경험치/코인 + 최적 유지율 70% 이상이면 1.5배 보너스
  - 식물을 `is_active: false`로 설정하고 `harvested_at` 기록
- **UI 피드백**: `window.confirm()` 확인 후, 텍스트 메시지 배너 (`수확 완료! 경험치 X와 코인 Y를 획득했습니다!`)
- **이후**: 식물 목록에서 제거되고, 식물이 없으면 "아직 식물이 없습니다" 빈 화면 표시

```tsx
// Dashboard.tsx - 수확 후 유일한 피드백
setMessage(`수확 완료! 경험치 ${result.rewards.total_experience}와 코인 ${result.rewards.total_coins}를 획득했습니다!`);
```

### 4.2 시들음/죽음 (부정적 종료)

- **트리거**: `health < 20 || soil_moisture < 20`이면 `is_wilted: true` 설정
- **처리**: 크론잡에서 자동 판정, 별도의 "식물 죽음" 처리 없음
- **UI 피드백**: **없음** - `is_wilted` 상태에 대한 프론트엔드 처리가 전혀 없음
- 시들은 식물이 자동으로 제거되거나 특별한 화면이 표시되지 않음

### 4.3 기존 페이지 구성 (App.tsx 라우팅)

| 경로 | 페이지 | 비고 |
|------|--------|------|
| `/login` | Login | 공개 |
| `/register` | Register | 공개 |
| `/` | Dashboard | 인증 필요 - 메인 식물 관리 화면 |
| `/collection` | Collection | 인증 필요 - 식물 도감 |
| `/profile` | Profile | 인증 필요 - 사용자 정보 |
| `*` | -> `/` 리다이렉트 | 폴백 |

- 수확 결과 페이지, 엔딩 화면, 요약 화면 등 **전용 결과 페이지는 없음**
- 성장 히스토리 보기, 통계 화면, 리더보드 등 **분석 페이지도 없음**

---

## 5. 종합 요약 및 현황 판정

### 5.1 현재 프로젝트 단계: Phase 1 (핵심 시뮬레이션)

Plantii는 **식물 성장 시뮬레이션 엔진**이 핵심이며, Phase 1 수준의 MVP가 구현되어 있습니다.

### 5.2 구현 완료 항목

- 사용자 인증 (JWT 기반 회원가입/로그인)
- 15종 식물 카탈로그 + 5단계 스프라이트
- 환경 변수 기반 성장 시뮬레이션 엔진 (온도/습도/광량/수분)
- 매시간 배경 시뮬레이션 크론잡
- 물주기, 환경 조절, 수확 API
- 기본 Dashboard/Collection/Profile 페이지
- DB 스키마 (users, plants, user_plants, plant_states, achievements 등)

### 5.3 미구현 / 부재 항목 (시나리오/엔딩 관점)

| 카테고리 | 항목 | 상태 |
|----------|------|------|
| **시나리오/스토리** | 튜토리얼 | 없음 |
| | 퀘스트/미션 시스템 | 없음 |
| | 이벤트/내러티브 | 없음 |
| | 식물별 스토리 | 없음 |
| **엔딩/결과** | 수확 결과 전용 화면 | 없음 (텍스트 메시지만) |
| | 식물 죽음 처리 화면 | 없음 |
| | 성장 요약/리포트 | 없음 |
| | 엔딩 분기/다중 엔딩 | 없음 |
| **진행도** | 레벨업 시스템 | 스키마만 |
| | 업적 시스템 | 스키마만 |
| | 식물 잠금해제 | 스키마만 |
| | 멀티 식물 동시 관리 UI | 없음 (Dashboard는 첫 번째만 표시) |
| **경제** | 상점 | 없음 |
| | 코인 소비 | 없음 |
| | 도구/아이템 | 없음 |

### 5.4 확장 시 활용 가능한 기존 인프라

1. **`plant_states` 테이블**: 시계열 데이터가 매시간 기록됨 -> 성장 리포트/요약 화면에 활용 가능
2. **`achievements` / `user_achievements` 테이블**: 스키마 준비됨 -> 업적 시스템 구현 시 바로 활용
3. **`optimal_days_count` / `total_water_given` 등 통계 필드**: 이미 추적 중 -> 엔딩 등급/보상 분기에 활용 가능
4. **`growth_stages` 테이블**: 8단계 정의됨 -> 단계별 이벤트/스토리 트리거로 확장 가능
5. **15종 x 5단계 스프라이트**: 시각적 결과 화면에 즉시 활용 가능
6. **Phase 2 기획문서** (`MILESTONE_GARDEN_ECONOMY_SYSTEM.md`): 정원 그리드, 상점, 도구, 코인 경제 등 상세 설계 완료

---

*보고서 작성 완료*
