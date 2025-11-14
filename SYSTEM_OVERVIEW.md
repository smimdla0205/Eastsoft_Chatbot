# 🎯 챗봇 전체 시스템 (Frontend + Backend)

## 📋 빠른 시작 (Quick Start)

### 프론트엔드 (Next.js)

```bash
# 1. 의존성 설치
npm install

# 2. 개발 서버 실행
npm run dev

# 3. 브라우저 접속
# http://localhost:3000
```

### 백엔드 (AWS Lambda)

```bash
cd backend

# 1. 배포 (처음 한 번만)
serverless deploy --stage dev

# 2. 로그 확인
serverless logs -f enhanced-chatbot --stage dev
```

---

## 🗂️ 프로젝트 구조

```
project/
│
├── 📱 프론트엔드 (현재 디렉토리)
│   ├── app/
│   │   ├── page.tsx                     # 메인 페이지
│   │   ├── api/chat/route.ts           # API 게이트웨이
│   │   └── games/                       # 게임별 페이지
│   ├── components/
│   │   ├── AIChatbot.tsx               # 챗봇 UI
│   │   └── ui/button.tsx               # UI 컴포넌트
│   ├── lib/
│   │   ├── chatbot-api.ts              # API 클라이언트
│   │   ├── utils.ts                    # 유틸리티
│   │   └── bigkinds.ts                 # BigKinds API
│   ├── package.json                    # 의존성
│   ├── tsconfig.json                   # TS 설정
│   ├── .env.local                      # 환경변수 (로컬)
│   └── .env.production                 # 환경변수 (배포)
│
├── 🔧 백엔드 (backend/)
│   ├── lambda/
│   │   ├── enhanced-chatbot-handler.py # 핵심 로직
│   │   ├── requirements.txt            # Python 의존성
│   │   └── botocore/                   # AWS SDK
│   ├── serverless.yml                  # 배포 설정
│   ├── deploy-*.sh                     # 배포 스크립트
│   ├── .env.example                    # 환경변수 템플릿
│   └── package.json                    # Node.js 설정
│
├── 📖 문서
│   ├── README.md                       # 프로젝트 개요 (이 파일)
│   ├── BACKEND_SETUP_GUIDE.md         # 백엔드 상세 설정
│   ├── AWS_QUICK_START.md             # AWS 빠른 시작
│   ├── CHATBOT_SYSTEM_ARCHITECTURE.md # 전체 아키텍처
│   ├── CHATBOT_MIGRATION_GUIDE.md     # Express 마이그레이션
│   ├── CHATBOT_QUICK_REFERENCE.md     # 빠른 참조
│   └── CHATBOT_README.md              # 챗봇 요약
│
└── ⚙️ 설정 파일
    ├── .env                           # 프론트엔드 환경변수
    ├── .env.local                     # 로컬 환경변수
    ├── .env.production                # 배포 환경변수
    ├── next.config.ts                 # Next.js 설정
    ├── tsconfig.json                  # TypeScript 설정
    ├── package.json                   # 의존성 관리
    └── .gitignore                     # Git 무시 파일
```

---

## 🔄 시스템 흐름

```
사용자 브라우저
    ↓
┌─────────────────────────────────┐
│ Next.js 프론트엔드               │
│ - AIChatbot.tsx (UI)            │
│ - chatbot-api.ts (API 호출)     │
└──────────────┬──────────────────┘
               │ HTTP POST
         ┌─────▼─────┐
         │ Lambda     │ (AWS)
         │ Python     │
         └──────┬────┘
         ┌──────┴────────┬────────┐
         │               │        │
    ┌────▼────┐    ┌─────▼──┐  ┌─▼──────┐
    │BigKinds │    │Bedrock │  │BigKinds│
    │(뉴스)   │    │(Claude)│  │(뉴스)  │
    └─────────┘    └────────┘  └────────┘
         │
    데이터 통합
         │
    ┌────▼────────────────────┐
    │ 챗봇 응답 반환           │
    │ - 분석 결과              │
    │ - 지식 출처 수           │
    │ - 타임스탐프             │
    └─────────────────────────┘
```

---

## 🌍 배포 환경

### 프론트엔드 배포 옵션

| 플랫폼 | 방법 | 예상 시간 |
|--------|------|---------|
| Vercel | 클릭 | <1분 |
| Netlify | 클릭 | <1분 |
| AWS Amplify | CLI | 5분 |
| Docker | 컨테이너 | 10분 |

### 백엔드 배포 옵션

| 플랫폼 | 방법 | 예상 시간 |
|--------|------|---------|
| Lambda (현재) | Serverless | 2분 |
| AWS ECS | 컨테이너 | 15분 |
| Express (자체 호스팅) | Docker | 20분 |
| GCP Cloud Run | 컨테이너 | 15분 |

---

## 🚀 배포 체크리스트

### 프론트엔드 배포

