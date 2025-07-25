import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { WeeklySchedule } from '../../components/schedule/WeeklySchedule'
import { ClassForm } from '../../components/schedule/ClassForm'
import { AttendanceForm } from '../../components/schedule/AttendanceForm'
import { ScheduleWithClass } from '../../services/scheduleService'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

export function SchedulePage() {
  const navigate = useNavigate()
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
    // 수업에 등록된 첫 번째 학생 선택하여 피드백 탭으로 이동
    if (scheduleData.students && scheduleData.students.length > 0) {
      const firstStudent = scheduleData.students[0]
      navigate(`/feedback?studentId=${firstStudent.id}`)
    } else {
      // 학생이 없는 경우 기존 출석 관리 모드로 처리
      setSelectedSchedule(scheduleData)
      setShowAttendanceForm(true)
      setShowClassForm(false)
    }
  }

  const handleScheduleEdit = (scheduleData: ScheduleWithClass) => {
    setSelectedSchedule(scheduleData)
    setShowClassForm(true)
    setShowAttendanceForm(false)
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

  const handleAttendanceUpdated = (studentId: string, newWeek: number) => {
    console.log(`학생 ${studentId}의 출석 진행률이 ${newWeek}주로 업데이트됨`)
    // 필요한 경우 추가 UI 업데이트 로직을 여기에 구현
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
            onAttendanceUpdated={handleAttendanceUpdated}
          />
        </div>
      ) : (
        <WeeklySchedule 
          ref={weeklyScheduleRef} 
          onScheduleClick={handleScheduleClick}
          onScheduleEdit={handleScheduleEdit}
        />
      )}
    </div>
  )
}
