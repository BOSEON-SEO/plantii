# Plantii Phase 2 - Milestone Review Report
# Garden Management & Economy System - Implementation Plan Review

> **Reviewer**: AI Architect
> **Review Date**: 2026-04-24
> **Document Under Review**: `docs/MILESTONE_GARDEN_ECONOMY_SYSTEM.md` v1.0
> **Status**: CONDITIONAL APPROVAL (with required fixes)

---

## 1. Executive Summary

step-1에서 작성된 마일스톤 문서는 **전반적으로 높은 완성도**를 보인다. 5개 모듈(Garden Grid, Shop, Tool Upgrade, Resource Management, Coin Economy)의 설계가 기존 Phase 1 아키텍처와 호환성을 유지하면서 확장하는 방향으로 잘 구성되어 있다. 그러나 **5가지 핵심 개선사항**과 **3가지 위험요소**가 식별되었으며, 이를 반영한 후 최종 구현에 착수해야 한다.

### Verdict Breakdown

| Category | Score | Verdict |
|----------|-------|---------|
| (1) 기능 완성도 & 게임 목표 부합도 | 8.5/10 | PASS |
| (2) 모듈 간 의존성 & 구현 순서 | 7.0/10 | CONDITIONAL - 순서 조정 필요 |
| (3) 코인 소비 루프의 경영 판단 영향도 | 7.5/10 | CONDITIONAL - 의사결정 분기 보강 필요 |
| (4) 자원 관리 & 도구 업그레이드 밸런스 | 7.0/10 | CONDITIONAL - 수치 조정 필요 |
| (5) 구현 복잡도 & 스코프 합리성 | 7.5/10 | CONDITIONAL - 스코프 축소 권장 |

---

## 2. Detailed Review: (1) 기능 완성도 & 게임 목표 부합도

### 2.1 Strengths (강점)

**A. 기존 코드와의 호환성이 우수하다.**
- `User.ts` 모델의 `coins`, `experience_points`, `level` 필드를 그대로 활용
- `SimulationService.calculateGrowthRate()`의 확장 포인트가 명확 (bonus multiplier 추가만 필요)
- 기존 `userPlant.service.ts`의 `harvestPlant()`가 이미 `plant.rewards.coins`를 사용하고 있어 `EconomyService` 래퍼로 자연스럽게 전환 가능
- 기존 API 엔드포인트 보존 (하위 호환성 유지)

**B. 데이터 모델 설계가 견고하다.**
- `garden_plots`의 `UNIQUE(garden_id, row_index, col_index)` 제약조건이 중복 배치 방지
- `transactions` 테이블의 감사 로그(audit trail) 설계가 경제 디버깅에 필수적
- `shop_items.effects`를 JSONB로 설계하여 아이템 유형별 유연한 효과 정의 가능
- FK 관계와 ON DELETE 정책이 적절 (CASCADE for owned data, SET NULL for references)

**C. 게임 루프가 명확하다.**
- "Earn -> Spend -> Grow -> Earn More" 순환 구조가 잘 정의됨
- 각 모듈이 이 루프의 특정 단계를 담당

### 2.2 Issues (개선 필요)

**ISSUE-1: `adjustEnvironment`에서 코인 차감이 미구현 상태를 인지하지 못함**

현재 `userPlant.service.ts:127`에서 `cost_coins: 10`을 응답에 포함하지만 실제로 코인을 차감하지 않는다. 마일스톤 문서 Section 1.5에서 이를 언급했지만, Phase 2 구현 태스크에 이 버그 수정이 명시적으로 포함되지 않았다.

```
// 현재 코드 (버그)
return {
  ...updated,
  cost_coins: 10,  // 응답만 반환, 실제 차감 없음
};
```

> **Required Action**: M5 구현 태스크에 "기존 adjustEnvironment의 코인 차감을 EconomyService.spendCoins로 교체" 항목 추가

**ISSUE-2: 수확 후 식물 처리 로직 불명확**

`harvestPlant()`는 `UserPlantModel.harvest(id)`를 호출하지만, 수확 후 해당 식물이 plot에서 제거되는지, 그대로 남는지 정의되지 않았다. Garden Grid 시스템에서 plot-plant 관계의 수확 후 상태 전이가 필요하다.

