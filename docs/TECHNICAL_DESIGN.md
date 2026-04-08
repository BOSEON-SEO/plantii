# Plantii Phase 1 - 상세 기술 설계 문서

> **버전**: 1.0  
> **작성일**: 2026-04-08  
> **프로젝트**: Plantii - 디지털 식물 육성 시뮬레이션 플랫폼

---

## 📋 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [식물 데이터 모델](#2-식물-데이터-모델)
3. [데이터베이스 스키마](#3-데이터베이스-스키마)
4. [REST API 명세](#4-rest-api-명세)
5. [시뮬레이션 엔진 설계](#5-시뮬레이션-엔진-설계)
6. [프로젝트 구조 및 아키텍처](#6-프로젝트-구조-및-아키텍처)
7. [기술 스택](#7-기술-스택)
8. [배포 전략](#8-배포-전략)

---

## 1. 프로젝트 개요

### 1.1 비전
Plantii는 실제 식물 재배 데이터를 기반으로 한 디지털 식물 육성 시뮬레이션 플랫폼입니다. 사용자는 가상 환경에서 식물을 키우며 실제 원예 지식을 습득합니다.

### 1.2 Phase 1 목표
- ✅ 15종의 실제 식물 데이터 구현
- ✅ 환경 변수 기반 실시간 시뮬레이션 엔진
- ✅ RESTful API 기반 백엔드
- ✅ 사용자 인증 및 식물 관리 시스템
- ✅ 성장 단계별 상태 변화 및 시각화 데이터

### 1.3 핵심 기능
- **식물 선택 및 심기**: 15종 중 선택, 초기 환경 설정
- **환경 조절**: 온도, 습도, 광량, 물 공급 조절
- **실시간 시뮬레이션**: 시간 경과에 따른 성장률 계산
- **상태 모니터링**: 건강도, 성장 단계, 스트레스 지표
- **수확 및 보상**: 성공적 재배 시 포인트/업적 획득

---

## 2. 식물 데이터 모델

### 2.1 식물 카탈로그 (15종)

#### 엽채류 (Leafy Greens) - 4종

##### 🥬 1. 상추 (Lettuce)
```json
{
  "id": "lettuce",
  "name_ko": "상추",
  "name_en": "Lettuce",
  "name_scientific": "Lactuca sativa",
  "category": "leafy",
  "difficulty": "easy",
  "environment": {
    "temperature": {
      "optimal_min": 15,
      "optimal_max": 20,
      "tolerance_min": 7,
      "tolerance_max": 24,
      "critical_min": -7,
      "critical_max": 30,
      "stress_threshold": 2,
      "unit": "celsius"
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 70,
      "tolerance_min": 40,
      "tolerance_max": 75,
      "unit": "percentage"
    },
    "light": {
      "dli_min": 12,
      "dli_optimal": 14,
      "dli_max": 17,
      "ppfd_min": 200,
      "ppfd_max": 400,
      "unit": "mol_m2_day"
    },
    "water": {
      "frequency_days": 2,
      "soil_moisture_min": 60,
      "soil_moisture_max": 80,
      "unit": "percentage_field_capacity"
    }
  },
  "growth": {
    "germination_days": 7,
    "harvest_days_min": 25,
    "harvest_days_max": 60,
    "growth_stages": [
      { "stage": "seed", "duration_days": 0, "icon": "seed" },
      { "stage": "sprout", "duration_days": 7, "icon": "sprout" },
      { "stage": "seedling", "duration_days": 14, "icon": "seedling" },
      { "stage": "vegetative", "duration_days": 21, "icon": "young_plant" },
      { "stage": "mature", "duration_days": 25, "icon": "mature_lettuce" },
      { "stage": "harvestable", "duration_days": 60, "icon": "harvest_ready" }
    ],
    "growth_rate_base": 1.0
  },
  "stress_factors": {
    "bolting": {
      "trigger_temperature": 24,
      "effect": "premature_flowering",
      "health_penalty": -0.5
    },
    "frost": {
      "trigger_temperature": -7,
      "effect": "damage",
      "health_penalty": -2.0
    }
  },
  "rewards": {
    "base_experience": 50,
    "optimal_harvest_bonus": 25,
    "coins": 100
  }
}
```

##### 🌿 2. 시금치 (Spinach)
```json
{
  "id": "spinach",
  "name_ko": "시금치",
  "name_en": "Spinach",
  "name_scientific": "Spinacia oleracea",
  "category": "leafy",
  "difficulty": "medium",
  "environment": {
    "temperature": {
      "optimal_min": 10,
      "optimal_max": 15,
      "tolerance_min": 7,
      "tolerance_max": 21,
      "critical_min": -9,
      "critical_max": 24,
      "stress_threshold": 2
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 75,
      "tolerance_min": 50,
      "tolerance_max": 80
    },
    "light": {
      "dli_min": 12,
      "dli_optimal": 14,
      "dli_max": 17,
      "ppfd_min": 200,
      "ppfd_max": 250
    },
    "water": {
      "frequency_days": 3,
      "soil_moisture_min": 70,
      "soil_moisture_max": 80
    }
  },
  "growth": {
    "germination_days": 8,
    "harvest_days_min": 40,
    "harvest_days_max": 60,
    "growth_stages": [
      { "stage": "seed", "duration_days": 0 },
      { "stage": "sprout", "duration_days": 8 },
      { "stage": "seedling", "duration_days": 18 },
      { "stage": "vegetative", "duration_days": 30 },
      { "stage": "mature", "duration_days": 40 },
      { "stage": "harvestable", "duration_days": 60 }
    ],
    "growth_rate_base": 0.9
  },
  "stress_factors": {
    "bolting": {
      "trigger_temperature": 21,
      "trigger_light_hours": 14,
      "effect": "premature_flowering",
      "health_penalty": -0.6
    }
  },
  "rewards": {
    "base_experience": 60,
    "optimal_harvest_bonus": 30,
    "coins": 120
  }
}
```

##### 🥦 3. 케일 (Kale)
```json
{
  "id": "kale",
  "name_ko": "케일",
  "name_en": "Kale",
  "name_scientific": "Brassica oleracea var. acephala",
  "category": "leafy",
  "difficulty": "medium",
  "environment": {
    "temperature": {
      "optimal_min": 15,
      "optimal_max": 18,
      "tolerance_min": 4,
      "tolerance_max": 24,
      "critical_min": -15,
      "critical_max": 30
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 60,
      "tolerance_min": 40,
      "tolerance_max": 75
    },
    "light": {
      "dli_min": 14,
      "dli_optimal": 17,
      "dli_max": 20,
      "ppfd_min": 200,
      "ppfd_max": 400
    },
    "water": {
      "frequency_days": 4,
      "soil_moisture_min": 70,
      "soil_moisture_max": 80
    }
  },
  "growth": {
    "germination_days": 7,
    "harvest_days_min": 84,
    "harvest_days_max": 140,
    "growth_stages": [
      { "stage": "seed", "duration_days": 0 },
      { "stage": "sprout", "duration_days": 7 },
      { "stage": "seedling", "duration_days": 35 },
      { "stage": "vegetative", "duration_days": 60 },
      { "stage": "mature", "duration_days": 84 },
      { "stage": "harvestable", "duration_days": 140 }
    ],
    "growth_rate_base": 0.6
  },
  "rewards": {
    "base_experience": 120,
    "optimal_harvest_bonus": 60,
    "coins": 250
  }
}
```

##### 🥬 4. 청경채 (Bok Choy)
```json
{
  "id": "bokchoy",
  "name_ko": "청경채",
  "name_en": "Bok Choy",
  "name_scientific": "Brassica rapa subsp. chinensis",
  "category": "leafy",
  "difficulty": "easy",
  "environment": {
    "temperature": {
      "optimal_min": 18,
      "optimal_max": 20,
      "tolerance_min": -3,
      "tolerance_max": 35,
      "critical_min": -5,
      "critical_max": 38
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 70,
      "tolerance_min": 40,
      "tolerance_max": 75
    },
    "light": {
      "dli_min": 12,
      "dli_optimal": 14,
      "dli_max": 17,
      "ppfd_min": 300,
      "ppfd_max": 450
    },
    "water": {
      "frequency_days": 2,
      "soil_moisture_min": 65,
      "soil_moisture_max": 80
    }
  },
  "growth": {
    "germination_days": 8,
    "harvest_days_min": 25,
    "harvest_days_max": 50,
    "growth_stages": [
      { "stage": "seed", "duration_days": 0 },
      { "stage": "sprout", "duration_days": 8 },
      { "stage": "seedling", "duration_days": 15 },
      { "stage": "vegetative", "duration_days": 25 },
      { "stage": "mature", "duration_days": 40 },
      { "stage": "harvestable", "duration_days": 50 }
    ],
    "growth_rate_base": 1.1
  },
  "rewards": {
    "base_experience": 55,
    "optimal_harvest_bonus": 28,
    "coins": 110
  }
}
```

#### 과채류 (Fruiting Vegetables) - 6종

##### 🍅 5. 토마토 (Tomato)
```json
{
  "id": "tomato",
  "name_ko": "토마토",
  "name_en": "Tomato",
  "name_scientific": "Solanum lycopersicum",
  "category": "fruiting",
  "difficulty": "hard",
  "environment": {
    "temperature": {
      "optimal_min": 20,
      "optimal_max": 25,
      "optimal_night_min": 13,
      "optimal_night_max": 18,
      "tolerance_min": 10.5,
      "tolerance_max": 30,
      "critical_min": 5,
      "critical_max": 35
    },
    "humidity": {
      "optimal_min": 65,
      "optimal_max": 85,
      "tolerance_min": 60,
      "tolerance_max": 95
    },
    "light": {
      "dli_min": 20,
      "dli_optimal": 25,
      "dli_max": 30,
      "ppfd_min": 400,
      "ppfd_max": 800
    },
    "water": {
      "frequency_days": 2,
      "consistency_critical": true,
      "soil_moisture_min": 70,
      "soil_moisture_max": 85
    }
  },
  "growth": {
    "germination_days": 7,
    "harvest_days_min": 50,
    "harvest_days_max": 85,
    "growth_stages": [
      { "stage": "seed", "duration_days": 0 },
      { "stage": "sprout", "duration_days": 7 },
      { "stage": "seedling", "duration_days": 21 },
      { "stage": "vegetative", "duration_days": 35 },
      { "stage": "flowering", "duration_days": 45 },
      { "stage": "fruiting", "duration_days": 60 },
      { "stage": "harvestable", "duration_days": 85 }
    ],
    "growth_rate_base": 0.8
  },
  "stress_factors": {
    "blossom_end_rot": {
      "trigger": "inconsistent_watering",
      "health_penalty": -1.0
    },
    "heat_stress": {
      "trigger_temperature": 30,
      "health_penalty": -0.5
    }
  },
  "rewards": {
    "base_experience": 150,
    "optimal_harvest_bonus": 75,
    "coins": 300
  }
}
```

##### 🌶️ 6. 고추 (Chili Pepper)
```json
{
  "id": "chili",
  "name_ko": "고추",
  "name_en": "Chili Pepper",
  "name_scientific": "Capsicum annuum",
  "category": "fruiting",
  "difficulty": "hard",
  "environment": {
    "temperature": {
      "optimal_min": 21,
      "optimal_max": 26,
      "tolerance_min": 15,
      "tolerance_max": 32,
      "critical_min": 10,
      "critical_max": 35
    },
    "humidity": {
      "optimal_min": 65,
      "optimal_max": 85,
      "tolerance_min": 50,
      "tolerance_max": 90
    },
    "light": {
      "dli_min": 20,
      "dli_optimal": 25,
      "dli_max": 30,
      "ppfd_min": 600,
      "ppfd_max": 800
    },
    "water": {
      "frequency_days": 3,
      "consistency_critical": true,
      "soil_moisture_min": 70,
      "soil_moisture_max": 80
    }
  },
  "growth": {
    "germination_days": 10,
    "harvest_days_min": 90,
    "harvest_days_max": 180,
    "growth_stages": [
      { "stage": "seed", "duration_days": 0 },
      { "stage": "sprout", "duration_days": 10 },
      { "stage": "seedling", "duration_days": 28 },
      { "stage": "vegetative", "duration_days": 50 },
      { "stage": "flowering", "duration_days": 70 },
      { "stage": "fruiting", "duration_days": 90 },
      { "stage": "harvestable", "duration_days": 180 }
    ],
    "growth_rate_base": 0.5
  },
  "stress_factors": {
    "pollen_sterility": {
      "trigger_temperature": 32,
      "effect": "failed_pollination",
      "health_penalty": -1.5
    }
  },
  "rewards": {
    "base_experience": 200,
    "optimal_harvest_bonus": 100,
    "coins": 400
  }
}
```

##### 🫑 7. 파프리카 (Bell Pepper)
```json
{
  "id": "bell_pepper",
  "name_ko": "파프리카",
  "name_en": "Bell Pepper",
  "name_scientific": "Capsicum annuum var. grossum",
  "category": "fruiting",
  "difficulty": "hard",
  "environment": {
    "temperature": {
      "optimal_min": 20,
      "optimal_max": 28,
      "tolerance_min": 15,
      "tolerance_max": 32,
      "critical_min": 10,
      "critical_max": 35
    },
    "humidity": {
      "optimal_min": 70,
      "optimal_max": 80,
      "tolerance_min": 60,
      "tolerance_max": 85
    },
    "light": {
      "dli_min": 20,
      "dli_optimal": 25,
      "dli_max": 30,
      "ppfd_min": 600,
      "ppfd_max": 800
    },
    "water": {
      "frequency_days": 3,
      "consistency_critical": true,
      "soil_moisture_min": 70,
      "soil_moisture_max": 80
    }
  },
  "growth": {
    "germination_days": 10,
    "harvest_days_min": 90,
    "harvest_days_max": 120,
    "growth_rate_base": 0.6
  },
  "rewards": {
    "base_experience": 180,
    "optimal_harvest_bonus": 90,
    "coins": 360
  }
}
```

##### 🍆 8. 가지 (Eggplant)
```json
{
  "id": "eggplant",
  "name_ko": "가지",
  "name_en": "Eggplant",
  "name_scientific": "Solanum melongena",
  "category": "fruiting",
  "difficulty": "hard",
  "environment": {
    "temperature": {
      "optimal_min": 22,
      "optimal_max": 30,
      "tolerance_min": 17,
      "tolerance_max": 35,
      "critical_min": 7,
      "critical_max": 40
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 75,
      "tolerance_min": 50,
      "tolerance_max": 85
    },
    "light": {
      "dli_min": 20,
      "dli_optimal": 25,
      "dli_max": 30,
      "ppfd_min": 600,
      "ppfd_max": 800
    },
    "water": {
      "frequency_days": 2,
      "soil_moisture_min": 70,
      "soil_moisture_max": 85
    }
  },
  "growth": {
    "germination_days": 10,
    "harvest_days_min": 70,
    "harvest_days_max": 120,
    "growth_rate_base": 0.7
  },
  "rewards": {
    "base_experience": 170,
    "optimal_harvest_bonus": 85,
    "coins": 340
  }
}
```

##### 🥒 9. 오이 (Cucumber)
```json
{
  "id": "cucumber",
  "name_ko": "오이",
  "name_en": "Cucumber",
  "name_scientific": "Cucumis sativus",
  "category": "fruiting",
  "difficulty": "medium",
  "environment": {
    "temperature": {
      "optimal_min": 20,
      "optimal_max": 28,
      "tolerance_min": 15,
      "tolerance_max": 32,
      "critical_min": 10,
      "critical_max": 35
    },
    "humidity": {
      "optimal_min": 70,
      "optimal_max": 85,
      "tolerance_min": 60,
      "tolerance_max": 90
    },
    "light": {
      "dli_min": 15,
      "dli_optimal": 20,
      "dli_max": 25,
      "ppfd_min": 400,
      "ppfd_max": 700
    },
    "water": {
      "frequency_days": 2,
      "consistency_critical": true,
      "soil_moisture_min": 70,
      "soil_moisture_max": 85
    }
  },
  "growth": {
    "germination_days": 7,
    "harvest_days_min": 50,
    "harvest_days_max": 75,
    "growth_rate_base": 1.0
  },
  "rewards": {
    "base_experience": 100,
    "optimal_harvest_bonus": 50,
    "coins": 200
  }
}
```

##### 🍓 10. 딸기 (Strawberry)
```json
{
  "id": "strawberry",
  "name_ko": "딸기",
  "name_en": "Strawberry",
  "name_scientific": "Fragaria × ananassa",
  "category": "fruiting",
  "difficulty": "hard",
  "environment": {
    "temperature": {
      "optimal_min": 16,
      "optimal_max": 24,
      "tolerance_min": 10,
      "tolerance_max": 30,
      "critical_min": -5,
      "critical_max": 35
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 75,
      "tolerance_min": 50,
      "tolerance_max": 85
    },
    "light": {
      "dli_min": 12,
      "dli_optimal": 15,
      "dli_max": 17,
      "ppfd_min": 300,
      "ppfd_max": 500
    },
    "water": {
      "frequency_days": 1,
      "daily_amount_ml": 125,
      "soil_moisture_min": 75,
      "soil_moisture_max": 85
    }
  },
  "growth": {
    "germination_days": 14,
    "harvest_days_min": 150,
    "harvest_days_max": 180,
    "growth_rate_base": 0.5
  },
  "rewards": {
    "base_experience": 220,
    "optimal_harvest_bonus": 110,
    "coins": 440
  }
}
```

#### 근채류 (Root Vegetables) - 2종

##### 🥕 11. 당근 (Carrot)
```json
{
  "id": "carrot",
  "name_ko": "당근",
  "name_en": "Carrot",
  "name_scientific": "Daucus carota",
  "category": "root",
  "difficulty": "medium",
  "environment": {
    "temperature": {
      "optimal_min": 18,
      "optimal_max": 21,
      "tolerance_min": 10,
      "tolerance_max": 30,
      "critical_min": 5,
      "critical_max": 35
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 75,
      "tolerance_min": 50,
      "tolerance_max": 85
    },
    "light": {
      "dli_min": 10,
      "dli_optimal": 12,
      "dli_max": 15,
      "ppfd_min": 200,
      "ppfd_max": 300
    },
    "water": {
      "germination_frequency": 0.5,
      "growth_frequency_days": 10,
      "soil_moisture_min": 70,
      "soil_moisture_max": 80
    }
  },
  "growth": {
    "germination_days": 14,
    "harvest_days_min": 60,
    "harvest_days_max": 100,
    "growth_rate_base": 0.7
  },
  "stress_factors": {
    "vernalization": {
      "trigger_temperature": 10,
      "trigger_root_size_mm": 6,
      "effect": "premature_bolting",
      "health_penalty": -1.0
    }
  },
  "rewards": {
    "base_experience": 130,
    "optimal_harvest_bonus": 65,
    "coins": 260
  }
}
```

##### 🥔 12. 무 (Radish)
```json
{
  "id": "radish",
  "name_ko": "무",
  "name_en": "Radish",
  "name_scientific": "Raphanus sativus",
  "category": "root",
  "difficulty": "easy",
  "environment": {
    "temperature": {
      "optimal_min": 17,
      "optimal_max": 23,
      "optimal_day": 24,
      "optimal_night": 18,
      "tolerance_min": 10,
      "tolerance_max": 30,
      "critical_min": 5,
      "critical_max": 35
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 75,
      "tolerance_min": 50,
      "tolerance_max": 85
    },
    "light": {
      "dli_min": 10,
      "dli_optimal": 12,
      "dli_max": 15,
      "ppfd_min": 200,
      "ppfd_max": 300
    },
    "water": {
      "germination_frequency": 0.3,
      "growth_frequency_days": 2,
      "soil_moisture_min": 70,
      "soil_moisture_max": 80
    }
  },
  "growth": {
    "germination_days": 5,
    "harvest_days_min": 22,
    "harvest_days_max": 60,
    "growth_rate_base": 1.3
  },
  "rewards": {
    "base_experience": 40,
    "optimal_harvest_bonus": 20,
    "coins": 80
  }
}
```

#### 허브 (Herbs) - 3종

##### 🌿 13. 바질 (Basil)
```json
{
  "id": "basil",
  "name_ko": "바질",
  "name_en": "Basil",
  "name_scientific": "Ocimum basilicum",
  "category": "herb",
  "difficulty": "easy",
  "environment": {
    "temperature": {
      "optimal_min": 26,
      "optimal_max": 32,
      "tolerance_min": 15,
      "tolerance_max": 35,
      "critical_min": 12,
      "critical_max": 38
    },
    "humidity": {
      "optimal_min": 65,
      "optimal_max": 85,
      "tolerance_min": 50,
      "tolerance_max": 90
    },
    "light": {
      "dli_min": 12,
      "dli_optimal": 14,
      "dli_max": 17,
      "ppfd_min": 300,
      "ppfd_max": 450
    },
    "water": {
      "indoor_frequency_days": 3,
      "outdoor_frequency_days": 5,
      "soil_moisture_min": 60,
      "soil_moisture_max": 75
    }
  },
  "growth": {
    "germination_days": 7,
    "harvest_days_min": 28,
    "harvest_days_max": 42,
    "growth_rate_base": 1.2
  },
  "stress_factors": {
    "cold_stress": {
      "trigger_temperature": 12,
      "health_penalty": -1.0
    }
  },
  "rewards": {
    "base_experience": 45,
    "optimal_harvest_bonus": 23,
    "coins": 90
  }
}
```

##### 🌿 14. 민트 (Mint)
```json
{
  "id": "mint",
  "name_ko": "민트",
  "name_en": "Mint",
  "name_scientific": "Mentha spp.",
  "category": "herb",
  "difficulty": "easy",
  "environment": {
    "temperature": {
      "optimal_min": 13,
      "optimal_max": 21,
      "tolerance_min": 5,
      "tolerance_max": 30,
      "critical_min": -10,
      "critical_max": 35
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 70,
      "tolerance_min": 40,
      "tolerance_max": 80
    },
    "light": {
      "dli_min": 10,
      "dli_optimal": 12,
      "dli_max": 15,
      "ppfd_min": 200,
      "ppfd_max": 400
    },
    "water": {
      "frequency_days": 3,
      "soil_moisture_min": 40,
      "soil_moisture_max": 50
    }
  },
  "growth": {
    "germination_days": 10,
    "harvest_days_min": 56,
    "harvest_days_max": 84,
    "growth_rate_base": 0.9
  },
  "rewards": {
    "base_experience": 70,
    "optimal_harvest_bonus": 35,
    "coins": 140
  }
}
```

##### 🌿 15. 로즈마리 (Rosemary)
```json
{
  "id": "rosemary",
  "name_ko": "로즈마리",
  "name_en": "Rosemary",
  "name_scientific": "Salvia rosmarinus",
  "category": "herb",
  "difficulty": "medium",
  "environment": {
    "temperature": {
      "optimal_min": 18,
      "optimal_max": 24,
      "tolerance_min": 10,
      "tolerance_max": 30,
      "critical_min": -5,
      "critical_max": 35
    },
    "humidity": {
      "optimal_min": 40,
      "optimal_max": 60,
      "tolerance_min": 30,
      "tolerance_max": 70
    },
    "light": {
      "dli_min": 14,
      "dli_optimal": 17,
      "dli_max": 20,
      "ppfd_min": 400,
      "ppfd_max": 600
    },
    "water": {
      "frequency_days": 7,
      "drought_tolerant": true,
      "soil_moisture_min": 40,
      "soil_moisture_max": 60
    }
  },
  "growth": {
    "germination_days": 21,
    "harvest_days_min": 90,
    "harvest_days_max": 120,
    "growth_rate_base": 0.6
  },
  "rewards": {
    "base_experience": 110,
    "optimal_harvest_bonus": 55,
    "coins": 220
  }
}
```

---

## 3. 데이터베이스 스키마

### 3.1 ERD 개요

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   users     │1      n │ user_plants  │n      1 │    plants       │
├─────────────┤◄────────┤──────────────┤────────►│─────────────────┤
│ id          │         │ id           │         │ id              │
│ username    │         │ user_id      │         │ name_ko         │
│ email       │         │ plant_id     │         │ name_en         │
│ password    │         │ nickname     │         │ category        │
│ created_at  │         │ planted_at   │         │ difficulty      │
│ ...         │         │ current_age  │         │ data (JSONB)    │
└─────────────┘         │ ...          │         └─────────────────┘
                        └──────────────┘
                               │1
                               │
                               │n
                        ┌──────────────┐         ┌─────────────────┐
                        │ plant_states │         │ growth_stages   │
                        ├──────────────┤         ├─────────────────┤
                        │ id           │         │ id              │
                        │ user_plant_id│         │ name            │
                        │ timestamp    │         │ duration_days   │
                        │ health       │         │ order           │
                        │ growth_rate  │         └─────────────────┘
                        │ environment  │
                        │ ...          │
                        └──────────────┘
```

### 3.2 PostgreSQL 스키마

#### Table: `users`
사용자 계정 정보
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    profile_image_url TEXT,
    experience_points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    coins INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT username_length CHECK (char_length(username) >= 3),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

#### Table: `plants`
식물 마스터 데이터
```sql
CREATE TABLE plants (
    id VARCHAR(50) PRIMARY KEY,
    name_ko VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    name_scientific VARCHAR(200),
    category VARCHAR(20) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    description TEXT,
    icon_url TEXT,
    
    -- 환경 데이터 (JSONB로 저장)
    environment JSONB NOT NULL,
    
    -- 성장 데이터
    growth JSONB NOT NULL,
    
    -- 스트레스 요인
    stress_factors JSONB,
    
    -- 보상 정보
    rewards JSONB NOT NULL,
    
    -- 메타데이터
    is_unlocked_by_default BOOLEAN DEFAULT TRUE,
    unlock_level INTEGER DEFAULT 1,
    unlock_cost INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT category_check CHECK (category IN ('leafy', 'fruiting', 'root', 'herb')),
    CONSTRAINT difficulty_check CHECK (difficulty IN ('easy', 'medium', 'hard'))
);

CREATE INDEX idx_plants_category ON plants(category);
CREATE INDEX idx_plants_difficulty ON plants(difficulty);
CREATE INDEX idx_plants_unlock_level ON plants(unlock_level);

-- JSONB 인덱스 (쿼리 최적화)
CREATE INDEX idx_plants_environment_gin ON plants USING GIN (environment);
CREATE INDEX idx_plants_growth_gin ON plants USING GIN (growth);
```

#### Table: `plant_variants`
식물 변종 데이터 (Phase 2+)
```sql
CREATE TABLE plant_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id VARCHAR(50) REFERENCES plants(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    
    -- 변종 고유 특성 (부모 데이터 오버라이드)
    environment_overrides JSONB,
    growth_overrides JSONB,
    
    -- 시각적 특성
    color_primary VARCHAR(7),
    color_secondary VARCHAR(7),
    icon_url TEXT,
    
    -- 희귀도
    rarity VARCHAR(20) DEFAULT 'common',
    unlock_condition JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT rarity_check CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'))
);

CREATE INDEX idx_plant_variants_plant_id ON plant_variants(plant_id);
CREATE INDEX idx_plant_variants_rarity ON plant_variants(rarity);
```

#### Table: `user_plants`
사용자가 키우는 식물 인스턴스
```sql
CREATE TABLE user_plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plant_id VARCHAR(50) NOT NULL REFERENCES plants(id),
    variant_id UUID REFERENCES plant_variants(id),
    
    -- 식물 기본 정보
    nickname VARCHAR(100),
    planted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 현재 상태
    current_stage VARCHAR(50) NOT NULL DEFAULT 'seed',
    current_age_days DECIMAL(10, 2) DEFAULT 0,
    health DECIMAL(5, 2) DEFAULT 100.00,
    growth_progress DECIMAL(5, 2) DEFAULT 0.00,
    
    -- 환경 상태 (최신값 캐시)
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    light_dli DECIMAL(5, 2),
    soil_moisture DECIMAL(5, 2),
    last_watered_at TIMESTAMP WITH TIME ZONE,
    
    -- 시뮬레이션 상태
    is_active BOOLEAN DEFAULT TRUE,
    is_wilted BOOLEAN DEFAULT FALSE,
    is_harvestable BOOLEAN DEFAULT FALSE,
    harvested_at TIMESTAMP WITH TIME ZONE,
    
    -- 통계
    total_water_given INTEGER DEFAULT 0,
    total_environment_adjustments INTEGER DEFAULT 0,
    optimal_days_count INTEGER DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT health_range CHECK (health >= 0 AND health <= 100),
    CONSTRAINT growth_progress_range CHECK (growth_progress >= 0 AND growth_progress <= 100)
);

CREATE INDEX idx_user_plants_user_id ON user_plants(user_id);
CREATE INDEX idx_user_plants_plant_id ON user_plants(plant_id);
CREATE INDEX idx_user_plants_planted_at ON user_plants(planted_at DESC);
CREATE INDEX idx_user_plants_is_active ON user_plants(is_active);
CREATE INDEX idx_user_plants_current_stage ON user_plants(current_stage);
```

#### Table: `plant_states`
식물 상태 이력 (시계열 데이터)
```sql
CREATE TABLE plant_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_plant_id UUID NOT NULL REFERENCES user_plants(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 환경 데이터
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    light_dli DECIMAL(5, 2),
    soil_moisture DECIMAL(5, 2),
    
    -- 식물 상태
    health DECIMAL(5, 2) NOT NULL,
    growth_rate DECIMAL(5, 3) NOT NULL DEFAULT 1.000,
    stage VARCHAR(50) NOT NULL,
    age_days DECIMAL(10, 2) NOT NULL,
    
    -- 계산된 지표
    stress_level DECIMAL(5, 2) DEFAULT 0,
    environment_score DECIMAL(5, 2),
    
    -- 이벤트 (물 주기, 수확 등)
    event_type VARCHAR(50),
    event_data JSONB,
    
    CONSTRAINT health_range CHECK (health >= 0 AND health <= 100),
    CONSTRAINT stress_range CHECK (stress_level >= 0 AND stress_level <= 100)
);

CREATE INDEX idx_plant_states_user_plant_id ON plant_states(user_plant_id);
CREATE INDEX idx_plant_states_timestamp ON plant_states(timestamp DESC);
CREATE INDEX idx_plant_states_event_type ON plant_states(event_type);

-- 시계열 파티션닝 (선택사항, 대용량 데이터 대비)
-- CREATE TABLE plant_states_y2026m04 PARTITION OF plant_states
--     FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
```

#### Table: `growth_stages`
성장 단계 마스터 (참조용)
```sql
CREATE TABLE growth_stages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name_ko VARCHAR(100),
    display_name_en VARCHAR(100),
    description TEXT,
    icon_url TEXT,
    order_index INTEGER NOT NULL,
    
    CONSTRAINT unique_order CHECK (order_index >= 0)
);

INSERT INTO growth_stages (name, display_name_ko, display_name_en, order_index) VALUES
('seed', '씨앗', 'Seed', 0),
('sprout', '발아', 'Sprout', 1),
('seedling', '묘목', 'Seedling', 2),
('vegetative', '성장기', 'Vegetative', 3),
('flowering', '개화기', 'Flowering', 4),
('fruiting', '결실기', 'Fruiting', 5),
('mature', '성숙', 'Mature', 6),
('harvestable', '수확 가능', 'Harvestable', 7);
```

#### Table: `user_achievements`
사용자 업적 시스템
```sql
CREATE TABLE achievements (
    id VARCHAR(50) PRIMARY KEY,
    name_ko VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    category VARCHAR(50),
    condition JSONB NOT NULL,
    reward_experience INTEGER DEFAULT 0,
    reward_coins INTEGER DEFAULT 0,
    is_secret BOOLEAN DEFAULT FALSE
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress JSONB,
    
    UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked_at ON user_achievements(unlocked_at DESC);
```

#### Table: `user_settings`
사용자 설정
```sql
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    
    -- 게임 설정
    time_scale DECIMAL(3, 1) DEFAULT 1.0,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    sound_enabled BOOLEAN DEFAULT TRUE,
    
    -- 디스플레이 설정
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'ko',
    
    -- 개인화
    preferences JSONB,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT time_scale_range CHECK (time_scale >= 0.1 AND time_scale <= 10.0),
    CONSTRAINT theme_check CHECK (theme IN ('light', 'dark', 'auto'))
);
```

### 3.3 뷰 (Views)

#### View: `v_active_user_plants`
활성 식물 조회 최적화
```sql
CREATE VIEW v_active_user_plants AS
SELECT 
    up.id,
    up.user_id,
    up.plant_id,
    p.name_ko,
    p.name_en,
    p.category,
    p.difficulty,
    up.nickname,
    up.current_stage,
    up.current_age_days,
    up.health,
    up.growth_progress,
    up.is_harvestable,
    up.planted_at,
    up.temperature,
    up.humidity,
    up.light_dli,
    up.soil_moisture,
    up.last_watered_at,
    
    -- 최적 환경 조건
    p.environment->'temperature'->>'optimal_min' AS temp_min,
    p.environment->'temperature'->>'optimal_max' AS temp_max,
    p.environment->'humidity'->>'optimal_min' AS humidity_min,
    p.environment->'humidity'->>'optimal_max' AS humidity_max
    
FROM user_plants up
JOIN plants p ON up.plant_id = p.id
WHERE up.is_active = TRUE;
```

### 3.4 트리거 (Triggers)

#### 자동 타임스탬프 업데이트
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_plants_updated_at
    BEFORE UPDATE ON user_plants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 4. REST API 명세

### 4.1 API 개요

**Base URL**: `https://api.plantii.app/v1`

**인증 방식**: JWT (JSON Web Token)
- 헤더: `Authorization: Bearer <token>`
- 토큰 만료: Access Token 1시간, Refresh Token 30일

**응답 형식**: JSON
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-04-08T12:34:56Z"
}
```

**에러 형식**:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "timestamp": "2026-04-08T12:34:56Z"
}
```

**HTTP 상태 코드**:
- `200` OK - 성공
- `201` Created - 리소스 생성 성공
- `400` Bad Request - 잘못된 요청
- `401` Unauthorized - 인증 실패
- `403` Forbidden - 권한 없음
- `404` Not Found - 리소스 없음
- `409` Conflict - 리소스 충돌
- `422` Unprocessable Entity - 유효성 검증 실패
- `500` Internal Server Error - 서버 오류

### 4.2 인증 (Authentication)

#### POST `/auth/register`
사용자 등록

**Request**:
```json
{
  "username": "plantlover",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "display_name": "Plant Lover"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "plantlover",
      "email": "user@example.com",
      "display_name": "Plant Lover",
      "level": 1,
      "experience_points": 0,
      "coins": 1000,
      "created_at": "2026-04-08T12:00:00Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

#### POST `/auth/login`
로그인

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

#### POST `/auth/refresh`
토큰 갱신

**Request**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "access_token": "...",
    "expires_in": 3600
  }
}
```

#### POST `/auth/logout`
로그아웃 (토큰 무효화)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out"
  }
}
```

### 4.3 사용자 (Users)

#### GET `/users/me`
현재 사용자 정보 조회

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "plantlover",
    "email": "user@example.com",
    "display_name": "Plant Lover",
    "profile_image_url": "https://cdn.plantii.app/avatars/user123.jpg",
    "level": 5,
    "experience_points": 2350,
    "coins": 4500,
    "created_at": "2026-03-01T10:00:00Z",
    "stats": {
      "total_plants_grown": 12,
      "total_harvests": 8,
      "total_playtime_hours": 24.5,
      "achievements_unlocked": 5
    }
  }
}
```

#### PATCH `/users/me`
사용자 정보 수정

**Request**:
```json
{
  "display_name": "Expert Gardener",
  "profile_image_url": "https://cdn.plantii.app/avatars/new.jpg"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "plantlover",
    "display_name": "Expert Gardener",
    "profile_image_url": "https://cdn.plantii.app/avatars/new.jpg",
    "updated_at": "2026-04-08T12:30:00Z"
  }
}
```

### 4.4 식물 마스터 데이터 (Plants)

#### GET `/plants`
식물 목록 조회

**Query Parameters**:
- `category` (optional): `leafy`, `fruiting`, `root`, `herb`
- `difficulty` (optional): `easy`, `medium`, `hard`
- `unlocked_only` (optional): `true`, `false`
- `sort` (optional): `name`, `difficulty`, `harvest_days`
- `page` (optional): 페이지 번호 (기본값: 1)
- `limit` (optional): 페이지 크기 (기본값: 20)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "plants": [
      {
        "id": "lettuce",
        "name_ko": "상추",
        "name_en": "Lettuce",
        "name_scientific": "Lactuca sativa",
        "category": "leafy",
        "difficulty": "easy",
        "description": "빠르게 자라는 초보자 친화적 엽채류",
        "icon_url": "https://cdn.plantii.app/plants/lettuce.svg",
        "environment": {
          "temperature": {
            "optimal_min": 15,
            "optimal_max": 20
          },
          "humidity": {
            "optimal_min": 50,
            "optimal_max": 70
          }
        },
        "growth": {
          "harvest_days_min": 25,
          "harvest_days_max": 60
        },
        "rewards": {
          "base_experience": 50,
          "coins": 100
        },
        "is_unlocked": true,
        "unlock_level": 1
      }
      // ... 더 많은 식물
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "total_pages": 1
    }
  }
}
```

#### GET `/plants/:id`
특정 식물 상세 조회

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "tomato",
    "name_ko": "토마토",
    "name_en": "Tomato",
    "name_scientific": "Solanum lycopersicum",
    "category": "fruiting",
    "difficulty": "hard",
    "description": "정밀한 관리가 필요한 과채류",
    "icon_url": "https://cdn.plantii.app/plants/tomato.svg",
    "environment": {
      "temperature": {
        "optimal_min": 20,
        "optimal_max": 25,
        "optimal_night_min": 13,
        "optimal_night_max": 18,
        "tolerance_min": 10.5,
        "tolerance_max": 30,
        "critical_min": 5,
        "critical_max": 35,
        "stress_threshold": 2,
        "unit": "celsius"
      },
      "humidity": {
        "optimal_min": 65,
        "optimal_max": 85,
        "tolerance_min": 60,
        "tolerance_max": 95,
        "unit": "percentage"
      },
      "light": {
        "dli_min": 20,
        "dli_optimal": 25,
        "dli_max": 30,
        "ppfd_min": 400,
        "ppfd_max": 800,
        "unit": "mol_m2_day"
      },
      "water": {
        "frequency_days": 2,
        "consistency_critical": true,
        "soil_moisture_min": 70,
        "soil_moisture_max": 85,
        "unit": "percentage_field_capacity"
      }
    },
    "growth": {
      "germination_days": 7,
      "harvest_days_min": 50,
      "harvest_days_max": 85,
      "growth_stages": [
        { "stage": "seed", "duration_days": 0, "icon": "seed" },
        { "stage": "sprout", "duration_days": 7, "icon": "sprout" },
        { "stage": "seedling", "duration_days": 21, "icon": "seedling" },
        { "stage": "vegetative", "duration_days": 35, "icon": "young_tomato" },
        { "stage": "flowering", "duration_days": 45, "icon": "flowering_tomato" },
        { "stage": "fruiting", "duration_days": 60, "icon": "green_tomato" },
        { "stage": "harvestable", "duration_days": 85, "icon": "red_tomato" }
      ],
      "growth_rate_base": 0.8
    },
    "stress_factors": {
      "blossom_end_rot": {
        "trigger": "inconsistent_watering",
        "effect": "fruit_damage",
        "health_penalty": -1.0
      },
      "heat_stress": {
        "trigger_temperature": 30,
        "effect": "growth_slowdown",
        "health_penalty": -0.5
      }
    },
    "rewards": {
      "base_experience": 150,
      "optimal_harvest_bonus": 75,
      "coins": 300
    },
    "is_unlocked": true,
    "unlock_level": 3,
    "unlock_cost": 500
  }
}
```

