import json
import logging
from datetime import datetime

# 로깅 설정
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    테스트용 간단한 챗봇 핸들러
    """
    
    # CORS 헤더
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    }
    
    logger.info(f"Received event: {json.dumps(event)}")
    
    # OPTIONS 요청 처리
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # 요청 데이터 파싱
        body_str = event.get('body', '{}')
        logger.info(f"Body string: {body_str}")
        
        body = json.loads(body_str)
        user_question = body.get('question', '')
        game_type = body.get('gameType', '')
        
        logger.info(f"Question: {user_question}, Game: {game_type}")
        
        if not user_question:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': '질문이 필요합니다.',
                    'success': False
                })
            }
        
        # 간단한 응답 생성
        response_text = generate_simple_response(user_question, game_type)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'response': response_text,
                'timestamp': datetime.now().isoformat(),
                'success': True
            })
        }
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': f'서버 오류: {str(e)}',
                'success': False
            })
        }

def generate_simple_response(user_question, game_type):
    """
    간단한 응답 생성
    """
    
    if "정답" in user_question and "이해" in user_question:
        if game_type == "BlackSwan":
            return "블랙스완 게임에서 정답이 이해가 안 가신다면, 예측하기 어려운 극단적 경제 이벤트의 특성을 생각해보세요. 이런 사건들은 일반적인 예측 모델로는 파악하기 어렵고, 발생 확률은 낮지만 영향은 매우 큽니다. 구체적으로 어떤 부분이 궁금하신지 알려주시면 더 자세히 설명해드릴게요."
        elif game_type == "PrisonersDilemma":
            return "죄수의 딜레마에서 정답이 헷갈리신다면, 개인의 최적 선택과 집단의 최적 선택이 다를 수 있다는 점을 고려해보세요. 각자가 자신의 이익만 추구하면 모두에게 나쁜 결과가 나올 수 있습니다. 협력과 배신의 균형이 핵심입니다."
        else:
            return "경제 문제의 정답을 이해하기 어려우시군요. 경제학에서는 여러 변수와 상황을 종합적으로 고려해야 합니다. 어떤 구체적인 부분이 궁금하신지 말씀해주시면 더 도움을 드릴 수 있습니다."
    
    # 기본 응답
    game_responses = {
        'BlackSwan': f"'{user_question}'에 대한 질문을 주셨네요. 블랙스완 이벤트는 예측하기 어려운 극단적 상황을 의미합니다. 경제에서는 이런 예상치 못한 사건들이 큰 영향을 미칠 수 있어 리스크 관리가 중요합니다.",
        
        'PrisonersDilemma': f"'{user_question}'에 대해 답변드리겠습니다. 죄수의 딜레마는 개인의 이익과 집단의 이익이 충돌하는 상황을 다룹니다. 경제에서는 이런 상황이 자주 발생하며, 협력과 경쟁의 균형이 중요합니다.",
        
        'SignalDecoding': f"'{user_question}'에 대한 질문이군요. 경제 신호 해석은 다양한 지표와 데이터를 종합적으로 분석하는 것이 핵심입니다. 시장의 신호를 정확히 읽어내는 것이 중요한 경제적 판단의 기초가 됩니다."
    }
    
    return game_responses.get(game_type, f"'{user_question}'에 대한 질문을 주셨네요. 경제적 관점에서 분석해보면, 다양한 요인들을 종합적으로 고려해야 합니다. 더 구체적인 질문이 있으시면 자세히 답변해드리겠습니다.")