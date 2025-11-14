# Chatbot Lambda 배포 가이드

## 사전 준비

### 1. AWS CLI 설정
```bash
aws configure
```

### 2. 환경변수 설정
```bash
export BIGKINDS_API_KEY="5bf1dc66-79f7-4788-9593-be209e4472e3"
```

### 3. IAM 역할 생성
Lambda 실행을 위한 IAM 역할이 필요합니다:
- 역할명: `lambda-execution-role`
- 정책: `AWSLambdaBasicExecutionRole`, `AmazonBedrockFullAccess`

## 배포 방법

### 자동 배포
```bash
chmod +x deploy.sh
./deploy.sh
```

### 수동 배포
```bash
# 1. ZIP 파일 생성
npm run zip

# 2. Lambda 함수 생성
aws lambda create-function \
    --function-name chatbot-lambda \
    --runtime nodejs18.x \
    --role arn:aws:iam::YOUR_ACCOUNT_ID:role/lambda-execution-role \
    --handler index.handler \
    --zip-file fileb://chatbot-lambda.zip \
    --timeout 30 \
    --memory-size 256

# 3. 환경변수 설정
aws lambda update-function-configuration \
    --function-name chatbot-lambda \
    --environment Variables="{BIGKINDS_API_KEY=$BIGKINDS_API_KEY}"

# 4. Function URL 생성
aws lambda create-function-url-config \
    --function-name chatbot-lambda \
    --auth-type NONE \
    --cors AllowCredentials=false,AllowHeaders="*",AllowMethods="*",AllowOrigins="*"
```

## 환경변수 설정

배포 후 Next.js `.env.local`에 추가:
```env
NEXT_PUBLIC_CHAT_LAMBDA_URL=https://your-lambda-url.lambda-url.us-east-1.on.aws/
BIGKINDS_API_KEY=5bf1dc66-79f7-4788-9593-be209e4472e3
```

## 테스트

```bash
curl -X POST https://your-lambda-url.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{"message": "최근 금리 동향은 어떤가요?", "conversationId": "test_123"}'
```