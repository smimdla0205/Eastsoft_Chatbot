#!/bin/bash

# G2 Chatbot Lambda 직접 배포 스크립트

set -e

echo "🚀 G2 Chatbot Lambda 배포 시작..."

# 환경 변수 확인
if [ -z "$BIGKINDS_API_KEY" ]; then
    echo "❌ BIGKINDS_API_KEY 환경 변수가 설정되지 않았습니다."
    echo "export BIGKINDS_API_KEY='your-api-key' 를 실행해주세요."
    exit 1
fi

# 함수 이름 및 설정
FUNCTION_NAME="g2-chatbot-handler"
REGION="us-east-1"
RUNTIME="python3.9"
HANDLER="chatbot-handler.lambda_handler"
TIMEOUT=30
MEMORY_SIZE=256

# 임시 디렉토리 생성
TEMP_DIR=$(mktemp -d)
echo "📦 임시 디렉토리: $TEMP_DIR"

# Lambda 코드 복사
cp lambda/chatbot-handler.py $TEMP_DIR/
cp lambda/requirements.txt $TEMP_DIR/

# 의존성 설치
echo "📦 Python 의존성 설치 중..."
cd $TEMP_DIR
python3 -m pip install -r requirements.txt -t .

# ZIP 파일 생성
echo "📦 배포 패키지 생성 중..."
zip -r chatbot-lambda.zip .

# Lambda 함수 존재 여부 확인
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "🔄 기존 Lambda 함수 업데이트 중..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://chatbot-lambda.zip \
        --region $REGION
    
    # 환경 변수 업데이트
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --environment Variables="{BIGKINDS_API_KEY=$BIGKINDS_API_KEY}" \
        --region $REGION
else
    echo "🆕 새 Lambda 함수 생성 중..."
    
    # IAM 역할 ARN (기본 Lambda 실행 역할)
    ROLE_ARN="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/lambda-execution-role"
    
    # 역할이 없으면 생성
    if ! aws iam get-role --role-name lambda-execution-role >/dev/null 2>&1; then
        echo "🔐 Lambda 실행 역할 생성 중..."
        
        # 신뢰 정책 생성
        cat > trust-policy.json << EOF
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
        
        # 역할 생성
        aws iam create-role \
            --role-name lambda-execution-role \
            --assume-role-policy-document file://trust-policy.json
        
        # 기본 실행 정책 연결
        aws iam attach-role-policy \
            --role-name lambda-execution-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
        
        echo "⏳ 역할 생성 완료, 10초 대기..."
        sleep 10
    fi
    
    # Lambda 함수 생성
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime $RUNTIME \
        --role $ROLE_ARN \
        --handler $HANDLER \
        --zip-file fileb://chatbot-lambda.zip \
        --timeout $TIMEOUT \
        --memory-size $MEMORY_SIZE \
        --environment Variables="{BIGKINDS_API_KEY=$BIGKINDS_API_KEY}" \
        --region $REGION
fi

# API Gateway 설정
echo "🌐 API Gateway 설정 중..."

# REST API 생성 또는 확인
API_NAME="g2-chatbot-api"
API_ID=$(aws apigateway get-rest-apis --query "items[?name=='$API_NAME'].id" --output text --region $REGION)

if [ "$API_ID" = "None" ] || [ -z "$API_ID" ]; then
    echo "🆕 새 API Gateway 생성 중..."
    API_ID=$(aws apigateway create-rest-api \
        --name $API_NAME \
        --description "G2 Chatbot API" \
        --region $REGION \
        --query 'id' --output text)
fi

echo "📡 API ID: $API_ID"

# 루트 리소스 ID 가져오기
ROOT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?path==`/`].id' --output text)

# /chat 리소스 생성 또는 확인
CHAT_RESOURCE_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --region $REGION \
    --query 'items[?pathPart==`chat`].id' --output text)