> **Required Action**: M1에 "수확 완료 시 plot.is_empty = true, plot.user_plant_id = null로 리셋" 비즈니스 규칙 추가

**ISSUE-3: 업적(Achievement) 시스템이 언급만 되고 설계가 없음**

Economy Flow (Section 7.2)에서 "Achievement rewards"를 코인 수입원으로 포함했지만, 업적 테이블/API/로직이 전혀 설계되지 않았다. 이는 코인 유입 예측의 정확도를 떨어뜨린다.

> **Required Action**: Phase 2 스코프에서 Achievement를 제외하거나, 최소 테이블 스키마를 추가. 밸런스 분석에서 Achievement 보상을 제거하여 보수적으로 계산.

---

## 3. Detailed Review: (2) 모듈 간 의존성 & 구현 순서

### 3.1 문서에 명시된 순서

```
Phase 2.1: M1 (Garden Grid)
Phase 2.2: M5-Core (Economy Config)
Phase 2.3: M4 (Resource Management)
Phase 2.4: M2 (Shop System)
Phase 2.5: M3 (Tool Upgrades)
```

### 3.2 문서 내부 모순 발견

**ISSUE-4: DAG와 Implementation Order가 불일치**

Section 2.1의 DAG에서는:
```
Critical Path: M1 -> M4 -> M2 -> M3 -> M5
```

Section 2.2의 Implementation Order에서는:
```
M1 -> M5(Core) -> M4 -> M2 -> M3
```

Sprint Plan (Section 8.1)에서는:
```
Sprint 2.1: M5-Core + M1 (동시)
Sprint 2.2: M4 + M2 (동시)
Sprint 2.3: M3 + M5 (동시)
```

세 곳의 순서가 모두 다르다. Sprint Plan이 가장 현실적이나, DAG와의 정합성 문서화가 필요하다.

> **Required Action**: DAG를 Sprint Plan 기준으로 수정. Critical Path를 `[M5-Core + M1] -> [M4 + M2] -> [M3 + M5-Full]`로 재정의.

### 3.3 실제 의존성 분석

```
M5-Core (economy.config.ts, EconomyService)
  - 의존: 없음 (순수 config + 유틸리티)
  - 피의존: M1(plot unlock coins), M2(purchase), M3(upgrade), M4(refill)
  => 가장 먼저 구현이 맞음. OK.

M1 (Garden Grid)
  - 의존: M5-Core (plot unlock 시 코인 차감)
  - 피의존: M2(equip to plot), M3(assign to plot), M4(water per plot)
  => M5-Core와 동시/직후 구현. OK.

M4 (Resource Management)
  - 의존: M1 (water per plot 개념)
  - 피의존: M2(fertilizer stock), M3(sprinkler water consumption)
  => M1 이후 구현. OK.

M2 (Shop System)
  - 의존: M5-Core (coins), M1 (equip to plot), M4 (fertilizer stock)
  - 피의존: M3 (tool purchase entry point)
  => M4와 동시 또는 직후. Sprint Plan의 동시 구현은 타당하나
     M2의 equip/use 기능은 M1/M4 완료 후에만 테스트 가능.

M3 (Tool Upgrades)
  - 의존: M2 (shop purchase), M4 (water tank), M1 (plot assignment)
  - 피의존: 없음 (최종 소비자)
  => 마지막 구현. OK.
```

**결론**: Sprint Plan의 순서가 논리적으로 가장 타당. 단, Sprint 2.2에서 M2의 equip/use 기능은 M1/M4의 API가 먼저 안정화된 후 통합 테스트해야 한다.

### 3.4 Migration 순서 검증

```
02_garden_grid.sql  -> garden_grids, garden_plots, user_plants.plot_id ALTER
03_shop_system.sql  -> shop_items, user_inventory(FK: garden_plots), transactions
04_tool_system.sql  -> user_tools(FK: 없음, assigned_plot_ids는 UUID[])
05_resource_system.sql -> user_resources
06_economy_enhancements.sql -> users ALTER, economy_config
```

**ISSUE-5: Migration 순서와 FK 의존성 불일치**

