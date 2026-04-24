# Plantii Phase 3 - Milestone Review Report
# Event & NPC System - Design Specification Review

> **Reviewer**: AI Architect
> **Review Date**: 2026-04-24
> **Document Under Review**: `docs/MILESTONE_EVENT_NPC_SYSTEM.md` v1.0
> **Status**: CONDITIONAL APPROVAL (with required fixes)

---

## 1. Executive Summary

Phase 3 이벤트 & NPC 시스템 설계 명세서는 **전반적으로 높은 완성도(82/100)**를 보인다. 계절 사이클, 랜덤 이벤트, NPC 퀘스트, 친밀도, 시즌 컨테스트의 5개 핵심 서브시스템이 체계적으로 정의되어 있으며, 알고리즘과 데이터 구조가 구현 가능한 수준으로 구체화되어 있다. 그러나 **7가지 핵심 개선사항**과 **4가지 기술적 리스크**가 식별되었으며, 이를 반영한 후 구현에 착수해야 한다.

### Overall Score: 82/100

| Category | Score | Verdict |
|----------|-------|---------|
| (1) 요구사항 완전성 | 85/100 | PASS - 마일스톤 요소 대부분 충족, 일부 누락 |
| (2) 게임플레이 다양성 | 80/100 | CONDITIONAL - 전략 차이 구현 가능하나 보강 필요 |
| (3) 기술적 실행 가능성 | 83/100 | CONDITIONAL - 알고리즘 합리적, 오프라인 처리 미확정 |
| (4) 시스템 간 일관성 | 78/100 | CONDITIONAL - 인터페이스 불명확 지점 존재 |
| (5) 리스크 식별 | 82/100 | PASS - 주요 리스크 식별, 일부 누락 |

---

## 2. Detailed Review: (1) 요구사항 완전성 - 85/100

### 2.1 Strengths (강점)

**A. 계절 사이클이 정밀하게 정의되어 있다.**

- 120일 연간 사이클이 현실적이며, 현실 1일 = 게임 1일 매핑이 직관적
- 6개 식물 카테고리 x 4개 계절 x 3개 보정 계수(growth/yield/quality) = 72개 보정값이 모두 구체적으로 제시됨
- 계절 전환 블렌드 메커니즘(마지막 3일 보간)이 자연스러운 전환을 보장
- 겨울 휴면, 봄 개화 부스트, 여름 폭풍 취약 등 계절별 특수 행동이 잘 정의됨

**B. 랜덤 이벤트 시스템의 확률 설계가 게임 디자인 관점에서 우수하다.**

- Pity System(연속 미발생 보정)이 "너무 오랫동안 아무 일도 안 일어남" 문제를 방지
- 쿨다운 + 동시 이벤트 제한(최대 3개)이 이벤트 스팸을 방지
- 이벤트 타입별 계절 가중치가 thematic coherence를 제공 (여름 해충, 가을 폭풍 등)

**C. NPC 시스템이 풍부한 개성과 성장 곡선을 제공한다.**

- 8명의 NPC가 5가지 성격 타입으로 분류되어 고유한 퀘스트 패턴 생성
- 6단계 친밀도 시스템과 NPC별 Max Affinity 특별 보상이 장기 목표 제공
- 퀘스트 생성 알고리즘이 NPC 성격 + 유저 레벨을 반영하여 동적으로 퀘스트를 생성

### 2.2 Issues (개선 필요)

**ISSUE-1: Disease(질병) 이벤트의 상세 설계가 누락됨**

Section 3.1에서 `EventCategory`에 `DISEASE = 'disease'`를 정의하고, 확률 매트릭스(Section 3.2)와 가중치(Section 7.2)에도 포함시켰지만, Pest(3.3), Storm(3.4), Lucky Rain(3.5), Rare Seed(3.6)와 같은 **상세 인터페이스/효과/대응 수단 정의가 없다**. 5개 이벤트 타입 중 Disease만 빠져 있다.

```
// 존재하는 이벤트 상세 설계:
- 3.3 PestEvent       (interface + 해충 5종 + 피해 계산 공식)
- 3.4 StormEvent       (interface + 폭풍 4종 + 피해 계산 공식)
- 3.5 LuckyRainEvent   (interface + 3 tier + 무지개 보너스)
- 3.6 RareSeedEvent    (interface + 8종 씨앗 + 드롭 테이블)
// 누락:
- Disease Event        (interface 없음, 증상/전파/치료 미정의)
```