if [ "$CHAT_RESOURCE_ID" = "None" ] || [ -z "$CHAT_RESOURCE_ID" ]; then
    echo "🛤️ /chat 리소스 생성 중..."
    CHAT_RESOURCE_ID=$(aws apigateway create-resource \
        --rest-api-id $API_ID \
        --parent-id $ROOT_RESOURCE_ID \
        --path-part chat \
        --region $REGION \
        --query 'id' --output text)
fi

# OPTIONS 메서드 생성 (CORS)
if ! aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method OPTIONS \
    --region $REGION >/dev/null 2>&1; then
    
    echo "🔧 OPTIONS 메서드 생성 중..."
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $CHAT_RESOURCE_ID \
        --http-method OPTIONS \
        --authorization-type NONE \
        --region $REGION
    
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $CHAT_RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters method.response.header.Access-Control-Allow-Headers=false,method.response.header.Access-Control-Allow-Methods=false,method.response.header.Access-Control-Allow-Origin=false \
        --region $REGION
    
    aws apigateway put-integration \
        --rest-api-id $API_ID \
        --resource-id $CHAT_RESOURCE_ID \
        --http-method OPTIONS \
        --type MOCK \
        --integration-http-method OPTIONS \
        --request-templates '{"application/json":"{\"statusCode\": 200}"}' \
        --region $REGION
    
    aws apigateway put-integration-response \
        --rest-api-id $API_ID \
        --resource-id $CHAT_RESOURCE_ID \
        --http-method OPTIONS \
        --status-code 200 \
        --response-parameters '{"method.response.header.Access-Control-Allow-Headers":"'"'"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"'"'","method.response.header.Access-Control-Allow-Methods":"'"'"'POST,OPTIONS'"'"'","method.response.header.Access-Control-Allow-Origin":"'"'"'*'"'"'"}' \
        --region $REGION
fi

# POST 메서드 생성
if ! aws apigateway get-method \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method POST \
    --region $REGION >/dev/null 2>&1; then
    
    echo "🔧 POST 메서드 생성 중..."
    aws apigateway put-method \
        --rest-api-id $API_ID \
        --resource-id $CHAT_RESOURCE_ID \
        --http-method POST \
        --authorization-type NONE \
        --region $REGION
    
    aws apigateway put-method-response \
        --rest-api-id $API_ID \
        --resource-id $CHAT_RESOURCE_ID \
        --http-method POST \
        --status-code 200 \
        --response-parameters method.response.header.Access-Control-Allow-Origin=false \
        --region $REGION
fi

# Lambda 통합 설정
LAMBDA_ARN="arn:aws:lambda:$REGION:$(aws sts get-caller-identity --query Account --output text):function:$FUNCTION_NAME"

aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $CHAT_RESOURCE_ID \
    --http-method POST \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations" \
    --region $REGION

# Lambda 권한 부여
aws lambda add-permission \
    --function-name $FUNCTION_NAME \
    --statement-id apigateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:$REGION:$(aws sts get-caller-identity --query Account --output text):$API_ID/*/*" \
    --region $REGION 2>/dev/null || echo "권한이 이미 존재합니다."

# API 배포
echo "🚀 API 배포 중..."
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod \
    --region $REGION

# API URL 출력
API_URL="https://$API_ID.execute-api.$REGION.amazonaws.com/prod/chat"
echo ""
echo "✅ 배포 완료!"
echo "📡 API Gateway URL: $API_URL"
echo ""
echo "🔧 다음 단계:"
echo "1. .env 파일에 다음 라인을 추가하세요:"
echo "   NEXT_PUBLIC_CHATBOT_API_URL=$API_URL"
echo ""
echo "2. 프론트엔드를 다시 빌드하고 배포하세요:"
echo "   npm run build:export"
echo ""

# 임시 파일 정리
cd - >/dev/null
rm -rf $TEMP_DIR

echo "🧹 임시 파일 정리 완료"