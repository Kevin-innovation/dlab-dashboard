import { TuitionCalculation, DEFAULT_TUITION_RATES, DISCOUNT_POLICIES } from '../types/payment'
import { StudentWithClass, ClassType, PaymentType, ClassDuration } from '../types/student'

export class TuitionCalculator {
  /**
   * 학생의 수강료를 계산합니다
   */
  static calculate(
    student: StudentWithClass,
    paymentType: PaymentType = 'monthly',
    roboticsIncluded: boolean = false
  ): TuitionCalculation {
    try {
      const studentClass = student.student_classes?.[0]
      const classInfo = studentClass?.classes
      
      if (!studentClass || !classInfo) {
        console.warn(`학생 ${student.name} (${student.id})의 수업 정보를 찾을 수 없습니다.`)
        return this.createDefaultCalculation(student, paymentType)
      }

    // 기본 정보 추출
    const classType = classInfo.type as ClassType
    
    // duration이 문자열인 경우 숫자로 변환 (예: "1.5 hours" -> 1.5)
    let duration: ClassDuration = 1 // 기본값
    if (typeof classInfo.duration === 'string') {
      const match = classInfo.duration.match(/(\d+\.?\d*)/);
      if (match) {
        const parsedDuration = parseFloat(match[1]);
        if ([1, 1.5, 2].includes(parsedDuration)) {
          duration = parsedDuration as ClassDuration;
        }
      }
    } else if (typeof classInfo.duration === 'number') {
      duration = classInfo.duration as ClassDuration;
    }
    
    const actualRoboticsIncluded = studentClass.robotics_option || roboticsIncluded

    // 기본 수업료 계산
    const baseAmount = this.calculateBaseAmount(classType, duration, paymentType)

    // 로보틱스 요금 계산
    const roboticsAmount = actualRoboticsIncluded ? this.calculateRoboticsAmount(paymentType) : 0

    // 총 요금
    const grossAmount = baseAmount + roboticsAmount

    // 할인 계산
    const discountInfo = this.calculateDiscount(grossAmount, actualRoboticsIncluded, paymentType)

    // 최종 요금
    const netAmount = grossAmount - discountInfo.discountAmount

    // 결제 기간 계산
    const paymentPeriod = this.calculatePaymentPeriod(paymentType)

    return {
      student_id: student.id,
      student_name: student.name,
      class_type: classType,
      duration: duration,
      payment_type: paymentType,
      robotics_included: actualRoboticsIncluded,

      base_amount: baseAmount,
      robotics_amount: roboticsAmount,
      gross_amount: grossAmount,

      discount_policies: discountInfo.policies,
      discount_amount: discountInfo.discountAmount,
      discount_rate: discountInfo.discountRate,

      net_amount: netAmount,

      payment_period_start: paymentPeriod.start,
      payment_period_end: paymentPeriod.end,

      monthly_rate: paymentType === 'quarterly' ? Math.round(netAmount / 3) : netAmount,
      weekly_rate: Math.round(netAmount / (paymentType === 'quarterly' ? 11 : 4)),
    }
    } catch (error) {
      console.error(`학생 ${student.name} (${student.id}) 수강료 계산 오류:`, error)
      return this.createDefaultCalculation(student, paymentType)
    }
  }

  /**
   * 기본 수업료 계산
   */
  private static calculateBaseAmount(
    classType: ClassType,
    duration: ClassDuration,
    paymentType: PaymentType
  ): number {
    const rates = DEFAULT_TUITION_RATES[classType]
    let baseRate = rates[duration]

    // 1:1 수업의 경우 주 단위로 계산 후 월/분기별 환산
    if (classType === '1:1') {
      const weeksInPeriod = paymentType === 'quarterly' ? 11 : 4
      baseRate = baseRate * weeksInPeriod
    }
    // 그룹 수업의 경우 이미 월별 요금
    else if (classType === 'group' && paymentType === 'quarterly') {
      baseRate = baseRate * 3 // 3개월치
    }

    return baseRate
  }

  /**
   * 로보틱스 수업료 계산
   */
  private static calculateRoboticsAmount(paymentType: PaymentType): number {
    const monthlyRate = DEFAULT_TUITION_RATES.robotics
    return paymentType === 'quarterly' ? monthlyRate * 3 : monthlyRate
  }

  /**
   * 할인 계산
   */
  private static calculateDiscount(
    grossAmount: number,
    roboticsIncluded: boolean,
    paymentType: PaymentType
  ): {
    policies: string[]
    discountAmount: number
    discountRate: number
  } {
    let totalDiscountRate = 0
    const appliedPolicies: string[] = []

    // 로보틱스 미참여 할인
    if (!roboticsIncluded) {
      totalDiscountRate += DISCOUNT_POLICIES.no_robotics.value
      appliedPolicies.push(DISCOUNT_POLICIES.no_robotics.name)
    }

    // 3개월 결제 할인
    if (paymentType === 'quarterly') {
      totalDiscountRate += DISCOUNT_POLICIES.quarterly.value
      appliedPolicies.push(DISCOUNT_POLICIES.quarterly.name)
    }

    const discountAmount = Math.round(grossAmount * (totalDiscountRate / 100))

    return {
      policies: appliedPolicies,
      discountAmount,
      discountRate: totalDiscountRate,
    }
  }

