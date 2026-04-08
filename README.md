# 🌱 Plantii - 디지털 식물 육성 시뮬레이션 플랫폼

> **Phase 1**: 실제 식물 데이터 기반 성장 시뮬레이션 시스템

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

## 📋 프로젝트 개요

Plantii는 실제 식물의 생육환경 데이터를 기반으로 한 디지털 식물 육성 시뮬레이션 플랫폼입니다. 사용자는 가상 환경에서 식물을 키우며 실제 원예 지식을 습득할 수 있습니다.

### 주요 기능

- ✅ **15종의 실제 식물 데이터** - 장미, 선인장, 튤립, 해바라기, 토마토, 허브 등
- ✅ **환경 변수 기반 시뮬레이션** - 온도, 습도, 광량, 수분 실시간 반영
- ✅ **성장 단계 시스템** - 씨앗부터 수확까지 단계별 성장
- ✅ **건강도 및 스트레스 관리** - 환경 조건에 따른 식물 상태 변화
- ✅ **업적 및 보상 시스템** - 성공적인 재배 시 경험치/코인 획득

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 20.x 이상
- PostgreSQL 16.x
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/plantii.git
cd plantii

# 백엔드 설치
cd backend
npm install

# 프론트엔드 설치
cd ../frontend
npm install
```

### 환경 설정

```bash
# 백엔드 환경 변수 설정
cd backend
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 연결 정보 입력
```

### 데이터베이스 초기화

```bash
# PostgreSQL 데이터베이스 생성
createdb plantii_dev

# 마이그레이션 실행
cd backend
npm run migrate
```

### 개발 서버 실행

```bash
# 백엔드 서버 (터미널 1)
cd backend
npm run dev

# 프론트엔드 서버 (터미널 2)
cd frontend
npm run dev
```

서버가 실행되면:
- 백엔드: http://localhost:3000
- 프론트엔드: http://localhost:5173

## 📁 프로젝트 구조

```
plantii/
├── backend/                # Node.js + Express 백엔드
│   ├── routes/            # API 라우트
│   ├── controllers/       # 컨트롤러
│   ├── models/            # 데이터 모델
│   ├── middleware/        # 미들웨어
│   ├── services/          # 비즈니스 로직
│   ├── migrations/        # DB 마이그레이션
│   └── package.json
│
├── frontend/              # React + TypeScript 프론트엔드
│   ├── src/
│   │   ├── components/    # React 컴포넌트
│   │   ├── pages/         # 페이지
│   │   ├── services/      # API 서비스
│   │   ├── store/         # 상태 관리 (Redux)
│   │   ├── types/         # TypeScript 타입
│   │   └── utils/         # 유틸리티
│   └── package.json
│
├── docs/                  # 프로젝트 문서
│   ├── TECHNICAL_DESIGN.md
│   └── API.md
│
└── README.md
```

## 🛠 기술 스택

### 백엔드
- **런타임**: Node.js 20.x
- **프레임워크**: Express.js 4.x
- **언어**: TypeScript 5.x
- **데이터베이스**: PostgreSQL 16.x
- **인증**: JWT
- **ORM**: Prisma / TypeORM

### 프론트엔드
- **프레임워크**: React 18.x
- **언어**: TypeScript 5.x
- **빌드 도구**: Vite 5.x
- **상태 관리**: Redux Toolkit
- **스타일링**: Tailwind CSS
- **HTTP 클라이언트**: Axios

## 📚 API 문서

API 문서는 개발 서버 실행 후 다음 주소에서 확인할 수 있습니다:
- Swagger UI: http://localhost:3000/api-docs

주요 엔드포인트:
- `POST /api/v1/auth/register` - 회원가입
- `POST /api/v1/auth/login` - 로그인
- `GET /api/v1/plants` - 식물 목록 조회
- `POST /api/v1/user-plants` - 식물 심기
- `POST /api/v1/user-plants/:id/water` - 물 주기
- `POST /api/v1/user-plants/:id/harvest` - 수확

## 🌱 식물 카탈로그

Plantii는 다음 15종의 실제 식물 데이터를 포함합니다:

### 화훼류
- 장미 (Rose)
- 튤립 (Tulip)
- 해바라기 (Sunflower)
- 난초 (Orchid)

### 다육/선인장
- 선인장 (Cactus)
- 알로에 (Aloe Vera)
- 에케베리아 (Echeveria)

### 허브
- 라벤더 (Lavender)
- 바질 (Basil)
- 민트 (Mint)

### 관엽식물
- 고무나무 (Rubber Plant)
- 몬스테라 (Monstera)

### 채소류
- 상추 (Lettuce)
- 토마토 (Tomato)
- 고추 (Chili Pepper)

## 🧪 테스트

```bash
# 백엔드 테스트
cd backend
npm test

# 프론트엔드 테스트
cd frontend
npm test
```

## 🚢 배포

### Docker를 이용한 배포

```bash
docker-compose up -d
```

### 프로덕션 빌드

```bash
# 백엔드
cd backend
npm run build

# 프론트엔드
cd frontend
npm run build
```

## 📖 문서

- [기술 설계 문서](docs/TECHNICAL_DESIGN.md)
- [식물 카탈로그](docs/PLANT_CATALOG_SUMMARY.md)
- [API 명세서](docs/API.md)

## 🤝 기여하기

기여를 환영합니다! Pull Request를 보내주세요.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 👥 팀

- **프로젝트 관리**: Plantii Team
- **기술 설계**: Development Team
- **식물 데이터 조사**: Research Team

## 📧 연락처

프로젝트 링크: [https://github.com/YOUR_USERNAME/plantii](https://github.com/YOUR_USERNAME/plantii)

---

**Made with 💚 by Plantii Team**
