import { useState } from 'react'
import { WeeklySchedule } from '../../components/schedule/WeeklySchedule'
import { ClassForm } from '../../components/schedule/ClassForm'
import { AttendanceForm } from '../../components/schedule/AttendanceForm'
import { ScheduleWithDetails } from '../../types/class'

export function SchedulePage() {
  const [showClassForm, setShowClassForm] = useState(false)
  const [showAttendanceForm, setShowAttendanceForm] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleWithDetails | undefined>()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const handleAddSchedule = () => {
    setSelectedSchedule(undefined)
    setShowClassForm(true)
    setShowAttendanceForm(false)
  }

  const handleScheduleClick = (scheduleData: ScheduleWithDetails) => {
    setSelectedSchedule(scheduleData)
    setShowAttendanceForm(true)
    setShowClassForm(false)
  }

  const handleClassFormSubmit = () => {
    setShowClassForm(false)
    setSelectedSchedule(undefined)
  }

  const handleClassFormCancel = () => {
    setShowClassForm(false)
    setSelectedSchedule(undefined)
  }

  const handleAttendanceFormSubmit = () => {
    setShowAttendanceForm(false)
    setSelectedSchedule(undefined)
  }

  const handleAttendanceFormCancel = () => {
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
          <button
            onClick={handleAddSchedule}
            className="btn-primary"
          >
            새 수업 일정 추가
          </button>
        </div>
      </div>

      {showClassForm ? (
        <div className="card">
          <h3 className="text-xl font-bold mb-6">
            {selectedSchedule ? '수업 일정 수정' : '새 수업 일정 추가'}
          </h3>
          <ClassForm
            scheduleData={selectedSchedule}
            onSubmit={handleClassFormSubmit}
            onCancel={handleClassFormCancel}
          />
        </div>
      ) : showAttendanceForm && selectedSchedule ? (
        <div className="card">
          <h3 className="text-xl font-bold mb-6">출석 관리</h3>
          <AttendanceForm
            scheduleData={selectedSchedule}
            date={selectedDate}
            onSubmit={handleAttendanceFormSubmit}
            onCancel={handleAttendanceFormCancel}
          />
        </div>
      ) : (
        <WeeklySchedule onScheduleClick={handleScheduleClick} />
      )}
    </div>
  )
} 