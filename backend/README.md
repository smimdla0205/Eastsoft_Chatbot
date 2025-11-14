# G2 Clone - AI Chatbot Backend

빅카인즈 API를 활용한 AI 챗봇 백엔드 시스템

## 🏗 아키텍처

```
Frontend (React) → API Gateway → Lambda (Python) → Bigkinds API
```

## 🚀 배포 방법

### 1. 의존성 설치
```bash
cd backend
npm install
```

### 2. 환경 변수 설정
```bash
export BIGKINDS_API_KEY="your_api_key_here"
```

### 3. Lambda 배포
```bash
# 방법 1: Serverless Framework
npm run deploy

# 방법 2: 직접 배포
npm run deploy:lambda
```

### 4. API Gateway URL 업데이트
배포 완료 후 생성된 API Gateway URL을 `.env` 파일에 추가:
```env
NEXT_PUBLIC_CHATBOT_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/chat
```

## 🔧 기능

### Lambda 함수 (`chatbot-handler.py`)
- **빅카인즈 API 연동**: 뉴스 검색 및 분석
- **키워드 추출**: 사용자 질문에서 경제 키워드 자동 추출
- **게임별 컨텍스트**: BlackSwan, PrisonersDilemma, SignalDecoding 맞춤 응답
- **CORS 지원**: 프론트엔드 도메인에서 안전한 호출

### API 엔드포인트
- **POST** `/chat`: 챗봇 질문 처리
- **OPTIONS** `/chat`: CORS preflight 처리

### 요청 형식
```json
{
  "question": "사용자 질문",
  "gameType": "BlackSwan",
  "questionText": "퀴즈 문제 내용",
  "questionIndex": 0
}
```

### 응답 형식
```json
{
  "response": "AI 응답 내용",
  "timestamp": "2025-11-05T05:30:00.000Z",
  "success": true
}
```

## 🔑 필요한 설정

### AWS IAM 역할
Lambda 실행을 위한 IAM 역할 필요:
- `AWSLambdaBasicExecutionRole`
- CloudWatch Logs 권한

### 빅카인즈 API 키
- [빅카인즈](https://www.bigkinds.or.kr/) 회원가입 후 API 키 발급
- 환경 변수로 설정

## 📊 모니터링

```bash
# 로그 확인
npm run logs

# 함수 상태 확인
aws lambda get-function --function-name g2-chatbot-api
```