> **Required Action**: `DiseaseEvent` 인터페이스 추가. 최소 다음을 정의해야 함:
> - 질병 종류 (곰팡이병, 바이러스, 세균성 질병 등)
> - 카테고리별 취약도 매트릭스
> - 전파 메커니즘 (Pest의 spread_chance와 유사하되 차별화)
> - 치료 수단 및 비용
> - Pest와의 차별점 명확화 (Pest = 외부 공격, Disease = 내부 감염)

**ISSUE-2: Visitor 이벤트 카테고리가 정의만 되고 사용되지 않음**

`EventCategory.VISITOR = 'visitor'`가 선언되었으나:
- 확률 매트릭스(Section 3.2)에 포함되지 않음
- `SEASON_WEIGHTS` 테이블(Section 7.2)에 포함되지 않음
- `SEVERITY_WEIGHTS` 테이블에 포함되지 않음
- 상세 설계 섹션이 없음

NPC 방문과의 관계가 불명확하다. NPC 방문 확률은 별도 알고리즘(Section 4.3)으로 관리되는데, VISITOR 이벤트와 중복되는지, 특별 방문자(NPC 이외)인지 구분이 안 된다.

> **Required Action**: 다음 중 하나를 선택:
> - **(A)** VISITOR를 `EventCategory`에서 제거하고, NPC 방문은 NPC 시스템이 독립적으로 관리
> - **(B)** VISITOR를 "특별 방문자" (NPC 시스템 밖의 일회성 상인, 여행자 등)로 정의하고 상세 설계 추가
> - **권장: (A)** - NPC 방문과 Event가 별도 시스템이라면 혼란을 줄이기 위해 제거

**ISSUE-3: Herb Contest와 Rare Exhibit의 심사 기준이 누락됨**

Section 5.2에서 Flower Show, Section 5.3에서 Harvest Festival의 심사 기준이 상세히 정의되었지만, Section 5.4의 연간 캘린더에 나열된 **Herb Contest(여름)**와 **Rare Exhibit(겨울)**의 심사 기준, 출품 규칙, 상품이 정의되지 않았다.

```
// 상세 심사 기준이 있는 컨테스트:
- Flower Show       (Section 5.2 - 5개 심사 기준 + 가중치 + NPC 점수 생성)
- Harvest Festival  (Section 5.3 - 4개 심사 기준 + 가중치 + 상품)
// 누락:
- Herb Contest      (참가 조건만 Section 5.4에 있음)
- Rare Exhibit      (참가 조건만 Section 5.4에 있음)
```

> **Required Action**: Herb Contest와 Rare Exhibit의 심사 기준, 점수 알고리즘, 상품 테이블 추가. 또는 Phase 3 초기 릴리스에서 Flower Show + Harvest Festival만 구현하고, 나머지 2개는 Phase 3.5로 연기하되 스케줄에 명시.

---

## 3. Detailed Review: (2) 게임플레이 다양성 - 80/100

### 3.1 "플레이할 때마다 다른 이벤트 조합" 구현 가능성 평가

**PASS - 다양성 확보 메커니즘이 충분하다.**

| Randomization Source | Mechanism | Effectiveness |
|---------------------|-----------|--------------|
| 이벤트 발생 여부 | 확률 기반 (base * season * pity * level * garden) | HIGH - 5개 변수 조합 |
| 이벤트 심각도 | 가중 랜덤 (SEVERITY_WEIGHTS) | MEDIUM - 예측 가능한 분포 |
| 해충 종류 | 5종 x 계절 피크 | MEDIUM |
| 희귀 씨앗 종류 | 8종 x 레벨/계절 보정 | HIGH |
| NPC 방문 순서 | 확률 기반 + 조건부 | HIGH |
| 퀘스트 내용 | NPC 성격 x 난이도 x 식물 조합 | HIGH |
| 컨테스트 결과 | NPC 경쟁자 점수 분산 | MEDIUM |

