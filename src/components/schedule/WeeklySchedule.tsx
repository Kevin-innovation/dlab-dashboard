import { useState, useEffect } from 'react'
import { ScheduleWithDetails, DAY_OF_WEEK_LABELS, CLASS_STATUS_COLORS, CLASS_STATUS_LABELS } from '../../types/class'
import { Student } from '../../types/student'
import { useAuth } from '../../contexts/AuthContext'
import { mockDataStore } from '../../stores/mockDataStore'

interface WeeklyScheduleProps {
  onScheduleClick: (scheduleData: ScheduleWithDetails) => void
}

export function WeeklySchedule({ onScheduleClick }: WeeklyScheduleProps) {
  const [schedules, setSchedules] = useState<ScheduleWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { teacher } = useAuth()

  useEffect(() => {
    if (teacher?.id) {
      fetchSchedules()
    }
  }, [teacher])

  async function fetchSchedules() {
    try {
      setLoading(true)
      
      // Mock 데이터 스토어에서 스케줄 가져오기
      mockDataStore.initialize()
      const mockSchedules = mockDataStore.getSchedules()
      
      // ScheduleWithDetails 형식으로 변환
      const scheduleData: ScheduleWithDetails[] = mockSchedules.map(schedule => ({
        ...schedule,
        classes: schedule.class_info ? {
          id: schedule.class_info.id,
          name: schedule.class_info.name,
          type: schedule.class_info.type,
          subject: schedule.class_info.subject,
          duration: schedule.class_info.duration,
          created_at: schedule.class_info.created_at,
          updated_at: schedule.class_info.updated_at
        } : undefined,
        teachers: {
          id: teacher!.id,
          name: teacher!.name,
          email: teacher!.email,
          created_at: teacher!.created_at,
          updated_at: teacher!.updated_at
        },
        attendance: []
      }))
      
      console.log('Mock 스케줄 데이터 로드됨:', scheduleData)
      setSchedules(scheduleData)
      
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
    return schedules.filter(s => {
      const scheduleHour = parseInt(s.start_time.split(':')[0])
      return s.day_of_week === day && scheduleHour === parseInt(time.split(':')[0])
    })
  }

  if (loading) return <div className="text-center">로딩 중...</div>
  if (error) return (
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
          {timeSlots.map(time => (
            <tr key={time}>
              <td className="border p-2 text-center bg-gray-50">{time}</td>
              {DAY_OF_WEEK_LABELS.map((_, dayIndex) => {
                const daySchedules = getSchedulesForDayAndTime(dayIndex, time)
                return (
                  <td key={dayIndex} className="border p-2">
                    {daySchedules.map(scheduleData => (
                      <div
                        key={scheduleData.id}
                        className={`mb-1 p-2 rounded cursor-pointer transition-colors hover:opacity-80 ${CLASS_STATUS_COLORS[scheduleData.status]}`}
                        onClick={() => onScheduleClick(scheduleData)}
                      >
                        <div className="font-bold text-sm">
                          {scheduleData.classes?.name || '수업'}
                        </div>
                        <div className="text-xs opacity-90">
                          {scheduleData.classes?.type} | {scheduleData.classes?.duration}
                        </div>
                        <div className="text-xs opacity-75">
                          {CLASS_STATUS_LABELS[scheduleData.status]}
                        </div>
                        {scheduleData.attendance && scheduleData.attendance.length > 0 && (
                          <div className="text-xs mt-1 opacity-75">
                            출석: {scheduleData.attendance.filter(a => a.status === 'present').length}명
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
} 