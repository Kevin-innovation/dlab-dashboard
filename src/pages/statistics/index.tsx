import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  WeeklyStatistics,
  MonthlyStatistics,
  StatisticsPerformance,
  ChartDataPoint,
} from '../../types/statistics'
import { StatisticsCalculator } from '../../utils/statisticsCalculator'
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: {
    value: number
    trend: 'up' | 'down' | 'stable'
  }
  icon: React.ComponentType<{ className?: string }>
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red'
}

function StatCard({ title, value, subtitle, change, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  }

  const getTrendIcon = () => {
    if (!change) return null
    if (change.trend === 'up') return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
    if (change.trend === 'down') return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
    return null
  }

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {change && (
            <div className="flex items-center mt-2 text-sm">
              {getTrendIcon()}
              <span
                className={`ml-1 ${
                  change.trend === 'up'
                    ? 'text-green-600'
                    : change.trend === 'down'
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              >
                {change.value > 0 ? '+' : ''}
                {change.value.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <Icon className="h-8 w-8" />
      </div>
    </div>
  )
}

interface DonutChartProps {
  data: ChartDataPoint[]
  title: string
  centerText?: string
}

function DonutChart({ data, title, centerText }: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  let cumulativePercentage = 0

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const strokeDasharray = `${percentage * 2.51} 251.2` // 2π * 40 = 251.2
              const strokeDashoffset = -cumulativePercentage * 2.51

              cumulativePercentage += percentage

              return (
                <circle
                  key={index}
                  cx="100"
                  cy="100"
                  r="40"
                  fill="transparent"
                  stroke={colors[index % colors.length]}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              )
            })}
          </svg>
          {centerText && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{centerText}</div>
                <div className="text-sm text-gray-500">총합</div>
              </div>
            </div>
          )}
        </div>
        <div className="ml-6 space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-600">
                {item.label}: <span className="font-medium">{item.value}</span>
                {total > 0 && (
                  <span className="text-gray-400 ml-1">
                    ({((item.value / total) * 100).toFixed(1)}%)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface PerformanceGaugeProps {
  title: string
  current: number
  target: number
  unit?: string
}

function PerformanceGauge({ title, current, target, unit = '' }: PerformanceGaugeProps) {
  const percentage = Math.min((current / target) * 100, 100)
  const isExcellent = percentage >= 105
  const isGood = percentage >= 95
  const color = isExcellent ? 'green' : isGood ? 'blue' : percentage >= 85 ? 'yellow' : 'red'

  const colorClasses = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">현재</span>
          <span className="font-medium">
            {current.toLocaleString()}
            {unit}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">목표</span>
          <span className="font-medium">
            {target.toLocaleString()}
            {unit}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              color === 'green'
                ? 'bg-green-500'
                : color === 'blue'
                  ? 'bg-blue-500'
                  : color === 'yellow'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className={`text-center py-2 rounded-md ${colorClasses[color]}`}>
          <span className="font-bold">{percentage.toFixed(1)}%</span>
          <span className="ml-1 text-sm">달성</span>
        </div>
      </div>
    </div>
  )
}

export default function StatisticsPage() {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStatistics | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatistics | null>(null)
  const [performance, setPerformance] = useState<StatisticsPerformance | null>(null)
  const [chartData, setChartData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const { teacher } = useAuth()

  useEffect(() => {
    if (teacher) {
      fetchDataAndCalculateStatistics()
    }
  }, [teacher])

  async function fetchDataAndCalculateStatistics() {
    try {
      setLoading(true)

      if (!teacher) {
        throw new Error('로그인 정보를 확인할 수 없습니다.')
      }

      // 실제 Supabase 데이터 조회
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
      
      const studentsData = (data as any) || []

      // 통계 계산
      const weeklyStatistics = StatisticsCalculator.calculateWeeklyStatistics(studentsData)
      const monthlyStatistics = StatisticsCalculator.calculateMonthlyStatistics(studentsData)

      // 성과 지표 계산 (목표값은 임시 설정)
      const performanceMetrics = StatisticsCalculator.calculatePerformanceMetrics(
        studentsData,
        { students: 30, revenue: 3000000, attendance: 90 }
      )

      // 차트 데이터 생성
      const charts = StatisticsCalculator.generateChartData(studentsData)

      setWeeklyStats(weeklyStatistics)
      setMonthlyStats(monthlyStatistics)
      setPerformance(performanceMetrics)
      setChartData(charts)
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-8">로딩 중...</div>
  if (error)
    return (
      <div className="text-red-500 p-4 rounded-md bg-red-50 mb-4">
        <p className="font-bold">오류 발생</p>
        <p>{error}</p>
      </div>
    )

  const currentStats = viewMode === 'week' ? weeklyStats : monthlyStats
  if (!currentStats || !performance || !chartData) return null

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">학생 수 통계</h1>
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              주간
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              월간
            </button>
          </div>
          <button className="btn-primary">통계 설정</button>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="전체 학생 수"
          value={currentStats.actual_students}
          subtitle={`가중 카운트: ${currentStats.weighted_count}`}
          icon={UserGroupIcon}
          color="blue"
        />
        <StatCard
          title="1:1 수업"
          value={currentStats.one_on_one_students}
          subtitle={`카운트: ${currentStats.one_on_one_count} (2배)`}
          icon={AcademicCapIcon}
          color="green"
        />
        <StatCard
          title="그룹 수업"
          value={currentStats.group_students}
          subtitle={`카운트: ${currentStats.group_count}`}
          icon={UserGroupIcon}
          color="yellow"
        />
        <StatCard
          title={viewMode === 'week' ? '주간 수입' : '월간 수입'}
          value={`₩${('weekly_revenue' in currentStats ? currentStats.weekly_revenue : currentStats.total_revenue).toLocaleString()}`}
          subtitle="예상 수입"
          icon={CurrencyDollarIcon}
          color="purple"
        />
      </div>

      {/* 성과 지표 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PerformanceGauge
          title="학생 수 목표 달성률"
          current={performance.student_actual}
          target={performance.student_target}
          unit="명"
        />
        <PerformanceGauge
          title="수입 목표 달성률"
          current={performance.revenue_actual}
          target={performance.revenue_target}
          unit="원"
        />
        <PerformanceGauge
          title="출석률 목표 달성률"
          current={performance.attendance_actual}
          target={performance.attendance_target}
          unit="%"
        />
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <DonutChart
          title="수업 유형별 분포"
          data={chartData.classTypeDistribution}
          centerText={currentStats.actual_students.toString()}
        />
        <DonutChart
          title="결제 방식별 분포"
          data={chartData.paymentTypeDistribution}
          centerText={currentStats.actual_students.toString()}
        />
        <DonutChart
          title="로보틱스 참여 현황"
          data={chartData.roboticsParticipation}
          centerText={currentStats.actual_students.toString()}
        />
      </div>

      {/* 상세 통계 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">상세 통계</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">학생 통계</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">실제 학생 수:</span>
                  <span className="font-medium">{currentStats.actual_students}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">가중 카운트:</span>
                  <span className="font-medium">{currentStats.weighted_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">로보틱스 참여:</span>
                  <span className="font-medium">{currentStats.robotics_participants}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">로보틱스 미참여:</span>
                  <span className="font-medium">{currentStats.robotics_non_participants}명</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">결제 통계</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">월납 학생:</span>
                  <span className="font-medium">{currentStats.monthly_payment_students}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">분기납 학생:</span>
                  <span className="font-medium">{currentStats.quarterly_payment_students}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">학생당 평균 수입:</span>
                  <span className="font-medium">
                    ₩{performance.revenue_per_student.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">수업 통계</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">예정 수업:</span>
                  <span className="font-medium">{currentStats.total_classes_scheduled}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">완료 수업:</span>
                  <span className="font-medium">{currentStats.total_classes_completed}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">보강 수업:</span>
                  <span className="font-medium">{currentStats.total_classes_makeup}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">출석률:</span>
                  <span className="font-medium">
                    {'attendance_rate' in currentStats
                      ? `${currentStats.attendance_rate}%`
                      : `${currentStats.average_attendance_rate}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
