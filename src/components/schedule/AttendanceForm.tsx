import { useState } from 'react'
import { ScheduleWithClass } from '../../services/scheduleService'

interface AttendanceFormProps {
  scheduleData: ScheduleWithClass
  date: string
  onSubmit: () => void
  onCancel: () => void
}

export function AttendanceForm({ scheduleData, date, onSubmit, onCancel }: AttendanceFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // TODO: 실제 출석 데이터 저장 로직 구현
      console.log('출석 처리:', {
        scheduleId: scheduleData.id,
        date,
        presentStudents: selectedStudents
      })
      
      // 임시로 성공 처리
      onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : '출석 처리에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">수업 정보</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">과목:</span> {scheduleData.classes?.subject}
          </div>
          <div>
            <span className="text-gray-500">타입:</span> {scheduleData.classes?.type}
          </div>
          <div>
            <span className="text-gray-500">날짜:</span> {date}
          </div>
          <div>
            <span className="text-gray-500">시간:</span> {scheduleData.start_time}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h4 className="font-medium text-gray-900 mb-4">학생 출석 체크</h4>
          <div className="space-y-3">
            {scheduleData.students && scheduleData.students.length > 0 ? (
              scheduleData.students.map(student => (
                <label key={student.id} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleStudentToggle(student.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {student.name} ({student.grade})
                  </span>
                </label>
              ))
            ) : (
              <p className="text-gray-500 text-sm">등록된 학생이 없습니다.</p>
            )}
          </div>
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
            {loading ? '처리 중...' : '출석 처리'}
          </button>
        </div>
      </form>
    </div>
  )
}