### 4.5 사용자 식물 (User Plants)

#### GET `/user-plants`
내 식물 목록 조회

**Query Parameters**:
- `is_active` (optional): `true`, `false`
- `is_harvestable` (optional): `true`, `false`
- `plant_id` (optional): 특정 식물 종류 필터
- `sort` (optional): `planted_at`, `health`, `age`
- `order` (optional): `asc`, `desc`

**Response** (200):
```json
{
  "success": true,
  "data": {
    "plants": [
      {
        "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
        "plant_id": "lettuce",
        "name_ko": "상추",
        "name_en": "Lettuce",
        "category": "leafy",
        "difficulty": "easy",
        "nickname": "쌈채소",
        "planted_at": "2026-04-01T10:00:00Z",
        "current_stage": "mature",
        "current_age_days": 7.5,
        "health": 95.0,
        "growth_progress": 75.0,
        "is_harvestable": false,
        "environment": {
          "temperature": 18.5,
          "humidity": 65.0,
          "light_dli": 15.0,
          "soil_moisture": 72.0
        },
        "last_watered_at": "2026-04-08T08:00:00Z",
        "icon_url": "https://cdn.plantii.app/plants/lettuce_mature.svg"
      }
      // ... 더 많은 식물
    ],
    "total": 5
  }
}
```