  /**
   * 결제 기간 계산
   */
  private static calculatePaymentPeriod(paymentType: PaymentType): {
    start: string
    end: string
  } {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1) // 이번 달 1일

    let end: Date
    if (paymentType === 'quarterly') {
      end = new Date(start)
      end.setMonth(end.getMonth() + 3)
      end.setDate(0) // 마지막 날
    } else {
      end = new Date(start)
      end.setMonth(end.getMonth() + 1)
      end.setDate(0) // 마지막 날
    }

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }

  /**
   * 다음 결제일 계산
   */
  static calculateNextPaymentDate(paymentDay: number, lastPaymentDate?: string): string {
    const now = new Date()
    let nextPaymentDate: Date

    if (lastPaymentDate) {
      const lastDate = new Date(lastPaymentDate)
      nextPaymentDate = new Date(lastDate)
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
    } else {
      nextPaymentDate = new Date(now.getFullYear(), now.getMonth(), paymentDay)

      // 이미 지난 날짜면 다음 달로
      if (nextPaymentDate <= now) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1)
      }
    }

    // 해당 월에 결제일이 없으면 마지막 날로 설정
    const lastDayOfMonth = new Date(
      nextPaymentDate.getFullYear(),
      nextPaymentDate.getMonth() + 1,
      0
    ).getDate()

    if (paymentDay > lastDayOfMonth) {
      nextPaymentDate.setDate(lastDayOfMonth)
    } else {
      nextPaymentDate.setDate(paymentDay)
    }

    return nextPaymentDate.toISOString().split('T')[0]
  }

  /**
   * 결제 상태 확인
   */
  static getPaymentStatus(nextPaymentDate: string): {
    status: 'upcoming' | 'due' | 'overdue'
    daysUntilDue: number
  } {
    const now = new Date()
    const paymentDate = new Date(nextPaymentDate)
    const diffTime = paymentDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    let status: 'upcoming' | 'due' | 'overdue'
    if (diffDays < 0) {
      status = 'overdue'
    } else if (diffDays <= 3) {
      status = 'due'
    } else {
      status = 'upcoming'
    }

    return {
      status,
      daysUntilDue: diffDays,
    }
  }

  /**
   * 학생별 수강료 요약 정보 생성
   */
  static generatePaymentSummary(students: StudentWithClass[]): {
    totalStudents: number
    totalMonthlyRevenue: number
    overduePayments: number
    upcomingPayments: number
    paymentsDueThisWeek: number
  } {
    let totalMonthlyRevenue = 0
    let overduePayments = 0
    let upcomingPayments = 0
    let paymentsDueThisWeek = 0

    students.forEach((student) => {
      const studentClass = student.student_classes?.[0]
      if (!studentClass) return

      try {
        const calculation = this.calculate(student, studentClass.payment_type as PaymentType)
        const monthlyAmount =
          calculation.payment_type === 'quarterly'
            ? calculation.net_amount / 3
            : calculation.net_amount

        totalMonthlyRevenue += monthlyAmount

        const nextPaymentDate = this.calculateNextPaymentDate(studentClass.payment_day)
        const paymentStatus = this.getPaymentStatus(nextPaymentDate)

        if (paymentStatus.status === 'overdue') {
          overduePayments++
        } else if (paymentStatus.status === 'due') {
          upcomingPayments++
          if (paymentStatus.daysUntilDue <= 7) {
            paymentsDueThisWeek++
          }
        } else {
          upcomingPayments++
        }
      } catch (error) {
        console.error(`Error calculating payment for student ${student.id}:`, error)
      }
    })

    return {
      totalStudents: students.length,
      totalMonthlyRevenue: Math.round(totalMonthlyRevenue),
      overduePayments,
      upcomingPayments,
      paymentsDueThisWeek,
    }
  }

  /**
   * 기본 계산 결과 생성 (오류 발생 시)
   */
  private static createDefaultCalculation(
    student: StudentWithClass,
    paymentType: PaymentType
  ): TuitionCalculation {
    const today = new Date()
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    return {
      student_id: student.id,
      student_name: student.name,
      class_type: '1:1' as ClassType,
      duration: 1,
      payment_type: paymentType,
      robotics_included: false,
      base_amount: 0,
      robotics_amount: 0,
      gross_amount: 0,
      discount_policies: [],
      discount_amount: 0,
      discount_rate: 0,
      net_amount: 0,
      payment_period_start: startDate.toISOString().split('T')[0],
      payment_period_end: endDate.toISOString().split('T')[0],
      monthly_rate: 0,
      weekly_rate: 0,
    }
  }
}
