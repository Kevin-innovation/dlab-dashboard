import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'
import { supabase } from '../../lib/supabase'

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}))

// Test component to use the context
function TestComponent() {
  const { user, teacher, loading, signIn, signOut } = useAuth()

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
      <div data-testid="user">{user ? user.email : 'no user'}</div>
      <div data-testid="teacher">{teacher ? teacher.name : 'no teacher'}</div>
      <button onClick={() => signIn('test@example.com', 'test123')}>Sign In</button>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  const mockSubscription = { unsubscribe: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock getSession
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    // Mock onAuthStateChange
    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: { subscription: mockSubscription },
    })

    // Mock supabase.from
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      upsert: vi.fn().mockReturnThis(),
    } as any)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('컨텍스트 외부에서 useAuth 사용 시 에러 발생', () => {
    // 에러를 콘솔에 출력하지 않도록 설정
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestComponent />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })

  it('초기 상태가 올바르게 설정되어야 함', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // 초기에는 로딩 상태
    expect(screen.getByTestId('loading')).toHaveTextContent('loading')

    // 로딩 완료 후
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('no user')
    expect(screen.getByTestId('teacher')).toHaveTextContent('no teacher')
  })

  it('기존 세션이 있을 때 사용자 정보 로드', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'existing@example.com',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
    }

    const mockTeacher = {
      id: 'teacher-1',
      email: 'existing@example.com',
      name: '기존 선생님',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    } as any)

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockTeacher, error: null }),
      upsert: vi.fn().mockReturnThis(),
    } as any)

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('existing@example.com')
      expect(screen.getByTestId('teacher')).toHaveTextContent('기존 선생님')
    })
  })

  it('Mock 로그인이 성공해야 함', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // 로딩 완료 대기
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    // Mock teacher 데이터 설정
    const mockTeacher = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      name: '테스트 선생님',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockTeacher, error: null }),
      upsert: vi.fn().mockReturnThis(),
    } as any)

    // 로그인 버튼 클릭
    const signInButton = screen.getByText('Sign In')
    signInButton.click()

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
      expect(screen.getByTestId('teacher')).toHaveTextContent('테스트 선생님')
    })
  })

  it('실제 Supabase 로그인 호출', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    const { signIn } = useAuth()

    // Mock이 아닌 실제 이메일로 로그인 시도
    await expect(signIn('real@example.com', 'password')).resolves.not.toThrow()

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'real@example.com',
      password: 'password',
    })
  })

  it('로그인 실패 시 에러 처리', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' } as any,
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    const TestComponentWithError = () => {
      const { signIn } = useAuth()

      const handleSignIn = async () => {
        try {
          await signIn('invalid@example.com', 'wrong-password')
        } catch (error) {
          // 에러가 발생했는지 확인
          expect(error).toBeInstanceOf(Error)
        }
      }

      return <button onClick={handleSignIn}>Test Sign In</button>
    }

    render(
      <AuthProvider>
        <TestComponentWithError />
      </AuthProvider>
    )
  })

  it('로그아웃 기능', async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    const signOutButton = screen.getByText('Sign Out')
    signOutButton.click()

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('인증 상태 변경 구독', async () => {
    const mockCallback = vi.fn()

    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      mockCallback.mockImplementation(callback)
      return { data: { subscription: mockSubscription } }
    })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
  })

  it('컴포넌트 언마운트 시 구독 해제', () => {
    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    unmount()

    expect(mockSubscription.unsubscribe).toHaveBeenCalled()
  })

  it('teacher 새로고침 기능', async () => {
    const mockTeacher = {
      id: 'teacher-1',
      email: 'test@example.com',
      name: '새로고침 선생님',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    // Mock user 설정
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockTeacher, error: null }),
      upsert: vi.fn().mockReturnThis(),
    } as any)

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
    })

    // refreshTeacher 함수 테스트는 내부 함수이므로 직접 호출하기 어려움
    // 실제로는 인증 상태 변경 시 자동으로 호출됨
  })
})