#### GET `/user-plants/:id`
특정 식물 상세 조회

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "plant_id": "tomato",
    "name_ko": "토마토",
    "name_en": "Tomato",
    "nickname": "방울이",
    "planted_at": "2026-03-20T14:30:00Z",
    "current_stage": "flowering",
    "current_age_days": 19.5,
    "health": 88.5,
    "growth_progress": 42.0,
    "is_active": true,
    "is_wilted": false,
    "is_harvestable": false,
    "environment": {
      "temperature": 22.0,
      "humidity": 75.0,
      "light_dli": 24.0,
      "soil_moisture": 78.0
    },
    "last_watered_at": "2026-04-08T10:00:00Z",
    "stats": {
      "total_water_given": 12,
      "total_environment_adjustments": 8,
      "optimal_days_count": 15,
      "optimal_percentage": 76.9
    },
    "optimal_environment": {
      "temperature": { "min": 20, "max": 25 },
      "humidity": { "min": 65, "max": 85 },
      "light_dli": { "min": 20, "max": 30 },
      "soil_moisture": { "min": 70, "max": 85 }
    },
    "next_stage": {
      "stage": "fruiting",
      "estimated_days": 5.5,
      "progress_percentage": 78.0
    }
  }
}
```

#### POST `/user-plants`
새 식물 심기

**Request**:
```json
{
  "plant_id": "lettuce",
  "nickname": "쌈채소",
  "environment": {
    "temperature": 18.0,
    "humidity": 60.0,
    "light_dli": 14.0
  }
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "new-uuid-here",
    "plant_id": "lettuce",
    "nickname": "쌈채소",
    "planted_at": "2026-04-08T12:34:56Z",
    "current_stage": "seed",
    "current_age_days": 0,
    "health": 100.0,
    "growth_progress": 0,
    "environment": {
      "temperature": 18.0,
      "humidity": 60.0,
      "light_dli": 14.0,
      "soil_moisture": 75.0
    }
  }
}
```

#### PATCH `/user-plants/:id`
식물 정보 수정 (닉네임 등)

**Request**:
```json
{
  "nickname": "새 이름"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "nickname": "새 이름",
    "updated_at": "2026-04-08T12:40:00Z"
  }
}
```

#### DELETE `/user-plants/:id`
식물 제거

**Response** (200):
```json
{
  "success": true,
  "data": {
    "message": "Plant removed successfully",
    "refund_coins": 50
  }
}
```

### 4.6 식물 액션 (Plant Actions)

#### POST `/user-plants/:id/water`
물 주기

**Request**:
```json
{
  "amount": 1
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "last_watered_at": "2026-04-08T12:45:00Z",
    "soil_moisture": 80.0,
    "health": 96.0,
    "message": "물을 충분히 주었습니다!",
    "experience_gained": 5
  }
}
```

#### POST `/user-plants/:id/environment`
환경 조절

**Request**:
```json
{
  "temperature": 20.0,
  "humidity": 70.0,
  "light_dli": 15.0
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "environment": {
      "temperature": 20.0,
      "humidity": 70.0,
      "light_dli": 15.0,
      "soil_moisture": 75.0
    },
    "environment_score": 95.0,
    "message": "환경이 최적 상태입니다!",
    "cost_coins": 10
  }
}
```

#### POST `/user-plants/:id/harvest`
수확

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "harvested_at": "2026-04-08T12:50:00Z",
    "final_health": 92.5,
    "optimal_days_percentage": 85.0,
    "rewards": {
      "experience": 75,
      "coins": 200,
      "bonus_experience": 25,
      "bonus_coins": 50,
      "total_experience": 100,
      "total_coins": 250
    },
    "achievements_unlocked": [
      {
        "id": "first_harvest",
        "name_ko": "첫 수확",
        "reward_experience": 50,
        "reward_coins": 100
      }
    ]
  }
}
```

