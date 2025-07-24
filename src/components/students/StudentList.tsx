import { useState, useEffect } from 'react'
import { Student, StudentWithClass } from '../../types/student'
import { mockDataStore } from '../../stores/mockDataStore'
import { AttendanceProgressBar } from './AttendanceProgressBar'

const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

interface StudentListProps {
  onAdd: () => void
  onEdit: (student: Student) => void
}

export function StudentList({ onAdd, onEdit }: StudentListProps) {
  const [students, setStudents] = useState<StudentWithClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'by_day'>('all')

  useEffect(() => {
    fetchStudents()
  }, [])

  function fetchStudents() {
    try {
      setLoading(true)
      
      // Mock 데이터 스토어에서 학생 목록 가져오기
      mockDataStore.initialize()
      const mockStudents = mockDataStore.getStudents()
      
      // StudentWithClass 형식으로 변환
      const studentsWithClass: StudentWithClass[] = mockStudents.map(student => ({
        id: student.id,
        name: student.name,
        parent_name: student.parent_name,
        parent_phone: student.parent_phone,
        grade: student.grade,
        notes: student.notes,
        class_type: student.class_type,
        class_duration: student.class_duration,
        payment_day: student.payment_day,
        created_at: student.created_at,
        updated_at: student.updated_at,
        student_classes: [{
          student_id: student.id,
          class_id: 'mock-class-id',
          payment_day: student.payment_day,
          payment_type: student.payment_type,
          robotics_option: student.robotics_option,
          robotics_day: student.robotics_day,
          created_at: student.created_at,
          updated_at: student.updated_at,
          classes: {
            id: 'mock-class-id',
            name: student.subject,
            type: student.class_type,
            subject: student.subject,
            duration: `${student.class_duration} hour${student.class_duration > 1 ? 's' : ''}`,
            created_at: student.created_at,
            updated_at: student.updated_at
          }
        }]
      }))
      
      console.log('Mock 학생 목록 로드됨:', studentsWithClass)
      setStudents(studentsWithClass)
      
    } catch (err) {
      console.error('학생 목록 로드 오류:', err)
      setError(err instanceof Error ? err.message : '학생 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      const success = mockDataStore.deleteStudent(id)
      if (success) {
        fetchStudents() // 목록 새로고침
      } else {
        setError('학생을 찾을 수 없습니다.')
      }
    } catch (err) {
      console.error('학생 삭제 오류:', err)
      setError(err instanceof Error ? err.message : '학생 삭제에 실패했습니다.')
    }
  }

  const handleAttendanceCheck = (studentId: string) => {
    try {
      const success = mockDataStore.markAttendance(studentId)
      if (success) {
        fetchStudents() // 목록 새로고침하여 진행률 업데이트
      } else {
        setError('출석 체크에 실패했습니다. (이미 완료된 수업일 수 있습니다)')
      }
    } catch (err) {
      console.error('출석 체크 오류:', err)
      setError(err instanceof Error ? err.message : '출석 체크에 실패했습니다.')
    }
  }

  const handleUndoAttendance = (studentId: string) => {
    try {
      const success = mockDataStore.undoAttendance(studentId)
      if (success) {
        fetchStudents() // 목록 새로고침하여 진행률 업데이트
      } else {
        setError('출석 되돌리기에 실패했습니다.')
      }
    } catch (err) {
      console.error('출석 되돌리기 오류:', err)
      setError(err instanceof Error ? err.message : '출석 되돌리기에 실패했습니다.')
    }
  }

  const handleResetAttendance = (studentId: string) => {
    try {
      const success = mockDataStore.resetAttendance(studentId)
      if (success) {
        fetchStudents() // 목록 새로고침하여 진행률 업데이트
      } else {
        setError('출석 초기화에 실패했습니다.')
      }
    } catch (err) {
      console.error('출석 초기화 오류:', err)
      setError(err instanceof Error ? err.message : '출석 초기화에 실패했습니다.')
    }
  }

  // 요일별로 학생 그룹화
  const groupStudentsByDay = () => {
    const grouped: { [key: number]: StudentWithClass[] } = {}
    
    // 0~6까지 모든 요일 초기화
    for (let i = 0; i < 7; i++) {
      grouped[i] = []
    }
    
    // 학생들을 요일별로 분류
    students.forEach(student => {
      // Mock 데이터에서 해당 학생의 class_day_of_week 정보 가져오기
      const mockStudent = mockDataStore.getStudents().find(s => s.id === student.id)
      if (mockStudent) {
        grouped[mockStudent.class_day_of_week].push(student)
      }
    })
    
    return grouped
  }

  if (loading) return <div className="text-center">로딩 중...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">학생 목록</h2>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setViewMode('all')}
          >
            전체 목록
          </button>
          <button 
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'by_day' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setViewMode('by_day')}
          >
            요일별 보기
          </button>
          <button className="btn-primary" onClick={onAdd}>
            새 학생 추가
          </button>
        </div>
      </div>
      
      {viewMode === 'all' ? (
        // 전체 목록 보기
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학년</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">수업 정보</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학부모</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">결제 정보</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">로보틱스</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => {
                const studentClass = student.student_classes?.[0]
                const classInfo = studentClass?.classes
                
                return (
                  <tr key={student.id}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{student.name}</div>
                      {student.notes && (
                        <div className="text-sm text-gray-500 mb-2">{student.notes}</div>
                      )}
                      {/* 출석률 게이지 */}
                      {(() => {
                        const progress = mockDataStore.getAttendanceProgress(student.id)
                        return progress && (
                          <AttendanceProgressBar
                            current={progress.current}
                            total={progress.total}
                            percentage={progress.percentage}
                            isFeedbackPeriod={progress.isFeedbackPeriod}
                            feedbackThreshold={progress.feedbackThreshold}
                            isComplete={progress.isComplete}
                            paymentType={progress.paymentType}
                            onAttendanceCheck={() => handleAttendanceCheck(student.id)}
                            onUndoAttendance={() => handleUndoAttendance(student.id)}
                            onResetAttendance={() => handleResetAttendance(student.id)}
                          />
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {classInfo ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{classInfo.type}</div>
                          <div className="text-sm text-gray-500">{classInfo.duration}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">미지정</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.parent_name}</div>
                      <div className="text-sm text-gray-500">{student.parent_phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {studentClass ? (
                        <div>
                          <div className="text-sm text-gray-900">{studentClass.payment_day}일</div>
                          <div className="text-sm text-gray-500">
                            {studentClass.payment_type === 'monthly' ? '1개월' : '3개월'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">미지정</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {studentClass?.robotics_option ? (
                        <div className="text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            참여
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {studentClass.robotics_day === 'wed' ? '수요일' : '토요일'}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          미참여 (10% 할인)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        onClick={() => onEdit(student)}
                      >
                        수정
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        onClick={() => handleDelete(student.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // 요일별 보기
        <div className="space-y-6">
          {Object.entries(groupStudentsByDay()).map(([dayOfWeek, dayStudents]) => (
            <div key={dayOfWeek} className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                <h3 className="text-lg font-medium text-gray-900">
                  {DAY_LABELS[parseInt(dayOfWeek)]} ({dayStudents.length}명)
                </h3>
              </div>
              {dayStudents.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {dayStudents.map((student) => {
                    const studentClass = student.student_classes?.[0]
                    const classInfo = studentClass?.classes
                    const mockStudent = mockDataStore.getStudents().find(s => s.id === student.id)
                    
                    return (
                      <div key={student.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">{student.name}</h4>
                                <p className="text-sm text-gray-500">{student.grade}</p>
                                {mockStudent && (
                                  <p className="text-sm text-blue-600">{mockStudent.class_time} 수업</p>
                                )}
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">{classInfo?.subject || '미지정'}</div>
                                <div className="text-gray-500">{classInfo?.type} • {classInfo?.duration}</div>
                              </div>
                            </div>
                            
                            {/* 출석률 게이지 */}
                            {(() => {
                              const progress = mockDataStore.getAttendanceProgress(student.id)
                              return progress && (
                                <div className="mt-4">
                                  <AttendanceProgressBar
                                    current={progress.current}
                                    total={progress.total}
                                    percentage={progress.percentage}
                                    isFeedbackPeriod={progress.isFeedbackPeriod}
                                    feedbackThreshold={progress.feedbackThreshold}
                                    isComplete={progress.isComplete}
                                    paymentType={progress.paymentType}
                                    onAttendanceCheck={() => handleAttendanceCheck(student.id)}
                                    onUndoAttendance={() => handleUndoAttendance(student.id)}
                                    onResetAttendance={() => handleResetAttendance(student.id)}
                                  />
                                </div>
                              )
                            })()}
                          </div>
                          
                          <div className="flex space-x-2 ml-4">
                            <button 
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              onClick={() => onEdit(student)}
                            >
                              수정
                            </button>
                            <button 
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                              onClick={() => handleDelete(student.id)}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  이 요일에는 수업이 없습니다.
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 