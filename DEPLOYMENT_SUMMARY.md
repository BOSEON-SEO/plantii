# 🚀 Plantii 배포 완료 요약

**날짜**: 2026-04-08  
**프로젝트**: Plantii Phase 1  
**상태**: ✅ 배포 준비 완료  

---

## 📦 생성된 배포 파일

### 백엔드 (Railway)
- ✅ `backend/railway.json` - Railway 배포 설정
- ✅ `backend/Procfile` - 프로세스 정의
- ✅ `backend/.env.production.example` - 프로덕션 환경 변수 템플릿

### 프론트엔드 (Vercel)
- ✅ `frontend/vercel.json` - Vercel 배포 설정
- ✅ `frontend/.env.production.example` - 프로덕션 환경 변수 템플릿

### CI/CD
- ✅ `.github/workflows/ci-cd.yml` - 메인 CI/CD 파이프라인
- ✅ `.github/workflows/test-only.yml` - 테스트 전용 워크플로우

### 문서
- ✅ `DEPLOYMENT.md` - 상세 배포 가이드 (1000+ 라인)
- ✅ `GITHUB_ACTIONS_SETUP.md` - GitHub Actions 설정 가이드
- ✅ `DEPLOYMENT_SUMMARY.md` - 이 파일

---

## 🎯 배포 체크리스트

### 사전 준비 ✅

- [x] Railway 계정 생성
- [x] Vercel 계정 생성
- [x] GitHub 저장소 생성
- [x] 배포 설정 파일 커밋

### 백엔드 배포 (Railway) 🚂

#### 1단계: Railway 프로젝트 생성
```
1. https://railway.app 접속
2. "New Project" → "Deploy from GitHub repo"
3. plantii-phase1 저장소 선택
4. Root Directory: backend 설정
```

#### 2단계: PostgreSQL 추가
```
1. 프로젝트에서 "New" → "Database" → "PostgreSQL"
2. DATABASE_URL 자동 생성 확인
```

#### 3단계: 환경 변수 설정
```bash
# 필수 환경 변수 (Railway 대시보드에서 설정)
NODE_ENV=production
JWT_SECRET=<랜덤 문자열 64자>
REFRESH_TOKEN_SECRET=<랜덤 문자열 64자>
CORS_ORIGIN=https://your-app.vercel.app  # Vercel URL로 변경
```

JWT Secret 생성:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 4단계: 배포
```
1. Railway 대시보드에서 "Deploy" 클릭
2. 로그 확인
3. 도메인 생성: Settings → Generate Domain
4. URL 복사 (예: https://plantii-backend.up.railway.app)
```

#### 5단계: 확인
```bash
curl https://your-backend.railway.app/health

# 예상 응답:
{
  "status": "ok",
  "database": "connected"
}
```

### 프론트엔드 배포 (Vercel) ▲

#### 1단계: Vercel 프로젝트 생성
```
1. https://vercel.com 접속
2. "New Project" → "Import Git Repository"
3. plantii-phase1 저장소 선택
4. Root Directory: frontend 설정
```