#### GET `/user-plants/:id/simulate`
시뮬레이션 진행 (시간 경과)

**Query Parameters**:
- `hours` (required): 진행할 시간 (시간 단위)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "simulated_hours": 24,
    "before": {
      "current_age_days": 5.0,
      "health": 95.0,
      "current_stage": "seedling",
      "growth_progress": 40.0
    },
    "after": {
      "current_age_days": 6.0,
      "health": 93.5,
      "current_stage": "seedling",
      "growth_progress": 52.0
    },
    "events": [
      {
        "timestamp": "2026-04-08T18:00:00Z",
        "type": "stage_change",
        "message": "식물이 vegetative 단계로 성장했습니다!",
        "experience_gained": 10
      },
      {
        "timestamp": "2026-04-09T06:00:00Z",
        "type": "low_water",
        "message": "토양이 건조해지고 있습니다. 물을 주세요!",
        "health_penalty": -1.5
      }
    ],
    "summary": {
      "growth_rate_average": 0.95,
      "health_change": -1.5,
      "soil_moisture_final": 55.0
    }
  }
}
```

### 4.7 통계 및 이력 (Stats & History)

#### GET `/user-plants/:id/history`
식물 상태 이력 조회

**Query Parameters**:
- `from` (optional): 시작 시간 (ISO 8601)
- `to` (optional): 종료 시간 (ISO 8601)
- `interval` (optional): `hour`, `day` (기본값: `hour`)
- `limit` (optional): 최대 레코드 수 (기본값: 100)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user_plant_id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "interval": "hour",
    "records": [
      {
        "timestamp": "2026-04-08T12:00:00Z",
        "age_days": 6.0,
        "health": 95.0,
        "growth_rate": 1.0,
        "stage": "seedling",
        "environment": {
          "temperature": 18.5,
          "humidity": 65.0,
          "light_dli": 15.0,
          "soil_moisture": 75.0
        },
        "stress_level": 5.0,
        "environment_score": 95.0
      }
      // ... 더 많은 레코드
    ],
    "total": 72
  }
}
```

