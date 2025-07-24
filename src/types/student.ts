import { Tables, TablesInsert, TablesUpdate } from './supabase'

export type ClassType = '1:1' | 'group'
export type ClassDuration = 1 | 1.5 | 2
export type PaymentType = 'monthly' | 'quarterly'
export type RoboticsDay = 'wed' | 'sat'
export type Subject = '파이썬 기초' | '자바스크립트' | 'HTML/CSS' | '웹개발' | '게임개발' | 'AI/머신러닝' | '로봇공학'

// Supabase 스키마 기반 타입
export type Student = Tables<'students'>
export type StudentInsert = TablesInsert<'students'>
export type StudentUpdate = TablesUpdate<'students'>

// 학생-수업 관계 타입
export type StudentClass = Tables<'student_classes'>
export type StudentClassInsert = TablesInsert<'student_classes'>
export type StudentClassUpdate = TablesUpdate<'student_classes'>

// 폼 입력용 확장 타입
export interface CreateStudentInput {
  name: string
  grade: string
  parent_name: string
  parent_phone: string
  notes?: string
  // 수업 관련 정보
  class_type: ClassType
  subject: Subject
  class_duration: ClassDuration
  payment_day: number // 1-31
  payment_type: PaymentType
  robotics_option?: boolean
  robotics_day?: RoboticsDay
}

export interface UpdateStudentInput extends Partial<CreateStudentInput> {
  id: string
}

// 조인된 학생 정보 (표시용)
export interface StudentWithClass extends Student {
  student_classes?: StudentClass[]
} 