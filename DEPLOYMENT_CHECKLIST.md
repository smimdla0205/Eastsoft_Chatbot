# 🚀 AWS Bedrock 풀스택 배포 - 최종 체크리스트

**상태**: ✅ 준비 완료  
**예상 배포 시간**: 1시간 ~ 2시간  
**난이도**: ⭐⭐⭐⭐ (중상)

---

## 📋 배포 전 필수 조건

### ✅ 로컬 개발 완료

- [x] Next.js 프론트엔드 (localhost:3000)
- [x] Lambda 핸들러 (Python)
- [x] 데이터 임베딩 스크립트
- [x] Supabase pgvector 설정 파일

### ✅ AWS 계정 준비

- [ ] AWS 계정 생성 (또는 기존 계정)
- [ ] AWS CLI 설치
- [ ] AWS 자격증명 설정 (`aws configure`)
- [ ] Bedrock 모델 활성화 (Claude 3 Sonnet + Titan Embeddings)

### ✅ 외부 서비스 준비

- [ ] Supabase 프로젝트 생성
- [ ] Supabase pgvector 테이블 생성
- [ ] Vercel 계정 생성 (프론트엔드 배포용)

---

## 📊 단계별 배포 가이드

### 📍 Step 1: AWS 설정 (20분)

```bash
# 1️⃣  AWS CLI 설치 확인
aws --version

# 2️⃣  자격증명 설정
aws configure
# 입력:
# - AWS Access Key ID: *** (AWS Console에서 발급)
# - AWS Secret Access Key: ***
# - Default region: ap-northeast-1
# - Default output format: json

# 3️⃣  Bedrock 모델 활성화
# AWS Console → Bedrock → Model access → Edit model access
# ✅ anthropic.claude-3-sonnet (Claude 3 Sonnet)
# ✅ amazon.titan-embed-text (Titan Embeddings)
```

**관련 문서**: [AWS_DEPLOYMENT.md](./docs/AWS_DEPLOYMENT.md)

---

### 📍 Step 2: Supabase 설정 (15분)

```bash
# 1️⃣  Supabase 프로젝트 생성
# https://supabase.com → New Project

# 2️⃣  pgvector 확장 활성화
# Dashboard → SQL Editor → 실행:
CREATE EXTENSION IF NOT EXISTS vector;

# 3️⃣  Q&A 테이블 생성
# SUPABASE_SETUP.md의 SQL 스크립트 복사 & 실행

# 4️⃣  API 키 얻기
# Settings → API → Project URL, anon (public)
```

**관련 문서**: [SUPABASE_SETUP.md](./docs/SUPABASE_SETUP.md)

---

### 📍 Step 3: IAM 역할 생성 (10분)

```bash
# AWS Console 또는 CLI로 실행:

# 신뢰 정책 파일 생성
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# IAM 역할 생성
aws iam create-role \
  --role-name LambdaChatbotRole \
  --assume-role-policy-document file://trust-policy.json

# Bedrock 권한 추가
aws iam put-role-policy \
  --role-name LambdaChatbotRole \
  --policy-name BedrockPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel"],
      "Resource": "*"
    }]
  }'

# Lambda 기본 권한 추가
aws iam attach-role-policy \
  --role-name LambdaChatbotRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

---

### 📍 Step 4: 데이터 임베딩 (10~30분)

```bash
# Q&A.xlsx를 Supabase에 임베딩해서 저장

# 1️⃣  환경 변수 설정
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your_anon_key

# 2️⃣  임베딩 스크립트 실행
# (Bedrock Titan Embeddings 사용)
python scripts/ingest.py data/Q&A.xlsx

# 3️⃣  Supabase에서 데이터 확인
# Dashboard → Table Editor → qa_embeddings
```

**참고**: 데이터 양에 따라 시간 소요 (1,000개 기준 ~10분)

---

### 📍 Step 5: Lambda 배포 (15분)

```bash
cd backend

# 1️⃣  환경 변수 설정 (.env 또는 serverless.yml)
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your_anon_key
export BEDROCK_REGION=ap-northeast-1

# 2️⃣  serverless.yml 설정
# backend/serverless.yml 생성 (아래 참고)

# 3️⃣  Lambda 배포
serverless deploy --stage prod

# 출력 예:
# ✓ Stack update finished
# endpoint: https://XXXXX.execute-api.ap-northeast-1.amazonaws.com/prod/ask
```

**serverless.yml 템플릿**:
```yaml
service: vectordb-qa-chatbot

provider:
  name: aws
  runtime: python3.11
  region: ap-northeast-1
  role: arn:aws:iam::YOUR_ACCOUNT_ID:role/LambdaChatbotRole
  environment:
    SUPABASE_URL: ${env:SUPABASE_URL}
    SUPABASE_ANON_KEY: ${env:SUPABASE_ANON_KEY}
    BEDROCK_REGION: ap-northeast-1
    BEDROCK_MODEL_ID: anthropic.claude-3-sonnet-20240229-v1:0

functions:
  chat:
    handler: lambda/index.handler
    events:
      - http:
          path: ask
          method: post
          cors: true
    timeout: 60
    memorySize: 256

plugins:
  - serverless-python-requirements

custom:
  pythonRequirements:
    dockerizePip: true
```

---

### 📍 Step 6: 프론트엔드 배포 (10분)

```bash
# 프로젝트 루트 디렉토리에서:

# 1️⃣  .env 업데이트 (Lambda 엔드포인트)
NEXT_PUBLIC_CHATBOT_API_URL=https://XXXXX.execute-api.ap-northeast-1.amazonaws.com/prod/ask

