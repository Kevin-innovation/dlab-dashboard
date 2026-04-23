import { Tables, TablesInsert, TablesUpdate } from './supabase'

// Supabase 스키마 기반 타입
export type Feedback = Tables<'feedback'>
export type FeedbackInsert = TablesInsert<'feedback'>
export type FeedbackUpdate = TablesUpdate<'feedback'>

// 피드백 템플릿 타입
export interface FeedbackTemplate {
  id: string
  name: string
  description?: string
  content: string
  created_at: string
  updated_at: string
}

// 커스텀 템플릿 타입 (로컬스토리지 기반)
export interface CustomTemplate {
  id: string
  name: string
  content: string
  created_at: string
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
    name: '수업 보고서 (기본)',
    description: '날짜·수업내용·피드백·과제·연락처 포함 표준 보고서',
    content: `{{student_name}} 학생 {{date}} 수업 보고서

📘 수업 내용:
- {{lesson_content}}

💬 선생님 피드백:
{{student_performance}}

📌 과제:
- {{homework_status}}

📞 학원 연락처: {{phone_number}}
👨‍🏫 담당 선생님: {{teacher_name}}`,
  },
  {
    name: '수업 보고서 (칭찬)',
    description: '학생의 성과와 장점을 강조하는 보고서',
    content: `{{student_name}} 학생 {{date}} 수업 보고서

📘 수업 내용:
- {{lesson_content}}

💬 선생님 피드백:
{{student_performance}}
- 오늘 수업 태도가 매우 훌륭했습니다 👏

📌 과제:
- {{homework_status}}

📞 학원 연락처: {{phone_number}}
👨‍🏫 담당 선생님: {{teacher_name}}`,
  },
  {
    name: '수업 보고서 (복습 권장)',
    description: '복습 및 가정학습을 강조하는 보고서',
    content: `{{student_name}} 학생 {{date}} 수업 보고서

📘 수업 내용:
- {{lesson_content}}

💬 선생님 피드백:
{{student_performance}}
- 배운 내용을 가정에서 한 번 더 복습하면 큰 도움이 됩니다.

📌 과제:
- {{homework_status}}

📞 학원 연락처: {{phone_number}}
👨‍🏫 담당 선생님: {{teacher_name}}`,
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