**시뮬레이션 추정**: 30일 플레이 기준, 이벤트 조합 경우의 수:
- 이벤트 발생: ~8-12회 (5종 x 평균 확률)
- 각 이벤트의 심각도: 4단계
- NPC 방문: ~15-25회
- 퀘스트: ~8-15개
- **총 경험 조합**: 사실상 무한대 (확률적 독립 이벤트 체인)

### 3.2 "계절별 전략 차이" 구현 가능성 평가

**CONDITIONAL - 전략 차이는 존재하나, 최적 전략이 명확해 전략적 깊이가 제한됨.**

| Season | Dominant Strategy | Strategic Depth |
|--------|------------------|----------------|
| Spring | 허브/꽃 집중 재배 (growth 1.3-1.4x) + 꽃 품평회 준비 | LOW - 최적해가 명확 |
| Summer | 과일 집중 (growth 1.4x, yield 1.5x) + 해충 대비 | MEDIUM - 해충 리스크 관리 필요 |
| Autumn | 수확 축제용 다양성 확보 + 엽채류 품질 챙기기 | HIGH - 다양성 vs 집중의 트레이드오프 |
| Winter | 다육류/관엽류 유지 + 희귀 식물 전시 준비 | LOW - 할 수 있는 게 제한적 |

**ISSUE-4: 겨울 시즌이 "대기 시간"에 불과할 위험**

겨울의 growth modifier가 대부분 0.1-0.6으로 극히 낮아, 30일간 "성장이 거의 안 되는 시즌"이 된다. 플레이어가 겨울 30일(현실 30일) 동안 할 수 있는 의미 있는 행동이 부족하다:

```
겨울 보정 최고치: succulent growth 0.6, foliage growth 0.5
겨울 이벤트 확률: pest 0.02, storm 0.10, lucky_rain 0.03, rare_seed 0.01
  -> 모든 이벤트가 최저치. 폭풍만 0.10으로 의미 있음.

겨울 NPC: 특별 언급 없음
겨울 컨테스트: Rare Exhibit (Day 25-27) - 상세 미정의 (ISSUE-3)
```

현실 30일 동안 게임에서 할 것이 없으면 유저 이탈의 핵심 원인이 된다.

> **Required Action**: 겨울 시즌 콘텐츠 보강. 다음 중 복수 적용 권장:
> - **(A)** 겨울 전용 실내 재배 시스템 (온실 연동 - Phase 2 greenhouse와 연계)
> - **(B)** 겨울 전용 NPC 이벤트 (크리스마스 마켓, 설날 특별 퀘스트 등)
> - **(C)** 겨울 휴면 식물의 "관리 미니게임" (보온재 설치, 동해 방지 등)
> - **(D)** 겨울 희귀 식물 전시 컨테스트 상세화 + 보상 강화
> - **(E)** 일부 식물 카테고리의 겨울 성장률 상향 (succulent 0.6 -> 0.8, foliage 0.5 -> 0.7)

**ISSUE-5: 이벤트 대응이 "코인만 쓰면 해결"로 단순화될 위험**

Pest Event 대응 (Section 3.3)을 보면:

```
MINOR:    50 coins (살충제)
MODERATE: 150 coins
MAJOR:    400 coins
CRITICAL: 800 coins + 특수 아이템
```

Storm Event에는 대응 수단 자체가 정의되지 않았다 (shelter_protection만 언급). Lucky Rain과 Rare Seed는 긍정적 이벤트라 대응이 불필요. Disease는 미정의.

결국 부정적 이벤트 대응 = "코인 지불"이라는 단순한 메커니즘 하나뿐이다. 이는 Phase 2의 "경영 판단" 요소를 약화시킨다.

> **Recommendation**: 이벤트 대응에 전략적 선택지 추가:
> - 살충제 즉시 사용 (코인 비용 높음, 즉시 해결) vs 자연 치유 대기 (비용 없음, 피해 지속)
> - 특정 식물 격리 (해당 식물 성장 중단, 전파 방지) vs 전체 치료 (비용 높음, 전체 회복)
> - 예방 조치 아이템 (사전 구매하여 이벤트 발생 시 자동 적용)

---

## 4. Detailed Review: (3) 기술적 실행 가능성 - 83/100

### 4.1 알고리즘 합리성 평가

