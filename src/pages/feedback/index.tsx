import { useState, useEffect } from 'react'
import {
  ChatBubbleLeftRightIcon,
  CogIcon,
  DocumentTextIcon,
  ClockIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  BookmarkIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { GPTService } from '../../services/gptService'
import { FeedbackHistoryService } from '../../services/feedbackHistoryService'
import {
  DEFAULT_TEMPLATES,
  FeedbackFormData,
  FeedbackTemplate,
  GPTFeedbackResponse,
  FeedbackHistory,
} from '../../types/feedback'
import { StudentWithClass } from '../../types/student'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

interface APIKeySettingsProps {
  isOpen: boolean
  onClose: () => void
  onSave: (apiKey: string) => void
  currentApiKey: string
}

function APIKeySettings({ isOpen, onClose, onSave, currentApiKey }: APIKeySettingsProps) {
  const [apiKey, setApiKey] = useState(currentApiKey)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<'valid' | 'invalid' | null>(null)

  const handleSave = async () => {
    if (!apiKey.trim()) {
      alert('API 키를 입력해주세요.')
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const isValid = await GPTService.validateApiKey(apiKey.trim())
      setValidationResult(isValid ? 'valid' : 'invalid')

      if (isValid) {
        onSave(apiKey.trim())
        setTimeout(() => {
          onClose()
          setValidationResult(null)
        }, 1000)
      }
    } catch (error) {
      setValidationResult('invalid')
    } finally {
      setIsValidating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">OpenAI API 키 설정</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API 키</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="input-field w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              OpenAI 웹사이트에서 발급받은 API 키를 입력하세요.
            </p>
          </div>

          {validationResult && (
            <div
              className={`p-3 rounded-md ${
                validationResult === 'valid'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {validationResult === 'valid'
                ? '✅ 유효한 API 키입니다.'
                : '❌ 유효하지 않은 API 키입니다.'}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button onClick={onClose} className="btn-secondary flex-1" disabled={isValidating}>
              취소
            </button>
            <button onClick={handleSave} className="btn-primary flex-1" disabled={isValidating}>
              {isValidating ? '검증 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  const { teacher } = useAuth()
  const [students, setStudents] = useState<StudentWithClass[]>([])
  const [loading, setLoading] = useState(true)

  const [templates] = useState<FeedbackTemplate[]>(
    DEFAULT_TEMPLATES.map((template, index) => ({
      ...template,
      id: (index + 1).toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
  )

  const [formData, setFormData] = useState<FeedbackFormData>({
    student_id: '',
    class_id: '',
    lesson_content: '',
    student_performance: '',
    attendance_notes: '',
    homework_status: '',
    template_id: '',
    custom_format: '',
  })

  const [generatedFeedback, setGeneratedFeedback] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiResponse, setApiResponse] = useState<GPTFeedbackResponse | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [showApiSettings, setShowApiSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [savedCustomFormats, setSavedCustomFormats] = useState<string[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [currentDate] = useState(new Date().toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  }))

  useEffect(() => {
    // 로컬 스토리지에서 API 키 로드
    const savedApiKey = localStorage.getItem('openai_api_key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
      GPTService.setApiKey(savedApiKey)
    }

    // 저장된 커스텀 형식 로드
    const savedFormats = localStorage.getItem('custom_formats')
    if (savedFormats) {
      setSavedCustomFormats(JSON.parse(savedFormats))
    }

    // 피드백 히스토리 로드
    setFeedbackHistory(FeedbackHistoryService.getHistory())

    // 학생 데이터 로드
    if (teacher) {
      fetchStudents()
    }
  }, [teacher])

  async function fetchStudents() {
    try {
      setLoading(true)

      if (!teacher) {
        throw new Error('로그인 정보를 확인할 수 없습니다.')
      }

      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          student_classes (
            *,
            classes (
              name,
              type,
              duration
            )
          )
        `)
        .eq('teacher_id', teacher.id)
        .order('name')

      if (error) throw error

      setStudents((data as any) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '학생 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleApiKeySave = (newApiKey: string) => {
    setApiKey(newApiKey)
    GPTService.setApiKey(newApiKey)
    localStorage.setItem('openai_api_key', newApiKey)
  }

  const saveCustomFormat = () => {
    const customFormat = formData.custom_format || ''
    if (!customFormat.trim()) {
      alert('저장할 커스텀 형식을 입력해주세요.')
      return
    }
    setShowSaveDialog(true)
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      alert('템플릿 이름을 입력해주세요.')
      return
    }

    const customFormat = formData.custom_format || ''
    const newTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      content: customFormat.trim(),
      created_at: new Date().toISOString()
    }

    // 로컬스토리지에서 기존 템플릿들 가져오기
    const savedTemplates = JSON.parse(localStorage.getItem('custom_templates') || '[]')
    
    // 이름 중복 확인
    if (savedTemplates.find((t: any) => t.name === templateName.trim())) {
      alert('이미 존재하는 템플릿 이름입니다.')
      return
    }

    // 새 템플릿 추가
    savedTemplates.unshift(newTemplate)
    if (savedTemplates.length > 20) savedTemplates.pop() // 최대 20개

    localStorage.setItem('custom_templates', JSON.stringify(savedTemplates))
    
    // 간단한 형식 목록도 업데이트 (하위 호환성)
    const simpleFormats = savedTemplates.map((t: any) => t.content)
    setSavedCustomFormats(simpleFormats)
    
    setShowSaveDialog(false)
    setTemplateName('')
    alert('커스텀 템플릿이 저장되었습니다.')
  }

  const loadCustomFormat = (format: string) => {
    setFormData({ ...formData, custom_format: format })
  }

  const deleteCustomFormat = (index: number) => {
    const updatedFormats = savedCustomFormats.filter((_, i) => i !== index)
    setSavedCustomFormats(updatedFormats)
    localStorage.setItem('custom_formats', JSON.stringify(updatedFormats))
  }

  const selectedStudent = students.find((s) => s.id === formData.student_id)
  const selectedTemplate = templates.find((t) => t.id === formData.template_id)

  const handleGenerateFeedback = async () => {
    if (!GPTService.hasApiKey()) {
      setShowApiSettings(true)
      return
    }

    if (!formData.student_id || !formData.lesson_content || !formData.student_performance) {
      setError('학생, 수업 내용, 학생 상황을 모두 입력해주세요.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const request = {
        student_name: selectedStudent?.name || '',
        class_name: selectedStudent?.student_classes?.[0]?.classes?.name || '',
        lesson_content: formData.lesson_content,
        student_performance: formData.student_performance,
        custom_format: formData.custom_format,
        current_date: currentDate,
      }

      const response: GPTFeedbackResponse = await GPTService.generateFeedback(request)
      setGeneratedFeedback(response.feedback)
      setApiResponse(response)

      // 히스토리에 저장
      FeedbackHistoryService.saveFeedback(
        selectedStudent!.name,
        selectedStudent!.student_classes?.[0]?.classes?.name || '',
        response.feedback,
        selectedTemplate?.name,
        response.token_usage.total_tokens
      )

      // 히스토리 업데이트
      setFeedbackHistory(FeedbackHistoryService.getHistory())
    } catch (err) {
      setError(err instanceof Error ? err.message : '피드백 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseTemplate = () => {
    if (selectedTemplate && selectedStudent) {
      const variables = {
        student_name: selectedStudent.name,
        class_name: selectedStudent.student_classes?.[0]?.classes?.name || '',
        lesson_content: formData.lesson_content,
        student_performance: formData.student_performance,
        attendance_notes: formData.attendance_notes || '특이사항 없음',
        homework_status: formData.homework_status || '숙제 완료',
      }

      const filledTemplate = GPTService.replaceTemplateVariables(
        selectedTemplate.content,
        variables
      )
      setGeneratedFeedback(filledTemplate)

      // 템플릿 사용도 히스토리에 저장
      FeedbackHistoryService.saveFeedback(
        selectedStudent.name,
        selectedStudent.student_classes?.[0]?.classes?.name || '',
        filledTemplate,
        selectedTemplate.name
      )

      setFeedbackHistory(FeedbackHistoryService.getHistory())
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedFeedback)
    alert('피드백이 클립보드에 복사되었습니다.')
  }

  if (loading) return <div className="text-center py-8">로딩 중...</div>

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">피드백 시스템</h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setShowHistory(false)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                !showHistory
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              피드백 생성
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                showHistory
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              히스토리
            </button>
          </div>
          <button
            onClick={() => setShowApiSettings(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <CogIcon className="h-4 w-4" />
            <span>API 설정</span>
          </button>
        </div>
      </div>

      {/* 피드백 히스토리 또는 생성 폼 */}
      {showHistory ? (
        <div className="space-y-6">
          {/* 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(() => {
              const stats = FeedbackHistoryService.getStatistics()
              return (
                <>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">총 피드백</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {stats.total_feedbacks}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-green-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">사용 토큰</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {stats.total_tokens.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <BookmarkIcon className="h-8 w-8 text-purple-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">예상 비용</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          ${stats.estimated_cost.toFixed(3)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow">
                    <div className="flex items-center">
                      <DocumentTextIcon className="h-8 w-8 text-orange-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">평균 길이</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {stats.average_feedback_length}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>

          {/* 히스토리 목록 */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">피드백 히스토리</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    const data = FeedbackHistoryService.exportHistory()
                    const blob = new Blob([data], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `feedback_history_${new Date().toISOString().split('T')[0]}.json`
                    a.click()
                  }}
                  className="btn-secondary text-sm"
                >
                  내보내기
                </button>
                <button
                  onClick={() => {
                    if (confirm('모든 히스토리를 삭제하시겠습니까?')) {
                      FeedbackHistoryService.clearHistory()
                      setFeedbackHistory([])
                    }
                  }}
                  className="btn-secondary text-sm text-red-600"
                >
                  전체 삭제
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {feedbackHistory.length > 0 ? (
                feedbackHistory.map((item) => (
                  <div key={item.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900">{item.student_name}</h3>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{item.class_name}</span>
                        {item.template_used && (
                          <>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {item.template_used}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3" />
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                        <button
                          onClick={() => {
                            FeedbackHistoryService.deleteFeedback(item.id)
                            setFeedbackHistory(FeedbackHistoryService.getHistory())
                          }}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                      <div className="line-clamp-3">{item.feedback_content}</div>
                      <button
                        onClick={() => {
                          setGeneratedFeedback(item.feedback_content)
                          setShowHistory(false)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs mt-2"
                      >
                        다시 사용하기
                      </button>
                    </div>
                    {item.token_usage && (
                      <div className="mt-2 text-xs text-gray-500">
                        토큰: {item.token_usage} • 예상 비용: $
                        {GPTService.estimateCost(item.token_usage).toFixed(4)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>아직 생성된 피드백이 없습니다.</p>
                  <p className="text-sm mt-1">피드백을 생성하면 여기에 기록됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 피드백 생성 폼 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
              피드백 생성
            </h2>

            <div className="space-y-4">
              {/* 학생 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">학생 선택</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="input-field w-full"
                >
                  <option value="">학생을 선택하세요</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.student_classes?.[0]?.classes?.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 수업 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  오늘 수업 내용
                </label>
                <textarea
                  value={formData.lesson_content}
                  onChange={(e) => setFormData({ ...formData, lesson_content: e.target.value })}
                  placeholder="오늘 진행한 수업 내용을 입력하세요..."
                  rows={3}
                  className="input-field w-full"
                />
              </div>

              {/* 학생 상황 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학생 학습 상황
                </label>
                <textarea
                  value={formData.student_performance}
                  onChange={(e) =>
                    setFormData({ ...formData, student_performance: e.target.value })
                  }
                  placeholder="학생의 학습 태도, 이해도, 참여도 등을 입력하세요..."
                  rows={3}
                  className="input-field w-full"
                />
              </div>

              {/* 추가 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    출석/특이사항
                  </label>
                  <input
                    type="text"
                    value={formData.attendance_notes}
                    onChange={(e) => setFormData({ ...formData, attendance_notes: e.target.value })}
                    placeholder="지각, 조퇴, 특이사항 등"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">숙제 현황</label>
                  <input
                    type="text"
                    value={formData.homework_status}
                    onChange={(e) => setFormData({ ...formData, homework_status: e.target.value })}
                    placeholder="숙제 완료 여부"
                    className="input-field w-full"
                  />
                </div>
              </div>

              {/* 템플릿 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  피드백 템플릿
                </label>
                <div className="flex space-x-2">
                  <select
                    value={formData.template_id}
                    onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                    className="input-field flex-1"
                  >
                    <option value="">템플릿 선택 (선택사항)</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleUseTemplate}
                    disabled={!selectedTemplate || !selectedStudent}
                    className="btn-secondary px-4"
                  >
                    적용
                  </button>
                </div>
                {selectedTemplate && (
                  <p className="text-xs text-gray-500 mt-1">{selectedTemplate.description}</p>
                )}
              </div>

              {/* 오늘 날짜 표시 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-blue-700">
                  <ClockIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">오늘 날짜: {currentDate}</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">피드백 생성시 오늘 날짜가 자동으로 반영됩니다.</p>
              </div>

              {/* 커스텀 형식 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    커스텀 형식 (선택사항)
                  </label>
                  <button
                    onClick={saveCustomFormat}
                    disabled={!(formData.custom_format || '').trim()}
                    className="text-xs btn-secondary px-2 py-1"
                  >
                    저장
                  </button>
                </div>
                <textarea
                  value={formData.custom_format}
                  onChange={(e) => setFormData({ ...formData, custom_format: e.target.value })}
                  placeholder="원하는 피드백 형식이나 포함할 내용을 입력하세요..."
                  rows={3}
                  className="input-field w-full"
                />
                
                {/* 저장된 커스텀 형식 목록 */}
                {savedCustomFormats.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-2">저장된 형식:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {savedCustomFormats.map((format, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                          <button
                            onClick={() => loadCustomFormat(format)}
                            className="text-left text-xs text-gray-700 hover:text-blue-600 flex-1 truncate"
                            title={format}
                          >
                            {format.length > 50 ? format.substring(0, 50) + '...' : format}
                          </button>
                          <button
                            onClick={() => deleteCustomFormat(index)}
                            className="text-red-500 hover:text-red-700 text-xs ml-2"
                          >
                            삭제
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 생성 버튼 */}
              <button
                onClick={handleGenerateFeedback}
                disabled={isGenerating || !GPTService.hasApiKey()}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>생성 중...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4" />
                    <span>AI 피드백 생성</span>
                  </>
                )}
              </button>

              {!GPTService.hasApiKey() && (
                <div className="flex items-center space-x-2 text-amber-600 text-sm">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>OpenAI API 키를 설정해주세요. (.env.local 파일 또는 API 설정)</span>
                </div>
              )}

              {/* 환경변수 API 키 사용 여부 표시 */}
              {import.meta.env.VITE_OPENAI_API_KEY && (
                <div className="flex items-center space-x-2 text-green-600 text-sm bg-green-50 p-2 rounded">
                  <span>
                    ✅ 환경변수에서 API 키 로드됨 (모델:{' '}
                    {import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'})
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 생성된 피드백 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-green-600" />
              생성된 피드백
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {generatedFeedback ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                    {generatedFeedback}
                  </pre>
                </div>

                {apiResponse && (
                  <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded p-2">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="h-3 w-3" />
                        <span>{apiResponse.processing_time}ms</span>
                      </div>
                      <div>토큰: {apiResponse.token_usage.total_tokens}</div>
                      <div>
                        예상 비용: $
                        {GPTService.estimateCost(apiResponse.token_usage.total_tokens).toFixed(4)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button onClick={copyToClipboard} className="btn-secondary flex-1">
                    클립보드 복사
                  </button>
                  <button onClick={() => setGeneratedFeedback('')} className="btn-secondary">
                    초기화
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>AI가 생성한 피드백이 여기에 표시됩니다.</p>
                <p className="text-sm mt-1">
                  학생 정보와 수업 내용을 입력한 후 생성 버튼을 클릭하세요.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API 키 설정 모달 */}
      <APIKeySettings
        isOpen={showApiSettings}
        onClose={() => setShowApiSettings(false)}
        onSave={handleApiKeySave}
        currentApiKey={apiKey}
      />

      {/* 템플릿 저장 다이얼로그 */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">커스텀 템플릿 저장</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 이름</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="예: 주간 피드백 템플릿"
                  className="input-field w-full"
                  maxLength={50}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button 
                  onClick={() => {
                    setShowSaveDialog(false)
                    setTemplateName('')
                  }} 
                  className="btn-secondary flex-1"
                >
                  취소
                </button>
                <button onClick={handleSaveTemplate} className="btn-primary flex-1">
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
