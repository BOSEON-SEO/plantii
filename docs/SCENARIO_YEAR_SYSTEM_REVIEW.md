# Plantii Step-2 설계 문서 검증 리포트
# 시나리오 & 년도 시스템 설계 (SCENARIO_YEAR_SYSTEM_DESIGN.md) Review

> **Reviewer**: AI Architect
> **Review Date**: 2026-04-24
> **Document Under Review**: `docs/SCENARIO_YEAR_SYSTEM_DESIGN.md` v1.0
> **Status**: CONDITIONAL APPROVAL (8개 필수 수정 사항 반영 후 구현 착수 가능)

---

## Review Summary

| # | 검증 항목 | 점수 | 판정 |
|---|----------|------|------|
| 1 | 모든 요구사항 포함 여부 (년도 시스템, 튜토리얼, 4개 목표 메트릭, 5단계 엔딩, 크레딧) | 9.0/10 | PASS |
| 2 | 3년차 종료 시 랭크 엔딩 분기 로직의 명확성 및 완전성 | 7.5/10 | CONDITIONAL |
| 3 | 튜토리얼 -> 메인 스토리 -> 엔딩 크레딧까지 완결된 플레이 사이클 가능성 | 8.5/10 | PASS |
| 4 | 기술적 타당성 및 구현 가능성 | 7.0/10 | CONDITIONAL |
| 5 | 개선 제안 및 최종 리뷰 점수 | - | 종합 아래 참조 |
| **종합** | | **8.0/10** | **CONDITIONAL APPROVAL** |

---

## 1. 모든 요구사항 포함 여부 (9.0/10) - PASS

### 1.1 요구사항 체크리스트

| 요구사항 | 포함 여부 | 문서 섹션 | 상세도 |
|----------|----------|----------|--------|
| 인게임 년도 시스템 | O | Section 2 | 매우 상세 - 시간 구조, 계절 시스템, 상태 머신, 데이터 구조 모두 포함 |
| 튜토리얼 시나리오 | O | Section 6 | 상세 - 5단계(T-1~T-5), 각 단계별 소요 시간, NPC 대사, 강제 행동, 시뮬레이션 가속 정의 |
| 4개 목표 메트릭 | **부분** | Section 4 | 3개 KPI(매출, 수집률, 만족도) + bonus_score. 문서 제목은 "3대 핵심 KPI"이나 실질적으로 4개 축 |
| 5단계 엔딩 (S/A/B/C/F) | O | Section 5 | 상세 - 점수 산출 공식, 분기 테이블, 특수 엔딩 4종, 엔딩 화면 레이아웃 |
| 엔딩 크레딧 | O | Section 7.3~7.4 | 상세 - 크레딧 롤 구성, 통계 요약, 수집 갤러리, 후일담, 데이터 구조 |
| NPC 캐릭터 | O | Section 3.3 | 4명 NPC (하나, 정 과장, 그린파크 원장, 방문객) 역할/기능 정의 |
| 이벤트 시스템 | O | Section 3.4 | 이벤트 데이터 구조, 트리거, 선택지, 효과 인터페이스 정의 |
| 계절 시스템 | O | Section 2.2 | 4계절별 기온/일조/습도 변동 + 특수 효과 테이블 |
| 주간 리포트 | O | Section 4.3 | WeeklyReport 인터페이스 상세 정의 |
| 년도 리뷰 | O | Section 4.4 | 7단계 리뷰 플로우 + 등급별 보상 체계 |
| 스토리 컷신 | O | Section 7.1~7.2 | 컷신 데이터 구조, 렌더링 엔진, 20개 컷신 인벤토리 |
| DB 스키마 | O | Section 9 | 5개 신규 테이블 + 정적 JSON 데이터 전략 |
| API 설계 | O | Section 10 | 4개 API 그룹, 14개 엔드포인트 |
| 프론트엔드 아키텍처 | O | Section 11 | 페이지/컴포넌트/스토어/훅 구조 상세 |
| 구현 로드맵 | O | Section 12 | 5개 스프린트, 에셋 요구사항, Phase 2 의존성 |

