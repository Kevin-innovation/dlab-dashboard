import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  CalendarIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'yellow' | 'purple'
}

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  }

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <Icon className="h-8 w-8" />
      </div>
    </div>
  )
}

interface ScheduleItemProps {
  day: string
  dayNumber: number
  hasClass: boolean
  classCount?: number
}

function ScheduleItem({ day, dayNumber, hasClass, classCount }: ScheduleItemProps) {
  const today = new Date().getDay()
  const isToday = dayNumber === today

  return (
    <div className={`text-center p-2 rounded-lg ${
      isToday 
        ? 'bg-blue-100 border-2 border-blue-300' 
        : 'bg-white border border-gray-200'
    }`}>
      <div className="text-xs text-gray-500 mb-1">{day}</div>
      <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
        hasClass 
          ? 'bg-green-500 text-white' 
          : 'bg-gray-200 text-gray-400'
      }`}>
        {hasClass ? classCount || '●' : '○'}
      </div>
    </div>
  )
}

interface ActivityItemProps {
  action: string
  time: string
  status: 'success' | 'info' | 'warning'
}

function ActivityItem({ action, time, status }: ActivityItemProps) {
  const statusColors = {
    success: 'text-green-600',
    info: 'text-blue-600',
    warning: 'text-yellow-600',
  }

  return (
    <div className="flex items-start space-x-3 py-2">
      <CheckCircleIcon className={`h-5 w-5 ${statusColors[status]} mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{action}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { teacher } = useAuth()
  const navigate = useNavigate()

  const weekDays = [
    { day: '월', dayNumber: 1, hasClass: true, classCount: 3 },
    { day: '화', dayNumber: 2, hasClass: true, classCount: 2 },
    { day: '수', dayNumber: 3, hasClass: false },
    { day: '목', dayNumber: 4, hasClass: true, classCount: 4 },
    { day: '금', dayNumber: 5, hasClass: false },
    { day: '토', dayNumber: 6, hasClass: true, classCount: 2 },
    { day: '일', dayNumber: 0, hasClass: false },
  ]

  const recentActivities = [
    { action: '김철수 학생 출석 체크 완료', time: '2시간 전', status: 'success' as const },
    { action: '이영희 학생 피드백 작성', time: '4시간 전', status: 'info' as const },
    { action: '박민수 학생 보강 수업 예약', time: '1일 전', status: 'warning' as const },
    { action: '정수진 학생 수업료 결제 확인', time: '1일 전', status: 'success' as const },
    { action: '최동훈 학생 출결 상태 업데이트', time: '2일 전', status: 'info' as const },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* 환영 메시지 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          안녕하세요, {teacher?.name || '선생님'}!
        </h1>
        <p className="text-gray-600">
          오늘도 학생들과 함께하는 즐거운 하루 되세요.
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="오늘 수업"
          value="6"
          subtitle="1:1 수업 4개, 그룹 수업 2개"
          icon={CalendarIcon}
          color="blue"
        />
        <StatCard
          title="전체 학생 수"
          value="24"
          subtitle="1:1: 12명, 그룹: 12명"
          icon={UserGroupIcon}
          color="green"
        />
        <StatCard
          title="이번 달 수업료"
          value="2,400,000원"
          subtitle="수납률 95%"
          icon={CurrencyDollarIcon}
          color="yellow"
        />
        <StatCard
          title="이번 주 수업 시간"
          value="32시간"
          subtitle="목표 대비 106%"
          icon={ClockIcon}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 주간 일정 */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">주간 수업 일정</h2>
            <AcademicCapIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((item, index) => (
              <ScheduleItem
                key={index}
                day={item.day}
                dayNumber={item.dayNumber}
                hasClass={item.hasClass}
                classCount={item.classCount}
              />
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-500 text-center">
            ● 수업 있음 | ○ 수업 없음 | 파란색 테두리: 오늘
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
          <div className="space-y-1">
            {recentActivities.map((activity, index) => (
              <ActivityItem
                key={index}
                action={activity.action}
                time={activity.time}
                status={activity.status}
              />
            ))}
          </div>
          <div className="mt-4">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              모든 활동 보기 →
            </button>
          </div>
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/students')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <UserGroupIcon className="h-6 w-6 text-blue-600 mb-2" />
            <div className="text-sm font-medium text-gray-900">새 학생 등록</div>
          </button>
          <button 
            onClick={() => navigate('/schedule')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <CalendarIcon className="h-6 w-6 text-green-600 mb-2" />
            <div className="text-sm font-medium text-gray-900">출석 체크</div>
          </button>
          <button 
            onClick={() => navigate('/feedback')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <AcademicCapIcon className="h-6 w-6 text-purple-600 mb-2" />
            <div className="text-sm font-medium text-gray-900">피드백 작성</div>
          </button>
          <button 
            onClick={() => navigate('/payments')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
          >
            <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 mb-2" />
            <div className="text-sm font-medium text-gray-900">수업료 관리</div>
          </button>
        </div>
      </div>
    </div>
  )
}