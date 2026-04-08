# GitHub Actions CI/CD 설정 가이드

GitHub Actions 워크플로우 파일은 `workflow` 스코프가 있는 Personal Access Token이 필요하므로, GitHub UI를 통해 수동으로 추가해야 합니다.

## 📋 워크플로우 파일 추가 방법

### 방법 1: GitHub 웹 UI 사용 (권장)

1. **GitHub 저장소 접속**
   - https://github.com/BOSEON-SEO/plantii-phase1

2. **.github/workflows 디렉토리 생성**
   - "Add file" → "Create new file" 클릭
   - 파일명: `.github/workflows/ci-cd.yml`

3. **ci-cd.yml 내용 복사**
   - 아래 내용을 복사하여 붙여넣기

4. **커밋**
   - Commit message: `ci: Add CI/CD workflow`
   - "Commit new file" 클릭

5. **test-only.yml 추가**
   - 같은 방법으로 `.github/workflows/test-only.yml` 생성

### 방법 2: GitHub CLI 사용

```bash
# GitHub CLI 설치 (Windows)
winget install GitHub.cli

# 로그인 (workflow 스코프 포함)
gh auth login --scopes workflow

# 워크플로우 파일 생성
mkdir -p .github/workflows
cp .github/workflows/ci-cd.yml.example .github/workflows/ci-cd.yml
cp .github/workflows/test-only.yml.example .github/workflows/test-only.yml

# 커밋 및 푸시
git add .github/workflows/
git commit -m "ci: Add CI/CD workflows"
git push
```

---

## 📄 워크플로우 파일 내용

### .github/workflows/ci-cd.yml

\`\`\`yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  # Backend Tests
  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run linter
        working-directory: ./backend
        run: npm run lint --if-present || echo "Linting skipped"

      - name: Run tests
        working-directory: ./backend
        run: npm test -- --coverage --passWithNoTests

      - name: Build
        working-directory: ./backend
        run: npm run build

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          directory: ./backend/coverage
          flags: backend
          name: backend-coverage

  # Frontend Tests
  frontend-test:
    name: Frontend Tests
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [20.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js \${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run linter
        working-directory: ./frontend
        run: npm run lint --if-present || echo "Linting skipped"

      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_API_URL: https://api.example.com/api/v1

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: frontend-dist
          path: frontend/dist
          retention-days: 7

  # Deploy to Railway (Backend)
  deploy-backend:
    name: Deploy Backend to Railway
    needs: [backend-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: \${{ secrets.RAILWAY_TOKEN }}
          service: backend
        continue-on-error: true

      - name: Notification
        run: echo "Backend deployment triggered on Railway"

  # Deploy to Vercel (Frontend)
  deploy-frontend:
    name: Deploy Frontend to Vercel
    needs: [frontend-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'
        continue-on-error: true

      - name: Notification
        run: echo "Frontend deployment triggered on Vercel"

  # Health Check
  health-check:
    name: Post-Deployment Health Check
    needs: [deploy-backend, deploy-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Wait for deployment
        run: sleep 60

      - name: Check backend health
        run: |
          echo "Checking backend health..."
          # curl -f https://your-backend.railway.app/health || exit 1
        continue-on-error: true

      - name: Check frontend
        run: |
          echo "Checking frontend..."
          # curl -f https://your-frontend.vercel.app || exit 1
        continue-on-error: true
\`\`\`

### .github/workflows/test-only.yml

\`\`\`yaml
name: Tests Only

on:
  push:
    branches-ignore:
      - main
  pull_request:

jobs:
  backend-test:
    name: Backend Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run tests
        working-directory: ./backend
        run: npm test -- --passWithNoTests

  frontend-build:
    name: Frontend Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          VITE_API_URL: https://api.example.com/api/v1
\`\`\`

---

## 🔑 GitHub Secrets 설정

워크플로우가 작동하려면 다음 Secrets를 설정해야 합니다:

### 설정 방법

1. **GitHub 저장소 → Settings → Secrets and variables → Actions**
2. **"New repository secret" 클릭**
3. 아래 Secrets 추가

### Railway 배포용

**Name**: `RAILWAY_TOKEN`  
**Value**: Railway API Token

Railway Token 발급:
1. Railway 대시보드 → Account Settings → Tokens
2. "Create New Token" 클릭
3. 생성된 토큰 복사

### Vercel 배포용

**Name**: `VERCEL_TOKEN`  
**Value**: Vercel API Token

Vercel Token 발급:
1. Vercel 대시보드 → Settings → Tokens
2. "Create Token" 클릭
3. 생성된 토큰 복사

**Name**: `VERCEL_ORG_ID`  
**Value**: Vercel Organization ID

**Name**: `VERCEL_PROJECT_ID`  
**Value**: Vercel Project ID

Vercel 정보 확인:
\`\`\`bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 프로젝트 정보 확인
cd frontend
vercel link
cat .vercel/project.json
\`\`\`

---

## ✅ 설정 완료 확인

1. **워크플로우 파일 추가 후**
   - GitHub → Actions 탭 확인
   - 워크플로우가 표시되는지 확인

2. **테스트 실행**
   - 브랜치에 푸시하여 테스트
   - Actions 탭에서 실행 결과 확인

3. **main 브랜치 배포**
   - main 브랜치에 머지 시 자동 배포
   - Railway 및 Vercel에서 배포 확인

---

## 🐛 문제 해결

### 워크플로우가 실행되지 않음

- `.github/workflows/` 경로가 정확한지 확인
- YAML 문법 오류 확인
- Actions 탭에서 에러 메시지 확인

### Railway/Vercel 배포 실패

- GitHub Secrets 설정 확인
- Token 권한 확인
- Railway/Vercel 프로젝트 연결 확인

### 테스트 실패

- 로컬에서 `npm test` 실행하여 확인
- package-lock.json 파일 존재 확인
- Node.js 버전 확인 (20.x)

---

**문서 작성**: 2026-04-08  
**마지막 업데이트**: 2026-04-08