### 1.2 Strength

**A. 요구사항 커버리지가 매우 높다.**

년도 시스템, 튜토리얼, 엔딩, 크레딧이라는 핵심 4가지 요구사항이 모두 누락 없이 포함되어 있으며, 각각에 대해 데이터 구조(TypeScript 인터페이스), 비즈니스 로직, UI 레이아웃, 구현 태스크까지 일관되게 설계되었다.

**B. Phase 1 / Phase 2 코드 베이스와의 연결고리가 명확하다.**

- Section 1.1에서 Step-1 조사 결과(PROJECT_INVESTIGATION_REPORT.md)의 "전무" 상태를 정확히 인식
- Section 2.5에서 기존 `simulationCron.ts` 확장 전략 ("기존 시뮬레이션 + 주/계절/년 전환 체크")
- Section 8.3에서 기존 `simulation.service.ts`, `harvestPlant()` 수정을 최소화하는 전략

### 1.3 Issue

**ISSUE-1: "4개 목표 메트릭" 명칭이 불명확**

문서 Section 4.1 제목이 "3대 핵심 KPI"이나, 실제 최종 평가(Section 5.1)에서는 `revenue_score(35%) + collection_score(30%) + satisfaction_score(25%) + bonus_score(10%)` 4개 축으로 계산한다. 명확하게 **4대 평가 축**으로 명시해야 독자의 혼란을 방지한다.

또한 `garden_beauty_score`가 `YearlySnapshot`에 포함되어 있으나(Section 2.4, line 176), 최종 평가 공식에서는 사용되지 않는다. 이 필드가 방문객 수 계산의 중간 변수(`garden_beauty_multiplier`, Section 4.1.1)로만 쓰이는 것인지, 독립 KPI인지 불분명하다.

> **Required Action**: Section 4.1 제목을 "4대 평가 축 (3 KPI + Bonus)"으로 변경. `garden_beauty_score`의 역할을 명확히 문서화 (중간 변수이면 `YearlySnapshot`에서 제거하거나 주석 추가).

---

## 2. 3년차 종료 시 랭크 엔딩 분기 로직의 명확성 및 완전성 (7.5/10) - CONDITIONAL

### 2.1 Strengths

**A. 최종 점수 산출 공식이 수학적으로 명확하다.**

```
final_score = (revenue_score * 0.35) + (collection_score * 0.30)
            + (satisfaction_score * 0.25) + (bonus_score * 0.10)
```

4개 축의 가중치 합계가 정확히 1.00이며, 각 구성 요소의 0~100 정규화 공식이 모두 제시되어 있다.

**B. 랭크 분기 테이블이 간결하고 명확하다.**

S(>=90), A(>=75), B(>=55), C(>=35), F(<35)의 구간이 겹침 없이 완전하게 정의되어 있다.

**C. 특수 엔딩이 리플레이 동기를 잘 부여한다.**

True Ending(S+), Speedrun Ending, Collector Ending, Merchant Ending 4종의 특수 엔딩이 다양한 플레이 스타일에 보상을 제공한다.

### 2.2 Issues

**ISSUE-2: S등급 이중 조건의 모호성**

Section 5.3의 S등급 조건:
```
S: final_score >= 90 AND 수집률 >= 93% (14종+)
```

`final_score >= 90`만 달성하고 수집률이 93% 미만인 경우 어떤 랭크를 받는지 불명확하다. `final_score = 92`이고 `collection_rate = 80%`이면 S? A?

논리적으로 A가 되어야 하지만, Section 5.3 테이블에서 A의 조건이 `final_score 75~89`로 명시되어 있어, 점수 90+인데 수집률 미달인 경우가 어느 랭크에도 속하지 않는 **공백 구간**이 발생한다.

