import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentForm } from '../students/StudentForm'
import { mockDataStore } from '../../stores/mockDataStore'

// Mock 데이터 스토어
vi.mock('../../stores/mockDataStore', () => ({
  mockDataStore: {
    addStudent: vi.fn(),
  },
}))

describe('StudentForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderStudentForm = (student?: any) => {
    return render(<StudentForm student={student} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)
  }

  describe('폼 렌더링', () => {
    it('기본 폼 요소들이 렌더링되어야 함', () => {
      renderStudentForm()

      expect(screen.getByLabelText('이름')).toBeInTheDocument()
      expect(screen.getByLabelText('수업 유형')).toBeInTheDocument()
      expect(screen.getByLabelText('수업 과목')).toBeInTheDocument()
      expect(screen.getByLabelText('수업 시간')).toBeInTheDocument()
      expect(screen.getByLabelText('학부모 이름')).toBeInTheDocument()
      expect(screen.getByLabelText('학부모 연락처')).toBeInTheDocument()
      expect(screen.getByLabelText('결제일')).toBeInTheDocument()
      expect(screen.getByLabelText('결제 기간')).toBeInTheDocument()
      expect(screen.getByLabelText('학년')).toBeInTheDocument()
      expect(screen.getByLabelText('로보틱스 수업 참여 (미선택 시 10% 할인)')).toBeInTheDocument()
      expect(screen.getByLabelText('비고')).toBeInTheDocument()
    })

    it('취소 및 추가 버튼이 렌더링되어야 함', () => {
      renderStudentForm()

      expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '추가' })).toBeInTheDocument()
    })

    it('기존 학생 수정 시 수정 버튼이 렌더링되어야 함', () => {
      const mockStudent = {
        id: '1',
        name: '기존 학생',
        parent_name: '부모',
        parent_phone: '010-1234-5678',
        grade: '초등 3학년',
        notes: '비고',
      }

      renderStudentForm(mockStudent)

      expect(screen.getByRole('button', { name: '수정' })).toBeInTheDocument()
      expect(screen.getByDisplayValue('기존 학생')).toBeInTheDocument()
    })
  })

  describe('폼 입력', () => {
    it('텍스트 입력 필드가 올바르게 작동해야 함', async () => {
      const user = userEvent.setup()
      renderStudentForm()

      const nameInput = screen.getByLabelText('이름')
      await user.type(nameInput, '홍길동')

      expect(nameInput).toHaveValue('홍길동')
    })

    it('셀렉트 박스가 올바르게 작동해야 함', async () => {
      const user = userEvent.setup()
      renderStudentForm()

      const classTypeSelect = screen.getByLabelText('수업 유형')
      await user.selectOptions(classTypeSelect, 'group')

      expect(classTypeSelect).toHaveValue('group')
    })

    it('숫자 입력 필드가 올바르게 작동해야 함', async () => {
      const user = userEvent.setup()
      renderStudentForm()

      const paymentDayInput = screen.getByLabelText('결제일')
      await user.clear(paymentDayInput)
      await user.type(paymentDayInput, '15')

      expect(paymentDayInput).toHaveValue(15)
    })

    it('체크박스가 올바르게 작동해야 함', async () => {
      const user = userEvent.setup()
      renderStudentForm()

      const roboticsCheckbox = screen.getByLabelText('로보틱스 수업 참여 (미선택 시 10% 할인)')
      await user.click(roboticsCheckbox)

      expect(roboticsCheckbox).toBeChecked()
    })

    it('텍스트영역이 올바르게 작동해야 함', async () => {
      const user = userEvent.setup()
      renderStudentForm()

      const notesTextarea = screen.getByLabelText('비고')
      await user.type(notesTextarea, '특별한 주의사항')

      expect(notesTextarea).toHaveValue('특별한 주의사항')
    })
  })

  describe('로보틱스 옵션', () => {
    it('로보틱스 체크 시 요일 선택이 나타나야 함', async () => {
      const user = userEvent.setup()
      renderStudentForm()

      const roboticsCheckbox = screen.getByLabelText('로보틱스 수업 참여 (미선택 시 10% 할인)')
      await user.click(roboticsCheckbox)

      expect(screen.getByLabelText('로보틱스 수업 요일')).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '수요일' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: '토요일' })).toBeInTheDocument()
    })

    it('로보틱스 체크 해제 시 요일 선택이 사라져야 함', async () => {
      const user = userEvent.setup()
      renderStudentForm()

      const roboticsCheckbox = screen.getByLabelText('로보틱스 수업 참여 (미선택 시 10% 할인)')

      // 체크
      await user.click(roboticsCheckbox)
      expect(screen.getByLabelText('로보틱스 수업 요일')).toBeInTheDocument()

      // 해제
      await user.click(roboticsCheckbox)
      expect(screen.queryByLabelText('로보틱스 수업 요일')).not.toBeInTheDocument()
    })
  })

  describe('폼 제출', () => {
    it('필수 필드 입력 후 제출이 성공해야 함', async () => {
      const user = userEvent.setup()
      const mockStudent = { id: '1', name: '테스트 학생' }
      vi.mocked(mockDataStore.addStudent).mockReturnValue(mockStudent)

      renderStudentForm()

      // 필수 필드 입력
      await user.type(screen.getByLabelText('이름'), '홍길동')
      await user.type(screen.getByLabelText('학부모 이름'), '홍부모')
      await user.type(screen.getByLabelText('학부모 연락처'), '010-1234-5678')
      await user.type(screen.getByLabelText('학년'), '초등 3학년')

      const submitButton = screen.getByRole('button', { name: '추가' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockDataStore.addStudent).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '홍길동',
            parent_name: '홍부모',
            parent_phone: '010-1234-5678',
            grade: '초등 3학년',
          })
        )
        expect(mockOnSubmit).toHaveBeenCalled()
      })
    })

    it('로보틱스 옵션 포함하여 제출이 성공해야 함', async () => {
      const user = userEvent.setup()
      const mockStudent = { id: '1', name: '테스트 학생' }
      vi.mocked(mockDataStore.addStudent).mockReturnValue(mockStudent)

      renderStudentForm()

      // 필수 필드 입력
      await user.type(screen.getByLabelText('이름'), '홍길동')
      await user.type(screen.getByLabelText('학부모 이름'), '홍부모')
      await user.type(screen.getByLabelText('학부모 연락처'), '010-1234-5678')
      await user.type(screen.getByLabelText('학년'), '초등 3학년')

      // 로보틱스 옵션 선택
      const roboticsCheckbox = screen.getByLabelText('로보틱스 수업 참여 (미선택 시 10% 할인)')
      await user.click(roboticsCheckbox)

      const roboticsDaySelect = screen.getByLabelText('로보틱스 수업 요일')
      await user.selectOptions(roboticsDaySelect, 'wed')

      const submitButton = screen.getByRole('button', { name: '추가' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockDataStore.addStudent).toHaveBeenCalledWith(
          expect.objectContaining({
            robotics_option: true,
            robotics_day: 'wed',
          })
        )
      })
    })

    it('제출 중 로딩 상태가 표시되어야 함', async () => {
      const user = userEvent.setup()

      // 긴 시간이 걸리는 Promise를 반환하도록 설정
      vi.mocked(mockDataStore.addStudent).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ id: '1', name: 'test' }), 100))
      )

      renderStudentForm()

      // 필수 필드 입력
      await user.type(screen.getByLabelText('이름'), '홍길동')
      await user.type(screen.getByLabelText('학부모 이름'), '홍부모')
      await user.type(screen.getByLabelText('학부모 연락처'), '010-1234-5678')
      await user.type(screen.getByLabelText('학년'), '초등 3학년')

      const submitButton = screen.getByRole('button', { name: '추가' })
      await user.click(submitButton)

      expect(screen.getByRole('button', { name: '저장 중...' })).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })

    it('제출 실패 시 에러 메시지가 표시되어야 함', async () => {
      const user = userEvent.setup()
      const errorMessage = '저장에 실패했습니다'
      vi.mocked(mockDataStore.addStudent).mockImplementation(() => {
        throw new Error(errorMessage)
      })

      renderStudentForm()

      // 필수 필드 입력
      await user.type(screen.getByLabelText('이름'), '홍길동')
      await user.type(screen.getByLabelText('학부모 이름'), '홍부모')
      await user.type(screen.getByLabelText('학부모 연락처'), '010-1234-5678')
      await user.type(screen.getByLabelText('학년'), '초등 3학년')

      const submitButton = screen.getByRole('button', { name: '추가' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })
  })

  describe('취소 기능', () => {
    it('취소 버튼 클릭 시 onCancel이 호출되어야 함', async () => {
      const user = userEvent.setup()
      renderStudentForm()

      const cancelButton = screen.getByRole('button', { name: '취소' })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('접근성', () => {
    it('모든 입력 필드에 적절한 라벨이 있어야 함', () => {
      renderStudentForm()

      const nameInput = screen.getByLabelText('이름')
      const classTypeSelect = screen.getByLabelText('수업 유형')
      const parentNameInput = screen.getByLabelText('학부모 이름')

      expect(nameInput).toHaveAttribute('id')
      expect(classTypeSelect).toHaveAttribute('id')
      expect(parentNameInput).toHaveAttribute('id')
    })

    it('필수 필드에 required 속성이 있어야 함', () => {
      renderStudentForm()

      expect(screen.getByLabelText('이름')).toBeRequired()
      expect(screen.getByLabelText('학부모 이름')).toBeRequired()
      expect(screen.getByLabelText('학부모 연락처')).toBeRequired()
      expect(screen.getByLabelText('학년')).toBeRequired()
    })
  })
})
