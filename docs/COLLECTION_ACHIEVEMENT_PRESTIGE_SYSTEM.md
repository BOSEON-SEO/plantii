# Plantii - Collection, Achievement & Prestige System Technical Specification

> **Version**: 1.0
> **Date**: 2026-04-24
> **Status**: Design
> **Depends on**: Phase 1 (Core Simulation), Phase 2 (Garden/Economy), Scenario/Year System

---

## Table of Contents

1. [System Overview & Goals](#1-system-overview--goals)
2. [Sub-System 1: Plant Collection (Pokedex)](#2-sub-system-1-plant-collection-pokedex)
3. [Sub-System 2: Achievement Badge System](#3-sub-system-2-achievement-badge-system)
4. [Sub-System 3: Title System](#4-sub-system-3-title-system)
5. [Sub-System 4: Prestige / New Game+ System](#5-sub-system-4-prestige--new-game-system)
6. [Sub-System 5: Statistics Dashboard](#6-sub-system-5-statistics-dashboard)
7. [Data Model & State Management](#7-data-model--state-management)
8. [Database Schema (Migration Plan)](#8-database-schema-migration-plan)
9. [API Design](#9-api-design)
10. [System Interdependency Map](#10-system-interdependency-map)
11. [User Experience Flow](#11-user-experience-flow)
12. [Frontend Architecture](#12-frontend-architecture)
13. [Implementation Roadmap](#13-implementation-roadmap)
14. [Technical Considerations & Risks](#14-technical-considerations--risks)

---

## 1. System Overview & Goals

### 1.1 Design Intent

본 문서는 Plantii의 **장기 리플레이 동기 부여 시스템**을 정의한다. 3년 시나리오 1회차 엔딩 이후에도 플레이어가 지속적으로 게임에 복귀하도록 다음 5개 부분시스템을 설계한다:

| Sub-System | 핵심 역할 | 리플레이 동기 |
|------------|----------|-------------|
| Plant Collection (도감) | 식물 수집 완성도 추적 | "전종 컴플리트" 도전 |
| Achievement Badge (업적) | 마일스톤 달성 기록 | "모든 배지 수집" 목표 |
| Title System (칭호) | 플레이어 성장 표현 | 사회적 인정, 자기 표현 |
| Prestige / NG+ (프레스티지) | 회차 기반 누적 보너스 | "더 강하게 재시작" |
| Statistics Dashboard (통계) | 전체 플레이 데이터 시각화 | 자기 기록 갱신, 비교 |

### 1.2 Core Design Principle

```
1회차 엔딩(S/A/B/C/F) 달성
  -> NG+로 재시작 가능
  -> 회차 누적 보너스 적용 (프레스티지 레벨)
  -> 이전 회차에서 못 채운 업적/도감 이어서 추적
  -> 더 높은 엔딩 랭크 도전
  -> 해금 시나리오/난이도 모드 개방
```

### 1.3 Existing Infrastructure (활용 가능 자원)

| 기존 시스템 | 활용 방안 |
|------------|---------|
| `users.experience_points`, `users.level` | 칭호 진급 기준 데이터로 활용 |
| `users.coins` | 프레스티지 캐리오버 자원 |
| `user_plants.optimal_days_count` | 업적 달성 조건 (최적 일수 카운트) |
| `user_plants.total_water_given` | 통계 대시보드 데이터 소스 |
| `plants` 테이블 (15종) | 도감 기본 데이터 (돌연변이/희귀종 확장 기반) |
| `GameSession` (시나리오 시스템) | 프레스티지 회차 연동 |
| `YearlySnapshot` | 통계 대시보드 히스토리 |
| `Collection.tsx` 페이지 | 도감 UI 기반 컴포넌트 |

---

## 2. Sub-System 1: Plant Collection (Pokedex)

### 2.1 개요

식물 도감은 플레이어가 지금까지 발견/수확/수집한 모든 식물 종의 카탈로그이다. 기본 15종에 더해 **돌연변이(Mutation)** 및 **희귀 품종(Rare Variant)** 시스템으로 수집 가능 항목을 확장한다.

### 2.2 도감 엔트리 구조

```typescript
interface CollectionEntry {
  plant_id: string;                // FK -> plants.id (e.g. "rose")
  variant_id: string | null;       // 돌연변이/희귀종 ID (null이면 기본종)

  // 발견 상태
  discovery_status: 'undiscovered' | 'silhouette' | 'discovered' | 'mastered';
  first_discovered_at: Date | null;
  first_harvested_at: Date | null;

  // 수집 통계
  total_grown: number;             // 총 재배 시도 횟수
  total_harvested: number;         // 총 성공 수확 횟수
  best_health_at_harvest: number;  // 수확 시 최고 건강도
  best_growth_time_days: number;   // 최단 성장 완료 일수
  total_deaths: number;            // 해당 종 사망 횟수

  // 마스터리 진행도
  mastery_points: number;          // 마스터리 포인트 누적
  mastery_level: 0 | 1 | 2 | 3;   // 0=미달, 1=Bronze, 2=Silver, 3=Gold
}
```

### 2.3 Discovery Status Flow

```
[undiscovered]  -- 상점에서 씨앗 보기 or 이벤트 힌트 -->  [silhouette]
[silhouette]    -- 최초 1회 심기 -->                      [discovered]
[discovered]    -- mastery_level >= 3 달성 -->             [mastered]
```

- **undiscovered**: 도감에 "???" 아이콘, 이름 미공개
- **silhouette**: 실루엣 아이콘, 이름 공개, 세부 정보 잠금
- **discovered**: 전체 정보 공개, 성장 환경 가이드 열람 가능
- **mastered**: 금테 아이콘, 해당 종 재배 시 경험치 +10% 보너스

### 2.4 Mastery System

각 식물 종별로 마스터리 포인트를 누적하여 마스터리 레벨을 진급한다.

| 행동 | 마스터리 포인트 |
|------|---------------|
| 최초 심기 | +10 |
| 수확 성공 | +20 |
| 건강도 90+ 수확 | +10 (보너스) |
| 최단 기록 경신 | +15 |
| optimal_days 30일 이상 | +5 |
| 돌연변이 발견 | +30 |
| 해당 종 사망 시 | -5 |

| 마스터리 레벨 | 필요 포인트 | 보상 |
|-------------|-----------|------|
| Bronze (1) | 50 | 도감 상세 페이지 해금 |
| Silver (2) | 120 | 해당 종 성장속도 +5% 영구 보너스 |
| Gold (3) | 250 | 해당 종 돌연변이 발생 확률 +10%, 도감 금테 |

### 2.5 Mutation / Rare Variant System

#### 2.5.1 돌연변이 (Mutation)

돌연변이는 기본 15종에서 확률적으로 파생되는 시각적/기능적 변이체이다.

```typescript
interface PlantVariant {
  id: string;                        // e.g. "rose_blue", "lettuce_giant"
  base_plant_id: string;             // FK -> plants.id
  name_ko: string;                   // "푸른 장미"
  name_en: string;                   // "Blue Rose"
  variant_type: 'mutation' | 'rare' | 'legendary';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

  // 발생 조건
  trigger: MutationTrigger;

  // 변이 효과 (기본종 대비 변동)
  stat_modifiers: {
    growth_speed: number;            // 배율 (e.g. 0.8 = 20% 느림)
    health_resilience: number;       // 배율
    harvest_value: number;           // 수확 보상 배율
    beauty_score: number;            // 정원 미관 점수 보너스
  };

  // 시각 표현
  sprite_variant: string;            // 스프라이트 ID (별도 에셋)
  color_tint?: string;               // 색상 변조 (에셋 없을 시 fallback)
  particle_effect?: string;          // 특수 파티클 이펙트

  // 도감 표시
  description_ko: string;
  discovery_hint_ko: string;         // "극한 환경에서 발견된다는 소문이..."
}

interface MutationTrigger {
  type: 'environment_extreme'        // 극한 환경 유지 시
      | 'perfect_care'               // 완벽 관리 조건 달성 시
      | 'seasonal'                   // 특정 계절에만
      | 'consecutive_harvest'        // 연속 수확 시
      | 'cross_proximity'            // 특정 식물 인접 배치 시
      | 'prestige_exclusive'         // NG+ 전용
      | 'random';                    // 순수 확률
  conditions: Record<string, any>;   // 세부 조건 JSON
  base_probability: number;          // 기본 발생 확률 (0.0 ~ 1.0)
}
```

#### 2.5.2 돌연변이 카탈로그 (초기 설계)

| ID | 기본종 | 변이명 | 등급 | 발생 조건 | 기본 확률 |
|----|-------|--------|------|----------|---------|
| rose_blue | 장미 | 푸른 장미 | Epic | 기온 5C 이하에서 3일 생존 + 건강 70+ | 3% |
| rose_black | 장미 | 검은 장미 | Legendary | NG+2 이상 + 밤(winter)에 심기 | 1% |
| lettuce_giant | 상추 | 거대 상추 | Uncommon | 연속 3회 수확 + 최적 환경 유지 | 8% |
| cactus_flower | 선인장 | 꽃피는 선인장 | Rare | 물 주기 최소화 + 30일 생존 | 5% |
| basil_purple | 바질 | 보라 바질 | Uncommon | 광량 120% 이상 유지 7일 | 10% |
| mint_chocolate | 민트 | 초코 민트 | Rare | 민트 + 토마토 인접 배치 3주 | 5% |
| sunflower_double | 해바라기 | 쌍둥이 해바라기 | Rare | 건강도 95+ 수확 + 여름 계절 | 4% |
| orchid_ghost | 난초 | 유령 난초 | Legendary | NG+1 이상 + 겨울 봄 연속 재배 | 1.5% |
| monstera_variegata | 몬스테라 | 무늬 몬스테라 | Epic | 광량 변동 ±30% 반복 7일 | 3% |
| tomato_golden | 토마토 | 황금 토마토 | Rare | 최적 환경 20일 연속 유지 | 4% |
| aloe_crystal | 알로에 | 크리스탈 알로에 | Epic | 습도 30% 이하 + 온도 35C 이상 10일 | 2.5% |
| lavender_white | 라벤더 | 흰 라벤더 | Uncommon | 겨울 재배 + 건강도 80+ 유지 | 7% |
| chili_reaper | 고추 | 리퍼 고추 | Epic | 연속 5회 수확 + 온도 30C+ | 3% |
| tulip_rainbow | 튤립 | 무지개 튤립 | Legendary | 15종 전종 수확 달성 후 튤립 재배 | 2% |
| rubber_bonsai | 고무나무 | 분재 고무나무 | Rare | 성장 50% 시점에 물 주기 중단 7일 | 5% |
| echeveria_crystal | 에케베리아 | 수정 에케베리아 | Epic | NG+1 + 겨울 + 습도 20% 이하 | 2% |

총 수집 가능 항목: **기본 15종 + 변이 16종 = 31종** (향후 확장 가능)

#### 2.5.3 돌연변이 발생 로직

```typescript
// simulation.service.ts 확장 - 매 시뮬레이션 틱에서 호출
class MutationService {
  /**
   * 시뮬레이션 틱마다 각 활성 식물에 대해 돌연변이 발생 체크
   * - 이미 variant가 있는 식물은 스킵
   * - 발생 조건 충족 여부 확인 -> 확률 롤
   */
  static async checkMutation(
    userPlant: UserPlant,
    gameSession: GameSession,
    environmentHistory: EnvironmentSnapshot[]
  ): Promise<PlantVariant | null> {

    if (userPlant.variant_id) return null; // 이미 변이체

    const eligibleVariants = await this.getEligibleVariants(
      userPlant.plant_id,
      userPlant,
      gameSession,
      environmentHistory
    );

    for (const variant of eligibleVariants) {
      let probability = variant.trigger.base_probability;

      // 프레스티지 보너스 적용
      probability += gameSession.prestige_level * 0.01; // 회차당 +1%

      // 마스터리 보너스 적용
      const mastery = await CollectionService.getMasteryLevel(
        gameSession.user_id, userPlant.plant_id
      );
      if (mastery >= 3) probability += 0.10; // Gold 마스터리 시 +10%

      // 확률 롤
      if (Math.random() < probability) {
        await this.applyMutation(userPlant, variant);
        await CollectionService.recordDiscovery(
          gameSession.user_id, variant.base_plant_id, variant.id
        );
        return variant;
      }
    }

    return null;
  }
}
```

### 2.6 도감 완성도 계산

```typescript
interface CollectionCompletionRate {
  // 기본종 (15종)
  base_discovered: number;           // 발견한 기본종 수
  base_harvested: number;            // 수확한 기본종 수
  base_mastered: number;             // 마스터한 기본종 수
  base_total: 15;
  base_completion_percent: number;   // harvested / 15 * 100

  // 변이종
  variant_discovered: number;
  variant_total: number;             // 전체 변이종 수 (16)
  variant_completion_percent: number;

  // 전체
  overall_completion_percent: number; // (base_harvested + variant_discovered) / 31 * 100

  // 마스터리 통합
  total_mastery_points: number;
  average_mastery_level: number;
}
```

---

## 3. Sub-System 2: Achievement Badge System

### 3.1 개요

업적 배지는 특정 마일스톤 달성 시 자동 부여되는 일회성 보상이다. 업적은 **회차를 넘어 영구 유지**되며, NG+ 후에도 리셋되지 않는다.

### 3.2 업적 데이터 구조

```typescript
interface Achievement {
  id: string;                        // e.g. "first_harvest"
  category: AchievementCategory;
  name_ko: string;
  name_en: string;
  description_ko: string;
  icon_url: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

  // 달성 조건
  condition: AchievementCondition;

  // 보상
  rewards: {
    experience: number;
    coins: number;
    title_unlock?: string;           // 연결된 칭호 ID
    cosmetic_unlock?: string;        // 장식/테마 해금
  };

  // 시리즈 (단계별 업적)
  series_id?: string;                // 같은 시리즈의 업적 그룹 ID
  series_order?: number;             // 시리즈 내 순서 (1,2,3)

  // 숨김 업적 여부
  is_hidden: boolean;                // true면 달성 전까지 "???" 표시
}

type AchievementCategory =
  | 'cultivation'      // 재배 관련
  | 'collection'       // 도감 관련
  | 'economy'          // 경제 관련
  | 'mastery'          // 마스터리 관련
  | 'prestige'         // 프레스티지 관련
  | 'challenge'        // 도전 관련
  | 'social'           // 사회적 (칭호, 랭크)
  | 'secret';          // 숨겨진 업적

interface AchievementCondition {
  type: string;
  threshold: number | string;
  // 복합 조건 시 AND/OR 연산
  operator?: 'AND' | 'OR';
  sub_conditions?: AchievementCondition[];
}

interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: Date;
  unlocked_in_session: string;       // 어느 게임 세션(회차)에서 달성했는지
  progress: number;                  // 진행도 (0.0~1.0) - 미달성 시 추적용
  is_notified: boolean;              // 알림 표시 완료 여부
}
```

### 3.3 Achievement Catalog

#### 3.3.1 Cultivation (재배) 업적

| ID | 이름 | 조건 | 등급 | 보상 |
|----|------|------|------|------|
| first_seed | 첫 씨앗 | 첫 식물 심기 | Common | 50 EXP |
| first_harvest | 첫 수확 | 첫 수확 성공 | Common | 100 EXP, 50 Coins |
| green_thumb_1 | 초록 손가락 I | 10회 수확 | Common | 200 EXP |
| green_thumb_2 | 초록 손가락 II | 50회 수확 | Uncommon | 500 EXP, 100 Coins |
| green_thumb_3 | 초록 손가락 III | 200회 수확 | Rare | 1000 EXP, 300 Coins |
| perfect_harvest | 완벽한 수확 | 건강도 100 수확 | Uncommon | 300 EXP |
| speed_grower | 스피드 재배사 | 기본 성장 일수 80% 이내 수확 | Rare | 500 EXP |
| survivor | 생존자 | 건강도 10 이하에서 100으로 회복 | Uncommon | 200 EXP |
| no_death_run | 무사고 운영 | 1회차 전체 식물 사망 0 | Epic | 1500 EXP, 500 Coins |
| watering_master | 물 주기 달인 | 누적 500회 물 주기 | Uncommon | 300 EXP |

#### 3.3.2 Collection (도감) 업적

| ID | 이름 | 조건 | 등급 | 보상 |
|----|------|------|------|------|
| collector_1 | 초보 수집가 | 5종 수확 | Common | 200 EXP |
| collector_2 | 숙련 수집가 | 10종 수확 | Uncommon | 500 EXP, 200 Coins |
| collector_3 | 마스터 수집가 | 15종 전종 수확 | Epic | 2000 EXP, 1000 Coins, Title: "식물학자" |
| mutation_finder | 변이 발견자 | 돌연변이 1종 발견 | Uncommon | 300 EXP |
| mutation_hunter | 변이 사냥꾼 | 돌연변이 5종 발견 | Rare | 800 EXP |
| mutation_master | 변이 마스터 | 돌연변이 10종 발견 | Epic | 2000 EXP, Title: "유전학자" |
| legendary_find | 전설의 발견 | Legendary 등급 변이 발견 | Legendary | 3000 EXP, 1500 Coins |
| full_pokedex | 도감 완성 | 기본+변이 전종 발견 | Legendary | 5000 EXP, Title: "마스터 보타니스트" |

#### 3.3.3 Economy (경제) 업적

| ID | 이름 | 조건 | 등급 | 보상 |
|----|------|------|------|------|
| first_profit | 첫 수익 | 누적 매출 1,000 | Common | 100 EXP |
| merchant_1 | 사업가 I | 누적 매출 10,000 | Uncommon | 300 EXP |
| merchant_2 | 사업가 II | 누적 매출 100,000 | Rare | 800 EXP |
| merchant_3 | 재벌 정원사 | 누적 매출 500,000 | Epic | 2000 EXP, Title: "재벌 정원사" |
| big_spender | 큰손 | 단일 구매 5,000 코인 이상 | Uncommon | 200 EXP |

#### 3.3.4 Mastery (마스터리) 업적

| ID | 이름 | 조건 | 등급 | 보상 |
|----|------|------|------|------|
| first_mastery | 첫 마스터리 | 아무 종 Gold 마스터리 달성 | Rare | 500 EXP |
| mastery_5 | 다재다능 | 5종 Gold 마스터리 | Epic | 1500 EXP |
| mastery_all | 만물박사 | 15종 전종 Gold 마스터리 | Legendary | 5000 EXP, Title: "그랜드 마스터" |
| optimal_30 | 최적 환경 전문가 | 단일 식물 optimal_days 30일 | Uncommon | 300 EXP |

#### 3.3.5 Prestige (프레스티지) 업적

| ID | 이름 | 조건 | 등급 | 보상 |
|----|------|------|------|------|
| ng_plus_1 | 재도전 | NG+ 1회 시작 | Common | 500 EXP |
| ng_plus_3 | 집념의 정원사 | NG+ 3회 시작 | Uncommon | 1000 EXP |
| ng_plus_5 | 전설의 귀환 | NG+ 5회 시작 | Rare | 2000 EXP |
| s_rank | S랭크 달성 | S랭크 엔딩 | Epic | 3000 EXP, Title: "전설의 보타니스트" |
| s_rank_hard | 하드코어 S | Hard 모드 S랭크 | Legendary | 5000 EXP, Title: "식물의 신" |
| all_endings | 엔딩 수집가 | S/A/B/C/F 전체 엔딩 경험 | Epic | 2000 EXP |

#### 3.3.6 Secret (숨김) 업적

| ID | 이름 | 조건 | 등급 | 보상 |
|----|------|------|------|------|
| night_owl | 밤의 정원사 | 자정~새벽 5시에 10회 접속 | Uncommon | 200 EXP |
| phoenix | 불사조 정원 | 전멸 후 같은 회차에 전종 수확 | Legendary | 5000 EXP |
| minimalist | 미니멀리스트 | 4플롯만으로 B랭크 이상 | Epic | 2000 EXP |
| speed_run | 스피드런 | 100실시간일 이내 엔딩 도달 | Epic | 2000 EXP |

### 3.4 Achievement Evaluation Engine

```typescript
class AchievementEvaluator {
  /**
   * 게임 내 주요 이벤트 발생 시 호출된다.
   * 이벤트 기반으로 관련 업적만 체크하여 성능 보장.
   */
  static async evaluate(
    userId: string,
    event: GameEvent
  ): Promise<UserAchievement[]> {

    const newlyUnlocked: UserAchievement[] = [];

    // 이벤트 타입별 관련 업적만 필터링
    const candidates = await this.getCandidateAchievements(event.type);

    for (const achievement of candidates) {
      // 이미 달성했는지 확인
      const existing = await this.getUserAchievement(userId, achievement.id);
      if (existing?.unlocked_at) continue;

      // 조건 평가
      const { met, progress } = await this.evaluateCondition(
        userId, achievement.condition, event
      );

      if (met) {
        const unlocked = await this.unlock(userId, achievement);
        newlyUnlocked.push(unlocked);
      } else {
        // 진행도만 업데이트
        await this.updateProgress(userId, achievement.id, progress);
      }
    }

    return newlyUnlocked;
  }

  // 이벤트 -> 업적 매핑 테이블
  private static eventAchievementMap: Record<string, string[]> = {
    'plant_created':   ['first_seed'],
    'plant_harvested': ['first_harvest', 'green_thumb_*', 'perfect_harvest', 'speed_grower', 'collector_*'],
    'plant_died':      ['no_death_run'],
    'plant_watered':   ['watering_master'],
    'mutation_found':  ['mutation_finder', 'mutation_hunter', 'mutation_master', 'legendary_find'],
    'session_ended':   ['s_rank', 'all_endings', 'no_death_run'],
    'ng_plus_started': ['ng_plus_*'],
    'revenue_changed': ['first_profit', 'merchant_*'],
    'mastery_changed': ['first_mastery', 'mastery_*'],
  };
}
```

---

## 4. Sub-System 3: Title System

### 4.1 개요

칭호는 플레이어의 숙련도와 업적을 나타내는 표시 이름이다. 프로필, 정원 방문 시, 리더보드에 표시된다.

### 4.2 칭호 데이터 구조

```typescript
interface Title {
  id: string;
  name_ko: string;
  name_en: string;
  description_ko: string;
  category: 'progression' | 'achievement' | 'prestige' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

  // 해금 조건 (하나 이상 충족)
  unlock_condition: {
    type: 'level' | 'achievement' | 'prestige' | 'collection' | 'composite';
    value: string | number;
  };

  // 특수 효과 (선택 장착 시)
  passive_bonus?: {
    type: string;
    value: number;
    description_ko: string;
  };
}

interface UserTitle {
  user_id: string;
  title_id: string;
  unlocked_at: Date;
  is_equipped: boolean;              // 현재 장착 중인 칭호
}
```

### 4.3 Progression Title Ladder (진급 사다리)

메인 칭호 라인은 레벨/경험치 기반으로 자동 진급한다.

| 순서 | 칭호 (KO) | 칭호 (EN) | 해금 조건 | Passive Bonus |
|------|----------|-----------|----------|---------------|
| 1 | 새싹 정원사 | Sprout Gardener | 게임 시작 (기본) | 없음 |
| 2 | 초보 정원사 | Novice Gardener | Level 5 | 물 효율 +3% |
| 3 | 견습 정원사 | Apprentice Gardener | Level 10 | 성장속도 +3% |
| 4 | 숙련 정원사 | Skilled Gardener | Level 20 | 물 효율 +5% |
| 5 | 전문 정원사 | Expert Gardener | Level 30 + 수확 50회 | 성장속도 +5% |
| 6 | 마스터 정원사 | Master Gardener | Level 40 + 10종 수확 | 물 효율 +8%, 성장속도 +5% |
| 7 | 그랜드 마스터 | Grand Master | Level 50 + 15종 마스터리 Gold | 전체 보너스 +10% |
| 8 | 보타니스트 | Botanist | S랭크 엔딩 + 도감 80% | 돌연변이 확률 +5% |
| 9 | 마스터 보타니스트 | Master Botanist | S랭크 + 도감 100% + NG+3 | 전체 보너스 +15% |

### 4.4 Achievement-Linked Titles (업적 연동 칭호)

업적 달성 시 특별 칭호가 해금된다 (3.3절 업적 테이블의 `title_unlock` 참조).

| 칭호 | 연동 업적 | 카테고리 |
|------|----------|---------|
| 식물학자 | collector_3 (15종 전종 수확) | Achievement |
| 유전학자 | mutation_master (변이 10종) | Achievement |
| 재벌 정원사 | merchant_3 (매출 500K) | Achievement |
| 전설의 보타니스트 | s_rank (S랭크 엔딩) | Achievement |
| 식물의 신 | s_rank_hard (Hard S랭크) | Achievement |

### 4.5 Prestige Titles (프레스티지 전용 칭호)

| 칭호 | 해금 조건 | Passive Bonus |
|------|----------|---------------|
| 재도전자 | NG+1 시작 | 초기 코인 +10% |
| 숙련 재도전자 | NG+3 시작 | 초기 코인 +15%, 경험치 +5% |
| 영원의 정원사 | NG+5 시작 | 초기 코인 +20%, 전체 보너스 +5% |
| 초월자 | NG+10 시작 | 모든 보너스 +10% |

### 4.6 칭호 장착 시스템

- 플레이어는 해금된 칭호 중 **1개만 활성 장착** 가능
- 장착된 칭호의 `passive_bonus`가 게임플레이에 적용됨
- 칭호 변경은 프로필 페이지에서 자유롭게 가능 (쿨타임 없음)

---

## 5. Sub-System 4: Prestige / New Game+ System

### 5.1 개요

프레스티지(NG+)는 1회차 엔딩 후 새 게임을 시작할 때 이전 회차의 누적 보너스를 받는 시스템이다.

### 5.2 NG+ 진입 조건 및 흐름

```
[ENDING 화면] (S/A/B/C/F 어떤 엔딩이든)
    |
    v
[CREDITS 롤]
    |
    v
[POST-GAME 선택 화면]
    |
    +-- [Continue Playing] --> 현재 세션 유지 (샌드박스 모드)
    |
    +-- [New Game+] --> 프레스티지 진입
           |
           v
         [NG+ 설정 화면]
           - 난이도 선택 (Normal / Hard / Extreme)
           - 해금 시나리오 선택
           - 캐리오버 보너스 미리보기
           |
           v
         [새 GameSession 생성 (prestige_level++)]
           |
           v
         [Year 1 Spring - 보너스 적용 상태로 시작]
```

### 5.3 Prestige Data Model

```typescript
interface PrestigeProfile {
  user_id: string;

  // 프레스티지 핵심 데이터
  prestige_level: number;            // 0 = 첫 회차, 1 = NG+1, 2 = NG+2...
  total_playthroughs: number;        // 완료한 총 회차 수
  best_ending_rank: 'S' | 'A' | 'B' | 'C' | 'F';

  // 엔딩 히스토리
  ending_history: EndingRecord[];

  // 누적 캐리오버 보너스
  carryover: PrestigeCarryover;

  // 해금 콘텐츠
  unlocked_scenarios: string[];      // 해금된 시나리오 ID 목록
  unlocked_difficulty_modes: string[];
  unlocked_cosmetics: string[];

  // 글로벌 통계 (회차 통틀어)
  global_stats: {
    total_plants_ever_grown: number;
    total_plants_ever_harvested: number;
    total_coins_ever_earned: number;
    total_play_time_hours: number;
    total_mutations_found: number;
  };
}

interface EndingRecord {
  session_id: string;
  prestige_level: number;            // 해당 회차의 프레스티지 레벨
  ending_rank: 'S' | 'A' | 'B' | 'C' | 'F';
  difficulty: 'normal' | 'hard' | 'extreme';
  scenario_id: string;
  final_revenue: number;
  final_collection_rate: number;
  final_satisfaction: number;
  completed_at: Date;
  play_duration_days: number;        // 실시간 플레이 일수
}

interface PrestigeCarryover {
  // 경제 보너스
  starting_coins_bonus: number;      // 초기 코인 추가량
  revenue_multiplier: number;        // 매출 배율 (1.0 기반)

  // 성장 보너스
  growth_speed_bonus: number;        // 성장속도 배율
  health_resilience_bonus: number;   // 건강도 감소 저항

  // 수집 보너스
  mutation_probability_bonus: number; // 돌연변이 확률 추가
  mastery_gain_bonus: number;        // 마스터리 포인트 획득 배율

  // 구조적 보너스
  starting_plots: number;            // 시작 시 해금 플롯 수
  starting_tools: string[];          // 시작 시 보유 도구 목록
}
```

### 5.4 Prestige Level Bonuses (회차별 누적 보너스)

| Prestige Lv | 초기 코인 | 매출 배율 | 성장속도 | 돌연변이 확률 | 시작 플롯 | 추가 해금 |
|-------------|----------|----------|---------|-------------|---------|---------|
| 0 (1회차) | 1,000 | x1.0 | x1.0 | +0% | 4개 | - |
| 1 (NG+1) | 1,500 | x1.05 | x1.05 | +2% | 5개 | Hard 모드 |
| 2 (NG+2) | 2,000 | x1.10 | x1.08 | +4% | 5개 | 시나리오 B |
| 3 (NG+3) | 2,500 | x1.15 | x1.10 | +6% | 6개 | Extreme 모드 |
| 4 (NG+4) | 3,000 | x1.18 | x1.12 | +7% | 6개 | 시나리오 C |
| 5 (NG+5) | 3,500 | x1.20 | x1.15 | +8% | 7개 | 전설 시나리오 |
| 6~9 | +300/lv | +0.02/lv | +0.02/lv | +1%/lv | 7개 | 코스메틱 |
| 10+ | +200/lv | +0.01/lv | +0.01/lv | +0.5%/lv | 8개 (상한) | - |

**보너스 상한 (Hard Cap)**:
- 매출 배율: x1.50 (50% 증가 상한)
- 성장속도: x1.30 (30% 증가 상한)
- 돌연변이 확률: +20% 상한
- 시작 플롯: 8개 상한 (최대 9개 중)

### 5.5 Difficulty Modes (난이도 모드)

| 모드 | 해금 조건 | 변경 사항 |
|------|----------|----------|
| Normal | 기본 | 기본 밸런스, 시나리오 시스템 설계 기준 |
| Hard | NG+1 이상 | 환경 변동 +50%, 식물 사망 속도 +30%, 자원 획득 -20%, 목표 기준치 +25% |
| Extreme | NG+3 이상 | 환경 변동 +100%, 사망 속도 +60%, 자원 -40%, 목표 +50%, 랜덤 재해 이벤트 |

### 5.6 Unlockable Scenarios (해금 시나리오)

| 시나리오 ID | 이름 | 해금 조건 | 설명 |
|------------|------|----------|------|
| main | 최고의 보타닉 가든 | 기본 | 표준 3년 시나리오 |
| scenario_b | 사막의 오아시스 | NG+2 | 건조 기후, 다육/선인장 특화, 물 자원 부족 |
| scenario_c | 열대 정글 파라다이스 | NG+4 | 열대 기후, 관엽식물 특화, 병충해 강화 |
| scenario_legend | 전설의 식물원 복원 | NG+5 + S랭크 1회 | 1년 시한, 모든 전설 변이 해금 기회, 극한 난이도 |
| scenario_zen | 젠 가든 | 모든 엔딩 수집 | 시간 제한 없음, 평화로운 샌드박스, 힐링 모드 |

### 5.7 NG+ 시 리셋/유지 항목

| 항목 | NG+ 시 처리 | 근거 |
|------|-----------|------|
| GameSession | **새로 생성** | 새 게임이므로 |
| 정원 그리드/식물 | **리셋** | 새로 시작 |
| 코인 | **리셋 + 프레스티지 보너스** | 초기 코인 = 1000 + starting_coins_bonus |
| 레벨/경험치 | **리셋** | 회차 내 성장 재경험 |
| 도구/업그레이드 | **리셋** (일부 유지) | starting_tools로 일부 캐리오버 |
| 업적 | **영구 유지** | 회차 독립 |
| 도감 discovery | **영구 유지** | 수집 진행 유지 |
| 도감 mastery 포인트 | **영구 유지** | 누적 시스템 |
| 칭호 | **영구 유지** | 장착 칭호 효과 유지 |
| 통계 | **영구 유지** (회차별 분리 저장) | 글로벌 통계 누적 |
| 프레스티지 프로필 | **영구 유지** (레벨 증가) | 핵심 메타 진행 |

---

## 6. Sub-System 5: Statistics Dashboard

### 6.1 개요

통계 대시보드는 플레이어의 전체 게임 플레이 데이터를 시각화하는 종합 화면이다.

### 6.2 Dashboard Layout

```
+-------------------------------------------------------------------+
| [Statistics Dashboard]                         Prestige Lv: 3     |
+-------------------------------------------------------------------+
|                                                                   |
| [Current Playthrough]        [All-Time Records]                   |
| +-----------------------+   +--------------------------+          |
| | Session: NG+3         |   | Total Playthroughs: 3    |          |
| | Day: 87 / 156         |   | Best Rank: S             |          |
| | Year 2 - Summer       |   | Total Play Time: 312h    |          |
| | Revenue: 42,350       |   | Total Harvests: 847      |          |
| | Collection: 9/15      |   | Total Mutations: 12      |          |
| | Satisfaction: 72      |   | Total Coins Earned: 1.2M |          |
| +-----------------------+   +--------------------------+          |
|                                                                   |
| [Revenue Chart - Line Graph]                                      |
| +-------------------------------------------------------------+  |
| |  ^                                    _____                  |  |
| |  |                               ____/     \                 |  |
| |  |                          ____/            \_____          |  |
| |  |                     ____/                       \         |  |
| |  |                ____/                              |       |  |
| |  |           ____/                                   |       |  |
| |  |      ____/                                        |       |  |
| |  | ____/                                             |       |  |
| |  +----------------------------------------------------->    |  |
| |   Y1-Sp  Y1-Su  Y1-Au  Y1-Wi  Y2-Sp  Y2-Su  ...          |  |
| +-------------------------------------------------------------+  |
|                                                                   |
| [Species Mastery]           [Ending History]                      |
| +-----------------------+   +--------------------------+          |
| | Rose:    [###---] S   |   | Run 1: B rank (Normal)   |          |
| | Cactus:  [####--] G   |   | Run 2: A rank (Normal)   |          |
| | Lettuce: [######] G   |   | Run 3: S rank (Hard)     |          |
| | Basil:   [##----] B   |   |                          |          |
| | ...                   |   |                          |          |
| +-----------------------+   +--------------------------+          |
|                                                                   |
| [Achievement Progress]                                            |
| +-------------------------------------------------------------+  |
| | Unlocked: 24 / 42  (57%)                                    |  |
| | [###########################-----------------------]          |  |
| | Recent: "변이 사냥꾼" (2 hours ago)                          |  |
| +-------------------------------------------------------------+  |
+-------------------------------------------------------------------+
```

### 6.3 Statistics Data Model

```typescript
interface StatisticsDashboard {
  // 현재 회차 통계
  current_session: {
    session_id: string;
    prestige_level: number;
    difficulty: string;
    scenario: string;
    elapsed_days: number;
    total_days: number;
    current_year: number;
    current_season: string;
    revenue: number;
    collection_rate: number;
    satisfaction: number;
    plants_active: number;
    plants_harvested: number;
    plants_died: number;
    mutations_found: number;
  };

  // 글로벌 (전체 회차) 통계
  global: {
    total_playthroughs: number;
    best_ending_rank: string;
    total_play_time_hours: number;
    total_plants_grown: number;
    total_plants_harvested: number;
    total_plants_died: number;
    total_coins_earned: number;
    total_mutations_found: number;
    unique_mutations_found: number;
    achievement_count: number;
    achievement_total: number;
    collection_base_rate: number;      // 기본종 도감 완성률
    collection_variant_rate: number;   // 변이종 도감 완성률
    collection_overall_rate: number;   // 전체 도감 완성률
  };

  // 시계열 데이터 (차트용)
  revenue_history: { week: number; revenue: number }[];
  satisfaction_history: { week: number; score: number }[];
  collection_history: { week: number; count: number }[];

  // 종별 마스터리 현황
  species_mastery: {
    plant_id: string;
    name_ko: string;
    mastery_level: number;
    mastery_points: number;
    total_grown: number;
    total_harvested: number;
    variants_found: string[];
  }[];

  // 엔딩 히스토리
  ending_history: EndingRecord[];

  // 최근 업적
  recent_achievements: {
    achievement_id: string;
    name_ko: string;
    unlocked_at: Date;
    rarity: string;
  }[];
}
```

### 6.4 Chart Specifications

| 차트 | 유형 | X축 | Y축 | 데이터 소스 |
|------|------|-----|-----|-----------|
| 매출 추이 | Line Chart | 주차 (Week) | 누적 매출 (Coins) | GameSession.weekly_revenue_log |
| 만족도 추이 | Line Chart | 주차 | 만족도 (0~100) | GameSession.weekly_satisfaction_log |
| 도감 수집 추이 | Step Chart | 주차 | 수집 종 수 | CollectionEntry.first_harvested_at |
| 종별 마스터리 | Horizontal Bar | 식물 종 | 마스터리 포인트 | CollectionEntry.mastery_points |
| 엔딩 히스토리 | Timeline | 회차 | 랭크 | EndingRecord |
| 업적 달성률 | Donut Chart | 카테고리별 | 달성/미달성 | UserAchievement |
| 회차별 비교 | Grouped Bar | 회차 | 매출/수집률/만족도 | EndingRecord |

---

## 7. Data Model & State Management

### 7.1 State Hierarchy

```
User (영구)
  |
  +-- PrestigeProfile (영구, 회차 독립)
  |     +-- prestige_level
  |     +-- ending_history[]
  |     +-- global_stats
  |     +-- unlocked_scenarios[]
  |     +-- unlocked_difficulty_modes[]
  |
  +-- CollectionEntry[] (영구, 회차 독립)
  |     +-- per plant/variant: discovery_status, mastery
  |
  +-- UserAchievement[] (영구, 회차 독립)
  |
  +-- UserTitle[] (영구, 회차 독립)
  |     +-- equipped_title_id
  |
  +-- GameSession (회차별)
        +-- year/season/week state
        +-- in-session stats
        +-- revenue/collection/satisfaction
```

### 7.2 Redux State Structure (Frontend)

```typescript
interface RootState {
  auth: AuthState;

  // 현재 게임 세션 (회차별 리셋)
  gameSession: {
    current: GameSession | null;
    loading: boolean;
  };

  // 영구 메타 데이터 (회차 독립)
  meta: {
    prestige: PrestigeProfile;
    collection: CollectionEntry[];
    achievements: UserAchievement[];
    titles: UserTitle[];
    equippedTitle: Title | null;
  };

  // 통계 (캐시)
  statistics: {
    dashboard: StatisticsDashboard | null;
    loading: boolean;
    lastFetched: Date | null;
  };

  // UI 상태
  ui: {
    achievementNotification: UserAchievement | null; // 팝업 큐
    mutationNotification: PlantVariant | null;
    titleUnlockNotification: Title | null;
  };
}
```

### 7.3 State Persistence Strategy

| 데이터 | 저장소 | 동기화 전략 |
|--------|-------|-----------|
| PrestigeProfile | PostgreSQL (서버) | API 호출로 동기화, 로컬 캐시 |
| CollectionEntry[] | PostgreSQL (서버) | 이벤트 발생 시 즉시 동기화 |
| UserAchievement[] | PostgreSQL (서버) | 이벤트 발생 시 즉시 동기화, 미알림 큐 로컬 저장 |
| UserTitle[] | PostgreSQL (서버) | 장착 변경 시 즉시 동기화 |
| GameSession | PostgreSQL (서버) | 시뮬레이션 틱마다 동기화 |
| StatisticsDashboard | 서버 집계 쿼리 | 대시보드 접근 시 Lazy Load, 5분 캐시 |
| UI 알림 큐 | localStorage | 클라이언트 전용 |

---

## 8. Database Schema (Migration Plan)

### 8.1 New Tables

```sql
-- ============================================================
-- Table: prestige_profiles
-- 프레스티지 메타 데이터 (유저당 1개, 영구)
-- ============================================================
CREATE TABLE prestige_profiles (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  prestige_level  INTEGER NOT NULL DEFAULT 0,
  total_playthroughs INTEGER NOT NULL DEFAULT 0,
  best_ending_rank VARCHAR(1) DEFAULT NULL,  -- 'S','A','B','C','F'

  -- 캐리오버 보너스 (JSON으로 유연하게)
  carryover       JSONB NOT NULL DEFAULT '{
    "starting_coins_bonus": 0,
    "revenue_multiplier": 1.0,
    "growth_speed_bonus": 1.0,
    "health_resilience_bonus": 1.0,
    "mutation_probability_bonus": 0.0,
    "mastery_gain_bonus": 1.0,
    "starting_plots": 4,
    "starting_tools": []
  }',

  -- 해금 콘텐츠
  unlocked_scenarios      TEXT[] NOT NULL DEFAULT ARRAY['main'],
  unlocked_difficulty_modes TEXT[] NOT NULL DEFAULT ARRAY['normal'],
  unlocked_cosmetics      TEXT[] NOT NULL DEFAULT '{}',

  -- 글로벌 통계
  global_stats    JSONB NOT NULL DEFAULT '{
    "total_plants_ever_grown": 0,
    "total_plants_ever_harvested": 0,
    "total_coins_ever_earned": 0,
    "total_play_time_hours": 0,
    "total_mutations_found": 0
  }',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: ending_history
-- 엔딩 기록 (회차별 1개)
-- ============================================================
CREATE TABLE ending_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES game_sessions(id),
  prestige_level  INTEGER NOT NULL,
  ending_rank     VARCHAR(1) NOT NULL,
  difficulty      VARCHAR(10) NOT NULL DEFAULT 'normal',
  scenario_id     VARCHAR(50) NOT NULL DEFAULT 'main',
  final_revenue   BIGINT NOT NULL DEFAULT 0,
  final_collection_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  final_satisfaction    NUMERIC(5,2) NOT NULL DEFAULT 0,
  play_duration_days    INTEGER NOT NULL DEFAULT 0,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, session_id)
);

CREATE INDEX idx_ending_history_user ON ending_history(user_id);

-- ============================================================
-- Table: plant_variants
-- 돌연변이/희귀 품종 정의 (마스터 데이터)
-- ============================================================
CREATE TABLE plant_variants (
  id              VARCHAR(50) PRIMARY KEY,   -- e.g. "rose_blue"
  base_plant_id   VARCHAR(50) NOT NULL REFERENCES plants(id),
  name_ko         VARCHAR(100) NOT NULL,
  name_en         VARCHAR(100) NOT NULL,
  variant_type    VARCHAR(20) NOT NULL,      -- 'mutation','rare','legendary'
  rarity          VARCHAR(20) NOT NULL,      -- 'common'~'legendary'
  trigger_config  JSONB NOT NULL,            -- MutationTrigger JSON
  stat_modifiers  JSONB NOT NULL,            -- 성장속도/보상 배율 등
  sprite_variant  VARCHAR(100),
  color_tint      VARCHAR(7),               -- hex color
  particle_effect VARCHAR(50),
  description_ko  TEXT,
  discovery_hint_ko TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plant_variants_base ON plant_variants(base_plant_id);

-- ============================================================
-- Table: collection_entries
-- 도감 엔트리 (유저 x 식물/변이 조합별 1개, 영구)
-- ============================================================
CREATE TABLE collection_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plant_id        VARCHAR(50) NOT NULL REFERENCES plants(id),
  variant_id      VARCHAR(50) REFERENCES plant_variants(id),

  discovery_status VARCHAR(20) NOT NULL DEFAULT 'undiscovered',
  first_discovered_at TIMESTAMPTZ,
  first_harvested_at  TIMESTAMPTZ,

  total_grown     INTEGER NOT NULL DEFAULT 0,
  total_harvested INTEGER NOT NULL DEFAULT 0,
  best_health_at_harvest NUMERIC(5,2) NOT NULL DEFAULT 0,
  best_growth_time_days  INTEGER NOT NULL DEFAULT 0,
  total_deaths    INTEGER NOT NULL DEFAULT 0,

  mastery_points  INTEGER NOT NULL DEFAULT 0,
  mastery_level   SMALLINT NOT NULL DEFAULT 0,  -- 0~3

  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, plant_id, variant_id)
);

CREATE INDEX idx_collection_user ON collection_entries(user_id);
CREATE INDEX idx_collection_plant ON collection_entries(plant_id);

-- ============================================================
-- Table: achievements
-- 업적 정의 (마스터 데이터)
-- ============================================================
CREATE TABLE achievements (
  id              VARCHAR(50) PRIMARY KEY,
  category        VARCHAR(20) NOT NULL,
  name_ko         VARCHAR(100) NOT NULL,
  name_en         VARCHAR(100) NOT NULL,
  description_ko  TEXT NOT NULL,
  icon_url        VARCHAR(255),
  rarity          VARCHAR(20) NOT NULL DEFAULT 'common',
  condition_config JSONB NOT NULL,            -- AchievementCondition JSON
  rewards         JSONB NOT NULL DEFAULT '{"experience": 0, "coins": 0}',
  series_id       VARCHAR(50),
  series_order    SMALLINT,
  is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: user_achievements
-- 유저별 업적 달성 기록 (영구)
-- ============================================================
CREATE TABLE user_achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id  VARCHAR(50) NOT NULL REFERENCES achievements(id),
  unlocked_at     TIMESTAMPTZ,                -- NULL이면 미달성
  unlocked_in_session UUID REFERENCES game_sessions(id),
  progress        NUMERIC(5,4) NOT NULL DEFAULT 0, -- 0.0~1.0
  is_notified     BOOLEAN NOT NULL DEFAULT FALSE,

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

-- ============================================================
-- Table: titles
-- 칭호 정의 (마스터 데이터)
-- ============================================================
CREATE TABLE titles (
  id              VARCHAR(50) PRIMARY KEY,
  name_ko         VARCHAR(100) NOT NULL,
  name_en         VARCHAR(100) NOT NULL,
  description_ko  TEXT,
  category        VARCHAR(20) NOT NULL,       -- 'progression','achievement','prestige','special'
  rarity          VARCHAR(20) NOT NULL DEFAULT 'common',
  unlock_condition JSONB NOT NULL,
  passive_bonus   JSONB,                      -- nullable
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Table: user_titles
-- 유저별 칭호 해금/장착 (영구)
-- ============================================================
CREATE TABLE user_titles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id        VARCHAR(50) NOT NULL REFERENCES titles(id),
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_equipped     BOOLEAN NOT NULL DEFAULT FALSE,

  UNIQUE(user_id, title_id)
);

CREATE INDEX idx_user_titles_user ON user_titles(user_id);

-- 유저당 장착 칭호 1개 보장을 위한 partial unique index
CREATE UNIQUE INDEX idx_user_titles_equipped
  ON user_titles(user_id) WHERE is_equipped = TRUE;

-- ============================================================
-- Table: weekly_statistics_log
-- 주간 통계 스냅샷 (차트용 시계열)
-- ============================================================
CREATE TABLE weekly_statistics_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  week_number     INTEGER NOT NULL,           -- 1~156
  revenue_cumulative BIGINT NOT NULL DEFAULT 0,
  revenue_weekly  INTEGER NOT NULL DEFAULT 0,
  satisfaction    NUMERIC(5,2) NOT NULL DEFAULT 0,
  collection_count INTEGER NOT NULL DEFAULT 0,
  plants_active   INTEGER NOT NULL DEFAULT 0,
  plants_harvested_weekly INTEGER NOT NULL DEFAULT 0,
  plants_died_weekly INTEGER NOT NULL DEFAULT 0,
  logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(session_id, week_number)
);

CREATE INDEX idx_weekly_stats_session ON weekly_statistics_log(session_id);
```

### 8.2 Existing Table Modifications

```sql
-- user_plants 테이블에 variant_id 컬럼 추가
ALTER TABLE user_plants
  ADD COLUMN variant_id VARCHAR(50) REFERENCES plant_variants(id);

-- game_sessions 테이블에 프레스티지 관련 컬럼 추가
ALTER TABLE game_sessions
  ADD COLUMN prestige_level INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN difficulty VARCHAR(10) NOT NULL DEFAULT 'normal',
  ADD COLUMN scenario_id VARCHAR(50) NOT NULL DEFAULT 'main';
```

### 8.3 Migration Order

```
Migration 1: plant_variants (마스터 데이터, 의존성 없음)
Migration 2: achievements, titles (마스터 데이터)
Migration 3: prestige_profiles (users 의존)
Migration 4: collection_entries (users, plants, plant_variants 의존)
Migration 5: user_achievements, user_titles (users, achievements, titles 의존)
Migration 6: ending_history (users, game_sessions 의존)
Migration 7: weekly_statistics_log (game_sessions 의존)
Migration 8: ALTER user_plants, game_sessions (기존 테이블 수정)
Migration 9: Seed data (plant_variants 16종, achievements 42종, titles 20종)
```

---

## 9. API Design

### 9.1 Collection API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/collection | 내 도감 전체 조회 (완성도 포함) |
| GET | /api/v1/collection/:plantId | 특정 식물 도감 상세 (마스터리, 변이 목록) |
| GET | /api/v1/collection/stats | 도감 완성도 통계 |
| GET | /api/v1/variants | 전체 변이종 목록 (발견된 것만, 미발견은 힌트) |

### 9.2 Achievement API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/achievements | 전체 업적 목록 (달성 여부 포함) |
| GET | /api/v1/achievements/:id | 업적 상세 |
| GET | /api/v1/achievements/recent | 최근 달성 업적 (알림용) |
| POST | /api/v1/achievements/:id/notify | 알림 확인 처리 |

### 9.3 Title API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/titles | 내 칭호 목록 (해금/미해금 포함) |
| POST | /api/v1/titles/:id/equip | 칭호 장착 |
| POST | /api/v1/titles/:id/unequip | 칭호 해제 |

### 9.4 Prestige API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/prestige | 프레스티지 프로필 조회 |
| GET | /api/v1/prestige/preview | NG+ 시작 시 적용될 보너스 미리보기 |
| POST | /api/v1/prestige/new-game-plus | NG+ 시작 (새 세션 생성) |
| GET | /api/v1/prestige/endings | 엔딩 히스토리 |
| GET | /api/v1/prestige/scenarios | 해금된 시나리오 목록 |

### 9.5 Statistics API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/statistics/dashboard | 통계 대시보드 전체 데이터 |
| GET | /api/v1/statistics/current-session | 현재 세션 통계 |
| GET | /api/v1/statistics/global | 글로벌 누적 통계 |
| GET | /api/v1/statistics/chart/:type | 특정 차트 데이터 (revenue/satisfaction/collection) |
| GET | /api/v1/statistics/compare | 회차별 비교 데이터 |

### 9.6 API Response Examples

```typescript
// GET /api/v1/collection
{
  "success": true,
  "data": {
    "completion": {
      "base_discovered": 12,
      "base_harvested": 9,
      "base_mastered": 3,
      "base_total": 15,
      "base_completion_percent": 60.0,
      "variant_discovered": 5,
      "variant_total": 16,
      "variant_completion_percent": 31.25,
      "overall_completion_percent": 45.16
    },
    "entries": [
      {
        "plant_id": "rose",
        "plant_name_ko": "장미",
        "discovery_status": "mastered",
        "mastery_level": 3,
        "mastery_points": 280,
        "total_harvested": 12,
        "best_health_at_harvest": 98,
        "variants": [
          {
            "variant_id": "rose_blue",
            "name_ko": "푸른 장미",
            "rarity": "epic",
            "discovery_status": "discovered"
          },
          {
            "variant_id": "rose_black",
            "name_ko": "???",
            "rarity": "legendary",
            "discovery_status": "undiscovered",
            "hint": "전설 속에만 존재한다는 장미..."
          }
        ]
      }
      // ... 14 more entries
    ]
  }
}

// POST /api/v1/prestige/new-game-plus
{
  "success": true,
  "data": {
    "new_session_id": "uuid-xxx",
    "prestige_level": 3,
    "difficulty": "hard",
    "scenario_id": "scenario_b",
    "applied_bonuses": {
      "starting_coins": 3500,
      "revenue_multiplier": 1.15,
      "growth_speed_bonus": 1.10,
      "mutation_probability_bonus": 0.06,
      "starting_plots": 6
    },
    "carried_over": {
      "achievements_count": 24,
      "collection_entries": 21,
      "titles_count": 8,
      "equipped_title": "마스터 정원사"
    }
  }
}
```

---

## 10. System Interdependency Map

### 10.1 의존성 그래프

```
                    +------------------+
                    |   Core Systems   |
                    | (Phase 1 + 2)    |
                    +--------+---------+
                             |
            +----------------+----------------+
            |                                 |
   +--------v---------+           +-----------v----------+
   | Simulation Engine |           | Scenario/Year System |
   | (growth, health)  |           | (GameSession, KPI)   |
   +--------+----------+           +----------+-----------+
            |                                 |
            +------+------+                   |
                   |      |                   |
          +--------v--+   |          +--------v---------+
          | Mutation   |   |          | Prestige/NG+     |
          | Service    |   |          | System           |
          +-----+------+   |          +----+------+------+
                |          |               |      |
          +-----v------+   |         +-----v--+   |
          | Collection  |   |         | Ending |   |
          | (Pokedex)   |   |         | History|   |
          +-----+-------+   |         +--------+   |
                |           |               |       |
          +-----v-----------v---+     +-----v-------v----+
          | Achievement         |     | Statistics       |
          | Evaluator           |     | Dashboard        |
          +-----+---------------+     +------------------+
                |
          +-----v------+
          | Title       |
          | System      |
          +-------------+
```

### 10.2 이벤트 흐름 (핵심 시나리오)

#### 시나리오 A: 식물 수확 시

```
1. UserPlantController.harvest()
   |
2. UserPlantModel.harvest() --> DB 업데이트
   |
3. CollectionService.recordHarvest(userId, plantId, variantId, health)
   |  +-- collection_entries.total_harvested++
   |  +-- mastery_points += 20 (+ 보너스)
   |  +-- mastery_level 재계산
   |  +-- discovery_status 업데이트
   |
4. AchievementEvaluator.evaluate(userId, { type: 'plant_harvested', ... })
   |  +-- 관련 업적 조건 체크
   |  +-- 새로 달성된 업적 → user_achievements INSERT
   |  +-- 칭호 연동 → TitleService.checkUnlock()
   |
5. GameSession.total_plants_harvested++
   |  +-- unique_species_collected 업데이트
   |
6. PrestigeProfile.global_stats 업데이트
   |
7. Response: 수확 결과 + 업적 알림 + 도감 업데이트 + 칭호 해금 알림
```

#### 시나리오 B: NG+ 진입 시

```
1. PrestigeController.newGamePlus(userId, { difficulty, scenarioId })
   |
2. PrestigeService.calculateCarryover(userId)
   |  +-- prestige_level++ 에 따른 보너스 계산
   |  +-- 난이도 보정 적용
   |
3. EndingHistory.create(currentSession)
   |  +-- 현재 세션의 최종 KPI 기록
   |
4. GameSessionService.create({
   |    user_id, prestige_level, difficulty, scenario_id,
   |    starting_coins: 1000 + carryover.starting_coins_bonus
   |  })
   |
5. PrestigeProfile.update({
   |    prestige_level++, total_playthroughs++, carryover
   |  })
   |
6. AchievementEvaluator.evaluate(userId, { type: 'ng_plus_started' })
   |
7. TitleService.checkPrestigeTitles(userId)
   |
   |  [유지 항목]: collection_entries, user_achievements, user_titles, prestige_profiles
   |  [리셋 항목]: game_session (새로 생성), user_plants (빈 상태), users.level/exp (리셋)
   |
8. Response: 새 세션 정보 + 적용된 보너스 + 새로 해금된 업적/칭호
```

#### 시나리오 C: 돌연변이 발생 시

```
1. SimulationService.tick() (매 시간)
   |
2. MutationService.checkMutation(userPlant, gameSession, envHistory)
   |  +-- 돌연변이 후보 필터링
   |  +-- 프레스티지 보너스 적용
   |  +-- 마스터리 보너스 적용
   |  +-- 확률 롤 → 성공!
   |
3. UserPlantModel.update({ variant_id: 'rose_blue' })
   |
4. CollectionService.recordDiscovery(userId, 'rose', 'rose_blue')
   |  +-- collection_entries INSERT (variant)
   |  +-- mastery_points += 30
   |
5. AchievementEvaluator.evaluate(userId, { type: 'mutation_found', variant: 'rose_blue' })
   |
6. WebSocket/SSE → 클라이언트 알림: "돌연변이 발견! 푸른 장미"
```

### 10.3 System Coupling Matrix

| | Collection | Achievement | Title | Prestige | Statistics |
|---|---|---|---|---|---|
| **Collection** | - | Triggers | Unlocks | Bonus applied | Data source |
| **Achievement** | Reads status | - | Triggers unlock | Reads level | Data source |
| **Title** | Reads mastery | Reads unlock | - | Reads level | Data source |
| **Prestige** | Reads rate | Triggers | Triggers | - | Data source |
| **Statistics** | Reads all | Reads all | Reads equipped | Reads all | - |

- **Triggers**: A 시스템의 이벤트가 B 시스템의 평가를 트리거
- **Reads**: A가 B의 데이터를 읽기만 함
- **Unlocks**: A의 조건 충족이 B의 콘텐츠를 해금
- **Bonus applied**: A가 B로부터 계산된 보너스를 적용받음
- **Data source**: A가 B의 데이터 시각화에 사용됨

---

## 11. User Experience Flow

### 11.1 전체 게임 라이프사이클

```
[최초 접속]
    |
    v
[회원가입/로그인]
    |
    v
[메인 화면: "새 게임 시작" 버튼]
    |
    v
[Tutorial 시나리오]  ←-- 칭호 부여: "새싹 정원사"
    |
    v
[Year 1~3 게임플레이]
    |   +-- 수확 시 → 도감 업데이트 + 업적 체크 + 마스터리 적립
    |   +-- 돌연변이 → 알림 팝업 + 도감 신규 엔트리
    |   +-- 레벨업 시 → 칭호 진급 체크
    |   +-- 매 주 → 통계 스냅샷 기록
    |
    v
[Final Evaluation → 엔딩 (S/A/B/C/F)]
    |
    v
[Credits → 업적 체크 (엔딩 관련)]
    |
    v
[Post-Game 선택 화면]
    |
    +-- [Continue] → 샌드박스 모드 (시간 제한 없음)
    |
    +-- [New Game+] → NG+ 설정 화면
            |
            +-- 난이도 선택 (해금된 것만)
            +-- 시나리오 선택 (해금된 것만)
            +-- 캐리오버 보너스 확인
            +-- "시작" 클릭
                |
                v
            [새 GameSession (prestige_level + 1)]
                |
                v
            [Year 1 Spring, 보너스 적용 상태]
                |
                v
            [반복... 더 높은 엔딩, 더 많은 도감/업적 달성]
```

### 11.2 핵심 UX Moments

| 순간 | 감정 목표 | UI 표현 |
|------|----------|---------|
| 첫 수확 | 성취감 | 축하 애니메이션 + 업적 배지 팝업 |
| 돌연변이 발견 | 놀라움, 흥분 | 풀스크린 발견 연출 + 도감 등록 애니메이션 |
| 칭호 진급 | 자부심 | 칭호 카드 플립 연출 + "축하합니다" 모달 |
| NG+ 시작 | 기대감 | 보너스 적용 카운터 애니메이션 + "강화된 시작" 연출 |
| 도감 완성 | 대단한 성취 | 특별 엔딩 크레딧 + Legendary 칭호 부여 |
| S랭크 달성 | 최고의 달성감 | 특별 엔딩 씬 + 불꽃놀이 + 특별 칭호 |

### 11.3 알림 시스템

```typescript
interface Notification {
  type: 'achievement' | 'mutation' | 'title' | 'mastery' | 'collection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  display: 'toast' | 'modal' | 'fullscreen';
  data: any;
  auto_dismiss_ms: number;           // 0이면 수동 닫기
}

// 우선순위별 표시 방식
// critical (fullscreen): 전설 변이 발견, S랭크 달성, 도감 완성
// high (modal): 업적 달성, 칭호 해금, Legendary/Epic 변이 발견
// medium (toast 5초): 마스터리 레벨업, 일반 업적
// low (toast 3초): 도감 상태 변경, 통계 마일스톤
```

---

## 12. Frontend Architecture

### 12.1 New Pages

| 페이지 | 경로 | 설명 |
|--------|------|------|
| CollectionPage (개선) | /collection | 도감 메인 (그리드 뷰 + 완성도 바) |
| CollectionDetailPage | /collection/:plantId | 식물 상세 + 마스터리 + 변이 목록 |
| AchievementsPage | /achievements | 업적 목록 (카테고리 탭 + 진행도) |
| TitlesPage | /titles | 칭호 목록 + 장착 관리 |
| StatisticsPage | /statistics | 통계 대시보드 |
| PrestigePage | /prestige | NG+ 설정 + 보너스 미리보기 |
| PostGamePage | /post-game | 엔딩 후 선택 화면 |

### 12.2 New Components

```
components/
  collection/
    CollectionGrid.tsx          // 도감 그리드 (15종 + 변이)
    CollectionCard.tsx          // 개별 식물 카드 (상태별 렌더링)
    MasteryProgress.tsx         // 마스터리 진행도 바
    VariantBadge.tsx            // 변이종 배지
    CollectionCompletion.tsx    // 완성도 프로그레스 바

  achievements/
    AchievementList.tsx         // 업적 목록
    AchievementCard.tsx         // 개별 업적 카드
    AchievementProgress.tsx     // 진행도 표시
    AchievementPopup.tsx        // 달성 시 팝업

  titles/
    TitleList.tsx               // 칭호 목록
    TitleCard.tsx               // 칭호 카드 + 장착 버튼
    TitleBadge.tsx              // 프로필에 표시되는 칭호 배지
    EquippedTitle.tsx           // 현재 장착 칭호 표시

  statistics/
    StatsDashboard.tsx          // 대시보드 레이아웃
    RevenueChart.tsx            // 매출 라인 차트
    SatisfactionChart.tsx       // 만족도 차트
    CollectionChart.tsx         // 수집 추이 차트
    MasteryOverview.tsx         // 종별 마스터리 바 차트
    EndingTimeline.tsx          // 엔딩 히스토리 타임라인
    AchievementDonut.tsx        // 업적 달성률 도넛
    SessionComparison.tsx       // 회차별 비교 차트

  prestige/
    PrestigeSetup.tsx           // NG+ 설정 폼
    BonusPreview.tsx            // 적용될 보너스 미리보기
    DifficultySelector.tsx      // 난이도 선택
    ScenarioSelector.tsx        // 시나리오 선택
    CarryoverSummary.tsx        // 유지/리셋 항목 요약

  notifications/
    NotificationManager.tsx     // 알림 큐 관리
    AchievementToast.tsx        // 업적 토스트
    MutationDiscovery.tsx       // 돌연변이 발견 풀스크린
    TitleUnlock.tsx             // 칭호 해금 모달
```

### 12.3 Chart Library

- **Recharts** (React 네이티브 차트 라이브러리) 사용 권장
  - 이미 React + TypeScript 환경
  - SSR 불필요 (SPA)
  - 라인/바/도넛/스텝 차트 모두 지원
  - Tailwind CSS와 호환

---

## 13. Implementation Roadmap

### Phase MVP (4~5 weeks)

> 핵심 루프가 돌아가는 최소 구현

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 1 | DB 마이그레이션 (Migration 1~8) | 모든 신규 테이블 생성 |
| 1 | Seed 데이터: plant_variants 16종, achievements 42종, titles 20종 | Migration 9 |
| 2 | Backend: CollectionService, CollectionController | 도감 CRUD API |
| 2 | Backend: MutationService (시뮬레이션 틱 통합) | 돌연변이 발생 로직 |
| 3 | Backend: AchievementEvaluator, AchievementController | 업적 평가/조회 API |
| 3 | Backend: TitleService, TitleController | 칭호 해금/장착 API |
| 4 | Frontend: CollectionPage 개선, AchievementsPage | UI 구현 |
| 4 | Frontend: NotificationManager (Toast 기반) | 알림 기본 구현 |
| 5 | Integration testing | 수확→도감→업적→칭호 흐름 E2E 테스트 |

### Phase 2 (3~4 weeks)

> 프레스티지 시스템 + 통계 대시보드

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 6 | Backend: PrestigeService, PrestigeController | NG+ API |
| 6 | Backend: 엔딩 히스토리 기록 로직 | 엔딩→NG+ 전환 흐름 |
| 7 | Backend: weekly_statistics_log 기록 (시뮬레이션 틱 통합) | 주간 스냅샷 |
| 7 | Backend: StatisticsService, StatisticsController | 통계 집계 API |
| 8 | Frontend: PrestigePage, PostGamePage | NG+ UI |
| 8 | Frontend: StatisticsPage (Recharts 통합) | 통계 대시보드 UI |
| 9 | Frontend: 풀스크린 돌연변이 발견, 칭호 해금 모달 | 고품질 UX |
| 9 | 밸런스 테스팅 + 보너스 수치 조정 | 프레스티지 밸런스 |

### Phase 3 - Extension (2~3 weeks)

> 해금 시나리오, 난이도 모드, 폴리싱

| 주차 | 작업 | 산출물 |
|------|------|--------|
| 10 | 해금 시나리오 콘텐츠 구현 (scenario_b, scenario_c) | 시나리오 데이터 + 조건부 로직 |
| 10 | Hard/Extreme 난이도 모드 밸런스 | 난이도 배율 조정 |
| 11 | 숨김 업적 구현 + 시크릿 발견 연출 | 히든 콘텐츠 |
| 11 | Legendary 시나리오 + Zen 가든 모드 | 특별 시나리오 |
| 12 | 전체 E2E 테스트 + 성능 최적화 | QA 완료 |
| 12 | 변이종 스프라이트 에셋 + 시각 이펙트 | 비주얼 폴리싱 |

---

## 14. Technical Considerations & Risks

### 14.1 Performance

| 우려 사항 | 대응 전략 |
|----------|----------|
| 업적 평가 오버헤드 (매 이벤트마다) | 이벤트-업적 매핑 테이블로 후보 축소, 이미 달성된 업적 즉시 스킵 |
| 돌연변이 확률 체크 (매 시뮬레이션 틱) | variant_id가 이미 있으면 스킵, eligible variants 캐싱 |
| 통계 대시보드 집계 쿼리 | weekly_statistics_log로 사전 집계, 5분 캐시, Lazy Loading |
| 도감 페이지 로딩 (31종 + 마스터리 데이터) | 페이지네이션 불필요 (31건), 단일 집계 쿼리 최적화 |

### 14.2 Data Integrity

| 우려 사항 | 대응 전략 |
|----------|----------|
| NG+ 시 리셋/유지 항목 혼동 | 명확한 트랜잭션: 새 세션 생성 → 유저 레벨 리셋 → prestige 업데이트를 atomic 처리 |
| 업적 중복 달성 방지 | UNIQUE(user_id, achievement_id) + unlocked_at NULL 체크 |
| 칭호 동시 장착 방지 | Partial Unique Index + 서비스 레이어 validation |
| 돌연변이 발생 후 서버 크래시 | 트랜잭션: variant_id 업데이트 + collection_entry 생성을 atomic |
| 매주 통계 스냅샷 누락 | UNIQUE(session_id, week_number) + 누락 감지 & 백필 로직 |

### 14.3 Scalability

| 우려 사항 | 대응 전략 |
|----------|----------|
| collection_entries 테이블 크기 (유저 × 31종) | 유저당 최대 31행, 인덱스 충분 |
| user_achievements 테이블 크기 (유저 × 42업적) | 유저당 최대 42행, 인덱스 충분 |
| weekly_statistics_log (유저 × 회차 × 156주) | 파티셔닝 고려 (session_id 기준), 오래된 데이터 아카이브 |
| 동시 다수 유저 시뮬레이션 틱 | 돌연변이/업적 체크는 비동기 큐로 분리 가능 |

### 14.4 Backward Compatibility

| 항목 | 전략 |
|------|------|
| 기존 user_plants 데이터 | variant_id 컬럼 nullable, 기존 데이터는 NULL (기본종) |
| 기존 game_sessions | prestige_level 기본값 0, difficulty 기본값 'normal' |
| 기존 users | prestige_profiles 자동 생성 (첫 접근 시 또는 마이그레이션 시 bulk insert) |
| 기존 Collection.tsx | 확장 (breaking change 최소화), 기존 API 유지 + 신규 API 추가 |

### 14.5 Testing Strategy

| 테스트 유형 | 범위 | 도구 |
|-----------|------|------|
| Unit | MutationService, AchievementEvaluator, PrestigeService | Jest |
| Integration | 수확→도감→업적→칭호 전체 흐름 | Jest + Supertest |
| E2E | NG+ 전체 사이클 (엔딩→설정→시작→보너스 확인) | Playwright |
| Balance | 프레스티지 보너스 누적이 게임을 파괴하지 않는지 | 수동 + 시뮬레이션 스크립트 |

### 14.6 Open Questions

| # | 질문 | 의사결정 필요 시점 |
|---|------|-----------------|
| 1 | 변이종 스프라이트 에셋을 어떻게 제작하는가? (color_tint fallback vs 전용 에셋) | Phase MVP 시작 전 |
| 2 | 통계 대시보드를 실시간(WebSocket)으로 할 것인가, 폴링으로 할 것인가? | Phase 2 시작 전 |
| 3 | 프레스티지 보너스 상한값의 최종 밸런스 수치 | Phase 2 밸런스 테스팅 |
| 4 | 해금 시나리오의 콘텐츠 깊이 (시나리오별 고유 이벤트/NPC 필요?) | Phase 3 시작 전 |
| 5 | 소셜 기능(리더보드, 정원 방문) 추가 시 칭호/통계 공유 범위 | 향후 Phase |

---

## Appendix A: Glossary

| 용어 | 정의 |
|------|------|
| Prestige Level | NG+ 시작 횟수. 0이면 첫 회차 |
| Mastery | 특정 식물 종에 대한 숙련도. Bronze/Silver/Gold 3단계 |
| Carryover | NG+ 시작 시 이전 회차에서 이월되는 보너스 |
| Variant | 기본종에서 파생된 돌연변이/희귀 품종 |
| Discovery Status | 도감 엔트리의 발견 상태 (미발견→실루엣→발견→마스터) |
| Hard Cap | 프레스티지 보너스 누적의 최대 상한값 |

## Appendix B: File Structure (Proposed)

```
backend/src/
  services/
    collection.service.ts        # NEW - 도감 비즈니스 로직
    mutation.service.ts          # NEW - 돌연변이 발생 로직
    achievement.service.ts       # NEW - 업적 평가 엔진
    title.service.ts             # NEW - 칭호 해금/장착
    prestige.service.ts          # NEW - 프레스티지/NG+ 관리
    statistics.service.ts        # NEW - 통계 집계
    simulation.service.ts        # MODIFIED - mutation tick 추가

  controllers/
    collection.controller.ts     # NEW
    achievement.controller.ts    # NEW
    title.controller.ts          # NEW
    prestige.controller.ts       # NEW
    statistics.controller.ts     # NEW

  models/
    PlantVariant.ts              # NEW
    CollectionEntry.ts           # NEW
    Achievement.ts               # NEW
    UserAchievement.ts           # NEW
    Title.ts                     # NEW
    UserTitle.ts                 # NEW
    PrestigeProfile.ts           # NEW
    EndingHistory.ts             # NEW
    WeeklyStatisticsLog.ts       # NEW

  routes/
    collection.routes.ts         # NEW
    achievement.routes.ts        # NEW
    title.routes.ts              # NEW
    prestige.routes.ts           # NEW
    statistics.routes.ts         # NEW

  migrations/
    YYYYMMDD_01_plant_variants.ts
    YYYYMMDD_02_achievements_titles.ts
    YYYYMMDD_03_prestige_profiles.ts
    YYYYMMDD_04_collection_entries.ts
    YYYYMMDD_05_user_achievements_titles.ts
    YYYYMMDD_06_ending_history.ts
    YYYYMMDD_07_weekly_statistics_log.ts
    YYYYMMDD_08_alter_existing_tables.ts
    YYYYMMDD_09_seed_master_data.ts

frontend/src/
  pages/
    Collection.tsx               # MODIFIED (대폭 확장)
    CollectionDetail.tsx         # NEW
    Achievements.tsx             # NEW
    Titles.tsx                   # NEW
    Statistics.tsx               # NEW
    Prestige.tsx                 # NEW
    PostGame.tsx                 # NEW

  components/
    collection/                  # NEW directory
    achievements/                # NEW directory
    titles/                      # NEW directory
    statistics/                  # NEW directory
    prestige/                    # NEW directory
    notifications/               # NEW directory

  services/
    collection.service.ts        # NEW
    achievement.service.ts       # NEW
    title.service.ts             # NEW
    prestige.service.ts          # NEW
    statistics.service.ts        # NEW

  store/
    collectionSlice.ts           # NEW (Redux Toolkit)
    achievementSlice.ts          # NEW
    titleSlice.ts                # NEW
    prestigeSlice.ts             # NEW
    statisticsSlice.ts           # NEW
    notificationSlice.ts         # NEW
```

---

*End of Document*
