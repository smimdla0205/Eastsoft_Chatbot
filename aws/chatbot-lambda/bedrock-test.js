const AWS = require('aws-sdk');

const bedrock = new AWS.BedrockRuntime({ region: 'us-east-1' });

// AI 응답 생성 (AWS Bedrock Claude)
async function generateResponse(userMessage) {
  const prompt = `당신은 경제 뉴스 전문 AI 어시스턴트입니다. 사용자의 질문에 대해 간단하고 유용한 답변을 제공하세요.

사용자 질문: ${userMessage}

답변은 한국어로, 친근하고 이해하기 쉽게 작성해주세요.`;

  const requestBody = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 300,
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
    throw new Error(`Bedrock API error: ${error.message}`);
  }
}

exports.handler = async (event) => {
  try {
    console.log('Event received:', JSON.stringify(event));
    
    const { message, conversationId } = JSON.parse(event.body);
    console.log('Parsed message:', message);
    
    console.log('Generating AI response...');
    const aiResponse = await generateResponse(message);
    console.log('AI response generated');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: aiResponse,
        conversationId: conversationId,
        sources: []
      })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};