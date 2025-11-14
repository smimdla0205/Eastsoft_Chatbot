import { AIChatbot } from "@/components/AIChatbot";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-foreground">뉴스 AI 어시스턴트</h1>
        <p className="text-lg text-muted-foreground mb-8">
          게임 기반 뉴스 이해력 퀴즈에서 AI 챗봇의 도움을 받으세요.
        </p>
        <div className="bg-card rounded-lg p-6 border border-border">
          <AIChatbot />
        </div>
      </div>
    </div>
  );
}
