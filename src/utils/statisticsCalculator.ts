import { 
  StudentCountStatistics, 
  WeeklyStatistics, 
  MonthlyStatistics,
  StatisticsSummary,
  StatisticsPerformance,
  ChartDataPoint,
  PERFORMANCE_THRESHOLDS
} from '../types/statistics'
import { StudentWithClass } from '../types/student'
import { TuitionCalculator } from './tuitionCalculator'

export class StatisticsCalculator {
  /**
   * 학생 수 카운팅 (코딩 규칙 적용)
   * 1:1 수업 = 2 카운트, 그룹 수업 = 실제 학생 수 카운트
   */
  static calculateStudentCount(students: StudentWithClass[]): StudentCountStatistics {
    let oneOnOneStudents = 0
    let groupStudents = 0
    let roboticsParticipants = 0
    let monthlyPaymentStudents = 0
    let quarterlyPaymentStudents = 0

    students.forEach(student => {
      const studentClass = student.student_classes?.[0]
      if (!studentClass) return

      // 수업 유형별 카운팅
      if (studentClass.class_type === '1:1') {
        oneOnOneStudents++
      } else if (studentClass.class_type === 'group') {
        groupStudents++
      }

      // 로보틱스 참여 여부
      if (studentClass.robotics_option) {
        roboticsParticipants++
      }

      // 결제 기간별 분류
      if (studentClass.payment_type === 'monthly') {
        monthlyPaymentStudents++
      } else if (studentClass.payment_type === 'quarterly') {
        quarterlyPaymentStudents++
      }
    })

    // 코딩 규칙에 따른 가중 카운트 계산
    const oneOnOneCount = oneOnOneStudents * 2  // 1:1 수업은 2카운트
    const groupCount = groupStudents            // 그룹 수업은 실제 수
    const weightedCount = oneOnOneCount + groupCount

    return {
      actual_students: students.length,
      weighted_count: weightedCount,
      one_on_one_students: oneOnOneStudents,
      one_on_one_count: oneOnOneCount,
      group_students: groupStudents,
      group_count: groupCount,
      robotics_participants: roboticsParticipants,
      robotics_non_participants: students.length - roboticsParticipants,
      monthly_payment_students: monthlyPaymentStudents,
      quarterly_payment_students: quarterlyPaymentStudents
    }
  }

  /**
   * 주간 통계 계산 (일요일 기준)
   */
  static calculateWeeklyStatistics(
    students: StudentWithClass[],
    targetDate?: string
  ): WeeklyStatistics {
    const baseStats = this.calculateStudentCount(students)
    const weekDates = this.getWeekRange(targetDate)
    
    // 수업 관련 통계 (임시 데이터 - 실제로는 schedules/attendance 테이블에서 가져와야 함)
    const totalClassesScheduled = students.length * 4 // 주 4회 가정
    const totalClassesCompleted = Math.round(totalClassesScheduled * 0.9) // 90% 완료율 가정
    const totalClassesMakeup = Math.round(totalClassesScheduled * 0.1) // 10% 보강률 가정
    const attendanceRate = (totalClassesCompleted / totalClassesScheduled) * 100

    // 수입 계산
    const paymentSummary = TuitionCalculator.generatePaymentSummary(students)
    const weeklyRevenue = Math.round(paymentSummary.totalMonthlyRevenue / 4) // 주간 수입
    const projectedMonthlyRevenue = paymentSummary.totalMonthlyRevenue

    return {
      ...baseStats,
      week_start_date: weekDates.start,
      week_end_date: weekDates.end,
      week_number: this.getWeekNumber(new Date(weekDates.start)),
      year: new Date(weekDates.start).getFullYear(),
      total_classes_scheduled: totalClassesScheduled,
      total_classes_completed: totalClassesCompleted,
      total_classes_makeup: totalClassesMakeup,
      attendance_rate: Math.round(attendanceRate * 100) / 100,
      weekly_revenue: weeklyRevenue,
      projected_monthly_revenue: projectedMonthlyRevenue
    }
  }