- `user_inventory.equipped_at_plot_id`는 `garden_plots(id)`를 참조하므로 migration 03은 반드시 02 이후에 실행되어야 함 -> OK
- `06_economy_enhancements.sql`의 `economy_config` 테이블은 M5-Core에서 필요하지만, Sprint 2.1에서 M5-Core를 먼저 구현함. migration 순번 06이 너무 늦다.

> **Required Action**: `economy_config` 테이블과 `users` ALTER를 `02_economy_foundation.sql`로 분리하여 가장 먼저 실행. 나머지 migration 순번 재배정:
> ```
> 02_economy_foundation.sql  (economy_config, users.daily_login_streak)
> 03_garden_grid.sql
> 04_shop_system.sql
> 05_resource_system.sql
> 06_tool_system.sql
> ```

---

## 4. Detailed Review: (3) 코인 소비 루프가 경영 판단에 미치는 영향

### 4.1 현재 설계의 의사결정 포인트 분석

| Decision Point | Player Choice | Trade-off |
|---------------|--------------|-----------|
| 어떤 씨앗을 살 것인가? | 저렴+빠른 vs 비싼+고보상 | 시간 vs 코인 |
| 언제 플롯을 확장할 것인가? | 일찍 확장 vs 도구 업그레이드 우선 | 병렬성 vs 효율성 |
| 비료를 살 것인가? | 빠른 성장 vs 코인 절약 | 속도 vs 경제 |
| 어떤 도구를 업그레이드할 것인가? | 물뿌리개 vs 온실 vs 스프링클러 | 수동 효율 vs 자동화 |
| 물을 긴급 구매할 것인가? | 즉시 구매 vs 자연 회복 대기 | 시간 vs 코인 |

### 4.2 Strengths

- **플롯 확장 비용의 지수 스케일링** (`500 * 1.5^n`)이 후반부 의미 있는 결정을 강제
- **도구 업그레이드 비용의 급격한 상승** (500 -> 1500 -> 4000 -> 10000)이 장기 투자 판단 요구
- **비료의 시간 제한** (12h ~ 72h)이 타이밍 결정 유도

### 4.3 Weaknesses & Required Improvements

**ISSUE-6: "최적 전략"이 너무 명확하여 경영 판단의 여지가 적음**

현재 설계에서 최적 전략은 거의 항상:
1. 초기: 상추 반복 심기 (50코인 투자 -> 100~150코인 수확 = 100~200% ROI)
2. 중기: 플롯 확장 -> 더 많은 상추 -> 도구 업그레이드
3. 후기: 어려운 식물로 전환

이는 **"상추 스팸"이 항상 최고 효율**이라는 문제를 낳는다. 쉬운 식물의 ROI가 어려운 식물보다 높다:

```
상추: 50코인 투자 -> 100코인 수확 = ROI 100%  (25일 성장)
장미: 200코인 투자 -> 350코인 수확 = ROI 75%   (90일 성장)
난초: 300코인 투자 -> 350코인 수확 = ROI 17%   (180일 성장)

시간 대비 ROI (코인/일):
상추: (100-50)/25 = 2.0 코인/일
장미: (350-200)/90 = 1.67 코인/일
난초: (350-300)/180 = 0.28 코인/일
```

> **Required Action**: 어려운 식물의 수확 보상 재조정. 난이도별 기본 보상 수정 권장:
> ```
> easy:   100 coins (유지)
> medium: 300 coins (200 -> 300)
> hard:   600 coins (350 -> 600)
> ```
> 또는 **희귀 드롭 아이템** 시스템 추가: 어려운 식물 수확 시 희귀 비료/씨앗 드롭 확률 부여.

**ISSUE-7: 에너지 시스템이 사실상 비활성화 설계**

Section 10.2.5에서 에너지를 "사실상 무제한(100 energy, 10/hr regen)"으로 설정하겠다고 했다. 그러나 에너지 테이블과 컬럼을 만들어놓고 쓰지 않으면:
- 불필요한 DB 오버헤드
- 프론트엔드에 표시 여부 혼란
- "나중에 활성화"할 때 기존 유저 데이터 마이그레이션 이슈