> **Required Action**: S등급 판정 로직을 명확히 재정의:
> ```
> if (final_score >= 90 AND collection_rate >= 93%): RANK_S
> else if (final_score >= 75): RANK_A     // <-- 75~89 -> 90+ 수집률 미달도 포함
> else if (final_score >= 55): RANK_B
> else if (final_score >= 35): RANK_C
> else: RANK_F
> ```
> A등급 범위를 `final_score >= 75` (상한 없음)로 수정하여 S 조건 미충족 시 A로 fallback.

**ISSUE-3: 특수 엔딩 우선순위 충돌 가능성**

Section 5.4에서 특수 엔딩의 우선순위가 불완전하다:

| 특수 엔딩 | 우선순위 |
|----------|---------|
| True Ending (S+) | 최우선 |
| Speedrun Ending | S등급보다 우선 |
| Collector Ending | 해당 등급에 변형 적용 |
| Merchant Ending | 해당 등급에 변형 적용 |

"최우선"과 "S등급보다 우선"의 상대적 관계는 명확하나, 다음 시나리오의 처리가 불분명하다:
- Speedrun 조건과 True Ending 조건을 동시에 충족하면? (True Ending이 최우선이므로 True Ending)
- Collector와 Merchant를 동시에 충족하면? (매출 150,000+이면서 15종 전부 수집이면 S등급일 확률이 높아 해당 없을 수 있으나, 만족도가 낮아 B등급이면?)
- Speedrun 조건 충족 + Collector 조건 충족이면?

> **Required Action**: 특수 엔딩 판정을 명시적 우선순위 체인으로 재정의:
> ```
> 1. True Ending 조건 체크 -> 충족 시 True Ending
> 2. Speedrun Ending 조건 체크 -> 충족 시 Speedrun Ending
> 3. 일반 랭크 판정 (S/A/B/C/F)
> 4. Collector/Merchant는 일반 랭크에 대한 "변형 레이블" (랭크 변경 없음, 엔딩 텍스트만 변경)
> ```

**ISSUE-4: 보너스 점수의 최대값이 100을 초과할 수 있는 설계**

Section 5.2 보너스 항목 합산:
```
무사망(15) + 올시즌(10) + 속도(10) + 경제달인(10) + 다양성(10) + 이벤트(10) + 완벽수확(15) + 라이벌승리(20) = 100
```

`bonus_score = min(100, 합산)`으로 cap 처리하므로 수학적으로는 문제없으나, 모든 보너스를 달성해도 정확히 100이므로 cap이 사실상 의미가 없다. 그러나 향후 보너스 항목이 추가되면 cap이 활성화된다. 이 의도가 맞는지 명시 필요.

> **Recommendation**: 보너스 합계가 정확히 100인 것이 의도적임을 주석으로 명시. 향후 확장 시 cap이 동작하도록 설계한 것이라면 OK.

**ISSUE-5: 년도별 등급 산출 기준 누락**

Section 4.4에서 "년도 리뷰 시 S/A/B/C/F 등급 부여"를 언급하고 보상까지 정의했으나, **년도별 등급 산출 공식**은 명시되지 않았다. Section 5.1~5.3의 공식은 "최종 평가(3년차 종료)"에만 적용된다.

Year 1, Year 2의 리뷰에서 등급은 어떻게 산출되는가? Section 4.2의 년도별 목표(매출/수집률/만족도)를 기준으로 하는 것으로 추정되나, 구체적 공식이 없다.

> **Required Action**: 년도별 등급 산출 공식을 추가:
> ```
> yearly_rank_score = (revenue_vs_target * 0.40) + (collection_vs_target * 0.30) + (satisfaction_vs_target * 0.30)
>
> S: yearly_rank_score >= 120% (목표 초과 달성)
> A: yearly_rank_score >= 100%
> B: yearly_rank_score >= 70%
> C: yearly_rank_score >= 40%
> F: yearly_rank_score < 40%
> ```

---

## 3. 튜토리얼 -> 메인 스토리 -> 엔딩 크레딧 완결 플레이 사이클 (8.5/10) - PASS

### 3.1 플레이 사이클 추적

