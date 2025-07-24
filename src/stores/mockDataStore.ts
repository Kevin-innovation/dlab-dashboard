// Mock 데이터 저장소
interface MockStudent {
  id: string
  name: string
  parent_name: string
  parent_phone: string
  grade: string
  notes: string
  class_type: '1:1' | 'group'
  subject: string
  class_duration: number
  payment_day: number
  payment_type: 'monthly' | 'quarterly'
  robotics_option: boolean
  robotics_day?: 'wed' | 'sat' | null
  created_at: string
  updated_at: string
  // 출석 관련 데이터
  attendance_count: number // 현재 출석 횟수
  start_date: string // 수업 시작일
  // 수업 스케줄 정보
  class_day_of_week: number // 0=일요일, 1=월요일, ..., 6=토요일
  class_time: string // 시작 시간 (예: "14:00")
}

interface MockClass {
  id: string
  name: string
  type: '1:1' | 'group'
  subject: string
  duration: string
  created_at: string
  updated_at: string
}

interface MockSchedule {
  id: string
  class_id: string
  teacher_id: string
  day_of_week: number
  start_time: string
  status: 'active' | 'planned' | 'completed' | 'makeup'
  created_at: string
  updated_at: string
  // 조인 데이터
  class_info?: MockClass
  student_name?: string
}

class MockDataStore {
  private students: MockStudent[] = []
  private classes: MockClass[] = []
  private schedules: MockSchedule[] = []

