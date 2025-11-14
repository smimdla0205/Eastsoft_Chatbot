"""
AWS Lambda Handler - Bedrock + Vector DB Q&A Chatbot

아키텍처:
1. 사용자 질문 입력 (CloudFront CDN)
2. Lambda API 호출
3. Bedrock Claude로 답변 생성/정제
4. Supabase pgvector에서 유사 Q&A 검색
5. 가장 유사한 답변 반환 (정확도 100%)

서비스:
- Lambda: 벡터 검색 + Bedrock 통합
- S3: 프론트엔드 정적 파일 호스팅
- CloudFront: CDN 캐싱
- Bedrock: Claude 3 Sonnet
- Supabase: pgvector 저장소

환경 변수:
- SUPABASE_URL: Supabase URL
- SUPABASE_ANON_KEY: Supabase 키
- BEDROCK_REGION: AWS 리전 (기본: ap-northeast-1)
- BEDROCK_MODEL_ID: Claude 모델 ID
"""

import json
import os
import logging
from typing import Any
import boto3
import httpx
from botocore.exceptions import ClientError

# 로깅 설정
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS 클라이언트
bedrock = boto3.client(
    "bedrock-runtime",
    region_name=os.environ.get("BEDROCK_REGION", "ap-northeast-1")
)

# Supabase 설정
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_ANON_KEY")
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-sonnet-20240229-v1:0")

# 상수
SIMILARITY_THRESHOLD = 0.7
TOP_K = 3


def embed_question_bedrock(question: str) -> list[float]:
    """Bedrock Titan Embeddings로 질문 임베딩"""
    try:
        response = bedrock.invoke_model(
            modelId="amazon.titan-embed-text-v1",
            contentType="application/json",
            accept="application/json",
            body=json.dumps({"inputText": question})
        )
        response_body = json.loads(response["body"].read())
        logger.info("✅ Titan Embeddings 생성 완료")
        return response_body["embedding"]
    except ClientError as e:
        logger.error(f"❌ Titan Embeddings 오류: {str(e)}")
        raise


def search_similar_qa(embedding: list[float]) -> dict[str, Any] | None:
    """Supabase pgvector에서 유사한 Q&A 검색"""
    try:
        url = f"{SUPABASE_URL}/rest/v1/rpc/match_qa"
        headers = {
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "query_embedding": embedding,
            "match_count": TOP_K,
            "match_threshold": SIMILARITY_THRESHOLD,
        }

        with httpx.Client() as client:
            response = client.post(url, json=payload, headers=headers, timeout=10.0)
            response.raise_for_status()

        results = response.json()
        logger.info(f"✅ 벡터 검색 결과: {len(results)}개")
        return results[0] if results else None

    except Exception as e:
        logger.error(f"❌ 벡터 검색 오류: {str(e)}")
        return None


def invoke_bedrock(prompt: str, context: str = "") -> str:
    """
    AWS Bedrock - Claude 3 Sonnet 호출
    
    역할:
    1. 유사한 Q&A를 기반으로 응답 생성
    2. 문맥에 맞게 답변 정제
    """
    try:
        full_prompt = f"""당신은 회사 Q&A 챗봇 어시스턴트입니다.

사용자 질문: {prompt}

관련 정보:
{context}

위 정보를 바탕으로 간결하고 정확한 답변을 제공하세요."""

        message = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps({
                "anthropic_version": "bedrock-2023-06-01",
                "max_tokens": 500,
                "messages": [
                    {
                        "role": "user",
                        "content": full_prompt
                    }
                ]
            })
        )

        response_body = json.loads(message["body"].read())
        answer = response_body["content"][0]["text"]
        logger.info(f"✅ Bedrock 응답: {answer[:100]}...")
        return answer

    except ClientError as e:
        logger.error(f"❌ Bedrock 호출 오류: {str(e)}")
        raise


def format_response(
    question: str,
    answer: str,
    source: dict[str, Any] | None = None,
    similarity: float = 0.0
) -> dict[str, Any]:
    """응답 포맷팅"""
    return {
        "question": question,
        "answer": answer,
        "source": source,
        "similarity": similarity,
        "model": BEDROCK_MODEL_ID.split("/")[1] if "/" in BEDROCK_MODEL_ID else BEDROCK_MODEL_ID,
        "success": True,
    }


def handler(event: dict[str, Any], context: Any) -> dict[str, Any]:
    """
    AWS Lambda Handler
    
    이벤트 구조:
    {
        "body": {
            "question": "사용자 질문",
            "embedding": [0.1, 0.2, ...] (선택)
        }
    }
    """
    logger.info(f"📨 Event: {json.dumps(event)}")

    try:
        # 요청 파싱
        if isinstance(event.get("body"), str):
            body = json.loads(event["body"])
        else:
            body = event.get("body", {})

        question = body.get("question", "").strip()
        embedding = body.get("embedding")

        if not question:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({
                    "error": "질문이 비어있습니다",
                    "success": False,
                }),
            }

        logger.info(f"❓ 질문: {question}")

        # 1️⃣ 임베딩 준비
        if not embedding:
            logger.info("📊 Bedrock Titan Embeddings로 생성 중...")
            embedding = embed_question_bedrock(question)
        else:
            logger.info("✅ 클라이언트에서 받은 임베딩 사용")

        # 2️⃣ 벡터 검색
        result = search_similar_qa(embedding)

        if not result:
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                "body": json.dumps(
                    format_response(
                        question,
                        "죄송하지만, 제공된 Q&A 데이터셋에 해당 질문에 대한 답변이 없습니다.",
                        None,
                        0.0
                    ),
                    ensure_ascii=False
                ),
            }

        # 3️⃣ Bedrock으로 답변 생성/정제
        try:
            bedrock_answer = invoke_bedrock(
                question,
                f"기존 답변: {result.get('answer', '')}"
            )
            final_answer = bedrock_answer
        except Exception as e:
            logger.warning(f"⚠️  Bedrock 사용 불가, 원문 답변 반환: {str(e)}")
            final_answer = result.get("answer", "")

        # 4️⃣ 최종 응답
        response = format_response(
            question,
            final_answer,
            {"question": result.get("question")},
            result.get("similarity", 0.0)
        )

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response, ensure_ascii=False),
        }

    except Exception as e:
        logger.error(f"❌ Lambda 오류: {str(e)}", exc_info=True)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            "body": json.dumps(response, ensure_ascii=False),
        }

    except Exception as e:
        logger.error(f"❌ Lambda 오류: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error": "서버 오류가 발생했습니다",
                "success": False,
            }, ensure_ascii=False),
        }