```
[NEW GAME] -> [TUTORIAL (10~15분)]
  T-1: 첫 만남 (2분) - 배경 스토리 + UI 설명
  T-2: 첫 심기 (3분) - 씨앗 구매, 심기, 환경 조절, 물주기
  T-3: 성장 관찰 (3분) - 시간 가속, 성장 단계, 건강도
  T-4: 첫 수확 (3분) - 수확, 보상, 도감
  T-5: 목표 확인 (2분) - 정 과장 등장, KPI 목표, 튜토리얼 종료

-> [YEAR 1] (52주/52일)
  봄: 기본 식물 심기 시작
  여름: 첫 수확, 정 과장 1차 방문 컷신
  가을: 첫 방문객, 소문 확산
  겨울: 한파 이벤트 (위기)
  리뷰: Y1 평가 -> 등급 + 보상 + Y2 목표 통보

-> [YEAR 2] (52주/52일)
  봄: 확장 기회
  여름: 라이벌 등장 컷신
  가을: 희귀 식물 이벤트
  겨울: 전시회 이벤트
  리뷰: Y2 평가

-> [YEAR 3] (52주/52일)
  봄: 최종 확장
  여름: 콘테스트 예선
  가을: 라이벌 최종 대결
  겨울: 마지막 준비
  리뷰: Y3 최종 평가

-> [FINAL EVALUATION] -> [ENDING (S/A/B/C/F)] -> [CREDITS] -> [POST_GAME / NEW GAME+]
```

### 3.2 Strengths

**A. 완전한 사이클이 달성 가능하다.**

NEW GAME에서 CREDITS까지 빠짐없이 이어지는 경로가 존재하며, 중간에 플레이어가 "다음에 뭘 해야 하지?"라고 묘야할 지점이 없다. 매 주 주간 리포트, 매 계절 스토리 이벤트, 매 년 리뷰가 지속적 피드백을 제공한다.

**B. 튜토리얼에서 메인 게임으로의 전환이 자연스럽다.**

T-5에서 정 과장이 "1년 후에 다시 오겠소"라고 말하며 Year 1 목표를 통보하는 장면이 내러티브적 전환점으로서 잘 기능한다. 튜토리얼 종료 보상(씨앗 + 칭호)이 즉시 메인 게임에서 사용 가능하다.

**C. 크레딧이 단순 목록이 아니라 "플레이 회고" 경험이다.**

"3년간의 기록" 통계, "나의 정원" 스크린샷, "수집한 식물들" 갤러리가 크레딧 롤에 포함되어 플레이어의 여정을 되돌아보게 한다. 후일담 텍스트(랭크별 분기)가 감정적 마무리를 제공한다.

**D. NEW GAME+ 시 튜토리얼 스킵이 고려되었다.**

2회차 플레이 시 스킵 옵션 + 동일 보상 지급으로 리플레이 마찰을 최소화한다.

### 3.3 Issues

**ISSUE-6: 실시간 156일(~5.2개월) 플레이타임의 유저 이탈 위험**

전체 게임 사이클이 실시간 156일(약 5.2개월)이다. 모바일/캐주얼 게임 기준으로 매우 긴 사이클이며, Day 30 이후 유저 잔존율이 급격히 감소할 수 있다.

특히 겨울(40~52주)은 "전체 성장률 -30%"로 게임이 느려지는데, 이 시기에 이탈 위험이 가장 높다.

> **Required Action**: 다음 중 최소 하나를 도입:
>
> **(A) 시간 압축 옵션**: "빠른 모드"에서 실시간 12시간 = 인게임 1주 (총 78일로 단축)
>
> **(B) 겨울 콘텐츠 강화**: 겨울에만 가능한 고유 이벤트(실내 전시회, 겨울 꽃 시장 등)를 추가하여 성장률 감소의 지루함을 상쇄
>
> **(C) 중간 저장 & 복귀 인센티브**: 장기 미접속 유저가 복귀 시 "하나가 정원을 관리해줬어요" 메시지 + 식물 사망 방지 + 복귀 보너스

