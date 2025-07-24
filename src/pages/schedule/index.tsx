import { useState, useRef } from 'react'
import { WeeklySchedule } from '../../components/schedule/WeeklySchedule'
import { ClassForm } from '../../components/schedule/ClassForm'
import { AttendanceForm } from '../../components/schedule/AttendanceForm'
import { ScheduleWithClass } from '../../services/scheduleService'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export function SchedulePage() {
  const [showClassForm, setShowClassForm] = useState(false)
  const [showAttendanceForm, setShowAttendanceForm] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithClass | undefined>()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const weeklyScheduleRef = useRef<{ fetchSchedules: () => void }>(null)

  const handleAddSchedule = () => {
    setSelectedSchedule(undefined)
    setShowClassForm(true)
    setShowAttendanceForm(false)
  }

  const handleScheduleClick = (scheduleData: ScheduleWithClass) => {
    setSelectedSchedule(scheduleData)
    setShowAttendanceForm(true)
    setShowClassForm(false)
  }

  const handleClassFormSubmit = () => {
    setShowClassForm(false)
    setSelectedSchedule(undefined)
    // 스케줄 목록 새로고침
    if (weeklyScheduleRef.current) {
      weeklyScheduleRef.current.fetchSchedules()
    }
  }

  const handleClassFormCancel = () => {
    setShowClassForm(false)
    setSelectedSchedule(undefined)
  }

  const handleAttendanceFormSubmit = () => {
    setShowAttendanceForm(false)
    setSelectedSchedule(undefined)
    // 스케줄 목록 새로고침
    if (weeklyScheduleRef.current) {
      weeklyScheduleRef.current.fetchSchedules()
    }
  }

  const handleAttendanceFormCancel = () => {
    setShowAttendanceForm(false)
    setSelectedSchedule(undefined)
  }

  const handleBackToSchedule = () => {
    setShowClassForm(false)
    setShowAttendanceForm(false)
    setSelectedSchedule(undefined)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">수업 일정</h2>
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field"
          />
          <button onClick={handleAddSchedule} className="btn-primary">
            새 수업 일정 추가
          </button>
        </div>
      </div>

      {showClassForm ? (
        <div className="card">
          <div className="flex items-center mb-6">
            <button
              onClick={handleBackToSchedule}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              뒤로가기
            </button>
            <h3 className="text-xl font-bold">
              {selectedSchedule ? '수업 일정 수정' : '새 수업 일정 추가'}
            </h3>
          </div>
          <ClassForm
            scheduleData={selectedSchedule}
            onSubmit={handleClassFormSubmit}
            onCancel={handleClassFormCancel}
          />
        </div>
      ) : showAttendanceForm && selectedSchedule ? (
        <div className="card">
          <div className="flex items-center mb-6">
            <button
              onClick={handleBackToSchedule}
              className="flex items-center text-gray-600 hover:text-gray-800 mr-4"
            >
              <ChevronLeftIcon className="h-5 w-5 mr-1" />
              뒤로가기
            </button>
            <h3 className="text-xl font-bold">출석 관리</h3>
          </div>
          <AttendanceForm
            scheduleData={selectedSchedule}
            date={selectedDate}
            onSubmit={handleAttendanceFormSubmit}
            onCancel={handleAttendanceFormCancel}
          />
        </div>
      ) : (
        <WeeklySchedule ref={weeklyScheduleRef} onScheduleClick={handleScheduleClick} />
      )}
    </div>
  )
}
