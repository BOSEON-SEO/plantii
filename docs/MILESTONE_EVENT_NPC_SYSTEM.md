# Plantii Phase 3 - Milestone: Event & NPC System

> **Version**: 1.0
> **Date**: 2026-04-24
> **Status**: Planning
> **Depends on**: Phase 1 (Core simulation), Phase 2 (Garden Management & Economy System)

---

## Table of Contents

1. [Milestone Overview](#1-milestone-overview)
2. [Season Cycle System](#2-season-cycle-system)
3. [Random Event System](#3-random-event-system)
4. [NPC Customer System](#4-npc-customer-system)
5. [Season Contest System](#5-season-contest-system)
6. [Core Data Structures](#6-core-data-structures)
7. [Algorithm Specifications](#7-algorithm-specifications)
8. [Database Migration Strategy](#8-database-migration-strategy)
9. [API Endpoints](#9-api-endpoints)
10. [Frontend Components](#10-frontend-components)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Risk & Open Questions](#12-risk--open-questions)

---

## 1. Milestone Overview

### 1.1 Goals

이 마일스톤은 Plantii에 시간 흐름 기반 계절 시스템, 랜덤 이벤트, NPC 고객, 시즌 컨테스트를 추가하여 게임플레이 루프를 풍부하게 만든다.

### 1.2 Dependency Graph

```
Phase 1: Core Simulation (plants, growth, auth)
    |
Phase 2: Garden Management & Economy (shop, tools, coins)
    |
Phase 3: Event & NPC System  <-- THIS MILESTONE
    ├── Module A: Season Cycle System
    ├── Module B: Random Event System  (depends on A)
    ├── Module C: NPC Customer System  (depends on Phase 2 Economy)
    └── Module D: Season Contest System (depends on A, C)
```

### 1.3 Key Constraints

| Constraint | Detail |
|------------|--------|
| Backend Stack | Node.js + Express + TypeScript + PostgreSQL/Knex (기존 유지) |
| Frontend Stack | React 18 + TypeScript + Vite + Tailwind (기존 유지) |
| Game Time | 현실 1일 = 게임 내 1일. 계절은 현실 시간 기반으로 진행 |
| Backward Compatibility | 기존 user_plants, plants 테이블 구조 유지. 신규 테이블/컬럼 추가만 허용 |

---

## 2. Season Cycle System

### 2.1 Season Definitions

```typescript
enum Season {
  SPRING = 'spring',  // 봄
  SUMMER = 'summer',  // 여름
  AUTUMN = 'autumn',  // 가을
  WINTER = 'winter',  // 겨울
}
```

| Season | Game Duration | Real Duration | Temp Range (C) | Humidity Range (%) | Light (hours) |
|--------|--------------|---------------|-----------------|-------------------|---------------|
| SPRING | 30 game-days | 30 real-days | 12-22 | 55-70 | 12-14 |
| SUMMER | 30 game-days | 30 real-days | 25-35 | 60-80 | 14-16 |
| AUTUMN | 30 game-days | 30 real-days | 8-20 | 45-65 | 10-12 |
| WINTER | 30 game-days | 30 real-days | -5-10 | 30-50 | 8-10 |

**Full Cycle**: 120일 (약 4개월) = 1 게임 년도

### 2.2 Season Transition Mechanism

```typescript
interface SeasonTransition {
  current_season: Season;
  next_season: Season;
  transition_start_day: number;   // 전환 시작 (계절 마지막 3일)
  transition_duration: number;    // 3 game-days
  blend_factor: number;           // 0.0 (current) -> 1.0 (next)
}
```

**전환 알고리즘**:

```
// 계절 결정
function getCurrentSeason(gameDayInYear: number): Season {
  // gameDayInYear: 1-120
  if (gameDayInYear <= 30) return SPRING;
  if (gameDayInYear <= 60) return SUMMER;
  if (gameDayInYear <= 90) return AUTUMN;
  return WINTER;
}

// 전환 블렌드 팩터 (마지막 3일)
function getTransitionBlend(gameDayInSeason: number): number {
  if (gameDayInSeason <= 27) return 0.0;  // 순수 현재 계절
  return (gameDayInSeason - 27) / 3.0;    // 28일: 0.33, 29일: 0.67, 30일: 1.0
}

// 블렌드된 환경 값
function blendedValue(currentVal, nextVal, blend): number {
  return currentVal * (1 - blend) + nextVal * blend;
}
```

### 2.3 Season Visual Changes

| Season | Background Palette | Particle Effects | UI Theme |
|--------|-------------------|------------------|----------|
| SPRING | Soft green (#A8D5BA), Light pink (#F4C2C2) | Cherry blossom petals, Light rain | Pastel borders, Flower icons |
| SUMMER | Bright green (#4CAF50), Sky blue (#87CEEB) | Sunlight rays, Heat shimmer | Bold colors, Sun icons |
| AUTUMN | Orange (#FF9800), Brown (#795548) | Falling leaves, Fog | Warm tones, Leaf icons |
| WINTER | White (#F5F5F5), Ice blue (#B3E5FC) | Snowflakes, Frost overlay | Cool tones, Snowflake icons |

**CSS Variable Approach**:

```css
:root[data-season="spring"] {
  --bg-primary: #A8D5BA;
  --bg-secondary: #F4C2C2;
  --accent: #E91E63;
  --particle-type: 'cherry-blossom';
}
/* ... same pattern for summer, autumn, winter */
```

### 2.4 Season Growth Modifiers

각 식물 카테고리별 계절 보정 계수:

```typescript
interface SeasonModifiers {
  growth_rate: number;   // 성장 속도 배율 (기본 1.0)
  yield_bonus: number;   // 수확량 보정 (기본 1.0)
  quality_bonus: number; // 품질 보정 (기본 1.0)
}
```

**카테고리별 계절 보정 매트릭스**:

| Category | Spring | Summer | Autumn | Winter |
|----------|--------|--------|--------|--------|
| **flowering** (화훼류) | growth: 1.3, yield: 1.2, quality: 1.3 | growth: 1.1, yield: 1.0, quality: 0.9 | growth: 0.7, yield: 0.8, quality: 1.1 | growth: 0.3, yield: 0.4, quality: 0.6 |
| **succulent** (다육류) | growth: 1.0, yield: 1.0, quality: 1.0 | growth: 1.2, yield: 1.1, quality: 1.0 | growth: 0.9, yield: 0.9, quality: 1.0 | growth: 0.6, yield: 0.7, quality: 0.8 |
| **herb** (허브) | growth: 1.4, yield: 1.3, quality: 1.2 | growth: 1.2, yield: 1.1, quality: 1.0 | growth: 0.8, yield: 0.9, quality: 1.1 | growth: 0.2, yield: 0.3, quality: 0.5 |
| **leafy** (엽채류) | growth: 1.3, yield: 1.2, quality: 1.2 | growth: 0.8, yield: 0.7, quality: 0.7 | growth: 1.1, yield: 1.1, quality: 1.3 | growth: 0.4, yield: 0.5, quality: 0.6 |
| **fruit** (과채류) | growth: 1.1, yield: 1.0, quality: 1.0 | growth: 1.4, yield: 1.5, quality: 1.2 | growth: 0.9, yield: 1.2, quality: 1.4 | growth: 0.1, yield: 0.2, quality: 0.4 |
| **foliage** (관엽류) | growth: 1.1, yield: 1.0, quality: 1.0 | growth: 1.2, yield: 1.0, quality: 1.0 | growth: 0.9, yield: 0.9, quality: 1.0 | growth: 0.5, yield: 0.5, quality: 0.7 |

**보정 적용 공식**:

```
effective_growth_rate = base_growth_rate
                      * season_modifier.growth_rate
                      * environment_match_factor
                      * health_factor

effective_yield = base_yield
                * season_modifier.yield_bonus
                * quality_grade_multiplier

effective_quality = base_quality_score
                  * season_modifier.quality_bonus
                  * care_consistency_bonus   // 지속적 관리 보너스 (0.9-1.2)
```

### 2.5 Season-Specific Plant Behaviors

```typescript
interface SeasonPlantBehavior {
  // 겨울 휴면
  dormancy: {
    affected_categories: ['flowering', 'herb', 'fruit'];
    growth_halt_threshold: 0.3;  // growth_rate < 0.3 이면 휴면 진입
    health_drain_rate: 0.0;      // 휴면 중 건강도 감소 없음
    water_need_reduction: 0.5;   // 물 필요량 50% 감소
  };

  // 봄 개화 부스트
  spring_bloom: {
    affected_categories: ['flowering'];
    bloom_chance_bonus: 0.3;     // 개화 확률 +30%
    special_reward_chance: 0.1;  // 특별 보상 확률 10%
  };

  // 여름 폭풍 취약
  summer_vulnerability: {
    storm_damage_multiplier: 1.5;  // 폭풍 피해 1.5배
    heat_stress_threshold: 32;     // 32도 이상 열 스트레스
  };
}
```

---

## 3. Random Event System

### 3.1 Event Categories

```typescript
enum EventCategory {
  PEST = 'pest',           // 해충 피해
  STORM = 'storm',         // 폭풍
  LUCKY_RAIN = 'lucky_rain', // 행운의 비
  RARE_SEED = 'rare_seed',   // 희귀 씨앗
  DISEASE = 'disease',       // 질병
  VISITOR = 'visitor',       // 특별 방문자 (NPC 시스템과 연동)
}

enum EventSeverity {
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  CRITICAL = 'critical',
}
```

### 3.2 Event Probability Matrix

**기본 발생 확률 (1 game-day 당)**:

| Event | Spring | Summer | Autumn | Winter | Base Prob/Day |
|-------|--------|--------|--------|--------|---------------|
| **Pest (해충)** | 0.08 | 0.15 | 0.06 | 0.02 | 0.08 |
| **Storm (폭풍)** | 0.05 | 0.12 | 0.08 | 0.10 | 0.09 |
| **Lucky Rain (행운의 비)** | 0.10 | 0.05 | 0.08 | 0.03 | 0.07 |
| **Rare Seed (희귀 씨앗)** | 0.03 | 0.02 | 0.04 | 0.01 | 0.025 |
| **Disease (질병)** | 0.04 | 0.08 | 0.05 | 0.03 | 0.05 |

**가중치 보정 요인**:

```
final_probability = base_probability
                  * season_weight
                  * garden_size_factor         // 밭 칸 수에 비례 (1 + plot_count * 0.02)
                  * consecutive_day_factor     // 이벤트 없는 연속일 보너스 (pity system)
                  * level_scaling              // 유저 레벨 스케일링 (1 + level * 0.01)
```

**Pity System (연속 미발생 보정)**:

```
consecutive_day_factor = 1.0 + (days_since_last_event * 0.05)
// 최대 2.0 (20일 연속 이벤트 없을 시)
```

### 3.3 Pest Event (해충 피해)

```typescript
interface PestEvent {
  type: 'pest';
  severity: EventSeverity;
  pest_species: string;
  affected_plots: PlotId[];     // 영향 받는 밭 칸들
  damage_rate: number;          // 피해율 (0.0 - 1.0)
  spread_chance: number;        // 인접 칸 전파 확률
  duration_days: number;        // 지속 일수
  countermeasure: string;       // 대응 수단
}
```

| Severity | Damage Rate | Spread Range | Duration | Countermeasure Cost |
|----------|------------|--------------|----------|-------------------|
| MINOR | 0.05-0.10 | 0 (해당 칸만) | 1일 | 50 coins (살충제) |
| MODERATE | 0.15-0.25 | 인접 1칸 (25%) | 2일 | 150 coins |
| MAJOR | 0.30-0.45 | 인접 2칸 (50%) | 3일 | 400 coins |
| CRITICAL | 0.50-0.70 | 전체 밭 (30%) | 5일 | 800 coins + 특수 아이템 |

**해충 종류**:

| Pest | Affected Categories | Season Peak | Damage Type |
|------|-------------------|-------------|-------------|
| 진딧물 (Aphid) | flowering, herb, leafy | Spring | 성장 속도 감소 |
| 응애 (Mite) | succulent, foliage | Summer | 건강도 감소 |
| 배추흰나비 유충 (Cabbage Worm) | leafy, herb | Spring/Autumn | 수확량 감소 |
| 곰팡이 (Fungus Gnat) | ALL | Summer (high humidity) | 뿌리 손상 → 건강도 급감 |
| 달팽이 (Snail) | leafy, herb | Spring (rainy) | 잎 손상 → 품질 감소 |

**피해 계산**:

```
daily_damage = damage_rate * (1 - plant_resistance) * severity_multiplier

plant_health -= daily_damage * 100
plant_growth_progress -= daily_damage * growth_penalty_factor

// 식물별 저항력
plant_resistance = {
  succulent: 0.3,  // 다육류 해충 저항 높음
  herb: 0.2,       // 일부 허브 저항
  default: 0.0,
}
```

### 3.4 Storm Event (폭풍)

```typescript
interface StormEvent {
  type: 'storm';
  severity: EventSeverity;
  storm_type: 'rain' | 'wind' | 'hail' | 'thunderstorm';
  affected_area: 'all';       // 전체 밭 영향
  damage_rate: number;
  soil_moisture_change: number;
  duration_hours: number;      // 게임 내 시간
}
```

| Storm Type | Severity Distribution | Crop Damage | Moisture Change | Frequency/Season |
|------------|----------------------|-------------|-----------------|-----------------|
| rain (비) | MINOR: 70%, MOD: 25%, MAJ: 5% | 0.0-0.05 | +20-40% | Summer: 3-4/season |
| wind (강풍) | MINOR: 40%, MOD: 40%, MAJ: 15%, CRIT: 5% | 0.05-0.30 | -5-15% | Autumn: 2-3/season |
| hail (우박) | MOD: 50%, MAJ: 35%, CRIT: 15% | 0.15-0.50 | +10-20% | Spring/Summer: 0-1/season |
| thunderstorm (뇌우) | MOD: 30%, MAJ: 50%, CRIT: 20% | 0.10-0.40 | +30-50% | Summer: 1-2/season |

**폭풍 피해 계산**:

```
storm_damage_per_plant = base_damage
                       * storm_severity_multiplier
                       * plant_fragility_factor        // 식물별 취약도
                       * (1 - shelter_protection)      // 보호 시설 감소

// 식물 취약도
plant_fragility = {
  flowering: 0.8,   // 꽃은 폭풍에 약함
  herb: 0.6,
  leafy: 0.7,
  fruit: 0.5,
  succulent: 0.3,   // 다육류 강인
  foliage: 0.4,
}

// 보호 시설 (Shop에서 구매 가능 - Phase 2 연동)
shelter_protection = {
  none: 0.0,
  basic_fence: 0.2,
  greenhouse: 0.6,
  reinforced_greenhouse: 0.85,
}
```

### 3.5 Lucky Rain Event (행운의 비)

```typescript
interface LuckyRainEvent {
  type: 'lucky_rain';
  bonus_type: 'growth' | 'quality' | 'both';
  growth_boost: number;        // 성장 촉진 배율 (1.5-3.0)
  quality_boost: number;       // 품질 상승 배율 (1.2-2.0)
  duration_days: number;       // 지속 일수 (1-3)
  affected_area: 'all';
  rainbow_bonus: boolean;      // 무지개 출현 시 추가 보너스
}
```

| Tier | Probability | Growth Boost | Quality Boost | Duration | Rainbow Chance |
|------|------------|--------------|---------------|----------|---------------|
| Light Drizzle (이슬비) | 60% | x1.5 | x1.2 | 1일 | 5% |
| Golden Rain (금빛 비) | 30% | x2.0 | x1.5 | 2일 | 20% |
| Miracle Rain (기적의 비) | 10% | x3.0 | x2.0 | 3일 | 50% |

**무지개 보너스**: 발현 시 모든 식물 건강도 +10, 경험치 x1.5 (해당 기간)

### 3.6 Rare Seed Event (희귀 씨앗)

```typescript
interface RareSeedEvent {
  type: 'rare_seed';
  seed_id: string;
  seed_rarity: 'uncommon' | 'rare' | 'epic' | 'legendary';
  discovery_method: 'ground' | 'bird_drop' | 'wind_blown' | 'mystery_package';
  claim_deadline_hours: number;  // 수령 제한 시간
}
```

**희귀 씨앗 드롭 테이블**:

| Seed | Rarity | Drop Rate | Growth Time | Sell Value | Special Trait |
|------|--------|-----------|-------------|------------|---------------|
| 황금 장미 (Golden Rose) | Epic | 0.8% | 120일 | 5,000 coins | 판매가 5x, 빛나는 이펙트 |
| 무지개 튤립 (Rainbow Tulip) | Rare | 2.0% | 60일 | 2,000 coins | 모든 계절 성장 가능 |
| 거대 해바라기 (Giant Sunflower) | Uncommon | 5.0% | 75일 | 1,500 coins | 수확량 3x |
| 크리스탈 선인장 (Crystal Cactus) | Legendary | 0.3% | 180일 | 15,000 coins | 주변 식물 성장 +20% 오라 |
| 달빛 라벤더 (Moonlight Lavender) | Rare | 1.5% | 50일 | 2,500 coins | 야간 성장 2x |
| 별빛 민트 (Starlight Mint) | Uncommon | 4.0% | 35일 | 800 coins | 해충 저항 100% |
| 용의 고추 (Dragon Pepper) | Epic | 0.5% | 100일 | 8,000 coins | 인접 식물 열 보호 |
| 요정 바질 (Fairy Basil) | Rare | 1.8% | 40일 | 1,800 coins | 품질 항상 S등급 |

**드롭율 보정**:

```
actual_drop_rate = base_drop_rate
                 * (1 + user_level * 0.02)          // 레벨 보정
                 * season_rare_modifier              // 가을: x1.5, 봄: x1.2
                 * (1 + garden_diversity_bonus)       // 5종 이상 재배 시 +0.1
```

### 3.7 Event Scheduling Algorithm

```typescript
interface EventScheduler {
  // 1일 1회 cron job에서 실행 (simulationCron.ts 확장)
  processDaily(userId: string): Promise<GameEvent[]>;

  // 이벤트 큐 관리
  event_queue: PriorityQueue<GameEvent>;

  // 동시 이벤트 제한
  max_concurrent_events: 3;

  // 최소 이벤트 간격
  min_event_gap_days: 1;

  // 이벤트 쿨다운 (같은 타입)
  cooldown_by_type: {
    pest: 3,        // 3일
    storm: 2,       // 2일
    lucky_rain: 5,  // 5일
    rare_seed: 7,   // 7일
    disease: 4,     // 4일
  };
}
```

**Daily Event Processing**:

```
function processDaily(userId):
  1. 현재 계절 및 게임 일차 조회
  2. 활성 이벤트 목록 조회 → 만료된 이벤트 정리
  3. 동시 이벤트 수 체크 (< max_concurrent_events)
  4. 각 이벤트 타입에 대해:
     a. 쿨다운 체크 → 쿨다운 중이면 SKIP
     b. final_probability 계산 (base * season * pity * level)
     c. Math.random() < final_probability → 이벤트 생성
     d. severity 결정 (가중 랜덤)
     e. 영향 범위 계산
     f. event_queue에 추가
  5. 이벤트 효과 적용 (피해, 버프 등)
  6. 이벤트 알림 생성
  7. 유저에게 Push Notification (선택)
```

---

## 4. NPC Customer System

### 4.1 NPC Definitions

```typescript
interface NPC {
  id: string;
  name_ko: string;
  name_en: string;
  personality: NPCPersonality;
  preferred_plants: string[];       // 선호 식물 ID 목록
  preferred_quality: QualityGrade;  // 선호 품질 등급
  visit_frequency: VisitFrequency;
  affinity: number;                 // 친밀도 (0-100)
  sprite_id: string;
  dialogue_pool: DialogueSet;
}

enum NPCPersonality {
  FRIENDLY = 'friendly',
  PICKY = 'picky',
  GENEROUS = 'generous',
  MYSTERIOUS = 'mysterious',
  COLLECTOR = 'collector',
}

enum QualityGrade {
  D = 'd',  // 60 미만
  C = 'c',  // 60-69
  B = 'b',  // 70-79
  A = 'a',  // 80-89
  S = 's',  // 90-100
}
```

### 4.2 NPC Roster

| ID | Name | Personality | Preferred Plants | Quality Req | Visit Freq | Unlock Condition |
|----|------|------------|-----------------|-------------|-----------|-----------------|
| npc_grandma | 김할머니 | FRIENDLY | leafy, herb | C+ | High (daily possible) | 즉시 |
| npc_chef | 셰프 이준 | PICKY | herb, fruit (tomato, chili) | A+ | Medium (2-3d) | Level 5 |
| npc_florist | 꽃집 소연 | COLLECTOR | flowering (rose, tulip, sunflower) | B+ | Medium (2-3d) | Level 3 |
| npc_scientist | 박사님 | MYSTERIOUS | ALL (rare preferred) | ANY | Low (5-7d) | Level 10 |
| npc_child | 꼬마 민수 | FRIENDLY | succulent, flowering | ANY | High (1-2d) | 즉시 |
| npc_merchant | 상인 하영 | GENEROUS | fruit, leafy | B+ | Low (4-5d) | Level 7 |
| npc_herbalist | 약초꾼 | COLLECTOR | herb (lavender, basil, mint) | A+ | Medium (3-4d) | Level 8 |
| npc_elderly | 원예왕 할아버지 | PICKY | foliage (monstera, rubber) | S only | Very Low (7-10d) | Level 15 |

### 4.3 NPC Visit Conditions & Frequency

```typescript
interface VisitCondition {
  // 방문 가능 조건
  min_user_level: number;
  required_plant_count: number;    // 최소 보유 식물 수
  required_harvestable: number;    // 수확 가능 식물 수
  season_preference: Season[];     // 선호 계절 (빈 배열 = 무관)
  time_window: {                   // 방문 가능 시간대 (게임 내)
    start_hour: number;
    end_hour: number;
  };
}
```

**Visit Probability Algorithm**:

```
function calculateVisitProbability(npc, user, season):
  base_rate = npc.base_visit_rate   // 0.1 ~ 1.0

  // 조건 충족 여부
  if user.level < npc.min_user_level: return 0
  if user.harvestable_count < npc.required_harvestable: return 0

  // 계절 보정
  season_mod = npc.season_preference.includes(season) ? 1.3 : 1.0

  // 친밀도 보정 (친밀도 높을수록 자주 방문)
  affinity_mod = 1.0 + (npc.affinity / 100) * 0.5

  // 선호 식물 보유 보정
  has_preferred = user.plants.some(p => npc.preferred_plants.includes(p.category))
  preference_mod = has_preferred ? 1.4 : 0.8

  return min(base_rate * season_mod * affinity_mod * preference_mod, 0.95)
```

### 4.4 Quest Generation Logic

```typescript
interface Quest {
  id: string;
  npc_id: string;
  type: QuestType;
  requirements: QuestRequirement[];
  rewards: QuestReward;
  deadline_days: number;           // 완료 기한 (game-days)
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  dialogue_intro: string;
  dialogue_complete: string;
  dialogue_fail: string;
}

enum QuestType {
  DELIVER = 'deliver',           // 작물 납품
  GROW = 'grow',                 // 특정 작물 재배
  QUALITY = 'quality',           // 특정 품질 이상 달성
  COLLECTION = 'collection',     // 여러 종류 수집
  SPECIAL = 'special',           // 특수 퀘스트
}

interface QuestRequirement {
  plant_id?: string;             // 특정 식물 (null = any in category)
  plant_category?: string;       // 카테고리 지정
  quantity: number;              // 요구 수량
  min_quality: QualityGrade;     // 최소 품질
  is_rare?: boolean;             // 희귀 품종 요구 여부
}
```

**Quest Generation Algorithm**:

```
function generateQuest(npc, user):
  // 1. 난이도 결정 (유저 레벨 기반)
  difficulty = selectDifficulty(user.level, npc.personality)

  // 2. 퀘스트 타입 결정
  type_weights = {
    DELIVER: npc.personality == 'FRIENDLY' ? 0.5 : 0.3,
    GROW: 0.2,
    QUALITY: npc.personality == 'PICKY' ? 0.4 : 0.15,
    COLLECTION: npc.personality == 'COLLECTOR' ? 0.5 : 0.1,
    SPECIAL: npc.affinity >= 80 ? 0.15 : 0.0,
  }
  type = weightedRandom(type_weights)

  // 3. 요구사항 생성
  plants = selectFromPreferred(npc.preferred_plants, difficulty)
  quantity = difficultyToQuantity(difficulty)   // easy:1-2, med:2-4, hard:3-6, legend:5-10
  quality = npc.preferred_quality               // NPC 성격 반영

  // 4. 기한 설정
  deadline = difficultyToDeadline(difficulty)   // easy:7d, med:5d, hard:3d, legend:10d

  // 5. 보상 계산
  rewards = calculateRewards(difficulty, npc, quantity)

  return Quest { type, requirements, rewards, deadline, difficulty }
```

**난이도별 퀘스트 파라미터**:

| Difficulty | Quantity | Min Quality | Deadline | Base Coin Reward | XP Reward |
|-----------|----------|------------|----------|-----------------|-----------|
| easy | 1-2 | D | 7일 | 100-300 | 50-100 |
| medium | 2-4 | C | 5일 | 300-800 | 100-250 |
| hard | 3-6 | A | 3일 | 800-2,000 | 250-500 |
| legendary | 5-10 | S | 10일 | 3,000-10,000 | 500-1,500 |

### 4.5 Affinity System (친밀도)

```typescript
interface AffinitySystem {
  max_affinity: 100;
  decay_rate: 0;                   // 친밀도는 감소하지 않음 (유저 친화적)

  // 친밀도 획득 방법
  gain_events: {
    quest_complete: 5-15;          // 퀘스트 완료 (난이도별)
    quest_bonus: 5;                // 기한 내 2일 이상 여유로 완료
    preferred_plant_gift: 3;       // 선호 식물 선물
    daily_greeting: 1;             // 일일 인사 (1일 1회)
    perfect_quality: 3;            // S등급 납품
  };

  // 친밀도 감소 방법
  loss_events: {
    quest_fail: -5;                // 퀘스트 실패
    quest_expire: -3;              // 퀘스트 만료
  };
}
```

**Affinity Milestones & Rewards**:

| Level | Affinity | Title | Reward |
|-------|---------|-------|--------|
| 1 | 0-19 | 낯선 사이 | 기본 퀘스트만 가능 |
| 2 | 20-39 | 아는 사이 | 퀘스트 보상 +10%, 중급 퀘스트 해금 |
| 3 | 40-59 | 친한 사이 | 퀘스트 보상 +20%, 상급 퀘스트 해금, NPC 특별 아이템 할인 10% |
| 4 | 60-79 | 절친한 사이 | 퀘스트 보상 +30%, NPC 전용 아이템 구매 가능, 할인 20% |
| 5 | 80-99 | 소울메이트 | 퀘스트 보상 +50%, 전설 퀘스트 해금, 특별 대화/스토리 |
| MAX | 100 | 영혼의 벗 | 일회성 특별 보상 아이템, NPC 칭호, 유니크 이펙트 |

**NPC별 Max Affinity 특별 보상**:

| NPC | Max Affinity Reward |
|-----|-------------------|
| 김할머니 | "할머니의 비법 물약" - 모든 작물 건강도 즉시 100% 회복 (소모품 x3) |
| 셰프 이준 | "미슐랭 조리법" - 과일/허브 판매가 영구 +15% |
| 꽃집 소연 | "황금 화분" - 꽃 카테고리 성장 속도 영구 +10% |
| 박사님 | "돌연변이 촉진제" - 희귀 씨앗 드롭율 영구 +50% |
| 꼬마 민수 | "행운의 클로버" - 행운의 비 확률 영구 +20% |
| 상인 하영 | "VIP 거래증" - 모든 판매가 영구 +10% |
| 약초꾼 | "고대 허브 도감" - 허브 품질 영구 +1등급 |
| 원예왕 할아버지 | "마스터의 인장" - 모든 식물 성장 속도 영구 +5%, 특별 칭호 |

### 4.6 Quest Complete Rewards

```typescript
interface QuestReward {
  coins: number;
  experience: number;
  affinity_gain: number;
  bonus_items?: BonusItem[];       // 확률적 추가 보상
}

interface BonusItem {
  item_id: string;
  quantity: number;
  drop_chance: number;             // 0.0-1.0
}
```

**보상 계산 공식**:

```
final_coin_reward = base_coins
                  * difficulty_multiplier       // easy:1.0, med:1.5, hard:2.5, legend:5.0
                  * affinity_bonus              // 1.0 + affinity_level * 0.1
                  * quality_bonus               // 요구보다 높은 품질 납품 시 +20% per grade
                  * speed_bonus                 // 기한의 50% 이내 완료 시 +25%

final_xp_reward = base_xp
                * difficulty_multiplier
                * first_time_bonus              // 해당 NPC 첫 퀘스트 완료 시 x2.0
```

---

## 5. Season Contest System

### 5.1 Contest Types

```typescript
interface Contest {
  id: string;
  type: ContestType;
  season: Season;
  name_ko: string;
  entry_requirements: EntryRequirement;
  judging_criteria: JudgingCriteria[];
  prizes: ContestPrize[];
  schedule: ContestSchedule;
  max_participants: number;        // 순위 경쟁 대상 (NPC 포함)
}

enum ContestType {
  FLOWER_SHOW = 'flower_show',         // 꽃 품평회
  HARVEST_FESTIVAL = 'harvest_festival', // 수확 축제
  HERB_CONTEST = 'herb_contest',       // 허브 경연
  RARE_EXHIBIT = 'rare_exhibit',       // 희귀 식물 전시
}
```

### 5.2 Flower Show (꽃 품평회)

**Schedule**: 봄 시즌 20-25일 (연 1회)

```typescript
interface FlowerShowEntry {
  plant_id: string;                // flowering 카테고리만 가능
  quality_score: number;           // 0-100
  health: number;                  // 0-100
  growth_completion: number;       // 0.0-1.0 (개화 상태)
  care_history_score: number;      // 관리 이력 점수
}
```

**심사 기준**:

| Criteria | Weight | Scoring Method |
|----------|--------|---------------|
| 품질 (Quality) | 35% | quality_score 직접 반영 |
| 건강도 (Health) | 20% | health / 100 |
| 개화 상태 (Bloom) | 25% | growth_stage == 'flowering' ? 1.0 : 0.5 |
| 관리 이력 (Care) | 15% | 물주기 적시성, 환경 유지 이력 기반 점수 |
| 희귀도 (Rarity) | 5% | common: 0.5, uncommon: 0.7, rare: 0.85, epic: 0.95, legendary: 1.0 |

**순위 계산**:

```
total_score = quality * 0.35
            + (health / 100) * 0.20
            + bloom_score * 0.25
            + care_score * 0.15
            + rarity_score * 0.05

// NPC 경쟁자 점수 (레벨 스케일링)
npc_competitor_scores = generateNPCScores(user.level, contest_difficulty)
// NPC는 3-5명, 점수 범위: user_level_based ± random_variance
```

**NPC 경쟁자 점수 생성**:

```
function generateNPCScores(userLevel, count = 4):
  base = 40 + userLevel * 2.5        // 레벨에 비례
  scores = []
  for i in range(count):
    variance = random(-15, +15)
    scores.push(clamp(base + variance, 20, 98))
  return scores.sort(DESC)
```

**상품**:

| Rank | Prize |
|------|-------|
| 1st (금상) | 3,000 coins + "꽃의 여왕/왕" 칭호 + 황금 화분 (성장 +15%) + 500 XP |
| 2nd (은상) | 1,500 coins + 은빛 화분 (성장 +10%) + 300 XP |
| 3rd (동상) | 800 coins + 동 화분 (성장 +5%) + 200 XP |
| 참가상 | 200 coins + 50 XP + 특별 비료 x3 |

### 5.3 Harvest Festival (수확 축제)

**Schedule**: 가을 시즌 20-25일 (연 1회)

```typescript
interface HarvestFestivalEntry {
  entries: HarvestEntry[];          // 최대 5개 작물 출품
  total_harvest_value: number;      // 총 수확 가치
  variety_count: number;            // 출품 종류 수
}

interface HarvestEntry {
  plant_id: string;
  category: string;                 // leafy, fruit, herb 카테고리만
  quantity: number;
  quality_grade: QualityGrade;
  total_value: number;
}
```

**우승 조건 (복합 점수)**:

| Criteria | Weight | Description |
|----------|--------|-------------|
| 총 수확가치 (Total Value) | 40% | 출품 작물 총 판매가치 |
| 품질 평균 (Avg Quality) | 25% | 전체 출품 작물 평균 품질 등급 |
| 다양성 (Variety) | 20% | 서로 다른 카테고리 수 (max 3점) |
| 수량 (Quantity) | 15% | 총 출품 수량 |

```
harvest_score = (total_value / max_possible_value) * 0.40
              + (avg_quality_normalized) * 0.25
              + (variety_count / 3) * 0.20
              + (total_quantity / max_quantity) * 0.15
```

**상품**:

| Rank | Prize |
|------|-------|
| 1st (풍요의 왕) | 5,000 coins + "풍요의 왕" 칭호 + 수확량 영구 +10% 패시브 + 800 XP |
| 2nd | 2,500 coins + 수확량 +5% (해당 시즌) + 500 XP |
| 3rd | 1,200 coins + 300 XP |
| 참가상 | 300 coins + 100 XP + 고급 비료 x5 |

### 5.4 Contest Schedule & Participation

```typescript
interface ContestSchedule {
  announcement_day: number;         // 계절 시작 후 알림 일
  registration_start: number;       // 등록 시작일
  registration_end: number;         // 등록 마감일
  contest_day: number;              // 대회 당일
  result_announcement_day: number;  // 결과 발표일
}
```

**연간 컨테스트 캘린더**:

| Contest | Season | Announce | Register | Contest | Results |
|---------|--------|----------|----------|---------|---------|
| Flower Show | Spring | Day 5 | Day 10-18 | Day 20-22 | Day 23 |
| Herb Contest | Summer | Day 5 | Day 10-18 | Day 20-22 | Day 23 |
| Harvest Festival | Autumn | Day 5 | Day 10-18 | Day 20-22 | Day 23 |
| Rare Exhibit | Winter | Day 10 | Day 15-22 | Day 25-27 | Day 28 |

**참가 조건**:

| Contest | Min Level | Required Plants | Entry Fee | Max Entries |
|---------|----------|----------------|-----------|-------------|
| Flower Show | 3 | 1+ flowering at bloom stage | 100 coins | 1 식물 |
| Herb Contest | 5 | 1+ herb at harvest stage | 150 coins | 1 식물 |
| Harvest Festival | 5 | 3+ harvestable plants | 200 coins | 최대 5 작물 |
| Rare Exhibit | 10 | 1+ rare/epic/legendary plant | 500 coins | 1 식물 |

---

## 6. Core Data Structures

### 6.1 Season State

```typescript
// 서버 전역 상태 (모든 유저 공유)
interface GlobalSeasonState {
  current_season: Season;
  current_day_in_season: number;    // 1-30
  current_year: number;             // 게임 년도
  game_start_date: Date;            // 서버 첫 시작일 (기준점)
  transition_active: boolean;
  transition_blend: number;         // 0.0-1.0
  active_weather: WeatherCondition;
}

// DB 테이블: game_season
interface GameSeasonRow {
  id: number;
  game_start_date: Date;
  current_tick: number;             // 서버 시작 후 경과 game-days
  // current_season, day_in_season 등은 current_tick에서 계산
}
```

### 6.2 Event Queue

```typescript
interface GameEvent {
  id: string;                       // UUID
  user_id: string;
  event_type: EventCategory;
  severity: EventSeverity;
  payload: Record<string, any>;     // 이벤트 타입별 상세 데이터 (JSONB)
  status: 'pending' | 'active' | 'resolved' | 'expired';
  created_at: Date;
  activated_at: Date | null;
  expires_at: Date;
  resolved_at: Date | null;
  affected_plot_ids: string[];      // 영향받는 밭 칸 ID 목록
}

// DB 테이블: game_events
```

### 6.3 NPC State

```typescript
interface NPCState {
  npc_id: string;
  user_id: string;
  affinity: number;                 // 0-100
  affinity_level: number;           // 1-6
  total_quests_completed: number;
  total_quests_failed: number;
  last_visit_date: Date | null;
  last_quest_date: Date | null;
  is_visiting: boolean;
  is_unlocked: boolean;
  permanent_buffs: string[];        // Max affinity 보상 등
}

// DB 테이블: user_npc_relations
```

### 6.4 Quest State

```typescript
interface QuestState {
  id: string;                       // UUID
  user_id: string;
  npc_id: string;
  quest_type: QuestType;
  difficulty: string;
  requirements: QuestRequirement[]; // JSONB
  rewards: QuestReward;             // JSONB
  status: 'offered' | 'accepted' | 'in_progress' | 'completed' | 'failed' | 'expired';
  progress: QuestProgress[];        // JSONB - 각 requirement별 진행도
  offered_at: Date;
  accepted_at: Date | null;
  deadline_at: Date;
  completed_at: Date | null;
}

interface QuestProgress {
  requirement_index: number;
  current_quantity: number;
  target_quantity: number;
  current_quality: QualityGrade | null;
  is_fulfilled: boolean;
}

// DB 테이블: quests
```

### 6.5 Contest State

```typescript
interface ContestState {
  id: string;
  contest_type: ContestType;
  season: Season;
  game_year: number;
  status: 'announced' | 'registration' | 'in_progress' | 'judging' | 'completed';
  participants: ContestParticipant[]; // JSONB
  npc_scores: NPCScore[];            // JSONB
  results: ContestResult | null;      // JSONB
  schedule: ContestSchedule;          // JSONB
  created_at: Date;
}

interface ContestParticipant {
  user_id: string;
  entries: ContestEntry[];           // 출품작
  total_score: number | null;
  rank: number | null;
}

// DB 테이블: contests, contest_entries
```

### 6.6 Affinity Table

```typescript
// user_npc_relations 테이블 내 관리
interface AffinityTable {
  user_id: string;
  npc_id: string;
  affinity: number;
  level: number;
  history: AffinityEvent[];          // JSONB - 최근 30건
}

interface AffinityEvent {
  event_type: string;               // 'quest_complete', 'gift', 'greeting', etc.
  delta: number;                    // +5, -3, etc.
  timestamp: Date;
}
```

---

## 7. Algorithm Specifications

### 7.1 Event Trigger Algorithm

```typescript
/**
 * Daily Event Processor
 * 매일 simulationCron에서 각 유저별 호출
 */
async function processDailyEvents(userId: string): Promise<GameEvent[]> {
  const season = getCurrentSeason();
  const user = await getUser(userId);
  const activeEvents = await getActiveEvents(userId);
  const eventHistory = await getRecentEventHistory(userId, 30); // 최근 30일

  const newEvents: GameEvent[] = [];

  // 동시 이벤트 제한 체크
  if (activeEvents.length >= MAX_CONCURRENT_EVENTS) return newEvents;

  // 각 이벤트 타입 순회
  for (const eventType of EVENT_TYPES) {
    // 쿨다운 체크
    const lastOccurrence = eventHistory.findLast(e => e.event_type === eventType);
    if (lastOccurrence) {
      const daysSince = diffDays(now(), lastOccurrence.created_at);
      if (daysSince < COOLDOWNS[eventType]) continue;
    }

    // 확률 계산
    const baseProbability = BASE_PROBABILITIES[eventType];
    const seasonWeight = SEASON_WEIGHTS[eventType][season];
    const pitySince = eventHistory.length === 0 ? 10
      : diffDays(now(), eventHistory[eventHistory.length - 1].created_at);
    const pityFactor = Math.min(1.0 + pitySince * 0.05, 2.0);
    const levelFactor = 1.0 + user.level * 0.01;
    const gardenFactor = 1.0 + user.plot_count * 0.02;

    const finalProbability = baseProbability * seasonWeight * pityFactor * levelFactor * gardenFactor;

    // 이벤트 발생 판정
    if (Math.random() < finalProbability) {
      const severity = rollSeverity(eventType, season);
      const event = await createEvent(userId, eventType, severity, season);
      newEvents.push(event);

      // 동시 이벤트 제한 재체크
      if (activeEvents.length + newEvents.length >= MAX_CONCURRENT_EVENTS) break;
    }
  }

  return newEvents;
}
```

### 7.2 Probability Weight Tables

```typescript
const SEASON_WEIGHTS: Record<EventCategory, Record<Season, number>> = {
  pest:       { spring: 1.0,  summer: 1.875, autumn: 0.75,  winter: 0.25  },
  storm:      { spring: 0.56, summer: 1.33,  autumn: 0.89,  winter: 1.11  },
  lucky_rain: { spring: 1.43, summer: 0.71,  autumn: 1.14,  winter: 0.43  },
  rare_seed:  { spring: 1.2,  summer: 0.8,   autumn: 1.6,   winter: 0.4   },
  disease:    { spring: 0.8,  summer: 1.6,   autumn: 1.0,   winter: 0.6   },
};

const SEVERITY_WEIGHTS: Record<EventCategory, Record<EventSeverity, number>> = {
  pest:       { minor: 0.45, moderate: 0.30, major: 0.18, critical: 0.07 },
  storm:      { minor: 0.35, moderate: 0.35, major: 0.20, critical: 0.10 },
  lucky_rain: { minor: 0.60, moderate: 0.30, major: 0.10, critical: 0.00 },
  rare_seed:  { minor: 0.50, moderate: 0.30, major: 0.15, critical: 0.05 },
  disease:    { minor: 0.40, moderate: 0.35, major: 0.18, critical: 0.07 },
};
```

### 7.3 Reward Calculation

```typescript
function calculateQuestReward(
  quest: Quest,
  npc: NPC,
  user: User,
  deliveredQuality: QualityGrade[]
): QuestReward {
  const difficultyMultiplier = {
    easy: 1.0, medium: 1.5, hard: 2.5, legendary: 5.0
  }[quest.difficulty];

  const affinityLevel = getAffinityLevel(npc.affinity);
  const affinityBonus = 1.0 + affinityLevel * 0.1;

  // 품질 보너스: 요구보다 높은 등급 수
  const qualityUpgrades = deliveredQuality.filter(
    q => gradeToNum(q) > gradeToNum(quest.requirements[0].min_quality)
  ).length;
  const qualityBonus = 1.0 + qualityUpgrades * 0.2;

  // 속도 보너스
  const daysUsed = diffDays(now(), quest.accepted_at);
  const deadline = quest.deadline_days;
  const speedBonus = daysUsed <= deadline * 0.5 ? 1.25 : 1.0;

  // 첫 퀘스트 보너스
  const firstTimeBonus = quest.is_first_for_npc ? 2.0 : 1.0;

  const coins = Math.round(
    quest.rewards.base_coins * difficultyMultiplier * affinityBonus * qualityBonus * speedBonus
  );
  const experience = Math.round(
    quest.rewards.base_xp * difficultyMultiplier * firstTimeBonus
  );
  const affinityGain = difficultyToAffinity(quest.difficulty);

  return { coins, experience, affinity_gain: affinityGain, bonus_items: rollBonusItems(quest) };
}
```

### 7.4 Contest Scoring Algorithm

```typescript
function calculateFlowerShowScore(entry: FlowerShowEntry): number {
  const qualityScore = entry.quality_score / 100;      // 0-1
  const healthScore = entry.health / 100;               // 0-1
  const bloomScore = entry.growth_completion >= 0.9 ? 1.0 : entry.growth_completion * 0.6;
  const careScore = entry.care_history_score / 100;     // 0-1
  const rarityScore = RARITY_SCORES[entry.rarity] || 0.5;

  return qualityScore * 0.35
       + healthScore * 0.20
       + bloomScore * 0.25
       + careScore * 0.15
       + rarityScore * 0.05;
}

function calculateHarvestFestivalScore(entry: HarvestFestivalEntry, maxValues: MaxValues): number {
  const valueScore = entry.total_harvest_value / maxValues.value;
  const qualityScore = averageQualityNormalized(entry.entries);
  const varietyScore = Math.min(entry.variety_count / 3, 1.0);
  const quantityScore = Math.min(entry.entries.reduce((s, e) => s + e.quantity, 0) / maxValues.quantity, 1.0);

  return valueScore * 0.40
       + qualityScore * 0.25
       + varietyScore * 0.20
       + quantityScore * 0.15;
}
```

---

## 8. Database Migration Strategy

### 8.1 New Tables

```sql
-- Migration 001: Season System
CREATE TABLE game_season (
  id SERIAL PRIMARY KEY,
  game_start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  current_tick INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Migration 002: Events
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  affected_plot_ids JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  resolved_at TIMESTAMP,

  CONSTRAINT chk_event_type CHECK (event_type IN ('pest','storm','lucky_rain','rare_seed','disease','visitor')),
  CONSTRAINT chk_severity CHECK (severity IN ('minor','moderate','major','critical')),
  CONSTRAINT chk_status CHECK (status IN ('pending','active','resolved','expired'))
);
CREATE INDEX idx_events_user_status ON game_events(user_id, status);
CREATE INDEX idx_events_type ON game_events(event_type);

-- Migration 003: NPCs
CREATE TABLE npcs (
  id VARCHAR(30) PRIMARY KEY,
  name_ko VARCHAR(50) NOT NULL,
  name_en VARCHAR(50) NOT NULL,
  personality VARCHAR(20) NOT NULL,
  preferred_plants JSONB NOT NULL DEFAULT '[]',
  preferred_quality VARCHAR(5) NOT NULL DEFAULT 'c',
  base_visit_rate FLOAT NOT NULL DEFAULT 0.3,
  unlock_level INTEGER NOT NULL DEFAULT 1,
  sprite_id VARCHAR(50),
  dialogue_pool JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE user_npc_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  npc_id VARCHAR(30) NOT NULL REFERENCES npcs(id),
  affinity INTEGER NOT NULL DEFAULT 0 CHECK (affinity >= 0 AND affinity <= 100),
  affinity_level INTEGER NOT NULL DEFAULT 1 CHECK (affinity_level >= 1 AND affinity_level <= 6),
  total_quests_completed INTEGER NOT NULL DEFAULT 0,
  total_quests_failed INTEGER NOT NULL DEFAULT 0,
  last_visit_date TIMESTAMP,
  last_quest_date TIMESTAMP,
  is_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  permanent_buffs JSONB DEFAULT '[]',
  history JSONB DEFAULT '[]',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, npc_id)
);
CREATE INDEX idx_unr_user ON user_npc_relations(user_id);

-- Migration 004: Quests
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  npc_id VARCHAR(30) NOT NULL REFERENCES npcs(id),
  quest_type VARCHAR(20) NOT NULL,
  difficulty VARCHAR(15) NOT NULL,
  requirements JSONB NOT NULL,
  rewards JSONB NOT NULL,
  progress JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'offered',
  offered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMP,
  deadline_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,

  CONSTRAINT chk_quest_status CHECK (status IN ('offered','accepted','in_progress','completed','failed','expired'))
);
CREATE INDEX idx_quests_user_status ON quests(user_id, status);
CREATE INDEX idx_quests_npc ON quests(npc_id);

-- Migration 005: Contests
CREATE TABLE contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_type VARCHAR(30) NOT NULL,
  season VARCHAR(10) NOT NULL,
  game_year INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'announced',
  schedule JSONB NOT NULL,
  npc_scores JSONB DEFAULT '[]',
  results JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_contest_status CHECK (status IN ('announced','registration','in_progress','judging','completed'))
);

CREATE TABLE contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entries JSONB NOT NULL,
  total_score FLOAT,
  rank INTEGER,
  prize JSONB,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),

  UNIQUE(contest_id, user_id)
);
CREATE INDEX idx_ce_contest ON contest_entries(contest_id);

-- Migration 006: Rare Seeds Catalog
CREATE TABLE rare_seeds (
  id VARCHAR(50) PRIMARY KEY,
  name_ko VARCHAR(50) NOT NULL,
  name_en VARCHAR(50) NOT NULL,
  rarity VARCHAR(15) NOT NULL,
  base_drop_rate FLOAT NOT NULL,
  growth_days INTEGER NOT NULL,
  sell_value INTEGER NOT NULL,
  special_trait JSONB NOT NULL DEFAULT '{}',
  plant_base_id VARCHAR(30) REFERENCES plants(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### 8.2 Existing Table Modifications

```sql
-- user_plants에 계절/이벤트 관련 컬럼 추가
ALTER TABLE user_plants ADD COLUMN season_planted VARCHAR(10);
ALTER TABLE user_plants ADD COLUMN quality_score FLOAT DEFAULT 50.0;
ALTER TABLE user_plants ADD COLUMN care_score FLOAT DEFAULT 50.0;
ALTER TABLE user_plants ADD COLUMN is_rare BOOLEAN DEFAULT FALSE;
ALTER TABLE user_plants ADD COLUMN rare_seed_id VARCHAR(50) REFERENCES rare_seeds(id);
ALTER TABLE user_plants ADD COLUMN active_buffs JSONB DEFAULT '[]';
ALTER TABLE user_plants ADD COLUMN active_debuffs JSONB DEFAULT '[]';

-- users에 이벤트/NPC 관련 컬럼 추가
ALTER TABLE users ADD COLUMN last_event_check TIMESTAMP;
ALTER TABLE users ADD COLUMN event_pity_counter INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN contest_titles JSONB DEFAULT '[]';
```

---

## 9. API Endpoints

### 9.1 Season API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/season` | 현재 계절 정보 조회 |
| GET | `/api/v1/season/calendar` | 연간 캘린더 (이벤트, 컨테스트 일정) |
| GET | `/api/v1/season/modifiers` | 현재 계절 성장 보정 계수 |

### 9.2 Event API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/events` | 활성 이벤트 목록 조회 |
| GET | `/api/v1/events/:id` | 이벤트 상세 조회 |
| POST | `/api/v1/events/:id/resolve` | 이벤트 대응 (살충제 사용 등) |
| GET | `/api/v1/events/history` | 이벤트 히스토리 (최근 30일) |

### 9.3 NPC API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/npcs` | NPC 목록 (해금 상태 포함) |
| GET | `/api/v1/npcs/:id` | NPC 상세 (친밀도, 대화 등) |
| GET | `/api/v1/npcs/visiting` | 현재 방문 중인 NPC 목록 |
| POST | `/api/v1/npcs/:id/greet` | NPC 인사 (친밀도 +1, 일 1회) |
| POST | `/api/v1/npcs/:id/gift` | NPC에게 식물 선물 |

### 9.4 Quest API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/quests` | 활성 퀘스트 목록 |
| GET | `/api/v1/quests/:id` | 퀘스트 상세 (진행도 포함) |
| POST | `/api/v1/quests/:id/accept` | 퀘스트 수락 |
| POST | `/api/v1/quests/:id/deliver` | 작물 납품 |
| POST | `/api/v1/quests/:id/abandon` | 퀘스트 포기 |
| GET | `/api/v1/quests/history` | 퀘스트 히스토리 |

### 9.5 Contest API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/contests` | 컨테스트 목록 (현재/예정) |
| GET | `/api/v1/contests/:id` | 컨테스트 상세 |
| POST | `/api/v1/contests/:id/register` | 참가 등록 |
| POST | `/api/v1/contests/:id/submit` | 출품작 제출 |
| GET | `/api/v1/contests/:id/results` | 결과 조회 |
| GET | `/api/v1/contests/history` | 참가 이력 |

---

## 10. Frontend Components

### 10.1 Component Hierarchy

```
App
├── SeasonOverlay                  // 계절 배경 + 파티클
│   ├── SeasonBackground           // 배경색/이미지 전환
│   ├── ParticleSystem             // 벚꽃/눈/낙엽 파티클
│   └── SeasonTransitionEffect     // 전환 블렌드 효과
│
├── EventNotificationPanel         // 이벤트 알림
│   ├── EventCard                  // 개별 이벤트 카드
│   ├── EventDetailModal           // 이벤트 상세 + 대응 UI
│   └── EventHistory               // 이벤트 이력
│
├── NPCPanel                      // NPC 영역
│   ├── NPCVisitorList             // 방문 중인 NPC 목록
│   ├── NPCProfileModal            // NPC 상세 프로필
│   ├── NPCDialogueBox             // 대화 UI
│   ├── AffinityMeter              // 친밀도 게이지
│   └── QuestBoard                 // 퀘스트 보드
│       ├── QuestCard              // 퀘스트 카드
│       ├── QuestDetailModal       // 퀘스트 상세 + 납품
│       └── QuestProgressTracker   // 진행도 트래커
│
├── ContestCenter                  // 컨테스트 센터
│   ├── ContestCalendar            // 캘린더 뷰
│   ├── ContestRegistration        // 참가 등록
│   ├── ContestSubmission          // 출품 UI
│   ├── ContestLeaderboard         // 순위표
│   └── ContestResultModal         // 결과 발표
│
└── SeasonInfoWidget               // 사이드바 계절 정보
    ├── SeasonClock                // 현재 계절 + 남은 일수
    ├── GrowthModifierDisplay      // 성장 보정 표시
    └── UpcomingEventsPreview      // 예정 이벤트 미리보기
```

### 10.2 State Management (Redux Slices)

```typescript
// store/slices/seasonSlice.ts
interface SeasonState {
  currentSeason: Season;
  dayInSeason: number;
  gameYear: number;
  transition: { active: boolean; blend: number };
  modifiers: Record<string, SeasonModifiers>;
}

// store/slices/eventSlice.ts
interface EventState {
  activeEvents: GameEvent[];
  recentHistory: GameEvent[];
  notifications: EventNotification[];
}

// store/slices/npcSlice.ts
interface NPCSliceState {
  npcs: NPC[];
  visitingNPCs: string[];
  relations: Record<string, NPCRelation>;
  activeQuests: Quest[];
  questHistory: Quest[];
}

// store/slices/contestSlice.ts
interface ContestState {
  currentContest: Contest | null;
  upcomingContests: Contest[];
  myEntries: ContestEntry[];
  results: ContestResult[];
}
```

---

## 11. Implementation Roadmap

### 11.1 Phase Plan

```
Phase 3-A: Season Cycle System (2 weeks)
├── Task 1: DB migration (game_season) + Season calculation service
├── Task 2: Season modifier engine integration into simulation.service.ts
├── Task 3: Season API endpoints
├── Task 4: Frontend SeasonOverlay + CSS variables
├── Task 5: Particle system (cherry blossom, snow, leaves)
└── Task 6: Season transition blending + testing

Phase 3-B: Random Event System (2.5 weeks)
├── Task 1: DB migration (game_events, rare_seeds)
├── Task 2: Event scheduler service + probability engine
├── Task 3: Pest/Storm/LuckyRain/RareSeed event handlers
├── Task 4: Event API endpoints
├── Task 5: simulationCron.ts integration (daily event processing)
├── Task 6: Frontend EventNotificationPanel + EventDetailModal
└── Task 7: Event countermeasure system (item usage)

Phase 3-C: NPC Customer System (3 weeks)
├── Task 1: DB migration (npcs, user_npc_relations, quests)
├── Task 2: NPC seed data + visit scheduling service
├── Task 3: Quest generation engine
├── Task 4: Affinity system + milestone rewards
├── Task 5: Quest completion + reward distribution
├── Task 6: NPC/Quest API endpoints
├── Task 7: Frontend NPCPanel + DialogueBox
├── Task 8: Frontend QuestBoard + QuestProgressTracker
└── Task 9: AffinityMeter + NPC profile UI

Phase 3-D: Season Contest System (2 weeks)
├── Task 1: DB migration (contests, contest_entries)
├── Task 2: Contest scheduler + auto-lifecycle management
├── Task 3: Scoring algorithms (FlowerShow, HarvestFestival)
├── Task 4: NPC competitor generation
├── Task 5: Contest API endpoints
├── Task 6: Frontend ContestCenter + Leaderboard
└── Task 7: Prize distribution + title system

Phase 3-E: Integration & Polish (1 week)
├── Task 1: Cross-system integration testing
├── Task 2: Balance tuning (probabilities, rewards, difficulty)
├── Task 3: Edge case handling + error states
└── Task 4: Performance optimization (query indexing, caching)
```

### 11.2 Development Priority

| Priority | Module | Estimated Duration | Dependencies |
|----------|--------|-------------------|-------------|
| P0 (Critical) | Season Cycle System | 2 weeks | Phase 1 simulation engine |
| P0 (Critical) | Random Event System | 2.5 weeks | Season Cycle System |
| P1 (High) | NPC Customer System | 3 weeks | Phase 2 Economy |
| P2 (Medium) | Season Contest System | 2 weeks | Season + NPC |
| P2 (Medium) | Integration & Polish | 1 week | All above |

**Total Estimated Duration: 10.5 weeks**

### 11.3 Key Milestones

| Week | Milestone | Deliverable |
|------|-----------|-------------|
| W2 | Season MVP | 계절 전환 작동, 성장 보정 적용, 배경 변경 |
| W4.5 | Events MVP | 5종 이벤트 발생/해결, 이벤트 UI 표시 |
| W7.5 | NPC MVP | NPC 방문/퀘스트/친밀도 전체 루프 작동 |
| W9.5 | Contest MVP | 꽃 품평회 + 수확 축제 전체 루프 작동 |
| W10.5 | Phase 3 Complete | 전체 통합, 밸런스 조정, QA 완료 |

---

## 12. Risk & Open Questions

### 12.1 Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| 밸런스 붕괴 (보상 과다/과소) | High | Medium | 테스트 서버에서 시뮬레이션 1000회 돌려 분포 확인 |
| 이벤트 스팸 (사용자 피로감) | Medium | Low | 쿨다운 + 동시 이벤트 제한 + 이벤트 무시 기능 |
| NPC 퀘스트 불가능 조건 | Medium | Medium | 퀘스트 생성 시 유저 보유 식물 기반 필터링 |
| 컨테스트 NPC 점수 불공정 | Low | Low | 유저 레벨 기반 스케일링 + 분산 조정 |
| DB 성능 (JSONB 쿼리 부하) | Medium | Low | 인덱싱 전략 + 주요 필드 별도 컬럼화 |

### 12.2 Open Questions

1. **게임 시간 가속**: 사용자가 오프라인인 동안 이벤트 처리를 어떻게 할 것인가?
   - 제안: 로그인 시 미처리 일수만큼 일괄 처리 (최대 7일치)

2. **계절 리셋 시점**: 서버 전체 공유 vs 유저별 독립 계절?
   - 제안: 서버 전체 공유 (커뮤니티 이벤트 연동 가능)

3. **NPC 대화 시스템 깊이**: 단순 텍스트 vs 분기 대화?
   - 제안: Phase 3에서는 단순 텍스트 풀, Phase 4에서 분기 대화 확장

4. **멀티플레이어 컨테스트**: 다른 유저와 직접 경쟁 vs NPC 경쟁만?
   - 제안: Phase 3에서는 NPC 경쟁만, 멀티플레이어는 Phase 4+

5. **희귀 씨앗 거래**: 유저 간 거래 허용 여부?
   - 제안: Phase 3에서는 비거래 (Bind on Pickup), 추후 거래소 검토

---

## Appendix A: Season Growth Modifier Quick Reference

```json
{
  "season_modifiers": {
    "spring": {
      "flowering": { "growth": 1.3, "yield": 1.2, "quality": 1.3 },
      "succulent": { "growth": 1.0, "yield": 1.0, "quality": 1.0 },
      "herb":      { "growth": 1.4, "yield": 1.3, "quality": 1.2 },
      "leafy":     { "growth": 1.3, "yield": 1.2, "quality": 1.2 },
      "fruit":     { "growth": 1.1, "yield": 1.0, "quality": 1.0 },
      "foliage":   { "growth": 1.1, "yield": 1.0, "quality": 1.0 }
    },
    "summer": {
      "flowering": { "growth": 1.1, "yield": 1.0, "quality": 0.9 },
      "succulent": { "growth": 1.2, "yield": 1.1, "quality": 1.0 },
      "herb":      { "growth": 1.2, "yield": 1.1, "quality": 1.0 },
      "leafy":     { "growth": 0.8, "yield": 0.7, "quality": 0.7 },
      "fruit":     { "growth": 1.4, "yield": 1.5, "quality": 1.2 },
      "foliage":   { "growth": 1.2, "yield": 1.0, "quality": 1.0 }
    },
    "autumn": {
      "flowering": { "growth": 0.7, "yield": 0.8, "quality": 1.1 },
      "succulent": { "growth": 0.9, "yield": 0.9, "quality": 1.0 },
      "herb":      { "growth": 0.8, "yield": 0.9, "quality": 1.1 },
      "leafy":     { "growth": 1.1, "yield": 1.1, "quality": 1.3 },
      "fruit":     { "growth": 0.9, "yield": 1.2, "quality": 1.4 },
      "foliage":   { "growth": 0.9, "yield": 0.9, "quality": 1.0 }
    },
    "winter": {
      "flowering": { "growth": 0.3, "yield": 0.4, "quality": 0.6 },
      "succulent": { "growth": 0.6, "yield": 0.7, "quality": 0.8 },
      "herb":      { "growth": 0.2, "yield": 0.3, "quality": 0.5 },
      "leafy":     { "growth": 0.4, "yield": 0.5, "quality": 0.6 },
      "fruit":     { "growth": 0.1, "yield": 0.2, "quality": 0.4 },
      "foliage":   { "growth": 0.5, "yield": 0.5, "quality": 0.7 }
    }
  }
}
```

## Appendix B: Event Probability Summary (per game-day)

```json
{
  "event_probabilities_per_day": {
    "pest":       { "spring": 0.080, "summer": 0.150, "autumn": 0.060, "winter": 0.020 },
    "storm":      { "spring": 0.050, "summer": 0.120, "autumn": 0.080, "winter": 0.100 },
    "lucky_rain": { "spring": 0.100, "summer": 0.050, "autumn": 0.080, "winter": 0.030 },
    "rare_seed":  { "spring": 0.030, "summer": 0.020, "autumn": 0.040, "winter": 0.010 },
    "disease":    { "spring": 0.040, "summer": 0.080, "autumn": 0.050, "winter": 0.030 },
    "note": "Base probabilities before pity/level/garden_size modifiers"
  }
}
```

## Appendix C: NPC Affinity Thresholds

```json
{
  "affinity_levels": [
    { "level": 1, "min": 0,  "max": 19,  "title": "낯선 사이",   "reward_bonus": 1.0 },
    { "level": 2, "min": 20, "max": 39,  "title": "아는 사이",   "reward_bonus": 1.1 },
    { "level": 3, "min": 40, "max": 59,  "title": "친한 사이",   "reward_bonus": 1.2 },
    { "level": 4, "min": 60, "max": 79,  "title": "절친한 사이", "reward_bonus": 1.3 },
    { "level": 5, "min": 80, "max": 99,  "title": "소울메이트",  "reward_bonus": 1.5 },
    { "level": 6, "min": 100, "max": 100, "title": "영혼의 벗",  "reward_bonus": 1.5 }
  ]
}
```

---

> **Document End**
> Next Step: Phase 3-A 구현 시작 (Season Cycle System)