**ISSUE-7: Year 1에서 F등급 시 게임 오버 여부 불명확**

Section 4.4에서:
```
F등급: 0 coins + "폐쇄 경고" 컷신 (3년차 F는 BAD END)
```

Year 1 또는 Year 2에서 F등급을 받으면 어떻게 되는가?
- "폐쇄 경고" 컷신만 재생하고 계속 진행?
- 즉시 게임 오버?
- Year 2에서 F를 받으면 Year 3에서 만회 가능?

상태 머신(Section 2.3)에서는 `YEAR_1_REVIEW -> YEAR_2_SPRING`으로 무조건 진행하는 것으로 보이나, F등급 시의 분기가 명시되지 않았다.

> **Required Action**: Year 1/Year 2의 F등급 처리를 명시:
> ```
> Year 1 F등급: "폐쇄 경고" 컷신 + 계속 진행 (만회 기회)
> Year 2 F등급: "최후 통첩" 컷신 + 계속 진행 (마지막 기회)
> Year 3 F등급: BAD END (게임 종료)
>
> 선택적: Year 1+2 연속 F등급 시 Year 2 종료 후 즉시 BAD END
> ```

---

## 4. 기술적 타당성 및 구현 가능성 (7.0/10) - CONDITIONAL

### 4.1 Strengths

**A. 기존 아키텍처 확장 전략이 건전하다.**

기존 `simulation.service.ts`의 `calculateGrowthRate()`를 수정하지 않고, `SeasonService`에서 환경 값을 **전처리**하여 전달하는 전략(Section 8.3.2)은 기존 로직의 regression 위험을 최소화한다. 이는 Phase 2 리뷰(MILESTONE_REVIEW_REPORT.md)에서 제기된 시뮬레이션 수정 위험을 잘 해소한다.

**B. 정적 데이터를 JSON 파일로 관리하는 전략이 적절하다.**

컷신/이벤트 데이터를 DB가 아닌 JSON으로 관리하는 결정(Section 9.2)은:
- Git 버전 관리로 변경 이력 추적 가능
- 서버 시작 시 메모리 로드로 DB 쿼리 없이 즉시 접근
- 콘텐츠 작성자가 DB 접근 없이 수정 가능

**C. DB 스키마가 정규화되어 있고 제약조건이 적절하다.**

- `game_sessions`의 `UNIQUE (user_id) WHERE (is_active = true)` 부분 인덱스로 사용자당 활성 세션 1개 제약
- `yearly_snapshots`의 `UNIQUE(session_id, year)`로 중복 스냅샷 방지
- `weekly_reports`의 `UNIQUE(session_id, year, week)`로 중복 리포트 방지
- CHECK 제약조건으로 `current_year BETWEEN 1 AND 3`, `current_week BETWEEN 1 AND 52` 범위 보장

### 4.2 Issues

**ISSUE-8: `simulationCron.ts` 확장의 성능 병목 위험**

Section 8.3.1에서:
```typescript
const activeSessions = await GameSessionModel.findAllActive();
for (const session of activeSessions) {
  // ... 매시간 모든 활성 세션 순회
}
```

기존 `simulationCron`은 이미 모든 활성 식물을 매시간 순회한다. 여기에 "모든 활성 게임 세션"까지 순회하면, 사용자 수가 증가할 때 크론 실행 시간이 선형 증가한다.

또한 `session.tick_count % 24 === 0` 체크 후 `advanceTime()`을 호출하면, 24시간마다 모든 세션에 대해 주간 처리(리포트 생성, 이벤트 체크, 계절/년 전환 등)가 동시에 발생하는 **thundering herd** 문제가 발생한다.

> **Required Action**:
> 1. `findAllActive()`에 배치 처리(pagination) 도입: `LIMIT 100 OFFSET n`
> 2. tick_count를 세션 생성 시각 기반으로 분산: `tick_count = (now - created_at) / 1hr`
> 3. `advanceTime()` 내부의 무거운 작업(리포트 생성)은 비동기 큐로 분리 고려