**A. 이벤트 스케줄링 알고리즘 (Section 7.1) - GOOD**

```typescript
// 일일 처리 플로우가 명확하고 구현 가능:
// 1. 계절/일차 조회 -> 2. 만료 이벤트 정리 -> 3. 동시 제한 체크
// 4. 쿨다운 체크 -> 5. 확률 계산 -> 6. 이벤트 생성 -> 7. 효과 적용
```

- `processDailyEvents()` 의사코드가 구현체 수준으로 구체적
- `MAX_CONCURRENT_EVENTS = 3` 안전장치 적절
- 쿨다운 시스템이 이벤트 스팸 방지에 효과적
- Pity Factor의 상한(2.0)이 확률 폭주를 방지

**그러나 한 가지 문제**: 이벤트 타입 순회 순서가 결과에 영향을 미친다.

```typescript
for (const eventType of EVENT_TYPES) {  // 순서가 고정되면 pest가 항상 먼저 판정
  // ... 확률 계산 및 이벤트 생성
  if (activeEvents.length + newEvents.length >= MAX_CONCURRENT_EVENTS) break;
}
```

`EVENT_TYPES` 배열의 순서가 고정이면, 동시 이벤트 제한(3개)에 걸릴 때 뒤쪽 이벤트 타입(rare_seed 등)이 불리해진다.

> **Required Action**: EVENT_TYPES 순회 전 `shuffle(EVENT_TYPES)` 추가하여 공정한 판정 보장

**B. NPC 방문 확률 알고리즘 (Section 4.3) - GOOD**

- 조건 미충족 시 `return 0`으로 즉시 차단하는 설계가 효율적
- 친밀도/선호식물/계절의 복합 보정이 의미 있는 방문 패턴 생성
- `min(... , 0.95)` 상한이 100% 확정 방문을 방지

**C. 퀘스트 생성 알고리즘 (Section 4.4) - GOOD with concerns**

- NPC 성격 기반 가중치 랜덤 선택이 다양한 퀘스트 생성에 효과적
- 난이도별 파라미터 테이블이 명확

**그러나 실현 불가능 퀘스트 생성 위험이 있다** (문서 Risk 12.1에서도 언급):

```
예시: 셰프 이준 (PICKY, herb+fruit, A+ quality) 이
       레벨 5 유저에게 "hard" 퀘스트를 발행:
       "A등급 이상 토마토 5개를 3일 내 납품"

       문제: 토마토 성장 최소 30일. 3일 내 A등급 5개는 불가능.
```

> **Required Action**: 퀘스트 생성 시 **유저 보유 식물 상태 체크** 로직 추가:
> ```
> // 납품(DELIVER) 퀘스트: 유저가 수확 가능 또는 곧 수확 가능한 식물 기반
> // 재배(GROW) 퀘스트: deadline >= 해당 식물의 최소 성장일
> // 품질(QUALITY) 퀘스트: 유저 레벨에서 달성 가능한 품질 등급 기반
> ```

**D. 컨테스트 NPC 점수 생성 (Section 5.2) - ACCEPTABLE but fragile**

```
base = 40 + userLevel * 2.5
scores = [base + random(-15, +15)] * 4
```

레벨 1: base = 42.5, range = 27.5-57.5
레벨 15: base = 77.5, range = 62.5-92.5

이 공식은 작동하지만, 유저가 항상 적정 품질의 꽃만 출품하면 NPC보다 쉽게 이길 수 있다. 역으로 유저의 꽃이 NPC의 최고 점수보다 낮으면 이길 수 없어 참가 동기가 없다.

> **Recommendation**: NPC 점수 생성에 "유저 제출 점수 참조" 로직 추가. 예: NPC 최고 점수 = `min(userScore + random(5, 15), 98)` 형태로, 유저가 잘하면 NPC도 강해지는 적응형 난이도.

### 4.2 기술적 실행 가능성 핵심 리스크

**ISSUE-6: 오프라인 이벤트 처리 전략이 미확정**

Section 12.2.1에서 "로그인 시 미처리 일수만큼 일괄 처리 (최대 7일치)"를 제안했지만, 이것이 **"제안"** 수준에 머물러 있다. 이는 구현의 핵심 아키텍처 결정이다.

