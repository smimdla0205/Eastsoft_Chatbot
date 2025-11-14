#!/bin/bash

# Chatbot Lambda 배포 스크립트
echo "🚀 Chatbot Lambda 배포 시작..."

# ZIP 파일 생성
echo "📦 ZIP 파일 생성 중..."
zip -r chatbot-lambda.zip index.js package.json

# Lambda 함수 생성/업데이트
FUNCTION_NAME="chatbot-lambda"
REGION="us-east-1"

# 함수 존재 여부 확인
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "🔄 기존 Lambda 함수 업데이트 중..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://chatbot-lambda.zip \
        --region $REGION
else
    echo "✨ 새 Lambda 함수 생성 중..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime nodejs18.x \
        --role arn:aws:iam::887078546492:role/lambda-execution-role \
        --handler index.handler \
        --zip-file fileb://chatbot-lambda.zip \
        --timeout 30 \
        --memory-size 256 \
        --region $REGION
fi

# 환경변수 설정
echo "🔧 환경변수 설정 중..."
aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment Variables="{BIGKINDS_API_KEY=$BIGKINDS_API_KEY}" \
    --region $REGION

# API Gateway 연동 (선택사항)
echo "🌐 API Gateway URL 확인..."
aws lambda get-function-url-config --function-name $FUNCTION_NAME --region $REGION 2>/dev/null || \
aws lambda create-function-url-config \
    --function-name $FUNCTION_NAME \
    --auth-type NONE \
    --cors AllowCredentials=false,AllowHeaders="*",AllowMethods="*",AllowOrigins="*" \
    --region $REGION

echo "✅ 배포 완료!"
echo "📝 .env.local에 다음 URL을 추가하세요:"
aws lambda get-function-url-config --function-name $FUNCTION_NAME --region $REGION --query 'FunctionUrl' --output text