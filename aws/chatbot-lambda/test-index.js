exports.handler = async (event) => {
  try {
    console.log('Event received:', JSON.stringify(event));
    
    const { message, conversationId } = JSON.parse(event.body);
    console.log('Parsed message:', message);
    
    // 간단한 응답 테스트
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: `테스트 응답: ${message}에 대한 답변입니다.`,
        conversationId: conversationId,
        sources: []
      })
    };

  } catch (error) {
    console.error('Lambda error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};