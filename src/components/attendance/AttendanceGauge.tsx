import React, { useState } from 'react'
import {
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import {
  AttendanceGaugeProps,
  AttendanceAction,
  COURSE_CONFIGS
} from '../../types/attendance'
import { AttendanceProgressService } from '../../services/attendanceProgressService'

interface AttendanceGaugeState {
  loading: boolean
  error: string | null
}

export function AttendanceGauge({
  studentId,
  studentName,
  currentWeek,
  totalWeeks,
  courseType,
  onUpdate,
  className = ''
}: AttendanceGaugeProps) {
  const [state, setState] = useState<AttendanceGaugeState>({
    loading: false,
    error: null
  })

  const config = COURSE_CONFIGS[courseType]
  const progressPercentage = totalWeeks > 0 ? (currentWeek / totalWeeks) * 100 : 0
  const feedbackLinePosition = totalWeeks > 0 ? (config.feedbackWeek / totalWeeks) * 100 : 0
  const isNearFeedback = currentWeek >= config.feedbackWeek
  const isComplete = currentWeek >= totalWeeks

  // 게이지 색상 결정
  const getGaugeColor = () => {
    if (isComplete) return 'bg-green-500'
    if (isNearFeedback) return 'bg-orange-500'
    if (progressPercentage >= 75) return 'bg-blue-500'
    if (progressPercentage >= 50) return 'bg-blue-400'
    return 'bg-blue-300'
  }

  // 상태 텍스트
  const getStatusText = () => {
    if (isComplete) return '과정 완료 ✅'
    if (isNearFeedback) return '피드백 시기 📝'
    if (totalWeeks - currentWeek <= 1) return '거의 완료 🔥'
    return `${currentWeek}/${totalWeeks}주 진행중`
  }

  // 액션 핸들러
  const handleAction = async (action: AttendanceAction) => {
    if (state.loading) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await AttendanceProgressService.updateProgress(studentId, action)
      
      if (response.success && response.data) {
        onUpdate?.(response.data.current_week)
      } else {
        throw new Error(response.error || '출석 처리에 실패했습니다.')
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 진행률 바 */}
      <div className="relative">
        {/* 배경 바 */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          {/* 진행률 */}
          <div
            className={`h-full transition-all duration-500 ease-out ${getGaugeColor()}`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
          
          {/* 피드백 라인 */}
          {config.feedbackWeek < totalWeeks && (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-orange-400 shadow-lg"
              style={{ left: `${feedbackLinePosition}%` }}
              title={`${config.feedbackWeek}주차: 피드백 시기`}
            />
          )}
        </div>

        {/* 주차 표시 */}
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {getStatusText()}
          </span>
          <span className="text-xs font-medium text-gray-700">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>

      {/* 제어 버튼들 */}
      <div className="flex space-x-2">
        {/* 출석 버튼 */}
        <button
          onClick={() => handleAction('increment')}
          disabled={state.loading || isComplete}
          className={`
            flex items-center space-x-1 px-2 py-1 text-xs rounded-md font-medium
            transition-colors duration-200
            ${isComplete
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300'
            }
            ${state.loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={isComplete ? '이미 과정이 완료되었습니다' : '출석 처리 (+1주)'}
        >
          <PlusIcon className="h-3 w-3" />
          <span>출석</span>
        </button>

        {/* 되돌리기 버튼 */}
        <button
          onClick={() => handleAction('decrement')}
          disabled={state.loading || currentWeek === 0}
          className={`
            flex items-center space-x-1 px-2 py-1 text-xs rounded-md font-medium
            transition-colors duration-200
            ${currentWeek === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 active:bg-yellow-300'
            }
            ${state.loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={currentWeek === 0 ? '더 이상 되돌릴 수 없습니다' : '되돌리기 (-1주)'}
        >
          <MinusIcon className="h-3 w-3" />
          <span>되돌리기</span>
        </button>

        {/* 초기화 버튼 */}
        <button
          onClick={() => {
            if (window.confirm(`${studentName} 학생의 출석 진행률을 초기화하시겠습니까?`)) {
              handleAction('reset')
            }
          }}
          disabled={state.loading || currentWeek === 0}
          className={`
            flex items-center space-x-1 px-2 py-1 text-xs rounded-md font-medium
            transition-colors duration-200
            ${currentWeek === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300'
            }
            ${state.loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          title={currentWeek === 0 ? '이미 초기 상태입니다' : '진행률 초기화 (0주로 리셋)'}
        >
          <ArrowPathIcon className="h-3 w-3" />
          <span>초기화</span>
        </button>
      </div>

      {/* 로딩 상태 */}
      {state.loading && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
          <span>처리 중...</span>
        </div>
      )}

      {/* 에러 표시 */}
      {state.error && (
        <div className="flex items-center space-x-2 text-xs text-red-600 bg-red-50 rounded p-2">
          <ExclamationTriangleIcon className="h-3 w-3 flex-shrink-0" />
          <span>{state.error}</span>
          <button
            onClick={() => setState(prev => ({ ...prev, error: null }))}
            className="text-red-400 hover:text-red-600 ml-auto"
          >
            ✕
          </button>
        </div>
      )}

      {/* 피드백 알림 */}
      {isNearFeedback && !isComplete && (
        <div className="flex items-center space-x-2 text-xs text-orange-700 bg-orange-50 rounded p-2">
          <ExclamationTriangleIcon className="h-3 w-3 flex-shrink-0" />
          <span>
            {currentWeek === config.feedbackWeek 
              ? '피드백 작성 시기입니다!' 
              : '피드백 시기가 지났습니다. 피드백을 확인해보세요.'
            }
          </span>
        </div>
      )}

      {/* 완료 축하 메시지 */}
      {isComplete && (
        <div className="flex items-center space-x-2 text-xs text-green-700 bg-green-50 rounded p-2">
          <span>🎉</span>
          <span>{studentName} 학생이 {config.label}을 완주했습니다!</span>
        </div>
      )}
    </div>
  )
}