# 2️⃣  GitHub에 푸시
git add .
git commit -m "AWS Bedrock integration - production ready"
git push origin main

# 3️⃣  Vercel에 배포 (자동)
# Vercel Dashboard → Import Git Repository
# 또는 Vercel CLI:
npm i -g vercel
vercel --prod
```

---

## 🧪 배포 검증

### 테스트 1: Lambda 직접 호출

```bash
curl -X POST https://XXXXX.execute-api.ap-northeast-1.amazonaws.com/prod/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "회사는 언제 설립되었나요?"}'

# 예상 응답:
# {
#   "question": "회사는 언제 설립되었나요?",
#   "answer": "2020년 1월에 설립되었습니다.",
#   "source": { "question": "회사 설립일?" },
#   "similarity": 0.95,
#   "model": "claude-3-sonnet",
#   "success": true
# }
```

### 테스트 2: 웹 UI에서 테스트

```
https://your-vercel-app.vercel.app
```

1. 채팅창에서 질문 입력
2. 로딩 애니메이션 확인
3. Bedrock Claude 응답 확인

### 테스트 3: CloudWatch 로그 확인

```bash
serverless logs -f chat --stage prod -t
```

---

## 📊 비용 분석

| 서비스 | 무료 티어 | 예상 비용 (월) |
|--------|---------|-------------|
| Lambda | 100만 요청/월 | $0 |
| Bedrock Claude | 첫 3개월 | $3~5 |
| Bedrock Embeddings | - | $0.5~1 |
| S3 | 5GB | $0 ~ $1 |
| CloudFront | 1TB/월 | $0 ~ $1 |
| Supabase | 500MB | $0 ~ $10 |
| Vercel | 프리 | $0 |
| **총합** | - | **$4~17** |

**절약 팁**:
- Bedrock 무료 크레딧 활용
- Lambda 응답 시간 최적화 (cold start 개선)
- CloudFront 캐싱 설정
- Supabase 쿼리 최적화

---

## 🆘 트러블슈팅

### ❌ "Bedrock Model not available"

**원인**: 모델이 비활성화되었음  
**해결**:
```
AWS Console → Bedrock → Model access → Edit model access
✅ Claude 3 Sonnet 활성화
```

### ❌ "Supabase connection timeout"

**원인**: 환경 변수 누락 또는 네트워크 문제  
**해결**:
```bash
# 환경 변수 확인
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Supabase 프로젝트 상태 확인
# https://supabase.com/dashboard → Status
```

### ❌ "Lambda timeout after 60 seconds"

**원인**: 벡터 검색이 오래 걸림  
**해결**:
```yaml
# serverless.yml
timeout: 120  # 60초 → 120초
```

### ❌ "IAM permission denied"

**원인**: 역할 권한 부족  
**해결**:
```bash
# 권한 확인
aws iam get-role-policy \
  --role-name LambdaChatbotRole \
  --policy-name BedrockPolicy
```

---

## 📈 성능 최적화

### Lambda 콜드 스타트 개선

```yaml
# serverless.yml
functions:
  chat:
    memorySize: 512  # 256 → 512 (더 빠름)
    ephemeralStorage: 10240  # 최대값
```

### 벡터 검색 최적화

```sql
-- Supabase SQL
-- IVFFLAT → HNSW 인덱스 (더 빠름)
CREATE INDEX ON qa_embeddings USING HNSW (embedding VECTOR_COSINE_OPS);
```

### CloudFront 캐싱

```
Cache-Control: max-age=3600  # 1시간 캐시
```

---

## 📚 다음 단계

### ✨ 추가 기능

1. **Multi-turn 대화**: 대화 히스토리 저장
2. **사용자 피드백**: 답변 평가 기능
3. **Analytics**: 자주 묻는 질문 분석
4. **Admin Panel**: Q&A 관리 대시보드

### 🚀 고급 최적화

1. **Caching Layer**: Redis 추가
2. **Load Balancing**: API Gateway 스로틀링
3. **Monitoring**: CloudWatch 대시보드
4. **CI/CD**: GitHub Actions 자동 배포

---

## 📞 도움말

| 문제 | 링크 |
|------|------|
| AWS Bedrock | https://docs.aws.amazon.com/bedrock/ |
| Lambda 배포 | https://docs.aws.amazon.com/lambda/ |
| Supabase pgvector | https://supabase.com/docs/guides/database/extensions/pgvector |
| Serverless Framework | https://www.serverless.com/ |

---

## ✅ 최종 체크리스트

- [ ] AWS CLI 설정 완료
- [ ] Bedrock 모델 활성화
- [ ] Supabase 프로젝트 생성
- [ ] pgvector 테이블 생성
- [ ] IAM 역할 생성
- [ ] Q&A 데이터 임베딩 완료
- [ ] Lambda 배포 성공
- [ ] Lambda 테스트 통과
- [ ] 프론트엔드 배포 완료
- [ ] 웹 UI 테스트 통과
- [ ] 로그 모니터링 설정

---

**배포 완료 후**: 
```
✅ 프로덕션 준비 완료!
🚀 서비스 시작: https://your-app.vercel.app
📊 모니터링: https://console.aws.amazon.com/lambda/
📈 분석: https://supabase.com/dashboard
```

---

**작성**: 2025년 11월 14일  
**버전**: 1.0.0 - AWS Bedrock Integration  
**상태**: ✅ 배포 가능
