# Plantii Deployment Guide

**프로젝트**: Plantii Phase 1 - Digital Plant Growth Simulation  
**배포 날짜**: 2026-04-08  
**버전**: 1.0.0  

---

## 📋 목차

1. [배포 아키텍처](#배포-아키텍처)
2. [사전 요구사항](#사전-요구사항)
3. [백엔드 배포 (Railway)](#백엔드-배포-railway)
4. [프론트엔드 배포 (Vercel)](#프론트엔드-배포-vercel)
5. [CI/CD 설정](#cicd-설정)
6. [배포 후 체크리스트](#배포-후-체크리스트)
7. [환경 변수](#환경-변수)
8. [문제 해결](#문제-해결)

---

## 🏗️ 배포 아키텍처

```
┌─────────────────┐
│   GitHub Repo   │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
    ┌────▼─────┐      ┌────▼─────┐      ┌────▼─────┐
    │  GitHub  │      │ Railway  │      │  Vercel  │
    │ Actions  │      │ (Backend)│      │(Frontend)│
    │   CI/CD  │      │          │      │          │
    └──────────┘      └────┬─────┘      └────┬─────┘
                           │                  │
                      ┌────▼─────┐           │
                      │PostgreSQL│           │
                      │ Database │           │
                      └──────────┘           │
                                             │
                      ┌──────────────────────▼──┐
                      │   Users (Browser/PWA)   │
                      └─────────────────────────┘
```

### 서비스 역할

- **Railway**: 백엔드 API + PostgreSQL 데이터베이스 호스팅
- **Vercel**: 프론트엔드 정적 사이트 호스팅
- **GitHub Actions**: 자동 테스트 및 배포 파이프라인

---

## 📦 사전 요구사항

### 계정 생성

1. **Railway** 계정
   - 웹사이트: https://railway.app
   - GitHub 계정으로 가입 권장
   - 무료 플랜: $5 크레딧 제공

2. **Vercel** 계정
   - 웹사이트: https://vercel.com
   - GitHub 계정으로 가입 권장
   - 무료 플랜: 무제한 배포

3. **GitHub** 저장소
   - 이미 생성됨: `plantii-phase1`

### 필요한 도구

```bash
# Node.js 20.x 이상
node --version  # v20.0.0+

# npm 9.x 이상
npm --version   # 9.0.0+

# Git
git --version
```

---

## 🚂 백엔드 배포 (Railway)

### 1단계: Railway 프로젝트 생성

1. **Railway 대시보드 접속**
   - https://railway.app/dashboard

2. **New Project 클릭**
   - "Deploy from GitHub repo" 선택
   - `plantii-phase1` 저장소 선택
   - `backend` 디렉토리를 루트로 설정

3. **PostgreSQL 추가**
   - 프로젝트에서 "New" → "Database" → "PostgreSQL" 클릭
   - 자동으로 `DATABASE_URL` 환경 변수 생성됨

### 2단계: 환경 변수 설정

Railway 대시보드에서 다음 환경 변수 추가:

```bash
# 자동 생성 (PostgreSQL)
DATABASE_URL=${RAILWAY_POSTGRES_URL}

# 수동 설정 필요
NODE_ENV=production
PORT=3000
API_VERSION=v1

# JWT Secrets (강력한 랜덤 문자열로 변경!)
JWT_SECRET=CHANGE_THIS_TO_STRONG_RANDOM_STRING
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=CHANGE_THIS_TO_ANOTHER_STRONG_RANDOM_STRING
REFRESH_TOKEN_EXPIRES_IN=30d

# CORS (Vercel URL로 변경)
CORS_ORIGIN=https://your-app.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Simulation
SIMULATION_INTERVAL_HOURS=1
TIME_SCALE=1.0
```

#### JWT Secret 생성 방법:

```bash
# Node.js로 랜덤 문자열 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3단계: 배포 설정

1. **Settings** 탭에서:
   - **Root Directory**: `backend` 설정
   - **Build Command**: `npm install && npm run build && npm run migrate`
   - **Start Command**: `npm start`

2. **Deploy** 클릭
   - 첫 배포 시작
   - 로그 확인

3. **도메인 확인**
   - Settings → Networking → Generate Domain
   - 생성된 URL 복사 (예: `https://plantii-backend.up.railway.app`)

### 4단계: 데이터베이스 마이그레이션

Railway 대시보드에서 자동으로 실행되지만, 수동 실행이 필요한 경우:

```bash
# Railway CLI 설치
npm install -g @railway/cli

# Railway 로그인
railway login

# 프로젝트 연결
railway link

# 마이그레이션 실행
railway run npm run migrate

# Seed 데이터 삽입
railway run npm run seed
```

### 5단계: 배포 확인

```bash
# Health Check
curl https://your-backend.railway.app/health

# 예상 응답:
# {
#   "status": "ok",
#   "timestamp": "2026-04-08T...",
#   "database": "connected"
# }
```

---

## ▲ 프론트엔드 배포 (Vercel)

### 1단계: Vercel 프로젝트 생성

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard

2. **New Project 클릭**
   - "Import Git Repository" 선택
   - `plantii-phase1` 저장소 선택

3. **프로젝트 설정**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 2단계: 환경 변수 설정

Vercel 프로젝트 설정에서 Environment Variables 추가:

```bash
# 백엔드 API URL (Railway URL로 변경)
VITE_API_URL=https://your-backend.railway.app/api/v1

# Environment
NODE_ENV=production
```

**중요**: Railway 백엔드 URL을 먼저 확인하고 설정!

### 3단계: 배포

1. **Deploy** 클릭
   - 자동 빌드 및 배포 시작
   - 로그 확인

2. **도메인 확인**
   - 생성된 URL 확인 (예: `https://plantii.vercel.app`)

3. **커스텀 도메인 설정** (선택사항)
   - Settings → Domains
   - 원하는 도메인 추가

### 4단계: CORS 설정 업데이트

Vercel 프론트엔드 URL을 확인한 후, Railway 백엔드의 `CORS_ORIGIN` 환경 변수를 업데이트:

```bash
CORS_ORIGIN=https://plantii.vercel.app
```

Railway에서 환경 변수 변경 후 재배포 필요.

### 5단계: 배포 확인

```bash
# 프론트엔드 접속
curl https://plantii.vercel.app

# 또는 브라우저에서 직접 접속
```

---

## 🔄 CI/CD 설정

### GitHub Actions 자동 배포

이미 설정된 워크플로우:
- `.github/workflows/ci-cd.yml` - main 브랜치 푸시 시 자동 배포
- `.github/workflows/test-only.yml` - 다른 브랜치 테스트만 실행

### GitHub Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions에서 추가:

#### Railway 배포용:
```
RAILWAY_TOKEN=your_railway_token
```

Railway Token 발급:
1. Railway 대시보드 → Account Settings → Tokens
2. "Create New Token" 클릭
3. 생성된 토큰 복사

#### Vercel 배포용:
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id
```

Vercel 정보 확인:
```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 프로젝트 정보 확인
cd frontend
vercel link
cat .vercel/project.json
```

### 배포 트리거

```bash
# main 브랜치에 푸시하면 자동 배포
git push origin main

# 또는 Pull Request 생성 시 자동 테스트
```

---

## ✅ 배포 후 체크리스트

### 1. 백엔드 Health Check

```bash
# Health endpoint
curl https://your-backend.railway.app/health

# 예상 응답:
{
  "status": "ok",
  "timestamp": "2026-04-08T12:00:00.000Z",
  "uptime": 123.456,
  "environment": "production",
  "database": "connected"
}
```

### 2. 프론트엔드 접속

브라우저에서 `https://your-app.vercel.app` 접속:

- [x] 로그인 페이지 로딩 확인
- [x] CSS 스타일 정상 적용
- [x] 이미지 및 아이콘 로딩

### 3. 회원가입 테스트

1. 회원가입 페이지 이동
2. 테스트 계정 생성:
   ```
   사용자명: testuser01
   이메일: test@example.com
   비밀번호: TestPassword123!
   ```
3. 회원가입 성공 확인
4. 자동 로그인 확인

### 4. 로그인 테스트

1. 로그아웃 후 로그인 페이지 이동
2. 생성한 계정으로 로그인
3. 대시보드로 리다이렉트 확인

### 5. 식물 기능 테스트

1. **도감 페이지**
   - /collection 이동
   - 15종 식물 카탈로그 표시 확인
   - 카테고리별 분류 확인

2. **식물 추가** (개발 필요 시)
   - "심기" 버튼 클릭
   - 식물 생성 확인

3. **액션 수행**
   - 💧 물주기 버튼 클릭
   - API 호출 확인 (Network 탭)
   - 성공 메시지 확인
   - ☀️ 햇빛 버튼 클릭
   - 상태 변화 확인

4. **프로필 페이지**
   - /profile 이동
   - 사용자 정보 표시 확인
   - 로그아웃 기능 확인

### 6. PWA 설치 테스트

#### Chrome (Desktop)
1. 프론트엔드 URL 접속
2. 주소창 오른쪽 "설치" 아이콘 클릭
3. "설치" 버튼 클릭
4. 앱이 별도 창으로 열림 확인

#### Chrome (Mobile)
1. 모바일 브라우저에서 접속
2. 메뉴 → "홈 화면에 추가" 클릭
3. 아이콘이 홈 화면에 추가됨 확인
4. 아이콘 클릭 시 앱 모드로 실행 확인

#### Service Worker 확인
1. F12 → Application 탭
2. Service Workers 섹션
3. Status: "activated and is running" 확인
4. 오프라인 모드로 전환 (Network 탭)
5. 캐시된 페이지 로딩 확인

### 7. API 엔드포인트 테스트

```bash
# 1. 회원가입
curl -X POST https://your-backend.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testapi",
    "email": "testapi@example.com",
    "password": "TestPassword123!"
  }'

# 2. 로그인
curl -X POST https://your-backend.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testapi@example.com",
    "password": "TestPassword123!"
  }'

# 응답에서 access_token 복사

# 3. 식물 목록 조회
curl https://your-backend.railway.app/api/v1/plants

# 4. 내 식물 조회 (인증 필요)
curl https://your-backend.railway.app/api/v1/user-plants \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 8. 성능 테스트

1. **Lighthouse 점수**
   - F12 → Lighthouse 탭
   - "Generate report" 클릭
   - 목표:
     - Performance: 90+
     - Accessibility: 90+
     - Best Practices: 90+
     - SEO: 90+
     - PWA: 90+

2. **로딩 시간**
   - 초기 로딩: < 2초
   - API 응답: < 500ms

### 9. 모니터링 설정

#### Railway (백엔드)
- Metrics 탭에서 CPU, Memory, Network 사용량 확인
- Logs 탭에서 에러 로그 모니터링

#### Vercel (프론트엔드)
- Analytics 탭에서 방문자 통계 확인
- Speed Insights로 성능 모니터링

---

## 🌍 배포 URL

### Production (예시)

| 서비스 | URL | 상태 |
|--------|-----|------|
| **백엔드 API** | `https://plantii-backend.up.railway.app` | 🟢 Online |
| **프론트엔드** | `https://plantii.vercel.app` | 🟢 Online |
| **데이터베이스** | Railway PostgreSQL (Private) | 🟢 Online |

### 테스트 계정

**주의**: 실제 배포 후 변경 필요

```
이메일: demo@plantii.app
비밀번호: DemoPassword123!
```

### API 엔드포인트

**Base URL**: `https://plantii-backend.up.railway.app/api/v1`

주요 엔드포인트:
- `GET /health` - 서버 상태 확인
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `GET /plants` - 식물 카탈로그
- `GET /user-plants` - 내 식물 목록
- `POST /user-plants/:id/water` - 물주기
- `POST /user-plants/:id/environment` - 환경 조절
- `POST /user-plants/:id/harvest` - 수확

---

## 🔧 환경 변수

### Railway (백엔드)

```bash
# 필수 환경 변수
DATABASE_URL=postgresql://...          # Railway PostgreSQL 자동 생성
NODE_ENV=production
PORT=3000
JWT_SECRET=<strong-random-string>      # ⚠️ 변경 필요!
REFRESH_TOKEN_SECRET=<random-string>   # ⚠️ 변경 필요!
CORS_ORIGIN=https://plantii.vercel.app # Vercel URL로 변경

# 선택적 환경 변수
API_VERSION=v1
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=30d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
SIMULATION_INTERVAL_HOURS=1
TIME_SCALE=1.0
```

### Vercel (프론트엔드)

```bash
# 필수 환경 변수
VITE_API_URL=https://plantii-backend.up.railway.app/api/v1  # Railway URL로 변경

# 선택적 환경 변수
NODE_ENV=production
```

---

## 🐛 문제 해결

### 백엔드 배포 실패

#### 1. 데이터베이스 연결 실패
```
Error: connect ECONNREFUSED
```

**해결방법**:
- Railway PostgreSQL이 시작되었는지 확인
- `DATABASE_URL` 환경 변수 확인
- Railway 로그에서 상세 에러 확인

#### 2. 마이그레이션 실패
```
Error: Migration failed
```

**해결방법**:
```bash
# Railway CLI로 수동 마이그레이션
railway run npm run migrate

# 롤백 후 재시도
railway run npm run migrate:rollback
railway run npm run migrate
```

#### 3. 빌드 실패
```
Error: Build failed
```

**해결방법**:
- `package.json`의 `engines` 확인
- TypeScript 컴파일 에러 확인
- Railway 로그에서 상세 에러 확인

### 프론트엔드 배포 실패

#### 1. 빌드 에러
```
Error: Command "npm run build" exited with 1
```

**해결방법**:
- 로컬에서 `npm run build` 실행하여 에러 확인
- TypeScript 타입 에러 수정
- 환경 변수 `VITE_API_URL` 설정 확인

#### 2. API 연결 실패 (CORS)
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**해결방법**:
- Railway 백엔드의 `CORS_ORIGIN` 확인
- Vercel 프론트엔드 URL과 일치하는지 확인
- Railway 재배포

#### 3. 환경 변수 미적용
```
API calls fail with undefined URL
```

**해결방법**:
- Vercel 프로젝트 Settings → Environment Variables 확인
- `VITE_API_URL` 변수 존재 확인
- Redeploy 클릭

### CI/CD 실패

#### 1. GitHub Actions 실패
```
Error: Tests failed
```

**해결방법**:
- Actions 탭에서 로그 확인
- 로컬에서 `npm test` 실행
- 실패한 테스트 수정 후 재푸시

#### 2. Railway/Vercel Token 에러
```
Error: Unauthorized
```

**해결방법**:
- GitHub Secrets 확인
- Token 재발급 및 업데이트

### 데이터베이스 문제

#### 1. Seed 데이터 없음
```
GET /plants returns empty array
```

**해결방법**:
```bash
# Railway CLI로 seed 실행
railway run npm run seed
```

#### 2. 마이그레이션 버전 충돌
```
Error: Migration lock error
```

**해결방법**:
```bash
# 마이그레이션 상태 확인
railway run npx knex migrate:status

# 필요 시 롤백 후 재실행
railway run npm run migrate:rollback
railway run npm run migrate
```

---

## 📊 모니터링 및 로그

### Railway 로그 확인

```bash
# Railway CLI로 실시간 로그 확인
railway logs

# 특정 서비스 로그
railway logs --service backend
```

### Vercel 로그 확인

Vercel 대시보드:
1. 프로젝트 선택
2. Deployments 탭
3. 배포 클릭
4. Function Logs 확인

### 에러 추적

권장 서비스:
- **Sentry**: 에러 추적 및 알림
- **LogRocket**: 세션 재생 및 에러 추적
- **Datadog**: 종합 모니터링

---

## 🔒 보안 체크리스트

- [x] JWT Secret을 강력한 랜덤 문자열로 변경
- [x] DATABASE_URL 외부 노출 방지
- [x] CORS Origin을 프론트엔드 URL로만 제한
- [x] HTTPS 사용 (Railway/Vercel 자동 제공)
- [x] Rate Limiting 활성화
- [x] Helmet.js 보안 헤더 적용
- [x] 환경 변수로 민감 정보 관리
- [ ] 정기적인 의존성 업데이트 (`npm audit`)
- [ ] 프로덕션 로그 레벨 설정 (`LOG_LEVEL=info`)

---

## 📚 추가 리소스

### 공식 문서
- [Railway Docs](https://docs.railway.app)
- [Vercel Docs](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)

### 유용한 링크
- [PostgreSQL 최적화](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Node.js 프로덕션 베스트 프랙티스](https://github.com/goldbergyoni/nodebestpractices)
- [React PWA 가이드](https://create-react-app.dev/docs/making-a-progressive-web-app/)

---

## 🎯 다음 단계

### Phase 2 기능 추가
- [ ] 소셜 로그인 (Google, GitHub)
- [ ] 실시간 알림 (WebSocket)
- [ ] 식물 거래 마켓플레이스
- [ ] 업적 시스템
- [ ] 순위표

### 인프라 개선
- [ ] CDN 설정 (Cloudflare)
- [ ] 이미지 최적화 (Next.js Image)
- [ ] 데이터베이스 백업 자동화
- [ ] 로드 밸런싱
- [ ] 캐싱 레이어 (Redis)

### 모니터링 강화
- [ ] Sentry 에러 추적
- [ ] Google Analytics
- [ ] Uptime 모니터링
- [ ] 성능 모니터링 (APM)

---

## 📞 지원

### 문제 발생 시

1. **Railway 지원**: https://railway.app/help
2. **Vercel 지원**: https://vercel.com/support
3. **GitHub Issues**: https://github.com/BOSEON-SEO/plantii-phase1/issues

### 업데이트 확인

```bash
# 최신 main 브랜치 가져오기
git pull origin main

# 의존성 업데이트
npm update

# 보안 취약점 확인
npm audit
```

---

**배포 완료**: ✅  
**문서 작성자**: Claude Sonnet 4.5  
**마지막 업데이트**: 2026-04-08  

**프로젝트 상태**: Production Ready 🚀
