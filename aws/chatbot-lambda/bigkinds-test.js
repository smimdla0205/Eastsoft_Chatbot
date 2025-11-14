const https = require('https');

// BigKinds API 호출
async function searchNews(query, accessKey) {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const requestBody = {
    access_key: accessKey,
    argument: {
      query: query,
      published_at: {
        from: weekAgo.toISOString().split('T')[0],
        until: today.toISOString().split('T')[0]
      },
      category: ["경제"],
      sort: { date: "desc" },
      hilight: 200,
      return_from: 0,
      return_size: 2,
      fields: ["title", "content", "published_at", "provider", "hilight"]
    }
  };

  return new Promise((resolve, reject) => {
    const data = JSON.stringify(requestBody);
    
    const options = {
      hostname: 'tools.kinds.or.kr',
      path: '/search/news',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.result === 0) {
            resolve(result.return_object.documents);
          } else {
            reject(new Error(`BigKinds API error: ${result.result}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('BigKinds API timeout'));
    });
    
    req.write(data);
    req.end();
  });
}

exports.handler = async (event) => {
  try {
    console.log('Event received:', JSON.stringify(event));
    
    const { message, conversationId } = JSON.parse(event.body);
    console.log('Parsed message:', message);
    
    const bigkindsKey = process.env.BIGKINDS_API_KEY;
    if (!bigkindsKey) {
      throw new Error('BIGKINDS_API_KEY not configured');
    }

    console.log('Searching news for:', message);
    const newsData = await searchNews(message, bigkindsKey);
    console.log('News data received:', newsData.length, 'articles');

    const sources = newsData.map(news => ({
      title: news.title,
      provider: news.provider,
      published_at: news.published_at
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        response: `"${message}"에 대한 뉴스를 ${newsData.length}개 찾았습니다.`,
        conversationId: conversationId,
        sources: sources
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