#### GET `/users/me/stats`
사용자 통계

**Response** (200):
```json
{
  "success": true,
  "data": {
    "overview": {
      "total_plants_planted": 25,
      "total_plants_harvested": 18,
      "active_plants": 7,
      "success_rate": 72.0,
      "total_playtime_hours": 48.5
    },
    "by_category": {
      "leafy": {
        "planted": 12,
        "harvested": 10,
        "success_rate": 83.3
      },
      "fruiting": {
        "planted": 8,
        "harvested": 5,
        "success_rate": 62.5
      },
      "root": {
        "planted": 3,
        "harvested": 2,
        "success_rate": 66.7
      },
      "herb": {
        "planted": 2,
        "harvested": 1,
        "success_rate": 50.0
      }
    },
    "best_plants": [
      {
        "plant_id": "lettuce",
        "name_ko": "상추",
        "total_grown": 5,
        "average_health": 94.5,
        "average_days_to_harvest": 28.3
      }
    ]
  }
}
```

### 4.8 업적 (Achievements)

#### GET `/achievements`
업적 목록

**Response** (200):
```json
{
  "success": true,
  "data": {
    "achievements": [
      {
        "id": "first_plant",
        "name_ko": "첫 식물",
        "name_en": "First Plant",
        "description": "첫 번째 식물을 심으세요",
        "icon_url": "https://cdn.plantii.app/achievements/first_plant.svg",
        "category": "beginner",
        "reward_experience": 10,
        "reward_coins": 50,
        "is_unlocked": true,
        "unlocked_at": "2026-03-01T10:05:00Z"
      },
      {
        "id": "master_gardener",
        "name_ko": "마스터 정원사",
        "name_en": "Master Gardener",
        "description": "100개의 식물을 성공적으로 수확하세요",
        "icon_url": "https://cdn.plantii.app/achievements/master.svg",
        "category": "expert",
        "reward_experience": 500,
        "reward_coins": 1000,
        "is_unlocked": false,
        "is_secret": false,
        "progress": {
          "current": 18,
          "target": 100
        }
      }
    ]
  }
}
```

