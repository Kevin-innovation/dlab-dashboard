import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { StudentService } from '../../services/studentService'
import { ScheduleService } from '../../services/scheduleService'
import { CreateStudentInput } from '../../types/student'

interface ParsedStudent {
  name: string
  subject: string
  day: string
  startTime: string
  endTime: string
  classType: '1:1' | 'group'
  duration: number
  errors?: string[]
}

interface BulkImportFormProps {
  onComplete: () => void
  onCancel: () => void
}

export function BulkImportForm({ onComplete, onCancel }: BulkImportFormProps) {
  const { teacher } = useAuth()
  const [textInput, setTextInput] = useState('')
  const [parsedData, setParsedData] = useState<ParsedStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'preview' | 'complete'>('input')

  const dayMap: { [key: string]: number } = {
    '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0
  }

  const parseTimeString = (timeStr: string): string => {
    // "14시", "15시 30분", "16시30분" 등을 "14:00", "15:30" 형태로 변환
    const match = timeStr.match(/(\d+)시(?:\s*(\d+)분)?/)
    if (match) {
      const hour = match[1].padStart(2, '0')
      const minute = (match[2] || '0').padStart(2, '0')
      return `${hour}:${minute}`
    }
    return timeStr
  }

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01 ${startTime}`)
    const end = new Date(`2000-01-01 ${endTime}`)
    const diffMs = end.getTime() - start.getTime()
    return diffMs / (1000 * 60 * 60) // 시간 단위로 변환
  }

  const parseTextData = () => {
    const lines = textInput.split('\n').filter(line => line.trim())
    const parsed: ParsedStudent[] = []
    let currentDay = ''

    for (const line of lines) {
      const trimmed = line.trim()
      
      // 요일 라인 감지 (화, 수, 목 등)
      if (/^[월화수목금토일]$/.test(trimmed)) {
        currentDay = trimmed
        continue
      }

      // 구분선 무시
      if (trimmed.startsWith('--')) {
        continue
      }

      // 학생 정보 라인 파싱
      const studentMatch = trimmed.match(/^-?\s*(.+?)\s*\((.+?)\)\s*(.+)$/)
      if (studentMatch && currentDay) {
        const [, nameAndExtra, subject, timeRange] = studentMatch
        
        // 이름에서 (1:1) 같은 정보 추출
        const nameMatch = nameAndExtra.match(/^(.+?)(?:\s*\((.+?)\))?$/)
        const name = nameMatch ? nameMatch[1].trim() : nameAndExtra.trim()
        const extraInfo = nameMatch && nameMatch[2] ? nameMatch[2].trim() : ''
        
        // 시간 범위 파싱 (14시~16시, 15시 30분 ~ 17시 등)
        const timeMatch = timeRange.match(/(.+?)\s*[~～]\s*(.+)/)
        if (timeMatch) {
          const [, startTimeStr, endTimeStr] = timeMatch
          const startTime = parseTimeString(startTimeStr.trim())
          const endTime = parseTimeString(endTimeStr.trim())
          const duration = calculateDuration(startTime, endTime)
          
          const student: ParsedStudent = {
            name,
            subject: subject.trim(),
            day: currentDay,
            startTime,
            endTime,
            classType: extraInfo === '1:1' ? '1:1' : 'group',
            duration,
            errors: []
          }

          // 유효성 검사
          if (!name) student.errors?.push('이름이 없습니다')
          if (!subject.trim()) student.errors?.push('과목이 없습니다')
          if (duration <= 0) student.errors?.push('시간 범위가 잘못되었습니다')

          parsed.push(student)
        }
      }
    }

    setParsedData(parsed)
    setStep('preview')
  }

  const executeImport = async () => {
    if (!teacher) {
      setError('로그인 정보를 확인할 수 없습니다.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const results = []
      
      for (const studentData of parsedData) {
        if (studentData.errors && studentData.errors.length > 0) {
          continue // 에러가 있는 데이터는 건너뛰기
        }

        // 학생 생성
        const studentInput: CreateStudentInput = {
          name: studentData.name,
          grade: '', // 기본값
          parent_name: '', // 기본값
          parent_phone: '', // 기본값
          notes: `일괄 입력 - ${studentData.day}요일 ${studentData.startTime}~${studentData.endTime}`,
          class_type: studentData.classType,
          subject: studentData.subject,
          class_duration: studentData.duration as 1 | 1.5 | 2,
          payment_day: 1,
          payment_type: 'monthly',
          robotics_option: false
        }

        const createdStudent = await StudentService.createStudent(teacher.id, studentInput)
        
        // 스케줄 생성 (학생의 클래스 ID 가져오기)
        const studentWithClass = await StudentService.getStudentById(createdStudent.id)
        const classId = studentWithClass?.student_classes?.[0]?.class_id

        if (classId) {
          await ScheduleService.createSchedule(teacher.id, {
            class_id: classId,
            day_of_week: dayMap[studentData.day],
            start_time: studentData.startTime,
            status: 'active'
          })
        }

        results.push({ success: true, name: studentData.name })
      }

      setStep('complete')
    } catch (error) {
      console.error('일괄 입력 오류:', error)
      setError('일괄 입력 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'complete') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900">일괄 입력 완료</h3>
          <p className="mt-1 text-sm text-gray-500">
            {parsedData.filter(s => !s.errors || s.errors.length === 0).length}명의 학생이 성공적으로 등록되었습니다.
          </p>
        </div>
        <div className="flex justify-center">
          <button onClick={onComplete} className="btn-primary">
            확인
          </button>
        </div>
      </div>
    )
  }

  if (step === 'preview') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            파싱 결과 미리보기 ({parsedData.length}명)
          </h3>
          <div className="max-h-96 overflow-y-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">과목</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">요일</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.map((student, index) => (
                  <tr key={index} className={student.errors && student.errors.length > 0 ? 'bg-red-50' : ''}>
                    <td className="px-3 py-2 text-sm text-gray-900">{student.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{student.subject}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{student.day}요일</td>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {student.startTime}~{student.endTime} ({student.duration}시간)
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">{student.classType}</td>
                    <td className="px-3 py-2 text-sm">
                      {student.errors && student.errors.length > 0 ? (
                        <span className="text-red-600">오류: {student.errors.join(', ')}</span>
                      ) : (
                        <span className="text-green-600">정상</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-between">
          <button onClick={() => setStep('input')} className="btn-secondary">
            뒤로가기
          </button>
          <button 
            onClick={executeImport} 
            disabled={loading || parsedData.every(s => s.errors && s.errors.length > 0)}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? '등록 중...' : `${parsedData.filter(s => !s.errors || s.errors.length === 0).length}명 등록하기`}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">학생 정보 일괄 입력</h3>
        <p className="text-sm text-gray-600 mb-4">
          아래 형식으로 학생 정보를 입력해주세요:
        </p>
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 mb-4">
          <pre>{`화
- 박요한(파이썬 기초) 14시~16시
- 비숍(스크래치) 15시 30분 ~ 17시 
- 김새론 (파이썬 교과융합) 18시 ~ 20시

수
- 재형 (1:1) (파이썬) 11시 ~ 13시
- 이재윤 (웹 기본1) 14시 ~ 16시`}</pre>
        </div>
      </div>

      <div>
        <label htmlFor="textInput" className="block text-sm font-medium text-gray-700 mb-2">
          학생 정보 텍스트
        </label>
        <textarea
          id="textInput"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="여기에 학생 정보를 붙여넣으세요..."
        />
      </div>

      <div className="flex justify-between">
        <button onClick={onCancel} className="btn-secondary">
          취소
        </button>
        <button 
          onClick={parseTextData}
          disabled={!textInput.trim()}
          className="btn-primary disabled:opacity-50"
        >
          데이터 파싱하기
        </button>
      </div>
    </div>
  )
}