  /**
   * 월간 통계 계산
   */
  static calculateMonthlyStatistics(
    students: StudentWithClass[],
    month?: number,
    year?: number
  ): MonthlyStatistics {
    const now = new Date()
    const targetMonth = month || now.getMonth() + 1
    const targetYear = year || now.getFullYear()

    const baseStats = this.calculateStudentCount(students)
    
    // 월간 수업 통계 (임시 계산)
    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate()
    const weekdaysInMonth = this.countWeekdays(targetYear, targetMonth - 1)
    const totalClassesScheduled = students.length * weekdaysInMonth
    const totalClassesCompleted = Math.round(totalClassesScheduled * 0.88)
    const totalClassesMakeup = Math.round(totalClassesScheduled * 0.12)
    const averageAttendanceRate = (totalClassesCompleted / totalClassesScheduled) * 100

    // 수입 계산
    const paymentSummary = TuitionCalculator.generatePaymentSummary(students)
    const totalRevenue = paymentSummary.totalMonthlyRevenue

    // 수업 유형별 수입 분배 (추정)
    const oneOnOneRevenue = Math.round(totalRevenue * 0.6) // 60%
    const groupRevenue = Math.round(totalRevenue * 0.3)    // 30%
    const roboticsRevenue = Math.round(totalRevenue * 0.1) // 10%

    return {
      ...baseStats,
      month: targetMonth,
      year: targetYear,
      total_classes_scheduled: totalClassesScheduled,
      total_classes_completed: totalClassesCompleted,
      total_classes_makeup: totalClassesMakeup,
      average_attendance_rate: Math.round(averageAttendanceRate * 100) / 100,
      total_revenue: totalRevenue,
      revenue_by_class_type: {
        one_on_one: oneOnOneRevenue,
        group: groupRevenue,
        robotics: roboticsRevenue
      },
      new_students: 0,      // 추후 구현
      withdrawn_students: 0, // 추후 구현
      net_student_change: 0  // 추후 구현
    }
  }

  /**
   * 통계 요약 및 비교 분석
   */
  static generateStatisticsSummary(
    currentPeriodStats: WeeklyStatistics | MonthlyStatistics,
    previousPeriodStats: WeeklyStatistics | MonthlyStatistics
  ): StatisticsSummary {
    // 학생 수 변화
    const studentChange = {
      actual: currentPeriodStats.actual_students - previousPeriodStats.actual_students,
      weighted: currentPeriodStats.weighted_count - previousPeriodStats.weighted_count,
      percentage: previousPeriodStats.actual_students > 0 
        ? ((currentPeriodStats.actual_students - previousPeriodStats.actual_students) / previousPeriodStats.actual_students) * 100
        : 0
    }

    // 수입 변화
    const currentRevenue = 'weekly_revenue' in currentPeriodStats 
      ? currentPeriodStats.weekly_revenue 
      : currentPeriodStats.total_revenue
    const previousRevenue = 'weekly_revenue' in previousPeriodStats 
      ? previousPeriodStats.weekly_revenue 
      : previousPeriodStats.total_revenue

    const revenueChange = {
      absolute: currentRevenue - previousRevenue,
      percentage: previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0
    }

    // 출석률 변화
    const currentAttendance = 'attendance_rate' in currentPeriodStats 
      ? currentPeriodStats.attendance_rate 
      : currentPeriodStats.average_attendance_rate
    const previousAttendance = 'attendance_rate' in previousPeriodStats 
      ? previousPeriodStats.attendance_rate 
      : previousPeriodStats.average_attendance_rate

    const attendanceChange = {
      absolute: currentAttendance - previousAttendance,
      percentage: previousAttendance > 0 
        ? ((currentAttendance - previousAttendance) / previousAttendance) * 100
        : 0
    }

    // 트렌드 분석
    const trends = {
      student_growth: studentChange.percentage > 2 ? 'increasing' as const :
                     studentChange.percentage < -2 ? 'decreasing' as const : 'stable' as const,
      revenue_trend: revenueChange.percentage > 5 ? 'increasing' as const :
                    revenueChange.percentage < -5 ? 'decreasing' as const : 'stable' as const,
      attendance_trend: attendanceChange.absolute > 2 ? 'improving' as const :
                       attendanceChange.absolute < -2 ? 'declining' as const : 'stable' as const
    }

    return {
      current_period: currentPeriodStats,
      previous_period: previousPeriodStats,
      student_change: {
        ...studentChange,
        percentage: Math.round(studentChange.percentage * 100) / 100
      },
      revenue_change: {
        ...revenueChange,
        percentage: Math.round(revenueChange.percentage * 100) / 100
      },
      attendance_change: {
        ...attendanceChange,
        percentage: Math.round(attendanceChange.percentage * 100) / 100
      },
      trends
    }
  }

