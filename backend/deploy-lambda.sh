#!/bin/bash

FUNCTION_NAME="g2-chatbot-api"
REGION="us-east-1"

echo "🚀 Deploying AI Chatbot Lambda..."

# 1. 패키지 디렉토리 생성
rm -rf lambda-package
mkdir lambda-package

# 2. 의존성 설치
echo "📦 Installing dependencies..."
pip install -r lambda/requirements.txt -t lambda-package/

# 3. 소스 코드 복사
cp lambda/chatbot-handler.py lambda-package/

# 4. ZIP 패키지 생성
echo "📦 Creating deployment package..."
cd lambda-package
zip -r ../chatbot-function.zip .
cd ..

# 5. Lambda 함수 생성/업데이트
echo "🔧 Deploying to AWS Lambda..."

# 함수 존재 확인
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION >/dev/null 2>&1; then
    echo "📝 Updating existing function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://chatbot-function.zip \
        --region $REGION
else
    echo "🆕 Creating new function..."
    aws lambda create-function \
        --function-name $FUNCTION_NAME \
        --runtime python3.9 \
        --role arn:aws:iam::887078546492:role/lambda-execution-role \
        --handler chatbot-handler.lambda_handler \
        --zip-file fileb://chatbot-function.zip \
        --timeout 30 \
        --memory-size 256 \
        --region $REGION \
        --environment Variables='{BIGKINDS_API_KEY=YOUR_API_KEY}'
fi

# 6. API Gateway 설정 (선택사항)
echo "🌐 Setting up API Gateway..."
echo "Manual step: Create API Gateway and connect to Lambda function"

# 7. 정리
rm -rf lambda-package chatbot-function.zip

echo "✅ Lambda deployment complete!"
echo "📝 Next steps:"
echo "1. Set BIGKINDS_API_KEY environment variable"
echo "2. Create API Gateway endpoint"
echo "3. Update frontend API endpoint"