import { Tables, TablesInsert, TablesUpdate } from './supabase'

// Supabase 스키마 기반 타입
export type Feedback = Tables<'feedback'>
export type FeedbackInsert = TablesInsert<'feedback'>
export type FeedbackUpdate = TablesUpdate<'feedback'>

// 피드백 템플릿 타입
export interface FeedbackTemplate {
  id: string
  name: string
  description: string
  content: string
  created_at: string
  updated_at: string
}

// GPT API 요청/응답 타입
export interface GPTFeedbackRequest {
  student_name: string
  class_name: string
  lesson_content: string
  student_performance: string
  custom_format?: string
  template_id?: string
  current_date?: string
}

export interface GPTFeedbackResponse {
  feedback: string
  processing_time: number
  token_usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// 피드백 생성 폼 타입
export interface FeedbackFormData {
  student_id: string
  class_id: string
  lesson_content: string
  student_performance: string
  attendance_notes?: string
  homework_status?: string
  template_id?: string
  custom_format?: string
}

// 피드백 히스토리 타입
export interface FeedbackHistory {
  id: string
  student_name: string
  class_name: string
  feedback_content: string
  created_at: string
  template_used?: string
  token_usage?: number
}

// 미리 정의된 템플릿들
export const DEFAULT_TEMPLATES: Omit<FeedbackTemplate, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: '기본 피드백',
    description: '일반적인 수업 피드백 템플릿',
    content: `안녕하세요, {{student_name}} 학부모님.

오늘 {{class_name}} 수업에 대한 피드백을 전달드립니다.

【수업 내용】
{{lesson_content}}

【학습 태도 및 성과】
{{student_performance}}

【특이사항】
{{attendance_notes}}

【숙제 현황】
{{homework_status}}

감사합니다.`,
  },
  {
    name: '칭찬 중심 피드백',
    description: '학생의 장점과 성과를 강조하는 템플릿',
    content: `안녕하세요, {{student_name}} 학부모님.

오늘 {{student_name}} 학생이 {{class_name}} 수업에서 보여준 훌륭한 모습을 공유드립니다.

【오늘의 하이라이트】
{{student_performance}}

【수업 진도】
{{lesson_content}}

【칭찬할 점】
- 적극적인 수업 참여
- 뛰어난 문제 해결 능력
- 창의적인 아이디어 제시

앞으로도 {{student_name}} 학생의 성장을 함께 지켜보겠습니다.

감사합니다.`,
  },
  {
    name: '개선 중심 피드백',
    description: '보완이 필요한 부분을 중심으로 한 템플릿',
    content: `안녕하세요, {{student_name}} 학부모님.

{{class_name}} 수업 피드백을 전달드립니다.

【수업 내용】
{{lesson_content}}

【현재 학습 상황】
{{student_performance}}

【개선 방향】
- 기초 개념 복습이 필요합니다
- 반복 연습을 통한 숙련도 향상
- 집중력 향상을 위한 휴식 시간 조절

【가정에서 도움 방법】
- 매일 10분씩 복습 시간 확보
- 충분한 수면과 영양 관리
- 학습 환경 개선

함께 {{student_name}} 학생의 성장을 도와주세요.

감사합니다.`,
  },
]

// API 설정
export const GPT_API_CONFIG = {
  model: 'gpt-4o-mini', // 기본값, 환경변수로 오버라이드 가능
  max_tokens: 500,
  temperature: 0.7,
  presence_penalty: 0.1,
  frequency_penalty: 0.1,
} as const

// 에러 타입
export interface FeedbackError {
  code: string
  message: string
  details?: any
}
