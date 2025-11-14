/**
 * AI 챗봇 API 클라이언트
 */

export type ChatbotRequest = {
  question: string
  gameType: "BlackSwan" | "PrisonersDilemma" | "SignalDecoding"
  questionText: string
  quizArticleUrl?: string  // RAG: 퀴즈 관련 기사 URL
}

export type ChatbotResponse = {
  response: string
  timestamp: string
  success: boolean
  knowledge_sources?: number  // RAG: 사용된 지식 소스 개수
  error?: string
}

const API_ENDPOINT = process.env.NEXT_PUBLIC_CHATBOT_API_URL || 'https://vylrpmvwg7.execute-api.ap-northeast-2.amazonaws.com/dev/chat'

export async function sendChatbotMessage(request: ChatbotRequest): Promise<ChatbotResponse> {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data

  } catch (error) {
    console.error('Chatbot API error:', error)
    
    // 클라이언트 폴백 응답 (서버 연결 실패 시)
    const gameContext = {
      'BlackSwan': '블랙스완 이벤트 관점에서',
      'PrisonersDilemma': '게임이론적 관점에서', 
      'SignalDecoding': '경제 신호 분석 관점에서'
    }[request.gameType] || '경제적 관점에서'
    
    return {
      response: `"${request.question}"에 대한 질문을 받았습니다. ${gameContext} 분석을 제공하려 했으나 현재 서버 연결에 문제가 있습니다. 서버에서는 BigKinds API 실패 시 순수 Claude 응답을 제공하도록 개선되었습니다. 잠시 후 다시 시도해 주세요.`,
      timestamp: new Date().toISOString(),
      success: false,
      knowledge_sources: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}