### 4.9 리더보드 (Leaderboard)

#### GET `/leaderboard`
리더보드 조회

**Query Parameters**:
- `type` (required): `level`, `harvests`, `experience`
- `period` (optional): `all`, `weekly`, `monthly`
- `limit` (optional): 최대 결과 수 (기본값: 100)

**Response** (200):
```json
{
  "success": true,
  "data": {
    "type": "level",
    "period": "all",
    "rankings": [
      {
        "rank": 1,
        "user_id": "...",
        "username": "plantmaster",
        "display_name": "Plant Master",
        "profile_image_url": "...",
        "level": 25,
        "experience_points": 15000,
        "total_harvests": 150
      }
      // ... 더 많은 순위
    ],
    "my_rank": {
      "rank": 42,
      "level": 5,
      "experience_points": 2350
    }
  }
}
```

---

## 5. 시뮬레이션 엔진 설계

### 5.1 핵심 개념

#### 시간 시스템
- **실시간 모드**: 1초 = 1초 (기본값)
- **가속 모드**: 사용자 설정 배율 (최대 10배)
- **시뮬레이션 틱**: 1시간 단위로 상태 업데이트
- **저장 주기**: 1시간마다 `plant_states` 테이블에 기록

#### 성장률 계산 공식
```typescript
성장률 (growth_rate) = base_rate × temp_factor × humidity_factor × light_factor × water_factor

최종 성장량 = growth_rate × elapsed_hours × (1 - stress_penalty)
```

### 5.2 환경 요인별 계산

#### 온도 요인 (Temperature Factor)
```typescript
function calculateTemperatureFactor(
  current: number,
  optimal_min: number,
  optimal_max: number,
  tolerance_min: number,
  tolerance_max: number,
  critical_min: number,
  critical_max: number
): number {
  // 치명적 범위: 0 (식물 사망)
  if (current <= critical_min || current >= critical_max) {
    return 0;
  }
  
  // 최적 범위: 1.0 (완전한 성장)
  if (current >= optimal_min && current <= optimal_max) {
    return 1.0;
  }
  
  // 허용 범위: 선형 감소 (0.3 ~ 1.0)
  if (current >= tolerance_min && current < optimal_min) {
    const range = optimal_min - tolerance_min;
    const distance = optimal_min - current;
    return 0.3 + (0.7 * (1 - distance / range));
  }
  
  if (current > optimal_max && current <= tolerance_max) {
    const range = tolerance_max - optimal_max;
    const distance = current - optimal_max;
    return 0.3 + (0.7 * (1 - distance / range));
  }
  
  // 스트레스 범위: 급격한 감소 (0 ~ 0.3)
  if (current > tolerance_min && current < tolerance_min) {
    const range = tolerance_min - critical_min;
    const distance = current - critical_min;
    return 0.3 * (distance / range);
  }
  
  if (current > tolerance_max && current < critical_max) {
    const range = critical_max - tolerance_max;
    const distance = critical_max - current;
    return 0.3 * (distance / range);
  }
  
  return 0;
}
```

#### 습도 요인 (Humidity Factor)
```typescript
function calculateHumidityFactor(
  current: number,
  optimal_min: number,
  optimal_max: number,
  tolerance_min: number,
  tolerance_max: number
): number {
  // 최적 범위
  if (current >= optimal_min && current <= optimal_max) {
    return 1.0;
  }
  
  // 허용 범위
  if (current >= tolerance_min && current < optimal_min) {
    const range = optimal_min - tolerance_min;
    const distance = optimal_min - current;
    return 0.5 + (0.5 * (1 - distance / range));
  }
  
  if (current > optimal_max && current <= tolerance_max) {
    const range = tolerance_max - optimal_max;
    const distance = current - optimal_max;
    return 0.5 + (0.5 * (1 - distance / range));
  }
  
  // 범위 밖: 급격한 감소
  if (current < tolerance_min) {
    return Math.max(0, 0.5 - (tolerance_min - current) * 0.05);
  }
  
  if (current > tolerance_max) {
    return Math.max(0, 0.5 - (current - tolerance_max) * 0.05);
  }
  
  return 0.5;
}
```

#### 광량 요인 (Light Factor)
```typescript
function calculateLightFactor(
  current_dli: number,
  dli_min: number,
  dli_optimal: number,
  dli_max: number
): number {
  // 불충분한 광량
  if (current_dli < dli_min) {
    return Math.max(0.1, current_dli / dli_min * 0.5);
  }
  
  // 최적 범위
  if (current_dli >= dli_min && current_dli <= dli_optimal) {
    const range = dli_optimal - dli_min;
    const distance = current_dli - dli_min;
    return 0.5 + (0.5 * (distance / range));
  }
  
  if (current_dli > dli_optimal && current_dli <= dli_max) {
    return 1.0;
  }
  
  // 과도한 광량 (광억제)
  if (current_dli > dli_max) {
    const excess = current_dli - dli_max;
    return Math.max(0.3, 1.0 - (excess / dli_max * 0.7));
  }
  
  return 0.5;
}
```

#### 수분 요인 (Water Factor)
```typescript
function calculateWaterFactor(
  soil_moisture: number,
  optimal_min: number,
  optimal_max: number
): number {
  // 최적 수분
  if (soil_moisture >= optimal_min && soil_moisture <= optimal_max) {
    return 1.0;
  }
  
  // 건조
  if (soil_moisture < optimal_min) {
    if (soil_moisture < optimal_min * 0.5) {
      return 0; // 심각한 건조: 성장 중단
    }
    return soil_moisture / optimal_min * 0.8;
  }
  
  // 과습
  if (soil_moisture > optimal_max) {
    if (soil_moisture > optimal_max * 1.2) {
      return 0.2; // 심각한 과습: 뿌리 부패 위험
    }
    const excess = soil_moisture - optimal_max;
    return Math.max(0.5, 1.0 - (excess / optimal_max * 0.5));
  }
  
  return 1.0;
}
```

### 5.3 건강도 (Health) 계산

```typescript
function updateHealth(
  currentHealth: number,
  environmentFactors: {
    temperature: number;
    humidity: number;
    light: number;
    water: number;
  },
  elapsed_hours: number
): number {
  // 환경 점수 (0-100)
  const avgFactor = (
    environmentFactors.temperature +
    environmentFactors.humidity +
    environmentFactors.light +
    environmentFactors.water
  ) / 4;
  
  const environmentScore = avgFactor * 100;
  
  // 건강도 변화량
  let healthChange = 0;
  
  if (environmentScore >= 80) {
    // 최적 환경: 건강도 회복
    healthChange = +0.5 * elapsed_hours;
  } else if (environmentScore >= 60) {
    // 양호한 환경: 유지
    healthChange = 0;
  } else if (environmentScore >= 40) {
    // 스트레스 환경: 감소
    healthChange = -0.3 * elapsed_hours;
  } else if (environmentScore >= 20) {
    // 나쁜 환경: 빠른 감소
    healthChange = -0.8 * elapsed_hours;
  } else {
    // 치명적 환경: 급격한 감소
    healthChange = -2.0 * elapsed_hours;
  }
  
  // 건강도 업데이트 (0-100 범위)
  const newHealth = Math.max(0, Math.min(100, currentHealth + healthChange));
  
  return newHealth;
}
```

### 5.4 성장 단계 전환

```typescript
function updateGrowthStage(
  currentAgeDays: number,
  growthStages: GrowthStage[]
): { stage: string; progress: number } {
  // 성장 단계 배열을 순회하며 현재 나이에 맞는 단계 찾기
  for (let i = growthStages.length - 1; i >= 0; i--) {
    const stage = growthStages[i];
    if (currentAgeDays >= stage.duration_days) {
      // 현재 단계 결정
      const currentStage = stage.stage;
      
      // 다음 단계가 있으면 진행률 계산
      if (i < growthStages.length - 1) {
        const nextStage = growthStages[i + 1];
        const stageRange = nextStage.duration_days - stage.duration_days;
        const stageProgress = currentAgeDays - stage.duration_days;
        const progress = Math.min(100, (stageProgress / stageRange) * 100);
        
        return { stage: currentStage, progress };
      } else {
        // 마지막 단계
        return { stage: currentStage, progress: 100 };
      }
    }
  }
  
  // 기본값: 씨앗 단계
  return { stage: 'seed', progress: 0 };
}
```

### 5.5 토양 수분 감소

