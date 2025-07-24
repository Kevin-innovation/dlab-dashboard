import { Tables, TablesInsert, TablesUpdate } from './supabase'
import { StudentWithClass, ClassType } from './student'

// Supabase 스키마 기반 타입
export type Statistics = Tables<'statistics'>
export type StatisticsInsert = TablesInsert<'statistics'>
export type StatisticsUpdate = TablesUpdate<'statistics'>

// 학생 수 카운팅 규칙에 따른 통계 타입
export interface StudentCountStatistics {
  // 실제 학생 수
  actual_students: number
  
  // 코딩 규칙에 따른 카운트 (1:1 = 2카운트, 그룹 = 실제 수)
  weighted_count: number
  
  // 수업 유형별 세부사항
  one_on_one_students: number      // 1:1 수업 학생 수 (실제)
  one_on_one_count: number         // 1:1 수업 카운트 (2배)
  group_students: number           // 그룹 수업 학생 수
  group_count: number              // 그룹 수업 카운트 (실제 수)
  
  // 로보틱스 참여 통계
  robotics_participants: number
  robotics_non_participants: number
  
  // 결제 기간별 통계
  monthly_payment_students: number
  quarterly_payment_students: number
}

// 주간 통계 (일요일 기준)
export interface WeeklyStatistics extends StudentCountStatistics {
  week_start_date: string      // 일요일 날짜
  week_end_date: string        // 토요일 날짜
  week_number: number          // 연도 내 주차
  year: number
  
  // 수업 관련 통계
  total_classes_scheduled: number
  total_classes_completed: number
  total_classes_makeup: number
  attendance_rate: number      // 출석률
  
  // 수입 관련 통계
  weekly_revenue: number
  projected_monthly_revenue: number
}

// 월간 통계
export interface MonthlyStatistics extends StudentCountStatistics {
  month: number                // 1-12
  year: number
  
  // 수업 관련 통계
  total_classes_scheduled: number
  total_classes_completed: number
  total_classes_makeup: number
  average_attendance_rate: number
  
  // 수입 관련 통계
  total_revenue: number
  revenue_by_class_type: {
    one_on_one: number
    group: number
    robotics: number
  }
  
  // 학생 변동 사항
  new_students: number
  withdrawn_students: number
  net_student_change: number
}

// 통계 차트 데이터 타입
export interface ChartDataPoint {
  label: string
  value: number
  date?: string
  category?: string
}

export interface StatisticsChartData {
  weeklyStudentCount: ChartDataPoint[]
  monthlyRevenue: ChartDataPoint[]
  attendanceRate: ChartDataPoint[]
  classTypeDistribution: ChartDataPoint[]
  paymentStatusDistribution: ChartDataPoint[]
}

// 통계 필터 옵션
export interface StatisticsFilter {
  period: 'week' | 'month' | 'quarter' | 'year'
  startDate: string
  endDate: string
  classType?: ClassType | 'all'
  includeRobotics?: boolean
}

// 통계 요약 정보
export interface StatisticsSummary {
  current_period: WeeklyStatistics | MonthlyStatistics
  previous_period: WeeklyStatistics | MonthlyStatistics
  
  // 증감 비교
  student_change: {
    actual: number
    weighted: number
    percentage: number
  }
  
  revenue_change: {
    absolute: number
    percentage: number
  }
  
  attendance_change: {
    absolute: number
    percentage: number
  }
  
  // 트렌드 분석
  trends: {
    student_growth: 'increasing' | 'decreasing' | 'stable'
    revenue_trend: 'increasing' | 'decreasing' | 'stable'
    attendance_trend: 'improving' | 'declining' | 'stable'
  }
}

// 통계 성능 지표
export interface StatisticsPerformance {
  // 목표 대비 현황
  student_target: number
  student_actual: number
  student_achievement_rate: number
  
  revenue_target: number
  revenue_actual: number
  revenue_achievement_rate: number
  
  attendance_target: number
  attendance_actual: number
  attendance_achievement_rate: number
  
  // 효율성 지표
  revenue_per_student: number
  average_class_size: number
  teacher_utilization_rate: number
}

// 예측 분석 타입
export interface StatisticsForecast {
  period: string
  predicted_students: number
  predicted_revenue: number
  confidence_level: number
  factors: string[]
}

// 통계 색상 시스템
export const STATISTICS_COLORS = {
  one_on_one: '#3B82F6',      // 파란색
  group: '#10B981',           // 초록색
  robotics: '#F59E0B',        // 주황색
  total: '#6366F1',           // 보라색
  revenue: '#EF4444',         // 빨간색
  attendance: '#8B5CF6'       // 자주색
} as const

// 통계 라벨
export const STATISTICS_LABELS = {
  one_on_one: '1:1 수업',
  group: '그룹 수업',
  robotics: '로보틱스',
  total: '전체',
  revenue: '수입',
  attendance: '출석률'
} as const

// 성능 임계값
export const PERFORMANCE_THRESHOLDS = {
  attendance_rate: {
    excellent: 95,
    good: 85,
    needs_improvement: 75
  },
  student_growth: {
    excellent: 10,  // 월 10% 이상 성장
    good: 5,        // 월 5% 이상 성장
    needs_improvement: 0 // 성장 없음
  },
  revenue_achievement: {
    excellent: 105, // 목표 대비 105% 이상
    good: 95,       // 목표 대비 95% 이상
    needs_improvement: 85 // 목표 대비 85% 미만
  }
} as const