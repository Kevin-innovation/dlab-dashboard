import {
  GPTFeedbackRequest,
  GPTFeedbackResponse,
  GPT_API_CONFIG,
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
    const rawApiKey = this.getApiKey()
    console.log('API Key check:', { hasApiKey: !!rawApiKey, apiKeyLength: rawApiKey?.length })
    
    if (!rawApiKey) {
      throw new Error(
        'OpenAI API 키가 설정되지 않았습니다. .env.local 파일에 VITE_OPENAI_API_KEY를 설정하거나 설정에서 API 키를 입력해주세요.'
      )
    }

    // API 키에서 줄바꿈과 공백 제거
    const apiKey = rawApiKey.replace(/\s/g, '').trim()
    console.log('정리된 API Key:', { originalLength: rawApiKey.length, cleanedLength: apiKey.length })

    const startTime = Date.now()

    try {
      const prompt = this.buildPrompt(request)
      const model = this.getModel()
      
      console.log('GPT 요청 정보:', {
        url: this.baseURL,
        model,
        prompt: prompt.substring(0, 100) + '...',
        apiKeyPrefix: apiKey.substring(0, 7) + '...'
      })

      // 각 값이 유효한지 검증
      const safeModel = model || 'gpt-4o-mini'
      const safePrompt = prompt || '기본 피드백 요청'
      const safeMaxTokens = GPT_API_CONFIG.max_tokens || 500
      const safeTemperature = GPT_API_CONFIG.temperature ?? 0.7
      const safePresencePenalty = GPT_API_CONFIG.presence_penalty ?? 0.1
      const safeFrequencyPenalty = GPT_API_CONFIG.frequency_penalty ?? 0.1

      console.log('안전한 값들 확인:', {
        safeModel,
        promptLength: safePrompt.length,
        safeMaxTokens,
        safeTemperature,
        safePresencePenalty,
        safeFrequencyPenalty
      })

      const requestBody = {
        model: safeModel,
        messages: [
          {
            role: 'system',
            content: '당신은 코딩학원의 전문 강사입니다. 커스텀 평식에 작성된 포맷을 정확하게 참고하여, 오늘날짜로 피드백 작성.',
          },
          {
            role: 'user',
            content: safePrompt,
          },
        ],
        max_tokens: safeMaxTokens,
        temperature: safeTemperature,
        presence_penalty: safePresencePenalty,
        frequency_penalty: safeFrequencyPenalty,
      }

      // JSON 직렬화 테스트
      let bodyString
      try {
        bodyString = JSON.stringify(requestBody)
        console.log('요청 body 직렬화 성공, 길이:', bodyString.length)
      } catch (serializeError) {
        console.error('JSON 직렬화 실패:', serializeError)
        throw new Error('요청 데이터 직렬화에 실패했습니다.')
      }

      // Fetch 대신 XMLHttpRequest 사용하여 Invalid value 에러 우회
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', this.baseURL)
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`)
        
        xhr.onload = () => {
          const mockResponse = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            json: async () => JSON.parse(xhr.responseText),
          } as Response
          resolve(mockResponse)
        }
        
        xhr.onerror = () => {
          reject(new Error(`네트워크 오류: ${xhr.status} ${xhr.statusText}`))
        }
        
        try {
          xhr.send(bodyString)
          console.log('XMLHttpRequest 전송 성공')
        } catch (sendError) {
          console.error('XMLHttpRequest 전송 실패:', sendError)
          reject(sendError)
        }
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
      
      // TypeError: Failed to execute 'fetch' 에러의 경우
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error('Fetch 에러 상세:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        throw new Error('네트워크 요청 중 오류가 발생했습니다. API 키나 설정을 확인해주세요.')
      }

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
    let prompt = `오늘 날짜: ${request.current_date || new Date().toLocaleDateString('ko-KR')}
학생명: ${request.student_name}
수업: ${request.class_name}
수업 내용: ${request.lesson_content}
학생 상황: ${request.student_performance}`

    if (request.custom_format) {
      prompt += `\n\n피드백 형식 요청:\n${request.custom_format}`
    }

    prompt += `\n\n위 정보를 바탕으로 학부모에게 전달할 오늘(${request.current_date || new Date().toLocaleDateString('ko-KR')}) 피드백을 작성해주세요.`

    if (request.custom_format) {
      prompt += ' 커스텀 형식에 명시된 포맷을 정확히 따라 작성해주세요.'
    } else {
      prompt += ` 다음 사항을 포함해주세요:
1. 오늘 수업에서 다룬 내용 요약
2. 학생의 학습 태도와 성과
3. 잘한 점과 개선이 필요한 점
4. 가정에서의 학습 방향 제안
5. 격려의 메시지`
    }

    prompt += `\n\n피드백은 정중하고 건설적이며, 구체적인 조언을 포함해야 합니다.`

    return prompt
  }

  /**
   * API 키 유효성 검사
   */
  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log('API 키 검증 시작:', { apiKeyLength: apiKey?.length, apiKeyPrefix: apiKey?.substring(0, 7) + '...' })
      
      if (!apiKey || apiKey.trim() === '') {
        console.error('API 키가 비어있습니다')
        return false
      }

      // API 키에서 줄바꿈과 공백 제거
      const cleanApiKey = apiKey.replace(/\s/g, '').trim()
      console.log('정리된 검증용 API Key:', { originalLength: apiKey.length, cleanedLength: cleanApiKey.length })

      // XMLHttpRequest 사용하여 Invalid value 에러 방지
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', 'https://api.openai.com/v1/models')
        xhr.setRequestHeader('Authorization', `Bearer ${cleanApiKey}`)
        
        xhr.onload = () => {
          const mockResponse = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
          } as Response
          resolve(mockResponse)
        }
        
        xhr.onerror = () => {
          reject(new Error(`네트워크 오류: ${xhr.status} ${xhr.statusText}`))
        }
        
        xhr.send()
      })

      console.log('API 키 검증 응답:', { status: response.status, ok: response.ok })
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