  // 학생 관련 메서드
  addStudent(studentData: Omit<MockStudent, 'id' | 'created_at' | 'updated_at' | 'attendance_count' | 'start_date'>): MockStudent {
    const newStudent: MockStudent = {
      ...studentData,
      id: this.generateId(),
      attendance_count: 0, // 초기 출석 횟수
      start_date: new Date().toISOString(), // 수업 시작일
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.students.push(newStudent)
    console.log('Mock 학생 추가됨:', newStudent)
    
    // 학생 추가 시 자동으로 스케줄도 생성
    this.createScheduleForStudent(newStudent)
    
    return newStudent
  }

  getStudents(): MockStudent[] {
    return [...this.students]
  }

  deleteStudent(id: string): boolean {
    const index = this.students.findIndex(s => s.id === id)
    if (index !== -1) {
      this.students.splice(index, 1)
      console.log('Mock 학생 삭제됨:', id)
      return true
    }
    return false
  }

  // 출석 체크 (출석 횟수 증가)
  markAttendance(studentId: string): boolean {
    const student = this.students.find(s => s.id === studentId)
    if (student) {
      const totalClasses = student.payment_type === 'monthly' ? 4 : 11
      if (student.attendance_count < totalClasses) {
        student.attendance_count += 1
        student.updated_at = new Date().toISOString()
        console.log(`${student.name} 출석 체크: ${student.attendance_count}회`)
        return true
      } else {
        console.log(`${student.name}은 이미 모든 수업을 완료했습니다.`)
        return false
      }
    }
    return false
  }

  // 출석 체크 되돌리기 (출석 횟수 감소)
  undoAttendance(studentId: string): boolean {
    const student = this.students.find(s => s.id === studentId)
    if (student && student.attendance_count > 0) {
      student.attendance_count -= 1
      student.updated_at = new Date().toISOString()
      console.log(`${student.name} 출석 되돌리기: ${student.attendance_count}회`)
      return true
    }
    return false
  }

  // 출석 초기화
  resetAttendance(studentId: string): boolean {
    const student = this.students.find(s => s.id === studentId)
    if (student) {
      student.attendance_count = 0
      student.start_date = new Date().toISOString()
      student.updated_at = new Date().toISOString()
      console.log(`${student.name} 출석 초기화됨`)
      return true
    }
    return false
  }

  // 학생의 출석률 정보 계산
  getAttendanceProgress(studentId: string) {
    const student = this.students.find(s => s.id === studentId)
    if (!student) return null

    // 결제 타입에 따른 총 수업 횟수
    const totalClasses = student.payment_type === 'monthly' ? 4 : 11
    const currentAttendance = student.attendance_count
    const progressPercentage = Math.min((currentAttendance / totalClasses) * 100, 100)
    
    // 피드백 기간 (마지막 1주일 전)
    const feedbackThreshold = student.payment_type === 'monthly' ? 3 : 10 // 1주일 전
    const isFeedbackPeriod = currentAttendance >= feedbackThreshold
    
    return {
      current: currentAttendance,
      total: totalClasses,
      percentage: progressPercentage,
      isFeedbackPeriod,
      feedbackThreshold,
      isComplete: currentAttendance >= totalClasses,
      paymentType: student.payment_type
    }
  }

  // 클래스 관련 메서드
  findOrCreateClass(name: string, type: '1:1' | 'group', subject: string): MockClass {
    let existingClass = this.classes.find(c => c.name === name && c.type === type)
    
    if (!existingClass) {
      existingClass = {
        id: this.generateId(),
        name,
        type,
        subject,
        duration: '1 hour',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.classes.push(existingClass)
      console.log('Mock 클래스 생성됨:', existingClass)
    }
    
    return existingClass
  }

  getClasses(): MockClass[] {
    return [...this.classes]
  }

  // 스케줄 관련 메서드
  addSchedule(scheduleData: Omit<MockSchedule, 'id' | 'created_at' | 'updated_at'>): MockSchedule {
    const classInfo = this.classes.find(c => c.id === scheduleData.class_id)
    const student = this.students.find(s => s.subject === classInfo?.subject)
    
    const newSchedule: MockSchedule = {
      ...scheduleData,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      class_info: classInfo,
      student_name: student?.name
    }
    
    this.schedules.push(newSchedule)
    console.log('Mock 스케줄 추가됨:', newSchedule)
    return newSchedule
  }

  getSchedules(): MockSchedule[] {
    return this.schedules.map(schedule => ({
      ...schedule,
      class_info: this.classes.find(c => c.id === schedule.class_id),
      student_name: this.students.find(s => s.subject === schedule.class_info?.subject)?.name
    }))
  }

  // 학생 추가 시 스케줄 자동 생성
  private createScheduleForStudent(student: MockStudent) {
    const mockClass = this.findOrCreateClass(student.subject, student.class_type, student.subject)
    
    // 기본 teacher ID (AuthContext에서 생성되는 것과 동일)
    const teacherId = '550e8400-e29b-41d4-a716-446655440000'
    
    const newSchedule = this.addSchedule({
      class_id: mockClass.id,
      teacher_id: teacherId,
      day_of_week: student.class_day_of_week,
      start_time: student.class_time,
      status: 'active'
    })
    
    console.log(`${student.name} 학생의 스케줄 자동 생성됨:`, newSchedule)
  }

  // 요일별 학생 조회
  getStudentsByDayOfWeek(): { [key: number]: MockStudent[] } {
    const studentsByDay: { [key: number]: MockStudent[] } = {}
    
    // 0~6까지 모든 요일 초기화
    for (let i = 0; i < 7; i++) {
      studentsByDay[i] = []
    }
    
    // 학생들을 요일별로 분류
    this.students.forEach(student => {
      studentsByDay[student.class_day_of_week].push(student)
    })
    
    return studentsByDay
  }

  // 학생과 클래스 정보를 함께 반환 (ClassForm용)
  getStudentsWithClasses() {
    return this.students.map(student => ({
      id: student.id,
      name: student.name,
      subject: student.subject,
      class_type: student.class_type,
      student_classes: [{
        classes: {
          id: this.findOrCreateClass(student.subject, student.class_type, student.subject).id,
          name: student.subject,
          type: student.class_type,
          subject: student.subject,
          duration: `${student.class_duration} hour${student.class_duration > 1 ? 's' : ''}`
        }
      }]
    }))
  }

  private generateId(): string {
    return 'mock-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36)
  }

  // 초기 데이터 로드
  initialize() {
    if (this.students.length === 0) {
      // 기본 mock 학생들 추가
      const student1 = this.addStudent({
        name: '김철수',
        parent_name: '김아버지',
        parent_phone: '010-1234-5678',
        grade: '중학교 1학년',
        notes: '수학에 관심이 많음',
        class_type: '1:1',
        subject: '파이썬 기초',
        class_duration: 1,
        payment_day: 15,
        payment_type: 'monthly',
        robotics_option: true,
        robotics_day: 'sat',
        class_day_of_week: 1, // 월요일
        class_time: '16:00'
      })
      
      const student2 = this.addStudent({
        name: '이영희',
        parent_name: '이어머니',
        parent_phone: '010-2345-6789',
        grade: '중학교 2학년',
        notes: '게임 개발에 관심있음',
        class_type: 'group',
        subject: '자바스크립트',
        class_duration: 1.5,
        payment_day: 1,
        payment_type: 'quarterly',
        robotics_option: false,
        robotics_day: null,
        class_day_of_week: 3, // 수요일  
        class_time: '18:00'
      })

      const student3 = this.addStudent({
        name: '박민수',
        parent_name: '박부모',
        parent_phone: '010-3456-7890',
        grade: '고등학교 1학년',
        notes: 'AI에 관심 많음',
        class_type: '1:1',
        subject: '파이썬 심화',
        class_duration: 2,
        payment_day: 10,
        payment_type: 'monthly',
        robotics_option: true,
        robotics_day: 'wed',
        class_day_of_week: 5, // 금요일
        class_time: '17:00'
      })

      // 초기 출석 데이터 설정 (데모용)
      student1.attendance_count = 2 // 월납 4주 중 2주 출석
      student2.attendance_count = 8 // 분기납 11주 중 8주 출석
      student3.attendance_count = 1 // 월납 4주 중 1주 출석

      console.log('Mock 데이터 스토어 초기화 완료')
    }
  }
}

// 싱글톤 인스턴스
export const mockDataStore = new MockDataStore()