```typescript
function calculateSoilMoistureDepletion(
  currentMoisture: number,
  temperature: number,
  humidity: number,
  elapsed_hours: number
): number {
  // 기본 증발률 (시간당 %)
  const baseEvaporation = 0.5;
  
  // 온도 영향 (높을수록 빠른 증발)
  const tempMultiplier = 1 + ((temperature - 20) * 0.05);
  
  // 습도 영향 (낮을수록 빠른 증발)
  const humidityMultiplier = 1 + ((60 - humidity) * 0.02);
  
  // 총 증발량
  const evaporation = baseEvaporation * tempMultiplier * humidityMultiplier * elapsed_hours;
  
  // 수분 감소
  const newMoisture = Math.max(0, currentMoisture - evaporation);
  
  return newMoisture;
}
```

### 5.6 스트레스 요인 처리

```typescript
function applyStressFactors(
  plantData: PlantData,
  currentState: PlantState,
  environment: Environment
): { healthPenalty: number; events: Event[] } {
  const stressFactors = plantData.stress_factors;
  let totalHealthPenalty = 0;
  const events: Event[] = [];
  
  if (!stressFactors) return { healthPenalty: 0, events: [] };
  
  // 볼팅 (추대) 체크
  if (stressFactors.bolting) {
    const { trigger_temperature, trigger_light_hours, health_penalty } = stressFactors.bolting;
    
    if (
      environment.temperature >= trigger_temperature ||
      (trigger_light_hours && environment.light_hours >= trigger_light_hours)
    ) {
      totalHealthPenalty += health_penalty;
      events.push({
        type: 'bolting',
        message: '식물이 추대(꽃대 올림)하기 시작했습니다!',
        severity: 'warning'
      });
    }
  }
  
  // 냉해 체크
  if (stressFactors.cold_stress) {
    const { trigger_temperature, health_penalty } = stressFactors.cold_stress;
    
    if (environment.temperature <= trigger_temperature) {
      totalHealthPenalty += health_penalty;
      events.push({
        type: 'cold_stress',
        message: '저온으로 인한 스트레스를 받고 있습니다.',
        severity: 'danger'
      });
    }
  }
  
  // 고온 스트레스
  if (stressFactors.heat_stress) {
    const { trigger_temperature, health_penalty } = stressFactors.heat_stress;
    
    if (environment.temperature >= trigger_temperature) {
      totalHealthPenalty += health_penalty;
      events.push({
        type: 'heat_stress',
        message: '고온으로 인해 성장이 둔화되고 있습니다.',
        severity: 'warning'
      });
    }
  }
  
  // 물 일관성 체크 (과채류)
  if (plantData.environment.water.consistency_critical) {
    const timeSinceLastWater = Date.now() - currentState.last_watered_at;
    const hoursWithoutWater = timeSinceLastWater / (1000 * 60 * 60);
    const expectedFrequency = plantData.environment.water.frequency_days * 24;
    
    if (hoursWithoutWater > expectedFrequency * 1.5) {
      totalHealthPenalty += -1.0;
      events.push({
        type: 'inconsistent_watering',
        message: '불규칙한 물 공급으로 인해 열매 품질이 저하될 수 있습니다.',
        severity: 'warning'
      });
    }
  }
  
  return { healthPenalty: totalHealthPenalty, events };
}
```

### 5.7 시뮬레이션 메인 루프

```typescript
async function simulatePlantGrowth(
  userPlantId: string,
  elapsedHours: number
): Promise<SimulationResult> {
  // 1. 데이터 로드
  const userPlant = await getUserPlant(userPlantId);
  const plantData = await getPlantData(userPlant.plant_id);
  
  // 2. 현재 환경 가져오기
  const environment = {
    temperature: userPlant.temperature,
    humidity: userPlant.humidity,
    light_dli: userPlant.light_dli,
    soil_moisture: userPlant.soil_moisture
  };
  
  // 3. 환경 요인 계산
  const tempFactor = calculateTemperatureFactor(
    environment.temperature,
    plantData.environment.temperature.optimal_min,
    plantData.environment.temperature.optimal_max,
    plantData.environment.temperature.tolerance_min,
    plantData.environment.temperature.tolerance_max,
    plantData.environment.temperature.critical_min,
    plantData.environment.temperature.critical_max
  );
  
  const humidityFactor = calculateHumidityFactor(
    environment.humidity,
    plantData.environment.humidity.optimal_min,
    plantData.environment.humidity.optimal_max,
    plantData.environment.humidity.tolerance_min,
    plantData.environment.humidity.tolerance_max
  );
  
  const lightFactor = calculateLightFactor(
    environment.light_dli,
    plantData.environment.light.dli_min,
    plantData.environment.light.dli_optimal,
    plantData.environment.light.dli_max
  );
  
  const waterFactor = calculateWaterFactor(
    environment.soil_moisture,
    plantData.environment.water.soil_moisture_min,
    plantData.environment.water.soil_moisture_max
  );
  
  // 4. 성장률 계산
  const baseGrowthRate = plantData.growth.growth_rate_base;
  const growthRate = baseGrowthRate * tempFactor * humidityFactor * lightFactor * waterFactor;
  
  // 5. 스트레스 요인 적용
  const { healthPenalty, events } = applyStressFactors(plantData, userPlant, environment);
  
  // 6. 건강도 업데이트
  const newHealth = updateHealth(
    userPlant.health,
    { temperature: tempFactor, humidity: humidityFactor, light: lightFactor, water: waterFactor },
    elapsedHours
  ) + healthPenalty;
  
  // 7. 나이 증가
  const growthDays = (elapsedHours / 24) * growthRate;
  const newAgeDays = userPlant.current_age_days + growthDays;
  
  // 8. 성장 단계 업데이트
  const { stage, progress } = updateGrowthStage(newAgeDays, plantData.growth.growth_stages);
  
  // 9. 토양 수분 감소
  const newSoilMoisture = calculateSoilMoistureDepletion(
    environment.soil_moisture,
    environment.temperature,
    environment.humidity,
    elapsedHours
  );
  
  // 10. 수확 가능 여부 체크
  const isHarvestable = (
    stage === 'harvestable' ||
    newAgeDays >= plantData.growth.harvest_days_min
  );
  
  // 11. 시들음 체크
  const isWilted = newHealth < 20 || newSoilMoisture < 20;
  
  // 12. 데이터베이스 업데이트
  await updateUserPlant(userPlantId, {
    current_age_days: newAgeDays,
    current_stage: stage,
    growth_progress: progress,
    health: newHealth,
    soil_moisture: newSoilMoisture,
    is_harvestable: isHarvestable,
    is_wilted: isWilted
  });
  
  // 13. 상태 이력 기록
  await createPlantState({
    user_plant_id: userPlantId,
    timestamp: new Date(),
    temperature: environment.temperature,
    humidity: environment.humidity,
    light_dli: environment.light_dli,
    soil_moisture: newSoilMoisture,
    health: newHealth,
    growth_rate: growthRate,
    stage: stage,
    age_days: newAgeDays,
    stress_level: (1 - growthRate) * 100,
    environment_score: (tempFactor + humidityFactor + lightFactor + waterFactor) / 4 * 100,
    event_type: events.length > 0 ? events[0].type : null,
    event_data: events.length > 0 ? JSON.stringify(events) : null
  });
  
  return {
    before: {
      current_age_days: userPlant.current_age_days,
      health: userPlant.health,
      current_stage: userPlant.current_stage,
      growth_progress: userPlant.growth_progress
    },
    after: {
      current_age_days: newAgeDays,
      health: newHealth,
      current_stage: stage,
      growth_progress: progress
    },
    events,
    summary: {
      growth_rate_average: growthRate,
      health_change: newHealth - userPlant.health,
      soil_moisture_final: newSoilMoisture
    }
  };
}
```

### 5.8 자동 시뮬레이션 (백그라운드 프로세스)

```typescript
// Cron Job: 매 시간마다 실행
async function backgroundSimulation() {
  // 모든 활성 식물 가져오기
  const activePlants = await getActivePlants();
  
  for (const plant of activePlants) {
    const now = Date.now();
    const lastUpdate = new Date(plant.updated_at).getTime();
    const elapsedHours = (now - lastUpdate) / (1000 * 60 * 60);
    
    // 1시간 이상 경과한 식물만 시뮬레이션
    if (elapsedHours >= 1) {
      try {
        await simulatePlantGrowth(plant.id, elapsedHours);
      } catch (error) {
        console.error(`Simulation error for plant ${plant.id}:`, error);
      }
    }
  }
}

// 스케줄링
setInterval(backgroundSimulation, 60 * 60 * 1000); // 1시간마다
```

---

## 6. 프로젝트 구조 및 아키텍처

### 6.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Web App       │  │  Mobile App    │  │  Desktop App │  │
│  │  (React)       │  │  (React Native)│  │  (Electron)  │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS / REST API
┌────────────────────────┴────────────────────────────────────┐
│                     API Gateway (NGINX)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   Application Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Node.js / Express.js Server                 │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  ┌──────────┐  ┌────────────┐  ┌────────────────┐   │  │
│  │  │ Auth     │  │ Plants API │  │ Simulation     │   │  │
│  │  │ Service  │  │ Service    │  │ Engine         │   │  │
│  │  └──────────┘  └────────────┘  └────────────────┘   │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────┬────────────────┘
                         │                   │
         ┌───────────────┴───────┐    ┌──────┴──────────┐
         │                       │    │                 │