```bash
# 1. 빌드
npm run build

# 2. 테스트
npm run start

# 3. Vercel 배포
vercel deploy --prod

# 또는 GitHub 연동
# → Vercel Dashboard → Connect Git Repository
```

### 백엔드 배포

```bash
cd backend

# 1. 배포 (처음)
serverless deploy --stage prod

# 2. 함수 업데이트 (코드 변경 시)
serverless deploy function -f enhanced-chatbot --stage prod

# 3. 환경변수 업데이트
serverless invoke -f enhanced-chatbot --stage prod
```

---

## 📊 현재 상태

| 항목 | 상태 | 체크 |
|------|------|------|
| **프론트엔드** | | |
| Next.js 설정 | ✅ 완료 | - |
| React 컴포넌트 | ✅ 완료 | - |
| TypeScript | ✅ 완료 | - |
| Tailwind CSS | ✅ 완료 | - |
| 개발 서버 | ✅ 실행 중 | `npm run dev` |
| **백엔드** | | |
| Lambda 함수 | ✅ 배포됨 | enhanced-chatbot-handler |
| Python 코드 | ✅ 준비됨 | backend/lambda/ |
| Bedrock 연동 | ✅ 설정됨 | Claude 3 Sonnet |
| BigKinds API | ⚠️ 설정 필요 | API 키 입력 필요 |
| **환경변수** | | |
| 프론트 (.env.local) | ✅ 설정됨 | - |
| 백엔드 (.env) | ❌ 미설정 | backend/.env 생성 필요 |
| AWS 자격증명 | ✅ 설정됨 | ~/.aws/credentials |

---

## 🔐 필수 설정

### 1. 환경 변수 (프론트엔드)

`.env.local` 파일이 있는지 확인:

```bash
# 필수
NEXT_PUBLIC_CHATBOT_API_URL=https://vylrpmvwg7.execute-api.ap-northeast-2.amazonaws.com/dev/chat
BIGKINDS_API_KEY=your-api-key

# 선택
NEXT_PUBLIC_QUIZ_SAVE_URL=https://zetqmdpbc1.execute-api.us-east-1.amazonaws.com/prod/quizzes
ADMIN_PASSWORD=sedaily2024!
```

### 2. 환경 변수 (백엔드)

`backend/.env` 파일 생성:

```bash
# 필수
BIGKINDS_API_KEY=your-api-key
AWS_REGION=ap-northeast-2

# 선택
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
LOG_LEVEL=info
```

### 3. AWS 자격증명

```bash
# AWS CLI 설정
aws configure

# 또는 환경변수로 설정
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=ap-northeast-2
```

---

## 🐛 문제 해결

### 챗봇이 응답하지 않는 경우

```bash
# 1. Lambda 함수 상태 확인
aws lambda list-functions --region ap-northeast-2

# 2. 로그 확인
aws logs tail /aws/lambda/sedaily-chatbot-dev-handler --follow

# 3. 환경변수 확인
aws lambda get-function-configuration \
  --function-name sedaily-chatbot-dev-handler

# 4. Bedrock 권한 확인
aws iam list-attached-role-policies \
  --role-name sedially-chatbot-dev-handler
```

### 느린 응답 속도

```bash
# 메트릭 확인
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=sedaily-chatbot-dev-handler \
  --statistics Average,Maximum \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300
```

---

## 📚 다음 단계

### 지금 할 일

- [ ] BigKinds API 키 획득
- [ ] `backend/.env` 파일 생성
- [ ] Lambda 함수 배포
- [ ] 챗봇 테스트

### 1주일 내

- [ ] 모니터링 설정 (CloudWatch)
- [ ] 성능 최적화
- [ ] 비용 분석

### 2주일 내

- [ ] Express.js로 마이그레이션 (선택)
- [ ] Docker 컨테이너화
- [ ] CI/CD 파이프라인 구축

---

## 📞 지원

### 문서

- **BACKEND_SETUP_GUIDE.md** - 백엔드 상세 설정
- **AWS_QUICK_START.md** - AWS 빠른 시작
- **CHATBOT_SYSTEM_ARCHITECTURE.md** - 전체 구조
- **CHATBOT_MIGRATION_GUIDE.md** - Express 마이그레이션

### 유용한 링크

- [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
- [Bedrock Console](https://console.aws.amazon.com/bedrock/)
- [BigKinds API](https://www.bigkinds.or.kr/)
- [Claude Documentation](https://docs.anthropic.com/)

---

## 📈 성공 지표

마이그레이션 완료 시 확인할 사항:

- ✅ 모든 게임에서 챗봇 정상 작동
- ✅ 응답 시간 < 5초
- ✅ 에러율 < 1%
- ✅ CloudWatch 로그 정상 기록
- ✅ 월간 비용 < $600

---

**마지막 업데이트**: 2025년 11월 14일
**상태**: 🟢 프로덕션 준비 완료
**버전**: 1.0.0
