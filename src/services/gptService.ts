import {
  GPTFeedbackRequest,
  GPTFeedbackResponse,
  GPT_API_CONFIG,
  FeedbackError,
} from '../types/feedback'

export class GPTService {
  private static apiKey: string | null = null
  private static baseURL = 'https://api.openai.com/v1/chat/completions'

  /**
   * API 키 설정
   */
  static setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * API 키 확인
   */
  static hasApiKey(): boolean {
    // 환경변수에서 API 키 확인 우선
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY
    return !!(envApiKey || this.apiKey)
  }

  /**
   * 실제 사용할 API 키 반환
   */
  private static getApiKey(): string | null {
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY
    return envApiKey || this.apiKey
  }

  /**
   * 사용할 모델 반환
   */
  private static getModel(): string {
    return import.meta.env.VITE_OPENAI_MODEL || GPT_API_CONFIG.model
  }

  /**
   * 피드백 생성
   */
  static async generateFeedback(request: GPTFeedbackRequest): Promise<GPTFeedbackResponse> {
    const apiKey = this.getApiKey()
    if (!apiKey) {
      throw new Error(
        'OpenAI API 키가 설정되지 않았습니다. .env.local 파일에 VITE_OPENAI_API_KEY를 설정하거나 설정에서 API 키를 입력해주세요.'
      )
    }

    const startTime = Date.now()

    try {
      const prompt = this.buildPrompt(request)

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModel(),
          messages: [
            {
              role: 'system',
              content:
                '당신은 코딩학원의 전문 강사입니다. 학생들의 학습 상황을 바탕으로 학부모에게 전달할 정중하고 건설적인 피드백을 작성해주세요. 한국어로 답변하며, 구체적이고 실용적인 조언을 포함해주세요.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: GPT_API_CONFIG.max_tokens,
          temperature: GPT_API_CONFIG.temperature,
          presence_penalty: GPT_API_CONFIG.presence_penalty,
          frequency_penalty: GPT_API_CONFIG.frequency_penalty,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          `OpenAI API 오류: ${response.status} - ${errorData.error?.message || response.statusText}`
        )
      }

      const data = await response.json()
      const processingTime = Date.now() - startTime

      if (!data.choices || data.choices.length === 0) {
        throw new Error('OpenAI API로부터 응답을 받지 못했습니다.')
      }

      return {
        feedback: data.choices[0].message.content.trim(),
        processing_time: processingTime,
        token_usage: {
          prompt_tokens: data.usage?.prompt_tokens || 0,
          completion_tokens: data.usage?.completion_tokens || 0,
          total_tokens: data.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      console.error('GPT 피드백 생성 오류:', error)

      if (error instanceof Error) {
        throw error
      }

      throw new Error('피드백 생성 중 알 수 없는 오류가 발생했습니다.')
    }
  }

  /**
   * 프롬프트 구성
   */
  private static buildPrompt(request: GPTFeedbackRequest): string {
    let prompt = `학생명: ${request.student_name}
수업: ${request.class_name}
수업 내용: ${request.lesson_content}
학생 상황: ${request.student_performance}`

    if (request.custom_format) {
      prompt += `\n\n피드백 형식 요청:\n${request.custom_format}`
    }

    prompt += `\n\n위 정보를 바탕으로 학부모에게 전달할 피드백을 작성해주세요. 다음 사항을 포함해주세요:
1. 오늘 수업에서 다룬 내용 요약
2. 학생의 학습 태도와 성과
3. 잘한 점과 개선이 필요한 점
4. 가정에서의 학습 방향 제안
5. 격려의 메시지

피드백은 정중하고 건설적이며, 구체적인 조언을 포함해야 합니다.`

    return prompt
  }

  /**
   * API 키 유효성 검사
   */
  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error('API 키 검증 오류:', error)
      return false
    }
  }

  /**
   * 템플릿 변수 치환
   */
  static replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, value || '')
    })

    return result
  }

  /**
   * 사용량 추정
   */
  static estimateTokenUsage(text: string): number {
    // 대략적인 토큰 수 추정 (1 토큰 ≈ 4 문자)
    return Math.ceil(text.length / 4)
  }

  /**
   * 비용 추정 (모델별)
   */
  static estimateCost(tokens: number): number {
    const model = this.getModel()

    // GPT-4o mini: $0.00015 input, $0.0006 output per 1K tokens (평균 $0.0003)
    if (model === 'gpt-4o-mini') {
      return (tokens / 1000) * 0.0003
    }

    // GPT-3.5-turbo: $0.002 per 1K tokens
    return (tokens / 1000) * 0.002
  }
}
