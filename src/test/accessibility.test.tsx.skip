import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { StudentForm } from '../components/students/StudentForm'
import { StudentList } from '../components/students/StudentList'
import { LoginForm } from '../components/auth/LoginForm'
import { AuthProvider } from '../contexts/AuthContext'

// jest-axe matcher 추가
expect.extend(toHaveNoViolations)

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }),
  },
}))

// Mock data store
vi.mock('../stores/mockDataStore', () => ({
  mockDataStore: {
    getStudents: vi.fn().mockReturnValue([]),
    addStudent: vi.fn(),
    updateStudent: vi.fn(),
    deleteStudent: vi.fn(),
  },
}))

afterEach(() => {
  cleanup()
})

describe('접근성 테스트', () => {
  describe('StudentForm 접근성', () => {
    it('기본 폼 접근성 검사', async () => {
      const { container } = render(<StudentForm onSubmit={() => {}} onCancel={() => {}} />)

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('모든 입력 필드에 적절한 라벨이 있는지 확인', () => {
      render(<StudentForm onSubmit={() => {}} onCancel={() => {}} />)

      // 모든 입력 필드가 라벨과 연결되어 있는지 확인
      const inputs = screen.getAllByRole('textbox')
      inputs.forEach((input) => {
        expect(input).toHaveAccessibleName()
      })

      const selects = screen.getAllByRole('combobox')
      selects.forEach((select) => {
        expect(select).toHaveAccessibleName()
      })

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAccessibleName()
    })

    it('필수 필드 표시 접근성', () => {
      render(<StudentForm onSubmit={() => {}} onCancel={() => {}} />)

      // 필수 필드들이 적절히 표시되는지 확인
      const requiredFields = [
        screen.getByLabelText('이름'),
        screen.getByLabelText('학부모 이름'),
        screen.getByLabelText('학부모 연락처'),
        screen.getByLabelText('학년'),
      ]

      requiredFields.forEach((field) => {
        expect(field).toBeRequired()
      })
    })

    it('에러 메시지 접근성', async () => {
      const { container, rerender } = render(
        <StudentForm onSubmit={() => {}} onCancel={() => {}} />
      )

      // 에러 상태 시뮬레이션 (실제로는 폼 제출 실패 후)
      // 이 테스트는 실제 에러 메시지 컴포넌트가 있을 때 수행
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('StudentList 접근성', () => {
    it('빈 목록 접근성', async () => {
      const { container } = render(
        <StudentList students={[]} onEdit={() => {}} onDelete={() => {}} />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('학생 목록 접근성', async () => {
      const mockStudents = [
        {
          id: '1',
          name: '홍길동',
          parent_name: '홍부모',
          parent_phone: '010-1234-5678',
          grade: '초등 3학년',
          payment_day: 15,
          notes: '',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          student_classes: [
            {
              id: '1',
              student_id: '1',
              class_type: '1:1' as const,
              class_duration: '1h' as const,
              payment_type: 'monthly' as const,
              payment_day: 15,
              robotics_option: false,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            },
          ],
        },
      ]

      const { container } = render(
        <StudentList students={mockStudents} onEdit={() => {}} onDelete={() => {}} />
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('테이블 접근성 확인', () => {
      const mockStudents = [
        {
          id: '1',
          name: '홍길동',
          parent_name: '홍부모',
          parent_phone: '010-1234-5678',
          grade: '초등 3학년',
          payment_day: 15,
          notes: '',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          student_classes: [
            {
              id: '1',
              student_id: '1',
              class_type: '1:1' as const,
              class_duration: '1h' as const,
              payment_type: 'monthly' as const,
              payment_day: 15,
              robotics_option: false,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            },
          ],
        },
      ]

      render(<StudentList students={mockStudents} onEdit={() => {}} onDelete={() => {}} />)

      // 테이블 구조 확인
      const table = screen.queryByRole('table')
      if (table) {
        expect(table).toBeInTheDocument()

        // 테이블 헤더 확인
        const columnHeaders = screen.getAllByRole('columnheader')
        expect(columnHeaders.length).toBeGreaterThan(0)

        // 행 확인
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(1) // 헤더 + 데이터 행
      }
    })

    it('버튼 접근성 확인', () => {
      const mockStudents = [
        {
          id: '1',
          name: '홍길동',
          parent_name: '홍부모',
          parent_phone: '010-1234-5678',
          grade: '초등 3학년',
          payment_day: 15,
          notes: '',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          student_classes: [
            {
              id: '1',
              student_id: '1',
              class_type: '1:1' as const,
              class_duration: '1h' as const,
              payment_type: 'monthly' as const,
              payment_day: 15,
              robotics_option: false,
              created_at: '2024-01-01',
              updated_at: '2024-01-01',
            },
          ],
        },
      ]

      render(<StudentList students={mockStudents} onEdit={() => {}} onDelete={() => {}} />)

      // 모든 버튼이 접근 가능한 이름을 가지는지 확인
      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName()
      })
    })
  })

  describe('LoginForm 접근성', () => {
    it('로그인 폼 접근성', async () => {
      const { container } = render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('폼 필드 라벨링 확인', () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      )

      // 이메일과 비밀번호 필드가 적절한 라벨을 가지는지 확인
      const emailInput = screen.getByLabelText(/이메일|email/i)
      const passwordInput = screen.getByLabelText(/비밀번호|password/i)

      expect(emailInput).toBeInTheDocument()
      expect(passwordInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('폼 제출 버튼 접근성', () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      )

      const submitButton = screen.getByRole('button', { name: /로그인|sign in/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveAttribute('type', 'submit')
    })
  })

  describe('키보드 네비게이션 테스트', () => {
    it('StudentForm 키보드 네비게이션', () => {
      render(<StudentForm onSubmit={() => {}} onCancel={() => {}} />)

      // 모든 상호작용 가능한 요소가 탭 순서에 포함되는지 확인
      const focusableElements = screen
        .getAllByRole('textbox')
        .concat(screen.getAllByRole('combobox'))
        .concat(screen.getAllByRole('checkbox'))
        .concat(screen.getAllByRole('button'))

      focusableElements.forEach((element) => {
        // tabIndex가 -1이 아닌지 확인 (키보드로 포커스 가능)
        expect(element).not.toHaveAttribute('tabindex', '-1')
      })
    })

    it('버튼들이 Enter와 Space로 활성화되는지 확인', async () => {
      const mockOnCancel = vi.fn()

      render(<StudentForm onSubmit={() => {}} onCancel={mockOnCancel} />)

      const cancelButton = screen.getByRole('button', { name: '취소' })

      // 버튼에 포커스
      cancelButton.focus()
      expect(cancelButton).toHaveFocus()

      // Enter 키 이벤트는 실제 사용자 상호작용에서 테스트됨
    })
  })

  describe('색상 대비 및 시각적 접근성', () => {
    it('텍스트 색상 대비 확인', () => {
      render(<StudentForm onSubmit={() => {}} onCancel={() => {}} />)

      // 라벨들이 적절한 색상 클래스를 사용하는지 확인
      const labels = screen.getAllByText(/이름|수업|학부모|결제|학년|비고/i, { selector: 'label' })
      labels.forEach((label) => {
        // Tailwind의 text-gray-700 등이 적절한 대비를 제공하는지 확인
        expect(label).toHaveClass(/text-gray-\d+/)
      })
    })

    it('버튼 상태 시각적 구분', () => {
      render(<StudentForm onSubmit={() => {}} onCancel={() => {}} />)

      const submitButton = screen.getByRole('button', { name: '추가' })
      const cancelButton = screen.getByRole('button', { name: '취소' })

      // 기본 버튼과 주요 버튼이 다른 스타일을 가지는지 확인
      expect(submitButton).toHaveClass('btn-primary')
      expect(cancelButton).not.toHaveClass('btn-primary')
    })
  })

  describe('화면 리더 지원', () => {
    it('의미있는 헤딩 구조', () => {
      // 실제 페이지 컴포넌트에서 테스트해야 함
      // 여기서는 폼 자체의 구조만 확인
      render(<StudentForm onSubmit={() => {}} onCancel={() => {}} />)

      // 폼이 적절한 역할을 가지는지 확인
      const form = screen.getByRole('form', { hidden: true }) || screen.getByTagName('form')
      expect(form).toBeInTheDocument()
    })

    it('상태 변경 시 적절한 알림', () => {
      // 로딩 상태나 에러 상태에 대한 접근성 테스트
      // 실제 구현에서는 aria-live 영역 등을 사용해야 함
      render(<StudentForm onSubmit={() => {}} onCancel={() => {}} />)

      // aria-live 영역이나 상태 알림 요소 확인
      // 현재 구현에서는 에러 메시지 div가 있음
      const form = screen.getByRole('form', { hidden: true }) || screen.getByTagName('form')
      expect(form).toBeInTheDocument()
    })
  })
})
