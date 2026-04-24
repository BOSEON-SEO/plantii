# Plantii - 시나리오 & 년도 시스템 설계 문서

> **Version**: 1.0
> **Date**: 2026-04-24
> **Status**: Design
> **Depends on**: Phase 1 (Core Simulation), Phase 2 (Garden/Economy) Investigation Results

---

## Table of Contents

1. [설계 배경 및 목표](#1-설계-배경-및-목표)
2. [인게임 년도 시스템 구조](#2-인게임-년도-시스템-구조)
3. [메인 시나리오: 최고의 보타닉 가든](#3-메인-시나리오-최고의-보타닉-가든)
4. [년도별 목표 시스템 메커니즘](#4-년도별-목표-시스템-메커니즘)
5. [S/A/B/C/F 랭크 엔딩 분기 조건](#5-sabcf-랭크-엔딩-분기-조건)
6. [튜토리얼 시나리오 구조](#6-튜토리얼-시나리오-구조)
7. [스토리 컷신 및 엔딩 크레딧 통합](#7-스토리-컷신-및-엔딩-크레딧-통합)
8. [기술 구현 경로](#8-기술-구현-경로)
9. [데이터베이스 스키마](#9-데이터베이스-스키마)
10. [API 설계](#10-api-설계)
11. [프론트엔드 아키텍처](#11-프론트엔드-아키텍처)
12. [구현 로드맵](#12-구현-로드맵)

---

## 1. 설계 배경 및 목표

### 1.1 현재 상태 (Step-1 조사 결과 요약)

Step-1 조사(`PROJECT_INVESTIGATION_REPORT.md`)에서 확인된 핵심 사실:

| 카테고리 | 현황 |
|----------|------|
| 시나리오/스토리 | **전무** - 튜토리얼, 퀘스트, 내러티브 없음 |
| 엔딩/결과 화면 | **전무** - 수확 시 텍스트 메시지만, 전용 결과 화면 없음 |
| 게임 진행 목표 | **없음** - 오픈엔드 샌드박스, 종료 조건 미정의 |
| 활용 가능 인프라 | `plant_states` 시계열, `achievements` 스키마, `optimal_days_count` 통계 필드, 15종 x 5단계 스프라이트 |

### 1.2 설계 목표

본 문서는 Plantii에 **3년(인게임) 시나리오 기반 경영 시뮬레이션 구조**를 도입한다.

| 목표 | 설명 |
|------|------|
| 명확한 게임 목적 | "3년 안에 최고의 보타닉 가든을 만들어라" |
| 측정 가능한 진행도 | 년도별 KPI (매출, 수집률, 고객 만족도) |
| 다중 엔딩 | S/A/B/C/F 5단계 랭크 엔딩으로 리플레이 동기 부여 |
| 온보딩 | 튜토리얼 시나리오로 핵심 메커니즘 학습 |
| 내러티브 | 스토리 컷신으로 감정적 몰입 강화 |

### 1.3 핵심 설계 원칙

1. **기존 시뮬레이션 엔진 보존**: Phase 1의 `simulation.service.ts` 성장률/건강도 계산을 그대로 활용
2. **Phase 2 경제 시스템 통합**: Garden Grid, Shop, Resource 시스템 위에 년도 시스템을 레이어링
3. **시간 압축**: 실시간 1일 = 인게임 1주일 (3년 = 약 156 인게임 주 = 약 156 실시간 일 = ~5개월)
4. **선택의 무게**: 매 년도 제한된 자원으로 어떤 식물에 투자할지 전략적 판단 요구

---

## 2. 인게임 년도 시스템 구조

### 2.1 시간 구조

```
인게임 1년 = 4계절 = 12개월 = 52주
실시간 1일 = 인게임 1주

인게임 3년 전체:
  Year 1: 52주 (실시간 52일)
  Year 2: 52주 (실시간 52일)
  Year 3: 52주 (실시간 52일)
  ─────────────────────────────
  총합:   156주 (실시간 156일 ≈ 5.2개월)
```

### 2.2 계절 시스템

각 계절은 13주(실시간 13일)이며, 환경에 영향을 미친다.

| 계절 | 인게임 기간 | 기온 변동 | 일조량 변동 | 습도 변동 | 특수 효과 |
|------|-----------|----------|-----------|----------|----------|
| 봄 (Spring) | 1~13주 | 기본 +0 | 기본 +0 | 기본 +0 | 모종 성장률 +10% |
| 여름 (Summer) | 14~26주 | +5~8 C | +20% | -10% | 열매/채소 성장률 +15%, 수분 증발 +30% |
| 가을 (Autumn) | 27~39주 | -3~5 C | -15% | +5% | 수확 보상 +20%, 화훼 성장률 -10% |
| 겨울 (Winter) | 40~52주 | -8~15 C | -40% | +15% | 전체 성장률 -30%, 다육/관엽은 면제 |

### 2.3 게임 상태 머신

```
[NEW_GAME]
    │
    ▼
[TUTORIAL] ──완료──> [YEAR_1_SPRING]
                        │
                        ▼
                    [YEAR_1_SUMMER]
                        │
                        ▼
                    [YEAR_1_AUTUMN]
                        │
                        ▼
                    [YEAR_1_WINTER]
                        │
                        ▼
                    [YEAR_1_REVIEW] ── 년도 평가 ──> [YEAR_2_SPRING]
                                                        │
                                                        ▼
                                                    ... (반복) ...
                                                        │
                                                        ▼
                                                    [YEAR_3_REVIEW]
                                                        │
                                                        ▼
                                                    [FINAL_EVALUATION]
                                                        │
                                                        ▼
                                                    [ENDING_S/A/B/C/F]
                                                        │
                                                        ▼
                                                    [CREDITS]
                                                        │
                                                        ▼
                                                    [POST_GAME / NEW_GAME+]
```

### 2.4 상태 관리 데이터 구조

```typescript
// 게임 세션의 핵심 상태
interface GameSession {
  id: string;                          // UUID
  user_id: string;                     // FK -> users

  // 시간 상태
  current_year: 1 | 2 | 3;
  current_season: 'spring' | 'summer' | 'autumn' | 'winter';
  current_week: number;               // 1~52 (년도 내)
  total_weeks_elapsed: number;         // 0~156
  game_phase: GamePhase;              // 상태 머신 현재 노드

  // 누적 KPI
  total_revenue: number;              // 총 누적 매출 (코인)
  total_plants_harvested: number;     // 총 수확 횟수
  total_plants_died: number;          // 총 식물 사망 수
  unique_species_collected: string[]; // 수집 완료 종 ID 목록

  // 년도별 KPI 스냅샷
  yearly_snapshots: YearlySnapshot[];

  // 게임 진행 플래그
  tutorial_completed: boolean;
  story_events_seen: string[];        // 본 컷신 ID 목록

  // 타임스탬프
  started_at: Date;
  last_tick_at: Date;                 // 마지막 시뮬레이션 틱
  ended_at: Date | null;
}

type GamePhase =
  | 'tutorial'
  | 'year_1_spring' | 'year_1_summer' | 'year_1_autumn' | 'year_1_winter' | 'year_1_review'
  | 'year_2_spring' | 'year_2_summer' | 'year_2_autumn' | 'year_2_winter' | 'year_2_review'
  | 'year_3_spring' | 'year_3_summer' | 'year_3_autumn' | 'year_3_winter' | 'year_3_review'
  | 'final_evaluation'
  | 'ended';

interface YearlySnapshot {
  year: number;
  revenue: number;                    // 해당 년도 매출
  plants_harvested: number;
  plants_died: number;
  unique_species_count: number;       // 해당 년도 말 수집 종 수
  customer_satisfaction: number;      // 0~100
  garden_beauty_score: number;        // 0~100
  rank: 'S' | 'A' | 'B' | 'C' | 'F';
}
```

### 2.5 시간 진행 메커니즘

기존 `simulationCron.ts`(매시간 실행)를 확장한다.

```
기존: 매 1시간 -> 환경 인자 계산 -> 성장률/건강도 갱신
확장: 매 1시간 -> 기존 시뮬레이션 + 주/계절/년 전환 체크

실시간 24시간(24 tick) = 인게임 1주

매 24 tick마다:
  1. total_weeks_elapsed++
  2. current_week 갱신
  3. 계절 전환 체크 (week % 13 === 0)
  4. 년도 전환 체크 (week === 52)
  5. 계절별 환경 변동 적용
  6. 주간 매출/방문객 정산
```

**기존 코드 수정 최소화 전략**:
- `simulation.service.ts`의 `calculateGrowthRate()`는 변경하지 않음
- 계절 효과는 `SeasonService`에서 환경 값을 **전처리**하여 기존 함수에 전달
- 즉, 기존 함수 입장에서는 이미 계절이 반영된 환경 값을 받는 것

---

## 3. 메인 시나리오: '최고의 보타닉 가든'

### 3.1 시나리오 개요

```
배경:
  폐허가 된 오래된 식물원을 물려받은 플레이어.
  시 정부로부터 3년의 기한을 받았다.
  "3년 후 평가에서 기준을 충족하지 못하면 식물원 부지를 재개발한다."

목표:
  3년 동안 식물원을 복원하고, 다양한 식물을 수집·재배하여
  매출과 방문객 수를 늘리고, 최종 평가에서 최고 등급을 받아라.

핵심 긴장감:
  - 제한된 시간 (3년 = 156 실시간 일)
  - 제한된 자원 (초기 코인 1000, 4개 플롯)
  - 계절에 따른 전략 변화 필요
  - 어떤 식물에 투자할지 선택의 트레이드오프
```

### 3.2 년도별 스토리 아크

#### Year 1: "시작" - 폐허에서 싹을 틔우다

```
테마: 기초 다지기, 생존
분위기: 희망적이지만 불안한

스토리 비트:
  - [봄] 식물원 도착, 폐허 상태 확인. 조수 '하나'를 만남
  - [여름] 첫 수확 성공. 시 정부 담당자 '정 과장' 방문, 1차 경고
  - [가을] 첫 방문객 등장. 소문이 나기 시작
  - [겨울] 겨울 한파 이벤트. 식물 관리의 어려움 실감
  - [년도 리뷰] 1년차 평가 - 생존 여부 판정

게임플레이 포커스:
  - 쉬운 식물(상추, 바질, 민트)로 기본 매출 확보
  - 기본 도구 확보, 플롯 1~2개 추가 해금
  - 시뮬레이션 메커니즘 숙달
```

#### Year 2: "성장" - 명성을 쌓다

```
테마: 확장, 다양화, 도전
분위기: 자신감, 야심

스토리 비트:
  - [봄] 식물원 확장 기회. 새로운 종(medium 난이도) 입하
  - [여름] 경쟁 식물원 '그린파크' 등장. 차별화 필요
  - [가을] 희귀 식물 이벤트. 난초/몬스테라 입수 기회
  - [겨울] 대형 전시회 참가 기회 (보너스 매출 이벤트)
  - [년도 리뷰] 2년차 평가 - 성장 궤도 판정

게임플레이 포커스:
  - medium 난이도 식물(장미, 토마토, 해바라기)로 포트폴리오 다양화
  - 정원 그리드 확장 (6~7개 플롯)
  - 도구 업그레이드 본격화
  - 수집률 확대
```

#### Year 3: "완성" - 최고의 정원

```
테마: 완성, 마스터리, 레거시
분위기: 긴장감, 결전

스토리 비트:
  - [봄] 최종 확장. hard 난이도 식물(난초, 몬스테라) 도전
  - [여름] 전국 식물원 콘테스트 예선 (중간 점수 체크)
  - [가을] 라이벌 '그린파크'와 최종 대결
  - [겨울] 최종 준비 기간. 마지막 기회
  - [년도 리뷰] 최종 평가 -> 엔딩 분기

게임플레이 포커스:
  - hard 난이도 식물로 고수익/고위험 운영
  - 풀 그리드(9개 플롯) 운영
  - 수집률 극대화 (15종 컴플리트 도전)
  - 최적 운영으로 매출/만족도 최대화
```

### 3.3 NPC 캐릭터

| NPC | 역할 | 등장 시기 | 기능 |
|-----|------|----------|------|
| 하나 (조수) | 가이드/튜토리얼 진행 | 전 기간 | 팁 제공, 시스템 설명, 주간 보고 |
| 정 과장 (시 정부) | 평가자/압박 | 년도 리뷰 시 | 목표 통보, 평가 결과 전달 |
| 그린파크 원장 (라이벌) | 경쟁/동기부여 | Year 2~ | 비교 대상, 이벤트 트리거 |
| 방문객들 (다수) | 매출/만족도 소스 | Year 1 가을~ | 랜덤 피드백, 선호 식물 요청 |

### 3.4 이벤트 시스템

```typescript
interface GameEvent {
  id: string;
  type: 'story' | 'seasonal' | 'random' | 'achievement';
  trigger: EventTrigger;
  title_ko: string;
  description_ko: string;
  cutscene_id?: string;           // 연결된 컷신
  choices?: EventChoice[];         // 선택지 (있으면 분기)
  effects: EventEffect[];          // 적용 효과
  conditions: EventCondition[];    // 발생 조건
}

interface EventTrigger {
  type: 'week' | 'season_start' | 'year_review' | 'first_harvest'
      | 'species_count' | 'revenue_milestone' | 'plant_death';
  value: number | string;
}

interface EventChoice {
  id: string;
  text_ko: string;
  effects: EventEffect[];
}

interface EventEffect {
  type: 'coins' | 'growth_bonus' | 'satisfaction_bonus'
      | 'unlock_plant' | 'unlock_plot' | 'story_flag';
  value: number | string;
  duration_weeks?: number;         // 임시 효과의 지속 기간
}
```

---

## 4. 년도별 목표 시스템 메커니즘

### 4.1 3대 핵심 KPI

#### 4.1.1 매출 (Revenue)

```
매출 소스:
  1. 식물 수확 판매 (기존 harvestPlant 보상)
  2. 방문객 입장료 (주간 자동 정산)
  3. 이벤트 보너스 (계절 이벤트, 전시회 등)

방문객 입장료 계산:
  주간_방문객수 = base_visitors × garden_beauty_multiplier × season_multiplier × reputation_multiplier
  주간_입장료_수입 = 주간_방문객수 × ticket_price

  base_visitors:
    Year 1: 10~30명/주
    Year 2: 30~80명/주
    Year 3: 80~200명/주

  garden_beauty_multiplier:
    = 1.0 + (활성_식물수 / 최대_플롯수) × 0.3
    + (다양성_보너스: unique_species / 15) × 0.3
    + (건강도_보너스: avg_health / 100) × 0.2
    + (장식_보너스: decoration_count × 0.05)

  season_multiplier:
    봄: 1.2, 여름: 1.0, 가을: 1.3, 겨울: 0.6

  reputation_multiplier:
    = 1.0 + (customer_satisfaction / 100) × 0.5

  ticket_price: 5 coins/visitor (기본)
```

**기존 코드 연동**: `harvestPlant()` → `EconomyService.addRevenue()` → `GameSession.total_revenue` 누적

#### 4.1.2 수집률 (Collection Rate)

```
수집률 = (수확 완료한 고유 종 수 / 15) × 100%

조건: 해당 종을 최소 1회 성공적으로 수확해야 "수집 완료"
  - 시들어 죽은 식물은 수집에 카운트되지 않음
  - 같은 종을 여러 번 수확해도 1종으로 카운트

기존 코드 연동:
  - harvestPlant() 시 plant_id를 unique_species_collected 에 추가
  - Collection 페이지의 기존 식물 도감 UI 활용
```

#### 4.1.3 고객 만족도 (Customer Satisfaction)

```
고객 만족도는 0~100 점수로, 여러 요인의 가중 평균:

satisfaction =
    (garden_health_avg × 0.25)          // 정원 평균 건강도
  + (species_diversity × 0.25)          // 종 다양성 (unique / 15 × 100)
  + (garden_occupancy × 0.20)           // 정원 가동률 (활성 식물 / 해금 플롯 × 100)
  + (rare_plant_bonus × 0.15)           // 희귀 식물 보너스 (hard 식물 존재 시)
  + (event_participation × 0.15)        // 이벤트 참여도

매주 갱신되며, 주간 리포트에서 확인 가능.

garden_health_avg:
  = 모든 활성 식물의 health 평균값
  - 기존 UserPlant.health (0~100) 직접 활용

species_diversity:
  = (정원에 현재 심겨진 고유 종 수 / 15) × 100

garden_occupancy:
  = (활성 식물 수 / 해금된 플롯 수) × 100
  - 빈 플롯이 많으면 감점

rare_plant_bonus:
  = hard 난이도 식물 수 × 10 (최대 30)
  + medium 난이도 식물 수 × 5 (최대 20)
  - 상한 50

event_participation:
  = (참여한 이벤트 수 / 발생한 이벤트 수) × 100
  - 선택지가 있는 이벤트에서 적극적 선택 시 보너스
```

### 4.2 년도별 목표 기준치

| KPI | Year 1 목표 | Year 2 목표 | Year 3 목표 |
|-----|------------|------------|------------|
| 매출 (coins) | >= 5,000 | >= 25,000 | >= 80,000 |
| 수집률 (%) | >= 20% (3종) | >= 47% (7종) | >= 73% (11종) |
| 고객 만족도 | >= 40 | >= 60 | >= 75 |

### 4.3 주간 리포트 시스템

매 인게임 주(실시간 1일) 종료 시 자동 생성:

```typescript
interface WeeklyReport {
  year: number;
  week: number;
  season: string;

  // 이번 주 실적
  revenue_this_week: number;
  visitors_this_week: number;
  plants_harvested_this_week: number;
  plants_died_this_week: number;

  // 누적 실적 (년도 내)
  revenue_ytd: number;              // Year-to-Date 매출
  collection_rate: number;          // 현재 수집률
  satisfaction_score: number;       // 현재 만족도

  // 목표 대비 진척률
  revenue_vs_target: number;        // % (현재 매출 / 년도 목표)
  collection_vs_target: number;     // %
  satisfaction_vs_target: number;   // %

  // 하나의 코멘트
  advisor_comment: string;          // NPC 하나의 조언

  // 알림
  alerts: string[];                 // "겨울이 다가옵니다!", "장미가 시들고 있습니다" 등
}
```

### 4.4 년도 리뷰 (Year-End Review)

각 년도 종료 시(Week 52) 발생하는 특별 이벤트:

```
1. 게임 일시 정지
2. 년도 리뷰 컷신 재생 (정 과장 등장)
3. KPI 요약 화면 표시
4. 년도 등급 산출 (S/A/B/C/F 기준 적용)
5. 다음 년도 목표 통보
6. 보너스 보상 지급 (등급에 따라)
7. 게임 재개

년도 리뷰 보상:
  S등급: 3000 coins + 희귀 식물 1종 해금 + "명예 정원사" 칭호
  A등급: 2000 coins + 플롯 1개 무료 해금
  B등급: 1000 coins
  C등급: 500 coins + 경고 메시지
  F등급: 0 coins + "폐쇄 경고" 컷신 (3년차 F는 BAD END)
```

---

## 5. S/A/B/C/F 랭크 엔딩 분기 조건

### 5.1 최종 평가 점수 산출

3년차 리뷰 후, 최종 평가 점수를 계산한다.

```
final_score = (revenue_score × 0.35) + (collection_score × 0.30)
            + (satisfaction_score × 0.25) + (bonus_score × 0.10)

revenue_score (0~100):
  = min(100, (total_3year_revenue / 110000) × 100)
  // 3년 합산 목표: 110,000 coins (5000 + 25000 + 80000)

collection_score (0~100):
  = (unique_species_collected / 15) × 100
  // 15종 전부 수집 시 100점

satisfaction_score (0~100):
  = 3년간 customer_satisfaction 주간 평균
  // 매주 기록된 만족도의 전체 평균

bonus_score (0~100):
  = 보너스 요인 합산 (아래 참조)
```

### 5.2 보너스 점수 상세

| 보너스 항목 | 점수 | 조건 |
|------------|------|------|
| 무사망 보너스 | +15 | 3년간 식물 사망 0회 |
| 올시즌 운영 | +10 | 겨울에도 최소 2개 식물 활성 유지 |
| 속도 보너스 | +10 | Year 2 종료 시점에 이미 수집률 60% 이상 |
| 경제 달인 | +10 | 코인 파산(0원) 경험 0회 |
| 다양성 마스터 | +10 | 5개 카테고리 각 1종 이상 수확 |
| 이벤트 마스터 | +10 | 모든 스토리 이벤트 참여 |
| 완벽한 수확 | +15 | 수확 시 optimal_days_count / total_days >= 0.7 비율이 80% 이상 |
| 라이벌 승리 | +20 | Year 3 가을 '그린파크 대결'에서 승리 |

bonus_score = min(100, 합산)

### 5.3 랭크 분기 테이블

| 랭크 | final_score | 엔딩 이름 | 조건 |
|------|------------|----------|------|
| **S** | >= 90 | "전설의 보타닉 가든" | final_score 90+ AND 수집률 >= 93% (14종+) |
| **A** | >= 75 | "시의 자랑, 명품 정원" | final_score 75~89 |
| **B** | >= 55 | "안정적인 식물원" | final_score 55~74 |
| **C** | >= 35 | "소박한 정원" | final_score 35~54 |
| **F** | < 35 | "문 닫힌 식물원" | final_score 35 미만 |

### 5.4 특수 엔딩 조건

일반 점수 계산과 별도로, 특정 조건 충족 시 변형 엔딩:

| 특수 엔딩 | 조건 | 우선순위 |
|----------|------|---------|
| **True Ending (S+)** | S등급 + 15종 전부 수집 + 무사망 + 라이벌 승리 | 최우선 |
| **Speedrun Ending** | Year 2 종료 시 이미 S등급 조건 충족 | S등급보다 우선 |
| **Collector Ending** | 15종 전부 수집했으나 매출 기준 미달 (B/C등급) | 해당 등급에 변형 적용 |
| **Merchant Ending** | 매출 150,000+ 달성했으나 수집률 40% 미만 | 해당 등급에 변형 적용 |

### 5.5 엔딩 화면 구성

```
[엔딩 화면 레이아웃]

┌──────────────────────────────────────────────┐
│                                              │
│        [엔딩 일러스트 / 컷신]                  │
│    (랭크별 다른 이미지: 번성하는 정원 ~ 폐허)     │
│                                              │
├──────────────────────────────────────────────┤
│                                              │
│   랭크: ★★★ S RANK ★★★                       │
│   "전설의 보타닉 가든"                          │
│                                              │
│   ┌──────────┬──────────┬──────────┐         │
│   │  매출     │  수집률   │  만족도   │         │
│   │ 125,000  │  93%     │  88      │         │
│   │  ★★★★★  │  ★★★★★  │  ★★★★☆  │         │
│   └──────────┴──────────┴──────────┘         │
│                                              │
│   3년간의 기록:                                │
│   - 총 수확: 47회                              │
│   - 사망한 식물: 2그루                          │
│   - 최장 연속 운영: 38주                        │
│   - 획득 보너스: 6/8개                          │
│                                              │
│   [엔딩 스토리 텍스트...]                       │
│                                              │
│   [ 크레딧 보기 ]  [ 새 게임+ ]  [ 타이틀 ]     │
│                                              │
└──────────────────────────────────────────────┘
```

---

## 6. 튜토리얼 시나리오 구조

### 6.1 튜토리얼 개요

```
대상: 최초 게임 시작 시 자동 진행
소요 시간: 실시간 약 10~15분 (가속 시뮬레이션)
목적: 핵심 메커니즘 5가지 학습
스킵: 2회차 이상 플레이 시 스킵 가능 (NEW GAME+)
```

### 6.2 튜토리얼 단계

#### Phase T-1: "첫 만남" (약 2분)

```
트리거: 새 게임 시작
NPC: 하나 (조수)

내용:
  1. 식물원 도착 컷신 (배경 스토리 전달)
  2. 하나 자기소개
  3. 정원 그리드 UI 설명
     - "여기가 우리 정원이에요. 아직 4칸만 사용할 수 있어요."
     - 그리드 하이라이트 + 툴팁
  4. 주간/계절/년도 시스템 간략 설명
     - "우리에게 3년의 시간이 있어요. 잘 활용해야 해요!"
```

#### Phase T-2: "첫 심기" (약 3분)

```
트리거: T-1 완료
NPC: 하나

내용:
  1. 씨앗 선택 강제 가이드
     - "먼저 상추를 심어볼까요? 초보자에게 딱이에요."
     - 상점에서 상추 씨앗 구매 (무료 제공, 1회)
  2. 플롯에 심기
     - 빈 플롯 클릭 -> 식물 선택 -> 심기 애니메이션
  3. 환경 조절 설명
     - 온도, 습도, 광량, 수분 슬라이더 조작
     - "상추는 서늘한 환경을 좋아해요. 15~20도가 적합해요."
  4. 물주기 설명
     - 물주기 버튼 + 물탱크 게이지 확인

[강제 행동]: 상추 1포기 심기 + 물 1회 주기 완료해야 다음 단계
```

#### Phase T-3: "성장 관찰" (약 3분)

```
트리거: T-2 완료 + 인게임 시간 가속 (1주 시뮬레이션을 30초로 압축)
NPC: 하나

내용:
  1. 시간 가속 모드로 1주 경과
     - 상추가 seed -> sprout 으로 성장하는 과정 시연
  2. 성장 진행도 바 설명
  3. 건강도 게이지 설명
     - "건강도가 떨어지면 식물이 시들어요. 환경을 잘 맞춰주세요!"
  4. 추가 2주 가속 -> seedling 단계 도달

[시뮬레이션 가속]: 튜토리얼 한정, 1주를 30초로 압축
```

#### Phase T-4: "첫 수확" (약 3분)

```
트리거: T-3 완료 + 상추가 harvestable 상태 도달 (추가 가속)
NPC: 하나

내용:
  1. 시간 가속으로 상추 수확 가능 상태까지 진행
  2. 수확 버튼 안내
  3. 수확 실행 -> 보상 화면
     - "축하해요! 첫 수확이에요! 코인 100개를 받았어요."
  4. 수집 도감 확인
     - Collection 페이지 안내
     - "도감을 채울수록 정원 평가가 올라가요!"

[강제 행동]: 수확 완료
```

#### Phase T-5: "목표 확인" (약 2분)

```
트리거: T-4 완료
NPC: 하나 + 정 과장 (첫 등장)

내용:
  1. 정 과장 등장 컷신
     - "이 정원의 미래는 당신에게 달려있소. 1년 후에 다시 오겠소."
  2. 년도 목표 화면 표시
     - Year 1 목표: 매출 5000, 수집률 20%, 만족도 40
  3. 주간 리포트 시스템 안내
  4. 상점/도구 시스템 간략 소개
  5. "이제 본격적으로 시작이에요! 행운을 빌어요!" -> 튜토리얼 종료

[튜토리얼 종료 보상]:
  - 상추 씨앗 ×3, 바질 씨앗 ×2 (무료)
  - 초보 정원사 칭호
  - tutorial_completed = true
```

### 6.3 튜토리얼 스킵 처리

```typescript
// NEW GAME+ 시 튜토리얼 스킵 옵션
if (user.has_completed_game_before) {
  showDialog({
    text: "이전 플레이 경험이 있으시네요. 튜토리얼을 건너뛸까요?",
    choices: [
      { text: "튜토리얼 진행", action: () => startTutorial() },
      { text: "바로 시작", action: () => skipTutorial() }
    ]
  });
}

function skipTutorial() {
  // 튜토리얼 보상은 동일하게 지급
  grantTutorialRewards();
  session.tutorial_completed = true;
  session.game_phase = 'year_1_spring';
}
```

---

## 7. 스토리 컷신 및 엔딩 크레딧 통합

### 7.1 컷신 시스템 아키텍처

#### 7.1.1 컷신 데이터 구조

```typescript
interface Cutscene {
  id: string;                         // e.g., "year1_spring_intro"
  type: 'story' | 'review' | 'ending' | 'tutorial';

  // 컨텐츠
  scenes: CutsceneScene[];

  // 메타
  skippable: boolean;                 // 엔딩은 스킵 불가, 나머지는 가능
  seen_flag: string;                  // story_events_seen 에 기록할 ID
  duration_estimate_seconds: number;
}

interface CutsceneScene {
  id: string;
  background: string;                 // 배경 이미지 키 (e.g., "garden_spring")
  characters: CharacterPosition[];    // 등장 캐릭터 배치
  dialogues: Dialogue[];              // 대화 시퀀스
  effects?: SceneEffect[];            // 화면 효과 (페이드, 쉐이크 등)
}

interface CharacterPosition {
  character_id: string;               // "hana", "jung", "rival"
  position: 'left' | 'center' | 'right';
  expression: string;                 // "happy", "worried", "serious"
  sprite_key: string;                 // 캐릭터 스프라이트 키
}

interface Dialogue {
  speaker: string;                    // 캐릭터 이름 또는 "narrator"
  text_ko: string;
  text_en?: string;                   // 향후 i18n
  choices?: DialogueChoice[];         // 선택지 (있을 경우)
  auto_advance_ms?: number;           // 자동 진행 (나레이션용)
}

interface DialogueChoice {
  text_ko: string;
  next_scene_id?: string;             // 분기 시
  effects?: EventEffect[];
}

interface SceneEffect {
  type: 'fade_in' | 'fade_out' | 'shake' | 'flash' | 'weather';
  params: Record<string, any>;
}
```

#### 7.1.2 컷신 인벤토리

| ID | 타입 | 시기 | 주요 내용 | 스킵 |
|----|------|------|----------|------|
| `tutorial_intro` | tutorial | 게임 시작 | 식물원 도착, 하나 만남 | X (첫회) |
| `tutorial_harvest` | tutorial | 첫 수확 | 수확 축하, 도감 소개 | X (첫회) |
| `tutorial_goal` | tutorial | 튜토리얼 끝 | 정 과장 등장, 목표 통보 | X (첫회) |
| `y1_summer_warning` | story | Y1 여름 | 정 과장 1차 방문 | O |
| `y1_autumn_visitors` | story | Y1 가을 | 첫 방문객 도착 | O |
| `y1_winter_frost` | story | Y1 겨울 | 한파 이벤트 경고 | O |
| `y1_review` | review | Y1 52주 | 1년차 평가 결과 | X |
| `y2_spring_expand` | story | Y2 봄 | 확장 기회 | O |
| `y2_summer_rival` | story | Y2 여름 | 그린파크 등장 | O |
| `y2_autumn_rare` | story | Y2 가을 | 희귀 식물 이벤트 | O |
| `y2_winter_expo` | story | Y2 겨울 | 전시회 참가 | O |
| `y2_review` | review | Y2 52주 | 2년차 평가 결과 | X |
| `y3_summer_contest` | story | Y3 여름 | 콘테스트 예선 | O |
| `y3_autumn_rival_battle` | story | Y3 가을 | 라이벌 최종 대결 | O |
| `y3_review` | review | Y3 52주 | 최종 평가 | X |
| `ending_s_plus` | ending | 최종 | True Ending | X |
| `ending_s` | ending | 최종 | S랭크 엔딩 | X |
| `ending_a` | ending | 최종 | A랭크 엔딩 | X |
| `ending_b` | ending | 최종 | B랭크 엔딩 | X |
| `ending_c` | ending | 최종 | C랭크 엔딩 | X |
| `ending_f` | ending | 최종 | F랭크 엔딩 | X |

### 7.2 컷신 렌더링 엔진 (프론트엔드)

```
컷신 렌더링은 기존 React 위에 오버레이 모달로 구현한다.
PixiJS 마이그레이션(PIXI_MIGRATION_PLAN.md) 전에는 CSS 기반 연출을 사용한다.

[CutsceneOverlay]
  ├── [BackgroundLayer]    // 배경 이미지 (CSS background-image + transition)
  ├── [CharacterLayer]     // 캐릭터 스프라이트 (CSS positioned images + animation)
  ├── [DialogueBox]        // 하단 대화 상자 (텍스트 타이핑 효과)
  │     ├── [SpeakerName]
  │     ├── [DialogueText] // 한 글자씩 표시 (typewriter effect)
  │     └── [ChoiceList]   // 선택지 (있을 경우)
  ├── [EffectsLayer]       // 화면 효과 (CSS filter, animation)
  └── [SkipButton]         // 우측 상단 스킵 버튼 (skippable일 때만)
```

### 7.3 엔딩 크레딧 시스템

```
[엔딩 플로우]

  [최종 평가 화면]
    → [엔딩 컷신 (랭크별)]
    → [성적표 화면 (KPI 상세)]
    → [크레딧 롤]
    → [후일담 텍스트]
    → [선택: NEW GAME+ / 타이틀]

[크레딧 롤 구성]

  1. 엔딩 테마 BGM 시작
  2. "3년간의 기록" - 통계 요약 스크롤
     - 총 수확 횟수, 가장 많이 키운 식물, 최장 생존 식물 등
  3. "나의 정원" - 최종 정원 상태 스크린샷 (또는 렌더링)
  4. "수집한 식물들" - 수집 완료 식물 갤러리 스크롤
  5. 제작진 크레딧
  6. "Thank you for playing!"
  7. 후일담 텍스트 (랭크별)
     - S: "식물원은 전국적 명소가 되었고..."
     - F: "텅 빈 정원에 마지막 바람이 불어왔다..."
```

### 7.4 크레딧 데이터 구조

```typescript
interface EndingCredits {
  // 플레이 통계
  play_stats: {
    total_play_days: number;           // 실제 플레이 일수
    total_harvests: number;
    total_deaths: number;
    most_grown_plant: string;          // 가장 많이 수확한 종
    longest_surviving_plant: {         // 최장 생존 식물
      plant_name: string;
      days_survived: number;
    };
    total_water_given: number;
    total_coins_earned: number;
    total_coins_spent: number;
  };

  // 수집 갤러리
  collected_plants: {
    plant_id: string;
    name_ko: string;
    first_harvest_date: string;        // 인게임 날짜
    total_harvests: number;
    best_health_at_harvest: number;
  }[];

  // 후일담
  epilogue_text: string;
}
```

---

## 8. 기술 구현 경로

### 8.1 아키텍처 변경 개요

```
[기존 아키텍처]

  Client (React) <-> API (Express) <-> DB (PostgreSQL)
                                    <-> SimulationCron (1hr)

[확장 아키텍처]

  Client (React)
    ├── CutsceneEngine (신규)          // 컷신 렌더링
    ├── GameSessionStore (신규)        // Zustand - 게임 세션 상태
    ├── WeeklyReportView (신규)        // 주간 리포트 UI
    ├── YearReviewView (신규)          // 년도 리뷰 UI
    ├── EndingView (신규)              // 엔딩 화면
    └── 기존 컴포넌트들 (유지)

  API (Express)
    ├── gameSession.routes.ts (신규)   // 게임 세션 CRUD
    ├── scenario.routes.ts (신규)      // 이벤트/컷신 트리거
    ├── report.routes.ts (신규)        // 주간/년도 리포트
    └── 기존 라우트들 (유지)

  Services
    ├── GameSessionService (신규)      // 게임 세션 관리
    ├── SeasonService (신규)           // 계절 효과 계산
    ├── ScenarioService (신규)         // 이벤트/스토리 관리
    ├── ScoreService (신규)            // KPI/랭크 계산
    ├── ReportService (신규)           // 리포트 생성
    └── SimulationService (기존, 확장)  // 계절 효과 통합

  Cron Jobs
    ├── simulationCron.ts (기존, 확장)  // + 주간/계절/년도 전환
    └── weeklyReportCron.ts (신규)      // 주간 리포트 생성
```

### 8.2 백엔드 신규 서비스 상세

#### 8.2.1 GameSessionService

```typescript
// backend/src/services/gameSession.service.ts

class GameSessionService {
  // 새 게임 세션 생성
  async createSession(userId: string): Promise<GameSession>;

  // 현재 활성 세션 조회
  async getActiveSession(userId: string): Promise<GameSession | null>;

  // 시간 진행 (simulationCron에서 호출)
  async advanceTime(sessionId: string): Promise<TimeAdvanceResult>;

  // 계절 전환 처리
  async handleSeasonTransition(sessionId: string, newSeason: string): Promise<void>;

  // 년도 전환 처리
  async handleYearTransition(sessionId: string): Promise<YearlySnapshot>;

  // 최종 평가
  async calculateFinalScore(sessionId: string): Promise<FinalEvaluation>;

  // 게임 종료
  async endGame(sessionId: string, rank: string): Promise<EndingCredits>;
}
```

#### 8.2.2 SeasonService

```typescript
// backend/src/services/season.service.ts

class SeasonService {
  // 계절에 따른 환경 수정자 반환
  getSeasonModifiers(season: string): SeasonModifiers;

  // 기존 환경 값에 계절 효과 적용 (전처리)
  applySeasonToEnvironment(
    environment: PlantEnvironment,
    season: string
  ): PlantEnvironment;

  // 계절별 이벤트 체크
  getSeasonEvents(year: number, season: string): GameEvent[];
}

interface SeasonModifiers {
  temperature_offset: number;      // 기온 변동 (C)
  light_multiplier: number;        // 광량 배율
  humidity_offset: number;         // 습도 변동 (%)
  evaporation_multiplier: number;  // 수분 증발 배율
  growth_multiplier: number;       // 성장률 배율 (겨울 감소 등)
  harvest_bonus: number;           // 수확 보상 배율
  visitor_multiplier: number;      // 방문객 수 배율
}
```

#### 8.2.3 ScenarioService

```typescript
// backend/src/services/scenario.service.ts

class ScenarioService {
  // 현재 상태에서 트리거될 이벤트 확인
  async checkEventTriggers(session: GameSession): Promise<GameEvent[]>;

  // 이벤트 선택지 처리
  async processEventChoice(
    sessionId: string,
    eventId: string,
    choiceId: string
  ): Promise<EventEffect[]>;

  // 컷신 데이터 조회
  getCutsceneData(cutsceneId: string): Cutscene;

  // 스토리 플래그 설정
  async setStoryFlag(sessionId: string, flag: string): Promise<void>;
}
```

#### 8.2.4 ScoreService

```typescript
// backend/src/services/score.service.ts

class ScoreService {
  // 주간 KPI 계산
  async calculateWeeklyKPI(session: GameSession): Promise<WeeklyKPI>;

  // 년도 등급 산출
  async calculateYearRank(snapshot: YearlySnapshot, year: number): Promise<string>;

  // 최종 점수 산출
  async calculateFinalScore(session: GameSession): Promise<FinalScore>;

  // 랭크 판정
  determineRank(finalScore: number, session: GameSession): RankResult;

  // 보너스 점수 계산
  calculateBonusScore(session: GameSession): BonusBreakdown;

  // 고객 만족도 계산
  async calculateSatisfaction(userId: string, session: GameSession): Promise<number>;

  // 방문객 수 계산
  calculateVisitors(session: GameSession, gardenState: GardenState): number;
}
```

### 8.3 기존 코드 수정 사항

#### 8.3.1 simulationCron.ts 확장

```typescript
// 기존: 매시간 모든 활성 식물 시뮬레이션
// 확장: 시뮬레이션 + 게임 세션 시간 진행

// 추가되는 로직 (기존 로직 뒤에):
async function onHourlyTick() {
  // ... 기존 식물 시뮬레이션 (변경 없음) ...

  // [신규] 게임 세션 시간 진행
  const activeSessions = await GameSessionModel.findAllActive();
  for (const session of activeSessions) {
    session.tick_count++;

    // 24틱 = 1 인게임 주
    if (session.tick_count % 24 === 0) {
      await gameSessionService.advanceTime(session.id);
    }

    await GameSessionModel.update(session.id, { tick_count: session.tick_count });
  }
}
```

#### 8.3.2 simulation.service.ts 수정 최소화

```typescript
// 변경하지 않는 것:
//   - calculateGrowthRate() 시그니처와 내부 로직 유지
//   - calculateHealthChange() 유지
//   - calculateSoilMoisture() 유지

// 변경하는 것:
//   - simulateHour()에서 환경 값을 SeasonService로 전처리한 후 전달

async simulateHour(userPlant: UserPlant, plant: Plant): Promise<SimulationResult> {
  // [신규] 세션에서 현재 계절 조회
  const session = await GameSessionService.getActiveSessionByUser(userPlant.user_id);
  const season = session?.current_season || 'spring';

  // [신규] 계절 효과 적용 (환경 전처리)
  const seasonModifiers = SeasonService.getSeasonModifiers(season);
  const adjustedEnvironment = {
    temperature: (userPlant.temperature || 20) + seasonModifiers.temperature_offset,
    humidity: (userPlant.humidity || 60) + seasonModifiers.humidity_offset,
    light_dli: (userPlant.light_dli || 14) * seasonModifiers.light_multiplier,
    soil_moisture: userPlant.soil_moisture || 60
  };

  // [기존] 기존 계산 로직 그대로 (입력값만 달라짐)
  const growthRate = this.calculateGrowthRate(
    adjustedEnvironment,
    plant.environment,
    1.0 * seasonModifiers.growth_multiplier  // 기본 성장률에 계절 배율 적용
  );

  // ... 나머지 기존 로직 동일 ...
}
```

#### 8.3.3 harvestPlant() 확장

```typescript
// userPlant.service.ts - harvestPlant 확장

async harvestPlant(userPlantId: string, userId: string): Promise<HarvestResult> {
  // ... 기존 수확 로직 (코인/경험치 보상) ...

  // [신규] 게임 세션에 수확 기록
  const session = await GameSessionService.getActiveSession(userId);
  if (session) {
    // 계절 보너스 적용
    const seasonBonus = SeasonService.getSeasonModifiers(session.current_season).harvest_bonus;
    const adjustedCoins = Math.floor(baseCoins * (1 + seasonBonus));

    // 세션 KPI 업데이트
    await GameSessionService.recordHarvest(session.id, {
      plant_id: plant.id,
      coins_earned: adjustedCoins,
      week: session.current_week
    });

    // 수집률 업데이트
    if (!session.unique_species_collected.includes(plant.id)) {
      session.unique_species_collected.push(plant.id);
      await GameSessionService.updateCollection(session.id, session.unique_species_collected);
    }
  }

  return { ...result, coins: adjustedCoins };
}
```

---

## 9. 데이터베이스 스키마

### 9.1 신규 테이블

```sql
-- ============================================
-- Migration: XX_game_session_system.sql
-- 게임 세션 및 시나리오 시스템
-- ============================================

-- 1. 게임 세션 (메인 진행 상태)
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 시간 상태
    current_year INTEGER NOT NULL DEFAULT 1 CHECK (current_year BETWEEN 1 AND 3),
    current_season VARCHAR(10) NOT NULL DEFAULT 'spring'
        CHECK (current_season IN ('spring', 'summer', 'autumn', 'winter')),
    current_week INTEGER NOT NULL DEFAULT 1 CHECK (current_week BETWEEN 1 AND 52),
    total_weeks_elapsed INTEGER NOT NULL DEFAULT 0 CHECK (total_weeks_elapsed BETWEEN 0 AND 156),
    tick_count INTEGER NOT NULL DEFAULT 0,
    game_phase VARCHAR(30) NOT NULL DEFAULT 'tutorial',

    -- 누적 KPI
    total_revenue INTEGER NOT NULL DEFAULT 0,
    total_plants_harvested INTEGER NOT NULL DEFAULT 0,
    total_plants_died INTEGER NOT NULL DEFAULT 0,
    unique_species_collected TEXT[] DEFAULT '{}',

    -- 진행 플래그
    tutorial_completed BOOLEAN DEFAULT FALSE,
    story_events_seen TEXT[] DEFAULT '{}',

    -- 상태
    is_active BOOLEAN DEFAULT TRUE,
    final_rank VARCHAR(5),
    final_score DECIMAL(5,2),

    -- 타임스탬프
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_tick_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,

    -- 제약: 사용자당 활성 세션 1개
    CONSTRAINT one_active_session UNIQUE (user_id) WHERE (is_active = true)
);

CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_active ON game_sessions(is_active) WHERE is_active = true;

-- 2. 년도별 스냅샷
CREATE TABLE yearly_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 3),

    -- KPI
    revenue INTEGER NOT NULL DEFAULT 0,
    plants_harvested INTEGER NOT NULL DEFAULT 0,
    plants_died INTEGER NOT NULL DEFAULT 0,
    unique_species_count INTEGER NOT NULL DEFAULT 0,
    customer_satisfaction DECIMAL(5,2) NOT NULL DEFAULT 0,
    garden_beauty_score DECIMAL(5,2) NOT NULL DEFAULT 0,

    -- 등급
    rank VARCHAR(2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_year_per_session UNIQUE(session_id, year)
);

-- 3. 주간 리포트
CREATE TABLE weekly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    week INTEGER NOT NULL,
    season VARCHAR(10) NOT NULL,

    -- 주간 실적
    revenue_this_week INTEGER NOT NULL DEFAULT 0,
    visitors_this_week INTEGER NOT NULL DEFAULT 0,
    plants_harvested INTEGER NOT NULL DEFAULT 0,
    plants_died INTEGER NOT NULL DEFAULT 0,

    -- 누적 (YTD)
    revenue_ytd INTEGER NOT NULL DEFAULT 0,
    collection_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    satisfaction_score DECIMAL(5,2) NOT NULL DEFAULT 0,

    -- 목표 대비
    revenue_vs_target DECIMAL(5,2) NOT NULL DEFAULT 0,
    collection_vs_target DECIMAL(5,2) NOT NULL DEFAULT 0,
    satisfaction_vs_target DECIMAL(5,2) NOT NULL DEFAULT 0,

    -- 코멘트
    advisor_comment TEXT,
    alerts TEXT[] DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_week_per_session UNIQUE(session_id, year, week)
);

CREATE INDEX idx_weekly_reports_session ON weekly_reports(session_id);

-- 4. 게임 이벤트 로그
CREATE TABLE game_event_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    event_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(30) NOT NULL,

    -- 발생 시점
    year INTEGER NOT NULL,
    week INTEGER NOT NULL,
    season VARCHAR(10) NOT NULL,

    -- 선택지 (있을 경우)
    choice_id VARCHAR(100),

    -- 효과
    effects_applied JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_logs_session ON game_event_logs(session_id);

-- 5. 수확 기록 (세션 기준)
CREATE TABLE session_harvest_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_plant_id UUID REFERENCES user_plants(id) ON DELETE SET NULL,
    plant_id VARCHAR(50) NOT NULL,

    -- 수확 시점
    year INTEGER NOT NULL,
    week INTEGER NOT NULL,
    season VARCHAR(10) NOT NULL,

    -- 보상
    coins_earned INTEGER NOT NULL,
    experience_earned INTEGER NOT NULL,
    optimal_ratio DECIMAL(5,2),       -- optimal_days / total_days
    health_at_harvest DECIMAL(5,2),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_harvest_logs_session ON session_harvest_logs(session_id);
CREATE INDEX idx_harvest_logs_plant ON session_harvest_logs(plant_id);
```

### 9.2 컷신/이벤트 정적 데이터

컷신과 이벤트 데이터는 DB가 아닌 **JSON 파일**로 관리한다. 이유:
- 자주 변경되지 않는 정적 콘텐츠
- 버전 관리(Git) 용이
- 서버 시작 시 메모리에 로드

```
backend/src/data/
  ├── cutscenes/
  │     ├── tutorial.json
  │     ├── year1_events.json
  │     ├── year2_events.json
  │     ├── year3_events.json
  │     └── endings.json
  ├── events/
  │     ├── story_events.json
  │     ├── seasonal_events.json
  │     └── random_events.json
  └── config/
        ├── season_config.json
        ├── score_config.json
        └── year_targets.json
```

---

## 10. API 설계

### 10.1 게임 세션 API

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/game/sessions | 새 게임 시작 (세션 생성) |
| GET | /api/v1/game/sessions/active | 현재 활성 세션 조회 |
| GET | /api/v1/game/sessions/:id | 세션 상세 조회 |
| POST | /api/v1/game/sessions/:id/skip-tutorial | 튜토리얼 스킵 |
| GET | /api/v1/game/sessions/:id/status | 현재 시간/계절/KPI 요약 |

### 10.2 리포트 API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/game/reports/weekly | 최근 주간 리포트 |
| GET | /api/v1/game/reports/weekly/:year/:week | 특정 주차 리포트 |
| GET | /api/v1/game/reports/yearly/:year | 년도 리뷰 결과 |
| GET | /api/v1/game/reports/final | 최종 평가 결과 |

### 10.3 이벤트/시나리오 API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/game/events/pending | 현재 처리할 이벤트 목록 |
| POST | /api/v1/game/events/:eventId/respond | 이벤트 선택지 응답 |
| GET | /api/v1/game/cutscenes/:id | 컷신 데이터 조회 |
| POST | /api/v1/game/cutscenes/:id/seen | 컷신 시청 완료 기록 |

### 10.4 엔딩 API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/v1/game/ending | 엔딩 데이터 (랭크, 점수, 통계) |
| GET | /api/v1/game/credits | 크레딧 데이터 (플레이 통계, 수집 갤러리) |
| POST | /api/v1/game/new-game-plus | NEW GAME+ 시작 |

---

## 11. 프론트엔드 아키텍처

### 11.1 신규 페이지/컴포넌트

```
frontend/src/
  ├── pages/
  │     ├── GameStart.tsx          // 새 게임 / 이어하기 선택
  │     ├── Garden.tsx             // 메인 정원 (기존 Dashboard 대체)
  │     ├── WeeklyReport.tsx       // 주간 리포트 화면
  │     ├── YearReview.tsx         // 년도 리뷰 화면
  │     ├── FinalEvaluation.tsx    // 최종 평가 화면
  │     ├── Ending.tsx             // 엔딩 화면 (랭크별)
  │     └── Credits.tsx            // 크레딧 롤
  │
  ├── components/
  │     ├── cutscene/
  │     │     ├── CutsceneOverlay.tsx    // 컷신 오버레이 컨테이너
  │     │     ├── BackgroundLayer.tsx     // 배경 이미지
  │     │     ├── CharacterLayer.tsx      // 캐릭터 스프라이트
  │     │     ├── DialogueBox.tsx         // 대화 상자
  │     │     ├── ChoiceList.tsx          // 선택지 UI
  │     │     └── TypewriterText.tsx      // 타이핑 효과 텍스트
  │     │
  │     ├── hud/
  │     │     ├── GameHUD.tsx            // 인게임 HUD (년도/계절/주차 표시)
  │     │     ├── KPIBar.tsx             // KPI 진행도 바 (매출/수집/만족도)
  │     │     ├── SeasonIndicator.tsx     // 현재 계절 표시
  │     │     └── WeekCounter.tsx        // 주차 카운터
  │     │
  │     ├── report/
  │     │     ├── WeeklyReportCard.tsx   // 주간 리포트 카드
  │     │     ├── YearReviewPanel.tsx    // 년도 리뷰 패널
  │     │     ├── KPIChart.tsx           // KPI 추이 차트
  │     │     └── RankBadge.tsx          // 등급 배지
  │     │
  │     └── ending/
  │           ├── EndingIllustration.tsx  // 엔딩 일러스트
  │           ├── ScoreBoard.tsx         // 최종 성적표
  │           ├── StatsSummary.tsx       // 플레이 통계 요약
  │           ├── PlantGallery.tsx       // 수집 식물 갤러리
  │           └── CreditsRoll.tsx        // 크레딧 스크롤
  │
  ├── stores/
  │     ├── gameSessionStore.ts          // Zustand - 게임 세션 상태
  │     ├── cutsceneStore.ts             // Zustand - 컷신 상태
  │     └── reportStore.ts              // Zustand - 리포트 캐시
  │
  ├── hooks/
  │     ├── useGameSession.ts           // 게임 세션 커스텀 훅
  │     ├── useCutscene.ts              // 컷신 재생 훅
  │     ├── useSeasonEffect.ts          // 계절 UI 효과 훅
  │     └── useWeeklyReport.ts          // 주간 리포트 훅
  │
  └── data/
        ├── cutscenes/                   // 컷신 JSON (프론트 캐시)
        └── npc/                         // NPC 스프라이트/표정 매핑
```

### 11.2 라우팅 변경

```typescript
// App.tsx - 라우팅 업데이트

<Routes>
  {/* 공개 라우트 */}
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />

  {/* 인증 필요 라우트 */}
  <Route element={<PrivateRoute />}>
    <Route path="/" element={<GameStart />} />           {/* 신규: 게임 시작/이어하기 */}
    <Route path="/garden" element={<Garden />} />         {/* Dashboard 대체 */}
    <Route path="/collection" element={<Collection />} /> {/* 유지 */}
    <Route path="/profile" element={<Profile />} />       {/* 유지 */}
    <Route path="/report" element={<WeeklyReport />} />   {/* 신규 */}
    <Route path="/review/:year" element={<YearReview />} /> {/* 신규 */}
    <Route path="/ending" element={<Ending />} />         {/* 신규 */}
    <Route path="/credits" element={<Credits />} />       {/* 신규 */}
  </Route>

  <Route path="*" element={<Navigate to="/" />} />
</Routes>
```

### 11.3 게임 세션 상태 관리 (Zustand)

```typescript
// stores/gameSessionStore.ts

import { create } from 'zustand';

interface GameSessionState {
  // 세션 데이터
  session: GameSession | null;
  isLoading: boolean;

  // 시간 표시
  currentYear: number;
  currentSeason: string;
  currentWeek: number;

  // KPI 캐시
  revenueYTD: number;
  collectionRate: number;
  satisfactionScore: number;

  // 이벤트 큐
  pendingEvents: GameEvent[];
  activeCutscene: string | null;

  // 액션
  loadSession: () => Promise<void>;
  refreshKPI: () => Promise<void>;
  checkPendingEvents: () => Promise<void>;
  triggerCutscene: (cutsceneId: string) => void;
  dismissCutscene: () => void;
}
```

---

## 12. 구현 로드맵

### 12.1 Phase 순서 (Phase 2 경제 시스템 이후 진행)

```
Phase 2: Garden/Economy (기존 계획 - 선행 필요)
  └── Phase 3: Scenario/Year System (본 문서)
        ├── Sprint 3.1: Core Session & Season (2주)
        ├── Sprint 3.2: KPI & Reports (2주)
        ├── Sprint 3.3: Tutorial & Story Events (2주)
        ├── Sprint 3.4: Ending & Credits (2주)
        └── Sprint 3.5: Polish & Balance (1주)
```

### 12.2 Sprint 상세

#### Sprint 3.1: Core Session & Season (2주)

```
Backend:
  - [ ] game_sessions, yearly_snapshots 테이블 마이그레이션
  - [ ] GameSessionService 구현 (생성, 조회, 시간 진행)
  - [ ] SeasonService 구현 (계절 효과 계산)
  - [ ] simulationCron.ts 확장 (주/계절/년 전환)
  - [ ] gameSession.routes.ts, gameSession.controller.ts
  - [ ] season_config.json 작성

Frontend:
  - [ ] gameSessionStore.ts (Zustand)
  - [ ] GameStart.tsx 페이지
  - [ ] GameHUD.tsx (년도/계절/주차 표시)
  - [ ] SeasonIndicator.tsx
  - [ ] Garden.tsx에 HUD 통합
```

#### Sprint 3.2: KPI & Reports (2주)

```
Backend:
  - [ ] weekly_reports 테이블 마이그레이션
  - [ ] ScoreService 구현 (KPI 계산, 만족도, 방문객)
  - [ ] ReportService 구현 (주간/년도 리포트 생성)
  - [ ] weeklyReportCron.ts 작성
  - [ ] report.routes.ts, report.controller.ts
  - [ ] harvestPlant() 세션 연동 확장
  - [ ] year_targets.json, score_config.json 작성

Frontend:
  - [ ] KPIBar.tsx (진행도 바)
  - [ ] WeeklyReportCard.tsx
  - [ ] WeeklyReport.tsx 페이지
  - [ ] YearReviewPanel.tsx
  - [ ] YearReview.tsx 페이지
  - [ ] RankBadge.tsx
```

#### Sprint 3.3: Tutorial & Story Events (2주)

```
Backend:
  - [ ] game_event_logs 테이블 마이그레이션
  - [ ] ScenarioService 구현 (이벤트 트리거, 선택지 처리)
  - [ ] scenario.routes.ts, scenario.controller.ts
  - [ ] 컷신 JSON 데이터 작성 (tutorial, year1~3 events)
  - [ ] story_events.json, seasonal_events.json 작성
  - [ ] NPC 대화 데이터 작성

Frontend:
  - [ ] CutsceneOverlay.tsx (컨테이너)
  - [ ] BackgroundLayer.tsx, CharacterLayer.tsx
  - [ ] DialogueBox.tsx + TypewriterText.tsx
  - [ ] ChoiceList.tsx
  - [ ] cutsceneStore.ts (Zustand)
  - [ ] useCutscene.ts 훅
  - [ ] 튜토리얼 5단계 구현 (T-1 ~ T-5)
  - [ ] NPC 스프라이트 에셋 준비 (하나, 정 과장, 라이벌)
```

#### Sprint 3.4: Ending & Credits (2주)

```
Backend:
  - [ ] session_harvest_logs 테이블 마이그레이션
  - [ ] GameSessionService.calculateFinalScore() 구현
  - [ ] GameSessionService.endGame() 구현
  - [ ] 엔딩 분기 로직 (S/A/B/C/F + 특수 엔딩)
  - [ ] EndingCredits 데이터 조립
  - [ ] ending API 라우트

Frontend:
  - [ ] FinalEvaluation.tsx 페이지
  - [ ] Ending.tsx 페이지 (랭크별 분기 렌더링)
  - [ ] EndingIllustration.tsx (랭크별 이미지)
  - [ ] ScoreBoard.tsx (최종 성적표)
  - [ ] StatsSummary.tsx (플레이 통계)
  - [ ] PlantGallery.tsx (수집 갤러리 스크롤)
  - [ ] CreditsRoll.tsx (크레딧 스크롤 애니메이션)
  - [ ] Credits.tsx 페이지
  - [ ] NEW GAME+ 로직
  - [ ] 엔딩 일러스트 에셋 (최소 5장: S/A/B/C/F)
```

#### Sprint 3.5: Polish & Balance (1주)

```
  - [ ] 밸런스 테스팅 (년도별 목표 난이도 조정)
  - [ ] 계절 효과 수치 미세 조정
  - [ ] 방문객/매출 공식 밸런싱
  - [ ] 엔딩 분기 임계값 조정
  - [ ] 컷신 연출 폴리시 (타이밍, 효과)
  - [ ] 주간 리포트 조언 텍스트 다양화 (NPC 하나 대사)
  - [ ] E2E 플로우 테스트 (NEW GAME -> ENDING)
  - [ ] 성능 테스트 (156주 시뮬레이션)
```

### 12.3 에셋 요구사항

| 카테고리 | 항목 | 수량 | 비고 |
|----------|------|------|------|
| 배경 이미지 | 정원 배경 (계절별) | 4장 | 봄/여름/가을/겨울 |
| 배경 이미지 | 컷신 배경 | 8장 | 시청, 사무실, 전시장 등 |
| NPC 스프라이트 | 하나 (표정별) | 5장 | 기본/기쁨/걱정/놀람/진지 |
| NPC 스프라이트 | 정 과장 (표정별) | 3장 | 기본/엄격/만족 |
| NPC 스프라이트 | 라이벌 원장 (표정별) | 3장 | 기본/도전/패배 |
| 엔딩 일러스트 | 랭크별 | 6장 | S+/S/A/B/C/F |
| UI 아이콘 | 계절 아이콘 | 4개 | SVG |
| UI 아이콘 | KPI 아이콘 | 3개 | 매출/수집/만족도 |
| UI 아이콘 | 랭크 배지 | 5개 | S/A/B/C/F |

### 12.4 Phase 2 선행 의존성

본 시스템은 Phase 2의 다음 모듈이 완료된 후 구현 가능:

| Phase 2 모듈 | 필요한 이유 | 필수/권장 |
|-------------|-----------|----------|
| M1: Garden Grid | 멀티 플롯 기반 정원 운영이 년도 시스템의 전제 | **필수** |
| M5-Core: Economy | 코인 경제가 매출 KPI의 기반 | **필수** |
| M4: Resource | 자원 관리가 전략적 깊이 제공 | 권장 |
| M2: Shop | 상점에서 투자 의사결정이 경영 시뮬 요소 | 권장 |
| M3: Tool Upgrade | 도구 업그레이드가 후반부 효율화 | 선택 |

---

*문서 작성 완료: 2026-04-24*
