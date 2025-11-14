# 🚀 배포 체크리스트 - S3 + CloudFront + Lambda + Bedrock

## 📋 전체 구조
```
사용자
  ↓
CloudFront CDN (캐싱)
  ├─ S3 (프론트엔드 정적 파일)
  └─ API Gateway → Lambda (백엔드)
       ↓
     Bedrock (Claude 3 Sonnet)
       ↓
     Supabase pgvector (Q&A 검색)
```

---

## ✅ 배포 전 준비물

### 1️⃣ **AWS 계정 및 CLI 설정** (5분)

```bash
# AWS CLI 설치 확인
aws --version

# AWS 자격증명 설정
aws configure
# 입력:
# - AWS Access Key ID: [your-access-key]
# - AWS Secret Access Key: [your-secret-key]
# - Default region: ap-northeast-1
# - Default output format: json

# 확인
aws sts get-caller-identity
```

### 2️⃣ **Bedrock 모델 활성화** (5분)

AWS Console:
1. **Bedrock** 검색
2. **Model access** 클릭
3. **Edit model access** 클릭
4. 다음 모델 체크:
   - ✅ Claude 3 Sonnet (`anthropic.claude-3-sonnet-20240229-v1:0`)
   - ✅ Titan Embeddings (`amazon.titan-embed-text-v1`)
5. **Save changes**

### 3️⃣ **IAM 역할 생성** (10분)

```bash
# 1. 신뢰 정책 파일 생성
cat > /tmp/trust-policy.json << 'EOF'
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

# 2. IAM 역할 생성
aws iam create-role \
  --role-name LambdaChatbotRole \
  --assume-role-policy-document file:///tmp/trust-policy.json \
  --region ap-northeast-1

# 3. Bedrock 권한 추가
aws iam put-role-policy \
  --role-name LambdaChatbotRole \
  --policy-name BedrockPolicy \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "bedrock:InvokeModel"
        ],
        "Resource": "*"
      }
    ]
  }' \
  --region ap-northeast-1

# 4. Lambda 기본 실행 역할 추가
aws iam attach-role-policy \
  --role-name LambdaChatbotRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole \
  --region ap-northeast-1

# 확인
aws iam get-role --role-name LambdaChatbotRole --region ap-northeast-1
```

### 4️⃣ **Supabase 설정** (15분)