  /**
   * 성과 지표 계산
   */
  static calculatePerformanceMetrics(
    students: StudentWithClass[],
    targets: { students: number, revenue: number, attendance: number }
  ): StatisticsPerformance {
    const currentStats = this.calculateStudentCount(students)
    const paymentSummary = TuitionCalculator.generatePaymentSummary(students)
    
    // 임시 출석률 (실제로는 attendance 테이블에서 계산)
    const currentAttendance = 88 // 88% 가정

    return {
      student_target: targets.students,
      student_actual: currentStats.actual_students,
      student_achievement_rate: (currentStats.actual_students / targets.students) * 100,
      
      revenue_target: targets.revenue,
      revenue_actual: paymentSummary.totalMonthlyRevenue,
      revenue_achievement_rate: (paymentSummary.totalMonthlyRevenue / targets.revenue) * 100,
      
      attendance_target: targets.attendance,
      attendance_actual: currentAttendance,
      attendance_achievement_rate: (currentAttendance / targets.attendance) * 100,
      
      revenue_per_student: currentStats.actual_students > 0 
        ? Math.round(paymentSummary.totalMonthlyRevenue / currentStats.actual_students)
        : 0,
      average_class_size: currentStats.group_students > 0 
        ? Math.round(currentStats.group_students / Math.max(1, currentStats.group_students / 6)) // 평균 6명 그룹 가정
        : 1,
      teacher_utilization_rate: 85 // 85% 가정 (추후 실제 계산)
    }
  }

  /**
   * 차트 데이터 생성
   */
  static generateChartData(students: StudentWithClass[]): {
    classTypeDistribution: ChartDataPoint[]
    paymentTypeDistribution: ChartDataPoint[]
    roboticsParticipation: ChartDataPoint[]
  } {
    const stats = this.calculateStudentCount(students)

    return {
      classTypeDistribution: [
        { label: '1:1 수업', value: stats.one_on_one_students },
        { label: '그룹 수업', value: stats.group_students }
      ],
      paymentTypeDistribution: [
        { label: '월납', value: stats.monthly_payment_students },
        { label: '분기납', value: stats.quarterly_payment_students }
      ],
      roboticsParticipation: [
        { label: '로보틱스 참여', value: stats.robotics_participants },
        { label: '로보틱스 미참여', value: stats.robotics_non_participants }
      ]
    }
  }

  // 유틸리티 메서드들
  private static getWeekRange(targetDate?: string): { start: string, end: string } {
    const date = targetDate ? new Date(targetDate) : new Date()
    const day = date.getDay()
    
    // 일요일을 기준으로 주 시작/끝 계산
    const start = new Date(date)
    start.setDate(date.getDate() - day)
    
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    }
  }

  private static getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  private static countWeekdays(year: number, month: number): number {
    let count = 0
    const date = new Date(year, month, 1)
    
    while (date.getMonth() === month) {
      const dayOfWeek = date.getDay()
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 주말 제외
        count++
      }
      date.setDate(date.getDate() + 1)
    }
    
    return count
  }
}