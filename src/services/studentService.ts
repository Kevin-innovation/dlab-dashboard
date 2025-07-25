import { supabase } from '../lib/supabase'
import { CreateStudentInput, StudentWithClass } from '../types/student'

export class StudentService {
  /**
   * 새 학생 추가
   */
  static async createStudent(teacherId: string, studentData: CreateStudentInput): Promise<StudentWithClass> {
    try {
      // 1. 학생 정보 저장
      console.log('학생 생성 시도:', { teacherId, studentData })
      
      const { data: studentResult, error: studentError } = await supabase
        .from('students')
        .insert({
          teacher_id: teacherId,
          name: studentData.name,
          parent_name: studentData.parent_name,
          parent_phone: studentData.parent_phone,
          grade: studentData.grade,
          notes: studentData.notes || null
        })
        .select()
        .single()
        
      console.log('학생 생성 결과:', { studentResult, studentError })

      if (studentError) {
        console.error('학생 생성 오류:', studentError)
        throw new Error('학생 정보 저장에 실패했습니다.')
      }

      // 2. 클래스 정보 조회 또는 생성
      let classId: string
      
      // 기존 클래스 검색
      const { data: existingClass } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', teacherId)
        .eq('name', studentData.subject)
        .eq('type', studentData.class_type)
        .single()

      if (existingClass) {
        classId = existingClass.id
      } else {
        // 새 클래스 생성
        const { data: newClass, error: classError } = await supabase
          .from('classes')
          .insert({
            teacher_id: teacherId,
            name: studentData.subject,
            type: studentData.class_type,
            subject: studentData.subject,
            duration: `${studentData.class_duration}시간`
          })
          .select()
          .single()

        if (classError || !newClass) {
          console.error('클래스 생성 오류:', classError)
          throw new Error('클래스 정보 저장에 실패했습니다.')
        }

        classId = newClass.id
      }

      // 3. student_classes 연결 테이블에 정보 저장
      const { error: studentClassError } = await supabase
        .from('student_classes')
        .insert({
          student_id: studentResult.id,
          class_id: classId,
          payment_type: studentData.payment_type,
          payment_day: studentData.payment_day,
          robotics_option: studentData.robotics_option || false,
          robotics_day: studentData.robotics_day || null
        })

      if (studentClassError) {
        console.error('학생-클래스 연결 오류:', studentClassError)
        throw new Error('수업 정보 저장에 실패했습니다.')
      }

      // 4. 생성된 학생 정보를 다시 조회하여 반환
      const createdStudent = await this.getStudentById(studentResult.id)
      if (!createdStudent) {
        throw new Error('생성된 학생 정보를 조회할 수 없습니다.')
      }

      return createdStudent

    } catch (error) {
      console.error('StudentService.createStudent 오류:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('학생 생성 중 예상치 못한 오류가 발생했습니다.')
    }
  }

  /**
   * 선생님의 모든 학생 조회
   */
  static async getStudentsByTeacher(teacherId: string): Promise<StudentWithClass[]> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_classes (
            *,
            classes (
              id,
              name,
              type,
              subject,
              duration
            )
          )
        `)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('학생 목록 조회 오류:', error)
        throw new Error('학생 목록을 불러올 수 없습니다.')
      }

      return (data as any) || []
    } catch (error) {
      console.error('StudentService.getStudentsByTeacher 오류:', error)
      throw new Error('학생 목록 조회 중 오류가 발생했습니다.')
    }
  }

  /**
   * 특정 학생 조회
   */
  static async getStudentById(studentId: string): Promise<StudentWithClass | null> {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_classes (
            *,
            classes (
              id,
              name,
              type,
              subject,
              duration
            )
          )
        `)
        .eq('id', studentId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('학생 조회 오류:', error)
        throw new Error('학생 정보를 불러올 수 없습니다.')
      }

      return (data as any) || null
    } catch (error) {
      console.error('StudentService.getStudentById 오류:', error)
      return null
    }
  }

  /**
   * 학생 정보 업데이트
   */
  static async updateStudent(studentId: string, updates: Partial<CreateStudentInput>): Promise<StudentWithClass> {
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: updates.name,
          parent_name: updates.parent_name,
          parent_phone: updates.parent_phone,
          grade: updates.grade,
          payment_day: updates.payment_day,
          notes: updates.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', studentId)
        .select()
        .single()

      if (error) {
        console.error('학생 업데이트 오류:', error)
        throw new Error('학생 정보 업데이트에 실패했습니다.')
      }

      const updatedStudent = await this.getStudentById(studentId)
      if (!updatedStudent) {
        throw new Error('업데이트된 학생 정보를 조회할 수 없습니다.')
      }

      return updatedStudent
    } catch (error) {
      console.error('StudentService.updateStudent 오류:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('학생 정보 업데이트 중 오류가 발생했습니다.')
    }
  }

  /**
   * 학생 삭제
   */
  static async deleteStudent(studentId: string): Promise<void> {
    try {
      // student_classes 먼저 삭제 (외래키 제약조건)
      const { error: studentClassError } = await supabase
        .from('student_classes')
        .delete()
        .eq('student_id', studentId)

      if (studentClassError) {
        console.error('학생-클래스 연결 삭제 오류:', studentClassError)
        throw new Error('수업 정보 삭제에 실패했습니다.')
      }

      // 학생 정보 삭제
      const { error: studentError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)

      if (studentError) {
        console.error('학생 삭제 오류:', studentError)
        throw new Error('학생 정보 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('StudentService.deleteStudent 오류:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('학생 삭제 중 오류가 발생했습니다.')
    }
  }
}