> **Required Action**: 에너지 시스템을 Phase 2 스코프에서 완전히 제거. `user_resources` 테이블에서 energy 관련 컬럼 삭제. Phase 3에서 필요 시 migration으로 추가.

**ISSUE-8: 판매(Sell-back) 메커니즘이 경영 판단을 약화시킴**

50% 매도가는 단순하지만, 실질적으로 플레이어가 아이템을 파는 상황이 거의 없다:
- 씨앗: 심으면 소비됨, 팔 이유 없음
- 비료: 소모품, 팔 이유 없음
- 화분/장식: 더 좋은 것을 사면 이전 것을 팔겠지만, 빈도가 낮음
- 도구: 업그레이드형이므로 판매 불가

> **Recommendation**: 판매 시스템은 Phase 2에서 구현 우선순위를 낮추고, "화분/장식 교체 시 자동 환불(50%)" 로직만 구현. 독립 판매 API는 Phase 3으로 연기.

---

## 5. Detailed Review: (4) 자원 관리 & 도구 업그레이드 밸런스

### 5.1 물 탱크 밸런스 분석

```
Level 1: 용량 20, 회복 1.0/hr
  - 물주기 1회 = 2 유닛
  - 최대 10회 관수 가능
  - 4개 플롯을 각 2.5회 관수 가능
  - 빈 탱크 -> 만수: 20시간 (과도하게 느림)

Level 5: 용량 100, 회복 5.0/hr
  - 최대 50회 관수 가능
  - 9개 플롯에 충분히 여유
  - 빈 탱크 -> 만수: 20시간 (동일한 비율)
```

**ISSUE-9: Level 1 물 탱크가 너무 제한적**

4개 플롯에 하루 2~3회 관수 시, 하루 소비 = 16~24 유닛. Level 1 탱크(20 유닛, 24hr에 24 유닛 회복)로는 하루에 딱 한 사이클만 가능. 초반 플레이어가 "물이 없어서 할 수 있는 게 없다"는 상태에 빠질 위험.

하지만 기존 코드를 보면 `waterPlant`은 `amount: number = 1`로 설계되어 있어, 자원 시스템과 기존 water amount의 단위 정합성이 불명확하다.

> **Required Action**:
> 1. Level 1 물탱크 초기 용량을 30으로 상향, regen_rate를 2.0으로 상향
> 2. `waterPlant()`의 기존 `amount` 파라미터와 `RESOURCE_COSTS.water_per_manual_watering`의 관계를 명확히 문서화
> 3. 식물 종류별 물 소비량 차등 고려 (선인장 1유닛, 상추 2유닛, 몬스테라 3유닛 등)

### 5.2 도구 업그레이드 밸런스 분석

```
도구 업그레이드 총 투자 비용:
  물뿌리개:    0 + 500 + 1500 + 4000 + 10000 = 16,000 coins
  온실:        800 + 2000 + 5000 + 10000 + 20000 = 37,800 coins
  스프링클러:  1200 + 3000 + 7000 + 15000 + 30000 = 56,200 coins

총 도구 풀업그레이드: 110,000 coins
```

**ISSUE-10: 스프링클러 최대 업그레이드 비용이 비현실적**

Late Game 일수입 3000~4000 코인 기준, 스프링클러 풀업그레이드(56,200 코인)는 약 14~19일의 순수입이 필요. 이는 "자동화의 가치"에 비해 과도한 투자다. 특히 Level 5 스프링클러(30,000 코인)는 "모든 플롯 1시간마다 자동 관수"인데, 이 시점에서 플레이어는 이미 수동 관리에 익숙해져 있을 것이다.

> **Recommendation**: 스프링클러 비용을 30% 하향 조정하거나, Level 5 효과를 "자동 관수 + 최적 토양 수분 유지(overwatering 방지)" 등으로 차별화.

### 5.3 Greenhouse 효과의 실용성

현재 온실 효과는 "온도 스트레스 감소(tolerance range 내로 클램핑)"이다. 그러나 기존 `SimulationService`에서 온도는 사용자가 `adjustEnvironment`로 직접 설정하는 값이다. 사용자가 이미 최적 온도로 설정할 수 있다면, 온실의 보호 효과가 의미가 없다.