┌────────┴─────────┐  ┌──────────┴────┴───┐  ┌─────────┴──────┐
│  PostgreSQL DB   │  │  Redis Cache       │  │  File Storage  │
│  (Primary Data)  │  │  (Sessions, Queue) │  │  (Images)      │
└──────────────────┘  └────────────────────┘  └────────────────┘
```

### 6.2 백엔드 디렉토리 구조

```
plantii-backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # DB 연결 설정
│   │   ├── redis.ts             # Redis 설정
│   │   ├── jwt.ts               # JWT 설정
│   │   └── environment.ts       # 환경 변수
│   │
│   ├── models/
│   │   ├── User.ts              # 사용자 모델
│   │   ├── Plant.ts             # 식물 마스터 모델
│   │   ├── UserPlant.ts         # 사용자 식물 모델
│   │   ├── PlantState.ts        # 식물 상태 모델
│   │   └── Achievement.ts       # 업적 모델
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts   # 인증 컨트롤러
│   │   ├── user.controller.ts   # 사용자 컨트롤러
│   │   ├── plant.controller.ts  # 식물 컨트롤러
│   │   ├── userPlant.controller.ts
│   │   └── achievement.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts      # 인증 서비스
│   │   ├── user.service.ts      # 사용자 서비스
│   │   ├── plant.service.ts     # 식물 서비스
│   │   ├── simulation.service.ts # 시뮬레이션 엔진
│   │   ├── notification.service.ts
│   │   └── achievement.service.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT 검증
│   │   ├── validate.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   └── rateLimiter.middleware.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── plant.routes.ts
│   │   ├── userPlant.routes.ts
│   │   └── index.ts             # 라우트 통합
│   │
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── plant.validator.ts
│   │   └── common.validator.ts
│   │
│   ├── utils/
│   │   ├── logger.ts            # 로깅 유틸
│   │   ├── encryption.ts        # 암호화
│   │   ├── response.ts          # 응답 포맷터
│   │   └── pagination.ts        # 페이지네이션
│   │
│   ├── simulation/
│   │   ├── engine.ts            # 시뮬레이션 메인 엔진
│   │   ├── factors.ts           # 환경 요인 계산
│   │   ├── growth.ts            # 성장 계산
│   │   ├── health.ts            # 건강도 계산
│   │   └── scheduler.ts         # 백그라운드 스케줄러
│   │
│   ├── jobs/
│   │   ├── simulationCron.ts    # 시뮬레이션 크론잡
│   │   ├── cleanupCron.ts       # 데이터 정리
│   │   └── notificationCron.ts  # 알림 전송
│   │
│   ├── types/
│   │   ├── plant.types.ts       # 식물 타입 정의
│   │   ├── simulation.types.ts
│   │   └── api.types.ts
│   │
│   ├── seeds/
│   │   ├── plants.seed.ts       # 식물 데이터 시드
│   │   ├── achievements.seed.ts
│   │   └── index.ts
│   │
│   └── app.ts                   # Express 앱 설정
│   └── server.ts                # 서버 엔트리포인트
│
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_plants.sql
│   ├── 003_create_user_plants.sql
│   └── 004_create_plant_states.sql
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── simulation/
│   │   └── utils/
│   ├── integration/
│   │   ├── api/
│   │   └── db/
│   └── e2e/
│
├── scripts/
│   ├── seedDatabase.ts
│   ├── generatePlantData.ts
│   └── migrate.ts
│
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── docker-compose.yml
└── README.md
```

### 6.3 프론트엔드 디렉토리 구조 (React)

```
plantii-frontend/
├── public/
│   ├── assets/
│   │   ├── plants/              # 식물 아이콘/이미지
│   │   ├── achievements/        # 업적 아이콘
│   │   └── ui/                  # UI 아이콘
│   └── index.html
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   ├── Card/
│   │   │   ├── Modal/
│   │   │   └── Loading/
│   │   ├── layout/
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   └── Footer/
│   │   ├── plant/
│   │   │   ├── PlantCard/
│   │   │   ├── PlantDetail/
│   │   │   ├── PlantEnvironment/
│   │   │   ├── PlantStats/
│   │   │   └── PlantHistory/
│   │   └── user/
│   │       ├── Profile/
│   │       ├── Stats/
│   │       └── Settings/
│   │
│   ├── pages/
│   │   ├── Home/
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Dashboard/
│   │   ├── PlantCatalog/
│   │   ├── MyGarden/
│   │   ├── PlantDetail/
│   │   ├── Achievements/
│   │   ├── Leaderboard/
│   │   └── Profile/
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePlants.ts
│   │   ├── useSimulation.ts
│   │   └── useWebSocket.ts
│   │
│   ├── services/
│   │   ├── api.ts               # Axios 인스턴스
│   │   ├── auth.service.ts
│   │   ├── plant.service.ts
│   │   ├── userPlant.service.ts
│   │   └── websocket.service.ts
│   │
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── plantSlice.ts
│   │   │   └── uiSlice.ts
│   │   └── index.ts             # Redux store
│   │
│   ├── types/
│   │   ├── plant.types.ts
│   │   ├── user.types.ts
│   │   └── api.types.ts
│   │
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── constants.ts
│   │
│   ├── styles/
│   │   ├── global.css
│   │   ├── variables.css
│   │   └── themes/
│   │
│   ├── App.tsx
│   ├── index.tsx
│   └── routes.tsx
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 7. 기술 스택

### 7.1 백엔드

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **런타임** | Node.js | 20.x LTS | JavaScript 실행 환경 |
| **프레임워크** | Express.js | 4.x | RESTful API 서버 |
| **언어** | TypeScript | 5.x | 타입 안전 개발 |
| **데이터베이스** | PostgreSQL | 16.x | 관계형 데이터베이스 |
| **ORM** | Prisma / TypeORM | Latest | 데이터베이스 ORM |
| **캐시/세션** | Redis | 7.x | 캐싱, 세션 관리 |
| **인증** | JWT | - | 토큰 기반 인증 |
| **비밀번호** | bcrypt | 5.x | 암호화 |
| **유효성 검증** | Joi / Zod | Latest | 입력 검증 |
| **스케줄링** | node-cron | 3.x | 백그라운드 작업 |
| **로깅** | Winston | 3.x | 로그 관리 |
| **테스트** | Jest | 29.x | 단위/통합 테스트 |
| **API 문서** | Swagger / OpenAPI | 3.x | API 문서화 |

### 7.2 프론트엔드

| 분류 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **프레임워크** | React | 18.x | UI 라이브러리 |
| **언어** | TypeScript | 5.x | 타입 안전 개발 |
| **상태 관리** | Redux Toolkit | 2.x | 전역 상태 관리 |
| **HTTP 클라이언트** | Axios | 1.x | API 통신 |
| **라우팅** | React Router | 6.x | 클라이언트 라우팅 |
| **스타일링** | Tailwind CSS | 3.x | 유틸리티 CSS |
| **UI 컴포넌트** | Shadcn/ui | Latest | 재사용 컴포넌트 |
| **폼 관리** | React Hook Form | 7.x | 폼 처리 |
| **차트** | Recharts | 2.x | 데이터 시각화 |
| **날짜** | date-fns | 3.x | 날짜 처리 |
| **테스트** | Vitest + RTL | Latest | 컴포넌트 테스트 |
| **빌드 도구** | Vite | 5.x | 빠른 빌드 |

### 7.3 DevOps & 인프라

| 분류 | 기술 | 용도 |
|------|------|------|
| **컨테이너** | Docker | 애플리케이션 컨테이너화 |
| **오케스트레이션** | Docker Compose | 로컬 개발 환경 |
| **CI/CD** | GitHub Actions | 자동 배포 파이프라인 |
| **호스팅 (API)** | AWS EC2 / Render | 백엔드 서버 호스팅 |
| **호스팅 (Web)** | Vercel / Netlify | 프론트엔드 호스팅 |
| **데이터베이스** | AWS RDS / Supabase | PostgreSQL 관리형 서비스 |
| **CDN** | Cloudflare | 정적 파일 배포 |
| **모니터링** | Sentry | 에러 추적 |
| **로그** | Logtail | 로그 수집 및 분석 |

---

## 8. 배포 전략

### 8.1 개발 환경

#### 로컬 개발 (Docker Compose)
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: plantii_dev
      POSTGRES_USER: plantii
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./plantii-backend
      dockerfile: Dockerfile.dev
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://plantii:dev_password@postgres:5432/plantii_dev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_secret_key
    ports:
      - "3000:3000"
    volumes:
      - ./plantii-backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    command: npm run dev

  frontend:
    build:
      context: ./plantii-frontend
      dockerfile: Dockerfile.dev
    environment:
      VITE_API_URL: http://localhost:3000/api/v1
    ports:
      - "5173:5173"
    volumes:
      - ./plantii-frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
```

**실행**:
```bash
docker-compose up -d
```

### 8.2 프로덕션 배포

#### 백엔드 (Render / AWS EC2)

**Dockerfile**:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

**환경 변수 (.env.production)**:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/plantii_prod
REDIS_URL=redis://redis:6379
JWT_SECRET=super_secret_key_change_this
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=30d
CORS_ORIGIN=https://plantii.app
```

#### 프론트엔드 (Vercel)

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://api.plantii.app/v1"
  }
}
```

### 8.3 CI/CD 파이프라인

**GitHub Actions (.github/workflows/deploy.yml)**:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: npm ci
        working-directory: ./plantii-backend
      - name: Run tests
        run: npm test
        working-directory: ./plantii-backend

  deploy-backend:
    needs: test-backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Render
        env:
          RENDER_API_KEY: ${{ secrets.RENDER_API_KEY }}
        run: |
          curl -X POST https://api.render.com/deploy/srv-xxx

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 9. 향후 확장 계획 (Phase 2+)

### Phase 2 - 소셜 기능
- 친구 시스템 및 식물 공유
- 식물 거래소 (씨앗/희귀 변종 교환)
- 커뮤니티 챌린지

### Phase 3 - 고급 기능
- 식물 교배 시스템
- 해충/질병 시뮬레이션
- 계절 시스템

### Phase 4 - 모바일 앱
- React Native 앱 개발
- 푸시 알림
- 오프라인 모드

---

**문서 버전**: 1.0  
**최종 업데이트**: 2026-04-08  
**작성자**: Plantii Development Team