```
시나리오: 유저가 14일간 미접속 후 로그인
  - 7일치 이벤트 일괄 처리 시, 최악의 경우:
    - 7개의 해충 이벤트 (각 쿨다운 3일이므로 최대 2-3개)
    - 7개의 폭풍 이벤트 (쿨다운 2일이므로 최대 3-4개)
    - 식물 건강도 0으로 전멸 가능
  - 결과: 오랜만에 접속한 유저가 "밭이 폐허"가 되어 이탈

  vs.

  - 7일치를 한 번에 로딩하면 API 응답 시간 문제
  - JSONB payload가 큰 이벤트 7-21개를 한 번에 생성
```

> **Required Action**: 오프라인 처리 전략을 확정하고 문서에 반영:
> - 일괄 처리 일수 상한 결정 (7일 권장)
> - 오프라인 기간 중 부정적 이벤트 피해 감쇠 계수 도입 (예: `offline_damage_factor = 0.5`)
> - "오프라인 보호막" 아이템/메커니즘 고려 (친밀도 높은 NPC가 대신 관리)
> - 로그인 시 일괄 처리 API의 응답 시간 상한 설정 (예: 3초)

**ISSUE-7: `game_season` 테이블의 서버 전역 상태 동기화**

Section 6.1에서 `GlobalSeasonState`를 "서버 전역 상태 (모든 유저 공유)"로 정의했다. 그러나:

```sql
CREATE TABLE game_season (
  id SERIAL PRIMARY KEY,
  game_start_date TIMESTAMP NOT NULL DEFAULT NOW(),
  current_tick INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

- `current_tick`은 누가 업데이트하는가? `simulationCron`이 매일 +1?
- 서버가 여러 대(horizontal scaling) 일 때, 여러 cron이 동시에 tick을 올릴 수 있음
- `game_start_date`가 서버 재시작 시 리셋되면 안 됨 (DEFAULT NOW()가 위험)

> **Required Action**:
> - `game_start_date`의 DEFAULT NOW()를 제거하고, 최초 1회 수동 설정하는 migration seed로 변경
> - `current_tick` 업데이트를 `SELECT ... FOR UPDATE` + 트랜잭션으로 보호
> - 또는 `current_tick`을 저장하지 않고 `game_start_date`로부터 매번 계산하는 stateless 방식 채택 (권장)
>
> ```typescript
> // 권장: Stateless 방식
> function getCurrentGameDay(): number {
>   const startDate = getGameStartDate(); // DB에서 1회 조회, 캐싱
>   return Math.floor((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000));
> }
> ```

---

## 5. Detailed Review: (4) 시스템 간 일관성 - 78/100

### 5.1 NPC 퀘스트 <-> 친밀도 인터페이스

**PASS - 잘 연결되어 있다.**

```
퀘스트 완료 -> affinity +5~15 (난이도별)
퀘스트 실패 -> affinity -5
친밀도 레벨 UP -> 퀘스트 보상 +10%~50%
친밀도 80+ -> 전설 퀘스트 해금
친밀도 100 -> 영구 특별 보상
```

이 순환이 자기 강화 루프(virtuous cycle)를 형성하여 장기 플레이 동기를 제공한다.

### 5.2 시즌 컨테스트 <-> NPC 시스템

**CONDITIONAL - 연결이 약하다.**

컨테스트에서 NPC는 "경쟁자 점수 생성"에만 사용된다. 하지만 NPC와의 관계가 컨테스트에 미치는 영향이 없다:

- 꽃집 소연(florist)과 친밀도가 높으면 Flower Show에서 유리해야 자연스럽다
- 셰프 이준과 친밀도가 높으면 Harvest Festival에서 심사 보너스가 있어야 한다

> **Recommendation**: NPC 친밀도가 관련 컨테스트에서 소량의 점수 보너스를 제공:
> ```
> contest_affinity_bonus = 0
> if (contest == FLOWER_SHOW && npc_florist.affinity >= 60): bonus += 0.03
> if (contest == HARVEST_FESTIVAL && npc_chef.affinity >= 60): bonus += 0.03
> ```

### 5.3 랜덤 이벤트 <-> Phase 2 경제 시스템

**CONDITIONAL - 연결점이 불명확하다.**

Phase 2에서 정의된 시스템과의 인터페이스:

| Phase 2 System | Phase 3 연결점 | 현재 상태 |
|---------------|---------------|----------|
| Shop (shop_items) | 이벤트 대응 아이템 구매 | 언급만 됨 ("살충제 50 coins") - shop_items에 추가 필요 |
| Greenhouse (user_tools) | `shelter_protection` 폭풍 방어 | 정의됨 (Section 3.4) - OK |
| User Resources (water tank) | Lucky Rain의 수분 회복 | 미정의 - Lucky Rain이 water tank에 영향을 주는지 불명확 |
| Garden Grid (garden_plots) | `affected_plot_ids` 이벤트 영향 범위 | 정의됨 - OK |
| Transaction (transactions) | 이벤트 대응 비용 로깅 | 미정의 - EconomyService 연동 필요 |

> **Required Action**:
> - Phase 2 `shop_items`에 추가할 이벤트 대응 아이템 목록 명시 (살충제, 살균제, 방풍막 등)
> - Lucky Rain 이벤트가 `user_resources.water_current`를 회복시키는지 결정
> - 이벤트 대응 비용을 `EconomyService.spendCoins()`로 처리하도록 명시

### 5.4 계절 시스템 <-> 기존 SimulationService

**CONDITIONAL - 통합 인터페이스가 불명확하다.**

현재 `SimulationService.calculateGrowthRate()` 시그니처:

```typescript
calculateGrowthRate(
  environment: { temperature?, humidity?, light_dli?, soil_moisture? },
  plantEnvironment: any,
  baseGrowthRate: number = 1.0
): number
```

Phase 3 명세서의 보정 적용 공식 (Section 2.4):

```
effective_growth_rate = base_growth_rate
                      * season_modifier.growth_rate
                      * environment_match_factor
                      * health_factor
