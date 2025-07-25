// 출석 진행률 관련 타입 정의

export type CourseType = '1month' | '3month'

export interface AttendanceProgress {
  id: string
  student_id: string
  teacher_id: string
  current_week: number
  total_weeks: number
  course_type: CourseType
  last_attendance_date: string | null
  created_at: string
  updated_at: string
}

export interface AttendanceProgressInsert {
  student_id: string
  teacher_id: string
  current_week?: number
  total_weeks: number
  course_type?: CourseType
  last_attendance_date?: string | null
}

export interface AttendanceProgressUpdate {
  current_week?: number
  total_weeks?: number
  course_type?: CourseType
  last_attendance_date?: string | null
}

// 게이지 UI 관련 타입
export interface AttendanceGaugeProps {
  studentId: string
  studentName: string
  currentWeek: number
  totalWeeks: number
  courseType: CourseType
  onUpdate?: (newWeek: number) => void
  className?: string
}

// 피드백 라인 계산 헬퍼
export interface FeedbackTiming {
  feedbackWeek: number
  isNearFeedback: boolean
  weeksUntilFeedback: number
}

// 진행률 통계
export interface AttendanceStats {
  totalStudents: number
  completedStudents: number
  nearFeedbackStudents: number
  averageProgress: number
}

// 서비스 응답 타입
export interface AttendanceProgressResponse {
  success: boolean
  data?: AttendanceProgress
  error?: string
}

export interface AttendanceProgressListResponse {
  success: boolean
  data?: AttendanceProgress[]
  error?: string
}

// 게이지 액션 타입
export type AttendanceAction = 'increment' | 'decrement' | 'reset'

// 상수 정의
export const COURSE_CONFIGS = {
  '1month': {
    totalWeeks: 4,
    feedbackWeek: 3,
    label: '1개월 과정'
  },
  '3month': {
    totalWeeks: 11,
    feedbackWeek: 10,
    label: '3개월 과정'
  }
} as const

// 유틸리티 함수용 타입
export interface WeekCalculation {
  currentWeek: number
  totalWeeks: number
  progressPercentage: number
  isFeedbackWeek: boolean
  isComplete: boolean
  weeksRemaining: number
}