[Supabase Dashboard](https://app.supabase.com/)에서:

1. **새 프로젝트 생성**
   - Organization: 선택 또는 생성
   - Project name: `qa-chatbot`
   - Database password: [생성]
   - Region: `Singapore (ap-southeast-1)` 추천
   - Pricing: `Free` 또는 `Pro`

2. **pgvector 활성화**
   - SQL Editor → `New query`
   ```sql
   create extension if not exists vector;
   ```

3. **Q&A 테이블 생성**
   ```sql
   create table qa_documents (
     id bigserial primary key,
     question text not null,
     answer text not null,
     embedding vector(1536),
     created_at timestamp default now(),
     updated_at timestamp default now()
   );

   create index on qa_documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);
   ```

4. **RPC 함수 생성** (유사 검색)
   ```sql
   create or replace function search_qa(
     query_embedding vector(1536),
     match_threshold float default 0.7,
     match_count int default 5
   )
   returns table (
     id bigint,
     question text,
     answer text,
     similarity float
   )
   language sql
   as $$
     select
       qa_documents.id,
       qa_documents.question,
       qa_documents.answer,
       1 - (qa_documents.embedding <=> query_embedding) as similarity
     from qa_documents
     where 1 - (qa_documents.embedding <=> query_embedding) > match_threshold
     order by similarity desc
     limit match_count;
   $$;
   ```

5. **API Key 생성**
   - Settings → API
   - `SUPABASE_URL`: Copy Project URL
   - `SUPABASE_ANON_KEY`: Copy anon key

---

## 🔧 배포 단계

### **Step 1: 환경 변수 설정** (5분)

```bash
cd backend

# 1. .env.prod 파일 수정
cat > .env.prod << 'EOF'
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
BEDROCK_REGION=ap-northeast-1
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
EOF

# 2. 프론트엔드 환경 변수 (배포 후 업데이트)
cat > ../.env.production << 'EOF'
NEXT_PUBLIC_CHATBOT_API_URL=https://[cloudfront-domain]/ask
EOF
```

### **Step 2: 데이터 임베딩** (10-30분)

```bash
# 1. 데이터 파일 준비
# data/Q&A.xlsx 파일이 있는지 확인

# 2. 필수 패키지 설치
pip install boto3 httpx python-dotenv openpyxl

# 3. 환경 변수 로드
export $(cat .env.prod | xargs)

# 4. 데이터 임베딩 실행
cd ../scripts
python ingest.py ../data/Q&A.xlsx

# 결과:
# - Supabase에 Q&A 데이터 및 벡터 저장
# - 임베딩 완료: 123 documents ✅
```

### **Step 3: Lambda 배포** (15분)

```bash
cd backend

# 1. 패키지 설치
npm install

# 2. 서버리스 배포
serverless deploy --stage prod --region ap-northeast-1

# 출력 예:
# functions:
#   ask: qa-chatbot-bedrock-prod-ask
# endpoints:
#   POST - https://[api-id].execute-api.ap-northeast-1.amazonaws.com/prod/ask
# cloudformation stack id:
#   arn:aws:cloudformation:ap-northeast-1:[account]:stack/...

# ⚠️ 중요: API Gateway URL 복사 (다음 단계에서 필요)
```

### **Step 4: S3 + CloudFront 배포** (20분)

```bash
# 1. 프론트엔드 빌드
npm run build

# 2. 배포 스크립트 실행
bash scripts/deploy-frontend.sh prod [CLOUDFRONT_DISTRIBUTION_ID]

# 배포 후:
# - S3에 Next.js 정적 파일 업로드
# - CloudFront 캐시 무효화
# - URL: https://[cloudfront-domain].cloudfront.net
```

### **Step 5: API 통합 테스트** (5분)

```bash
# 1. Lambda 엔드포인트 테스트
curl -X POST https://[api-id].execute-api.ap-northeast-1.amazonaws.com/prod/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "안녕하세요"
  }'

# 2. 프론트엔드에서 환경 변수 업데이트
# .env.production에 CloudFront URL 추가:
NEXT_PUBLIC_CHATBOT_API_URL=https://[cloudfront-domain].cloudfront.net/ask

# 3. 프론트엔드 재배포
npm run build
bash scripts/deploy-frontend.sh prod [CLOUDFRONT_DISTRIBUTION_ID]
```

---

## 🧪 테스트

### **로컬 테스트** (개발)
```bash
# 프론트엔드 실행
npm run dev
# → http://localhost:3000

# 채팅 테스트
# "안녕하세요" 입력 → Q&A 데이터셋에서 유사한 답변 반환
```

### **프로덕션 테스트** (배포 후)
```bash
# 1. CloudFront URL 접속
https://[cloudfront-domain].cloudfront.net

# 2. 채팅 테스트
# - 질문 입력
# - CloudFront → Lambda → Bedrock Embeddings → Supabase Search → 답변 반환
# - 응답 시간: 1-3초

# 3. 네트워크 탭 확인
# - GET /ask (CloudFront 캐시 확인)
# - POST /ask (Lambda 응답)
```

### **문제 해결**

#### ❌ Lambda 배포 실패
```bash
# 권한 확인
aws iam get-role --role-name LambdaChatbotRole

# 서버리스 상태 확인
serverless info --stage prod --region ap-northeast-1

# CloudFormation 스택 확인
aws cloudformation describe-stacks --stack-name qa-chatbot-bedrock-prod
```

#### ❌ API 호출 실패
```bash
# CloudWatch 로그 확인
aws logs tail /aws/lambda/qa-chatbot-bedrock-prod-ask --follow

# 환경 변수 확인
aws lambda get-function-configuration \
  --function-name qa-chatbot-bedrock-prod-ask \
  --region ap-northeast-1
```

#### ❌ Bedrock 모델 오류
```
"ResourceNotFoundException: Could not validate that role arn:... can invoke model"
```
**해결책**: IAM 역할의 Bedrock 권한 재확인 또는 모델 활성화 재확인

#### ❌ Supabase 연결 실패
```bash
# Supabase 상태 확인
curl -H "apikey: $SUPABASE_ANON_KEY" \
  https://[project-id].supabase.co/rest/v1/qa_documents?select=count

# 네트워크 정책 확인
# Supabase → Settings → Security → CORS
```

---

## 📊 비용 추정 (월간)

| 서비스 | 사용량 | 비용 |
|--------|--------|------|
| **Lambda** | 10,000 요청/월 (128MB) | $0.20 |
| **Bedrock** | 10,000 토큰 (Embeddings) | $0.10 |
| **CloudFront** | 10GB 전송 | $0.85 |
| **S3** | 100MB 스토리지 | $0.01 |
| **Supabase** | Free tier (500MB) | $0 |
| **API Gateway** | 10,000 요청 | $3.50 |
| **합계** | | **~$4.66/월** |

⚠️ 높은 트래픽 시 $15-30/월

---

## ✨ 최종 확인

배포 후 다음을 확인하세요:

- [ ] 프론트엔드 접속 가능 (CloudFront URL)
- [ ] 채팅 기능 작동 (질문 입력 → 답변 출력)
- [ ] API 응답 시간 < 3초
- [ ] CloudWatch 로그 정상
- [ ] Q&A 데이터 Supabase에 저장됨
- [ ] 환각 없음 (Q&A 데이터셋에만 존재하는 답변만 반환)

---

## 🎉 완료!

```
프론트엔드 (S3 + CloudFront)
       ↓
   API Gateway
       ↓
   Lambda (Python)
       ↓
   Bedrock Claude 3 Sonnet + Titan Embeddings
       ↓
   Supabase pgvector
       ↓
   Q&A 정확한 답변 반환 ✅
```

이제 본격적인 사용을 시작할 수 있습니다! 🚀
