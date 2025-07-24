import { supabase } from '../lib/supabase'

export interface CreateScheduleInput {
  class_id: string
  day_of_week: number // 0=일요일, 1=월요일, ..., 6=토요일
  start_time: string // 'HH:MM' 형식
  status?: 'active' | 'planned' | 'completed' | 'makeup'
}

export interface ScheduleWithClass {
  id: string
  class_id: string
  teacher_id: string
  day_of_week: number
  start_time: string
  status: string
  created_at: string
  updated_at: string
  classes: {
    id: string
    name: string
    type: string
    subject: string
    duration: string
  }
  // 학생 정보 (student_classes를 통해 연결)
  students?: Array<{
    id: string
    name: string
    grade: string
  }>
}

export class ScheduleService {
  /**
   * 새 스케줄 생성
   */
  static async createSchedule(teacherId: string, scheduleData: CreateScheduleInput): Promise<ScheduleWithClass> {
    try {
      const { data: scheduleResult, error: scheduleError } = await supabase
        .from('schedules')
        .insert([
          {
            teacher_id: teacherId,
            class_id: scheduleData.class_id,
            day_of_week: scheduleData.day_of_week,
            start_time: scheduleData.start_time,
            status: scheduleData.status || 'active'
          }
        ])
        .select()
        .single()

      if (scheduleError) {
        console.error('스케줄 생성 오류:', scheduleError)
        throw new Error('스케줄 정보 저장에 실패했습니다.')
      }

      // 생성된 스케줄 정보를 다시 조회하여 반환
      const createdSchedule = await this.getScheduleById(scheduleResult.id)
      if (!createdSchedule) {
        throw new Error('생성된 스케줄 정보를 조회할 수 없습니다.')
      }

      return createdSchedule
    } catch (error) {
      console.error('ScheduleService.createSchedule 오류:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('스케줄 생성 중 예상치 못한 오류가 발생했습니다.')
    }
  }

  /**
   * 선생님의 모든 스케줄 조회
   */
  static async getSchedulesByTeacher(teacherId: string): Promise<ScheduleWithClass[]> {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          classes (
            id,
            name,
            type,
            subject,
            duration
          )
        `)
        .eq('teacher_id', teacherId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) {
        console.error('스케줄 목록 조회 오류:', error)
        throw new Error('스케줄 목록을 불러올 수 없습니다.')
      }

      // 각 스케줄에 대해 학생 정보 조회
      const schedulesWithStudents = await Promise.all(
        (data || []).map(async (schedule) => {
          const { data: studentData, error: studentError } = await supabase
            .from('student_classes')
            .select(`
              students (
                id,
                name,
                grade
              )
            `)
            .eq('class_id', schedule.class_id!)

          if (studentError) {
            console.error('학생 정보 조회 오류:', studentError)
          }

          return {
            ...schedule,
            students: studentData?.map(sc => sc.students).filter(Boolean) || []
          }
        })
      )

      return schedulesWithStudents as any
    } catch (error) {
      console.error('ScheduleService.getSchedulesByTeacher 오류:', error)
      throw new Error('스케줄 목록 조회 중 오류가 발생했습니다.')
    }
  }

  /**
   * 특정 스케줄 조회
   */
  static async getScheduleById(scheduleId: string): Promise<ScheduleWithClass | null> {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          classes (
            id,
            name,
            type,
            subject,
            duration
          )
        `)
        .eq('id', scheduleId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('스케줄 조회 오류:', error)
        throw new Error('스케줄 정보를 불러올 수 없습니다.')
      }

      if (!data) return null

      // 해당 스케줄의 학생 정보 조회
      const { data: studentData, error: studentError } = await supabase
        .from('student_classes')
        .select(`
          students (
            id,
            name,
            grade
          )
        `)
        .eq('class_id', data.class_id!)

      if (studentError) {
        console.error('학생 정보 조회 오류:', studentError)
      }

      return {
        ...data,
        students: studentData?.map(sc => sc.students).filter(Boolean) || []
      } as any
    } catch (error) {
      console.error('ScheduleService.getScheduleById 오류:', error)
      return null
    }
  }

  /**
   * 스케줄 정보 업데이트
   */
  static async updateSchedule(scheduleId: string, updates: Partial<CreateScheduleInput>): Promise<ScheduleWithClass> {
    try {
      const updateData: any = {}
      
      if (updates.day_of_week !== undefined) updateData.day_of_week = updates.day_of_week
      if (updates.start_time !== undefined) updateData.start_time = updates.start_time
      if (updates.status !== undefined) updateData.status = updates.status
      if (updates.class_id !== undefined) updateData.class_id = updates.class_id
      
      updateData.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from('schedules')
        .update(updateData)
        .eq('id', scheduleId)
        .select()
        .single()

      if (error) {
        console.error('스케줄 업데이트 오류:', error)
        throw new Error('스케줄 정보 업데이트에 실패했습니다.')
      }

      const updatedSchedule = await this.getScheduleById(scheduleId)
      if (!updatedSchedule) {
        throw new Error('업데이트된 스케줄 정보를 조회할 수 없습니다.')
      }

      return updatedSchedule
    } catch (error) {
      console.error('ScheduleService.updateSchedule 오류:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('스케줄 정보 업데이트 중 오류가 발생했습니다.')
    }
  }

  /**
   * 스케줄 삭제
   */
  static async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId)

      if (error) {
        console.error('스케줄 삭제 오류:', error)
        throw new Error('스케줄 정보 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('ScheduleService.deleteSchedule 오류:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('스케줄 삭제 중 오류가 발생했습니다.')
    }
  }

  /**
   * 클래스에 연결된 학생들 조회
   */
  static async getStudentsByClass(classId: string): Promise<Array<{id: string, name: string, grade: string}>> {
    try {
      const { data, error } = await supabase
        .from('student_classes')
        .select(`
          students (
            id,
            name,
            grade
          )
        `)
        .eq('class_id', classId)

      if (error) {
        console.error('클래스 학생 조회 오류:', error)
        throw new Error('클래스에 등록된 학생을 조회할 수 없습니다.')
      }

      return data?.map(sc => sc.students).filter(Boolean) || []
    } catch (error) {
      console.error('ScheduleService.getStudentsByClass 오류:', error)
      return []
    }
  }
}