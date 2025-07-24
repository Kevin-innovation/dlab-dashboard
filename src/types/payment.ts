// import { Tables, TablesInsert, TablesUpdate } from './supabase'
import { ClassType, PaymentType } from './student'

// Supabase 스키마 기반 타입 (추후 payments 테이블 생성시)
export interface Payment {
  id: string
  student_id: string
  amount: number
  payment_date: string
  payment_method: 'cash' | 'card' | 'transfer' | 'other'
  payment_period_start: string
  payment_period_end: string
  class_type: ClassType
  robotics_included: boolean
  discount_rate: number
  status: 'pending' | 'completed' | 'overdue' | 'cancelled'
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreatePaymentInput {
  student_id: string
  amount: number
  payment_date: string
  payment_method: 'cash' | 'card' | 'transfer' | 'other'
  payment_period_start: string
  payment_period_end: string
  class_type: ClassType
  robotics_included: boolean
  discount_rate: number
  status?: 'pending' | 'completed' | 'overdue' | 'cancelled'
  notes?: string
}

export interface UpdatePaymentInput extends Partial<CreatePaymentInput> {
  id: string
}

// 수강료 계산을 위한 요금표 타입
export interface TuitionRate {
  id: string
  class_type: ClassType
  duration: number // 시간
  base_rate: number // 기본 요금 (시간당)
  group_rate?: number // 그룹 수업 요금 (월별)
  robotics_rate: number // 로보틱스 수업 요금
  created_at: string
  updated_at: string
}

// 할인 정책 타입
export interface DiscountPolicy {
  id: string
  name: string
  type: 'percentage' | 'fixed_amount'
  value: number
  conditions: {
    no_robotics?: boolean
    payment_period?: PaymentType
    multi_student?: boolean
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

// 수강료 계산 결과 타입
export interface TuitionCalculation {
  student_id: string
  student_name: string
  class_type: ClassType
  duration: number
  payment_type: PaymentType
  robotics_included: boolean

  // 요금 세부사항
  base_amount: number
  robotics_amount: number
  gross_amount: number

  // 할인 정보
  discount_policies: string[]
  discount_amount: number
  discount_rate: number

  // 최종 금액
  net_amount: number

  // 결제 기간
  payment_period_start: string
  payment_period_end: string

  // 월별/주별 단가
  monthly_rate?: number
  weekly_rate?: number
}

// 결제 현황 타입
export interface PaymentStatus {
  student_id: string
  student_name: string
  next_payment_date: string
  payment_amount: number
  payment_status: 'upcoming' | 'due' | 'overdue'
  days_until_due: number
  class_type: ClassType
  robotics_included: boolean
}

// 수강료 관리 상수
export const PAYMENT_METHODS = {
  cash: '현금',
  card: '카드',
  transfer: '계좌이체',
  other: '기타',
} as const

export const PAYMENT_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
} as const

export const PAYMENT_STATUS_LABELS = {
  pending: '대기중',
  completed: '완료',
  overdue: '연체',
  cancelled: '취소',
} as const

// 기본 요금표 (설정 가능하도록 구현 예정)
export const DEFAULT_TUITION_RATES = {
  '1:1': {
    1: 50000, // 1시간: 50,000원
    1.5: 70000, // 1.5시간: 70,000원
    2: 90000, // 2시간: 90,000원
  },
  group: {
    1: 150000, // 1시간 그룹: 월 150,000원
    1.5: 200000, // 1.5시간 그룹: 월 200,000원
    2: 250000, // 2시간 그룹: 월 250,000원
  },
  robotics: 30000, // 로보틱스: 월 30,000원
} as const

// 할인 정책
export const DISCOUNT_POLICIES = {
  no_robotics: {
    name: '로보틱스 미참여 할인',
    type: 'percentage' as const,
    value: 10, // 10%
  },
  quarterly: {
    name: '3개월 결제 할인',
    type: 'percentage' as const,
    value: 5, // 5%
  },
} as const
