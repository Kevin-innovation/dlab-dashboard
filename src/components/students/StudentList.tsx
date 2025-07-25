import { useState, useEffect } from 'react'
import { Student, StudentWithClass } from '../../types/student'
import { useAuth } from '../../contexts/AuthContext'
import { StudentService } from '../../services/studentService'
import { AttendanceProgressService } from '../../services/attendanceProgressService'
import { AttendanceGauge } from '../attendance/AttendanceGauge'
import { AttendanceProgress, CourseType } from '../../types/attendance'


interface StudentListProps {
  onAdd: () => void
  onEdit: (student: Student) => void
}

export function StudentList({ onAdd, onEdit }: StudentListProps) {
  const { teacher } = useAuth()
  const [students, setStudents] = useState<StudentWithClass[]>([])
  const [attendanceProgressMap, setAttendanceProgressMap] = useState<Map<string, AttendanceProgress>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'all' | 'by_day'>('all')

  useEffect(() => {
    if (teacher) {
      fetchStudents()
    }
  }, [teacher])

  async function fetchStudents() {
    if (!teacher) {
      setError('로그인 정보를 확인할 수 없습니다.')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // 학생 목록과 출석 진행률을 병렬로 로드
      const [studentsData, attendanceResponse] = await Promise.all([
        StudentService.getStudentsByTeacher(teacher.id),
        AttendanceProgressService.getProgressByTeacher(teacher.id)
      ])

      console.log('학생 목록 로드됨:', studentsData)
      console.log('출석 진행률 로드됨:', attendanceResponse.data)
      
      setStudents(studentsData)
      
      // 출석 진행률을 Map으로 변환 및 데이터 정합성 검사
      if (attendanceResponse.success && attendanceResponse.data) {
        const progressMap = AttendanceProgressService.progressArrayToMap(attendanceResponse.data)
        
        // 각 학생의 payment_type과 total_weeks가 일치하는지 검사하고 수정
        const corrections = []
        for (const student of studentsData) {
          const progress = progressMap.get(student.id)
          if (progress) {
            const studentClass = student.student_classes?.[0]
            const paymentType = studentClass?.payment_type
            const expectedTotalWeeks = (paymentType === 'threemonth' || paymentType === '3month' || paymentType !== 'monthly') ? 11 : 4
            
            if (progress.total_weeks !== expectedTotalWeeks) {
              console.log(`학생 ${student.name}의 total_weeks 불일치: 현재 ${progress.total_weeks}, 예상 ${expectedTotalWeeks}`)
              corrections.push({
                studentId: student.id,
                newCourseType: (paymentType === 'threemonth' || paymentType === '3month' || paymentType !== 'monthly') ? '3month' : '1month' as CourseType
              })
            }
          }
        }
        
        // 불일치하는 데이터들 자동 수정
        if (corrections.length > 0) {
          console.log(`${corrections.length}명의 출석 진행률 데이터 자동 수정 중...`)
          const correctionPromises = corrections.map(({ studentId, newCourseType }) =>
            AttendanceProgressService.adjustProgressForCourseType(studentId, newCourseType)
          )
          
          Promise.all(correctionPromises).then(results => {
            const successCount = results.filter(r => r.success).length
            console.log(`${successCount}/${corrections.length}명 데이터 수정 완료`)
            
            // 수정된 데이터로 다시 로드
            if (successCount > 0) {
              setTimeout(() => fetchStudents(), 1000)
            }
          })
        }
        
        setAttendanceProgressMap(progressMap)
      }
    } catch (err) {
      console.error('데이터 로드 오류:', err)
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 출석 진행률 업데이트 핸들러
  const handleAttendanceUpdate = (studentId: string, newWeek: number) => {
    setAttendanceProgressMap(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(studentId)
      if (current) {
        newMap.set(studentId, { ...current, current_week: newWeek })
      }
      return newMap
    })
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return

    try {
      await StudentService.deleteStudent(id)
      fetchStudents() // 목록 새로고침
    } catch (err) {
      console.error('학생 삭제 오류:', err)
      setError(err instanceof Error ? err.message : '학생 삭제에 실패했습니다.')
    }
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  학년
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수업 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  학부모
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결제 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  로보틱스
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
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
                      
                      {/* 출석 게이지 */}
                      {(() => {
                        const progress = attendanceProgressMap.get(student.id)
                        if (!progress) return null
                        
                        // payment_type에서 course_type 결정 (다양한 3개월 표기 방식 처리)
                        const studentClass = student.student_classes?.[0]
                        const paymentType = studentClass?.payment_type
                        const courseType: CourseType = (paymentType === 'threemonth' || paymentType === '3month' || paymentType !== 'monthly') ? '3month' : '1month'
                        
                        // 실제 코스 타입에 맞는 total_weeks 계산
                        const correctTotalWeeks = courseType === '3month' ? 11 : 4
                        
                        return (
                          <div className="mt-3">
                            <AttendanceGauge
                              studentId={student.id}
                              studentName={student.name}
                              currentWeek={progress.current_week}
                              totalWeeks={correctTotalWeeks}
                              courseType={courseType}
                              onUpdate={(newWeek) => handleAttendanceUpdate(student.id, newWeek)}
                              className="w-full"
                            />
                          </div>
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
          {(() => {
            // 요일별로 학생 그룹화
            const dayGroups = {
              monday: { label: '월요일', students: [] as StudentWithClass[] },
              tuesday: { label: '화요일', students: [] as StudentWithClass[] },
              wednesday: { label: '수요일', students: [] as StudentWithClass[] },
              thursday: { label: '목요일', students: [] as StudentWithClass[] },
              friday: { label: '금요일', students: [] as StudentWithClass[] },
              saturday: { label: '토요일', students: [] as StudentWithClass[] },
              sunday: { label: '일요일', students: [] as StudentWithClass[] }
            }

            // 학생들을 요일별로 분류 (수업 요일 기준)
            students.forEach(student => {
              // 수업 요일이 있는 경우 해당 요일에 추가 (임시로 랜덤 배치)
              const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
              const randomDay = days[Math.floor(Math.random() * days.length)] as keyof typeof dayGroups
              dayGroups[randomDay].students.push(student)
            })

            return Object.entries(dayGroups).map(([dayKey, dayData]) => (
              <div key={dayKey} className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    {dayData.label}
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({dayData.students.length}명)
                    </span>
                  </h3>
                </div>
                
                {dayData.students.length > 0 ? (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dayData.students.map(student => {
                        const studentClass = student.student_classes?.[0]
                        const classInfo = studentClass?.classes
                        const progress = attendanceProgressMap.get(student.id)

                        return (
                          <div key={student.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900">{student.name}</h4>
                                <p className="text-sm text-gray-600">{student.grade}</p>
                              </div>
                              <div className="flex space-x-1">
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

                            {/* 수업 정보 */}
                            <div className="mb-3">
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">수업:</span> {classInfo?.type || '미지정'}
                              </div>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">결제:</span> {studentClass?.payment_type === 'monthly' ? '1개월' : '3개월'}
                              </div>
                            </div>

                            {/* 출석 게이지 */}
                            {(() => {
                              if (!progress) return null
                              
                              const paymentType = studentClass?.payment_type
                              const courseType: CourseType = (paymentType === 'threemonth' || paymentType === '3month' || paymentType !== 'monthly') ? '3month' : '1month'
                              const correctTotalWeeks = courseType === '3month' ? 11 : 4
                              
                              return (
                                <div className="mt-3">
                                  <AttendanceGauge
                                    studentId={student.id}
                                    studentName={student.name}
                                    currentWeek={progress.current_week}
                                    totalWeeks={correctTotalWeeks}
                                    courseType={courseType}
                                    onUpdate={(newWeek) => handleAttendanceUpdate(student.id, newWeek)}
                                    className="w-full"
                                  />
                                </div>
                              )
                            })()}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <p>이 요일에 수업이 없습니다.</p>
                  </div>
                )}
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