**ISSUE-11: 온실이 현재 게임 메커니즘에서 무의미**

> **Required Action**: 다음 중 하나를 선택:
> - **(A)** 랜덤 날씨 이벤트 시스템 추가 (한파, 폭염 등이 온도를 강제 변경) -> 온실이 이를 방어
> - **(B)** 온실 효과를 "성장 속도 보너스 + 건강도 회복 보너스"로 변경 (보호 -> 촉진)
> - **(C)** Phase 2에서 온실을 제거하고, 날씨 시스템과 함께 Phase 3에서 도입
>
> **권장: (B)** - 가장 적은 추가 작업으로 의미 있는 효과 제공

---

## 6. Detailed Review: (5) 구현 복잡도 & 스코프 합리성

### 6.1 파일 수 분석

```
현재 Phase 1 파일:  25 TypeScript files
Phase 2 신규 파일:  ~58 files (Backend 33 + Frontend 25)
Phase 2 수정 파일:  ~10 files

총 변경 범위: ~68 files across 8 weeks = ~8.5 files/week
```

### 6.2 복잡도 핫스팟

| Component | Complexity | Risk |
|-----------|-----------|------|
| `simulation.service.ts` 확장 | HIGH | 기존 성장률 계산에 bonus 체인 추가 시 regression 위험 |
| `sprinklerCron.ts` | HIGH | 분산 환경에서 중복 실행 방지, 대량 유저 시 성능 |
| Shop purchase 트랜잭션 | MEDIUM | 동시성 제어 (같은 유저가 동시 구매 시 race condition) |
| Resource regen 계산 | MEDIUM | 시간 기반 계산의 정밀도, 타임존 이슈 |
| Frontend state 관리 | HIGH | coins, resources, inventory, tools, garden 5개 도메인의 전역 상태 |

### 6.3 Scope Reduction Recommendations

**ISSUE-12: Phase 2 스코프가 8주 스프린트에 과도**

58개 신규 파일 + 10개 수정 파일을 8주에 구현하는 것은 공격적이다. 다음 항목을 Phase 3으로 연기 권장:

| Defer to Phase 3 | Reason |
|-------------------|--------|
| Leaderboard API & UI | 핵심 루프에 불필요, nice-to-have |
| Sell-back system (독립 API) | 사용 빈도 극히 낮음 |
| Energy system (전체) | 문서에서 이미 비활성화 권장 |
| Decoration adjacency bonus 계산 | 복잡한 그리드 인접 로직, 코어 없이 장식은 순수 cosmetic으로 |
| Transaction history UI | 백엔드 로깅은 유지, 프론트엔드 조회 UI는 연기 |

이렇게 하면 약 **10~12개 파일 절감**, Sprint 2.4 폴리시 기간을 확보할 수 있다.

### 6.4 기존 코드 수정 시 주의점

**A. `UserModel.addCoins()` 의 Race Condition**

현재 코드:
```typescript
async addCoins(id: string, amount: number): Promise<void> {
  await db('users').where({ id }).increment('coins', amount);
}
```

`increment`는 atomic하므로 DB 레벨에서는 안전하지만, `EconomyService.spendCoins()`에서 "잔액 확인 -> 차감"이 두 쿼리로 분리되면 race condition 발생 가능.

> **Required Action**: `spendCoins`를 반드시 트랜잭션 내에서 `SELECT ... FOR UPDATE` 또는 `WHERE coins >= amount` 조건부 UPDATE로 구현.

**B. `SimulationService.calculateGrowthRate()` 확장**

현재 시그니처:
```typescript
calculateGrowthRate(environment, plantEnvironment, baseGrowthRate = 1.0): number
```

마일스톤에서 제안하는 시그니처:
```typescript
calculateGrowthRate(environment, plantEnvironment, baseRate, plotBonuses, toolBonuses): number
```

> **Required Action**: 기존 호출부(`simulationCron.ts`, 테스트 코드)를 모두 업데이트해야 함. Optional parameter 패턴 사용 권장:
> ```typescript
> calculateGrowthRate(
>   environment, plantEnvironment, baseRate = 1.0,
>   plotBonuses?: PlotBonuses, toolBonuses?: ToolBonuses
> ): number
> ```

