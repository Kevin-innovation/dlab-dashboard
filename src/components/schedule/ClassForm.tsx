import { useState, useEffect } from 'react'
import { CreateScheduleInput, DAY_OF_WEEK_LABELS, ClassStatus, CLASS_STATUS_LABELS } from '../../types/class'
import { useAuth } from '../../contexts/AuthContext'
import { mockDataStore } from '../../stores/mockDataStore'

interface ClassFormProps {
  scheduleData?: any
  onSubmit: () => void
  onCancel: () => void
}

// 간단한 학생 타입
interface SimpleStudent {
  id: string
  name: string
  subject: string
  class_type: string
}

export function ClassForm({ scheduleData, onSubmit, onCancel }: ClassFormProps) {
  const { teacher } = useAuth()
  const [students, setStudents] = useState<SimpleStudent[]>([])
  const [formData, setFormData] = useState({
    student_id: scheduleData?.student_id ?? '',
    day_of_week: scheduleData?.day_of_week ?? 1,
    start_time: scheduleData?.start_time ?? '09:00',
    status: (scheduleData?.status ?? 'active') as ClassStatus
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Mock 데이터 스토어 초기화 및 학생 데이터 로드
    mockDataStore.initialize()
    const studentsWithClasses = mockDataStore.getStudentsWithClasses()
    
    const simpleStudents: SimpleStudent[] = studentsWithClasses.map(student => ({
      id: student.id,
      name: student.name,
      subject: student.subject,
      class_type: student.class_type
    }))
    
    setStudents(simpleStudents)
    console.log('ClassForm에서 로드된 학생들:', simpleStudents)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!teacher) {
        throw new Error('선생님 정보를 찾을 수 없습니다.')
      }

      if (!formData.student_id) {
        throw new Error('학생을 선택해주세요.')
      }

      const selectedStudent = students.find(s => s.id === formData.student_id)
      if (!selectedStudent) {
        throw new Error('선택한 학생 정보를 찾을 수 없습니다.')
      }

      console.log('스케줄 저장 시도:', {
        selected_student: selectedStudent,
        teacher_id: teacher.id,
        form_data: formData
      })

      // 1단계: Mock 데이터 스토어에서 클래스 생성 또는 조회
      const mockClass = mockDataStore.findOrCreateClass(
        selectedStudent.subject,
        selectedStudent.class_type as '1:1' | 'group',
        selectedStudent.subject
      )

      console.log('사용할 클래스:', mockClass)

      // 2단계: Mock 데이터 스토어에 스케줄 추가
      const newSchedule = mockDataStore.addSchedule({
        class_id: mockClass.id,
        teacher_id: teacher.id,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        status: formData.status
      })

      console.log('스케줄 생성 성공:', newSchedule)
      onSubmit()

    } catch (err) {
      console.error('전체 프로세스 오류:', err)
      setError(err instanceof Error ? err.message : '수업 일정 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'day_of_week' ? parseInt(value) : value
    }))
  }

  const timeOptions = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 9
    return `${hour.toString().padStart(2, '0')}:00`
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="student_id" className="block text-sm font-medium text-gray-700">학생</label>
          <select
            id="student_id"
            name="student_id"
            value={formData.student_id}
            onChange={handleChange}
            required
            className="input-field mt-1"
          >
            <option value="">학생 선택</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.name} ({student.class_type}, {student.subject})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700">요일</label>
          <select
            id="day_of_week"
            name="day_of_week"
            value={formData.day_of_week}
            onChange={handleChange}
            required
            className="input-field mt-1"
          >
            {DAY_OF_WEEK_LABELS.map((day, index) => (
              <option key={index} value={index}>{day}요일</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">시작 시간</label>
          <select
            id="start_time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            required
            className="input-field mt-1"
          >
            {timeOptions.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>

        {scheduleData && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">상태</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="input-field mt-1"
            >
              {Object.entries(CLASS_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 text-sm">
            <strong>오류:</strong> {error}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? '저장 중...' : (scheduleData ? '수정' : '추가')}
        </button>
      </div>
    </form>
  )
}