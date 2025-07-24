import { describe, it, expect, beforeEach } from 'vitest'
import { StatisticsCalculator } from '../statisticsCalculator'
import { StudentWithClass, ClassType, PaymentType, ClassDuration } from '../../types/student'

describe('StatisticsCalculator', () => {
  let mockStudents: StudentWithClass[]

  beforeEach(() => {
    mockStudents = [
      {
        id: '1',
        name: '1:1 학생',
        parent_phone: '010-1111-1111',
        payment_day: 15,
        notes: '',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        student_classes: [
          {
            id: '1',
            student_id: '1',
            class_type: '1:1' as ClassType,
            class_duration: '1h' as ClassDuration,
            payment_type: 'monthly' as PaymentType,
            payment_day: 15,
            robotics_option: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      },
      {
        id: '2',
        name: '그룹 학생1',
        parent_phone: '010-2222-2222',
        payment_day: 20,
        notes: '',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        student_classes: [
          {
            id: '2',
            student_id: '2',
            class_type: 'group' as ClassType,
            class_duration: '1.5h' as ClassDuration,
            payment_type: 'quarterly' as PaymentType,
            payment_day: 20,
            robotics_option: false,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      },
      {
        id: '3',
        name: '그룹 학생2',
        parent_phone: '010-3333-3333',
        payment_day: 10,
        notes: '',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
        student_classes: [
          {
            id: '3',
            student_id: '3',
            class_type: 'group' as ClassType,
            class_duration: '2h' as ClassDuration,
            payment_type: 'monthly' as PaymentType,
            payment_day: 10,
            robotics_option: true,
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
          },
        ],
      },
    ]
  })

  describe('calculateStudentCount', () => {
    it('학생 수 카운팅 규칙 적용 (1:1 = 2카운트, 그룹 = 실제수)', () => {
      const result = StatisticsCalculator.calculateStudentCount(mockStudents)

      expect(result.actual_students).toBe(3)
      expect(result.one_on_one_students).toBe(1)
      expect(result.one_on_one_count).toBe(2) // 1:1 수업 2카운트
      expect(result.group_students).toBe(2)
      expect(result.group_count).toBe(2) // 그룹 수업 실제 카운트
      expect(result.weighted_count).toBe(4) // 2 + 2 = 4
    })

    it('로보틱스 참여 분류', () => {
      const result = StatisticsCalculator.calculateStudentCount(mockStudents)

      expect(result.robotics_participants).toBe(2) // 학생 1, 3
      expect(result.robotics_non_participants).toBe(1) // 학생 2
    })

    it('결제 유형별 분류', () => {
      const result = StatisticsCalculator.calculateStudentCount(mockStudents)

      expect(result.monthly_payment_students).toBe(2) // 학생 1, 3
      expect(result.quarterly_payment_students).toBe(1) // 학생 2
    })

    it('빈 학생 배열 처리', () => {
      const result = StatisticsCalculator.calculateStudentCount([])

      expect(result.actual_students).toBe(0)
      expect(result.weighted_count).toBe(0)
      expect(result.one_on_one_students).toBe(0)
      expect(result.group_students).toBe(0)
    })

    it('수업 정보가 없는 학생 무시', () => {
      const studentWithoutClass = {
        ...mockStudents[0],
        id: '4',
        student_classes: [],
      }

      const result = StatisticsCalculator.calculateStudentCount([
        ...mockStudents,
        studentWithoutClass,
      ])

      expect(result.actual_students).toBe(4) // 전체 학생 수는 포함
      expect(result.weighted_count).toBe(4) // 하지만 카운팅에서는 제외
    })
  })

  describe('calculateWeeklyStatistics', () => {
    it('주간 통계 계산 (일요일 기준)', () => {
      const result = StatisticsCalculator.calculateWeeklyStatistics(mockStudents)

      expect(result.actual_students).toBe(3)
      expect(result.weighted_count).toBe(4)
      expect(result.week_start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.week_end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.week_number).toBeGreaterThan(0)
      expect(result.year).toBe(new Date().getFullYear())
      expect(result.total_classes_scheduled).toBeGreaterThan(0)
      expect(result.attendance_rate).toBeGreaterThan(0)
      expect(result.weekly_revenue).toBeGreaterThan(0)
    })

    it('특정 날짜 기준 주간 통계', () => {
      const targetDate = '2024-07-15' // 월요일
      const result = StatisticsCalculator.calculateWeeklyStatistics(mockStudents, targetDate)

      expect(result.week_start_date).toBe('2024-07-14') // 일요일
      expect(result.week_end_date).toBe('2024-07-20') // 토요일
    })

    it('주간 수업 및 수입 계산', () => {
      const result = StatisticsCalculator.calculateWeeklyStatistics(mockStudents)

      expect(result.total_classes_completed).toBeLessThanOrEqual(result.total_classes_scheduled)
      expect(result.total_classes_makeup).toBeGreaterThanOrEqual(0)
      expect(result.projected_monthly_revenue).toBeGreaterThan(0)
    })
  })

  describe('calculateMonthlyStatistics', () => {
    it('월간 통계 계산', () => {
      const result = StatisticsCalculator.calculateMonthlyStatistics(mockStudents)

      expect(result.actual_students).toBe(3)
      expect(result.month).toBe(new Date().getMonth() + 1)
      expect(result.year).toBe(new Date().getFullYear())
      expect(result.total_classes_scheduled).toBeGreaterThan(0)
      expect(result.average_attendance_rate).toBeGreaterThan(0)
      expect(result.total_revenue).toBeGreaterThan(0)
    })

    it('특정 월/년 통계 계산', () => {
      const result = StatisticsCalculator.calculateMonthlyStatistics(mockStudents, 6, 2024)

      expect(result.month).toBe(6)
      expect(result.year).toBe(2024)
    })

    it('수업 유형별 수입 분배', () => {
      const result = StatisticsCalculator.calculateMonthlyStatistics(mockStudents)

      expect(result.revenue_by_class_type.one_on_one).toBeGreaterThan(0)
      expect(result.revenue_by_class_type.group).toBeGreaterThan(0)
      expect(result.revenue_by_class_type.robotics).toBeGreaterThanOrEqual(0)

      const totalByType =
        result.revenue_by_class_type.one_on_one +
        result.revenue_by_class_type.group +
        result.revenue_by_class_type.robotics

      expect(totalByType).toBeLessThanOrEqual(result.total_revenue)
    })
  })

  describe('generateStatisticsSummary', () => {
    it('통계 요약 및 비교 분석', () => {
      const currentStats = StatisticsCalculator.calculateWeeklyStatistics(mockStudents)
      const previousStats = StatisticsCalculator.calculateWeeklyStatistics(mockStudents.slice(0, 2))

      const result = StatisticsCalculator.generateStatisticsSummary(currentStats, previousStats)

      expect(result.current_period).toEqual(currentStats)
      expect(result.previous_period).toEqual(previousStats)
      expect(result.student_change.actual).toBe(1) // 3 - 2 = 1
      expect(result.student_change.percentage).toBeGreaterThan(0)
      expect(result.trends.student_growth).toMatch(/^(increasing|decreasing|stable)$/)
      expect(result.trends.revenue_trend).toMatch(/^(increasing|decreasing|stable)$/)
      expect(result.trends.attendance_trend).toMatch(/^(improving|declining|stable)$/)
    })

    it('변화율 계산', () => {
      const currentStats = StatisticsCalculator.calculateWeeklyStatistics(mockStudents)
      const previousStats = StatisticsCalculator.calculateWeeklyStatistics([mockStudents[0]])

      const result = StatisticsCalculator.generateStatisticsSummary(currentStats, previousStats)

      expect(result.student_change.percentage).toBe(200) // (3-1)/1 * 100 = 200%
      expect(result.revenue_change.percentage).toBeGreaterThan(0)
    })
  })

  describe('calculatePerformanceMetrics', () => {
    it('성과 지표 계산', () => {
      const targets = { students: 5, revenue: 1000000, attendance: 90 }
      const result = StatisticsCalculator.calculatePerformanceMetrics(mockStudents, targets)

      expect(result.student_target).toBe(5)
      expect(result.student_actual).toBe(3)
      expect(result.student_achievement_rate).toBe(60) // 3/5 * 100

      expect(result.revenue_target).toBe(1000000)
      expect(result.revenue_actual).toBeGreaterThan(0)
      expect(result.revenue_achievement_rate).toBeGreaterThan(0)

      expect(result.attendance_target).toBe(90)
      expect(result.attendance_actual).toBe(88)

      expect(result.revenue_per_student).toBeGreaterThan(0)
      expect(result.average_class_size).toBeGreaterThan(0)
      expect(result.teacher_utilization_rate).toBe(85)
    })
  })

  describe('generateChartData', () => {
    it('차트 데이터 생성', () => {
      const result = StatisticsCalculator.generateChartData(mockStudents)

      expect(result.classTypeDistribution).toHaveLength(2)
      expect(result.classTypeDistribution[0].label).toBe('1:1 수업')
      expect(result.classTypeDistribution[0].value).toBe(1)
      expect(result.classTypeDistribution[1].label).toBe('그룹 수업')
      expect(result.classTypeDistribution[1].value).toBe(2)

      expect(result.paymentTypeDistribution).toHaveLength(2)
      expect(result.paymentTypeDistribution[0].value).toBe(2) // 월납
      expect(result.paymentTypeDistribution[1].value).toBe(1) // 분기납

      expect(result.roboticsParticipation).toHaveLength(2)
      expect(result.roboticsParticipation[0].value).toBe(2) // 참여
      expect(result.roboticsParticipation[1].value).toBe(1) // 미참여
    })
  })
})
