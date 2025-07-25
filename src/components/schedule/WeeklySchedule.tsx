import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  DAY_OF_WEEK_LABELS,
  CLASS_STATUS_COLORS,
  CLASS_STATUS_LABELS,
  ClassStatus,
} from '../../types/class'
import { useAuth } from '../../contexts/AuthContext'
import { ScheduleService, ScheduleWithClass } from '../../services/scheduleService'

interface WeeklyScheduleProps {
  onScheduleClick: (scheduleData: ScheduleWithClass) => void
  onScheduleEdit?: (scheduleData: ScheduleWithClass) => void
}

export const WeeklySchedule = forwardRef<{ fetchSchedules: () => void }, WeeklyScheduleProps>(
  ({ onScheduleClick, onScheduleEdit }, ref) => {
    const [schedules, setSchedules] = useState<ScheduleWithClass[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { teacher } = useAuth()

    useImperativeHandle(ref, () => ({
      fetchSchedules
    }))

    useEffect(() => {
      if (teacher?.id) {
        fetchSchedules()
      }
    }, [teacher])

    async function fetchSchedules() {
    if (!teacher) return

    try {
      setLoading(true)
      setError(null)

      const schedulesData = await ScheduleService.getSchedulesByTeacher(teacher.id)
      console.log('실제 DB에서 스케줄 데이터 로드됨:', schedulesData)
      setSchedules(schedulesData)
    } catch (err) {
      console.error('스케줄 로드 오류:', err)
      setError(
        err instanceof Error
          ? `수업 일정을 불러오는데 실패했습니다: ${err.message}`
          : '수업 일정을 불러오는데 실패했습니다.'
      )
    } finally {
      setLoading(false)
    }
  }

  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 9 // 9시부터 22시까지
    return `${hour.toString().padStart(2, '0')}:00`
  })

  const getSchedulesForDayAndTime = (day: number, time: string) => {
    return schedules.filter((s) => {
      const scheduleHour = parseInt(s.start_time.split(':')[0])
      return s.day_of_week === day && scheduleHour === parseInt(time.split(':')[0])
    })
  }

  if (loading) return <div className="text-center">로딩 중...</div>
  if (error)
    return (
      <div className="text-red-500 p-4 rounded-md bg-red-50 mb-4">
        <p className="font-bold">오류 발생</p>
        <p>{error}</p>
      </div>
    )

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 bg-gray-50">시간</th>
            {DAY_OF_WEEK_LABELS.map((day, index) => (
              <th key={index} className="border p-2 bg-gray-50 min-w-[150px]">
                {day}요일
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((time) => (
            <tr key={time}>
              <td className="border p-2 text-center bg-gray-50">{time}</td>
              {DAY_OF_WEEK_LABELS.map((_, dayIndex) => {
                const daySchedules = getSchedulesForDayAndTime(dayIndex, time)
                return (
                  <td key={dayIndex} className="border p-2">
                    {daySchedules
                      .filter(scheduleData => scheduleData.students && scheduleData.students.length > 0)
                      .map((scheduleData) => (
                      <div
                        key={scheduleData.id}
                        className={`mb-1 p-3 rounded cursor-pointer transition-colors hover:opacity-80 ${CLASS_STATUS_COLORS[scheduleData.status as ClassStatus]}`}
                        onClick={() => onScheduleClick(scheduleData)}
                      >
                        {/* 학생 이름 (맨 위, 큰 글씨) */}
                        {scheduleData.students && scheduleData.students.length > 0 && (
                          <div className="font-bold text-base mb-1">
                            {scheduleData.students.map(s => s.name).join(', ')}
                          </div>
                        )}
                        
                        {/* 수업 과목 (아래, 작은 글씨) */}
                        <div className="text-sm opacity-90">
                          {scheduleData.classes?.subject || scheduleData.classes?.type || '수업'}
                        </div>
                        
                        {/* 수업 유형 및 시간 */}
                        <div className="text-xs opacity-75 mt-1">
                          {scheduleData.classes?.type} | {scheduleData.classes?.duration}
                        </div>
                        
                        {/* 상태 표시 또는 수정 버튼 */}
                        {scheduleData.status === 'active' && onScheduleEdit ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onScheduleEdit(scheduleData)
                            }}
                            className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded mt-1 transition-colors"
                          >
                            수정
                          </button>
                        ) : (
                          <div className="text-xs opacity-75">
                            {CLASS_STATUS_LABELS[scheduleData.status as ClassStatus]}
                          </div>
                        )}
                      </div>
                    ))}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})
