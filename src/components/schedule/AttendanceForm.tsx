import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Class } from '../../types/class'
import { Attendance, CreateAttendanceInput, ATTENDANCE_STATUS_LABELS } from '../../types/class'

interface AttendanceFormProps {
  classData: Class
  date: string
  onSubmit: () => void
  onCancel: () => void
}

export function AttendanceForm({ classData, date, onSubmit, onCancel }: AttendanceFormProps) {
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [formData, setFormData] = useState<CreateAttendanceInput>({
    class_id: classData.id,
    student_id: classData.student_id,
    date: date,
    status: 'present',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAttendance()
  }, [classData.id, date])

  async function fetchAttendance() {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', classData.id)
        .eq('date', date)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
      
      if (data) {
        setAttendance(data)
        setFormData({
          class_id: data.class_id,
          student_id: data.student_id,
          date: data.date,
          status: data.status,
          makeup_class_id: data.makeup_class_id,
          notes: data.notes ?? ''
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '출석 정보를 불러오는데 실패했습니다.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (attendance?.id) {
        // 수정
        const { error } = await supabase
          .from('attendance')
          .update(formData)
          .eq('id', attendance.id)
        
        if (error) throw error
      } else {
        // 추가
        const { error } = await supabase
          .from('attendance')
          .insert([formData])
        
        if (error) throw error
      }

      onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : '출석 정보 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">출석 상태</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="input-field mt-1"
          >
            {Object.entries(ATTENDANCE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">비고</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="input-field mt-1"
            placeholder="특이사항이 있다면 입력해주세요."
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? '저장 중...' : (attendance ? '수정' : '추가')}
        </button>
      </div>
    </form>
  )
} 