```

여기서 `environment_match_factor`가 기존 `calculateGrowthRate()`의 반환값인지, 별도 계산인지 불명확하다. Phase 2 리뷰(ISSUE-11)에서 제안한 `plotBonuses`, `toolBonuses` 파라미터까지 합치면 시그니처가 복잡해진다.

> **Required Action**: `calculateGrowthRate()` 최종 시그니처를 확정:
> ```typescript
> calculateGrowthRate(
>   environment, plantEnvironment, baseRate = 1.0,
>   seasonModifiers?: SeasonModifiers,
>   plotBonuses?: PlotBonuses,
>   toolBonuses?: ToolBonuses,
>   eventModifiers?: EventModifiers  // 해충 debuff, Lucky Rain buff 등
> ): number
> ```
> 또는 `GrowthContext` 객체 패턴으로 단순화:
> ```typescript
> interface GrowthContext {
>   season: SeasonModifiers;
>   plot: PlotBonuses;
>   tool: ToolBonuses;
>   event: EventModifiers;
> }
> calculateGrowthRate(environment, plantEnvironment, baseRate, context?: GrowthContext): number
> ```

### 5.5 데이터 모델 일관성 체크

| Field | Phase 3 명세서 | Phase 2 명세서 | 일관성 |
|-------|--------------|--------------|--------|
| `user_plants.quality_score` | Section 8.2: `ALTER TABLE user_plants ADD COLUMN quality_score FLOAT DEFAULT 50.0` | Phase 2에 없음 | OK - 신규 |
| `user_plants.care_score` | Section 8.2: `ADD COLUMN care_score FLOAT DEFAULT 50.0` | Phase 2에 없음 | OK - 신규 |
| `user_plants.active_buffs` | Section 8.2: `ADD COLUMN active_buffs JSONB DEFAULT '[]'` | Phase 2에 없음 | **WARNING** - Phase 2 fertilizer도 buff인데, 별도로 `user_inventory.is_active`로 관리. 이중 관리 위험 |
| `users.event_pity_counter` | Section 8.2: `ADD COLUMN event_pity_counter INTEGER DEFAULT 0` | Phase 2에 없음 | **WARNING** - pity는 `eventHistory`에서 계산하는데(Section 7.1), 별도 컬럼이 필요한 이유 불명확 |

> **Required Action**:
> - `active_buffs/active_debuffs` vs Phase 2의 `user_inventory.is_active` 관계 정리. 단일 소스(single source of truth) 결정
> - `event_pity_counter`가 `eventHistory`에서 계산 가능하다면 제거하여 데이터 불일치 방지

---

## 6. Detailed Review: (5) 리스크 식별 - 82/100

### 6.1 문서에 식별된 리스크 평가

| Risk (문서 12.1) | 평가 |
|-----------------|------|
| 밸런스 붕괴 | GOOD - "시뮬레이션 1000회" 대응이 적절 |
| 이벤트 스팸 | GOOD - 쿨다운 + 동시 제한 + 무시 기능 제안 |
| NPC 퀘스트 불가능 조건 | PARTIAL - 식별했지만 해결 알고리즘이 명세에 없음 |
| 컨테스트 NPC 점수 불공정 | GOOD - 레벨 스케일링 + 분산 조정 |
| DB 성능 (JSONB 쿼리 부하) | PARTIAL - 인덱싱 전략 언급했지만 구체적 계획 없음 |

### 6.2 누락된 리스크

**RISK-A: 계절 강제 동기화로 인한 신규 유저 불이익**

서버 전역 계절(Section 12.2.2)을 채택하면, 겨울에 가입한 신규 유저는:
- 30일간 성장률 극히 저조 (대부분 0.1-0.6)
- 높은 폭풍 확률로 피해 누적
- NPC 퀘스트 수행 어려움 (재배할 수 있는 식물이 제한적)
- 결론: 가입 시점에 따라 초반 경험이 극단적으로 달라짐

> **Mitigation**: 신규 유저에게 첫 30일간 "초보자 보호 버프" 적용 (계절 보정 최소 0.5 보장, 이벤트 피해 50% 감소)

**RISK-B: 10.5주 일정의 현실성**

| Phase | Duration | Content Volume | Risk |
|-------|----------|---------------|------|
| 3-A: Season | 2주 | DB + Service + API + CSS + Particle | MEDIUM |
| 3-B: Events | 2.5주 | DB + 5종 이벤트 핸들러 + 스케줄러 + UI | HIGH |
| 3-C: NPC | 3주 | DB + 8 NPC + 퀘스트 엔진 + 친밀도 + UI 9개 태스크 | VERY HIGH |
| 3-D: Contest | 2주 | DB + 4종 컨테스트 + 점수 알고리즘 + UI | HIGH |
| 3-E: Integration | 1주 | 통합 테스트 + 밸런스 + 최적화 | MEDIUM |

Phase 3-C (NPC 시스템)가 3주에 9개 태스크(DB + 방문 스케줄링 + 퀘스트 엔진 + 친밀도 + 보상 + API + UI 3종)를 소화해야 하므로 가장 위험하다.

> **Mitigation**: Phase 3-C를 2개 서브 스프린트로 분할:
> - 3-C.1 (2주): NPC 기본 시스템 (DB + 방문 + 기본 퀘스트 + API)
> - 3-C.2 (1.5주): 친밀도 심화 + 보상 + 전체 UI
> 총 일정을 11-12주로 조정

**RISK-C: care_score 계산의 정의 부재**

컨테스트 심사(Section 5.2)에서 `care_history_score` (가중치 15%)를 사용하지만, 이 점수가 어떻게 계산되는지 알고리즘이 없다. "물주기 적시성, 환경 유지 이력 기반 점수"라고만 되어 있다.

기존 코드에는 care history를 추적하는 시스템이 없다. 이를 위해서는:
- 물주기 시점 로깅
- 환경 조건 일일 스냅샷
- 적정 범위 유지 일수 계산

이 모든 것이 새로운 인프라다.

> **Required Action**: `care_score` 계산 알고리즘을 명시하거나, Phase 3 초기에는 quality_score와 health로 대체하고 care_score는 Phase 4에서 도입.

---

## 7. Checklist: Required Actions Before Implementation

### Must Fix (구현 전 반드시 수정) - 8개

| ID | Issue | Section | Priority |
|----|-------|---------|----------|
| ISSUE-1 | Disease 이벤트 상세 설계 추가 | 3.x (신규) | P0 |
| ISSUE-2 | VISITOR 이벤트 카테고리 제거 또는 상세 정의 | 3.1 | P1 |
| ISSUE-3 | Herb Contest & Rare Exhibit 심사 기준 추가 또는 연기 명시 | 5.x | P1 |
| ISSUE-4 | 겨울 시즌 콘텐츠 보강 | 2.4, 2.5 | P0 |
| ISSUE-6 | 오프라인 이벤트 처리 전략 확정 | 7.1, 12.2 | P0 |
| ISSUE-7 | game_season 상태 관리 방식 확정 (stateless 권장) | 6.1, 8.1 | P0 |
| - | EVENT_TYPES 순회 순서 shuffle 추가 | 7.1 | P1 |
| - | active_buffs vs user_inventory.is_active 단일 소스 결정 | 8.2 | P1 |

### Should Fix (구현 중 반영 권장) - 5개

| ID | Issue | Section | Priority |
|----|-------|---------|----------|
| ISSUE-5 | 이벤트 대응에 전략적 선택지 추가 | 3.3 | P2 |
| - | 퀘스트 생성 시 유저 보유 식물 상태 체크 | 4.4 | P2 |
| - | NPC 친밀도-컨테스트 보너스 연동 | 5.2, 5.3 | P2 |
| - | Phase 2 shop_items에 이벤트 대응 아이템 목록 명시 | 연동 | P2 |
| - | care_score 계산 알고리즘 정의 또는 Phase 4 연기 | 5.2 | P2 |

### Architecture Decisions Required

| Decision | Options | Recommended |
|----------|---------|-------------|
| 오프라인 이벤트 처리 | (A) 일괄 처리 (B) 무시 (C) 감쇠 처리 | (C) 7일치까지 감쇠(0.5x) 처리 |
| 계절 상태 관리 | (A) DB tick 저장 (B) Stateless 계산 | (B) Stateless |
| VISITOR 이벤트 | (A) 제거 (B) 특별 방문자로 정의 | (A) 제거 |
| 미구현 컨테스트 | (A) 4종 모두 구현 (B) 2종만 Phase 3 | (B) Flower Show + Harvest Festival만 |
| GrowthRate 시그니처 | (A) 파라미터 추가 (B) Context 객체 | (B) GrowthContext 객체 |

---

## 8. Final Verdict

### CONDITIONAL APPROVAL - 82/100

설계 명세서의 전체적 방향과 아키텍처는 **승인**한다. 계절 사이클, 랜덤 이벤트, NPC 퀘스트, 친밀도, 컨테스트의 5대 시스템이 유기적으로 연결된 게임플레이 루프를 형성하며, 기존 Phase 1/2 코드와의 호환성이 잘 유지되어 있다. 알고리즘이 구현 가능한 수준으로 구체적이며, 확률/보상 수치가 합리적 범위에 있다.

단, **Section 7의 "Must Fix" 8개 항목을 문서에 반영한 후** 구현에 착수해야 한다. 특히 다음 3가지가 핵심이다:

1. **겨울 시즌 콘텐츠 보강** (ISSUE-4) - 현실 30일간 유저 이탈 방지의 핵심
2. **오프라인 처리 전략 확정** (ISSUE-6) - 아키텍처의 근본적 결정
3. **Disease 이벤트 상세 설계** (ISSUE-1) - 5개 이벤트 중 1개가 누락된 상태로는 구현 불가

이 세 가지가 반영되면 Phase 3-A(Season Cycle System) 구현을 시작할 수 있다.

### Score Breakdown

```
요구사항 완전성:        85/100  (Disease/Visitor/Contest 일부 누락으로 감점)
게임플레이 다양성:       80/100  (겨울 콘텐츠 부족, 이벤트 대응 단순으로 감점)
기술적 실행 가능성:      83/100  (오프라인 처리 미확정, game_season 동기화 이슈로 감점)
시스템 간 일관성:        78/100  (Phase 2 연동 불명확, buff 이중 관리 위험으로 감점)
리스크 식별:            82/100  (신규 유저 불이익, 일정 리스크 누락으로 감점)

WEIGHTED AVERAGE:      82/100
  = (85*0.25 + 80*0.20 + 83*0.25 + 78*0.15 + 82*0.15)
  = 21.25 + 16.0 + 20.75 + 11.7 + 12.3
  = 82.0
```

---

*Review completed: 2026-04-24*