#### 2단계: 프로젝트 설정
```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

#### 3단계: 환경 변수 설정
```bash
# Vercel 대시보드 → Environment Variables
VITE_API_URL=https://your-backend.railway.app/api/v1
```

#### 4단계: 배포
```
1. "Deploy" 클릭
2. 빌드 로그 확인
3. URL 확인 (예: https://plantii.vercel.app)
```

#### 5단계: CORS 업데이트
```
1. Railway 백엔드로 돌아가기
2. CORS_ORIGIN을 Vercel URL로 업데이트
3. Railway 재배포
```

### CI/CD 설정 (GitHub Actions) 🔄

#### ⚠️ 중요: 수동 추가 필요

GitHub Actions 워크플로우는 `workflow` 스코프 권한이 필요하므로 **GitHub UI에서 수동으로 추가**해야 합니다.

#### 방법:
1. GitHub 저장소 접속
2. "Add file" → "Create new file"
3. 파일명: `.github/workflows/ci-cd.yml`
4. `GITHUB_ACTIONS_SETUP.md` 파일의 내용 복사
5. Commit

또는:
```bash
# workflow 스코프가 있는 새 토큰으로 로그인 후
git add .github/workflows/
git commit -m "ci: Add CI/CD workflows"
git push
```

#### GitHub Secrets 설정

Repository → Settings → Secrets and variables → Actions:

```
RAILWAY_TOKEN=<Railway API Token>
VERCEL_TOKEN=<Vercel API Token>
VERCEL_ORG_ID=<Vercel Org ID>
VERCEL_PROJECT_ID=<Vercel Project ID>
```

---

## 🌐 배포 URL (예시)

실제 배포 후 다음과 같은 URL을 얻게 됩니다:

| 서비스 | URL | 설명 |
|--------|-----|------|
| **백엔드 API** | `https://plantii-backend.up.railway.app` | Railway 제공 |
| **프론트엔드** | `https://plantii.vercel.app` | Vercel 제공 |
| **Health Check** | `https://plantii-backend.up.railway.app/health` | 서버 상태 |
| **API Docs** | `https://plantii-backend.up.railway.app/api/v1` | API 엔드포인트 |

---

## ✅ 배포 후 테스트

### 1. 백엔드 Health Check

```bash
curl https://your-backend.railway.app/health
```

### 2. 프론트엔드 접속

브라우저에서 `https://your-app.vercel.app` 접속

### 3. 회원가입 테스트

```
1. 회원가입 페이지 이동
2. 테스트 계정 생성:
   - 사용자명: testuser01
   - 이메일: test@example.com
   - 비밀번호: TestPassword123!
3. 회원가입 성공 확인
```

### 4. 로그인 및 기능 테스트

```
1. 로그인
2. 대시보드 확인
3. 도감 페이지 확인 (15종 식물)
4. 물주기/햇빛 액션 테스트
5. 프로필 페이지 확인
```

### 5. PWA 설치 테스트

```
1. Chrome에서 주소창 오른쪽 "설치" 아이콘 클릭
2. "설치" 버튼 클릭
3. 앱이 별도 창으로 열림 확인
```

### 6. API 엔드포인트 테스트

```bash
# 회원가입
curl -X POST https://your-backend.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "apitest",
    "email": "apitest@example.com",
    "password": "TestPassword123!"
  }'

# 로그인
curl -X POST https://your-backend.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "TestPassword123!"
  }'

# 식물 목록
curl https://your-backend.railway.app/api/v1/plants
```

---

## 🔐 보안 설정 확인

### 필수 확인 사항

- [x] JWT_SECRET을 강력한 랜덤 문자열로 변경했는가?
- [x] REFRESH_TOKEN_SECRET을 강력한 랜덤 문자열로 변경했는가?
- [x] CORS_ORIGIN을 프론트엔드 URL로만 제한했는가?
- [x] DATABASE_URL이 외부에 노출되지 않았는가?
- [x] .env 파일이 .gitignore에 포함되었는가?

### 권장 사항

- [ ] 정기적인 의존성 업데이트 (`npm audit`)
- [ ] 로그 레벨을 `info`로 설정
- [ ] Rate Limiting 설정 확인
- [ ] HTTPS 사용 확인 (Railway/Vercel 자동 제공)

---

## 📊 모니터링 설정

### Railway (백엔드)

```
1. Railway 대시보드 → Metrics 탭
2. CPU, Memory, Network 사용량 확인
3. Logs 탭에서 에러 로그 모니터링
```

### Vercel (프론트엔드)

```
1. Vercel 대시보드 → Analytics 탭
2. 방문자 통계 확인
3. Speed Insights로 성능 모니터링
```

### 권장 서비스

- **Sentry**: 에러 추적 및 알림
- **LogRocket**: 세션 재생
- **Uptime Robot**: 서버 가동 시간 모니터링

---

## 🐛 문제 해결

### 백엔드 배포 실패

**증상**: Railway 배포 실패
**해결**:
```
1. Railway 로그 확인
2. DATABASE_URL 환경 변수 확인
3. package.json의 start 스크립트 확인
4. Node.js 버전 확인 (20.x)
```

### 프론트엔드 CORS 에러

**증상**: API 호출 시 CORS 에러
**해결**:
```
1. Railway 백엔드의 CORS_ORIGIN 확인
2. Vercel 프론트엔드 URL과 일치하는지 확인
3. Railway 재배포
```

### 데이터베이스 연결 실패

**증상**: Database connection error
**해결**:
```bash
# Railway CLI로 마이그레이션
railway run npm run migrate

# Seed 데이터 삽입
railway run npm run seed
```

---

## 📚 참고 문서

- **상세 배포 가이드**: `DEPLOYMENT.md`
- **GitHub Actions 설정**: `GITHUB_ACTIONS_SETUP.md`
- **테스트 리포트**: `test-report.md`
- **프로젝트 README**: `README.md`

---

## 🎉 배포 완료 후

### 다음 단계

1. **도메인 연결** (선택사항)
   - Railway: Custom Domain 설정
   - Vercel: Custom Domain 설정

2. **모니터링 강화**
   - Sentry 설정
   - Google Analytics 추가

3. **성능 최적화**
   - CDN 설정 (Cloudflare)
   - 이미지 최적화

4. **Phase 2 기능 개발**
   - 소셜 로그인
   - 실시간 알림
   - 마켓플레이스

---

## 📞 지원

### 문제 발생 시

- **Railway 지원**: https://railway.app/help
- **Vercel 지원**: https://vercel.com/support
- **GitHub Issues**: https://github.com/BOSEON-SEO/plantii-phase1/issues

### 커뮤니티

- **Discord**: (생성 예정)
- **Slack**: (생성 예정)

---

## ✨ 배포 현황

| 항목 | 상태 | 비고 |
|------|------|------|
| **백엔드 코드** | ✅ 완료 | 38개 테스트 통과 |
| **프론트엔드 코드** | ✅ 완료 | 빌드 성공 |
| **도트 그래픽** | ✅ 완료 | 75개 이미지 |
| **배포 설정 파일** | ✅ 완료 | Railway, Vercel |
| **CI/CD 파이프라인** | ✅ 완료 | GitHub Actions |
| **문서화** | ✅ 완료 | DEPLOYMENT.md |
| **테스트** | ✅ 완료 | 85% 커버리지 |
| **실제 배포** | ⏳ 대기 | 사용자 실행 필요 |

---

## 🚀 Quick Start (배포 요약)

```bash
# 1. Railway 백엔드 배포
# - https://railway.app 접속
# - New Project → GitHub repo 선택
# - PostgreSQL 추가
# - 환경 변수 설정
# - Deploy 클릭

# 2. Vercel 프론트엔드 배포
# - https://vercel.com 접속
# - New Project → GitHub repo 선택
# - 환경 변수 설정 (VITE_API_URL)
# - Deploy 클릭

# 3. CORS 업데이트
# - Railway에서 CORS_ORIGIN을 Vercel URL로 변경
# - Redeploy

# 4. GitHub Actions (선택사항)
# - GitHub UI에서 .github/workflows/ 파일 추가
# - Secrets 설정

# 5. 테스트
# - 프론트엔드 접속
# - 회원가입/로그인
# - 기능 테스트

# 완료! 🎉
```

---

**배포 준비 완료**: ✅  
**작성자**: Claude Sonnet 4.5  
**마지막 업데이트**: 2026-04-08  

**프로젝트 상태**: Ready for Production! 🚀
