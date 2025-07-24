import { Tables, TablesInsert, TablesUpdate } from './supabase'
import { Student } from './student'

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type ClassStatus = 'active' | 'planned' | 'completed' | 'makeup'
export type AttendanceStatus = 'present' | 'absent' | 'makeup_needed' | 'makeup_completed'

// Supabase 스키마 기반 타입
export type Class = Tables<'classes'>
export type ClassInsert = TablesInsert<'classes'>
export type ClassUpdate = TablesUpdate<'classes'>

export type Schedule = Tables<'schedules'>
export type ScheduleInsert = TablesInsert<'schedules'>
export type ScheduleUpdate = TablesUpdate<'schedules'>

export type Attendance = Tables<'attendance'>
export type AttendanceInsert = TablesInsert<'attendance'>
export type AttendanceUpdate = TablesUpdate<'attendance'>

// 조인된 스케줄 정보 (표시용)
export interface ScheduleWithDetails extends Schedule {
  classes?: Class
  teachers?: Tables<'teachers'>
  students?: Student[]
  attendance?: Attendance[]
}

// 폼 입력용 타입
export interface CreateScheduleInput {
  class_id: string
  teacher_id: string
  day_of_week: DayOfWeek
  start_time: string
  status: ClassStatus
}

// 레거시 타입 (삭제 예정) - ClassForm에서 사용 중
export interface CreateClassInput {
  student_id: string
  day_of_week: DayOfWeek
  start_time: string
  duration: number
  status: ClassStatus
}

export interface UpdateScheduleInput extends Partial<CreateScheduleInput> {
  id: string
}

export interface CreateAttendanceInput {
  schedule_id: string
  student_id: string
  status: AttendanceStatus
  makeup_date?: string
}

export interface UpdateAttendanceInput extends Partial<CreateAttendanceInput> {
  id: string
}

// coding-rules.md 상태별 색상 시스템에 따라
export const CLASS_STATUS_COLORS = {
  active: 'bg-green-500 text-white',      // 진행중 - 초록색
  planned: 'bg-blue-500 text-white',      // 예정 - 파란색  
  completed: 'bg-gray-500 text-white',    // 완료 - 회색
  makeup: 'bg-red-500 text-white',        // 보강 - 빨간색
} as const

export const CLASS_STATUS_LABELS = {
  active: '진행중',
  planned: '예정',
  completed: '완료',
  makeup: '보강',
} as const

export const ATTENDANCE_STATUS_COLORS = {
  present: 'bg-green-500 text-white',           // 출석
  absent: 'bg-red-500 text-white',              // 결석
  makeup_needed: 'bg-yellow-500 text-white',   // 보강 필요
  makeup_completed: 'bg-blue-500 text-white',  // 보강 완료
} as const

export const ATTENDANCE_STATUS_LABELS = {
  present: '출석',
  absent: '결석',
  makeup_needed: '보강 필요',
  makeup_completed: '보강 완료',
} as const

export const DAY_OF_WEEK_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const 