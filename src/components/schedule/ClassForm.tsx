import { useState, useEffect } from 'react'
import {
  DAY_OF_WEEK_LABELS,
  ClassStatus,
  CLASS_STATUS_LABELS,
} from '../../types/class'
import { useAuth } from '../../contexts/AuthContext'
import { ScheduleService, CreateScheduleInput } from '../../services/scheduleService'
import { StudentService } from '../../services/studentService'

interface ClassFormProps {
  scheduleData?: any
  onSubmit: () => void
  onCancel: () => void
}

// 학생과 클래스 정보를 포함한 타입
interface StudentForSchedule {
  id: string
  name: string
  grade: string
  class_id: string
  class_name: string
  class_type: string
  subject: string
}

export function ClassForm({ scheduleData, onSubmit, onCancel }: ClassFormProps) {
  const { teacher } = useAuth()
  const [students, setStudents] = useState<StudentForSchedule[]>([])
  const [formData, setFormData] = useState({
    class_id: scheduleData?.class_id ?? '',
    day_of_week: scheduleData?.day_of_week ?? 1,
    start_time: scheduleData?.start_time ?? '09:00',
    status: (scheduleData?.status ?? 'active') as ClassStatus,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (teacher) {
      fetchStudents()
    }
  }, [teacher])

  async function fetchStudents() {
    if (!teacher) return

    try {
      setLoading(true)
      const studentsData = await StudentService.getStudentsByTeacher(teacher.id)
      
      // 학생과 클래스 정보를 매핑
      const studentsForSchedule: StudentForSchedule[] = studentsData.map((student) => {
        const studentClass = student.student_classes?.[0]
        const classInfo = studentClass?.classes
        
        if (!classInfo || !classInfo.name) {
          return null
        }
        
        return {
          id: student.id,
          name: student.name,
          grade: student.grade,
          class_id: classInfo?.id || '',
          class_name: classInfo.name || '미지정',
          class_type: classInfo.type || '1:1',
          subject: classInfo.subject || '미지정'
        }
      }).filter((student): student is StudentForSchedule => student !== null)

      setStudents(studentsForSchedule) // 클래스 정보가 있는 학생들
      console.log('실제 DB에서 로드된 학생들:', studentsForSchedule)
    } catch (error) {
      console.error('학생 목록 조회 오류:', error)
      setError('학생 목록을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!teacher) {
        throw new Error('선생님 정보를 찾을 수 없습니다.')
      }

      if (!formData.class_id) {
        throw new Error('클래스를 선택해주세요.')
      }

      const scheduleInput: CreateScheduleInput = {
        class_id: formData.class_id,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        status: formData.status
      }

      console.log('스케줄 저장 시도:', {
        teacher_id: teacher.id,
        schedule_data: scheduleInput,
      })

      if (scheduleData) {
        // 수정 모드
        await ScheduleService.updateSchedule(scheduleData.id, scheduleInput)
        console.log('스케줄 수정 성공')
      } else {
        // 생성 모드
        const newSchedule = await ScheduleService.createSchedule(teacher.id, scheduleInput)
        console.log('스케줄 생성 성공:', newSchedule)
      }

      onSubmit()
    } catch (err) {
      console.error('스케줄 저장 오류:', err)
      setError(err instanceof Error ? err.message : '수업 일정 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'day_of_week' ? parseInt(value) : value,
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
          <label htmlFor="class_id" className="block text-sm font-medium text-gray-700">
            클래스 선택
          </label>
          <select
            id="class_id"
            name="class_id"
            value={formData.class_id}
            onChange={handleChange}
            required
            className="input-field mt-1"
          >
            <option value="">클래스 선택</option>
            {students.map((student) => (
              <option key={student.id} value={student.class_id}>
                {student.name} - {student.subject} ({student.class_type})
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            학생별로 생성된 클래스 중에서 선택하세요
          </p>
        </div>

        <div>
          <label htmlFor="day_of_week" className="block text-sm font-medium text-gray-700">
            요일
          </label>
          <select
            id="day_of_week"
            name="day_of_week"
            value={formData.day_of_week}
            onChange={handleChange}
            required
            className="input-field mt-1"
          >
            {DAY_OF_WEEK_LABELS.map((day, index) => (
              <option key={index} value={index}>
                {day}요일
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
            시작 시간
          </label>
          <select
            id="start_time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            required
            className="input-field mt-1"
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {scheduleData && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              상태
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="input-field mt-1"
            >
              {Object.entries(CLASS_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
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
        <button type="button" onClick={onCancel} className="btn-secondary">
          취소
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '저장 중...' : scheduleData ? '수정' : '추가'}
        </button>
      </div>
    </form>
  )
}
