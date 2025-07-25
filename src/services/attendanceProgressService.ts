import { supabase } from '../lib/supabase'
import {
  AttendanceProgress,
  AttendanceProgressInsert,
  AttendanceProgressUpdate,
  AttendanceProgressResponse,
  AttendanceProgressListResponse,
  AttendanceAction,
  CourseType,
  COURSE_CONFIGS,
  FeedbackTiming,
  WeekCalculation
} from '../types/attendance'

export class AttendanceProgressService {
  /**
   * 선생님의 모든 학생 출석 진행률 조회
   */
  static async getProgressByTeacher(teacherId: string): Promise<AttendanceProgressListResponse> {
    try {
      const { data, error } = await (supabase as any)
        .from('student_attendance_progress')
        .select(`
          *,
          students (
            name,
            grade,
            course_type
          )
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return {
        success: true,
        data: data || []
      }
    } catch (error) {
      console.error('Error fetching attendance progress:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '출석 진행률을 불러오는데 실패했습니다.'
      }
    }
  }

  /**
   * 특정 학생의 출석 진행률 조회
   */
  static async getProgressByStudent(studentId: string): Promise<AttendanceProgressResponse> {
    try {
      const { data, error } = await (supabase as any)
        .from('student_attendance_progress')
        .select('*')
        .eq('student_id', studentId)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as AttendanceProgress
      }
    } catch (error) {
      console.error('Error fetching student attendance progress:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '학생 출석 진행률을 불러오는데 실패했습니다.'
      }
    }
  }

  /**
   * 출석 진행률 업데이트
   */
  static async updateProgress(
    studentId: string,
    action: AttendanceAction,
    customWeek?: number
  ): Promise<AttendanceProgressResponse> {
    try {
      // 먼저 현재 진행률 조회
      const currentResponse = await this.getProgressByStudent(studentId)
      if (!currentResponse.success || !currentResponse.data) {
        throw new Error('현재 출석 진행률을 찾을 수 없습니다.')
      }

      const current = currentResponse.data
      let newWeek = current.current_week

      // 액션에 따른 주차 계산
      switch (action) {
        case 'increment':
          newWeek = Math.min(current.current_week + 1, current.total_weeks)
          break
        case 'decrement':
          newWeek = Math.max(current.current_week - 1, 0)
          break
        case 'reset':
          newWeek = 0
          break
        default:
          if (customWeek !== undefined) {
            newWeek = Math.max(0, Math.min(customWeek, current.total_weeks))
          }
      }

      // 데이터베이스 업데이트
      const updateData: AttendanceProgressUpdate = {
        current_week: newWeek,
        last_attendance_date: action === 'increment' ? new Date().toISOString() : current.last_attendance_date
      }

      const { data, error } = await (supabase as any)
        .from('student_attendance_progress')
        .update(updateData)
        .eq('student_id', studentId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as AttendanceProgress
      }
    } catch (error) {
      console.error('Error updating attendance progress:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '출석 진행률 업데이트에 실패했습니다.'
      }
    }
  }

  /**
   * 새 학생의 출석 진행률 생성
   */
  static async createProgress(progressData: AttendanceProgressInsert): Promise<AttendanceProgressResponse> {
    try {
      const { data, error } = await (supabase as any)
        .from('student_attendance_progress')
        .insert([progressData])
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as AttendanceProgress
      }
    } catch (error) {
      console.error('Error creating attendance progress:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '출석 진행률 생성에 실패했습니다.'
      }
    }
  }

  /**
   * 출석 진행률 삭제
   */
  static async deleteProgress(studentId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('student_attendance_progress')
        .delete()
        .eq('student_id', studentId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error deleting attendance progress:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '출석 진행률 삭제에 실패했습니다.'
      }
    }
  }

  /**
   * 코스 타입 변경 시 출석 진행률 조정
   */
  static async adjustProgressForCourseType(
    studentId: string,
    newCourseType: CourseType
  ): Promise<AttendanceProgressResponse> {
    try {
      const config = COURSE_CONFIGS[newCourseType]
      const currentResponse = await this.getProgressByStudent(studentId)
      
      if (!currentResponse.success || !currentResponse.data) {
        throw new Error('현재 출석 진행률을 찾을 수 없습니다.')
      }

      const current = currentResponse.data
      const adjustedWeek = Math.min(current.current_week, config.totalWeeks)

      const { data, error } = await (supabase as any)
        .from('student_attendance_progress')
        .update({
          total_weeks: config.totalWeeks,
          course_type: newCourseType,
          current_week: adjustedWeek
        })
        .eq('student_id', studentId)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as AttendanceProgress
      }
    } catch (error) {
      console.error('Error adjusting attendance progress:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '출석 진행률 조정에 실패했습니다.'
      }
    }
  }

  // === 유틸리티 함수들 ===

  /**
   * 피드백 타이밍 계산
   */
  static calculateFeedbackTiming(currentWeek: number, courseType: CourseType): FeedbackTiming {
    const config = COURSE_CONFIGS[courseType]
    const feedbackWeek = config.feedbackWeek
    
    return {
      feedbackWeek,
      isNearFeedback: currentWeek >= feedbackWeek,
      weeksUntilFeedback: Math.max(0, feedbackWeek - currentWeek)
    }
  }

  /**
   * 주차별 계산 유틸리티
   */
  static calculateWeekStats(currentWeek: number, totalWeeks: number, courseType: CourseType): WeekCalculation {
    const progressPercentage = totalWeeks > 0 ? (currentWeek / totalWeeks) * 100 : 0
    const config = COURSE_CONFIGS[courseType]
    
    return {
      currentWeek,
      totalWeeks,
      progressPercentage: Math.round(progressPercentage),
      isFeedbackWeek: currentWeek >= config.feedbackWeek,
      isComplete: currentWeek >= totalWeeks,
      weeksRemaining: Math.max(0, totalWeeks - currentWeek)
    }
  }

  /**
   * 진행률 상태 텍스트 반환
   */
  static getProgressStatusText(currentWeek: number, totalWeeks: number, courseType: CourseType): string {
    const stats = this.calculateWeekStats(currentWeek, totalWeeks, courseType)
    
    if (stats.isComplete) {
      return '과정 완료'
    }
    
    if (stats.isFeedbackWeek) {
      return '피드백 시기'
    }
    
    if (stats.weeksRemaining <= 1) {
      return '거의 완료'
    }
    
    return `${currentWeek}/${totalWeeks}주 진행중`
  }

  /**
   * 게이지 색상 클래스 반환
   */
  static getGaugeColorClass(currentWeek: number, totalWeeks: number, courseType: CourseType): string {
    const stats = this.calculateWeekStats(currentWeek, totalWeeks, courseType)
    
    if (stats.isComplete) {
      return 'bg-green-500'
    }
    
    if (stats.isFeedbackWeek) {
      return 'bg-orange-500'
    }
    
    if (stats.progressPercentage >= 75) {
      return 'bg-blue-500'
    }
    
    if (stats.progressPercentage >= 50) {
      return 'bg-blue-400'
    }
    
    return 'bg-blue-300'
  }

  /**
   * 여러 학생의 출석 진행률을 Map으로 변환
   */
  static progressArrayToMap(progressList: AttendanceProgress[]): Map<string, AttendanceProgress> {
    return new Map(progressList.map(progress => [progress.student_id, progress]))
  }
}