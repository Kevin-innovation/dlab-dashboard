import { BellIcon, Bars3Icon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, teacher, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('로그아웃 오류:', error)
    }
  }

  return (
    <header className="bg-white h-16 px-4 border-b border-gray-200">
      <div className="h-full flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-3">
            <img src="/logo.png" alt="D.LAB CODING 로고" className="h-8 w-auto" />
            <span className="text-xl font-bold text-gray-900">수성캠퍼스</span>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-sm font-medium text-gray-900">{teacher?.name || '선생님'}</span>
            <span className="text-xs text-gray-500">{user?.email}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <span className="sr-only">알림</span>
            <BellIcon className="h-6 w-6" />
          </button>

          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-gray-700 hover:text-gray-800 px-3 py-1 rounded-md hover:bg-gray-100"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  )
}