**ISSUE-9: 컷신 시스템의 프론트엔드 에셋 의존성이 과도**

Section 12.3 에셋 요구사항:
```
배경 이미지: 12장
NPC 스프라이트: 11장 (3인 x 표정)
엔딩 일러스트: 6장
UI 아이콘: 12개
총: ~41개 그래픽 에셋
```

이 에셋들이 없으면 컷신 시스템이 기능하지 않는다. Sprint 3.3에서 컷신 구현과 에셋 제작을 동시에 진행해야 하는데, 에셋이 지연되면 전체 스프린트가 블록된다.

> **Required Action**: 에셋 의존성을 decouple:
> 1. 플레이스홀더 에셋 전략 수립: 단색 배경 + 텍스트 라벨로 우선 구현
> 2. 컷신 데이터에 `fallback_color` 필드 추가 (에셋 미로드 시 대체 표시)
> 3. 에셋 제작을 별도 트랙으로 분리하여 Sprint 3.3~3.5에 걸쳐 점진적 교체

**ISSUE-10: Phase 2 의존성의 구현 순서 위험**

Section 12.4에서 Phase 2 선행 의존성:
```
M1: Garden Grid   - 필수
M5-Core: Economy  - 필수
M4: Resource      - 권장
M2: Shop          - 권장
```

그러나 MILESTONE_REVIEW_REPORT.md에서 Phase 2 자체가 8주 스프린트이며, "CONDITIONAL APPROVAL"(필수 수정 8개 항목 반영 후 구현 착수)이다. Phase 2가 완료되지 않으면 Phase 3(본 문서)는 시작할 수 없다.

문서에서는 Phase 2 완료를 전제하지만, Phase 2가 지연되거나 스코프가 축소될 경우의 **대체 경로**가 정의되지 않았다.

> **Required Action**: Phase 2 부분 완료 시의 최소 실행 가능 경로(MVP Path) 정의:
> ```
> MVP Path: M1(Garden Grid) + M5-Core(Economy) 만 완료되면 Phase 3 착수 가능
>   - 매출 KPI: harvestPlant() 보상만으로 계산 (방문객 입장료는 간소화)
>   - 수집률: 기존 harvestPlant()의 plant_id 기반으로 계산 가능
>   - 만족도: garden_health_avg + species_diversity 2개 요인만으로 간소화
>   - 자원/도구 없이도 기본 게임 루프 동작
> ```

**ISSUE-11: `SeasonService` 환경 전처리의 부작용 가능성**

Section 8.3.2에서:
```typescript
const adjustedEnvironment = {
  temperature: (userPlant.temperature || 20) + seasonModifiers.temperature_offset,
  // ...
};
```

기존 `adjustEnvironment` API로 사용자가 직접 설정한 온도에 계절 offset이 **추가**된다. 이는 사용자가 "20도로 설정했는데 겨울에는 실제 5~12도가 된다"는 의미이다.

이 메커니즘이 맞다면 (야외 정원 콘셉트), 사용자에게 **현재 유효 온도**(계절 반영 후)를 표시해야 한다. 그렇지 않으면 사용자는 "20도로 설정했는데 왜 식물이 얼어 죽지?" 혼란을 겪는다.

> **Required Action**:
> 1. 프론트엔드에 "설정 온도"와 "실제 유효 온도(계절 반영)" 이중 표시
> 2. 또는 `adjustEnvironment` API 응답에 `effective_temperature` 필드 추가
> 3. 온실(Greenhouse)이 Phase 2에서 구현되면, 온실 보호 플롯은 계절 offset 감소

**ISSUE-12: GamePhase 상태 머신의 전환 트리거 로직 부재**

Section 2.4에서 `GamePhase` 타입이 17개 상태를 정의하지만, **상태 전환 규칙(transition rules)**이 코드 수준에서 정의되지 않았다. Section 2.3의 다이어그램은 시각적이나, 구현 시 필요한 것은:

