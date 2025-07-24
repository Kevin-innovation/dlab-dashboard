interface AttendanceProgressBarProps {
  current: number
  total: number
  percentage: number
  isFeedbackPeriod: boolean
  feedbackThreshold: number
  isComplete: boolean
  paymentType: 'monthly' | 'quarterly'
  onAttendanceCheck: () => void
  onUndoAttendance: () => void
  onResetAttendance: () => void
}

export function AttendanceProgressBar({
  current,
  total,
  percentage,
  isFeedbackPeriod,
  feedbackThreshold,
  isComplete,
  paymentType,
  onAttendanceCheck,
  onUndoAttendance,
  onResetAttendance
}: AttendanceProgressBarProps) {
  // 피드백 라인 위치 계산
  const feedbackLinePosition = (feedbackThreshold / total) * 100

  const getStatusColor = () => {
    if (isComplete) return 'bg-green-500'
    if (isFeedbackPeriod) return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  const getStatusText = () => {
    if (isComplete) return '수업 완료'
    if (isFeedbackPeriod) return '피드백 기간'
    return '진행중'
  }

  const getStatusTextColor = () => {
    if (isComplete) return 'text-green-600'
    if (isFeedbackPeriod) return 'text-yellow-600'
    return 'text-blue-600'
  }

  return (
    <div className="mt-3 space-y-2">
      {/* 상태 및 출석 체크 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${getStatusTextColor()}`}>
            {getStatusText()}
          </span>
          <span className="text-xs text-gray-500">
            {current}/{total}회 ({percentage.toFixed(0)}%)
          </span>
          <span className="text-xs text-gray-400">
            ({paymentType === 'monthly' ? '월납' : '분기납'})
          </span>
        </div>
        <div className="flex space-x-1">
          {!isComplete && (
            <button
              onClick={onAttendanceCheck}
              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
            >
              출석 체크
            </button>
          )}
          {current > 0 && (
            <button
              onClick={onUndoAttendance}
              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors"
            >
              되돌리기
            </button>
          )}
          {current > 0 && (
            <button
              onClick={() => {
                if (window.confirm('출석을 초기화하시겠습니까?')) {
                  onResetAttendance()
                }
              }}
              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="relative">
        {/* 배경 바 */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          {/* 진행률 바 */}
          <div 
            className={`h-full transition-all duration-500 ease-out ${getStatusColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        {/* 피드백 기간 표시선 (빨간 선) */}
        {!isComplete && (
          <div 
            className="absolute top-0 w-0.5 h-3 bg-red-500"
            style={{ left: `${feedbackLinePosition}%` }}
            title="피드백 기간 시작점"
          />
        )}

        {/* 단계별 마커 */}
        <div className="flex justify-between mt-1">
          {Array.from({ length: total }, (_, i) => {
            const week = i + 1
            return (
              <div key={week} className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full border-2 ${
                  week <= current 
                    ? (isComplete ? 'bg-green-500 border-green-500' : 
                       isFeedbackPeriod ? 'bg-yellow-500 border-yellow-500' : 
                       'bg-blue-500 border-blue-500')
                    : 'bg-white border-gray-300'
                }`} />
                {(week === feedbackThreshold || week === total) && (
                  <span className="text-xs text-gray-400 mt-1">
                    {week === feedbackThreshold ? '피드백' : '완료'}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 피드백 기간 알림 */}
      {isFeedbackPeriod && !isComplete && (
        <div className="flex items-center space-x-1 text-xs text-yellow-700 bg-yellow-50 p-2 rounded-md">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>수업 종료 1주일 전입니다. 피드백 준비 시기입니다.</span>
        </div>
      )}

      {/* 완료 알림 */}
      {isComplete && (
        <div className="flex items-center space-x-1 text-xs text-green-700 bg-green-50 p-2 rounded-md">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>수업이 완료되었습니다. 다음 결제 주기를 확인해주세요.</span>
        </div>
      )}
    </div>
  )
}