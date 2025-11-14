# 뉴스 AI 어시스턴트 (News AI Assistant)

게임 기반 뉴스 이해력 퀴즈 플랫폼을 위한 AI 챗봇 시스템입니다.

## 🎮 프로젝트 개요

이 프로젝트는 다음 세 가지 게임에서 학습자들이 뉴스 관련 질문에 대해 AI 어시스턴트에게 도움을 받을 수 있는 플랫폼입니다:

- **BlackSwan**: 블랙스완 이벤트 관점에서의 경제 뉴스 분석
- **PrisonersDilemma**: 게임이론적 관점에서의 뉴스 분석  
- **SignalDecoding**: 경제 신호 분석 관점에서의 뉴스 해석

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치

```bash
git clone https://github.com/smimdla0205/Eastsoft_Chatbot.git
cd project
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 📁 프로젝트 구조

```
project/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── page.tsx            # 메인 페이지
│   └── globals.css         # 글로벌 스타일
├── components/
│   ├── AIChatbot.tsx       # AI 챗봇 컴포넌트
│   └── ui/
│       └── button.tsx      # 버튼 UI 컴포넌트
├── lib/
│   ├── chatbot-api.ts      # 챗봇 API 클라이언트
│   └── utils.ts            # 유틸리티 함수
└── public/                 # 정적 파일
```

## 🎨 기술 스택

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React
- **API**: AWS Lambda (Chatbot Backend)

## 🤖 AI 챗봇 기능

### 게임별 테마 스타일
각 게임마다 고유한 뉴스프린트 스타일을 적용:

| 게임 | 메인 색상 | 종이 배경 | 잉크 색상 |
|------|---------|---------|---------|
| BlackSwan | #244961 | #EDEDE9 | #0F2233 |
| PrisonersDilemma | #8B5E3C | #EDEDE9 | #3B3128 |
| SignalDecoding | #DB6B5E | #EDEDE9 | #184E77 |

### 기능
- 📝 실시간 메시지 전송 및 수신
- 🔄 RAG (Retrieval-Augmented Generation) 기반 응답
- 📰 뉴스 기사 URL 기반 컨텍스트 제공
- ⌨️ Enter 키 단축키 지원
- 📱 반응형 디자인

## 🔧 환경 변수 설정

`.env.local` 파일을 생성하고 다음을 추가하세요:

```env
NEXT_PUBLIC_CHATBOT_API_URL=https://your-api-endpoint.com/chat
```

## 📚 사용 방법

1. 게임 페이지에서 "AI에게 질문하기" 버튼을 클릭
2. 챗봇 창이 열리면 질문 입력
3. Enter 키 또는 전송 버튼으로 메시지 전송
4. AI 어시스턴트의 답변을 받음

## 🛠️ 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 📦 의존성

주요 패키지:
- `next`: ^16.0.3
- `react`: ^19.2.0
- `react-dom`: ^19.2.0
- `tailwindcss`: ^4
- `lucide-react`: 아이콘 라이브러리
- `clsx`: 클래스 네임 유틸리티
- `tailwind-merge`: Tailwind 클래스 병합

## 📝 라이센스

이 프로젝트는 Eastsoft와 Vibe Coding이 함께 진행하는 프로젝트입니다.

## 👤 개발자

- 임상민 (Sanmin Im)

---

**Last Updated**: 2025년 11월 14일