```typescript
// 이런 명시적 전환 맵이 필요
const PHASE_TRANSITIONS: Record<GamePhase, { next: GamePhase; condition: string }> = {
  'tutorial': { next: 'year_1_spring', condition: 'tutorial_completed === true' },
  'year_1_spring': { next: 'year_1_summer', condition: 'current_week > 13' },
  // ...
};
```

> **Required Action**: 상태 전환 맵을 TypeScript 상수로 명시. 각 전환의 trigger condition(주차 기반, 이벤트 기반)을 코드 레벨에서 정의.

---

## 5. 개선 제안 및 최종 리뷰 점수

### 5.1 Must Fix (구현 전 반드시 수정) - 8건

| ID | 이슈 | 영향도 | 수정 난이도 |
|----|------|--------|-----------|
| ISSUE-1 | "4대 평가 축" 명칭 정리 + garden_beauty_score 역할 명확화 | LOW | 문서 수정만 |
| ISSUE-2 | S등급 이중 조건의 공백 구간 해소 (A 범위 확장) | HIGH | 문서 수정만 |
| ISSUE-5 | 년도별 등급 산출 공식 추가 | HIGH | 공식 추가 필요 |
| ISSUE-7 | Year 1/2 F등급 처리 규칙 명시 | HIGH | 문서 수정만 |
| ISSUE-8 | simulationCron 성능 병목 대응 (배치/분산) | MEDIUM | 설계 보강 |
| ISSUE-11 | 계절 온도 offset의 유효 온도 표시 전략 | MEDIUM | UI 설계 추가 |
| ISSUE-12 | GamePhase 상태 전환 맵 코드 레벨 정의 | HIGH | 상수 추가 |
| ISSUE-3 | 특수 엔딩 우선순위 체인 명시 | MEDIUM | 문서 수정만 |

### 5.2 Should Fix (구현 중 반영 권장) - 4건

| ID | 이슈 | 영향도 | 수정 난이도 |
|----|------|--------|-----------|
| ISSUE-4 | 보너스 점수 cap 의도 주석 추가 | LOW | 문서 수정만 |
| ISSUE-6 | 156일 플레이타임 이탈 대응 (빠른 모드 또는 겨울 콘텐츠 강화) | HIGH | 설계 추가 |
| ISSUE-9 | 에셋 의존성 decouple (플레이스홀더 전략) | MEDIUM | 구현 전략 추가 |
| ISSUE-10 | Phase 2 부분 완료 시 MVP 경로 정의 | MEDIUM | 설계 추가 |

### 5.3 추가 개선 제안

**제안 1: "라이벌 대결" 메커니즘의 구체화**

Year 3 가을의 "그린파크 대결"이 보너스 점수 20점의 핵심 이벤트이나, 대결의 구체적 메커니즘(무엇으로 승패를 결정하는지)이 정의되지 않았다. 다음과 같은 구체화 권장:

```
라이벌 대결 판정:
  player_score = (garden_beauty_score * 0.4) + (collection_rate * 0.3) + (satisfaction * 0.3)
  rival_score = 년도별 고정값 (Y3: 70점)
  승리 조건: player_score > rival_score
```

**제안 2: 데이터 무결성을 위한 "게임 세션 복구" 메커니즘**

서버 다운, 크론 미실행 등으로 `tick_count`가 누락될 경우의 복구 로직이 필요하다:

```typescript
// 서버 재시작 시 실행
async recoverSessions() {
  const sessions = await GameSessionModel.findAllActive();
  for (const session of sessions) {
    const missedHours = Math.floor((Date.now() - session.last_tick_at) / 3600000);
    if (missedHours > 1) {
      // 누락된 시간만큼 catch-up 시뮬레이션
      await this.catchUpSimulation(session.id, missedHours);
    }
  }
}
```

**제안 3: 밸런스 시뮬레이터 도구**

최종 점수 산출 공식의 밸런스를 검증하기 위해, 다양한 플레이 시나리오를 시뮬레이션하는 스크립트를 Sprint 3.5(Polish) 이전에 작성 권장:

