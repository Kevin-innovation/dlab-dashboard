import { FeedbackHistory } from '../types/feedback'

export class FeedbackHistoryService {
  private static STORAGE_KEY = 'feedback_history'
  private static MAX_HISTORY_SIZE = 100

  /**
   * 피드백 히스토리 저장
   */
  static saveFeedback(
    studentName: string,
    className: string,
    feedbackContent: string,
    templateUsed?: string,
    tokenUsage?: number
  ): void {
    const newFeedback: FeedbackHistory = {
      id: this.generateId(),
      student_name: studentName,
      class_name: className,
      feedback_content: feedbackContent,
      created_at: new Date().toISOString(),
      template_used: templateUsed,
      token_usage: tokenUsage
    }

    const history = this.getHistory()
    history.unshift(newFeedback) // 최신 항목을 맨 앞에 추가

    // 최대 개수 제한
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.splice(this.MAX_HISTORY_SIZE)
    }

    this.saveToStorage(history)
  }

  /**
   * 피드백 히스토리 조회
   */
  static getHistory(): FeedbackHistory[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []
      
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('피드백 히스토리 로드 오류:', error)
      return []
    }
  }

  /**
   * 특정 학생의 피드백 히스토리 조회
   */
  static getHistoryByStudent(studentName: string): FeedbackHistory[] {
    return this.getHistory().filter(item => item.student_name === studentName)
  }

  /**
   * 특정 기간의 피드백 히스토리 조회
   */
  static getHistoryByDateRange(startDate: string, endDate: string): FeedbackHistory[] {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return this.getHistory().filter(item => {
      const itemDate = new Date(item.created_at)
      return itemDate >= start && itemDate <= end
    })
  }

  /**
   * 피드백 삭제
   */
  static deleteFeedback(id: string): void {
    const history = this.getHistory().filter(item => item.id !== id)
    this.saveToStorage(history)
  }

  /**
   * 모든 히스토리 삭제
   */
  static clearHistory(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  /**
   * 히스토리 통계 조회
   */
  static getStatistics(): {
    total_feedbacks: number
    total_tokens: number
    estimated_cost: number
    most_active_student: string | null
    average_feedback_length: number
  } {
    const history = this.getHistory()
    
    if (history.length === 0) {
      return {
        total_feedbacks: 0,
        total_tokens: 0,
        estimated_cost: 0,
        most_active_student: null,
        average_feedback_length: 0
      }
    }

    // 총 토큰 수 계산
    const totalTokens = history.reduce((sum, item) => sum + (item.token_usage || 0), 0)
    
    // 예상 비용 계산 (동적 모델별 계산)
    const estimatedCost = totalTokens > 0 ? 
      (import.meta.env.VITE_OPENAI_MODEL === 'gpt-4o-mini' ? 
        (totalTokens / 1000) * 0.0003 : // GPT-4o mini
        (totalTokens / 1000) * 0.002    // GPT-3.5-turbo
      ) : 0

    // 가장 활발한 학생 찾기
    const studentCounts: Record<string, number> = {}
    history.forEach(item => {
      studentCounts[item.student_name] = (studentCounts[item.student_name] || 0) + 1
    })
    
    const mostActiveStudent = Object.entries(studentCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null

    // 평균 피드백 길이
    const totalLength = history.reduce((sum, item) => sum + item.feedback_content.length, 0)
    const averageLength = Math.round(totalLength / history.length)

    return {
      total_feedbacks: history.length,
      total_tokens: totalTokens,
      estimated_cost: estimatedCost,
      most_active_student: mostActiveStudent,
      average_feedback_length: averageLength
    }
  }

  /**
   * 히스토리 내보내기 (JSON)
   */
  static exportHistory(): string {
    const history = this.getHistory()
    return JSON.stringify(history, null, 2)
  }

  /**
   * 히스토리 가져오기 (JSON)
   */
  static importHistory(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData)
      if (!Array.isArray(imported)) {
        throw new Error('유효하지 않은 데이터 형식입니다.')
      }

      // 데이터 유효성 검사
      const validData = imported.filter(item => 
        item && 
        typeof item.id === 'string' &&
        typeof item.student_name === 'string' &&
        typeof item.feedback_content === 'string' &&
        typeof item.created_at === 'string'
      )

      this.saveToStorage(validData)
      return true
    } catch (error) {
      console.error('히스토리 가져오기 오류:', error)
      return false
    }
  }

  // Private methods
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private static saveToStorage(history: FeedbackHistory[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('피드백 히스토리 저장 오류:', error)
    }
  }
}