#!/bin/bash

echo "🚀 Deploying Enhanced AI Chatbot Lambda (Claude + BigKinds)..."

# Lambda 함수 정보
FUNCTION_NAME="g2-enhanced-chatbot-api"
REGION="us-east-1"
ROLE_ARN="arn:aws:iam::887078546492:role/lambda-execution-role"

# 작업 디렉토리로 이동
cd "$(dirname "$0")/lambda"

echo "📦 Installing dependencies..."
python3 -m pip install -r requirements.txt -t . 2>/dev/null || echo "Dependencies installation skipped (will use Lambda layers)"

echo "📦 Creating deployment package..."
zip -r ../enhanced-chatbot-lambda.zip . -x "*.pyc" "__pycache__/*"

cd ..

echo "🔧 Deploying to AWS Lambda..."

# 함수 존재 여부 확인
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "📝 Updating existing function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://enhanced-chatbot-lambda.zip \
        --region $REGION
    
    # 함수 설정 업데이트
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --handler enhanced-chatbot-handler.lambda_handler \
        --runtime python3.9 \
        --timeout 30 \
        --memory-size 512 \
        --environment Variables='{"BIGKINDS_API_KEY":"YOUR_API_KEY"}' \
        --region $REGION
else
    echo "🆕 Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime python3.9 \
        --role $ROLE_ARN \
        --handler enhanced-chatbot-handler.lambda_handler \
        --zip-file fileb://enhanced-chatbot-lambda.zip \
        --timeout 30 \
        --memory-size 512 \
        --environment Variables='{"BIGKINDS_API_KEY":"YOUR_API_KEY"}' \
        --region $REGION
fi

echo "🔑 Adding Bedrock permissions..."
# Bedrock 권한 정책 연결 (이미 있으면 무시)
aws iam attach-role-policy \
    --role-name lambda-execution-role \
    --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess \
    2>/dev/null || echo "Bedrock policy already attached"

echo "🌐 Setting up API Gateway..."
echo "Manual step: Create API Gateway and connect to Lambda function"

echo ""
echo "✅ Enhanced Lambda deployment complete!"
echo "📝 Next steps:"
echo "1. Set BIGKINDS_API_KEY environment variable in Lambda console"
echo "2. Create API Gateway endpoint"
echo "3. Update frontend API endpoint"
echo "4. Test Claude integration"

# 정리
rm -f enhanced-chatbot-lambda.zip
cd lambda && rm -rf boto3* botocore* requests* urllib3* certifi* charset_normalizer* idna*