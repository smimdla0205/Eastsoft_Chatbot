"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Bot, User, Loader2, MessageCircle, X } from "lucide-react"
import { sendChatbotMessage, type ChatbotRequest } from "@/lib/chatbot-api"

type Message = {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

type AIChatbotProps = {
  gameType: "BlackSwan" | "PrisonersDilemma" | "SignalDecoding"
  questionIndex: number
  questionText: string
  isAnswered: boolean
  quizArticleUrl?: string  // RAG: 퀴즈 관련 기사 URL
}

const THEME_STYLES = {
  BlackSwan: {
    accentColor: "#244961",
    paperBg: "bg-[#EDEDE9]",
    inkColor: "text-[#0F2233]",
    hairline: "border-[#C9C2B0]",
    chatBg: "bg-[#F8F8F5]",
    userBubble: "bg-[#244961] text-white",
    aiBubble: "bg-white border border-[#C9C2B0]",
    inputBg: "bg-white border-[#C9C2B0]",
  },
  PrisonersDilemma: {
    accentColor: "#8B5E3C",
    paperBg: "bg-[#F5F1E6]",
    inkColor: "text-[#3B3128]",
    hairline: "border-[#C0B6A4]",
    chatBg: "bg-[#F0E7D8]",
    userBubble: "bg-[#8B5E3C] text-white",
    aiBubble: "bg-white border border-[#C0B6A4]",
    inputBg: "bg-white border-[#C0B6A4]",
  },
  SignalDecoding: {
    accentColor: "#DB6B5E",
    paperBg: "bg-[#EDEDE9]",
    inkColor: "text-[#184E77]",
    hairline: "border-[#C9C2B0]",
    chatBg: "bg-[#F8F8F5]",
    userBubble: "bg-[#DB6B5E] text-white",
    aiBubble: "bg-white border border-[#C9C2B0]",
    inputBg: "bg-white border-[#C9C2B0]",
  },
} as const

export function AIChatbot({ gameType, questionIndex, questionText, isAnswered, quizArticleUrl }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const theme = THEME_STYLES[gameType]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      // RAG 기반 API 호출
      const request: ChatbotRequest = {
        question: userMessage.content,
        gameType,
        questionText,
        quizArticleUrl  // RAG 컨텍스트로 전달
      }

      const response = await sendChatbotMessage(request)
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: "ai",
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, aiMessage])
      
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "죄송합니다. 현재 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }



  return (
    <div className="relative">
      {/* 챗봇 토글 버튼 */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all hover:scale-105 ${theme.paperBg} ${theme.inkColor} ${theme.hairline} hover:border-[${theme.accentColor}]`}
          style={{ 
            borderColor: theme.accentColor,
            backgroundColor: 'transparent'
          }}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm font-medium">AI에게 질문하기</span>
        </Button>
      )}

      {/* 챗봇 창 */}
      {isOpen && (
        <div 
          className={`border-2 rounded-xl shadow-lg overflow-hidden ${theme.paperBg}`}
          style={{ borderColor: theme.accentColor }}
        >
          {/* 헤더 */}
          <div 
            className="flex items-center justify-between p-4 border-b text-white"
            style={{ backgroundColor: theme.accentColor }}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-medium">뉴스 AI 어시스턴트</span>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-1 h-auto"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* 메시지 영역 */}
          <div 
            className={`h-80 overflow-y-auto p-4 space-y-4 ${theme.chatBg}`}
          >
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" style={{ color: theme.accentColor }} />
                <p className={`text-sm ${theme.inkColor} opacity-70`}>
                  문제에 대해 궁금한 점이 있으시면<br />
                  언제든 질문해주세요!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  {message.sender === "ai" && (
                    <div 
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.accentColor }}
                    >
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`px-3 py-2 rounded-lg text-sm leading-relaxed ${
                      message.sender === "user" 
                        ? theme.userBubble
                        : `${theme.aiBubble} ${theme.inkColor}`
                    }`}
                  >
                    {message.content}
                  </div>

                  {message.sender === "user" && (
                    <div 
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: theme.accentColor }}
                    >
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-2">
                  <div 
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className={`px-3 py-2 rounded-lg ${theme.aiBubble} ${theme.inkColor}`}>
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="p-4 border-t" style={{ borderColor: theme.accentColor }}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="질문을 입력하세요..."
                disabled={isLoading}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${theme.inputBg} ${theme.inkColor} focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                style={{ 
                  borderColor: theme.accentColor + '40',
                  "--tw-ring-color": theme.accentColor + '50',
                } as React.CSSProperties}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="px-3 py-2 rounded-lg text-white"
                style={{ backgroundColor: theme.accentColor }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}