import { useState, useEffect } from 'react'
import {
  Student,
  CreateStudentInput,
  ClassType,
  ClassDuration,
  PaymentType,
  RoboticsDay,
  Subject,
} from '../../types/student'
import { useAuth } from '../../contexts/AuthContext'
import { StudentService } from '../../services/studentService'

interface StudentFormProps {
  student?: Student
  onSubmit: () => void
  onCancel: () => void
}

export function StudentForm({ student, onSubmit, onCancel }: StudentFormProps) {
  const { teacher } = useAuth()
  const [formData, setFormData] = useState<CreateStudentInput>({
    name: student?.name ?? '',
    grade: student?.grade ?? '',
    parent_name: student?.parent_name ?? '',
    parent_phone: student?.parent_phone ?? '',
    notes: student?.notes ?? '',
    class_type: '1:1',
    subject: '파이썬 기초',
    class_duration: 1,
    payment_day: 1,
    payment_type: 'monthly',
    robotics_option: false,
    robotics_day: undefined,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!teacher) {
      setError('로그인 정보를 확인할 수 없습니다.')
      setLoading(false)
      return
    }

    try {
      const newStudent = await StudentService.createStudent(teacher.id, {
        name: formData.name,
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone,
        grade: formData.grade,
        notes: formData.notes || '',
        class_type: formData.class_type,
        subject: formData.subject,
        class_duration: formData.class_duration,
        payment_day: formData.payment_day,
        payment_type: formData.payment_type,
        robotics_option: formData.robotics_option || false,
        robotics_day: formData.robotics_option ? formData.robotics_day : null,
      })

      console.log('학생 추가 성공:', newStudent)
      onSubmit()
    } catch (err) {
      console.error('학생 추가 오류:', err)
      setError(err instanceof Error ? err.message : '학생 정보 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'payment_day'
          ? parseInt(value)
          : name === 'class_duration'
            ? (parseFloat(value) as ClassDuration)
            : name === 'robotics_option'
              ? (e.target as HTMLInputElement).checked
              : value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            이름
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="class_type" className="block text-sm font-medium text-gray-700">
            수업 유형
          </label>
          <select
            id="class_type"
            name="class_type"
            value={formData.class_type}
            onChange={handleChange}
            required
            className="input-field mt-1"
          >
            <option value="1:1">1:1</option>
            <option value="group">그룹</option>
          </select>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
            수업 과목
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="input-field mt-1"
          >
            <option value="파이썬 기초">파이썬 기초</option>
            <option value="자바스크립트">자바스크립트</option>
            <option value="HTML/CSS">HTML/CSS</option>
            <option value="웹개발">웹개발</option>
            <option value="게임개발">게임개발</option>
            <option value="AI/머신러닝">AI/머신러닝</option>
            <option value="로봇공학">로봇공학</option>
          </select>
        </div>

        <div>
          <label htmlFor="class_duration" className="block text-sm font-medium text-gray-700">
            수업 시간
          </label>
          <select
            id="class_duration"
            name="class_duration"
            value={formData.class_duration}
            onChange={handleChange}
            required
            className="input-field mt-1"
          >
            <option value={1}>1시간</option>
            <option value={1.5}>1시간 30분</option>
            <option value={2}>2시간</option>
          </select>
        </div>

        <div>
          <label htmlFor="parent_name" className="block text-sm font-medium text-gray-700">
            학부모 이름
          </label>
          <input
            type="text"
            id="parent_name"
            name="parent_name"
            value={formData.parent_name}
            onChange={handleChange}
            required
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="parent_phone" className="block text-sm font-medium text-gray-700">
            학부모 연락처
          </label>
          <input
            type="tel"
            id="parent_phone"
            name="parent_phone"
            value={formData.parent_phone}
            onChange={handleChange}
            required
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="payment_day" className="block text-sm font-medium text-gray-700">
            결제일
          </label>
          <input
            type="number"
            id="payment_day"
            name="payment_day"
            value={formData.payment_day}
            onChange={handleChange}
            min="1"
            max="31"
            required
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="payment_type" className="block text-sm font-medium text-gray-700">
            결제 기간
          </label>
          <select
            id="payment_type"
            name="payment_type"
            value={formData.payment_type}
            onChange={handleChange}
            required
            className="input-field mt-1"
          >
            <option value="monthly">1개월</option>
            <option value="quarterly">3개월 (11주)</option>
          </select>
        </div>

        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
            학년
          </label>
          <input
            type="text"
            id="grade"
            name="grade"
            value={formData.grade}
            onChange={handleChange}
            required
            className="input-field mt-1"
            placeholder="예: 초등 3학년, 중1"
          />
        </div>

        <div className="md:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              id="robotics_option"
              name="robotics_option"
              checked={formData.robotics_option}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="robotics_option" className="text-sm font-medium text-gray-700">
              로보틱스 수업 참여 (미선택 시 10% 할인)
            </label>
          </div>

          {formData.robotics_option && (
            <div className="mb-4">
              <label
                htmlFor="robotics_day"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                로보틱스 수업 요일
              </label>
              <select
                id="robotics_day"
                name="robotics_day"
                value={formData.robotics_day || ''}
                onChange={handleChange}
                required={formData.robotics_option}
                className="input-field"
              >
                <option value="">선택하세요</option>
                <option value="wed">수요일</option>
                <option value="sat">토요일</option>
              </select>
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            비고
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="input-field mt-1"
            placeholder="특이사항, 주의사항 등을 입력하세요"
          />
        </div>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          취소
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? '저장 중...' : student ? '수정' : '추가'}
        </button>
      </div>
    </form>
  )
}