---

## 7. Risk Register (위험 요소 종합)

### Critical Risks

| ID | Risk | Probability | Impact | Mitigation |
|----|------|------------|--------|-----------|
| R1 | 상추 스팸 메타 (ISSUE-6) | HIGH | HIGH | 난이도별 보상 재조정, 동일 식물 연속 재배 시 토양 피로도(수확량 감소) 메커니즘 고려 |
| R2 | 온실 무의미 (ISSUE-11) | HIGH | MEDIUM | 온실 효과를 성장/건강 보너스로 변경 |
| R3 | 초반 물 부족 좌절감 (ISSUE-9) | MEDIUM | HIGH | Level 1 탱크 용량/회복 상향 |

### Moderate Risks

| ID | Risk | Probability | Impact | Mitigation |
|----|------|------------|--------|-----------|
| R4 | 스코프 초과로 8주 내 미완성 | MEDIUM | HIGH | Phase 3 연기 항목 확정 (ISSUE-12) |
| R5 | 코인 race condition (6.4.A) | LOW | HIGH | FOR UPDATE 또는 조건부 UPDATE 패턴 |
| R6 | Frontend 전역 상태 복잡도 | MEDIUM | MEDIUM | Zustand 도입, 도메인별 store 분리 |
| R7 | 문서 내 순서 불일치 혼란 (ISSUE-4) | LOW | MEDIUM | DAG/Sprint Plan 통일 |

---

## 8. Checklist: Required Actions Before Implementation

### Must Fix (구현 전 반드시 수정)

- [ ] **ISSUE-4**: DAG와 Implementation Order 통일 (Sprint Plan 기준)
- [ ] **ISSUE-5**: Migration 순번 재배정 (`02_economy_foundation.sql` 분리)
- [ ] **ISSUE-6**: 난이도별 수확 보상 재조정 (medium: 300, hard: 600)
- [ ] **ISSUE-7**: 에너지 시스템 Phase 2 스코프에서 제거
- [ ] **ISSUE-9**: Level 1 물탱크 초기값 상향 (용량 30, regen 2.0)
- [ ] **ISSUE-11**: 온실 효과를 "성장+건강 보너스"로 변경
- [ ] **ISSUE-1**: adjustEnvironment 코인 차감 수정 태스크 추가
- [ ] **ISSUE-2**: 수확 후 plot 상태 리셋 규칙 명시

### Should Fix (구현 중 반영 권장)

- [ ] **ISSUE-3**: Achievement를 밸런스 계산에서 제외
- [ ] **ISSUE-8**: 독립 판매 API를 Phase 3으로 연기
- [ ] **ISSUE-10**: 스프링클러 비용 30% 하향 또는 효과 차별화
- [ ] **ISSUE-12**: Leaderboard, TransactionHistory UI 등 Phase 3 연기

### Implementation Notes

- [ ] `spendCoins`에 `SELECT ... FOR UPDATE` 또는 조건부 UPDATE 적용
- [ ] `calculateGrowthRate` 시그니처를 Optional parameter 패턴으로 확장
- [ ] Frontend 상태 관리에 Zustand 도입 검토
- [ ] `simulationCron.ts`와 `simulation.service.test.ts`의 호출부 업데이트

---

## 9. Final Verdict

### CONDITIONAL APPROVAL

마일스톤 문서의 전체적 설계 방향과 아키텍처는 **승인**한다. Phase 1의 확장으로서 적절한 복잡도와 게임성을 제공하며, 기존 코드와의 호환성도 잘 고려되었다.

단, **Section 8의 "Must Fix" 8개 항목을 문서에 반영한 후** 구현에 착수해야 한다. 특히 다음 3가지가 핵심이다:

1. **경제 밸런스 수정** (상추 스팸 방지를 위한 난이도별 보상 재조정)
2. **에너지 시스템 제거** (불필요한 복잡도 축소)
3. **Migration 순서 정비** (M5-Core가 먼저 필요하므로 economy_foundation을 02번으로)

이 세 가지가 반영되면 즉시 Sprint 2.1 구현을 시작할 수 있다.

---

*Review completed: 2026-04-24*
