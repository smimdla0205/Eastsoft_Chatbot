const AWS = require('aws-sdk');

const bedrock = new AWS.BedrockRuntime({ region: 'us-east-1' });

// AI 응답 생성 (AWS Bedrock Claude)
async function generateResponse(userMessage) {
  const prompt = `당신은 서울경제 뉴스게임 플랫폼의 경제 전문 AI 어시스턴트입니다. 

사용자의 경제 관련 질문에 대해 전문적이고 정확한 답변을 제공하세요. 다음과 같은 주제들을 다룰 수 있습니다:
- 경제 동향 및 분석
- 금융시장 현황
- 투자 관련 조언
- 경제 정책 해석
- 기업 경영 이슈
- 부동산 시장 동향

사용자 질문: ${userMessage}

답변은 한국어로, 친근하면서도 전문적으로 작성해주세요. 복잡한 경제 개념은 쉽게 설명해주세요.`;

  const requestBody = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  };

  try {
    const response = await bedrock.invokeModel({
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    }).promise();

    const responseBody = JSON.parse(response.body.toString());
    return responseBody.content[0].text;
  } catch (error) {
    throw new Error(`AI 응답 생성 중 오류가 발생했습니다: ${error.message}`);
  }
}

exports.handler = async (event) => {
  try {
    console.log('Event received:', JSON.stringify(event));
    
    const { message, conversationId } = JSON.parse(event.body);
    console.log('Parsed message:', message);
    
    if (!message?.trim()) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: '메시지를 입력해주세요.' })
      };
    }

    console.log('Generating AI response...');
    const aiResponse = await generateResponse(message);
    console.log('AI response generated successfully');

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({
        response: aiResponse,
        conversationId: conversationId || `chat_${Date.now()}`,
        sources: []
      })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: '서비스 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
      })
    };
  }
};