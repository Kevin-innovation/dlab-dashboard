import { describe, it, expect, beforeEach } from 'vitest'
import { TuitionCalculator } from '../tuitionCalculator'
import { StudentWithClass, ClassType, PaymentType, ClassDuration } from '../../types/student'

describe('TuitionCalculator', () => {
  let mockStudent: StudentWithClass

  beforeEach(() => {
    mockStudent = {
      id: '1',
      name: '테스트 학생',
      parent_phone: '010-1234-5678',
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
          robotics_option: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ],
    }
  })

  describe('calculate', () => {
    it('1:1 수업 1시간 월납 기본 계산', () => {
      const result = TuitionCalculator.calculate(mockStudent)

      expect(result.student_name).toBe('테스트 학생')
      expect(result.class_type).toBe('1:1')
      expect(result.duration).toBe('1h')
      expect(result.payment_type).toBe('monthly')
      expect(result.robotics_included).toBe(false)
      expect(result.base_amount).toBeGreaterThan(0)
      expect(result.robotics_amount).toBe(0)
      expect(result.discount_amount).toBeGreaterThan(0) // 로보틱스 미참여 할인
    })

    it('1:1 수업 로보틱스 포함 계산', () => {
      mockStudent.student_classes![0].robotics_option = true

      const result = TuitionCalculator.calculate(mockStudent)

      expect(result.robotics_included).toBe(true)
      expect(result.robotics_amount).toBeGreaterThan(0)
      expect(result.discount_amount).toBe(0) // 로보틱스 참여시 미참여 할인 없음
    })

    it('분기납 결제시 할인 적용', () => {
      mockStudent.student_classes![0].payment_type = 'quarterly'

      const result = TuitionCalculator.calculate(mockStudent)

      expect(result.payment_type).toBe('quarterly')
      expect(result.discount_policies).toContain('분기납 할인')
      expect(result.discount_amount).toBeGreaterThan(0)
    })

    it('그룹 수업 계산', () => {
      mockStudent.student_classes![0].class_type = 'group'

      const result = TuitionCalculator.calculate(mockStudent)

      expect(result.class_type).toBe('group')
      expect(result.base_amount).toBeGreaterThan(0)
    })

    it('수업 시간별 요금 차이', () => {
      // 1시간
      const result1h = TuitionCalculator.calculate(mockStudent)

      // 1.5시간
      mockStudent.student_classes![0].class_duration = '1.5h'
      const result1_5h = TuitionCalculator.calculate(mockStudent)

      // 2시간
      mockStudent.student_classes![0].class_duration = '2h'
      const result2h = TuitionCalculator.calculate(mockStudent)

      expect(result1_5h.base_amount).toBeGreaterThan(result1h.base_amount)
      expect(result2h.base_amount).toBeGreaterThan(result1_5h.base_amount)
    })

    it('수업 정보가 없는 경우 에러 발생', () => {
      mockStudent.student_classes = []

      expect(() => {
        TuitionCalculator.calculate(mockStudent)
      }).toThrowError('학생의 수업 정보를 찾을 수 없습니다.')
    })
  })

  describe('calculateNextPaymentDate', () => {
    it('이번 달 결제일이 미래인 경우', () => {
      const futureDay = new Date().getDate() + 5
      const result = TuitionCalculator.calculateNextPaymentDate(futureDay)

      const resultDate = new Date(result)
      expect(resultDate.getDate()).toBe(futureDay)
      expect(resultDate.getMonth()).toBe(new Date().getMonth())
    })

    it('이번 달 결제일이 지난 경우 다음 달로', () => {
      const pastDay = Math.max(1, new Date().getDate() - 5)
      const result = TuitionCalculator.calculateNextPaymentDate(pastDay)

      const resultDate = new Date(result)
      const expectedMonth = new Date().getMonth() + 1
      expect(resultDate.getMonth()).toBe(expectedMonth % 12)
    })

    it('결제일이 해당 월 마지막 날보다 큰 경우', () => {
      const result = TuitionCalculator.calculateNextPaymentDate(31)
      const resultDate = new Date(result)

      // 결과가 해당 월의 유효한 날짜여야 함
      expect(resultDate.getDate()).toBeLessThanOrEqual(31)
    })

    it('마지막 결제일 기준으로 다음 결제일 계산', () => {
      const lastPaymentDate = '2024-01-15'
      const result = TuitionCalculator.calculateNextPaymentDate(15, lastPaymentDate)

      const resultDate = new Date(result)
      const expectedDate = new Date('2024-02-15')
      expect(resultDate.getTime()).toBe(expectedDate.getTime())
    })
  })

  describe('getPaymentStatus', () => {
    it('미래 날짜는 upcoming 상태', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 10)
      const dateString = futureDate.toISOString().split('T')[0]

      const result = TuitionCalculator.getPaymentStatus(dateString)

      expect(result.status).toBe('upcoming')
      expect(result.daysUntilDue).toBeGreaterThan(3)
    })

    it('3일 이내는 due 상태', () => {
      const nearDate = new Date()
      nearDate.setDate(nearDate.getDate() + 2)
      const dateString = nearDate.toISOString().split('T')[0]

      const result = TuitionCalculator.getPaymentStatus(dateString)

      expect(result.status).toBe('due')
      expect(result.daysUntilDue).toBeLessThanOrEqual(3)
    })

    it('과거 날짜는 overdue 상태', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)
      const dateString = pastDate.toISOString().split('T')[0]

      const result = TuitionCalculator.getPaymentStatus(dateString)

      expect(result.status).toBe('overdue')
      expect(result.daysUntilDue).toBeLessThan(0)
    })
  })

  describe('generatePaymentSummary', () => {
    it('학생 목록으로 수강료 요약 생성', () => {
      const students = [
        mockStudent,
        {
          ...mockStudent,
          id: '2',
          name: '학생2',
          student_classes: [
            {
              ...mockStudent.student_classes![0],
              id: '2',
              student_id: '2',
              class_type: 'group' as ClassType,
            },
          ],
        },
      ]

      const result = TuitionCalculator.generatePaymentSummary(students)

      expect(result.totalStudents).toBe(2)
      expect(result.totalMonthlyRevenue).toBeGreaterThan(0)
      expect(result.overduePayments).toBeGreaterThanOrEqual(0)
      expect(result.upcomingPayments).toBeGreaterThanOrEqual(0)
      expect(result.paymentsDueThisWeek).toBeGreaterThanOrEqual(0)
    })

    it('빈 배열일 때 기본값 반환', () => {
      const result = TuitionCalculator.generatePaymentSummary([])

      expect(result.totalStudents).toBe(0)
      expect(result.totalMonthlyRevenue).toBe(0)
      expect(result.overduePayments).toBe(0)
      expect(result.upcomingPayments).toBe(0)
      expect(result.paymentsDueThisWeek).toBe(0)
    })
  })
})