```
시뮬레이션 케이스:
  - "상추만 심기": easy 식물만 3년 -> 예상 final_score?
  - "올라운더": 균형 잡힌 플레이 -> 예상 final_score?
  - "수집가": 15종 전부 도전, 매출 소홀 -> 예상 final_score?
  - "상인": 고수익 식물 집중, 수집 소홀 -> 예상 final_score?
  - "최적 플레이": 가능한 최대 점수 -> S+ 도달 가능?
```

### 5.4 Phase 2 리뷰 결과와의 정합성 확인

MILESTONE_REVIEW_REPORT.md에서 제기된 핵심 이슈와의 연결:

| Phase 2 리뷰 이슈 | Phase 3 설계에서의 대응 | 상태 |
|-------------------|----------------------|------|
| ISSUE-6: 상추 스팸 메타 | 년도 시스템에서 수집률 KPI(30%)가 다양성을 강제. 단일 식물만으로는 수집률 미달 | 부분 해소 |
| ISSUE-7: 에너지 시스템 비활성화 | Phase 3 문서에서 에너지 언급 없음. 자연스럽게 제외됨 | OK |
| ISSUE-9: Level 1 물탱크 부족 | 계절 시스템의 "수분 증발 +30%(여름)" 등이 물 관리 압박 추가. 물탱크 밸런스와 연동 필요 | 추가 검토 필요 |
| ISSUE-11: 온실 무의미 | 계절 온도 offset이 도입되면 온실이 의미를 가짐 (겨울 -8~15도 offset 방어) | 자연 해소 |

> **핵심 발견**: Phase 3의 계절 시스템이 Phase 2 리뷰에서 "무의미"로 판정된 온실(Greenhouse)에 존재 이유를 부여한다. 계절 온도 offset이 존재하면 온실의 "tolerance range 클램핑" 효과가 실질적 가치를 갖는다. 이는 Phase 2 리뷰의 ISSUE-11을 재평가할 근거가 된다.

---

## 6. 최종 판정

### CONDITIONAL APPROVAL

| 영역 | 점수 | 코멘트 |
|------|------|--------|
| 요구사항 커버리지 | 9.0/10 | 거의 완전. 메트릭 명칭 정리만 필요 |
| 엔딩 분기 로직 | 7.5/10 | 공식 명확하나 엣지케이스(S등급 공백, 특수 엔딩 충돌, 년도별 등급) 보완 필요 |
| 플레이 사이클 완결성 | 8.5/10 | 튜토리얼~크레딧까지 완전한 사이클. 156일 이탈 위험만 대응 필요 |
| 기술적 타당성 | 7.0/10 | 아키텍처는 건전하나 성능(크론), 에셋 의존성, 상태 전환 로직 보강 필요 |
| **종합** | **8.0/10** | **CONDITIONAL APPROVAL** |

### 구현 착수 조건

**Must Fix 8건**을 설계 문서에 반영한 후 Sprint 3.1 착수 가능. 특히 다음 3가지가 핵심:

1. **엔딩 분기 로직 완전성** (ISSUE-2, 3, 5, 7): S등급 공백 해소, 특수 엔딩 우선순위 명시, 년도별 등급 공식 추가, F등급 처리 규칙 - 이 4개가 모두 해결되어야 엔딩 시스템 구현이 가능
2. **GamePhase 상태 전환 맵** (ISSUE-12): 17개 상태의 전환 규칙이 코드 레벨에서 정의되어야 Sprint 3.1의 `GameSessionService` 구현이 가능
3. **성능 설계 보강** (ISSUE-8): 크론 배치 처리 + thundering herd 방지 전략이 없으면 다중 사용자 환경에서 문제 발생

Should Fix 4건은 스프린트 진행 중 반영 가능하며, 특히 ISSUE-6(156일 이탈 대응)은 Sprint 3.5(Polish)에서 밸런스 테스트와 함께 처리 권장.

---

*Review completed: 2026-04-24*
