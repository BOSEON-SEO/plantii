# Plantii Frontend

디지털 식물 육성 시뮬레이션 플랫폼 - 프론트엔드

## 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **React Router v6** - 라우팅
- **Axios** - HTTP 클라이언트
- **Tailwind CSS** - 스타일링
- **PWA** - Progressive Web App 지원

## 주요 기능

### 1. 인증 시스템
- 회원가입 / 로그인
- JWT 토큰 기반 인증
- 자동 로그인 유지

### 2. 메인 대시보드
- 현재 식물 상태 표시
- 도트 이미지 스타일 UI
- 실시간 환경 정보 (온도, 습도, 광량)
- 상태 게이지 (건강도, 수분도, 성장도)

### 3. 상호작용
- 물주기 버튼
- 햇빛 조사 버튼
- 수확 기능

### 4. 도감 시스템
- 전체 식물 목록
- 보유 식물 현황
- 카테고리별 분류
- 난이도 표시

### 5. 프로필
- 사용자 정보
- 레벨 및 경험치
- 코인 보유량
- 로그아웃

### 6. PWA 기능
- 오프라인 지원
- 홈 화면 추가
- 앱처럼 사용 가능

## 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

http://localhost:5173 에서 확인

### 빌드

```bash
npm run build
```

### 프리뷰

```bash
npm run preview
```

## 환경 변수

`.env` 파일을 생성하고 다음 변수를 설정:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 프로젝트 구조

```
frontend/
├── public/                 # 정적 파일
│   ├── manifest.json      # PWA 매니페스트
│   └── service-worker.js  # 서비스 워커
├── src/
│   ├── components/        # 재사용 가능한 컴포넌트
│   │   ├── Button.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Layout.tsx
│   │   └── PrivateRoute.tsx
│   ├── contexts/          # React Context
│   │   └── AuthContext.tsx
│   ├── pages/             # 페이지 컴포넌트
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Collection.tsx
│   │   └── Profile.tsx
│   ├── services/          # API 서비스
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   └── plant.service.ts
│   ├── styles/            # 스타일
│   │   └── index.css
│   ├── App.tsx            # 메인 App 컴포넌트
│   ├── main.tsx           # 진입점
│   └── registerSW.ts      # 서비스 워커 등록
└── package.json
```

## API 연동

백엔드 API와 연동하려면 백엔드 서버가 실행 중이어야 합니다.

```bash
# 백엔드 서버 실행 (별도 터미널)
cd ../backend
npm run dev
```

## 라이선스

MIT
